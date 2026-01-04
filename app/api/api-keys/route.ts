import { createSupabaseServerClient, getAccessToken } from '@/lib/supabase-server'
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

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !userData?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Use the public function to list API keys
  const { data, error } = await supabase.rpc('list_my_api_keys')

  if (error) {
    console.error('Failed to fetch API keys:', error)
    return new Response('Failed to load API keys', { status: 500 })
  }

  return Response.json({ keys: data })
}

type CreateApiKeyPayload = {
  description: string
  scope?: string
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

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !userData?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = (await request.json()) as CreateApiKeyPayload
  if (!body?.description || typeof body.description !== 'string') {
    return new Response('Invalid payload: description is required', { status: 400 })
  }

  // Validate description
  if (body.description.length > 255) {
    return new Response('Description must be 255 characters or less', { status: 400 })
  }

  if (!/^[a-zA-Z0-9_ \-]*$/.test(body.description)) {
    return new Response('Description can only contain letters, numbers, spaces, underscores, and hyphens', { status: 400 })
  }

  // Call the public wrapper for KeyHippo's create_api_key function
  const { data, error } = await supabase.rpc('create_api_key', {
    key_description: body.description,
    scope_name: body.scope ?? null,
  })

  if (error) {
    console.error('Failed to create API key:', error)
    return new Response(error.message || 'Failed to create API key', { status: 500 })
  }

  if (!data || data.length === 0) {
    return new Response('Failed to create API key', { status: 500 })
  }

  return Response.json(
    { 
      api_key: data[0].api_key, 
      api_key_id: data[0].api_key_id 
    },
    { status: 201 }
  )
}
