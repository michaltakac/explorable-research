import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Integration tests for API v1 endpoints.
 *
 * These tests require:
 * 1. A running local server (npm run dev on port 3001)
 * 2. Valid API key set in TEST_API_KEY environment variable
 * 3. Valid Supabase and E2B credentials configured
 *
 * Run with: TEST_API_KEY="your-api-key" npm run test -- lib/__tests__/api-v1-integration.test.ts
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001'
const API_KEY = process.env.TEST_API_KEY || ''

// Skip tests if no API key is provided
const shouldSkip = !API_KEY

// Store created project IDs for cleanup
const createdProjectIds: string[] = []

// Helper to make authenticated requests
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options.headers,
    },
  })
}

// Helper to read local PDF as base64
function readPdfAsBase64(filename: string): string {
  const pdfPath = path.join(__dirname, filename)
  const pdfBuffer = fs.readFileSync(pdfPath)
  return pdfBuffer.toString('base64')
}

// Helper to download ArXiv PDF and save temporarily
async function downloadArxivPdf(arxivId: string): Promise<string> {
  const response = await fetch(`https://arxiv.org/pdf/${arxivId}.pdf`)
  if (!response.ok) {
    throw new Error(`Failed to download ArXiv PDF: ${response.status}`)
  }
  const buffer = await response.arrayBuffer()
  const pdfPath = path.join(__dirname, `${arxivId.replace('/', '-')}.pdf`)
  fs.writeFileSync(pdfPath, Buffer.from(buffer))
  return pdfPath
}

// Helper to clean up downloaded PDFs
function cleanupPdf(pdfPath: string) {
  if (fs.existsSync(pdfPath) && !pdfPath.includes('bitcoin.pdf')) {
    fs.unlinkSync(pdfPath)
  }
}

