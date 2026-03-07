import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult, ExecutionResultWeb } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'
import { NextRequest, NextResponse } from 'next/server'

const sandboxTimeout = 10 * 60 * 1000 // 10 minutes

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> },
): Promise<NextResponse> {
  console.log('[API] POST /api/projects/[project_id]/sandbox - regenerate sandbox')

  try {
    const { project_id } = await params
    let supabase, authContext

    try {
      const result = createSupabaseFromRequest(request)
      supabase = result.supabase
      authContext = result.authContext
    } catch (e) {
      console.error('[API] POST /sandbox - Failed to create Supabase client:', e)
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 },
      )
    }

    if (authContext.mode === 'none') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await verifyUser(supabase, authContext)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the project with fragment data
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, fragment, result')
      .eq('id', project_id)
      .eq('user_id', user.userId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const fragment = project.fragment as FragmentSchema | null
    if (!fragment) {
      return NextResponse.json(
        { error: 'No fragment data found for this project' },
        { status: 400 },
      )
    }

    // Create a new sandbox
    console.log(`[API] POST /sandbox - Creating new sandbox for project ${project_id}`)

    let sbx: Sandbox
    try {
      sbx = await Sandbox.create(fragment.template, {
        metadata: {
          template: fragment.template,
          userID: user.userId,
        },
        timeoutMs: sandboxTimeout,
      })
    } catch (e) {
      console.error('[API] POST /sandbox - Failed to create sandbox:', e)
      return NextResponse.json(
        { error: 'Failed to create sandbox' },
        { status: 500 },
      )
    }

    // Install dependencies if needed
    if (fragment.has_additional_dependencies && fragment.install_dependencies_command) {
      try {
        await sbx.commands.run(fragment.install_dependencies_command)
      } catch (e) {
        console.error('[API] POST /sandbox - Failed to install dependencies:', e)
        // Continue anyway - might work without some dependencies
      }
    }

    // Write the stored code to the new sandbox
    try {
      if (fragment.code && Array.isArray(fragment.code)) {
        for (const file of fragment.code as Array<{ file_path: string; file_content: string }>) {
          await sbx.files.write(file.file_path, file.file_content)
        }
      } else if (fragment.code && fragment.file_path) {
        await sbx.files.write(fragment.file_path, fragment.code)
      }
    } catch (e) {
      console.error('[API] POST /sandbox - Failed to write code:', e)
      return NextResponse.json(
        { error: 'Failed to write code to sandbox' },
        { status: 500 },
      )
    }

    // Build the new result
    const newResult: ExecutionResultWeb = {
      sbxId: sbx.sandboxId,
      template: fragment.template,
      url: `https://${sbx.getHost(fragment.port || 80)}`,
    }

    // Update the project with the new sandbox info
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        result: newResult,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project_id)
      .eq('user_id', user.userId)

    if (updateError) {
      console.error('[API] POST /sandbox - Failed to update project:', updateError)
      // Don't fail the request - sandbox is created, just couldn't save
    }

    console.log(`[API] POST /sandbox - Successfully created sandbox ${sbx.sandboxId} for project ${project_id}`)

    return NextResponse.json({
      result: newResult,
      message: 'Sandbox regenerated successfully',
    })
  } catch (err) {
    console.error('Unexpected error in POST /api/projects/[project_id]/sandbox:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
