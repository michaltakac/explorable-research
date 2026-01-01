import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, getAccessToken } from '@/lib/supabase-server'
import { uploadPdfToStorage, MAX_PDF_SIZE, formatFileSize } from '@/lib/pdf-storage'

export const maxDuration = 60

// Legacy limit for unauthenticated users (base64 in response body)
const LEGACY_MAX_PDF_SIZE = 3.3 * 1024 * 1024

// Extract ArXiv ID from various URL formats
function extractArxivId(input: string): string | null {
  // Clean up the input
  const trimmed = input.trim()

  // Already just an ID (e.g., "2301.00001" or "hep-th/9901001")
  if (/^\d{4}\.\d{4,5}(v\d+)?$/.test(trimmed) || /^[a-z-]+\/\d{7}(v\d+)?$/i.test(trimmed)) {
    return trimmed
  }

  // URL formats
  const patterns = [
    // https://arxiv.org/abs/2301.00001 or https://arxiv.org/abs/2301.00001v1
    /arxiv\.org\/abs\/(\d{4}\.\d{4,5}(?:v\d+)?)/i,
    // https://arxiv.org/pdf/2301.00001.pdf
    /arxiv\.org\/pdf\/(\d{4}\.\d{4,5}(?:v\d+)?)(?:\.pdf)?/i,
    // Old format: https://arxiv.org/abs/hep-th/9901001
    /arxiv\.org\/abs\/([a-z-]+\/\d{7}(?:v\d+)?)/i,
    /arxiv\.org\/pdf\/([a-z-]+\/\d{7}(?:v\d+)?)(?:\.pdf)?/i,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'ArXiv URL or ID is required' },
        { status: 400 }
      )
    }

    const arxivId = extractArxivId(url)

    if (!arxivId) {
      return NextResponse.json(
        { error: 'Invalid ArXiv URL or ID format' },
        { status: 400 }
      )
    }

    // Check if user is authenticated for storage upload
    const accessToken = getAccessToken(req)
    let supabase = null
    let userId: string | null = null

    if (accessToken) {
      try {
        supabase = createSupabaseServerClient(accessToken)
        const { data: userData } = await supabase.auth.getUser(accessToken)
        if (userData?.user) {
          userId = userData.user.id
        }
      } catch {
        // Supabase not configured or auth failed, continue without storage
      }
    }

    // Construct PDF URL
    const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`

    // Fetch the PDF
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Explorable-Research/1.0 (https://github.com/michaltakac/explorable-research)',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'ArXiv paper not found. Please check the ID or URL.' },
          { status: 404 }
        )
      }
      throw new Error(`Failed to fetch PDF: ${response.status}`)
    }

    const pdfBuffer = await response.arrayBuffer()
    const filename = `${arxivId.replace('/', '-')}.pdf`

    // Determine max size based on authentication status
    const maxSize = userId && supabase ? MAX_PDF_SIZE : LEGACY_MAX_PDF_SIZE
    const sizeInMB = pdfBuffer.byteLength / (1024 * 1024)

    if (pdfBuffer.byteLength > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
      return NextResponse.json(
        { error: `PDF is too large (${sizeInMB.toFixed(1)}MB). Maximum size is ${maxSizeMB}MB.` },
        { status: 413 }
      )
    }

    // Fetch metadata from the abstract page
    let title = `arXiv:${arxivId}`
    let abstract = ''

    try {
      const absUrl = `https://arxiv.org/abs/${arxivId}`
      const absResponse = await fetch(absUrl, {
        headers: {
          'User-Agent': 'Explorable-Research/1.0 (https://github.com/michaltakac/explorable-research)',
        },
      })

      if (absResponse.ok) {
        const html = await absResponse.text()

        // Extract title
        const titleMatch = html.match(/<meta name="citation_title" content="([^"]+)"/)
        if (titleMatch) {
          title = titleMatch[1]
        }

        // Extract abstract
        const abstractMatch = html.match(/<blockquote class="abstract[^"]*">\s*<span class="descriptor">Abstract:<\/span>\s*([\s\S]*?)<\/blockquote>/i)
        if (abstractMatch) {
          abstract = abstractMatch[1].trim().replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
        }
      }
    } catch {
      // Metadata fetch failed, continue with just the PDF
      console.warn('Failed to fetch ArXiv metadata')
    }

    // If authenticated, upload to Supabase Storage
    if (userId && supabase) {
      const uploadResult = await uploadPdfToStorage(supabase, userId, {
        data: new Uint8Array(pdfBuffer),
        filename,
        mimeType: 'application/pdf',
      })

      if (uploadResult.success) {
        return NextResponse.json({
          success: true,
          arxivId,
          title,
          abstract,
          pdf: {
            storagePath: uploadResult.storagePath,
            mimeType: 'application/pdf',
            size: pdfBuffer.byteLength,
            filename,
          },
        })
      }
      // If upload failed, fall back to base64
      console.warn('Storage upload failed, falling back to base64:', uploadResult.error)
    }

    // Return base64 for unauthenticated users or if storage upload failed
    const base64 = Buffer.from(pdfBuffer).toString('base64')

    return NextResponse.json({
      success: true,
      arxivId,
      title,
      abstract,
      pdf: {
        data: base64,
        mimeType: 'application/pdf',
        size: pdfBuffer.byteLength,
        filename,
      },
    })
  } catch (error) {
    console.error('ArXiv fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ArXiv paper. Please try again.' },
      { status: 500 }
    )
  }
}
