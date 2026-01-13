# API v1 Project Endpoints - Documentation

## Overview

The API v1 provides synchronous endpoints for creating and managing Explorable Research projects. All endpoints wait for AI generation to complete before returning results.

**Authentication**: All endpoints require an API key via `x-api-key` header.

## Endpoints

### 1. `POST /api/v1/projects/create`

Creates a new project from a research paper (PDF or ArXiv URL) and generates an interactive visualization. This is a **synchronous** endpoint - it waits for AI generation to complete (up to 5 minutes).

#### Request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `arxiv_url` | string | Either arxiv_url or pdf_file | ArXiv paper URL or ID |
| `pdf_file` | base64 string | Either arxiv_url or pdf_file | Base64-encoded PDF file |
| `pdf_filename` | string | Required with pdf_file | Filename for the PDF |
| `images` | array | No | Array of image attachments |
| `images[].data` | string | Yes | Base64-encoded image data |
| `images[].mimeType` | string | Yes | MIME type (image/png, image/jpeg, etc.) |
| `images[].filename` | string | No | Optional filename |
| `instruction` | string | No | Custom instruction for the LLM |
| `template` | string | No | `html-developer` or `explorable-research-developer` (default) |
| `model` | string | No | LLM model ID from models.json |
| `model_config` | object | No | LLM configuration options |
| `model_config.temperature` | number | No | Temperature (0-2) |
| `model_config.topP` | number | No | Top P (0-1) |
| `model_config.topK` | number | No | Top K |
| `model_config.maxTokens` | number | No | Max tokens |

#### Response (200 OK)

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "status": "ready",
    "title": "Project Title",
    "description": "Project description",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "preview_url": "https://sandbox-url.e2b.dev",
    "sandbox_id": "sbx_xxx",
    "template": "explorable-research-developer",
    "code": "// Generated code..."
  }
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input parameters |
| 400 | INVALID_PDF | Invalid base64-encoded PDF |
| 400 | PDF_TOO_LARGE | PDF exceeds 10MB limit |
| 400 | ARXIV_ERROR | Failed to process ArXiv URL |
| 401 | UNAUTHORIZED | Missing or invalid API key |
| 429 | RATE_LIMIT_EXCEEDED | Rate limit exceeded |
| 500 | GENERATION_FAILED | AI generation failed |
| 500 | SANDBOX_FAILED | Sandbox creation failed |

---

### 2. `GET /api/v1/projects/{project_id}/status`

Returns the current status and data of a project.

#### Response (200 OK)

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "status": "ready",
    "title": "Project Title",
    "description": "Project description",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "preview_url": "https://sandbox-url.e2b.dev",
    "sandbox_id": "sbx_xxx",
    "template": "explorable-research-developer",
    "code": "// Generated code..."
  }
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid API key |
| 404 | NOT_FOUND | Project not found |

---

### 3. `POST /api/v1/projects/{project_id}/continue`

Continues an existing project with new instructions. This is a **synchronous** endpoint - it waits for AI generation to complete.

#### Request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instruction` | string | Yes | New instruction for modifications |
| `images` | array | No | Additional images to include |
| `model` | string | No | Override model for this request |
| `model_config` | object | No | Override model config for this request |

#### Response (200 OK)

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "status": "ready",
    "title": "Updated Project Title",
    "description": "Updated description",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z",
    "preview_url": "https://new-sandbox-url.e2b.dev",
    "sandbox_id": "sbx_xxx",
    "template": "explorable-research-developer",
    "code": "// Updated code..."
  }
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input (e.g., missing instruction) |
| 401 | UNAUTHORIZED | Missing or invalid API key |
| 404 | NOT_FOUND | Project not found |
| 409 | PROJECT_NOT_READY | Project is not in ready state |
| 500 | GENERATION_FAILED | AI generation failed |

---

### 4. `GET /api/projects/{project_id}`

Returns full project data including fragment and messages.

#### Response (200 OK)

