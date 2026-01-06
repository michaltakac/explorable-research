import { NextRequest } from 'next/server'
import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import {
  createProjectSchema,
  createApiError,
  getDefaultModel,
  getModelById,
  ApiProjectResponse,
} from '@/lib/api-v1-schemas'
import { processArxivPaper } from '@/lib/arxiv'
import {
  generateFragment,
  buildInitialMessages,
} from '@/lib/fragment-generator'
import { createSandboxFromFragment, getPreviewUrl } from '@/lib/sandbox'
import { LLMModelConfig } from '@/lib/models'
import { Message, sanitizeMessagesForStorage } from '@/lib/messages'
import { uploadPdfToStorage, isValidPdfSize } from '@/lib/pdf-storage'
import templates, { getTemplateIdSuffix } from '@/lib/templates'
import ratelimit from '@/lib/ratelimit'
import { Duration } from '@/lib/duration'

// Allow up to 5 minutes for this endpoint (fragment generation + sandbox creation)
export const maxDuration = 300

// Rate limiting configuration
const rateLimitMaxRequests = process.env.API_V1_RATE_LIMIT
  ? parseInt(process.env.API_V1_RATE_LIMIT)
  : 100
const ratelimitWindow = process.env.API_V1_RATE_LIMIT_WINDOW
  ? (process.env.API_V1_RATE_LIMIT_WINDOW as Duration)
  : '1d'

