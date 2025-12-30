import { createServerClient, requireAuth } from '@/lib/supabase-server'
import { Database } from '@/lib/database.types'
import { NextResponse } from 'next/server'

type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth()
    const supabaseClient = await createServerClient()

    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 },
      )
    }

    const resolvedParams = await params
    const projectId = resolvedParams.id

    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId as any)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 },
        )
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in GET /api/projects/[id]:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth()
    const updateData: ProjectUpdate = await req.json()

    const supabaseClient = await createServerClient()
    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 },
      )
    }

    const resolvedParams = await params
    const projectId = resolvedParams.id

    // Prevent user from changing ownership
    delete (updateData as any).user_id

    const { data, error } = await supabaseClient
      .from('projects')
      .update(updateData)
      .eq('id', projectId as any)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 },
        )
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in PATCH /api/projects/[id]:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth()
    const supabaseClient = await createServerClient()

    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 },
      )
    }

    const resolvedParams = await params
    const projectId = resolvedParams.id

    const { error } = await supabaseClient
      .from('projects')
      .delete()
      .eq('id', projectId as any)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 },
        )
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/projects/[id]:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    )
  }
}