describe.skipIf(shouldSkip)('API v1 Integration Tests', () => {
  // Clean up created projects after all tests
  afterAll(async () => {
    for (const projectId of createdProjectIds) {
      try {
        await apiRequest(`/api/projects/${projectId}`, { method: 'DELETE' })
      } catch {
        // Ignore cleanup errors
      }
    }
  })

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/projects/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arxiv_url: 'https://arxiv.org/abs/2301.00001' }),
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('should reject requests with invalid API key', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/projects/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'invalid-api-key',
        },
        body: JSON.stringify({ arxiv_url: 'https://arxiv.org/abs/2301.00001' }),
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.success).toBe(false)
    })
  })

  describe('Input Validation', () => {
    it('should reject request without PDF source', async () => {
      const response = await apiRequest('/api/v1/projects/create', {
        method: 'POST',
        body: JSON.stringify({
          instruction: 'Create visualization',
        }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject pdf_file without pdf_filename', async () => {
      const response = await apiRequest('/api/v1/projects/create', {
        method: 'POST',
        body: JSON.stringify({
          pdf_file: 'base64data',
        }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject invalid model ID', async () => {
      const response = await apiRequest('/api/v1/projects/create', {
        method: 'POST',
        body: JSON.stringify({
          arxiv_url: 'https://arxiv.org/abs/2301.00001',
          model: 'invalid-model',
        }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/v1/projects/create - Local PDF', () => {
    it('should create project from local bitcoin.pdf', async () => {
      const pdfBase64 = readPdfAsBase64('bitcoin.pdf')

      const response = await apiRequest('/api/v1/projects/create', {
        method: 'POST',
        body: JSON.stringify({
          pdf_file: pdfBase64,
          pdf_filename: 'bitcoin.pdf',
          instruction: 'Create an interactive visualization explaining the key concepts of this paper. Include diagrams showing the blockchain structure and transaction flow.',
        }),
      })

      // This test may take a while due to AI generation
      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.project).toBeDefined()
      expect(body.project.id).toBeDefined()
      expect(body.project.status).toBe('ready')
      expect(body.project.preview_url).toBeTruthy()
      expect(body.project.sandbox_id).toBeTruthy()
      expect(body.project.code).toBeDefined()

      // Store for cleanup
      createdProjectIds.push(body.project.id)

      // Verify the generated code relates to Bitcoin concepts
      const code = typeof body.project.code === 'string'
        ? body.project.code
        : JSON.stringify(body.project.code)

      // Check that generated content references Bitcoin-related concepts
      const bitcoinKeywords = ['bitcoin', 'block', 'transaction', 'chain', 'hash', 'node', 'peer', 'proof', 'work']
      const hasRelevantContent = bitcoinKeywords.some(keyword =>
        code.toLowerCase().includes(keyword) ||
        body.project.title?.toLowerCase().includes(keyword) ||
        body.project.description?.toLowerCase().includes(keyword)
      )
      expect(hasRelevantContent).toBe(true)
    }, 300000) // 5 minute timeout for AI generation
  })

  describe('POST /api/v1/projects/create - ArXiv URL', () => {
    let downloadedPdfPath: string | null = null

    afterAll(() => {
      if (downloadedPdfPath) {
        cleanupPdf(downloadedPdfPath)
      }
    })

    it('should create project from ArXiv URL', async () => {
      // Using a well-known, small paper for testing: "Attention Is All You Need"
      const arxivUrl = 'https://arxiv.org/abs/1706.03762'

      // Download PDF locally for content verification
      downloadedPdfPath = await downloadArxivPdf('1706.03762')

      const response = await apiRequest('/api/v1/projects/create', {
        method: 'POST',
        body: JSON.stringify({
          arxiv_url: arxivUrl,
          instruction: 'Create an interactive visualization explaining the Transformer architecture and attention mechanism.',
        }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.success).toBe(true)
      expect(body.project).toBeDefined()
      expect(body.project.id).toBeDefined()
      expect(body.project.status).toBe('ready')
      expect(body.project.preview_url).toBeTruthy()
      expect(body.project.sandbox_id).toBeTruthy()
      expect(body.project.code).toBeDefined()

      // Store for cleanup
      createdProjectIds.push(body.project.id)

      // Verify the generated code relates to Transformer/Attention concepts
      const code = typeof body.project.code === 'string'
        ? body.project.code
        : JSON.stringify(body.project.code)

      const transformerKeywords = ['attention', 'transformer', 'query', 'key', 'value', 'layer', 'encoder', 'decoder', 'self-attention', 'multi-head']
      const hasRelevantContent = transformerKeywords.some(keyword =>
        code.toLowerCase().includes(keyword) ||
        body.project.title?.toLowerCase().includes(keyword) ||
        body.project.description?.toLowerCase().includes(keyword)
      )
      expect(hasRelevantContent).toBe(true)
    }, 300000) // 5 minute timeout
  })

  describe('GET /api/v1/projects/:project_id/status', () => {
    it('should return project status', async () => {
      // First create a project
      const pdfBase64 = readPdfAsBase64('bitcoin.pdf')

      const createResponse = await apiRequest('/api/v1/projects/create', {
        method: 'POST',
        body: JSON.stringify({
          pdf_file: pdfBase64,
          pdf_filename: 'bitcoin.pdf',
        }),
      })

      expect(createResponse.status).toBe(200)
      const createBody = await createResponse.json()
      const projectId = createBody.project.id
      createdProjectIds.push(projectId)

      // Get project status
      const statusResponse = await apiRequest(`/api/v1/projects/${projectId}/status`)

      expect(statusResponse.status).toBe(200)
      const statusBody = await statusResponse.json()

      expect(statusBody.success).toBe(true)
      expect(statusBody.project.id).toBe(projectId)
      expect(statusBody.project.status).toBe('ready')
      expect(statusBody.project.preview_url).toBeTruthy()
      expect(statusBody.project.sandbox_id).toBeTruthy()
    }, 300000)

    it('should return 404 for non-existent project', async () => {
      const response = await apiRequest('/api/v1/projects/00000000-0000-0000-0000-000000000000/status')

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('POST /api/v1/projects/:project_id/continue', () => {
    it('should continue an existing project', async () => {
      // First create a project
      const pdfBase64 = readPdfAsBase64('bitcoin.pdf')

      const createResponse = await apiRequest('/api/v1/projects/create', {
        method: 'POST',
        body: JSON.stringify({
          pdf_file: pdfBase64,
          pdf_filename: 'bitcoin.pdf',
          instruction: 'Create a basic visualization of the blockchain concept.',
        }),
      })

      expect(createResponse.status).toBe(200)
      const createBody = await createResponse.json()
      const projectId = createBody.project.id
      createdProjectIds.push(projectId)

      // Continue the project with additional instructions
      const continueResponse = await apiRequest(`/api/v1/projects/${projectId}/continue`, {
        method: 'POST',
        body: JSON.stringify({
          instruction: 'Add an interactive slider to adjust the number of blocks displayed and animate the transaction flow.',
        }),
      })

      expect(continueResponse.status).toBe(200)
      const continueBody = await continueResponse.json()

      expect(continueBody.success).toBe(true)
      expect(continueBody.project.id).toBe(projectId)
      expect(continueBody.project.status).toBe('ready')
      expect(continueBody.project.preview_url).toBeTruthy()
      expect(continueBody.project.code).toBeDefined()

      // Verify the updated code mentions slider or animation
      const code = typeof continueBody.project.code === 'string'
        ? continueBody.project.code
        : JSON.stringify(continueBody.project.code)

      const updateKeywords = ['slider', 'range', 'input', 'animate', 'animation', 'transition']
      const hasUpdatedContent = updateKeywords.some(keyword =>
        code.toLowerCase().includes(keyword)
      )
      expect(hasUpdatedContent).toBe(true)
    }, 600000) // 10 minute timeout for create + continue

    it('should return 404 for non-existent project', async () => {
      const response = await apiRequest('/api/v1/projects/00000000-0000-0000-0000-000000000000/continue', {
        method: 'POST',
        body: JSON.stringify({
          instruction: 'Add more features',
        }),
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('should require instruction', async () => {
      // Assume we have at least one project from previous tests
      if (createdProjectIds.length === 0) {
        return // Skip if no projects were created
      }

      const response = await apiRequest(`/api/v1/projects/${createdProjectIds[0]}/continue`, {
        method: 'POST',
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/projects/:project_id', () => {
    it('should return full project data', async () => {
      if (createdProjectIds.length === 0) {
        return // Skip if no projects were created
      }

      const response = await apiRequest(`/api/projects/${createdProjectIds[0]}`)

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.project).toBeDefined()
      expect(body.project.id).toBe(createdProjectIds[0])
      expect(body.project.fragment).toBeDefined()
      expect(body.project.result).toBeDefined()
      expect(body.project.messages).toBeDefined()
    })

    it('should return 404 for non-existent project', async () => {
      const response = await apiRequest('/api/projects/00000000-0000-0000-0000-000000000000')

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/projects/:project_id', () => {
    it('should delete a project', async () => {
      // Create a project specifically for deletion
      const pdfBase64 = readPdfAsBase64('bitcoin.pdf')

      const createResponse = await apiRequest('/api/v1/projects/create', {
        method: 'POST',
        body: JSON.stringify({
          pdf_file: pdfBase64,
          pdf_filename: 'bitcoin.pdf',
        }),
      })

      expect(createResponse.status).toBe(200)
      const createBody = await createResponse.json()
      const projectId = createBody.project.id

      // Delete the project
      const deleteResponse = await apiRequest(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      expect(deleteResponse.status).toBe(204)

      // Verify it's deleted
      const getResponse = await apiRequest(`/api/projects/${projectId}`)
      expect(getResponse.status).toBe(404)
    }, 300000)
  })
})

// Tests for html-developer template
describe.skipIf(shouldSkip)('HTML Developer Template Tests', () => {
  it('should create project using html-developer template from local PDF', async () => {
    const pdfBase64 = readPdfAsBase64('bitcoin.pdf')

    const response = await apiRequest('/api/v1/projects/create', {
      method: 'POST',
      body: JSON.stringify({
        pdf_file: pdfBase64,
        pdf_filename: 'bitcoin.pdf',
        template: 'html-developer',
        instruction: 'Create an interactive HTML visualization explaining the key concepts of this paper using vanilla JavaScript and TailwindCSS.',
      }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.project).toBeDefined()
    expect(body.project.id).toBeDefined()
    expect(body.project.status).toBe('ready')
    expect(body.project.preview_url).toBeTruthy()
    expect(body.project.sandbox_id).toBeTruthy()
    expect(body.project.code).toBeDefined()

    // Verify template is html-developer
    expect(body.project.template).toContain('html-developer')

    // Store for cleanup
    createdProjectIds.push(body.project.id)

    // Verify the generated code is HTML-based (should contain HTML tags)
    const code = typeof body.project.code === 'string'
      ? body.project.code
      : Array.isArray(body.project.code)
        ? body.project.code.map((f: { file_content: string }) => f.file_content).join('')
        : ''

    // Check for HTML/JS/CSS structure typical of html-developer template
    const htmlKeywords = ['<!DOCTYPE', '<html', '<head', '<body', 'tailwindcss', 'script']
    const hasHtmlContent = htmlKeywords.some(keyword =>
      code.toLowerCase().includes(keyword.toLowerCase())
    )
    expect(hasHtmlContent).toBe(true)

    // Check that content references Bitcoin concepts
    const bitcoinKeywords = ['bitcoin', 'block', 'transaction', 'chain', 'hash', 'node', 'peer', 'proof', 'work']
    const hasRelevantContent = bitcoinKeywords.some(keyword =>
      code.toLowerCase().includes(keyword) ||
      body.project.title?.toLowerCase().includes(keyword) ||
      body.project.description?.toLowerCase().includes(keyword)
    )
    expect(hasRelevantContent).toBe(true)
  }, 300000)

  it('should create project using html-developer template from ArXiv URL', async () => {
    const arxivUrl = 'https://arxiv.org/abs/1706.03762'

    const response = await apiRequest('/api/v1/projects/create', {
      method: 'POST',
      body: JSON.stringify({
        arxiv_url: arxivUrl,
        template: 'html-developer',
        instruction: 'Create an interactive HTML page explaining the Transformer architecture using vanilla JavaScript and CSS.',
      }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.project).toBeDefined()
    expect(body.project.id).toBeDefined()
    expect(body.project.status).toBe('ready')
    expect(body.project.preview_url).toBeTruthy()

    // Verify template is html-developer
    expect(body.project.template).toContain('html-developer')

    // Store for cleanup
    createdProjectIds.push(body.project.id)

    // Verify the generated code relates to Transformer/Attention concepts
    const code = typeof body.project.code === 'string'
      ? body.project.code
      : Array.isArray(body.project.code)
        ? body.project.code.map((f: { file_content: string }) => f.file_content).join('')
        : ''

    const transformerKeywords = ['attention', 'transformer', 'query', 'key', 'value', 'layer', 'encoder', 'decoder', 'self-attention', 'multi-head']
    const hasRelevantContent = transformerKeywords.some(keyword =>
      code.toLowerCase().includes(keyword) ||
      body.project.title?.toLowerCase().includes(keyword) ||
      body.project.description?.toLowerCase().includes(keyword)
    )
    expect(hasRelevantContent).toBe(true)
  }, 300000)

  it('should continue html-developer project', async () => {
    // First create a project with html-developer template
    const pdfBase64 = readPdfAsBase64('bitcoin.pdf')

    const createResponse = await apiRequest('/api/v1/projects/create', {
      method: 'POST',
      body: JSON.stringify({
        pdf_file: pdfBase64,
        pdf_filename: 'bitcoin.pdf',
        template: 'html-developer',
        instruction: 'Create a basic HTML visualization of the blockchain concept.',
      }),
    })

    expect(createResponse.status).toBe(200)
    const createBody = await createResponse.json()
    const projectId = createBody.project.id
    createdProjectIds.push(projectId)

    // Continue the project
    const continueResponse = await apiRequest(`/api/v1/projects/${projectId}/continue`, {
      method: 'POST',
      body: JSON.stringify({
        instruction: 'Add an interactive animation showing how blocks are added to the chain.',
      }),
    })

    expect(continueResponse.status).toBe(200)
    const continueBody = await continueResponse.json()

    expect(continueBody.success).toBe(true)
    expect(continueBody.project.id).toBe(projectId)
    expect(continueBody.project.status).toBe('ready')
    expect(continueBody.project.template).toContain('html-developer')

    // Verify the updated code mentions animation
    const code = typeof continueBody.project.code === 'string'
      ? continueBody.project.code
      : Array.isArray(continueBody.project.code)
        ? continueBody.project.code.map((f: { file_content: string }) => f.file_content).join('')
        : ''

    const animationKeywords = ['animate', 'animation', 'transition', 'keyframe', 'transform', 'motion']
    const hasAnimationContent = animationKeywords.some(keyword =>
      code.toLowerCase().includes(keyword)
    )
    expect(hasAnimationContent).toBe(true)
  }, 600000)
})

// Additional test for invalid ArXiv URL
describe.skipIf(shouldSkip)('ArXiv Error Handling', () => {
  it('should return error for invalid ArXiv URL', async () => {
    const response = await apiRequest('/api/v1/projects/create', {
      method: 'POST',
      body: JSON.stringify({
        arxiv_url: 'https://example.com/not-arxiv',
      }),
    })

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  it('should return error for non-existent ArXiv paper', async () => {
    const response = await apiRequest('/api/v1/projects/create', {
      method: 'POST',
      body: JSON.stringify({
        arxiv_url: 'https://arxiv.org/abs/9999.99999',
      }),
    })

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
