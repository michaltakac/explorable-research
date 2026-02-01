import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import { computeContentHash, StaticFile } from '@/lib/r2'
import { getTemplateId } from '@/lib/templates'
import { ExecutionResult } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'
import { NextRequest, NextResponse } from 'next/server'

// Files to check for html-developer template
const STATIC_FILES = ['index.html', 'style.css', 'main.js']

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
      console.error('[API] GET /publish/status - Failed to create Supabase client:', e)
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

    // Fetch the project
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, fragment, result, is_static_deployed, published_content_hash')
      .eq('id', project_id)
      .eq('user_id', user.userId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // If not published, return not applicable
    if (!project.is_static_deployed) {
      return NextResponse.json({
        is_published: false,
        is_outdated: false,
        current_hash: null,
        published_hash: null,
      })
    }

    // Verify template is html-developer
    const fragment = project.fragment as { template?: string } | null
    const templateId = getTemplateId(fragment?.template || '')
    if (templateId !== 'html-developer') {
      return NextResponse.json({
        is_published: true,
        is_outdated: false,
        error: 'Version tracking only available for html-developer template',
      })
    }

    // Get sandbox ID from result
    const result = project.result as ExecutionResult | null
    if (!result?.sbxId) {
      return NextResponse.json({
        is_published: true,
        is_outdated: null, // Can't determine - no sandbox
        published_hash: project.published_content_hash,
        error: 'No active sandbox to compare',
      })
    }

    // Try to connect to sandbox and read files
    let sbx: Sandbox
    try {
      sbx = await Sandbox.connect(result.sbxId)
    } catch (e) {
      return NextResponse.json({
        is_published: true,
        is_outdated: null, // Can't determine - sandbox expired
        published_hash: project.published_content_hash,
        error: 'Sandbox expired or unavailable',
      })
    }

    // Read files from sandbox
    const files: StaticFile[] = []
    for (const fileName of STATIC_FILES) {
      try {
        const content = await sbx.files.read(fileName)
        files.push({ name: fileName, content })
      } catch {
        // main.js might not exist
        if (fileName !== 'main.js') {
          return NextResponse.json({
            is_published: true,
            is_outdated: null,
            error: `Failed to read ${fileName} from sandbox`,
          })
        }
      }
    }

    // Compute current content hash
    const currentHash = computeContentHash(files)
    const publishedHash = project.published_content_hash

    return NextResponse.json({
      is_published: true,
      is_outdated: currentHash !== publishedHash,
      current_hash: currentHash,
      published_hash: publishedHash,
    })
  } catch (err) {
    console.error('Unexpected error in GET /publish/status:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
