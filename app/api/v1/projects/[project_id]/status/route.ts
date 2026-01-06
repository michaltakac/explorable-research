import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import { ProjectStatusResponse } from '@/lib/types'

/**
 * GET /api/v1/projects/:project_id/status
 *
 * Returns the current status of a project in the creation pipeline.
 * Use this endpoint to poll for project completion after creating via /api/v1/projects/create
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ project_id: string }> }
) {
  const { project_id } = await params

  let supabase, authContext
  try {
    const result = createSupabaseFromRequest(request)
    supabase = result.supabase
    authContext = result.authContext
  } catch {
    return Response.json(
      { error: 'Supabase is not configured' },
      { status: 500 }
    )
  }

  if (authContext.mode === 'none') {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const user = await verifyUser(supabase, authContext)
  if (!user) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, status, error_message, updated_at')
    .eq('id', project_id)
    .eq('user_id', user.userId)
    .single()

  if (error || !data) {
    return Response.json(
      { error: 'Project not found' },
      { status: 404 }
    )
  }

  const response: ProjectStatusResponse = {
    id: data.id,
    status: data.status,
    error_message: data.error_message,
    updated_at: data.updated_at,
  }

  return Response.json(response)
}
