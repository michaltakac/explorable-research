import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import { FragmentSchema } from '@/lib/schema'
import { processProjectAsync } from '@/lib/project-processor'
import { ProjectStatus } from '@/lib/types'

export const maxDuration = 60

type CreateProjectPayload = {
  fragment: FragmentSchema
}

type CreateProjectResponse = {
  id: string
  status: ProjectStatus
}

/**
 * POST /api/v1/projects/create
 *
 * Creates a new project asynchronously. Returns immediately with project ID and status.
 * The project processing (sandbox creation, code execution) happens in the background.
 * Use /api/v1/projects/:project_id/status to poll for completion.
 */
export async function POST(request: Request) {
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

  let body: CreateProjectPayload
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    )
  }

  if (!body?.fragment) {
    return Response.json(
      { error: 'Missing required field: fragment' },
      { status: 400 }
    )
  }

  const { fragment } = body

  // Create project record with initial status
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.userId,
      title: fragment.title ?? null,
      description: fragment.description ?? null,
      fragment,
      status: 'created',
    })
    .select('id, status')
    .single()

  if (error) {
    console.error('Failed to create project:', error)
    return Response.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }

  // Update status to generating_code (fragment is already provided, so we skip this)
  // Move directly to creating_sandbox

  // Start async processing (don't await - let it run in background)
  processProjectAsync(supabase, {
    projectId: data.id,
    fragment,
    userID: user.userId,
  }).catch((err) => {
    console.error(`Background processing failed for project ${data.id}:`, err)
  })

  const response: CreateProjectResponse = {
    id: data.id,
    status: data.status as ProjectStatus,
  }

  return Response.json(response, { status: 201 })
}
