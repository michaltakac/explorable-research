import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBlock } from '@/components/docs/code-block'
import { Code2, Key, Layers, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'API Reference',
  description: 'Complete reference documentation for the Explorable Research REST API.',
}

const endpoints = [
  {
    title: 'Projects',
    description: 'Create, list, and manage your explorable projects.',
    href: '/docs/api/projects',
    icon: Layers,
    methods: ['GET', 'POST', 'DELETE'],
  },
  {
    title: 'API Keys',
    description: 'Manage your API keys for programmatic access.',
    href: '/docs/api/api-keys',
    icon: Key,
    methods: ['GET', 'POST', 'DELETE'],
  },
]

export default function ApiOverviewPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">API Reference</h1>
        <p className="text-xl text-muted-foreground">
          Integrate Explorable Research into your applications with our REST API.
        </p>
      </div>

      {/* Introduction */}
      <section className="space-y-4">
        <h2 id="introduction" className="text-2xl font-semibold">
          Introduction
        </h2>
        <p className="text-muted-foreground">
          The Explorable Research API allows you to programmatically access and manage 
          your projects and data. All API endpoints require authentication using an API key.
        </p>
      </section>

      {/* Base URL */}
      <section className="space-y-4">
        <h2 id="base-url" className="text-2xl font-semibold">
          Base URL
        </h2>
        <CodeBlock
          code="https://explorableresearch.com/api"
          language="bash"
        />
      </section>

      {/* Authentication */}
      <section className="space-y-4">
        <h2 id="authentication" className="text-2xl font-semibold">
          Authentication
        </h2>
        <p className="text-muted-foreground">
          All API requests must include your API key in the{' '}
          <code className="bg-muted px-1 rounded">x-api-key</code> header.
        </p>
        <CodeBlock
          code={`curl -X GET "https://explorableresearch.com/api/projects" \\
  -H "x-api-key: YOUR_API_KEY"`}
          language="curl"
          title="Example request with authentication"
        />
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an API key?{' '}
          <Link href="/profile/api-keys" className="text-primary hover:underline">
            Create one here
          </Link>
          .
        </p>
      </section>

      {/* Rate Limiting */}
      <section className="space-y-4">
        <h2 id="rate-limiting" className="text-2xl font-semibold">
          Rate Limiting
        </h2>
        <p className="text-muted-foreground">
          API requests are rate limited to ensure fair usage. Current limits are the same 
          as authenticated browser requests. Contact support if you need higher limits.
        </p>
      </section>

      {/* Error Handling */}
      <section className="space-y-4">
        <h2 id="errors" className="text-2xl font-semibold">
          Error Handling
        </h2>
        <p className="text-muted-foreground">
          The API uses standard HTTP status codes to indicate success or failure:
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <code className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded font-mono">
              200
            </code>
            <span className="text-muted-foreground">Success</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <code className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded font-mono">
              201
            </code>
            <span className="text-muted-foreground">Created</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <code className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded font-mono">
              204
            </code>
            <span className="text-muted-foreground">No Content (successful deletion)</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <code className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded font-mono">
              400
            </code>
            <span className="text-muted-foreground">Bad Request – Invalid input</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <code className="bg-destructive/10 text-destructive px-2 py-1 rounded font-mono">
              401
            </code>
            <span className="text-muted-foreground">Unauthorized – Invalid or missing API key</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <code className="bg-destructive/10 text-destructive px-2 py-1 rounded font-mono">
              404
            </code>
            <span className="text-muted-foreground">Not Found – Resource doesn&apos;t exist</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <code className="bg-destructive/10 text-destructive px-2 py-1 rounded font-mono">
              429
            </code>
            <span className="text-muted-foreground">Too Many Requests – Rate limited</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <code className="bg-destructive/10 text-destructive px-2 py-1 rounded font-mono">
              500
            </code>
            <span className="text-muted-foreground">Internal Server Error</span>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="space-y-4">
        <h2 id="endpoints" className="text-2xl font-semibold">
          Endpoints
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {endpoints.map((endpoint) => (
            <Link key={endpoint.href} href={endpoint.href}>
              <Card className="h-full transition-all hover:shadow-md hover:border-violet-500/50">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <endpoint.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-lg">{endpoint.title}</CardTitle>
                      <CardDescription>{endpoint.description}</CardDescription>
                      <div className="flex gap-1.5 flex-wrap">
                        {endpoint.methods.map((method) => (
                          <span
                            key={method}
                            className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                              method === 'GET'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : method === 'POST'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick examples */}
      <section className="space-y-4">
        <h2 id="quick-start" className="text-2xl font-semibold">
          Quick Examples
        </h2>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-medium">List all projects</h3>
            <CodeBlock
              code={`curl -X GET "https://explorableresearch.com/api/projects" \\
  -H "x-api-key: YOUR_API_KEY"`}
              language="curl"
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Get a specific project</h3>
            <CodeBlock
              code={`curl -X GET "https://explorableresearch.com/api/projects/PROJECT_ID" \\
  -H "x-api-key: YOUR_API_KEY"`}
              language="curl"
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Delete a project</h3>
            <CodeBlock
              code={`curl -X DELETE "https://explorableresearch.com/api/projects/PROJECT_ID" \\
  -H "x-api-key: YOUR_API_KEY"`}
              language="curl"
            />
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="space-y-4 pb-8">
        <h2 id="sdks" className="text-2xl font-semibold">
          SDKs & Libraries
        </h2>
        <p className="text-muted-foreground">
          Official SDKs are coming soon. In the meantime, use any HTTP client to interact 
          with the API. See our{' '}
          <Link href="/docs/api-keys" className="text-primary hover:underline">
            API Keys guide
          </Link>{' '}
          for examples in Python and JavaScript.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/docs/api/projects">
              Projects API
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/docs/api-keys">
              API Keys Guide
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}


