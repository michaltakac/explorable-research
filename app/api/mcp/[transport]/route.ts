import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getDefaultModel, getModelById, getAvailableModels } from '@/lib/api-v1-schemas'
import { processArxivPaper } from '@/lib/arxiv'
import {
  generateFragment,
  buildInitialMessages,
  appendContinuationMessage,
} from '@/lib/fragment-generator'
import {
  createSandboxFromFragment,
  updateSandboxCode,
  getPreviewUrl,
} from '@/lib/sandbox'
import { LLMModelConfig } from '@/lib/models'
import { Message, sanitizeMessagesForStorage, toAISDKMessages } from '@/lib/messages'
import templates, { getTemplateIdSuffix } from '@/lib/templates'
import { uploadPdfToStorage, isValidPdfSize } from '@/lib/pdf-storage'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { CoreMessage } from 'ai'
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from 'unique-names-generator'
import ratelimit from '@/lib/ratelimit'
import { Duration } from '@/lib/duration'

// Allow up to 5 minutes for processing (AI generation can take time)
export const maxDuration = 300

// Rate limiting configuration (same as API routes)
const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

/**
 * Check rate limit for a user
 * Returns error response object if rate limited, null if allowed
 */
async function checkRateLimit(userId: string): Promise<{
  success: false
  error: { code: string; message: string; details?: unknown }
} | null> {
  const limit = await ratelimit(userId, rateLimitMaxRequests, ratelimitWindow)
  if (limit) {
    return {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded',
        details: {
          limit: limit.amount,
          remaining: limit.remaining,
          reset: limit.reset,
        },
      },
    }
  }
  return null
}

/**
 * Generate a random project title
 */
function generateRandomTitle(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: ' ',
    style: 'capital',
    length: 3,
  })
}

/**
 * Validate API key and return user context
 */
async function validateApiKey(apiKey: string): Promise<{ userId: string } | null> {
  if (!apiKey) return null

  try {
    const supabase = createSupabaseServerClient(undefined, apiKey)
    const { data, error } = await supabase.rpc('current_user_context')

    if (error || !data || data.length === 0 || !data[0].user_id) {
      return null
    }

    return { userId: data[0].user_id }
  } catch {
    return null
  }
}

/**
 * Create the MCP handler with tools
 */
