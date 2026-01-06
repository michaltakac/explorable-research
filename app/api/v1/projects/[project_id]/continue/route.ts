import { NextRequest } from 'next/server'
import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import {
  continueProjectSchema,
  createApiError,
  getDefaultModel,
  getModelById,
  ApiProjectResponse,
} from '@/lib/api-v1-schemas'
import {
  generateFragment,
  appendContinuationMessage,
} from '@/lib/fragment-generator'
import {
  createSandboxFromFragment,
  getPreviewUrl,
  killSandbox,
} from '@/lib/sandbox'
import { LLMModelConfig } from '@/lib/models'
import { Message, sanitizeMessagesForStorage, toAISDKMessages } from '@/lib/messages'
import templates, { getTemplateIdSuffix } from '@/lib/templates'
import ratelimit from '@/lib/ratelimit'
import { Duration } from '@/lib/duration'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { CoreMessage } from 'ai'

// Allow up to 5 minutes for this endpoint (fragment generation + sandbox creation)
export const maxDuration = 300

// Rate limiting configuration
const rateLimitMaxRequests = process.env.API_V1_RATE_LIMIT
  ? parseInt(process.env.API_V1_RATE_LIMIT)
  : 100
const ratelimitWindow = process.env.API_V1_RATE_LIMIT_WINDOW
  ? (process.env.API_V1_RATE_LIMIT_WINDOW as Duration)
  : '1d'

type ProjectData = {
  id: string
  title: string
  description: string
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

  // --- Fetch Existing Project ---
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('id, title, description, fragment, result, messages, created_at')
    .eq('id', project_id)
    .eq('user_id', user.userId)
    .single()

  if (projectError || !projectData) {
    return createApiError('NOT_FOUND', 'Project not found', 404)
  }

  const project = projectData as ProjectData

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
  // Convert stored messages to CoreMessage format
  const existingMessages = toAISDKMessages(project.messages || []) as CoreMessage[]

  const updatedMessages = appendContinuationMessage(existingMessages, {
    instruction: input.instruction,
    images: input.images,
    previousFragment: project.fragment,
  })

  // --- Get Model Configuration ---
  const model = input.model
    ? getModelById(input.model)
    : getDefaultModel()
  if (!model) {
    return createApiError('INVALID_MODEL', 'Invalid model ID', 400)
  }

  const modelConfig: LLMModelConfig = {
    ...(input.model_config || {}),
  }

  // --- Get Template from existing project ---
  const templateId = getTemplateIdSuffix(project.fragment.template)
  const template = { [templateId]: templates[templateId] } as typeof templates

  // --- Generate New Fragment ---
  const fragmentResult = await generateFragment(
    updatedMessages,
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

  const newFragment = fragmentResult.fragment

  // --- Kill Old Sandbox (if exists) ---
  if (project.result?.sbxId) {
    await killSandbox(project.result.sbxId)
  }

  // --- Create New Sandbox ---
  const sandboxResult = await createSandboxFromFragment(newFragment, {
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
          text:
            newFragment.commentary || 'Updated interactive visualization.',
        },
      ],
      object: newFragment,
      result: executionResult,
    },
  ]

  const sanitizedMessages = sanitizeMessagesForStorage(storageMessages)

  // --- Update Project in Database ---
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      title: newFragment.title || project.title,
      description: newFragment.description || project.description,
      fragment: newFragment,
      result: executionResult,
      messages: sanitizedMessages,
    })
    .eq('id', project_id)
    .eq('user_id', user.userId)

  if (updateError) {
    console.error('Failed to update project:', updateError)
    return createApiError('DATABASE_ERROR', 'Failed to update project', 500)
  }

  // --- Build Response ---
  const response: ApiProjectResponse = {
    success: true,
    project: {
      id: project_id,
      title: newFragment.title || project.title,
      description: newFragment.description || project.description,
      created_at: project.created_at,
      updated_at: new Date().toISOString(),
      preview_url: previewUrl || '',
      sandbox_id: executionResult.sbxId,
      template: newFragment.template,
    },
  }

  // Include optional fields based on flags
  if (input.include_code) {
    response.project.code = newFragment.code
    response.project.fragment = newFragment as unknown as Record<string, unknown>
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
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
