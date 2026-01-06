import { NextRequest } from 'next/server'
import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import {
  createApiError,
  ProjectStatusResponse,
  PROJECT_STATUSES,
  ProjectStatus,
} from '@/lib/api-v1-schemas'
import { createRateLimitResponse } from '@/lib/api-errors'
import { getPreviewUrl } from '@/lib/sandbox'
import ratelimit from '@/lib/ratelimit'
import { Duration } from '@/lib/duration'
import { ExecutionResult } from '@/lib/types'

// Rate limiting configuration - uses same env vars as other endpoints
const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

type ProjectData = {
  id: string
  title: string | null
  description: string | null
  status: string
  result: ExecutionResult | null
  error_message: string | null
  created_at: string
  updated_at: string | null
}

export async function GET(
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

  // --- Fetch Project Status ---
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('id, title, description, status, result, error_message, created_at, updated_at')
    .eq('id', project_id)
    .eq('user_id', user.userId)
    .single()

  if (projectError || !projectData) {
    return createApiError('NOT_FOUND', 'Project not found', 404)
  }

  const project = projectData as ProjectData

  // Get preview URL if project is ready and has result
  let previewUrl: string | undefined
  let sandboxId: string | undefined
  if (project.status === PROJECT_STATUSES.READY && project.result) {
    previewUrl = getPreviewUrl(project.result) || undefined
    sandboxId = project.result.sbxId
  }

  // --- Build Response ---
  const response: ProjectStatusResponse = {
    success: true,
    project: {
      id: project.id,
      status: project.status as ProjectStatus,
      created_at: project.created_at,
      updated_at: project.updated_at || undefined,
      ...(project.title && { title: project.title }),
      ...(project.description && { description: project.description }),
      ...(previewUrl && { preview_url: previewUrl }),
      ...(sandboxId && { sandbox_id: sandboxId }),
      ...(project.status === PROJECT_STATUSES.FAILED && project.error_message && {
        error_message: project.error_message,
      }),
    },
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
