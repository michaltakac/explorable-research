import { createSupabaseServerClient, getAccessToken } from '@/lib/supabase-server'
import { uploadPdfToStorage, MAX_PDF_SIZE, formatFileSize } from '@/lib/pdf-storage'
import { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: NextRequest) {
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
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${formatFileSize(MAX_PDF_SIZE)}` },
        { status: 413 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()

    const result = await uploadPdfToStorage(supabase, userData.user.id, {
      data: new Uint8Array(arrayBuffer),
      filename: file.name,
      mimeType: file.type,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      storagePath: result.storagePath,
      filename: result.filename,
      size: result.size,
    })
  } catch (error) {
    console.error('PDF upload error:', error)
    return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
  }
}
