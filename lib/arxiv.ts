import { SupabaseClient } from '@supabase/supabase-js'
import { uploadPdfToStorage, MAX_PDF_SIZE } from './pdf-storage'

// Legacy limit for base64 responses (avoids Vercel's 4.5MB function response limit)
const BASE64_MAX_PDF_SIZE = 3.3 * 1024 * 1024

// Limits for HTML image extraction
const MAX_HTML_IMAGES = 8
const MAX_HTML_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB per image

const ARXIV_USER_AGENT =
  'Explorable-Research/1.0 (https://github.com/michaltakac/explorable-research)'

export type ArxivImage = {
  data: string // base64
  mimeType: string
}

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
  htmlImages?: ArxivImage[]
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
    // https://arxiv.org/html/2301.00001 or https://arxiv.org/html/2301.00001v1
    /arxiv\.org\/html\/(\d{4}\.\d{4,5}(?:v\d+)?)/i,
    // Old format: https://arxiv.org/abs/hep-th/9901001
    /arxiv\.org\/abs\/([a-z-]+\/\d{7}(?:v\d+)?)/i,
    /arxiv\.org\/pdf\/([a-z-]+\/\d{7}(?:v\d+)?)(?:\.pdf)?/i,
    /arxiv\.org\/html\/([a-z-]+\/\d{7}(?:v\d+)?)/i,
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
 * Check if the input is an ArXiv HTML URL
 */
export function isArxivHtmlUrl(input: string): boolean {
  return /arxiv\.org\/html\//i.test(input.trim())
}

/**
 * Normalize a title for comparison: lowercase, remove punctuation, collapse whitespace
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if two titles are similar enough to be the same paper.
 * Returns true if they share at least 3 consecutive words.
 */
function titlesMatch(title1: string, title2: string): boolean {
  const norm1 = normalizeTitle(title1)
  const norm2 = normalizeTitle(title2)

  if (norm1 === norm2) return true

  const words1 = norm1.split(' ')
  const words2Set = new Set(norm2.split(' '))

  // Check if at least 3 consecutive words from title1 appear in title2
  for (let i = 0; i <= words1.length - 3; i++) {
    if (
      words2Set.has(words1[i]) &&
      words2Set.has(words1[i + 1]) &&
      words2Set.has(words1[i + 2])
    ) {
      return true
    }
  }

  return false
}

/**
 * Resolve a potentially relative image URL to an absolute URL
 */
function resolveImageUrl(src: string, arxivId: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src
  }
  if (src.startsWith('/')) {
    return `https://arxiv.org${src}`
  }
  return `https://arxiv.org/html/${arxivId}/${src}`
}

/**
 * Infer MIME type from URL path
 */
function inferMimeType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0]
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
    default:
      return 'image/png'
  }
}

/**
 * Fetch and parse the ArXiv HTML page to extract figure images.
 * Validates the page contains a real paper by checking for a title.
 * Returns extracted image URLs and the page title, or null if the page is invalid.
 */
