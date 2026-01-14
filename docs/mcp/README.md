# MCP Server Documentation

The Explorable Research MCP (Model Context Protocol) server allows AI assistants like Claude to interact with your projects programmatically.

## Overview

MCP is a standard protocol for LLM context exchange. Our MCP server exposes tools that enable:

- **Project Creation**: Transform ArXiv papers or PDFs into interactive visualizations
- **Project Iteration**: Continue refining projects with natural language instructions
- **Project Management**: List, retrieve, and manage your projects

## Endpoint URLs

| Environment | URL |
|-------------|-----|
| Production | `https://mcp.explorableresearch.com/http` |
| Local Development | `http://localhost:3000/api/mcp/http` |

## Authentication

All MCP requests require API key authentication. See [API Keys Documentation](../api-keys.md) for creating and managing keys.

Include your API key in the `x-api-key` header:

```
x-api-key: YOUR_API_KEY
```

Alternatively, use the `Authorization` header with a Bearer token:

```
Authorization: Bearer YOUR_API_KEY
```

## Available Tools

### create_project

Create a new explorable research project from an ArXiv paper URL or uploaded PDF.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `arxiv_url` | string | No* | ArXiv paper URL (e.g., `https://arxiv.org/abs/1706.03762`) |
| `pdf_file` | string | No* | Base64-encoded PDF file content |
| `pdf_filename` | string | No | Filename for the PDF (required if `pdf_file` is provided) |
| `instruction` | string | No | Additional instructions for the AI (max 10,000 chars) |
| `template` | string | No | Template to use: `html-developer` or `explorable-research-developer` (default) |
| `model` | string | No | Model ID to use (see `list_models` tool) |

*Either `arxiv_url` or `pdf_file` must be provided.

**Response:**

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "status": "ready",
    "title": "Project Title",
    "description": "Project description",
    "created_at": "2024-01-14T12:00:00Z",
    "updated_at": "2024-01-14T12:00:00Z",
    "preview_url": "https://...",
    "sandbox_id": "sbx_...",
    "template": "explorable-research-developer"
  }
}
```

### continue_project

Continue an existing project with additional instructions. Updates the visualization based on new requirements.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | Yes | The project UUID to continue |
| `instruction` | string | Yes | Instructions for modifying the visualization (1-10,000 chars) |
| `model` | string | No | Model ID to use (see `list_models` tool) |

**Response:**

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "status": "ready",
    "title": "Updated Title",
    "description": "Updated description",
    "created_at": "2024-01-14T12:00:00Z",
    "updated_at": "2024-01-14T12:30:00Z",
    "preview_url": "https://...",
    "sandbox_id": "sbx_...",
    "template": "explorable-research-developer"
  }
}
```

### get_project

Get details of an existing project including status and preview URL.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | Yes | The project UUID to retrieve |

**Response:**

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "status": "ready",
    "title": "Project Title",
    "description": "Project description",
    "created_at": "2024-01-14T12:00:00Z",
    "updated_at": "2024-01-14T12:00:00Z",
    "preview_url": "https://...",
    "sandbox_id": "sbx_...",
    "template": "explorable-research-developer"
  }
}
```

### list_projects

List all projects for the authenticated user, ordered by creation date (newest first).

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `limit` | number | No | 20 | Maximum projects to return (1-100) |
| `offset` | number | No | 0 | Number of projects to skip |

**Response:**

```json
{
  "success": true,
  "projects": [
    {
      "id": "uuid",
      "title": "Project Title",
      "description": "Project description",
      "status": "ready",
      "created_at": "2024-01-14T12:00:00Z",
      "updated_at": "2024-01-14T12:00:00Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

### list_models

List all available AI models that can be used for project creation.

**Parameters:** None

**Response:**

```json
{
  "success": true,
  "models": [
    {
      "id": "anthropic/claude-sonnet-4-20250514",
      "name": "Claude Sonnet 4",
      "provider": "anthropic"
    }
  ],
  "default_model": "anthropic/claude-sonnet-4-20250514"
}
```

## Error Responses

All tools return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid API key |
| `RATE_LIMITED` | Rate limit exceeded |
| `VALIDATION_ERROR` | Invalid input parameters |
| `NOT_FOUND` | Project not found |
| `PROJECT_NOT_READY` | Project is still processing |
| `ARXIV_ERROR` | Failed to fetch ArXiv paper |
| `PDF_TOO_LARGE` | PDF exceeds 10MB limit |
| `INVALID_PDF` | Invalid base64-encoded PDF |
| `INVALID_MODEL` | Unknown model ID |
| `GENERATION_FAILED` | AI generation failed |
| `SANDBOX_FAILED` | Sandbox creation/update failed |
| `DATABASE_ERROR` | Database operation failed |
| `TEMPLATE_NOT_FOUND` | Unknown template ID |

## Rate Limits

The MCP server enforces rate limits on expensive operations:

- **Rate limited tools**: `create_project`, `continue_project`
- **Default limit**: 10 requests per day
- **Read operations**: `get_project`, `list_projects`, `list_models` are not rate limited

When rate limited, you'll receive:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 10,
      "remaining": 0,
      "reset": 1705276800000
    }
  }
}
```

## Configuring MCP Clients

### Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "explorable-research": {
      "url": "https://mcp.explorableresearch.com/http",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}
```

### Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "explorable-research": {
      "type": "http",
      "url": "https://mcp.explorableresearch.com/http",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "explorable-research": {
      "url": "https://mcp.explorableresearch.com/http",
      "transport": "http",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}
```

## Testing with cURL

You can test the MCP server directly with cURL:

```bash
# Initialize connection
curl -X POST "https://mcp.explorableresearch.com/http" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": { "name": "test", "version": "1.0.0" }
    }
  }'

# List available tools
curl -X POST "https://mcp.explorableresearch.com/http" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Mcp-Session-Id: SESSION_ID_FROM_INIT" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'

# Call list_models tool
curl -X POST "https://mcp.explorableresearch.com/http" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Mcp-Session-Id: SESSION_ID_FROM_INIT" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "list_models",
      "arguments": {}
    }
  }'
```

## Technical Details

### Transport

The MCP server uses **Streamable HTTP** transport (recommended by MCP spec over deprecated SSE):

- Endpoint: `/http` (or `/api/mcp/http` locally)
- Method: `POST`
- Content-Type: `application/json`
- Accept: `application/json, text/event-stream`

### Session Management

The server uses session IDs returned in the `Mcp-Session-Id` header. Include this header in subsequent requests to maintain session state.

### Timeout

Operations have a 5-minute (300 second) timeout to accommodate AI generation time.

## Troubleshooting

### "Unauthorized" Error

- Verify your API key is correct and not revoked
- Ensure the key is in `x-api-key` header or `Authorization: Bearer` header
- Check that your key hasn't expired

### "Client must accept both application/json and text/event-stream"

Include both content types in your Accept header:
```
Accept: application/json, text/event-stream
```

### Project Creation Timeout

Large PDFs or complex papers may take several minutes to process. The server has a 5-minute timeout. If you experience timeouts:

1. Try with a smaller PDF
2. Use simpler instructions
3. Check the project status with `get_project` if creation started

### Rate Limit Exceeded

Wait until the reset time shown in the error response, or contact support for limit increases.

## Support

If you encounter issues:

1. Check this documentation
2. Review error codes and messages
3. Contact support with your error details (not your API key)
