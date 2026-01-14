# MCP Server Documentation

The Explorable Research MCP (Model Context Protocol) server allows AI assistants like Claude to interact with your projects programmatically.

## Server Endpoint

```
https://mcp.explorableresearch.com/http
```

## Quick Setup

### Prerequisites

You need an API key to authenticate. Create one at [Profile > API Keys](https://explorableresearch.com/profile/api-keys).

### Claude Code

```bash
claude mcp add explorable-research \
  --transport http \
  --header "x-api-key: YOUR_API_KEY" \
  https://mcp.explorableresearch.com/http
```

### Cursor

Add to `~/.cursor/mcp.json`:

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

### Claude Desktop

Add to `claude_desktop_config.json`:

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

## Available Tools

| Tool | Description |
|------|-------------|
| `create_project` | Create a new project from ArXiv URL or PDF |
| `continue_project` | Continue iterating on an existing project |
| `get_project` | Get project details and preview URL |
| `list_projects` | List all your projects |
| `list_models` | List available AI models |

## Full Documentation

For complete documentation including all AI tool configurations, parameters, error codes, and troubleshooting, visit:

**[https://explorableresearch.com/docs/mcp](https://explorableresearch.com/docs/mcp)**