const mcpHandler = createMcpHandler(
  (server) => {
    // Tool: create_project - Create a new project from ArXiv URL or PDF
    server.registerTool(
      'create_project',
      {
        title: 'Create Project',
        description:
          'Create a new explorable research project from an ArXiv paper URL or uploaded PDF. Returns a preview URL for the generated interactive visualization.',
        inputSchema: {
          arxiv_url: z
            .string()
            .url()
            .optional()
            .describe('ArXiv paper URL (e.g., https://arxiv.org/abs/1706.03762)'),
          pdf_file: z
            .string()
            .optional()
            .describe('Base64-encoded PDF file content'),
          pdf_filename: z
            .string()
            .optional()
            .describe('Filename for the PDF (required if pdf_file is provided)'),
          instruction: z
            .string()
            .max(10000)
            .optional()
            .describe('Additional instructions for the AI when generating the visualization'),
          template: z
            .enum(['html-developer', 'explorable-research-developer'])
            .default('explorable-research-developer')
            .describe('Template to use for generation'),
          model: z
            .string()
            .optional()
            .describe('Model ID to use for generation (see list_models tool)'),
        },
      },
      async (args, extra) => {
        // Get API key from auth context
        const apiKey = (extra as { authInfo?: { token?: string } }).authInfo?.token
        if (!apiKey) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'UNAUTHORIZED', message: 'API key required' },
                }),
              },
            ],
          }
        }

        // Validate API key
        const user = await validateApiKey(apiKey)
        if (!user) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'UNAUTHORIZED', message: 'Invalid API key' },
                }),
              },
            ],
          }
        }

        // Rate limiting
        const rateLimitError = await checkRateLimit(user.userId)
        if (rateLimitError) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(rateLimitError),
              },
            ],
          }
        }

        // Validate input
        if (!args.arxiv_url && !args.pdf_file) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Either arxiv_url or pdf_file must be provided',
                  },
                }),
              },
            ],
          }
        }

        if (args.pdf_file && !args.pdf_filename) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: {
                    code: 'VALIDATION_ERROR',
                    message: 'pdf_filename is required when pdf_file is provided',
                  },
                }),
              },
            ],
          }
        }

        const supabase = createSupabaseServerClient(undefined, apiKey)

        // Process PDF source
        let pdfData: string | undefined
        let pdfStoragePath: string | undefined
        let pdfFilename: string | undefined
        const pdfMimeType = 'application/pdf'
        let arxivTitle: string | undefined
        let arxivAbstract: string | undefined

        if (args.arxiv_url) {
          const arxivResult = await processArxivPaper(args.arxiv_url, {
            userId: user.userId,
            supabase,
          })

          if (!arxivResult.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    error: {
                      code: arxivResult.errorCode || 'ARXIV_ERROR',
                      message: arxivResult.error,
                    },
                  }),
                },
              ],
            }
          }

          arxivTitle = arxivResult.title
          arxivAbstract = arxivResult.abstract
          pdfFilename = arxivResult.pdf.filename

          if ('storagePath' in arxivResult.pdf) {
            pdfStoragePath = arxivResult.pdf.storagePath
          } else {
            pdfData = arxivResult.pdf.data
          }
        } else if (args.pdf_file && args.pdf_filename) {
          try {
            const pdfBuffer = Buffer.from(args.pdf_file, 'base64')

            if (!isValidPdfSize(pdfBuffer.length)) {
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      success: false,
                      error: {
                        code: 'PDF_TOO_LARGE',
                        message: 'PDF file exceeds maximum size of 10MB',
                      },
                    }),
                  },
                ],
              }
            }

            const uploadResult = await uploadPdfToStorage(supabase, user.userId, {
              data: new Uint8Array(pdfBuffer),
              filename: args.pdf_filename,
              mimeType: 'application/pdf',
            })

            if (uploadResult.success) {
              pdfStoragePath = uploadResult.storagePath
              pdfFilename = args.pdf_filename
            } else {
              pdfData = args.pdf_file
              pdfFilename = args.pdf_filename
            }
          } catch {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    error: { code: 'INVALID_PDF', message: 'Invalid base64-encoded PDF' },
                  }),
                },
              ],
            }
          }
        }

        // Build messages
        const initialMessages = buildInitialMessages({
          pdfData,
          pdfStoragePath,
          pdfFilename,
          pdfMimeType,
          instruction: args.instruction,
          arxivTitle,
          arxivAbstract,
        })

        // Get model
        const model = args.model ? getModelById(args.model) : getDefaultModel()
        if (!model) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'INVALID_MODEL', message: 'Invalid model ID' },
                }),
              },
            ],
          }
        }

        const modelConfig: LLMModelConfig = {}

        // Get template
        const templateId = getTemplateIdSuffix(args.template || 'explorable-research-developer')
        const template = { [templateId]: templates[templateId] } as typeof templates

        // Generate fragment
        const fragmentResult = await generateFragment(
          initialMessages,
          template,
          model,
          modelConfig,
          supabase
        )

        if (!fragmentResult.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: {
                    code: fragmentResult.errorCode || 'GENERATION_FAILED',
                    message: fragmentResult.error,
                  },
                }),
              },
            ],
          }
        }

        const fragment = fragmentResult.fragment

        // Create sandbox
        const sandboxResult = await createSandboxFromFragment(fragment, {
          userId: user.userId,
        })

        if (!sandboxResult.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: {
                    code: sandboxResult.errorCode || 'SANDBOX_FAILED',
                    message: sandboxResult.error,
                  },
                }),
              },
            ],
          }
        }

        const executionResult = sandboxResult.result
        const previewUrl = getPreviewUrl(executionResult)

        // Save project
        let initialTitle: string
        if (args.pdf_filename) {
          initialTitle = args.pdf_filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
        } else {
          initialTitle = generateRandomTitle()
        }

        const projectTitle = fragment.title || arxivTitle || initialTitle

        const storageMessages: Message[] = initialMessages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: (msg.content as Array<{ type: string; text?: string }>).map((c) => {
            if (c.type === 'text' && c.text) {
              return { type: 'text' as const, text: c.text }
            }
            if (c.type === 'storage-file') {
              return c as unknown as Message['content'][0]
            }
            return { type: 'text' as const, text: '' }
          }),
          object: fragment,
          result: executionResult,
        }))

        storageMessages.push({
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: fragment.commentary || 'Generated interactive visualization.',
            },
          ],
          object: fragment,
          result: executionResult,
        })

        const sanitizedMessages = sanitizeMessagesForStorage(storageMessages)

        const now = new Date().toISOString()
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            user_id: user.userId,
            title: projectTitle,
            description: fragment.description || arxivAbstract?.substring(0, 200) || null,
            status: 'ready',
            fragment,
            result: executionResult,
            messages: sanitizedMessages,
            created_at: now,
            updated_at: now,
          })
          .select('id, created_at, updated_at')
          .single()

        if (projectError || !projectData) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'DATABASE_ERROR', message: 'Failed to save project' },
                }),
              },
            ],
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                project: {
                  id: projectData.id,
                  status: 'ready',
                  title: projectTitle,
                  description: fragment.description || arxivAbstract?.substring(0, 200) || null,
                  created_at: projectData.created_at,
                  updated_at: projectData.updated_at,
                  preview_url: previewUrl || '',
                  sandbox_id: executionResult.sbxId,
                  template: fragment.template,
                },
              }),
            },
          ],
        }
      }
    )

    // Tool: continue_project - Continue an existing project with new instructions
    server.registerTool(
      'continue_project',
      {
        title: 'Continue Project',
        description:
          'Continue an existing project with additional instructions. Updates the visualization based on new requirements.',
        inputSchema: {
          project_id: z.string().uuid().describe('The project ID to continue'),
          instruction: z
            .string()
            .min(1)
            .max(10000)
            .describe('Instructions for modifying the visualization'),
          model: z
            .string()
            .optional()
            .describe('Model ID to use for generation (see list_models tool)'),
        },
      },
      async (args, extra) => {
        const apiKey = (extra as { authInfo?: { token?: string } }).authInfo?.token
        if (!apiKey) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'UNAUTHORIZED', message: 'API key required' },
                }),
              },
            ],
          }
        }

        const user = await validateApiKey(apiKey)
        if (!user) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'UNAUTHORIZED', message: 'Invalid API key' },
                }),
              },
            ],
          }
        }

        // Rate limiting
        const rateLimitError = await checkRateLimit(user.userId)
        if (rateLimitError) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(rateLimitError),
              },
            ],
          }
        }

        const supabase = createSupabaseServerClient(undefined, apiKey)

        // Fetch project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, title, description, status, fragment, result, messages, created_at')
          .eq('id', args.project_id)
          .eq('user_id', user.userId)
          .single()

        if (projectError || !projectData) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'NOT_FOUND', message: 'Project not found' },
                }),
              },
            ],
          }
        }

        type ProjectData = {
          id: string
          title: string
          description: string
          status: string
          fragment: FragmentSchema
          result: ExecutionResult
          messages: Message[]
          created_at: string
        }

        const project = projectData as ProjectData

        if (project.status !== 'ready') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: {
                    code: 'PROJECT_NOT_READY',
                    message: `Project is not ready. Current status: ${project.status}`,
                  },
                }),
              },
            ],
          }
        }

        // Build continuation messages
        const existingMessages = toAISDKMessages(project.messages || []) as CoreMessage[]
        const updatedMessages = appendContinuationMessage(existingMessages, {
          instruction: args.instruction,
          previousFragment: project.fragment,
        })

        // Get model
        const model = args.model ? getModelById(args.model) : getDefaultModel()
        if (!model) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'INVALID_MODEL', message: 'Invalid model ID' },
                }),
              },
            ],
          }
        }

        const modelConfig: LLMModelConfig = {}

        // Get template
        let templateId = project.fragment.template
        if (!templates[templateId]) {
          const baseId = templateId.replace(/-dev$/, '')
          templateId = getTemplateIdSuffix(baseId)
        }

        if (!templates[templateId]) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: {
                    code: 'TEMPLATE_NOT_FOUND',
                    message: `Template "${project.fragment.template}" not found`,
                  },
                }),
              },
            ],
          }
        }

        const template = { [templateId]: templates[templateId] } as typeof templates

        // Generate new fragment
        const fragmentResult = await generateFragment(
          updatedMessages,
          template,
          model,
          modelConfig,
          supabase
        )

        if (!fragmentResult.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: {
                    code: fragmentResult.errorCode || 'GENERATION_FAILED',
                    message: fragmentResult.error,
                  },
                }),
              },
            ],
          }
        }

        const newFragment = fragmentResult.fragment

        // Update sandbox
        let sandboxResult
        if (project.result?.sbxId) {
          sandboxResult = await updateSandboxCode(project.result.sbxId, newFragment, {
            userId: user.userId,
          })
        } else {
          sandboxResult = await createSandboxFromFragment(newFragment, {
            userId: user.userId,
          })
        }

        if (!sandboxResult.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: {
                    code: sandboxResult.errorCode || 'SANDBOX_FAILED',
                    message: sandboxResult.error,
                  },
                }),
              },
            ],
          }
        }

        const executionResult = sandboxResult.result
        const previewUrl = getPreviewUrl(executionResult)

        // Update messages
        const storageMessages: Message[] = [
          ...(project.messages || []),
          {
            role: 'user' as const,
            content: [{ type: 'text' as const, text: args.instruction }],
          },
          {
            role: 'assistant' as const,
            content: [
              {
                type: 'text' as const,
                text: newFragment.commentary || 'Updated interactive visualization.',
              },
            ],
            object: newFragment,
            result: executionResult,
          },
        ]

        const sanitizedMessages = sanitizeMessagesForStorage(storageMessages)

        // Update project
        const now = new Date().toISOString()
        const newTitle = newFragment.title || project.title
        const newDescription = newFragment.description || project.description

        const { error: updateError } = await supabase
          .from('projects')
          .update({
            title: newTitle,
            description: newDescription,
            status: 'ready',
            fragment: newFragment,
            result: executionResult,
            messages: sanitizedMessages,
            updated_at: now,
          })
          .eq('id', args.project_id)
          .eq('user_id', user.userId)

        if (updateError) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'DATABASE_ERROR', message: 'Failed to update project' },
                }),
              },
            ],
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                project: {
                  id: args.project_id,
                  status: 'ready',
                  title: newTitle,
                  description: newDescription,
                  created_at: project.created_at,
                  updated_at: now,
                  preview_url: previewUrl || '',
                  sandbox_id: executionResult.sbxId,
                  template: newFragment.template,
                },
              }),
            },
          ],
        }
      }
    )

    // Tool: get_project - Get project details
    server.registerTool(
      'get_project',
      {
        title: 'Get Project',
        description: 'Get details of an existing project including status and preview URL.',
        inputSchema: {
          project_id: z.string().uuid().describe('The project ID to retrieve'),
        },
      },
      async (args, extra) => {
        const apiKey = (extra as { authInfo?: { token?: string } }).authInfo?.token
        if (!apiKey) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'UNAUTHORIZED', message: 'API key required' },
                }),
              },
            ],
          }
        }

        const user = await validateApiKey(apiKey)
        if (!user) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'UNAUTHORIZED', message: 'Invalid API key' },
                }),
              },
            ],
          }
        }

        const supabase = createSupabaseServerClient(undefined, apiKey)

        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, title, description, status, result, fragment, created_at, updated_at')
          .eq('id', args.project_id)
          .eq('user_id', user.userId)
          .single()

        if (projectError || !projectData) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'NOT_FOUND', message: 'Project not found' },
                }),
              },
            ],
          }
        }

        let previewUrl = ''
        let sandboxId = ''
        if (projectData.status === 'ready' && projectData.result) {
          previewUrl = getPreviewUrl(projectData.result as ExecutionResult) || ''
          sandboxId = (projectData.result as ExecutionResult).sbxId || ''
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                project: {
                  id: projectData.id,
                  status: projectData.status,
                  title: projectData.title || 'Untitled Project',
                  description: projectData.description,
                  created_at: projectData.created_at,
                  updated_at: projectData.updated_at || projectData.created_at,
                  preview_url: previewUrl,
                  sandbox_id: sandboxId,
                  template: (projectData.fragment as FragmentSchema)?.template || '',
                },
              }),
            },
          ],
        }
      }
    )

    // Tool: list_projects - List user's projects
    server.registerTool(
      'list_projects',
      {
        title: 'List Projects',
        description: "List all projects for the authenticated user, ordered by creation date.",
        inputSchema: {
          limit: z.number().int().min(1).max(100).default(20).describe('Maximum number of projects to return'),
          offset: z.number().int().min(0).default(0).describe('Number of projects to skip'),
        },
      },
      async (args, extra) => {
        const apiKey = (extra as { authInfo?: { token?: string } }).authInfo?.token
        if (!apiKey) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'UNAUTHORIZED', message: 'API key required' },
                }),
              },
            ],
          }
        }

        const user = await validateApiKey(apiKey)
        if (!user) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'UNAUTHORIZED', message: 'Invalid API key' },
                }),
              },
            ],
          }
        }

        const supabase = createSupabaseServerClient(undefined, apiKey)

        const { data: projects, error, count } = await supabase
          .from('projects')
          .select('id, title, description, status, created_at, updated_at', { count: 'exact' })
          .eq('user_id', user.userId)
          .order('created_at', { ascending: false })
          .range(args.offset, args.offset + args.limit - 1)

        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: { code: 'DATABASE_ERROR', message: 'Failed to fetch projects' },
                }),
              },
            ],
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                projects: projects || [],
                total: count || 0,
                limit: args.limit,
                offset: args.offset,
              }),
            },
          ],
        }
      }
    )

    // Tool: list_models - List available AI models
    server.registerTool(
      'list_models',
      {
        title: 'List Models',
        description: 'List all available AI models that can be used for project creation.',
        inputSchema: {},
      },
      async () => {
        const models = getAvailableModels()

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                models: models.map((m) => ({
                  id: m.id,
                  name: m.name,
                  provider: m.providerId,
                })),
                default_model: getDefaultModel()?.id,
              }),
            },
          ],
        }
      }
    )
  },
  {
    serverInfo: {
      name: 'explorable-research',
      version: '1.0.0',
    },
  },
  {
    // Note: Don't use basePath - it overrides individual endpoint configs
    streamableHttpEndpoint: '/api/mcp/http',
    sseEndpoint: '/api/mcp/sse',
    sseMessageEndpoint: '/api/mcp/message',
    maxDuration: 300,
    verboseLogs: process.env.NODE_ENV === 'development',
  }
)

/**
 * Verify token from x-api-key header or Authorization header
 */
async function verifyToken(req: Request, bearerToken?: string) {
  // Try x-api-key header first (Context7 style)
  const apiKey = req.headers.get('x-api-key') || bearerToken

  if (!apiKey) {
    return undefined
  }

  const user = await validateApiKey(apiKey)
  if (!user) {
    return undefined
  }

  return {
    token: apiKey,
    clientId: user.userId,
    scopes: ['projects:read', 'projects:write'],
  }
}

// Wrap handler with auth middleware
const handler = withMcpAuth(mcpHandler, verifyToken, {
  required: true,
})

export { handler as GET, handler as POST }
