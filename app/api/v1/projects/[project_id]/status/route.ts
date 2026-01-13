import { NextRequest } from 'next/server'
import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import {
  createApiError,
  SyncProjectResponse,
  PROJECT_STATUSES,
  ProjectStatus,
} from '@/lib/api-v1-schemas'
import { createRateLimitResponse } from '@/lib/api-errors'
import { getPreviewUrl } from '@/lib/sandbox'
import ratelimit from '@/lib/ratelimit'
import { Duration } from '@/lib/duration'
import { ExecutionResult } from '@/lib/types'
import { FragmentSchema } from '@/lib/schema'

// Rate limiting configuration
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
  fragment: FragmentSchema | null
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

  // --- Fetch Project ---
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('id, title, description, status, result, fragment, created_at, updated_at')
    .eq('id', project_id)
    .eq('user_id', user.userId)
    .single()

  if (projectError || !projectData) {
    return createApiError('NOT_FOUND', 'Project not found', 404)
  }

  const project = projectData as ProjectData
  const status = project.status as ProjectStatus

  // Get preview URL if project is ready and has result
  let previewUrl = ''
  let sandboxId = ''
  if (status === PROJECT_STATUSES.READY && project.result) {
    previewUrl = getPreviewUrl(project.result) || ''
    sandboxId = project.result.sbxId || ''
  }

  // --- Build Response ---
  const response: SyncProjectResponse = {
    success: true,
    project: {
      id: project.id,
      status,
      title: project.title || 'Untitled Project',
      description: project.description,
      created_at: project.created_at,
      updated_at: project.updated_at || project.created_at,
      preview_url: previewUrl,
      sandbox_id: sandboxId,
      template: project.fragment?.template || '',
      code: project.fragment?.code,
    },
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
