import { createSupabaseServerClient, getAccessToken } from '@/lib/supabase-server'
import { ExecutionResult } from '@/lib/types'
import { SupabaseClient } from '@supabase/supabase-js'
import { Sandbox } from '@e2b/code-interpreter'

export async function GET(
  request: Request,
  { params }: { params: { project_id: string } },
) {
  const accessToken = getAccessToken(request)
  if (!accessToken) {
    return new Response('Unauthorized', { status: 401 })
  }

  let supabase: SupabaseClient
  try {
    supabase = createSupabaseServerClient(accessToken)
  } catch {
    return new Response('Supabase is not configured', { status: 500 })
  }
  const { data: userData, error: userError } =
    await supabase.auth.getUser(accessToken)

  if (userError || !userData?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, created_at, fragment, result, messages')
    .eq('id', params.project_id)
    .eq('user_id', userData.user.id)
    .single()

  if (error || !data) {
    return new Response('Project not found', { status: 404 })
  }

  return Response.json({ project: data })
}

export async function DELETE(
  request: Request,
  { params }: { params: { project_id: string } },
) {
  const accessToken = getAccessToken(request)
  if (!accessToken) {
    return new Response('Unauthorized', { status: 401 })
  }

  let supabase: SupabaseClient
  try {
    supabase = createSupabaseServerClient(accessToken)
  } catch {
    return new Response('Supabase is not configured', { status: 500 })
  }

  const { data: userData, error: userError } =
    await supabase.auth.getUser(accessToken)

  if (userError || !userData?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // First, get the project to retrieve the sandbox ID
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('id, result')
    .eq('id', params.project_id)
    .eq('user_id', userData.user.id)
    .single()

  if (fetchError || !project) {
    return new Response('Project not found', { status: 404 })
  }

  // Try to kill the E2B sandbox if it exists
  const result = project.result as ExecutionResult | null
  if (result && 'sbxId' in result && result.sbxId) {
    try {
      await Sandbox.kill(result.sbxId)
    } catch (e) {
      // Sandbox might already be terminated or not exist, continue with deletion
      console.log(`Failed to kill sandbox ${result.sbxId}:`, e)
    }
  }

  // Delete the project from the database
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', params.project_id)
    .eq('user_id', userData.user.id)

  if (deleteError) {
    return new Response('Failed to delete project', { status: 500 })
  }

  return new Response(null, { status: 204 })
}
