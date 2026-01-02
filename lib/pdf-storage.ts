import { SupabaseClient } from '@supabase/supabase-js'

const PDF_BUCKET = 'pdfs'
export const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB for free users
export const MAX_PDF_COUNT = 4
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_IMAGE_COUNT = 8

export type StoredPdf = {
  storagePath: string
  filename: string
  size: number
  mimeType: string
}

export type PdfUploadResult = {
  success: true
  storagePath: string
  filename: string
  size: number
} | {
  success: false
  error: string
}

/**
 * Generate a unique storage path for a PDF file
 */
export function generatePdfStoragePath(userId: string, filename: string): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${userId}/${timestamp}-${sanitizedFilename}`
}

/**
 * Upload a PDF to Supabase Storage
 */
export async function uploadPdfToStorage(
  supabase: SupabaseClient,
  userId: string,
  file: {
    data: ArrayBuffer | Uint8Array
    filename: string
    mimeType: string
  }
): Promise<PdfUploadResult> {
  const storagePath = generatePdfStoragePath(userId, file.filename)

  const { error } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(storagePath, file.data, {
      contentType: file.mimeType,
      upsert: false,
    })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    storagePath,
    filename: file.filename,
    size: file.data.byteLength,
  }
}

/**
 * Download a PDF from Supabase Storage and return as base64
 */
export async function downloadPdfFromStorage(
  supabase: SupabaseClient,
  storagePath: string
): Promise<{ data: string; mimeType: string } | null> {
  const { data, error } = await supabase.storage
    .from(PDF_BUCKET)
    .download(storagePath)

  if (error || !data) {
    console.error('Failed to download PDF from storage:', error)
    return null
  }

  const buffer = await data.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  return {
    data: base64,
    mimeType: 'application/pdf',
  }
}

/**
 * Delete a PDF from Supabase Storage
 */
export async function deletePdfFromStorage(
  supabase: SupabaseClient,
  storagePath: string
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(PDF_BUCKET)
    .remove([storagePath])

  if (error) {
    console.error('Failed to delete PDF from storage:', error)
    return false
  }

  return true
}

/**
 * Check if a file size is within the allowed limit
 */
export function isValidPdfSize(size: number): boolean {
  return size <= MAX_PDF_SIZE
}

/**
 * Format bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
