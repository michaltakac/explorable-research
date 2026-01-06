import { describe, it, expect } from 'vitest'
import { extractArxivId } from '../arxiv'

describe('ArXiv Utilities', () => {
  describe('extractArxivId', () => {
    it('should extract ID from modern arXiv abs URL', () => {
      expect(extractArxivId('https://arxiv.org/abs/2301.00001')).toBe('2301.00001')
      expect(extractArxivId('https://arxiv.org/abs/2301.00001v1')).toBe('2301.00001v1')
      expect(extractArxivId('https://arxiv.org/abs/2301.00001v2')).toBe('2301.00001v2')
    })

    it('should extract ID from modern arXiv pdf URL', () => {
      expect(extractArxivId('https://arxiv.org/pdf/2301.00001.pdf')).toBe('2301.00001')
      expect(extractArxivId('https://arxiv.org/pdf/2301.00001')).toBe('2301.00001')
      expect(extractArxivId('https://arxiv.org/pdf/2301.00001v1.pdf')).toBe('2301.00001v1')
    })

    it('should extract ID from old-style arXiv abs URL', () => {
      expect(extractArxivId('https://arxiv.org/abs/hep-th/9901001')).toBe('hep-th/9901001')
      expect(extractArxivId('https://arxiv.org/abs/hep-th/9901001v1')).toBe('hep-th/9901001v1')
    })

    it('should extract ID from old-style arXiv pdf URL', () => {
      expect(extractArxivId('https://arxiv.org/pdf/hep-th/9901001.pdf')).toBe('hep-th/9901001')
      expect(extractArxivId('https://arxiv.org/pdf/hep-th/9901001')).toBe('hep-th/9901001')
    })

    it('should accept bare arXiv ID (modern format)', () => {
      expect(extractArxivId('2301.00001')).toBe('2301.00001')
      expect(extractArxivId('2301.00001v1')).toBe('2301.00001v1')
      expect(extractArxivId('2309.12345')).toBe('2309.12345')
      expect(extractArxivId('2309.12345v3')).toBe('2309.12345v3')
    })

    it('should accept bare arXiv ID (old format)', () => {
      expect(extractArxivId('hep-th/9901001')).toBe('hep-th/9901001')
      expect(extractArxivId('hep-th/9901001v1')).toBe('hep-th/9901001v1')
      expect(extractArxivId('cs/0001001')).toBe('cs/0001001')
    })

    it('should handle URLs with http instead of https', () => {
      expect(extractArxivId('http://arxiv.org/abs/2301.00001')).toBe('2301.00001')
      expect(extractArxivId('http://arxiv.org/pdf/2301.00001.pdf')).toBe('2301.00001')
    })

    it('should handle whitespace around input', () => {
      expect(extractArxivId('  2301.00001  ')).toBe('2301.00001')
      expect(extractArxivId('\n2301.00001\t')).toBe('2301.00001')
    })

    it('should return null for invalid URLs', () => {
      expect(extractArxivId('https://example.com/paper')).toBeNull()
      expect(extractArxivId('not-a-url')).toBeNull()
      expect(extractArxivId('')).toBeNull()
      expect(extractArxivId('   ')).toBeNull()
    })

    it('should return null for invalid arXiv ID formats', () => {
      expect(extractArxivId('23.00001')).toBeNull() // Too short year
      expect(extractArxivId('2301.1')).toBeNull() // Too short paper number
      expect(extractArxivId('230100001')).toBeNull() // Missing dot
    })

    it('should handle 5-digit paper numbers', () => {
      expect(extractArxivId('2301.12345')).toBe('2301.12345')
      expect(extractArxivId('https://arxiv.org/abs/2301.12345')).toBe('2301.12345')
    })
  })
})
