import { handleAPIError, createRateLimitResponse } from '@/lib/api-errors'
import { Duration } from '@/lib/duration'
import { getModelClient, LLMModel, LLMModelConfig } from '@/lib/models'
import { applyPatch } from '@/lib/morph'
import ratelimit from '@/lib/ratelimit'
import { FragmentSchema, morphEditSchema, MorphEditSchema } from '@/lib/schema'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { downloadPdfFromStorage } from '@/lib/pdf-storage'
import { generateObject, CoreMessage } from 'ai'

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolvedContent: any[] = []

    for (const content of message.content) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentAny = content as any
      if (contentAny.type === 'storage-file') {
        const storageFile = contentAny as StorageFileContent
        const downloaded = await downloadPdfFromStorage(supabase, storageFile.storagePath)

        if (downloaded) {
          resolvedContent.push({
            type: 'file',
            data: downloaded.data,
            mimeType: downloaded.mimeType,
          })
        } else {
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

// System prompt is constructed dynamically below using the current file context

export async function POST(req: Request) {
  const {
    messages,
    model,
    config,
    currentFragment,
    accessToken,
  }: {
    messages: CoreMessage[]
    model: LLMModel
    config: LLMModelConfig
    currentFragment: FragmentSchema
    accessToken?: string
  } = await req.json()

  // Rate limiting (same as chat route)
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
    const contextualSystemPrompt = `You are a code editor. Generate a JSON response with exactly these fields:

{
  "commentary": "Explain what changes you are making",
  "instruction": "One line description of the change", 
  "edit": "The code changes with // ... existing code ... for unchanged parts",
  "file_path": "${currentFragment.file_path}"
}

Current file: ${currentFragment.file_path}
Current code:
\`\`\`
${currentFragment.code}
\`\`\`

`

    const result = await generateObject({
      model: modelClient,
      system: contextualSystemPrompt,
      messages: resolvedMessages,
      schema: morphEditSchema,
      maxRetries: 0,
      ...modelParams,
    })

    const editInstructions = result.object

    // Apply edits using Morph
    const morphResult = await applyPatch({
      targetFile: currentFragment.file_path,
      instructions: editInstructions.instruction,
      initialCode: currentFragment.code,
      codeEdit: editInstructions.edit,
    })

    // Return updated fragment in standard format
    const updatedFragment: FragmentSchema = {
      ...currentFragment,
      code: morphResult.code,
      commentary: editInstructions.commentary,
    }

    // Create a streaming response that matches the AI SDK format
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const json = JSON.stringify(updatedFragment)
        controller.enqueue(encoder.encode(json))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error: any) {
    return handleAPIError(error, { hasOwnApiKey: !!config.apiKey })
  }
}
