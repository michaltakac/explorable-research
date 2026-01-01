import { describe, expect, it } from 'vitest'
import {
  Message,
  MessageStorageFile,
  sanitizeMessagesForStorage,
  hasStorageFiles,
  getStorageFilePaths,
  toAISDKMessages,
} from '../lib/messages'
import { ExecutionResult } from '../lib/types'

const sampleResult: ExecutionResult = {
  sbxId: 'sbx_123',
  template: 'web',
  url: 'https://example.com',
}

const storageFile: MessageStorageFile = {
  type: 'storage-file',
  storagePath: 'user-123/1234567890-paper.pdf',
  mimeType: 'application/pdf',
  filename: 'paper.pdf',
  size: 1024 * 1024,
}

describe('Message Storage File Handling', () => {
  describe('hasStorageFiles', () => {
    it('returns true when messages contain storage files', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this paper' },
            storageFile,
          ],
        },
      ]

      expect(hasStorageFiles(messages)).toBe(true)
    })

    it('returns false when messages have no storage files', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Hello' },
            { type: 'image', image: 'data:image/png;base64,abc' },
          ],
        },
      ]

      expect(hasStorageFiles(messages)).toBe(false)
    })

    it('returns false for empty messages', () => {
      expect(hasStorageFiles([])).toBe(false)
    })

    it('handles mixed content correctly', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Hello' }],
        },
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hi there!' }],
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Check this' },
            storageFile,
          ],
        },
      ]

      expect(hasStorageFiles(messages)).toBe(true)
    })
  })

  describe('getStorageFilePaths', () => {
    it('extracts storage paths from messages', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this' },
            storageFile,
          ],
        },
      ]

      const paths = getStorageFilePaths(messages)

      expect(paths).toEqual(['user-123/1234567890-paper.pdf'])
    })

    it('extracts multiple storage paths', () => {
      const storageFile2: MessageStorageFile = {
        type: 'storage-file',
        storagePath: 'user-123/1234567891-paper2.pdf',
        mimeType: 'application/pdf',
        filename: 'paper2.pdf',
        size: 2 * 1024 * 1024,
      }

      const messages: Message[] = [
        {
          role: 'user',
          content: [storageFile, storageFile2],
        },
      ]

      const paths = getStorageFilePaths(messages)

      expect(paths).toHaveLength(2)
      expect(paths).toContain('user-123/1234567890-paper.pdf')
      expect(paths).toContain('user-123/1234567891-paper2.pdf')
    })

    it('returns empty array when no storage files', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Hello' }],
        },
      ]

      expect(getStorageFilePaths(messages)).toEqual([])
    })
  })

  describe('sanitizeMessagesForStorage with storage files', () => {
    it('replaces storage file with text placeholder', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Check this paper' },
            storageFile,
          ],
        },
      ]

      const sanitized = sanitizeMessagesForStorage(messages)

      expect(sanitized).toHaveLength(1)
      expect(sanitized[0].content).toHaveLength(2)
      expect(sanitized[0].content[0]).toEqual({ type: 'text', text: 'Check this paper' })
      expect(sanitized[0].content[1]).toEqual({ type: 'text', text: '[File uploaded: paper.pdf]' })
    })

    it('handles mixed file types', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Hello' },
            { type: 'image', image: 'data:image/png;base64,abc' },
            { type: 'file', data: 'base64data', mimeType: 'application/pdf' },
            storageFile,
          ],
        },
      ]

      const sanitized = sanitizeMessagesForStorage(messages)

      expect(sanitized[0].content).toHaveLength(4)
      expect((sanitized[0].content[0] as { type: string; text: string }).text).toBe('Hello')
      expect((sanitized[0].content[1] as { type: string; text: string }).text).toBe('[Image uploaded]')
      expect((sanitized[0].content[2] as { type: string; text: string }).text).toBe('[File uploaded: application/pdf]')
      expect((sanitized[0].content[3] as { type: string; text: string }).text).toBe('[File uploaded: paper.pdf]')
    })
  })

  describe('toAISDKMessages with storage files', () => {
    it('converts storage files to placeholder text', () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this' },
            storageFile,
          ],
        },
      ]

      const aiMessages = toAISDKMessages(messages)

      expect(aiMessages).toHaveLength(1)
      expect(aiMessages[0].content).toHaveLength(2)
      expect(aiMessages[0].content[0]).toEqual({ type: 'text', text: 'Analyze this' })
      expect(aiMessages[0].content[1]).toEqual({ type: 'text', text: '[PDF: paper.pdf]' })
    })
  })
})
