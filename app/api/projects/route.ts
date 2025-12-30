import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { createSupabaseServerClient, getAccessToken } from '@/lib/supabase-server'
import { ExecutionResult } from '@/lib/types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
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
    .select('id, title, description, created_at, result')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return new Response('Failed to load projects', { status: 500 })
  }

  return Response.json({ projects: data })
}

type CreateProjectPayload = {
  fragment: FragmentSchema
  result: ExecutionResult
  messages?: Message[]
}

export async function POST(request: Request) {
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

  const body = (await request.json()) as CreateProjectPayload

  if (!body?.fragment || !body?.result) {
    return new Response('Invalid payload', { status: 400 })
  }

  const { fragment, result, messages } = body

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userData.user.id,
      title: fragment.title ?? null,
      description: fragment.description ?? null,
      fragment,
      result,
      messages: messages ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return new Response('Failed to save project', { status: 500 })
  }

  return Response.json({ id: data.id }, { status: 201 })
}
