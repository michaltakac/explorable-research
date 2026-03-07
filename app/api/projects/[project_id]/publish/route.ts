import { createSupabaseFromRequest, verifyUser } from '@/lib/supabase-server'
import {
  uploadStaticFiles,
  deleteStaticFiles,
  generateSubdomainSlug,
  computeContentHash,
  StaticFile,
} from '@/lib/r2'
import { getTemplateId } from '@/lib/templates'
import { ExecutionResult } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'
import { NextRequest, NextResponse } from 'next/server'

// Files to publish for html-developer template
const STATIC_FILES = ['index.html', 'style.css', 'main.js']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> },
): Promise<NextResponse> {
  console.log('[API] POST /api/projects/[project_id]/publish - handler started')

  try {
    const { project_id } = await params
    let supabase, authContext

    try {
      const result = createSupabaseFromRequest(request)
      supabase = result.supabase
      authContext = result.authContext
    } catch (e) {
      console.error('[API] POST /publish - Failed to create Supabase client:', e)
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
      .select('id, title, fragment, result, is_static_deployed, subdomain_slug')
      .eq('id', project_id)
      .eq('user_id', user.userId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify template is html-developer
    const fragment = project.fragment as { template?: string } | null
    const templateId = getTemplateId(fragment?.template || '')
    if (templateId !== 'html-developer') {
      return NextResponse.json(
        { error: 'Publishing is only available for html-developer template' },
        { status: 400 },
      )
    }

    // Verify sandbox is running
    const result = project.result as ExecutionResult | null
    if (!result?.sbxId) {
      return NextResponse.json(
        { error: 'No active sandbox found. Please run the preview first.' },
        { status: 400 },
      )
    }

    // Connect to the sandbox and read the files
    let sbx: Sandbox
    try {
      sbx = await Sandbox.connect(result.sbxId)
    } catch (e) {
      console.error('[API] POST /publish - Failed to connect to sandbox:', e)
      return NextResponse.json(
        {
          error:
            'Failed to connect to sandbox. It may have expired. Please regenerate the preview.',
        },
        { status: 400 },
      )
    }

    // Read files from sandbox
    const files: StaticFile[] = []
    for (const fileName of STATIC_FILES) {
      try {
        const content = await sbx.files.read(fileName)
        files.push({ name: fileName, content })
      } catch (e) {
        console.error(`[API] POST /publish - Failed to read ${fileName}:`, e)
        // main.js might not exist, that's ok
        if (fileName !== 'main.js') {
          return NextResponse.json(
            { error: `Failed to read ${fileName} from sandbox` },
            { status: 500 },
          )
        }
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files found in sandbox to publish' },
        { status: 400 },
      )
    }

    // Generate subdomain slug from project title (or reuse existing)
    const title = project.title || 'Untitled Project'
    const subdomainSlug = project.subdomain_slug || generateSubdomainSlug(title)
    const publishedUrl = `https://${subdomainSlug}.explorableresearch.com`

    // Compute content hash for version tracking
    const contentHash = computeContentHash(files)

    // Upload files to R2
    try {
      await uploadStaticFiles(project_id, files)
    } catch (e) {
      console.error('[API] POST /publish - Failed to upload to R2:', e)
      return NextResponse.json(
        { error: 'Failed to upload files to storage' },
        { status: 500 },
      )
    }

    // Update database
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        subdomain_slug: subdomainSlug,
        published_url: publishedUrl,
        is_static_deployed: true,
        static_files: files.map((f) => f.name),
        published_content_hash: contentHash,
      })
      .eq('id', project_id)
      .eq('user_id', user.userId)

    if (updateError) {
      console.error('[API] POST /publish - Failed to update database:', updateError)
      // Try to clean up uploaded files
      try {
        await deleteStaticFiles(project_id)
      } catch {
        // Ignore cleanup errors
      }
      return NextResponse.json(
        { error: 'Failed to update project status' },
        { status: 500 },
      )
    }

    console.log(
      `[API] POST /publish - Successfully published ${project_id} to ${publishedUrl}`,
    )

    return NextResponse.json({
      published_url: publishedUrl,
      subdomain_slug: subdomainSlug,
      content_hash: contentHash,
    })
  } catch (err) {
    console.error('Unexpected error in POST /api/projects/[project_id]/publish:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> },
): Promise<NextResponse> {
  console.log('[API] DELETE /api/projects/[project_id]/publish - handler started')

  try {
    const { project_id } = await params
    let supabase, authContext

    try {
      const result = createSupabaseFromRequest(request)
      supabase = result.supabase
      authContext = result.authContext
    } catch (e) {
      console.error('[API] DELETE /publish - Failed to create Supabase client:', e)
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
      .select('id, is_static_deployed')
      .eq('id', project_id)
      .eq('user_id', user.userId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.is_static_deployed) {
      return NextResponse.json(
        { error: 'Project is not published' },
        { status: 400 },
      )
    }

    // Delete files from R2
    try {
      await deleteStaticFiles(project_id)
    } catch (e) {
      console.error('[API] DELETE /publish - Failed to delete from R2:', e)
      return NextResponse.json(
        { error: 'Failed to delete files from storage' },
        { status: 500 },
      )
    }

    // Update database
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        subdomain_slug: null,
        published_url: null,
        is_static_deployed: false,
        static_files: null,
        published_content_hash: null,
      })
      .eq('id', project_id)
      .eq('user_id', user.userId)

    if (updateError) {
      console.error('[API] DELETE /publish - Failed to update database:', updateError)
      return NextResponse.json(
        { error: 'Failed to update project status' },
        { status: 500 },
      )
    }

    console.log(`[API] DELETE /publish - Successfully unpublished ${project_id}`)

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error(
      'Unexpected error in DELETE /api/projects/[project_id]/publish:',
      err,
    )
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