export async function fetchArxivHtmlContent(
  arxivId: string,
  expectedTitle?: string
): Promise<{
  isValid: boolean
  title: string
  imageUrls: Array<{ url: string; alt: string }>
} | null> {
  try {
    const htmlUrl = `https://arxiv.org/html/${arxivId}`
    const response = await fetch(htmlUrl, {
      headers: { 'User-Agent': ARXIV_USER_AGENT },
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()

    // Check for paper title via citation meta tag first, then <title>
    const citationTitleMatch = html.match(
      /<meta\s+name=["']citation_title["']\s+content=["']([^"']+)["']/i
    )
    const pageTitleMatch = html.match(/<title>([^<]+)<\/title>/i)

    const pageTitle = citationTitleMatch?.[1] || pageTitleMatch?.[1] || ''

    // Validate: must have a title and it shouldn't be an error page
    if (
      !pageTitle ||
      /error|not found|page not found|unavailable/i.test(pageTitle)
    ) {
      return { isValid: false, title: '', imageUrls: [] }
    }

    // If we have an expected title from the abs page, verify they match
    if (expectedTitle && expectedTitle !== `arXiv:${arxivId}`) {
      if (!titlesMatch(pageTitle, expectedTitle)) {
        console.warn(
          `ArXiv HTML title mismatch: "${pageTitle}" vs expected "${expectedTitle}"`
        )
        return { isValid: false, title: pageTitle, imageUrls: [] }
      }
    }

    // Extract images from <figure> elements (paper figures/diagrams)
    const imageUrls: Array<{ url: string; alt: string }> = []
    const seenUrls = new Set<string>()

    // Match <figure> blocks and extract <img> tags within them
    const figureRegex =
      /<figure[^>]*>([\s\S]*?)<\/figure>/gi
    let figureMatch
    while ((figureMatch = figureRegex.exec(html)) !== null) {
      const figureContent = figureMatch[1]
      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*/gi
      let imgMatch
      while ((imgMatch = imgRegex.exec(figureContent)) !== null) {
        const src = imgMatch[1]
        // Skip data URIs and tiny inline images
        if (src.startsWith('data:')) continue
        const absoluteUrl = resolveImageUrl(src, arxivId)
        if (seenUrls.has(absoluteUrl)) continue
        seenUrls.add(absoluteUrl)

        // Extract alt text
        const altMatch = imgMatch[0].match(/alt=["']([^"']*?)["']/)
        const alt = altMatch ? altMatch[1] : ''

        imageUrls.push({ url: absoluteUrl, alt })
        if (imageUrls.length >= MAX_HTML_IMAGES) break
      }
      if (imageUrls.length >= MAX_HTML_IMAGES) break
    }

    // If no figures found, try standalone img tags with paper-content-like paths
    if (imageUrls.length === 0) {
      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*/gi
      let imgMatch
      while ((imgMatch = imgRegex.exec(html)) !== null) {
        const src = imgMatch[1]
        if (src.startsWith('data:')) continue
        // Only include images that look like paper content
        if (
          !/extracted|figure|fig|image|diagram|plot|chart/i.test(src)
        ) {
          continue
        }
        const absoluteUrl = resolveImageUrl(src, arxivId)
        if (seenUrls.has(absoluteUrl)) continue
        seenUrls.add(absoluteUrl)

        const altMatch = imgMatch[0].match(/alt=["']([^"']*?)["']/)
        const alt = altMatch ? altMatch[1] : ''

        imageUrls.push({ url: absoluteUrl, alt })
        if (imageUrls.length >= MAX_HTML_IMAGES) break
      }
    }

    return { isValid: true, title: pageTitle.trim(), imageUrls }
  } catch (err) {
    console.warn('Failed to fetch ArXiv HTML content:', err)
    return null
  }
}

/**
 * Download images from URLs and return as base64-encoded data.
 * Skips images that fail to download or exceed size limits.
 */
export async function downloadArxivImages(
  imageUrls: Array<{ url: string; alt: string }>
): Promise<ArxivImage[]> {
  const images: ArxivImage[] = []

  const downloads = imageUrls.slice(0, MAX_HTML_IMAGES).map(async ({ url }) => {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': ARXIV_USER_AGENT },
      })
      if (!response.ok) return null

      // Check content-length before downloading full body
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > MAX_HTML_IMAGE_SIZE) {
        return null
      }

      const buffer = await response.arrayBuffer()
      if (buffer.byteLength > MAX_HTML_IMAGE_SIZE || buffer.byteLength === 0) {
        return null
      }

      const contentType = response.headers.get('content-type')
      const mimeType =
        contentType && contentType.startsWith('image/')
          ? contentType.split(';')[0]
          : inferMimeType(url)

      return {
        data: Buffer.from(buffer).toString('base64'),
        mimeType,
      }
    } catch {
      return null
    }
  })

  const results = await Promise.all(downloads)
  for (const result of results) {
    if (result) images.push(result)
  }

  return images
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
      headers: { 'User-Agent': ARXIV_USER_AGENT },
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
    headers: { 'User-Agent': ARXIV_USER_AGENT },
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

  // Fetch metadata and optionally HTML content with images in parallel
  const fromHtmlUrl = isArxivHtmlUrl(urlOrId)
  const [metadata, htmlContent] = await Promise.all([
    fetchArxivMetadata(arxivId),
    fromHtmlUrl ? fetchArxivHtmlContent(arxivId) : Promise.resolve(null),
  ])

  const { title, abstract } = metadata

  // Determine valid HTML content for image extraction
  let htmlImages: ArxivImage[] | undefined

  if (fromHtmlUrl && htmlContent) {
    // If initial validation passed without title, use it directly
    // If it failed, retry with the abs page title for a more lenient match
    let validHtml = htmlContent.isValid ? htmlContent : null
    if (!validHtml) {
      validHtml = await fetchArxivHtmlContent(arxivId, title)
      if (!validHtml?.isValid) {
        console.warn(
          'ArXiv HTML page validation failed - HTML version may not be available for this paper'
        )
      }
    }

    if (validHtml?.isValid && validHtml.imageUrls.length > 0) {
      htmlImages = await downloadArxivImages(validHtml.imageUrls)
      if (htmlImages.length > 0) {
        console.log(
          `Extracted ${htmlImages.length} images from ArXiv HTML page`
        )
      }
    }
  }

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
        htmlImages,
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
    htmlImages,
  }
}
