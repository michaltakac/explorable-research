import { generateObject, CoreMessage, CoreUserMessage, CoreAssistantMessage, TextPart, ImagePart, FilePart } from 'ai'
import { getModelClient, LLMModel, LLMModelConfig } from './models'
import { toPrompt } from './prompt'
import { fragmentSchema, FragmentSchema } from './schema'
import { Templates } from './templates'
import { SupabaseClient } from '@supabase/supabase-js'
import { downloadPdfFromStorage } from './pdf-storage'

type StorageFileContent = {
  type: 'storage-file'
  storagePath: string
  mimeType: string
  filename: string
  size: number
}

type MessageContent = TextPart | ImagePart | FilePart | StorageFileContent

/**
 * Resolve storage files in messages by downloading from Supabase Storage
 */
export async function resolveStorageFiles(
  messages: CoreMessage[],
  supabase?: SupabaseClient
): Promise<CoreMessage[]> {
  if (!supabase) {
    return messages
  }

  const resolvedMessages: CoreMessage[] = []

  for (const message of messages) {
    if (!Array.isArray(message.content)) {
      resolvedMessages.push(message)
      continue
    }

    const resolvedContent: (TextPart | ImagePart | FilePart)[] = []

    for (const content of message.content) {
      const contentObj = content as unknown as { type: string; [key: string]: unknown }
      if (contentObj.type === 'storage-file') {
        const storageFile = contentObj as unknown as StorageFileContent
        const downloaded = await downloadPdfFromStorage(
          supabase,
          storageFile.storagePath
        )

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
      } else if (contentObj.type === 'text' || contentObj.type === 'image' || contentObj.type === 'file') {
        resolvedContent.push(content as TextPart | ImagePart | FilePart)
      }
    }

    if (message.role === 'user') {
      resolvedMessages.push({
        role: 'user',
        content: resolvedContent,
      } as CoreUserMessage)
    } else if (message.role === 'assistant') {
      // For assistant messages, only include text parts
      const textContent = resolvedContent.filter((c): c is TextPart => c.type === 'text')
      resolvedMessages.push({
        role: 'assistant',
        content: textContent,
      } as CoreAssistantMessage)
    } else {
      resolvedMessages.push(message)
    }
  }

  return resolvedMessages
}

export type FragmentGenerationResult = {
  success: true
  fragment: FragmentSchema
}

export type FragmentGenerationError = {
  success: false
  error: string
  errorCode?: 'GENERATION_FAILED' | 'MODEL_ERROR' | 'INVALID_RESPONSE'
}

/**
 * Generate a fragment from messages using the specified model
 * Uses non-streaming generateObject for API usage
 */
export async function generateFragment(
  messages: CoreMessage[],
  template: Templates,
  model: LLMModel,
  config: LLMModelConfig,
  supabase?: SupabaseClient
): Promise<FragmentGenerationResult | FragmentGenerationError> {
  try {
    // Resolve any storage files in messages
    const resolvedMessages = await resolveStorageFiles(messages, supabase)

    // Get model client
    const modelClient = getModelClient(model, config)

    // Extract model params (excluding apiKey which is handled by getModelClient)
    const { apiKey: _apiKey, model: _modelId, baseURL: _baseURL, ...modelParams } = config

    // Generate fragment using non-streaming API
    const result = await generateObject({
      model: modelClient,
      schema: fragmentSchema,
      system: toPrompt(template),
      messages: resolvedMessages,
      maxRetries: 2,
      ...modelParams,
    })

    if (!result.object) {
      return {
        success: false,
        error: 'Failed to generate fragment: empty response',
        errorCode: 'INVALID_RESPONSE',
      }
    }

    return {
      success: true,
      fragment: result.object,
    }
  } catch (error: unknown) {
    console.error('Fragment generation error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return {
      success: false,
      error: `Failed to generate fragment: ${errorMessage}`,
      errorCode: 'GENERATION_FAILED',
    }
  }
}

/**
 * Build initial messages for project creation
 */
export function buildInitialMessages(options: {
  pdfData?: string // base64
  pdfMimeType?: string
  pdfStoragePath?: string
  pdfFilename?: string
  images?: Array<{ data: string; mimeType: string }>
  instruction?: string
  arxivTitle?: string
  arxivAbstract?: string
}): CoreMessage[] {
  const content: MessageContent[] = []

  // Add PDF if provided
  if (options.pdfStoragePath) {
    content.push({
      type: 'storage-file',
      storagePath: options.pdfStoragePath,
      mimeType: options.pdfMimeType || 'application/pdf',
      filename: options.pdfFilename || 'document.pdf',
      size: 0,
    })
  } else if (options.pdfData) {
    content.push({
      type: 'file',
      data: options.pdfData,
      mimeType: options.pdfMimeType || 'application/pdf',
    })
  }

  // Add images if provided
  if (options.images) {
    for (const image of options.images) {
      content.push({
        type: 'image',
        image: image.data,
      })
    }
  }

  // Build the text instruction
  let textInstruction = ''

  if (options.arxivTitle || options.arxivAbstract) {
    textInstruction += `Research Paper: "${options.arxivTitle || 'Untitled'}"\n\n`
    if (options.arxivAbstract) {
      textInstruction += `Abstract: ${options.arxivAbstract}\n\n`
    }
  }

  if (options.instruction) {
    textInstruction += options.instruction
  } else {
    textInstruction +=
      'Please create an interactive explorable research visualization from this research paper.'
  }

  content.push({
    type: 'text',
    text: textInstruction,
  })

  // Cast content to the expected type - we handle storage-file in resolveStorageFiles
  return [
    {
      role: 'user',
      content: content as (TextPart | ImagePart | FilePart)[],
    } as CoreUserMessage,
  ]
}

/**
 * Append a continuation message to existing messages
 */
export function appendContinuationMessage(
  existingMessages: CoreMessage[],
  options: {
    instruction: string
    images?: Array<{ data: string; mimeType: string }>
    previousFragment?: FragmentSchema
  }
): CoreMessage[] {
  // Add assistant message with the previous fragment if available
  const updatedMessages = [...existingMessages]

  if (options.previousFragment) {
    const assistantMessage: CoreAssistantMessage = {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: `I created an interactive visualization with the following code:\n\n\`\`\`\n${options.previousFragment.code}\n\`\`\`\n\n${options.previousFragment.commentary}`,
        },
      ],
    }
    updatedMessages.push(assistantMessage)
  }

  // Build new user message content
  const content: (TextPart | ImagePart)[] = []

  // Add images if provided
  if (options.images) {
    for (const image of options.images) {
      content.push({
        type: 'image',
        image: image.data,
      })
    }
  }

  // Add instruction
  content.push({
    type: 'text',
    text: options.instruction,
  })

  const userMessage: CoreUserMessage = {
    role: 'user',
    content,
  }
  updatedMessages.push(userMessage)

  return updatedMessages
}
