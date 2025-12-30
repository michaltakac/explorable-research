import assert from 'node:assert/strict'
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

const sanitized = sanitizeMessagesForStorage(messages)

assert.equal(sanitized.length, 2)
assert.equal(sanitized[0].content[0].type, 'text')
assert.equal(
  (sanitized[0].content[1] as { type: 'text'; text: string }).text,
  '[Image uploaded]',
)
assert.equal(
  (sanitized[0].content[2] as { type: 'text'; text: string }).text,
  '[File uploaded: application/pdf]',
)
assert.equal(sanitized[1].content[1].type, 'code')
assert.equal(sanitized[1].result, sampleResult)
