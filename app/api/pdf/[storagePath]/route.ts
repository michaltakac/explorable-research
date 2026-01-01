import { createSupabaseServerClient, getAccessToken } from '@/lib/supabase-server'
import { downloadPdfFromStorage } from '@/lib/pdf-storage'
import { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function GET(
  request: NextRequest,
  { params }: { params: { storagePath: string } }
) {
  const accessToken = getAccessToken(request)
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let supabase: SupabaseClient
  try {
    supabase = createSupabaseServerClient(accessToken)
  } catch {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Decode the storage path (it's URL encoded)
    const storagePath = decodeURIComponent(params.storagePath)

    // Security check: ensure user can only access their own files
    if (!storagePath.startsWith(`${userData.user.id}/`)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await downloadPdfFromStorage(supabase, storagePath)

    if (!result) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: result.data,
      mimeType: result.mimeType,
    })
  } catch (error) {
    console.error('PDF download error:', error)
    return NextResponse.json({ error: 'Failed to download PDF' }, { status: 500 })
  }
}
