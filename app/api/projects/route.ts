import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import { ExecutionResult } from '@/lib/types'

export async function GET(request: Request) {
  let supabase, authContext
  try {
    const result = createSupabaseFromRequest(request)
    supabase = result.supabase
    authContext = result.authContext
  } catch {
    return new Response('Supabase is not configured', { status: 500 })
  }

  if (authContext.mode === 'none') {
    return new Response('Unauthorized', { status: 401 })
  }

  const user = await verifyUser(supabase, authContext)
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, created_at, status, result')
    .eq('user_id', user.userId)
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
  let supabase, authContext
  try {
    const result = createSupabaseFromRequest(request)
    supabase = result.supabase
    authContext = result.authContext
  } catch {
    return new Response('Supabase is not configured', { status: 500 })
  }

  if (authContext.mode === 'none') {
    return new Response('Unauthorized', { status: 401 })
  }

  const user = await verifyUser(supabase, authContext)
  if (!user) {
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
      user_id: user.userId,
      title: fragment.title ?? null,
      description: fragment.description ?? null,
      fragment,
      result,
      messages: messages ?? null,
      status: 'ready', // Already has result, so it's ready
    })
    .select('id')
    .single()

  if (error) {
    return new Response('Failed to save project', { status: 500 })
  }

  return Response.json({ id: data.id }, { status: 201 })
}
