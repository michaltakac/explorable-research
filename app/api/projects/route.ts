import { createServerClient, requireAuth } from '@/lib/supabase-server'
import { Database } from '@/lib/database.types'
import { NextResponse } from 'next/server'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export async function POST(req: Request) {
  try {
    // Require authentication
    const user = await requireAuth()

    const projectData: ProjectInsert = await req.json()

    // Ensure user_id matches authenticated user (security check)
    if (projectData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: user_id mismatch' },
        { status: 403 },
      )
    }

    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 },
      )
    }

    // Insert project
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json(
        { error: 'Failed to create project', details: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in POST /api/projects:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  try {
    // Require authentication
    const user = await requireAuth()

    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 },
      )
    }

    // Get all projects for the authenticated user
    // RLS policies will automatically filter to only user's projects
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in GET /api/projects:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    )
  }
}
