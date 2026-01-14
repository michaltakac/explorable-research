import { NextRequest } from 'next/server'
import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import {
  createProjectSchema,
  createApiError,
  getDefaultModel,
  getModelById,
  SyncProjectResponse,
  PROJECT_STATUSES,
} from '@/lib/api-v1-schemas'
import { createRateLimitResponse } from '@/lib/api-errors'
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
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from 'unique-names-generator'

/**
 * Generate a random project title using unique-names-generator
 */
function generateRandomTitle(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: ' ',
    style: 'capital',
    length: 3,
  })
}

// Allow up to 5 minutes for processing (AI generation can take time)
export const maxDuration = 300

// Rate limiting configuration
const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
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
    return createApiError('UNAUTHORIZED', 'Authentication required', 401)
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
    return createRateLimitResponse(limit)
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
  const pdfMimeType = 'application/pdf'
  let arxivTitle: string | undefined
  let arxivAbstract: string | undefined

  if (input.arxiv_url) {
    // Process ArXiv URL
    console.log(`Processing ArXiv URL: ${input.arxiv_url}`)

    const arxivResult = await processArxivPaper(input.arxiv_url, {
      userId: user.userId,
      supabase,
    })

    if (!arxivResult.success) {
      return createApiError(
        arxivResult.errorCode || 'ARXIV_ERROR',
        arxivResult.error,
        400
      )
    }

    arxivTitle = arxivResult.title
    arxivAbstract = arxivResult.abstract
    pdfFilename = arxivResult.pdf.filename

    console.log(`ArXiv paper found: "${arxivTitle}"`)

    if ('storagePath' in arxivResult.pdf) {
      pdfStoragePath = arxivResult.pdf.storagePath
      console.log(`PDF uploaded to storage: ${pdfStoragePath}`)
    } else {
      pdfData = arxivResult.pdf.data
      console.log(`PDF loaded (${(arxivResult.pdf.size / 1024).toFixed(1)} KB)`)
    }
  } else if (input.pdf_file && input.pdf_filename) {
    // Process uploaded PDF
    console.log(`Processing uploaded PDF: ${input.pdf_filename}`)

    try {
      const pdfBuffer = Buffer.from(input.pdf_file, 'base64')
      console.log(`PDF decoded, size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`)

      if (!isValidPdfSize(pdfBuffer.length)) {
        return createApiError(
          'PDF_TOO_LARGE',
          'PDF file exceeds maximum size of 10MB',
          400
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
        console.log(`PDF uploaded to storage: ${pdfStoragePath}`)
      } else {
        // Fall back to base64 if storage fails
        console.warn(`Storage upload failed, using base64 fallback: ${uploadResult.error}`)
        pdfData = input.pdf_file
        pdfFilename = input.pdf_filename
      }
    } catch (decodeError) {
      return createApiError(
        'INVALID_PDF',
        'Invalid base64-encoded PDF',
        400,
        { error: decodeError instanceof Error ? decodeError.message : 'Unknown decode error' }
      )
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

  console.log(`Built ${initialMessages.length} message(s) for AI`)

  // --- Get Model Configuration ---
  const model = input.model ? getModelById(input.model) : getDefaultModel()
  if (!model) {
    return createApiError('INVALID_MODEL', 'Invalid model ID', 400, { modelId: input.model })
  }

  console.log(`Using model: ${model.id}`)

  const modelConfig: LLMModelConfig = {
    ...(input.model_config || {}),
  }

  // --- Get Template ---
  const templateId = getTemplateIdSuffix(input.template)
  const template = { [templateId]: templates[templateId] } as typeof templates
  console.log(`Using template: ${templateId}`)

  // --- Generate Fragment ---
  console.log('Starting AI generation...')

  const fragmentResult = await generateFragment(
    initialMessages,
    template,
    model,
    modelConfig,
    supabase
  )

  if (!fragmentResult.success) {
    return createApiError(
      fragmentResult.errorCode || 'GENERATION_FAILED',
      fragmentResult.error,
      500
    )
  }

  const fragment = fragmentResult.fragment
  console.log(`Fragment generated: "${fragment.title}"`)

  // --- Create Sandbox ---
  console.log('Creating E2B sandbox...')

  const sandboxResult = await createSandboxFromFragment(fragment, {
    userId: user.userId,
  })

  if (!sandboxResult.success) {
    return createApiError(
      sandboxResult.errorCode || 'SANDBOX_FAILED',
      sandboxResult.error,
      500
    )
  }

  const executionResult = sandboxResult.result
  const previewUrl = getPreviewUrl(executionResult)

  console.log(`Sandbox created: ${executionResult.sbxId}`)
  console.log(`Preview URL: ${previewUrl}`)

  // --- Save Project Data ---
  // Generate initial title
  let initialTitle: string
  if (input.pdf_filename) {
    initialTitle = input.pdf_filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
  } else {
    initialTitle = generateRandomTitle()
  }

  // Use fragment title, arxiv title, or generated title
  const projectTitle = fragment.title || arxivTitle || initialTitle

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

  // Create project in database
  const now = new Date().toISOString()
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.userId,
      title: projectTitle,
      description: fragment.description || arxivAbstract?.substring(0, 200) || null,
      status: PROJECT_STATUSES.READY,
      fragment,
      result: executionResult,
      messages: sanitizedMessages,
      created_at: now,
      updated_at: now,
    })
    .select('id, created_at, updated_at')
    .single()

  if (projectError || !projectData) {
    console.error('Failed to create project:', projectError)
    return createApiError('DATABASE_ERROR', 'Failed to save project', 500)
  }

  console.log(`Project ${projectData.id} created successfully`)

  // --- Return Success Response ---
  const response: SyncProjectResponse = {
    success: true,
    project: {
      id: projectData.id,
      status: PROJECT_STATUSES.READY,
      title: projectTitle,
      description: fragment.description || arxivAbstract?.substring(0, 200) || null,
      created_at: projectData.created_at,
      updated_at: projectData.updated_at,
      preview_url: previewUrl || '',
      sandbox_id: executionResult.sbxId,
      template: fragment.template,
      code: fragment.code,
    },
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