export async function POST(request: NextRequest) {
  // --- Authentication ---
  let supabase, authContext
  try {
    const result = createSupabaseFromRequest(request)
    supabase = result.supabase
    authContext = result.authContext
  } catch {
    return createApiError('SUPABASE_ERROR', 'Supabase is not configured', 500)
  }

  if (authContext.mode === 'none') {
    return createApiError('UNAUTHORIZED', 'API key is required', 401)
  }

  // Only allow API key authentication for v1 endpoints
  if (authContext.mode !== 'api_key') {
    return createApiError(
      'UNAUTHORIZED',
      'API key authentication is required for this endpoint',
      401
    )
  }

  const user = await verifyUser(supabase, authContext)
  if (!user) {
    return createApiError('UNAUTHORIZED', 'Invalid API key', 401)
  }

  // --- Rate Limiting ---
  const limit = await ratelimit(
    user.userId,
    rateLimitMaxRequests,
    ratelimitWindow
  )

  if (limit) {
    return createApiError(
      'RATE_LIMITED',
      `Rate limit exceeded. Resets at ${new Date(limit.reset).toISOString()}`,
      429,
      {
        limit: rateLimitMaxRequests,
        remaining: limit.remaining,
        reset: limit.reset,
      }
    )
  }

  // --- Parse and Validate Input ---
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return createApiError('INVALID_JSON', 'Invalid JSON in request body', 400)
  }

  const parseResult = createProjectSchema.safeParse(body)
  if (!parseResult.success) {
    return createApiError(
      'VALIDATION_ERROR',
      'Invalid request parameters',
      400,
      parseResult.error.flatten()
    )
  }

  const input = parseResult.data

  // --- Process PDF Source ---
  let pdfData: string | undefined
  let pdfStoragePath: string | undefined
  let pdfFilename: string | undefined
  let pdfMimeType = 'application/pdf'
  let arxivTitle: string | undefined
  let arxivAbstract: string | undefined

  if (input.arxiv_url) {
    // Process ArXiv URL
    const arxivResult = await processArxivPaper(input.arxiv_url, {
      userId: user.userId,
      supabase,
    })

    if (!arxivResult.success) {
      const statusCode =
        arxivResult.errorCode === 'NOT_FOUND'
          ? 404
          : arxivResult.errorCode === 'TOO_LARGE'
            ? 413
            : 422
      return createApiError('ARXIV_ERROR', arxivResult.error, statusCode)
    }

    arxivTitle = arxivResult.title
    arxivAbstract = arxivResult.abstract
    pdfFilename = arxivResult.pdf.filename

    if ('storagePath' in arxivResult.pdf) {
      pdfStoragePath = arxivResult.pdf.storagePath
    } else {
      pdfData = arxivResult.pdf.data
    }
  } else if (input.pdf_file && input.pdf_filename) {
    // Process uploaded PDF
    try {
      const pdfBuffer = Buffer.from(input.pdf_file, 'base64')

      if (!isValidPdfSize(pdfBuffer.length)) {
        return createApiError(
          'PDF_TOO_LARGE',
          'PDF file exceeds maximum size of 10MB',
          413
        )
      }

      // Upload to storage
      const uploadResult = await uploadPdfToStorage(supabase, user.userId, {
        data: new Uint8Array(pdfBuffer),
        filename: input.pdf_filename,
        mimeType: 'application/pdf',
      })

      if (uploadResult.success) {
        pdfStoragePath = uploadResult.storagePath
        pdfFilename = input.pdf_filename
      } else {
        // Fall back to base64 if storage fails
        pdfData = input.pdf_file
        pdfFilename = input.pdf_filename
      }
    } catch {
      return createApiError('INVALID_PDF', 'Invalid base64-encoded PDF', 400)
    }
  }

  // --- Build Messages ---
  const initialMessages = buildInitialMessages({
    pdfData,
    pdfStoragePath,
    pdfFilename,
    pdfMimeType,
    images: input.images,
    instruction: input.instruction,
    arxivTitle,
    arxivAbstract,
  })

  // --- Get Model Configuration ---
  const model = input.model ? getModelById(input.model) : getDefaultModel()
  if (!model) {
    return createApiError('INVALID_MODEL', 'Invalid model ID', 400)
  }

  const modelConfig: LLMModelConfig = {
    ...(input.model_config || {}),
  }

  // --- Get Template ---
  const templateId = getTemplateIdSuffix(input.template)
  const template = { [templateId]: templates[templateId] } as typeof templates

  // --- Generate Fragment ---
  const fragmentResult = await generateFragment(
    initialMessages,
    template,
    model,
    modelConfig,
    supabase
  )

  if (!fragmentResult.success) {
    return createApiError(
      'GENERATION_ERROR',
      fragmentResult.error,
      500,
      fragmentResult.errorCode
    )
  }

  const fragment = fragmentResult.fragment

  // --- Create Sandbox ---
  const sandboxResult = await createSandboxFromFragment(fragment, {
    userId: user.userId,
  })

  if (!sandboxResult.success) {
    return createApiError(
      'SANDBOX_ERROR',
      sandboxResult.error,
      500,
      sandboxResult.errorCode
    )
  }

  const executionResult = sandboxResult.result
  const previewUrl = getPreviewUrl(executionResult)

  // --- Save Project to Database ---
  // Convert initial messages to Message type for storage
  const storageMessages: Message[] = initialMessages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: (msg.content as Array<{ type: string; text?: string }>).map(
      (c) => {
        if (c.type === 'text' && c.text) {
          return { type: 'text' as const, text: c.text }
        }
        if (c.type === 'storage-file') {
          return c as unknown as Message['content'][0]
        }
        if (c.type === 'file') {
          return { type: 'text' as const, text: '[File uploaded]' }
        }
        if (c.type === 'image') {
          return { type: 'text' as const, text: '[Image uploaded]' }
        }
        return { type: 'text' as const, text: '' }
      }
    ),
    object: fragment,
    result: executionResult,
  }))

  // Add assistant response message
  storageMessages.push({
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: fragment.commentary || 'Generated interactive visualization.',
      },
    ],
    object: fragment,
    result: executionResult,
  })

  const sanitizedMessages = sanitizeMessagesForStorage(storageMessages)

  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.userId,
      title: fragment.title || arxivTitle || 'Untitled Project',
      description:
        fragment.description || arxivAbstract?.substring(0, 200) || null,
      fragment,
      result: executionResult,
      messages: sanitizedMessages,
    })
    .select('id, created_at')
    .single()

  if (projectError || !projectData) {
    console.error('Failed to save project:', projectError)
    return createApiError('DATABASE_ERROR', 'Failed to save project', 500)
  }

  // --- Build Response ---
  const response: ApiProjectResponse = {
    success: true,
    project: {
      id: projectData.id,
      title: fragment.title || arxivTitle || 'Untitled Project',
      description:
        fragment.description || arxivAbstract?.substring(0, 200) || '',
      created_at: projectData.created_at,
      preview_url: previewUrl || '',
      sandbox_id: executionResult.sbxId,
      template: fragment.template,
    },
  }

  // Include optional fields based on flags
  if (input.include_code) {
    response.project.code = fragment.code
    response.project.fragment = fragment as unknown as Record<string, unknown>
  }

  if (input.include_messages) {
    response.project.messages = sanitizedMessages.map((m) => ({
      role: m.role,
      content: m.content.map((c) => ({
        type: c.type,
        text: 'text' in c ? c.text : undefined,
      })),
    }))
  }

  return new Response(JSON.stringify(response), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
