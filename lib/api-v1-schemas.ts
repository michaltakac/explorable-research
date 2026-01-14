import { z } from 'zod'
import modelsJson from './models.json'

// Extract valid model IDs from models.json
const validModelIds = modelsJson.models.map((m) => m.id)

/**
 * Project status values
 * Simplified for synchronous processing
 */
export const PROJECT_STATUSES = {
  READY: 'ready',
  FAILED: 'failed',
} as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES]

/**
 * Schema for LLM model configuration options
 */
export const modelConfigSchema = z
  .object({
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().positive().optional(),
    maxTokens: z.number().positive().optional(),
    frequencyPenalty: z.number().optional(),
    presencePenalty: z.number().optional(),
  })
  .optional()

/**
 * Schema for image attachments
 */
export const imageAttachmentSchema = z.object({
  data: z.string().min(1, 'Image data is required'), // base64
  mimeType: z
    .string()
    .regex(/^image\/(png|jpeg|jpg|gif|webp)$/i, 'Invalid image MIME type'),
  filename: z.string().optional(),
})

/**
 * Schema for POST /api/v1/projects/create
 * Synchronous endpoint - waits for AI generation and returns complete project data
 */
export const createProjectSchema = z
  .object({
    // Input source - either arxiv_url or pdf_file required
    arxiv_url: z.string().optional(),
    pdf_file: z.string().optional(), // base64 encoded PDF
    pdf_filename: z.string().optional(),

    // Optional attachments
    images: z.array(imageAttachmentSchema).max(8).optional(),

    // Generation options
    instruction: z.string().max(10000).optional(),
    template: z
      .enum(['html-developer', 'explorable-research-developer'])
      .default('explorable-research-developer'),
    model: z
      .string()
      .refine((id) => validModelIds.includes(id), {
        message: `Invalid model ID. Valid models: ${validModelIds.join(', ')}`,
      })
      .optional(),
    model_config: modelConfigSchema,
  })
  .refine((data) => data.arxiv_url || data.pdf_file, {
    message: 'Either arxiv_url or pdf_file must be provided',
    path: ['arxiv_url'],
  })
  .refine((data) => !data.pdf_file || data.pdf_filename, {
    message: 'pdf_filename is required when pdf_file is provided',
    path: ['pdf_filename'],
  })

export type CreateProjectInput = z.infer<typeof createProjectSchema>

/**
 * Schema for POST /api/v1/projects/[project_id]/continue
 * Synchronous endpoint - waits for AI generation and returns updated project data
 */
export const continueProjectSchema = z.object({
  // Required instruction for continuation
  instruction: z.string().min(1, 'Instruction is required').max(10000),

  // Optional attachments
  images: z.array(imageAttachmentSchema).max(8).optional(),

  // Generation options (can override project defaults)
  model: z
    .string()
    .refine((id) => validModelIds.includes(id), {
      message: `Invalid model ID. Valid models: ${validModelIds.join(', ')}`,
    })
    .optional(),
  model_config: modelConfigSchema,
})

export type ContinueProjectInput = z.infer<typeof continueProjectSchema>

/**
 * Synchronous response for project creation/continuation
 * Returns full project data after processing completes
 */
export type SyncProjectResponse = {
  success: true
  project: {
    id: string
    status: ProjectStatus
    title: string
    description: string | null
    created_at: string
    updated_at: string
    preview_url: string
    sandbox_id: string
    template: string
    code?: string | Array<{ file_path: string; file_content: string }>
  }
}

/**
 * Full API response schema for project retrieval (GET endpoint)
 */
export type ApiProjectResponse = {
  success: true
  project: {
    id: string
    status: ProjectStatus
    title: string
    description: string
    created_at: string
    updated_at?: string
    preview_url: string
    sandbox_id: string
    template: string
    fragment?: Record<string, unknown>
    code?: string
    messages?: Array<{
      role: 'user' | 'assistant'
      content: Array<{ type: string; text?: string }>
    }>
  }
}

export type ApiErrorResponse = {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/**
 * Helper to create standardized error responses
 */
export function createApiError(
  code: string,
  message: string,
  status: number,
  details?: unknown
): Response {
  const errorObj: ApiErrorResponse['error'] = {
    code,
    message,
  }
  if (details !== undefined) {
    errorObj.details = details
  }
  const body: ApiErrorResponse = {
    success: false,
    error: errorObj,
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Get default model from models.json
 */
export function getDefaultModel() {
  // Use the first model as default (google/gemini-3-pro-preview:online)
  return modelsJson.models[6] // gemini-3-pro-preview
}

/**
 * Get model by ID
 */
export function getModelById(modelId: string) {
  return modelsJson.models.find((m) => m.id === modelId)
}

/**
 * Get all available models
 */
export function getAvailableModels() {
  return modelsJson.models
}
