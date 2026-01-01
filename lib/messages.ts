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

export type MessageStorageFile = {
  type: 'storage-file'
  storagePath: string
  mimeType: string
  filename: string
  size: number
}

export type Message = {
  role: 'assistant' | 'user'
  content: Array<MessageText | MessageCode | MessageImage | MessageFile | MessageStorageFile>
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

      // Storage files should be resolved to file content before calling this function
      if (content.type === 'storage-file') {
        // This is a placeholder - storage files should be resolved server-side
        return {
          type: 'text',
          text: `[PDF: ${content.filename}]`,
        }
      }

      return content
    }),
  }))
}

/**
 * Check if messages contain storage files that need to be resolved
 */
export function hasStorageFiles(messages: Message[]): boolean {
  return messages.some((message) =>
    message.content.some((content) => content.type === 'storage-file')
  )
}

/**
 * Get all storage file paths from messages
 */
export function getStorageFilePaths(messages: Message[]): string[] {
  const paths: string[] = []
  for (const message of messages) {
    for (const content of message.content) {
      if (content.type === 'storage-file') {
        paths.push(content.storagePath)
      }
    }
  }
  return paths
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

export function sanitizeMessagesForStorage(messages: Message[]): Message[] {
  return messages.map((message) => ({
    ...message,
    content: message.content.flatMap((content) => {
      if (content.type === 'file') {
        const label = content.mimeType
          ? `[File uploaded: ${content.mimeType}]`
          : '[File uploaded]'
        return [{ type: 'text', text: label }]
      }

      if (content.type === 'storage-file') {
        return [{ type: 'text', text: `[File uploaded: ${content.filename}]` }]
      }

      if (content.type === 'image') {
        return [{ type: 'text', text: '[Image uploaded]' }]
      }

      return [content]
    }),
  }))
}
