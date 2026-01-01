import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

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
    const base64 = Buffer.from(pdfBuffer).toString('base64')

    // Check size (3.3MB limit for Vercel)
    const sizeInMB = pdfBuffer.byteLength / (1024 * 1024)
    if (sizeInMB > 3.3) {
      return NextResponse.json(
        { error: `PDF is too large (${sizeInMB.toFixed(1)}MB). Maximum size is 3.3MB.` },
        { status: 413 }
      )
    }

    // Also fetch metadata from the abstract page
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

    return NextResponse.json({
      success: true,
      arxivId,
      title,
      abstract,
      pdf: {
        data: base64,
        mimeType: 'application/pdf',
        size: pdfBuffer.byteLength,
        filename: `${arxivId.replace('/', '-')}.pdf`,
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
