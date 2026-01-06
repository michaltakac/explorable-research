import { SupabaseClient } from '@supabase/supabase-js'
import { uploadPdfToStorage, MAX_PDF_SIZE } from './pdf-storage'

// Legacy limit for base64 responses (avoids Vercel's 4.5MB function response limit)
const BASE64_MAX_PDF_SIZE = 3.3 * 1024 * 1024

export type ArxivPaperResult = {
  success: true
  arxivId: string
  title: string
  abstract: string
  pdf:
    | {
        storagePath: string
        mimeType: string
        size: number
        filename: string
      }
    | {
        data: string // base64
        mimeType: string
        size: number
        filename: string
      }
}

export type ArxivErrorResult = {
  success: false
  error: string
  errorCode?: 'INVALID_URL' | 'NOT_FOUND' | 'TOO_LARGE' | 'FETCH_FAILED' | 'STORAGE_FAILED'
}

/**
 * Extract ArXiv ID from various URL formats
 */
export function extractArxivId(input: string): string | null {
  // Clean up the input
  const trimmed = input.trim()

  // Already just an ID (e.g., "2301.00001" or "hep-th/9901001")
  if (
    /^\d{4}\.\d{4,5}(v\d+)?$/.test(trimmed) ||
    /^[a-z-]+\/\d{7}(v\d+)?$/i.test(trimmed)
  ) {
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

/**
 * Fetch ArXiv paper metadata (title and abstract) from the abstract page
 */
export async function fetchArxivMetadata(
  arxivId: string
): Promise<{ title: string; abstract: string }> {
  let title = `arXiv:${arxivId}`
  let abstract = ''

  try {
    const absUrl = `https://arxiv.org/abs/${arxivId}`
    const absResponse = await fetch(absUrl, {
      headers: {
        'User-Agent':
          'Explorable-Research/1.0 (https://github.com/michaltakac/explorable-research)',
      },
    })

    if (absResponse.ok) {
      const html = await absResponse.text()

      // Extract title
      const titleMatch = html.match(
        /<meta name="citation_title" content="([^"]+)"/
      )
      if (titleMatch) {
        title = titleMatch[1]
      }

      // Extract abstract
      const abstractMatch = html.match(
        /<blockquote class="abstract[^"]*">\s*<span class="descriptor">Abstract:<\/span>\s*([\s\S]*?)<\/blockquote>/i
      )
      if (abstractMatch) {
        abstract = abstractMatch[1]
          .trim()
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
      }
    }
  } catch {
    // Metadata fetch failed, continue with defaults
    console.warn('Failed to fetch ArXiv metadata')
  }

  return { title, abstract }
}

/**
 * Fetch ArXiv PDF by ID
 */
export async function fetchArxivPdf(
  arxivId: string
): Promise<{ data: ArrayBuffer; filename: string } | null> {
  const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`

  const response = await fetch(pdfUrl, {
    headers: {
      'User-Agent':
        'Explorable-Research/1.0 (https://github.com/michaltakac/explorable-research)',
    },
  })

  if (!response.ok) {
    return null
  }

  const data = await response.arrayBuffer()
  const filename = `${arxivId.replace('/', '-')}.pdf`

  return { data, filename }
}

/**
 * Process ArXiv URL/ID and return paper data with PDF
 * For authenticated users, uploads PDF to Supabase Storage.
 * For unauthenticated users (or storage fallback), returns base64.
 */
export async function processArxivPaper(
  urlOrId: string,
  options?: {
    userId?: string
    supabase?: SupabaseClient
  }
): Promise<ArxivPaperResult | ArxivErrorResult> {
  const arxivId = extractArxivId(urlOrId)

  if (!arxivId) {
    return {
      success: false,
      error: 'Invalid ArXiv URL or ID format',
      errorCode: 'INVALID_URL',
    }
  }

  // Fetch the PDF
  const pdfResult = await fetchArxivPdf(arxivId)

  if (!pdfResult) {
    return {
      success: false,
      error: 'ArXiv paper not found. Please check the ID or URL.',
      errorCode: 'NOT_FOUND',
    }
  }

  const { data: pdfBuffer, filename } = pdfResult

  // Determine max size based on authentication status
  const canUseStorage = options?.userId && options?.supabase
  const maxSize = canUseStorage ? MAX_PDF_SIZE : BASE64_MAX_PDF_SIZE
  const sizeInMB = pdfBuffer.byteLength / (1024 * 1024)

  if (pdfBuffer.byteLength > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
    return {
      success: false,
      error: `PDF is too large (${sizeInMB.toFixed(1)}MB). Maximum size is ${maxSizeMB}MB.`,
      errorCode: 'TOO_LARGE',
    }
  }

  // Fetch metadata
  const { title, abstract } = await fetchArxivMetadata(arxivId)

  // If authenticated, try to upload to Supabase Storage
  if (canUseStorage && options.userId && options.supabase) {
    const uploadResult = await uploadPdfToStorage(
      options.supabase,
      options.userId,
      {
        data: new Uint8Array(pdfBuffer),
        filename,
        mimeType: 'application/pdf',
      }
    )

    if (uploadResult.success) {
      return {
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
      }
    }

    // Storage upload failed - only fall back to base64 for small PDFs
    if (pdfBuffer.byteLength > BASE64_MAX_PDF_SIZE) {
      console.error('Storage upload failed for large PDF:', uploadResult.error)
      return {
        success: false,
        error:
          'Failed to store PDF. Please try again or contact support if the issue persists.',
        errorCode: 'STORAGE_FAILED',
      }
    }

    console.warn(
      'Storage upload failed, falling back to base64:',
      uploadResult.error
    )
  }

  // Return base64 for unauthenticated users or storage fallback
  const base64 = Buffer.from(pdfBuffer).toString('base64')

  return {
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
  }
}
