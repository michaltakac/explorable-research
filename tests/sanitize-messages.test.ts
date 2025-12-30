import { describe, expect, it } from 'vitest'
import { sanitizeMessagesForStorage, Message } from '../lib/messages'
import { ExecutionResult } from '../lib/types'

const sampleResult: ExecutionResult = {
  sbxId: 'sbx_123',
  template: 'web',
  url: 'https://example.com',
}

const messages: Message[] = [
  {
    role: 'user',
    content: [
      { type: 'text', text: 'Hello' },
      { type: 'image', image: 'data:image/png;base64,abc' },
      { type: 'file', data: 'base64data', mimeType: 'application/pdf' },
    ],
  },
  {
    role: 'assistant',
    content: [
      { type: 'text', text: 'Here is your explorable.' },
      { type: 'code', text: 'console.log("hi")' },
    ],
    result: sampleResult,
  },
]

describe('sanitizeMessagesForStorage', () => {
  it('replaces file and image payloads with placeholders', () => {
    const sanitized = sanitizeMessagesForStorage(messages)

    expect(sanitized).toHaveLength(2)
    expect(sanitized[0].content[0].type).toBe('text')
    expect(
      (sanitized[0].content[1] as { type: 'text'; text: string }).text,
    ).toBe('[Image uploaded]')
    expect(
      (sanitized[0].content[2] as { type: 'text'; text: string }).text,
    ).toBe('[File uploaded: application/pdf]')
    expect(sanitized[1].content[1].type).toBe('code')
    expect(sanitized[1].result).toBe(sampleResult)
  })
})