```json
{
  "project": {
    "id": "uuid",
    "title": "Project Title",
    "description": "Project description",
    "status": "ready",
    "fragment": { /* Full fragment schema */ },
    "result": { /* Execution result with sandbox info */ },
    "messages": [ /* Conversation history */ ],
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 5. `DELETE /api/projects/{project_id}`

Deletes a project and its associated sandbox.

#### Response

- **204 No Content**: Project deleted successfully
- **404 Not Found**: Project not found

---

## Project Statuses

| Status | Description |
|--------|-------------|
| `ready` | Project is complete and preview is available |
| `failed` | Project creation/update failed |

---

## Usage Examples

### Create Project from ArXiv

```bash
curl -X POST http://localhost:3001/api/v1/projects/create \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "arxiv_url": "https://arxiv.org/abs/1706.03762",
    "instruction": "Create an interactive visualization of the Transformer architecture",
    "template": "explorable-research-developer"
  }'
```

### Create Project from PDF (html-developer template)

```bash
# First, encode your PDF to base64
PDF_BASE64=$(base64 -i paper.pdf)

curl -X POST http://localhost:3001/api/v1/projects/create \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"pdf_file\": \"$PDF_BASE64\",
    \"pdf_filename\": \"paper.pdf\",
    \"template\": \"html-developer\",
    \"instruction\": \"Create an interactive HTML page explaining the key concepts\"
  }"
```

### Get Project Status

```bash
curl -X GET http://localhost:3001/api/v1/projects/PROJECT_ID/status \
  -H "x-api-key: YOUR_API_KEY"
```

### Continue a Project

```bash
curl -X POST http://localhost:3001/api/v1/projects/PROJECT_ID/continue \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Add an interactive slider to control animation speed"
  }'
```

### Delete a Project

```bash
curl -X DELETE http://localhost:3001/api/projects/PROJECT_ID \
  -H "x-api-key: YOUR_API_KEY"
```

---

## Templates

| Template ID | Description | Output |
|-------------|-------------|--------|
| `explorable-research-developer` | React + Vite + Three.js | Modern SPA with 3D capabilities |
| `html-developer` | Static HTML + TailwindCSS + vanilla JS | No-build static site |

---

## Rate Limiting

Default: 10 requests per day per user. Configure via environment variables:
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window
- `RATE_LIMIT_WINDOW`: Time window (e.g., `1d`, `1h`)

---

## Timeouts

- **Request timeout**: 5 minutes (`maxDuration = 300`)
- **AI generation**: Typically 30-120 seconds
- **Sandbox creation**: Up to 60 seconds

---

## File Structure

```
app/api/v1/
├── projects/
│   ├── create/
│   │   └── route.ts          # POST /api/v1/projects/create
│   └── [project_id]/
│       ├── status/
│       │   └── route.ts      # GET /api/v1/projects/{id}/status
│       └── continue/
│           └── route.ts      # POST /api/v1/projects/{id}/continue

app/api/projects/
└── [project_id]/
    └── route.ts              # GET/DELETE /api/projects/{id}

lib/
├── api-v1-schemas.ts         # Zod validation schemas
├── arxiv.ts                  # ArXiv processing utilities
├── fragment-generator.ts     # Fragment generation helper
├── sandbox.ts                # Sandbox creation helper
└── __tests__/
    └── api-v1-integration.test.ts
```

---

## Implementation Status

All features are complete and tested:

- [x] Synchronous create endpoint (POST /api/v1/projects/create)
- [x] Synchronous continue endpoint (POST /api/v1/projects/{id}/continue)
- [x] Status endpoint (GET /api/v1/projects/{id}/status)
- [x] Project CRUD (GET/DELETE /api/projects/{id})
- [x] ArXiv URL processing
- [x] PDF file upload
- [x] Image attachments
- [x] Both templates (explorable-research-developer, html-developer)
- [x] API key authentication
- [x] Rate limiting
- [x] Integration tests
