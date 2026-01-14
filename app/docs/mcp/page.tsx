import { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/docs/code-block'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Terminal,
  Settings,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Layers,
  FileText,
  List,
  Play,
  Cpu,
  Zap,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'MCP Server',
  description: 'Connect AI assistants to Explorable Research using the Model Context Protocol (MCP).',
}

const tools = [
  {
    name: 'create_project',
    description: 'Create a new explorable project from an ArXiv paper URL or PDF',
    icon: Layers,
  },
  {
    name: 'continue_project',
    description: 'Continue an existing project with additional instructions',
    icon: Play,
  },
  {
    name: 'get_project',
    description: 'Get details of an existing project including preview URL',
    icon: FileText,
  },
  {
    name: 'list_projects',
    description: 'List all your projects ordered by creation date',
    icon: List,
  },
  {
    name: 'list_models',
    description: 'List available AI models for project generation',
    icon: Cpu,
  },
]

export default function McpDocsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">MCP Server</h1>
        <p className="text-xl text-muted-foreground">
          Connect AI assistants like Claude, Cursor, and others to Explorable Research
          using the Model Context Protocol (MCP).
        </p>
      </div>

      {/* What is MCP */}
      <section className="space-y-4">
        <h2 id="overview" className="text-2xl font-semibold">
          What is MCP?
        </h2>
        <p className="text-muted-foreground">
          The{' '}
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Model Context Protocol (MCP)
          </a>{' '}
          is an open standard that enables AI assistants to securely connect to external
          tools and data sources. Our MCP server allows AI assistants to create, manage,
          and iterate on your explorable research projects on your behalf.
        </p>
      </section>

      {/* Endpoint */}
      <section className="space-y-4">
        <h2 id="endpoint" className="text-2xl font-semibold">
          Server Endpoint
        </h2>
        <CodeBlock
          code="https://mcp.explorableresearch.com/http"
          language="bash"
        />
        <p className="text-sm text-muted-foreground">
          This is the only endpoint you need. It uses the Streamable HTTP transport
          (recommended by the MCP specification).
        </p>
      </section>

      {/* Prerequisites */}
      <section className="space-y-4">
        <h2 id="prerequisites" className="text-2xl font-semibold">
          Prerequisites
        </h2>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-600 dark:text-amber-400">
              API Key Required
            </p>
            <p className="text-muted-foreground mt-1">
              You need an API key to authenticate with the MCP server.{' '}
              <Link href="/profile/api-keys" className="text-primary hover:underline">
                Create one here
              </Link>{' '}
              or see the{' '}
              <Link href="/docs/api-keys" className="text-primary hover:underline">
                API Keys guide
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* AI Tool Configuration */}
      <section className="space-y-6">
        <h2 id="setup" className="text-2xl font-semibold">
          Setup Guide
        </h2>
        <p className="text-muted-foreground">
          Choose your AI tool below and follow the configuration instructions.
        </p>

        <Tabs defaultValue="claude-code" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="claude-code" className="text-xs sm:text-sm">Claude Code</TabsTrigger>
            <TabsTrigger value="cursor" className="text-xs sm:text-sm">Cursor</TabsTrigger>
            <TabsTrigger value="windsurf" className="text-xs sm:text-sm">Windsurf</TabsTrigger>
            <TabsTrigger value="vscode" className="text-xs sm:text-sm">VS Code</TabsTrigger>
            <TabsTrigger value="claude-desktop" className="text-xs sm:text-sm">Claude Desktop</TabsTrigger>
            <TabsTrigger value="zed" className="text-xs sm:text-sm">Zed</TabsTrigger>
            <TabsTrigger value="opencode" className="text-xs sm:text-sm">Opencode</TabsTrigger>
          </TabsList>

          {/* Claude Code */}
          <TabsContent value="claude-code" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Claude Code
              </h3>
              <p className="text-sm text-muted-foreground">
                Add the MCP server using the Claude Code CLI:
              </p>
              <CodeBlock
                code={`claude mcp add explorable-research \\
  --transport http \\
  --header "x-api-key: YOUR_API_KEY" \\
  https://mcp.explorableresearch.com/http`}
                language="bash"
                title="Add MCP server"
              />
              <p className="text-sm text-muted-foreground">
                Or add it manually to your Claude Code MCP settings file:
              </p>
              <CodeBlock
                code={`{
  "mcpServers": {
    "explorable-research": {
      "type": "http",
      "url": "https://mcp.explorableresearch.com/http",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}`}
                language="json"
                title="~/.claude/settings.json"
              />
            </div>
          </TabsContent>

          {/* Cursor */}
          <TabsContent value="cursor" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cursor
              </h3>
              <p className="text-sm text-muted-foreground">
                Add the following to your Cursor MCP settings. Go to{' '}
                <code className="bg-muted px-1 rounded text-xs">Cursor Settings &gt; Features &gt; MCP</code>{' '}
                or edit the config file directly:
              </p>
              <CodeBlock
                code={`{
  "mcpServers": {
    "explorable-research": {
      "url": "https://mcp.explorableresearch.com/http",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}`}
                language="json"
                title="~/.cursor/mcp.json"
              />
            </div>
          </TabsContent>

          {/* Windsurf */}
          <TabsContent value="windsurf" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Windsurf
              </h3>
              <p className="text-sm text-muted-foreground">
                Add the following to your Windsurf MCP configuration file:
              </p>
              <CodeBlock
                code={`{
  "mcpServers": {
    "explorable-research": {
      "serverUrl": "https://mcp.explorableresearch.com/http",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}`}
                language="json"
                title="~/.codeium/windsurf/mcp_config.json"
              />
            </div>
          </TabsContent>

          {/* VS Code */}
          <TabsContent value="vscode" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                VS Code (with GitHub Copilot)
              </h3>
              <p className="text-sm text-muted-foreground">
                If you have GitHub Copilot with MCP support enabled, add this to your VS Code settings:
              </p>
              <CodeBlock
                code={`{
  "mcp": {
    "servers": {
      "explorable-research": {
        "type": "http",
        "url": "https://mcp.explorableresearch.com/http",
        "headers": {
          "x-api-key": "YOUR_API_KEY"
        }
      }
    }
  }
}`}
                language="json"
                title="settings.json"
              />
              <p className="text-sm text-muted-foreground">
                Or use the <code className="bg-muted px-1 rounded text-xs">.vscode/mcp.json</code> file
                in your project:
              </p>
              <CodeBlock
                code={`{
  "servers": {
    "explorable-research": {
      "type": "http",
      "url": "https://mcp.explorableresearch.com/http",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}`}
                language="json"
                title=".vscode/mcp.json"
              />
            </div>
          </TabsContent>

          {/* Claude Desktop */}
          <TabsContent value="claude-desktop" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Claude Desktop
              </h3>
              <p className="text-sm text-muted-foreground">
                Add the following to your Claude Desktop configuration file:
              </p>
              <CodeBlock
                code={`{
  "mcpServers": {
    "explorable-research": {
      "url": "https://mcp.explorableresearch.com/http",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}`}
                language="json"
                title="claude_desktop_config.json"
              />
              <p className="text-sm text-muted-foreground">
                Config file location:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                <li>macOS: <code className="bg-muted px-1 rounded text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
                <li>Windows: <code className="bg-muted px-1 rounded text-xs">%APPDATA%\Claude\claude_desktop_config.json</code></li>
              </ul>
            </div>
          </TabsContent>

          {/* Zed */}
          <TabsContent value="zed" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Zed
              </h3>
              <p className="text-sm text-muted-foreground">
                Add the following to your Zed settings (<code className="bg-muted px-1 rounded text-xs">~/.config/zed/settings.json</code>):
              </p>
              <CodeBlock
                code={`{
  "context_servers": {
    "explorable-research": {
      "settings": {
        "url": "https://mcp.explorableresearch.com/http",
        "headers": {
          "x-api-key": "YOUR_API_KEY"
        }
      }
    }
  }
}`}
                language="json"
                title="settings.json"
              />
            </div>
          </TabsContent>

          {/* Opencode */}
          <TabsContent value="opencode" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Opencode
              </h3>
              <p className="text-sm text-muted-foreground">
                Add the following to your Opencode configuration:
              </p>
              <CodeBlock
                code={`{
  "mcp": {
    "explorable-research": {
      "type": "remote",
      "url": "https://mcp.explorableresearch.com/http",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      },
      "enabled": true
    }
  }
}`}
                language="json"
                title="opencode.json"
              />
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Available Tools */}
      <section className="space-y-4">
        <h2 id="tools" className="text-2xl font-semibold">
          Available Tools
        </h2>
        <p className="text-muted-foreground">
          Once connected, your AI assistant will have access to these tools:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {tools.map((tool) => (
            <Card key={tool.name} className="bg-muted/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <tool.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-mono">{tool.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {tool.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Usage Examples */}
      <section className="space-y-4">
        <h2 id="usage" className="text-2xl font-semibold">
          Usage Examples
        </h2>
        <p className="text-muted-foreground">
          Once the MCP server is configured, you can ask your AI assistant to:
        </p>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="font-medium text-sm mb-2">Create a new project</p>
            <p className="text-sm text-muted-foreground italic">
              &quot;Create an explorable visualization from this ArXiv paper: https://arxiv.org/abs/1706.03762&quot;
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="font-medium text-sm mb-2">Iterate on an existing project</p>
            <p className="text-sm text-muted-foreground italic">
              &quot;Continue project abc123 and add interactive sliders to control the learning rate&quot;
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="font-medium text-sm mb-2">List your projects</p>
            <p className="text-sm text-muted-foreground italic">
              &quot;Show me my recent explorable research projects&quot;
            </p>
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="space-y-4">
        <h2 id="verify" className="text-2xl font-semibold">
          Verify Connection
        </h2>
        <p className="text-muted-foreground">
          To verify your MCP server is working, ask your AI assistant:
        </p>
        <div className="p-4 rounded-lg bg-muted/30 border">
          <p className="text-sm text-muted-foreground italic">
            &quot;List the available AI models from Explorable Research&quot;
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          If configured correctly, you should see a list of available models.
        </p>
      </section>

      {/* Rate Limits */}
      <section className="space-y-4">
        <h2 id="rate-limits" className="text-2xl font-semibold">
          Rate Limits
        </h2>
        <p className="text-muted-foreground">
          The MCP server enforces rate limits on project creation and modification:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
          <li><strong>create_project</strong> and <strong>continue_project</strong>: 10 requests per day</li>
          <li><strong>get_project</strong>, <strong>list_projects</strong>, <strong>list_models</strong>: No limit</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">
          Contact support if you need higher limits for your use case.
        </p>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-4 pb-8">
        <h2 id="troubleshooting" className="text-2xl font-semibold">
          Troubleshooting
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Authentication errors</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Verify your API key is correct and not revoked</li>
              <li>Ensure the header is named <code className="bg-muted px-1 rounded text-xs">x-api-key</code> (not <code className="bg-muted px-1 rounded text-xs">api-key</code>)</li>
              <li>Check that your API key hasn&apos;t expired</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Connection issues</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Ensure your AI tool supports HTTP transport for MCP</li>
              <li>Try restarting your AI tool after adding the configuration</li>
              <li>Check that the URL is exactly <code className="bg-muted px-1 rounded text-xs">https://mcp.explorableresearch.com/http</code></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Tools not appearing</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Some AI tools require a restart after configuration changes</li>
              <li>Check your tool&apos;s logs for any MCP connection errors</li>
              <li>Verify the JSON configuration is valid (no trailing commas, proper quotes)</li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Still having issues? Check the{' '}
          <Link href="/docs/api-keys" className="text-primary hover:underline">
            API Keys guide
          </Link>{' '}
          or contact support.
        </p>
      </section>
    </div>
  )
}
