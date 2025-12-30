import { createSupabaseServerClient, getAccessToken } from '@/lib/supabase-server'
import { SupabaseClient } from '@supabase/supabase-js'

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
