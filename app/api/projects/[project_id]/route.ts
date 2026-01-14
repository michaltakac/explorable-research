import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import { ExecutionResult } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> },
): Promise<NextResponse> {
  try {
    const { project_id } = await params
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

    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, created_at, status, updated_at, fragment, result, messages')
      .eq('id', project_id)
      .eq('user_id', user.userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project: data })
  } catch (err) {
    console.error('Unexpected error in GET /api/projects/[project_id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> },
): Promise<NextResponse> {
  try {
    const { project_id } = await params
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

    // First, get the project to retrieve the sandbox ID
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, result')
      .eq('id', project_id)
      .eq('user_id', user.userId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
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
      .eq('id', project_id)
      .eq('user_id', user.userId)

    if (deleteError) {
      console.error('Failed to delete project:', deleteError)
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('Unexpected error in DELETE /api/projects/[project_id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
