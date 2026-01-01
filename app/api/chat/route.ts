import { handleAPIError, createRateLimitResponse } from '@/lib/api-errors'
import { Duration } from '@/lib/duration'
import { getModelClient, LLMModel, LLMModelConfig } from '@/lib/models'
import { toPrompt } from '@/lib/prompt'
import ratelimit from '@/lib/ratelimit'
import { fragmentSchema as schema } from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { downloadPdfFromStorage } from '@/lib/pdf-storage'
import { streamObject, CoreMessage } from 'ai'

export const maxDuration = 300

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

type StorageFileContent = {
  type: 'storage-file'
  storagePath: string
  mimeType: string
  filename: string
  size: number
}

/**
 * Resolve storage files in messages by downloading from Supabase Storage
 */
async function resolveStorageFiles(
  messages: CoreMessage[],
  accessToken?: string
): Promise<CoreMessage[]> {
  if (!accessToken) {
    return messages
  }

  let supabase
  try {
    supabase = createSupabaseServerClient(accessToken)
  } catch {
    return messages
  }

  const resolvedMessages: CoreMessage[] = []

  for (const message of messages) {
    if (!Array.isArray(message.content)) {
      resolvedMessages.push(message)
      continue
    }

    const resolvedContent: unknown[] = []

    for (const content of message.content) {
      const contentObj = content as unknown as { type: string; [key: string]: unknown }
      if (contentObj.type === 'storage-file') {
        const storageFile = contentObj as unknown as StorageFileContent
        const downloaded = await downloadPdfFromStorage(supabase, storageFile.storagePath)

        if (downloaded) {
          resolvedContent.push({
            type: 'file',
            data: downloaded.data,
            mimeType: downloaded.mimeType,
          })
        } else {
          // If download fails, add a text placeholder
          resolvedContent.push({
            type: 'text',
            text: `[PDF: ${storageFile.filename} - failed to load]`,
          })
        }
      } else {
        resolvedContent.push(content)
      }
    }

    resolvedMessages.push({
      ...message,
      content: resolvedContent,
    } as CoreMessage)
  }

  return resolvedMessages
}

export async function POST(req: Request) {
  const {
    messages,
    userID,
    teamID,
    template,
    model,
    config,
    accessToken,
  }: {
    messages: CoreMessage[]
    userID: string | undefined
    teamID: string | undefined
    template: Templates
    model: LLMModel
    config: LLMModelConfig
    accessToken?: string
  } = await req.json()

  const limit = !config.apiKey
    ? await ratelimit(
        req.headers.get('x-forwarded-for'),
        rateLimitMaxRequests,
        ratelimitWindow,
      )
    : false

  if (limit) {
    return createRateLimitResponse(limit)
  }

  // Resolve storage files before processing
  const resolvedMessages = await resolveStorageFiles(messages, accessToken)

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  try {
    const stream = await streamObject({
      model: modelClient,
      schema,
      system: toPrompt(template),
      messages: resolvedMessages,
      maxRetries: 0, // do not retry on errors
      ...modelParams,
    })

    return stream.toTextStreamResponse()
  } catch (error: any) {
    return handleAPIError(error, { hasOwnApiKey: !!config.apiKey })
  }
}
