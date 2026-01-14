import { createSupabaseServerClient, getAccessToken } from '@/lib/supabase-server'
import { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = {
  params: Promise<{ key_id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { key_id } = await params
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

    const { data, error } = await supabase.rpc('get_api_key', { p_key_id: key_id })

    if (error) {
      console.error('Failed to fetch API key:', error)
      return NextResponse.json({ error: 'Failed to load API key' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    return NextResponse.json({ key: data[0] })
  } catch (err) {
    console.error('Unexpected error in GET /api/api-keys/[key_id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { key_id } = await params
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

    // Call the public wrapper for KeyHippo's revoke_api_key function
    const { data, error } = await supabase.rpc('revoke_api_key', {
      api_key_id: key_id,
    })

    if (error) {
      console.error('Failed to revoke API key:', error)
      return NextResponse.json({ error: error.message || 'Failed to revoke API key' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'API key not found or already revoked' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('Unexpected error in DELETE /api/api-keys/[key_id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { key_id } = await params
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

    // Parse action from query params
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'rotate') {
      // Call the public wrapper for KeyHippo's rotate_api_key function
      const { data, error } = await supabase.rpc('rotate_api_key', {
        old_api_key_id: key_id,
      })

      if (error) {
        console.error('Failed to rotate API key:', error)
        return NextResponse.json({ error: error.message || 'Failed to rotate API key' }, { status: 500 })
      }

      if (!data || data.length === 0) {
        return NextResponse.json({ error: 'API key not found or already revoked' }, { status: 404 })
      }

      return NextResponse.json({
        api_key: data[0].new_api_key,
        api_key_id: data[0].new_api_key_id,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Unexpected error in POST /api/api-keys/[key_id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
