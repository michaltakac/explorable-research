import { describe, it, expect } from 'vitest'
import {
  createProjectSchema,
  continueProjectSchema,
  modelConfigSchema,
  imageAttachmentSchema,
  createApiError,
  getDefaultModel,
  getModelById,
  getAvailableModels,
} from '../api-v1-schemas'

describe('API V1 Schemas', () => {
  describe('modelConfigSchema', () => {
    it('should accept valid model config', () => {
      const validConfig = {
        temperature: 0.7,
        topP: 0.9,
        topK: 50,
        maxTokens: 4096,
        frequencyPenalty: 0.5,
        presencePenalty: 0.5,
      }

      const result = modelConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })

    it('should accept partial model config', () => {
      const partialConfig = {
        temperature: 0.5,
      }

      const result = modelConfigSchema.safeParse(partialConfig)
      expect(result.success).toBe(true)
    })

    it('should accept undefined/empty config', () => {
      const result = modelConfigSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should reject temperature out of range', () => {
      const invalidConfig = {
        temperature: 3.0, // max is 2
      }

      const result = modelConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
    })

    it('should reject negative temperature', () => {
      const invalidConfig = {
        temperature: -0.5,
      }

      const result = modelConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
    })

    it('should reject topP out of range', () => {
      const invalidConfig = {
        topP: 1.5, // max is 1
      }

      const result = modelConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
    })
  })

  describe('imageAttachmentSchema', () => {
    it('should accept valid image attachment', () => {
      const validImage = {
        data: 'base64encodeddata',
        mimeType: 'image/png',
        filename: 'test.png',
      }

      const result = imageAttachmentSchema.safeParse(validImage)
      expect(result.success).toBe(true)
    })

    it('should accept image without filename', () => {
      const imageWithoutFilename = {
        data: 'base64encodeddata',
        mimeType: 'image/jpeg',
      }

      const result = imageAttachmentSchema.safeParse(imageWithoutFilename)
      expect(result.success).toBe(true)
    })

    it('should reject invalid MIME type', () => {
      const invalidImage = {
        data: 'base64encodeddata',
        mimeType: 'text/plain',
      }

      const result = imageAttachmentSchema.safeParse(invalidImage)
      expect(result.success).toBe(false)
    })

    it('should reject empty data', () => {
      const emptyData = {
        data: '',
        mimeType: 'image/png',
      }

      const result = imageAttachmentSchema.safeParse(emptyData)
      expect(result.success).toBe(false)
    })

    it('should accept various image MIME types', () => {
      const mimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']

      for (const mimeType of mimeTypes) {
        const image = {
          data: 'base64data',
          mimeType,
        }
        const result = imageAttachmentSchema.safeParse(image)
        expect(result.success).toBe(true)
      }
    })
  })

  describe('createProjectSchema', () => {
    it('should accept valid request with arxiv_url', () => {
      const validRequest = {
        arxiv_url: 'https://arxiv.org/abs/2301.00001',
        instruction: 'Create an interactive visualization',
        template: 'explorable-research-developer',
      }

      const result = createProjectSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should accept valid request with pdf_file', () => {
      const validRequest = {
        pdf_file: 'base64encodedpdf',
        pdf_filename: 'research.pdf',
        instruction: 'Create an interactive visualization',
      }

      const result = createProjectSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should require either arxiv_url or pdf_file', () => {
      const invalidRequest = {
        instruction: 'Create an interactive visualization',
      }

      const result = createProjectSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should require pdf_filename when pdf_file is provided', () => {
      const invalidRequest = {
        pdf_file: 'base64encodedpdf',
        instruction: 'Create an interactive visualization',
      }

      const result = createProjectSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should accept request with images', () => {
      const validRequest = {
        arxiv_url: 'https://arxiv.org/abs/2301.00001',
        images: [
          { data: 'base64image', mimeType: 'image/png' },
          { data: 'base64image2', mimeType: 'image/jpeg' },
        ],
      }

      const result = createProjectSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should limit images to 8', () => {
      const invalidRequest = {
        arxiv_url: 'https://arxiv.org/abs/2301.00001',
        images: Array(9).fill({ data: 'base64image', mimeType: 'image/png' }),
      }

      const result = createProjectSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should accept valid model IDs', () => {
      const validRequest = {
        arxiv_url: 'https://arxiv.org/abs/2301.00001',
        model: 'anthropic/claude-sonnet-4.5:online',
      }

      const result = createProjectSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject invalid model IDs', () => {
      const invalidRequest = {
        arxiv_url: 'https://arxiv.org/abs/2301.00001',
        model: 'invalid-model-id',
      }

      const result = createProjectSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should accept valid template values', () => {
      const templates = ['html-developer', 'explorable-research-developer']

      for (const template of templates) {
        const request = {
          arxiv_url: 'https://arxiv.org/abs/2301.00001',
          template,
        }
        const result = createProjectSchema.safeParse(request)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid template', () => {
      const invalidRequest = {
        arxiv_url: 'https://arxiv.org/abs/2301.00001',
        template: 'invalid-template',
      }

      const result = createProjectSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should default template to explorable-research-developer', () => {
      const request = {
        arxiv_url: 'https://arxiv.org/abs/2301.00001',
      }

      const result = createProjectSchema.safeParse(request)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.template).toBe('explorable-research-developer')
      }
    })

    it('should limit instruction length to 10000 characters', () => {
      const longInstruction = 'a'.repeat(10001)
      const invalidRequest = {
        arxiv_url: 'https://arxiv.org/abs/2301.00001',
        instruction: longInstruction,
      }

      const result = createProjectSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })

  describe('continueProjectSchema', () => {
    it('should accept valid continuation request', () => {
      const validRequest = {
        instruction: 'Add a slider control',
      }

      const result = continueProjectSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should require instruction', () => {
      const invalidRequest = {}

      const result = continueProjectSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject empty instruction', () => {
      const invalidRequest = {
        instruction: '',
      }

      const result = continueProjectSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should accept images with continuation', () => {
      const validRequest = {
        instruction: 'Update based on this diagram',
        images: [{ data: 'base64image', mimeType: 'image/png' }],
      }

      const result = continueProjectSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should accept model override', () => {
      const validRequest = {
        instruction: 'Add a slider control',
        model: 'openai/gpt-5.2:online',
      }

      const result = continueProjectSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })
  })

  describe('createApiError', () => {
    it('should create error response with correct structure', async () => {
      const response = createApiError('TEST_ERROR', 'Test message', 400)

      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('TEST_ERROR')
      expect(body.error.message).toBe('Test message')
    })

    it('should include details when provided', async () => {
      const details = { field: 'value' }
      const response = createApiError('TEST_ERROR', 'Test message', 400, details)

      const body = await response.json()
      expect(body.error.details).toEqual(details)
    })

    it('should not include details when not provided', async () => {
      const response = createApiError('TEST_ERROR', 'Test message', 400)

      const body = await response.json()
      expect(body.error.details).toBeUndefined()
    })
  })

  describe('Model helpers', () => {
    it('getDefaultModel should return a valid model', () => {
      const model = getDefaultModel()
      expect(model).toBeDefined()
      expect(model.id).toBeDefined()
      expect(model.name).toBeDefined()
      expect(model.provider).toBeDefined()
    })

    it('getModelById should return model for valid ID', () => {
      const model = getModelById('anthropic/claude-sonnet-4.5:online')
      expect(model).toBeDefined()
      expect(model?.id).toBe('anthropic/claude-sonnet-4.5:online')
    })

    it('getModelById should return undefined for invalid ID', () => {
      const model = getModelById('invalid-model-id')
      expect(model).toBeUndefined()
    })

    it('getAvailableModels should return array of models', () => {
      const models = getAvailableModels()
      expect(Array.isArray(models)).toBe(true)
      expect(models.length).toBeGreaterThan(0)

      for (const model of models) {
        expect(model.id).toBeDefined()
        expect(model.name).toBeDefined()
        expect(model.provider).toBeDefined()
      }
    })
  })
})
