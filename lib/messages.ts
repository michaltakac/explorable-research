import { FragmentSchema } from './schema'
import { ExecutionResult } from './types'
import { DeepPartial } from 'ai'

export type MessageText = {
  type: 'text'
  text: string
}

export type MessageCode = {
  type: 'code'
  text: string
}

export type MessageImage = {
  type: 'image'
  image: string
}

export type MessageFile = {
  type: 'file'
  data: string
  mimeType: string
}

export type Message = {
  role: 'assistant' | 'user'
  content: Array<MessageText | MessageCode | MessageImage | MessageFile>
  object?: DeepPartial<FragmentSchema>
  result?: ExecutionResult
}

export function toAISDKMessages(messages: Message[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content.map((content) => {
      if (content.type === 'code') {
        return {
          type: 'text',
          text: content.text,
        }
      }

      if (content.type === 'file') {
        return {
          type: 'file',
          data: content.data,
          mimeType: content.mimeType,
        }
      }

      return content
    }),
  }))
}

export async function toMessageImage(files: File[]) {
  if (files.length === 0) {
    return []
  }

  return Promise.all(
    files.map(async (file) => {
      const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
      return `data:${file.type};base64,${base64}`
    }),
  )
}

export async function toMessageFile(files: File[]): Promise<MessageFile[]> {
  if (files.length === 0) {
    return []
  }

  return Promise.all(
    files.map(async (file) => {
      const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
      return {
        type: 'file' as const,
        data: base64,
        mimeType: file.type,
      }
    }),
  )
}
