import { NextRequest } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createSupabaseFromRequest, verifyUser, createSupabaseAdmin } from '@/lib/supabase-server'
import {
  createProjectSchema,
  createApiError,
  getDefaultModel,
  getModelById,
  AsyncProjectResponse,
  PROJECT_STATUSES,
  CreateProjectInput,
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

// Allow up to 5 minutes for background processing
export const maxDuration = 300

// Rate limiting configuration - uses same env vars as other endpoints
const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

/**
 * Update project status in database
 */
async function updateProjectStatus(
  projectId: string,
  status: string,
  updates?: Record<string, unknown>
) {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('projects')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...updates,
    })
    .eq('id', projectId)

  if (error) {
    console.error(`Failed to update project ${projectId} status:`, error)
  }
}

/**
 * Background processing for project creation
 */
async function processProjectCreation(
  projectId: string,
  userId: string,
  input: CreateProjectInput
) {
  const supabase = createSupabaseAdmin()

  try {
    // --- Process PDF Source ---
    await updateProjectStatus(projectId, PROJECT_STATUSES.PROCESSING_PDF)

    let pdfData: string | undefined
    let pdfStoragePath: string | undefined
    let pdfFilename: string | undefined
    const pdfMimeType = 'application/pdf'
    let arxivTitle: string | undefined
    let arxivAbstract: string | undefined

    if (input.arxiv_url) {
      // Process ArXiv URL
      const arxivResult = await processArxivPaper(input.arxiv_url, {
        userId,
        supabase,
      })

      if (!arxivResult.success) {
        await updateProjectStatus(projectId, PROJECT_STATUSES.FAILED, {
          error_message: arxivResult.error,
        })
        return
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
          await updateProjectStatus(projectId, PROJECT_STATUSES.FAILED, {
            error_message: 'PDF file exceeds maximum size of 10MB',
          })
          return
        }

        // Upload to storage
        const uploadResult = await uploadPdfToStorage(supabase, userId, {
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
        await updateProjectStatus(projectId, PROJECT_STATUSES.FAILED, {
          error_message: 'Invalid base64-encoded PDF',
        })
        return
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
      await updateProjectStatus(projectId, PROJECT_STATUSES.FAILED, {
        error_message: 'Invalid model ID',
      })
      return
    }

    const modelConfig: LLMModelConfig = {
      ...(input.model_config || {}),
    }

    // --- Get Template ---
    const templateId = getTemplateIdSuffix(input.template)
    const template = { [templateId]: templates[templateId] } as typeof templates

    // --- Generate Fragment ---
    await updateProjectStatus(projectId, PROJECT_STATUSES.GENERATING)

    const fragmentResult = await generateFragment(
      initialMessages,
      template,
      model,
      modelConfig,
      supabase
    )

    if (!fragmentResult.success) {
      await updateProjectStatus(projectId, PROJECT_STATUSES.FAILED, {
        error_message: fragmentResult.error,
      })
      return
    }

    const fragment = fragmentResult.fragment

    // --- Create Sandbox ---
    await updateProjectStatus(projectId, PROJECT_STATUSES.CREATING_SANDBOX)

    const sandboxResult = await createSandboxFromFragment(fragment, {
      userId,
    })

    if (!sandboxResult.success) {
      await updateProjectStatus(projectId, PROJECT_STATUSES.FAILED, {
        error_message: sandboxResult.error,
      })
      return
    }

    const executionResult = sandboxResult.result
    const previewUrl = getPreviewUrl(executionResult)

    // --- Save Project Data ---
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

    // Update project with all data and mark as ready
    await updateProjectStatus(projectId, PROJECT_STATUSES.READY, {
      title: fragment.title || arxivTitle || 'Untitled Project',
      description: fragment.description || arxivAbstract?.substring(0, 200) || null,
      fragment,
      result: executionResult,
      messages: sanitizedMessages,
    })

    console.log(`Project ${projectId} created successfully, preview: ${previewUrl}`)
  } catch (error) {
    console.error(`Failed to process project ${projectId}:`, error)
    await updateProjectStatus(projectId, PROJECT_STATUSES.FAILED, {
      error_message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

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

  // --- Create Project with Pending Status ---
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.userId,
      title: 'Processing...',
      status: PROJECT_STATUSES.PENDING,
    })
    .select('id, created_at, status')
    .single()

  if (projectError || !projectData) {
    console.error('Failed to create project:', projectError)
    return createApiError('DATABASE_ERROR', 'Failed to create project', 500)
  }

  // --- Start Background Processing ---
  waitUntil(processProjectCreation(projectData.id, user.userId, input))

  // --- Return Immediately ---
  const response: AsyncProjectResponse = {
    success: true,
    project: {
      id: projectData.id,
      status: projectData.status,
      created_at: projectData.created_at,
    },
  }

  return new Response(JSON.stringify(response), {
    status: 202, // Accepted - processing asynchronously
    headers: { 'Content-Type': 'application/json' },
  })
}
