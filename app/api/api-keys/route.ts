import { createSupabaseServerClient, getAccessToken } from '@/lib/supabase-server'
import { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const accessToken = getAccessToken(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let supabase: SupabaseClient
    try {
      supabase = createSupabaseServerClient(accessToken)
    } catch (e) {
      console.error('Failed to create Supabase client:', e)
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use the public function to list API keys
    const { data, error } = await supabase.rpc('list_my_api_keys')

    if (error) {
      console.error('Failed to fetch API keys:', error)
      return NextResponse.json({ error: 'Failed to load API keys' }, { status: 500 })
    }

    return NextResponse.json({ keys: data ?? [] })
  } catch (err) {
    console.error('Unexpected error in GET /api/api-keys:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type CreateApiKeyPayload = {
  description: string
  scope?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const accessToken = getAccessToken(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let supabase: SupabaseClient
    try {
      supabase = createSupabaseServerClient(accessToken)
    } catch (e) {
      console.error('Failed to create Supabase client:', e)
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as CreateApiKeyPayload
    if (!body?.description || typeof body.description !== 'string') {
      return NextResponse.json({ error: 'Invalid payload: description is required' }, { status: 400 })
    }

    // Validate description
    if (body.description.length > 255) {
      return NextResponse.json({ error: 'Description must be 255 characters or less' }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9_ \-]*$/.test(body.description)) {
      return NextResponse.json({ error: 'Description can only contain letters, numbers, spaces, underscores, and hyphens' }, { status: 400 })
    }

    // Call the public wrapper for KeyHippo's create_api_key function
    const { data, error } = await supabase.rpc('create_api_key', {
      key_description: body.description,
      scope_name: body.scope ?? null,
    })

    if (error) {
      console.error('Failed to create API key:', error)
      return NextResponse.json({ error: error.message || 'Failed to create API key' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    return NextResponse.json(
      {
        api_key: data[0].api_key,
        api_key_id: data[0].api_key_id
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Unexpected error in POST /api/api-keys:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
