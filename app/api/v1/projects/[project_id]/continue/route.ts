import { NextRequest } from 'next/server'
import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import {
  continueProjectSchema,
  createApiError,
  getDefaultModel,
  getModelById,
  SyncProjectResponse,
  PROJECT_STATUSES,
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

// Allow up to 5 minutes for processing (AI generation can take time)
export const maxDuration = 300

// Rate limiting configuration
const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

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

  // --- Build Continuation Messages ---
  console.log(`Continuing project ${project_id}...`)

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
    return createApiError('INVALID_MODEL', 'Invalid model ID', 400, { modelId: input.model })
  }

  console.log(`Using model: ${model.id}`)

  const modelConfig: LLMModelConfig = {
    ...(input.model_config || {}),
  }

  // --- Get Template from existing project ---
  // The fragment.template already contains the full template ID (with -dev suffix in dev mode)
  // So we use it directly, but also check if it exists in templates
  let templateId = project.fragment.template

  // If the template doesn't exist (e.g., fragment was created in different env),
  // try to find the correct one
  if (!templates[templateId]) {
    // Try without -dev suffix
    const baseId = templateId.replace(/-dev$/, '')
    templateId = getTemplateIdSuffix(baseId)
  }

  if (!templates[templateId]) {
    return createApiError(
      'TEMPLATE_NOT_FOUND',
      `Template "${project.fragment.template}" not found`,
      400
    )
  }

  const template = { [templateId]: templates[templateId] } as typeof templates
  console.log(`Using template: ${templateId}`)

  // --- Generate New Fragment ---
  console.log('Starting AI generation...')

  const fragmentResult = await generateFragment(
    updatedMessages,
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

  const newFragment = fragmentResult.fragment
  console.log(`Fragment generated: "${newFragment.title}"`)

  // --- Update Existing Sandbox or Create New One ---
  console.log('Updating sandbox...')

  let sandboxResult
  if (project.result?.sbxId) {
    sandboxResult = await updateSandboxCode(project.result.sbxId, newFragment, {
      userId: user.userId,
    })
  } else {
    sandboxResult = await createSandboxFromFragment(newFragment, {
      userId: user.userId,
    })
  }

  if (!sandboxResult.success) {
    return createApiError(
      sandboxResult.errorCode || 'SANDBOX_FAILED',
      sandboxResult.error,
      500
    )
  }

  const executionResult = sandboxResult.result
  const previewUrl = getPreviewUrl(executionResult)

  console.log(`Sandbox updated: ${executionResult.sbxId}`)
  console.log(`Preview URL: ${previewUrl}`)

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

  // --- Update Project in Database ---
  const now = new Date().toISOString()
  const newTitle = newFragment.title || project.title
  const newDescription = newFragment.description || project.description

  const { error: updateError } = await supabase
    .from('projects')
    .update({
      title: newTitle,
      description: newDescription,
      status: PROJECT_STATUSES.READY,
      fragment: newFragment,
      result: executionResult,
      messages: sanitizedMessages,
      updated_at: now,
    })
    .eq('id', project_id)
    .eq('user_id', user.userId)

  if (updateError) {
    console.error('Failed to update project:', updateError)
    return createApiError('DATABASE_ERROR', 'Failed to update project', 500)
  }

  console.log(`Project ${project_id} continued successfully`)

  // --- Return Success Response ---
  const response: SyncProjectResponse = {
    success: true,
    project: {
      id: project_id,
      status: PROJECT_STATUSES.READY,
      title: newTitle,
      description: newDescription,
      created_at: project.created_at,
      updated_at: now,
      preview_url: previewUrl || '',
      sandbox_id: executionResult.sbxId,
      template: newFragment.template,
      code: newFragment.code,
    },
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
