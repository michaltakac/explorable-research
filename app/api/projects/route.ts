import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import { ExecutionResult } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log('[API] GET /api/projects - handler started')
  try {
    let supabase, authContext
    try {
      const result = createSupabaseFromRequest(request)
      supabase = result.supabase
      authContext = result.authContext
    } catch (e) {
      console.error('[API] GET /api/projects - Failed to create Supabase client:', e)
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    if (authContext.mode === 'none') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await verifyUser(supabase, authContext)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, created_at, result')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load projects:', error)
      return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 })
    }

    console.log('[API] GET /api/projects - success, returning', data?.length ?? 0, 'projects')
    return NextResponse.json({ projects: data ?? [] })
  } catch (err) {
    console.error('[API] GET /api/projects - Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type CreateProjectPayload = {
  fragment: FragmentSchema
  result: ExecutionResult
  messages?: Message[]
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let supabase, authContext
    try {
      const result = createSupabaseFromRequest(request)
      supabase = result.supabase
      authContext = result.authContext
    } catch (e) {
      console.error('Failed to create Supabase client:', e)
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    if (authContext.mode === 'none') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await verifyUser(supabase, authContext)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as CreateProjectPayload

    if (!body?.fragment || !body?.result) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
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
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to save project:', error)
      return NextResponse.json({ error: 'Failed to save project' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error in POST /api/projects:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
