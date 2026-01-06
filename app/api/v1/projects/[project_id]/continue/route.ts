import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import { FragmentSchema } from '@/lib/schema'
import { Message } from '@/lib/messages'
import { processProjectAsync } from '@/lib/project-processor'
import { ProjectStatus } from '@/lib/types'

export const maxDuration = 60

type ContinueProjectPayload = {
  fragment: FragmentSchema
  messages?: Message[]
}

type ContinueProjectResponse = {
  id: string
  status: ProjectStatus
}

/**
 * POST /api/v1/projects/:project_id/continue
 *
 * Continues an existing project with new fragment/code. Returns immediately with status.
 * The project processing (sandbox creation, code execution) happens in the background.
 * Use /api/v1/projects/:project_id/status to poll for completion.
 */
export async function POST(
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

  // Check if project exists and belongs to user
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('id, status')
    .eq('id', project_id)
    .eq('user_id', user.userId)
    .single()

  if (fetchError || !existingProject) {
    return Response.json(
      { error: 'Project not found' },
      { status: 404 }
    )
  }

  let body: ContinueProjectPayload
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

  const { fragment, messages } = body

  // Update project with new fragment and reset status
  const { data, error } = await supabase
    .from('projects')
    .update({
      title: fragment.title ?? null,
      description: fragment.description ?? null,
      fragment,
      messages: messages ?? null,
      status: 'created',
      result: null,
      error_message: null,
    })
    .eq('id', project_id)
    .eq('user_id', user.userId)
    .select('id, status')
    .single()

  if (error) {
    console.error('Failed to update project:', error)
    return Response.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }

  // Start async processing (don't await - let it run in background)
  processProjectAsync(supabase, {
    projectId: data.id,
    fragment,
    userID: user.userId,
  }).catch((err) => {
    console.error(`Background processing failed for project ${data.id}:`, err)
  })

  const response: ContinueProjectResponse = {
    id: data.id,
    status: data.status as ProjectStatus,
  }

  return Response.json(response)
}
