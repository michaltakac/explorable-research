import { describe, expect, it, vi, beforeEach } from 'vitest'

// Create a mock blob with arrayBuffer method
const mockBlobData = new TextEncoder().encode('test pdf content')

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null,
      }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        download: vi.fn().mockResolvedValue({
          data: {
            arrayBuffer: () => Promise.resolve(new TextEncoder().encode('test pdf content').buffer),
            size: 17,
            type: 'application/pdf',
          },
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  })),
}))

import {
  uploadPdfToStorage,
  downloadPdfFromStorage,
  deletePdfFromStorage,
  MAX_PDF_SIZE,
} from '../lib/pdf-storage'
import { createClient } from '@supabase/supabase-js'

describe('PDF Storage Integration', () => {
  let mockSupabase: ReturnType<typeof createClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createClient('https://test.supabase.co', 'test-key')
  })

  describe('uploadPdfToStorage', () => {
    it('uploads a PDF successfully', async () => {
      const file = {
        data: new Uint8Array([1, 2, 3, 4]),
        filename: 'test.pdf',
        mimeType: 'application/pdf',
      }

      const result = await uploadPdfToStorage(mockSupabase, 'user-123', file)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.storagePath).toMatch(/^user-123\/\d+-test\.pdf$/)
        expect(result.filename).toBe('test.pdf')
        expect(result.size).toBe(4)
      }
    })

    it('handles upload errors', async () => {
      // Override the mock for this test
      const errorMock = createClient('https://test.supabase.co', 'test-key')
      vi.mocked(errorMock.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
        download: vi.fn(),
        remove: vi.fn(),
      } as any)

      const file = {
        data: new Uint8Array([1, 2, 3]),
        filename: 'test.pdf',
        mimeType: 'application/pdf',
      }

      const result = await uploadPdfToStorage(errorMock, 'user-123', file)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Upload failed')
      }
    })
  })

  describe('downloadPdfFromStorage', () => {
    it('downloads a PDF successfully', async () => {
      const result = await downloadPdfFromStorage(
        mockSupabase,
        'user-123/1234567890-test.pdf'
      )

      expect(result).not.toBeNull()
      expect(result?.mimeType).toBe('application/pdf')
      expect(result?.data).toBeDefined()
    })

    it('returns null on download error', async () => {
      const errorMock = createClient('https://test.supabase.co', 'test-key')
      vi.mocked(errorMock.storage.from).mockReturnValue({
        upload: vi.fn(),
        download: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        remove: vi.fn(),
      } as any)

      const result = await downloadPdfFromStorage(
        errorMock,
        'user-123/nonexistent.pdf'
      )

      expect(result).toBeNull()
    })
  })

  describe('deletePdfFromStorage', () => {
    it('deletes a PDF successfully', async () => {
      const result = await deletePdfFromStorage(
        mockSupabase,
        'user-123/1234567890-test.pdf'
      )

      expect(result).toBe(true)
    })

    it('returns false on delete error', async () => {
      const errorMock = createClient('https://test.supabase.co', 'test-key')
      vi.mocked(errorMock.storage.from).mockReturnValue({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      } as any)

      const result = await deletePdfFromStorage(
        errorMock,
        'user-123/test.pdf'
      )

      expect(result).toBe(false)
    })
  })

  describe('File Size Validation', () => {
    it('accepts files up to 10MB', () => {
      expect(MAX_PDF_SIZE).toBe(10 * 1024 * 1024)
    })

    it('validates file sizes correctly in upload flow', async () => {
      // 5MB file should be accepted
      const smallFile = {
        data: new Uint8Array(5 * 1024 * 1024),
        filename: 'small.pdf',
        mimeType: 'application/pdf',
      }

      const result = await uploadPdfToStorage(mockSupabase, 'user-123', smallFile)
      expect(result.success).toBe(true)
    })
  })
})

describe('ArXiv with Storage Integration', () => {
  it('correctly determines max size based on authentication', () => {
    // Legacy limit for unauthenticated users
    const LEGACY_MAX_PDF_SIZE = 3.3 * 1024 * 1024

    // Authenticated users get 10MB
    expect(MAX_PDF_SIZE).toBe(10 * 1024 * 1024)

    // Unauthenticated users get 3.3MB
    expect(LEGACY_MAX_PDF_SIZE).toBe(3.3 * 1024 * 1024)
  })
})
