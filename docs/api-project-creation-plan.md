# API Project Creation Feature - Implementation Plan

## Overview

This feature enables external services to create and manage Explorable Research projects through a REST API using API keys for authentication. The API provides a complete pipeline from PDF/ArXiv input to sandbox-ready interactive visualization.

## Feature Scope

### Endpoint 1: `POST /api/v1/projects/create`

Creates a new project from research paper input (PDF or ArXiv link) and generates an interactive visualization.

#### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `arxiv_url` | string | Either arxiv_url or pdf_file | ArXiv paper URL or ID |
| `pdf_file` | base64 string | Either arxiv_url or pdf_file | Base64-encoded PDF file |
| `pdf_filename` | string | Required with pdf_file | Filename for the PDF |
| `images` | array | No | Array of base64-encoded image files |
| `instruction` | string | No | Custom instruction/prompt for the LLM |
| `template` | string | No | Template to use (`html-developer` or `explorable-research-developer`). Default: `explorable-research-developer` |
| `model` | string | No | LLM model ID from models.json (e.g., `google/gemini-3-pro-preview:online`). Default: server default |
| `model_config` | object | No | LLM configuration options |
| `model_config.temperature` | number | No | Temperature (0-2) |
| `model_config.topP` | number | No | Top P (0-1) |
| `model_config.topK` | number | No | Top K |
| `model_config.maxTokens` | number | No | Max tokens |
| `model_config.frequencyPenalty` | number | No | Frequency penalty |
| `model_config.presencePenalty` | number | No | Presence penalty |
| `include_code` | boolean | No | Include generated code in response. Default: false |
| `include_messages` | boolean | No | Include all chat messages in response. Default: false |

#### Output Response

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "title": "Project Title",
    "description": "Project description",
    "created_at": "ISO timestamp",
    "preview_url": "https://sandbox-url.e2b.dev",
    "sandbox_id": "sbx_xxx",
    "template": "explorable-research-developer",
    "fragment": { /* Full fragment schema - optional */ },
    "code": "string /* Generated code - optional, only if include_code=true */",
    "messages": [ /* Message history - optional, only if include_messages=true */ ]
  }
}
```

#### Error Responses

- `400 Bad Request` - Invalid input parameters
- `401 Unauthorized` - Missing or invalid API key
- `413 Payload Too Large` - PDF exceeds size limit
- `422 Unprocessable Entity` - Failed to process PDF/ArXiv
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Endpoint 2: `POST /api/v1/projects/{project_id}/continue`

Continues an existing project by adding new instructions and regenerating the visualization.

#### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instruction` | string | Yes | Additional instruction/modification request |
| `images` | array | No | Additional images to include |
| `model` | string | No | Override model for this request |
| `model_config` | object | No | Override model config for this request |
| `include_code` | boolean | No | Include code in response. Default: false |
| `include_messages` | boolean | No | Include all messages in response. Default: false |

#### Output Response

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "title": "Updated Project Title",
    "description": "Updated description",
    "updated_at": "ISO timestamp",
    "preview_url": "https://new-sandbox-url.e2b.dev",
    "sandbox_id": "sbx_xxx",
    "template": "explorable-research-developer",
    "fragment": { /* Updated fragment - optional */ },
    "code": "string /* Updated code - optional, only if include_code=true */",
    "messages": [ /* All messages including new ones - optional */ ]
  }
}
```

## Implementation Details

### 1. Input Validation Schema (`lib/api-v1-schemas.ts`)

Create Zod schemas for validating API input:

```typescript
import { z } from 'zod'
import models from './models.json'

const validModelIds = models.models.map(m => m.id)

export const modelConfigSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().positive().optional(),
  maxTokens: z.number().positive().optional(),
  frequencyPenalty: z.number().optional(),
  presencePenalty: z.number().optional(),
}).optional()

export const createProjectSchema = z.object({
  arxiv_url: z.string().optional(),
  pdf_file: z.string().optional(), // base64
  pdf_filename: z.string().optional(),
  images: z.array(z.object({
    data: z.string(), // base64
    mimeType: z.string(),
    filename: z.string().optional(),
  })).optional(),
  instruction: z.string().optional(),
  template: z.enum(['html-developer', 'explorable-research-developer']).default('explorable-research-developer'),
  model: z.string().refine(id => validModelIds.includes(id)).optional(),
  model_config: modelConfigSchema,
  include_code: z.boolean().default(false),
  include_messages: z.boolean().default(false),
}).refine(
  data => data.arxiv_url || data.pdf_file,
  { message: 'Either arxiv_url or pdf_file must be provided' }
).refine(
  data => !data.pdf_file || data.pdf_filename,
  { message: 'pdf_filename is required when pdf_file is provided' }
)

