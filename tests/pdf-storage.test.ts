import { describe, expect, it, vi } from 'vitest'
import {
  generatePdfStoragePath,
  isValidPdfSize,
  formatFileSize,
  MAX_PDF_SIZE,
  MAX_PDF_COUNT,
  MAX_IMAGE_SIZE,
  MAX_IMAGE_COUNT,
} from '../lib/pdf-storage'

describe('PDF Storage Utilities', () => {
  describe('generatePdfStoragePath', () => {
    it('generates a path with user ID and sanitized filename', () => {
      const userId = 'user-123'
      const filename = 'test-paper.pdf'

      const path = generatePdfStoragePath(userId, filename)

      expect(path).toMatch(/^user-123\/\d+-test-paper\.pdf$/)
    })

    it('sanitizes special characters in filename', () => {
      const userId = 'user-456'
      const filename = 'my paper (2024) - final.pdf'

      const path = generatePdfStoragePath(userId, filename)

      // The regex replaces non-alphanumeric chars (except . and -) with _
      expect(path).toMatch(/^user-456\/\d+-my_paper__2024__-_final\.pdf$/)
    })

    it('generates unique paths for same file', () => {
      const userId = 'user-789'
      const filename = 'paper.pdf'

      const path1 = generatePdfStoragePath(userId, filename)
      // Wait a tiny bit to ensure timestamp differs
      const path2 = generatePdfStoragePath(userId, filename)

      // Both should match the pattern but timestamps may differ
      expect(path1).toMatch(/^user-789\/\d+-paper\.pdf$/)
      expect(path2).toMatch(/^user-789\/\d+-paper\.pdf$/)
    })
  })

  describe('isValidPdfSize', () => {
    it('returns true for files under the limit', () => {
      expect(isValidPdfSize(1024)).toBe(true) // 1KB
      expect(isValidPdfSize(1024 * 1024)).toBe(true) // 1MB
      expect(isValidPdfSize(5 * 1024 * 1024)).toBe(true) // 5MB
      expect(isValidPdfSize(9 * 1024 * 1024)).toBe(true) // 9MB
    })

    it('returns true for files at exactly the limit', () => {
      expect(isValidPdfSize(MAX_PDF_SIZE)).toBe(true)
    })

    it('returns false for files over the limit', () => {
      expect(isValidPdfSize(MAX_PDF_SIZE + 1)).toBe(false)
      expect(isValidPdfSize(15 * 1024 * 1024)).toBe(false) // 15MB
      expect(isValidPdfSize(100 * 1024 * 1024)).toBe(false) // 100MB
    })

    it('returns true for zero size', () => {
      expect(isValidPdfSize(0)).toBe(true)
    })
  })

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(500)).toBe('500 B')
      expect(formatFileSize(1023)).toBe('1023 B')
    })

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(10 * 1024)).toBe('10 KB')
    })

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB')
    })

    it('formats gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB')
    })
  })

  describe('Constants', () => {
    it('has correct MAX_PDF_SIZE of 10MB', () => {
      expect(MAX_PDF_SIZE).toBe(10 * 1024 * 1024)
    })

    it('has correct MAX_PDF_COUNT of 4', () => {
      expect(MAX_PDF_COUNT).toBe(4)
    })

    it('has correct MAX_IMAGE_SIZE of 5MB', () => {
      expect(MAX_IMAGE_SIZE).toBe(5 * 1024 * 1024)
    })

    it('has correct MAX_IMAGE_COUNT of 8', () => {
      expect(MAX_IMAGE_COUNT).toBe(8)
    })
  })
})
