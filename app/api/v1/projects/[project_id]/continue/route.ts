import { NextRequest } from 'next/server'
import { createSupabaseFromRequest, verifyUser, createSupabaseAdmin } from '@/lib/supabase-server'
import {
  continueProjectSchema,
  createApiError,
  getDefaultModel,
  getModelById,
  AsyncProjectResponse,
  PROJECT_STATUSES,
  ContinueProjectInput,
} from '@/lib/api-v1-schemas'
import { createRateLimitResponse } from '@/lib/api-errors'
import {
  generateFragment,
  appendContinuationMessage,
} from '@/lib/fragment-generator'
import {
  updateSandboxCode,
  createSandboxFromFragment,
  getPreviewUrl,
} from '@/lib/sandbox'
import { LLMModelConfig } from '@/lib/models'
import { Message, sanitizeMessagesForStorage, toAISDKMessages } from '@/lib/messages'
import templates, { getTemplateIdSuffix } from '@/lib/templates'
import ratelimit from '@/lib/ratelimit'
import { Duration } from '@/lib/duration'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { CoreMessage } from 'ai'

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
 * Wrapper for background processing that works both locally and on Vercel.
 * On Vercel, uses waitUntil to keep the function alive after response.
 * Locally, just fires the promise without waiting.
 */
function runInBackground(promise: Promise<void>): void {
  // Try to use Vercel's waitUntil if available
  try {
    // Dynamic import to avoid build errors locally
    const { waitUntil } = require('@vercel/functions')
    waitUntil(promise)
  } catch {
    // Locally, just fire and forget (the promise will run but we won't wait)
    promise.catch((error) => {
      console.error('Background processing error:', error)
    })
  }
}

type ProjectData = {
  id: string
  title: string
  description: string
  status: string
  fragment: FragmentSchema
  result: ExecutionResult
  messages: Message[]
  created_at: string
}

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
 * Background processing for project continuation
 */
async function processProjectContinuation(
  projectId: string,
  userId: string,
  project: ProjectData,
  input: ContinueProjectInput
) {
  const supabase = createSupabaseAdmin()

  try {
    // --- Build Continuation Messages ---
    // Convert stored messages to CoreMessage format
    const existingMessages = toAISDKMessages(project.messages || []) as CoreMessage[]

    const updatedMessages = appendContinuationMessage(existingMessages, {
      instruction: input.instruction,
      images: input.images,
      previousFragment: project.fragment,
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

    // --- Get Template from existing project ---
    const templateId = getTemplateIdSuffix(project.fragment.template)
    const template = { [templateId]: templates[templateId] } as typeof templates

    // --- Generate New Fragment ---
    await updateProjectStatus(projectId, PROJECT_STATUSES.GENERATING)

    const fragmentResult = await generateFragment(
      updatedMessages,
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

    const newFragment = fragmentResult.fragment

    // --- Update Existing Sandbox or Create New One ---
    await updateProjectStatus(projectId, PROJECT_STATUSES.CREATING_SANDBOX)

    let sandboxResult
    if (project.result?.sbxId) {
      sandboxResult = await updateSandboxCode(project.result.sbxId, newFragment, {
        userId,
      })
    } else {
      sandboxResult = await createSandboxFromFragment(newFragment, {
        userId,
      })
    }

    if (!sandboxResult.success) {
      await updateProjectStatus(projectId, PROJECT_STATUSES.FAILED, {
        error_message: sandboxResult.error,
      })
      return
    }

    const executionResult = sandboxResult.result
    const previewUrl = getPreviewUrl(executionResult)

    // --- Update Messages for Storage ---
    const storageMessages: Message[] = [
      ...(project.messages || []),
      {
        role: 'user' as const,
        content: [
          ...(input.images?.map(() => ({
            type: 'text' as const,
            text: '[Image uploaded]',
          })) || []),
          { type: 'text' as const, text: input.instruction },
        ],
      },
      {
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: newFragment.commentary || 'Updated interactive visualization.',
          },
        ],
        object: newFragment,
        result: executionResult,
      },
    ]

    const sanitizedMessages = sanitizeMessagesForStorage(storageMessages)

    // --- Update Project with all data and mark as ready ---
    await updateProjectStatus(projectId, PROJECT_STATUSES.READY, {
      title: newFragment.title || project.title,
      description: newFragment.description || project.description,
      fragment: newFragment,
      result: executionResult,
      messages: sanitizedMessages,
    })

    console.log(`Project ${projectId} continued successfully, preview: ${previewUrl}`)
  } catch (error) {
    console.error(`Failed to continue project ${projectId}:`, error)
    await updateProjectStatus(projectId, PROJECT_STATUSES.FAILED, {
      error_message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  const { project_id } = await params

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

  // --- Fetch Existing Project ---
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('id, title, description, status, fragment, result, messages, created_at')
    .eq('id', project_id)
    .eq('user_id', user.userId)
    .single()

  if (projectError || !projectData) {
    return createApiError('NOT_FOUND', 'Project not found', 404)
  }

  const project = projectData as ProjectData

  // Check if project is ready to be continued
  if (project.status !== PROJECT_STATUSES.READY) {
    return createApiError(
      'PROJECT_NOT_READY',
      `Project is not ready to continue. Current status: ${project.status}`,
      409 // Conflict
    )
  }

  // --- Parse and Validate Input ---
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return createApiError('INVALID_JSON', 'Invalid JSON in request body', 400)
  }

  const parseResult = continueProjectSchema.safeParse(body)
  if (!parseResult.success) {
    return createApiError(
      'VALIDATION_ERROR',
      'Invalid request parameters',
      400,
      parseResult.error.flatten()
    )
  }

  const input = parseResult.data

  // --- Update Project Status to Pending ---
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      status: PROJECT_STATUSES.PENDING,
      updated_at: new Date().toISOString(),
    })
    .eq('id', project_id)
    .eq('user_id', user.userId)

  if (updateError) {
    console.error('Failed to update project status:', updateError)
    return createApiError('DATABASE_ERROR', 'Failed to update project', 500)
  }

  // --- Start Background Processing ---
  runInBackground(processProjectContinuation(project_id, user.userId, project, input))

  // --- Return Immediately ---
  const response: AsyncProjectResponse = {
    success: true,
    project: {
      id: project_id,
      status: PROJECT_STATUSES.PENDING,
      created_at: project.created_at,
      updated_at: new Date().toISOString(),
    },
  }

  return new Response(JSON.stringify(response), {
    status: 202, // Accepted - processing asynchronously
    headers: { 'Content-Type': 'application/json' },
  })
}