export const continueProjectSchema = z.object({
  instruction: z.string().min(1, 'Instruction is required'),
  images: z.array(z.object({
    data: z.string(),
    mimeType: z.string(),
    filename: z.string().optional(),
  })).optional(),
  model: z.string().refine(id => validModelIds.includes(id)).optional(),
  model_config: modelConfigSchema,
  include_code: z.boolean().default(false),
  include_messages: z.boolean().default(false),
})
```

### 2. API Route Files

#### `app/api/v1/projects/create/route.ts`

Main endpoint for project creation. Flow:
1. Authenticate via API key
2. Validate input with Zod schema
3. Process ArXiv URL or PDF file
4. Build message array with PDF/images
5. Generate fragment using `streamObject` (non-streaming for API)
6. Create E2B sandbox
7. Save project to database
8. Return result

#### `app/api/v1/projects/[project_id]/continue/route.ts`

Endpoint for continuing projects. Flow:
1. Authenticate via API key
2. Validate input
3. Fetch existing project with messages
4. Append new instruction/images to messages
5. Generate new fragment (using existing code as context)
6. Create new sandbox (or update existing)
7. Update project in database
8. Return result

### 3. Helper Functions

#### ArXiv Processing (reuse from `/api/arxiv`)

```typescript
// lib/arxiv.ts - Extract ArXiv ID and download PDF
export async function processArxivUrl(url: string, userId: string, supabase: SupabaseClient): Promise<{
  arxivId: string
  title: string
  abstract: string
  storagePath?: string
  pdfBase64?: string
}>
```

#### Fragment Generation Helper

```typescript
// lib/fragment-generator.ts
export async function generateFragment(
  messages: CoreMessage[],
  template: Templates,
  model: LLMModel,
  config: LLMModelConfig
): Promise<FragmentSchema>
```

#### Sandbox Creation Helper (reuse logic from `/api/sandbox`)

```typescript
// lib/sandbox.ts
export async function createSandboxFromFragment(
  fragment: FragmentSchema,
  userId: string
): Promise<ExecutionResult>
```

### 4. Authentication & Rate Limiting

- Use existing API key authentication from `lib/supabase-server.ts`
- Apply rate limiting (configurable, default 100 requests/day for API)
- Add new environment variable: `API_V1_RATE_LIMIT=100`

### 5. Database Updates

No schema changes needed - uses existing `projects` table:
- `id`, `user_id`, `title`, `description`, `fragment`, `result`, `messages`, `created_at`

Consider adding `updated_at` column for continue operations.

### 6. Testing Plan

#### Unit Tests (`lib/__tests__/api-v1-schemas.test.ts`)

- Schema validation tests
- Model ID validation
- Required field combinations

#### Integration Tests (`lib/__tests__/api-v1-integration.test.ts`)

- Mock Supabase and E2B
- Test full create flow
- Test continue flow
- Test error cases

### 7. Implementation Steps

1. **Phase 1: Core Infrastructure**
   - [ ] Create Zod validation schemas
   - [ ] Extract ArXiv processing to reusable module
   - [ ] Extract fragment generation to reusable module
   - [ ] Extract sandbox creation to reusable module

2. **Phase 2: Create Endpoint**
   - [ ] Implement `POST /api/v1/projects/create`
   - [ ] Handle ArXiv URL processing
   - [ ] Handle PDF file upload
   - [ ] Handle image attachments
   - [ ] Integrate with fragment generation
   - [ ] Integrate with sandbox creation
   - [ ] Save project to database

3. **Phase 3: Continue Endpoint**
   - [ ] Implement `POST /api/v1/projects/[project_id]/continue`
   - [ ] Fetch existing project
   - [ ] Append new messages
   - [ ] Regenerate fragment
   - [ ] Update sandbox
   - [ ] Update project in database

4. **Phase 4: Testing & Polish**
   - [ ] Write unit tests
   - [ ] Write integration tests
   - [ ] Add OpenAPI documentation
   - [ ] Add rate limiting

## File Structure

```
app/api/v1/
├── projects/
│   ├── create/
│   │   └── route.ts          # POST /api/v1/projects/create
│   └── [project_id]/
│       └── continue/
│           └── route.ts      # POST /api/v1/projects/[project_id]/continue

lib/
├── api-v1-schemas.ts         # Zod validation schemas
├── arxiv.ts                  # ArXiv processing utilities
├── fragment-generator.ts     # Fragment generation helper
├── sandbox.ts                # Sandbox creation helper (extract from route)
└── __tests__/
    ├── api-v1-schemas.test.ts
    └── api-v1-integration.test.ts
```

## API Usage Examples

### Create Project from ArXiv

```bash
curl -X POST https://api.explorable.research/api/v1/projects/create \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "arxiv_url": "https://arxiv.org/abs/2301.00001",
    "instruction": "Focus on the visualization of the main algorithm",
    "template": "explorable-research-developer",
    "model": "anthropic/claude-sonnet-4.5:online",
    "include_code": true
  }'
```

### Create Project from PDF

```bash
curl -X POST https://api.explorable.research/api/v1/projects/create \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "pdf_file": "base64-encoded-pdf-content",
    "pdf_filename": "research-paper.pdf",
    "images": [{
      "data": "base64-encoded-image",
      "mimeType": "image/png"
    }],
    "instruction": "Create an interactive diagram of Figure 3"
  }'
```

### Continue Existing Project

```bash
curl -X POST https://api.explorable.research/api/v1/projects/abc123/continue \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Add a slider to control the animation speed",
    "include_messages": true
  }'
```

## Security Considerations

1. **API Key Validation**: All endpoints require valid API key
2. **Rate Limiting**: Prevent abuse with configurable limits
3. **Input Sanitization**: Validate all input with Zod schemas
4. **File Size Limits**: Enforce PDF/image size limits
5. **User Isolation**: Projects only accessible by owning user

## Performance Considerations

1. **Async Generation**: Fragment generation takes 30-90 seconds
2. **Timeout**: Set `maxDuration = 300` (5 minutes) for long requests
3. **Sandbox Timeout**: E2B sandbox timeout of 10 minutes
4. **Response Streaming**: Consider SSE for progress updates (future enhancement)
