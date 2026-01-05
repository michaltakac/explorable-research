import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/docs/code-block'
import {
  Key,
  Shield,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Plus,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'API Keys Guide',
  description: 'Learn how to create, manage, and use API keys for programmatic access.',
}

export default function ApiKeysGuidePage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">API Keys Guide</h1>
        <p className="text-xl text-muted-foreground">
          API keys allow you to programmatically access the Explorable Research API 
          from scripts, notebooks, or external applications.
        </p>
      </div>

      {/* Overview */}
      <section className="space-y-4">
        <h2 id="overview" className="text-2xl font-semibold">
          Overview
        </h2>
        <p className="text-muted-foreground">
          API keys provide an alternative authentication method to browser-based sessions. 
          They enable:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-3">
            <div className="p-1.5 rounded bg-violet-500/10 mt-0.5">
              <Key className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <span className="font-medium">Programmatic Access</span>
              <p className="text-sm text-muted-foreground">
                Access your data from scripts, Jupyter notebooks, or automation tools
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="p-1.5 rounded bg-blue-500/10 mt-0.5">
              <ExternalLink className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <span className="font-medium">Integration</span>
              <p className="text-sm text-muted-foreground">
                Connect third-party tools and services to your Explorable Research account
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="p-1.5 rounded bg-emerald-500/10 mt-0.5">
              <RefreshCw className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <span className="font-medium">Automation</span>
              <p className="text-sm text-muted-foreground">
                Build workflows and integrations without manual login
              </p>
            </div>
          </li>
        </ul>
      </section>

      {/* Security */}
      <section className="space-y-4">
        <h2 id="security" className="text-2xl font-semibold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Security
        </h2>
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">
                Treat your API keys like passwords
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Never share them publicly or commit them to version control</li>
                <li>• Do not expose them in client-side code</li>
                <li>• Rotate keys if you suspect they have been compromised</li>
                <li>• Revoke unused keys</li>
              </ul>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground">
          API keys provide the same access level as your logged-in session. Any action 
          you can perform in the UI can be performed with your API key.
        </p>
      </section>

      {/* Creating API Keys */}
      <section className="space-y-4">
        <h2 id="creating-keys" className="text-2xl font-semibold flex items-center gap-2">
          <Plus className="h-6 w-6" />
          Creating API Keys
        </h2>
        <ol className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-medium">
              1
            </span>
            <div>
              <p className="font-medium">Navigate to API Keys</p>
              <p className="text-sm text-muted-foreground">
                Go to{' '}
                <Link href="/profile/api-keys" className="text-primary hover:underline">
                  Profile → API Keys
                </Link>{' '}
                (or go directly to <code className="bg-muted px-1 rounded">/profile/api-keys</code>)
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-medium">
              2
            </span>
            <div>
              <p className="font-medium">Click &ldquo;Create API Key&rdquo;</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-medium">
              3
            </span>
            <div>
              <p className="font-medium">Enter a descriptive name</p>
              <p className="text-sm text-muted-foreground">
                Examples: &ldquo;Jupyter Notebook&rdquo;, &ldquo;CI/CD Pipeline&rdquo;, &ldquo;Production Server&rdquo;
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-medium">
              4
            </span>
            <div>
              <p className="font-medium">Click &ldquo;Create Key&rdquo;</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-medium">
              5
            </span>
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">
                Copy the key immediately
              </p>
              <p className="text-sm text-muted-foreground">
                The full key will not be shown again for security reasons.
              </p>
            </div>
          </li>
        </ol>
        <Button asChild className="mt-4">
          <Link href="/profile/api-keys">
            Create API Key
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Using API Keys */}
      <section className="space-y-4">
        <h2 id="using-keys" className="text-2xl font-semibold">
          Using API Keys
        </h2>
        <p className="text-muted-foreground">
          Include your API key in the <code className="bg-muted px-1 rounded">x-api-key</code> header 
          of your HTTP requests:
        </p>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-medium">cURL</h3>
            <CodeBlock
              code={`curl -X GET "https://explorableresearch.com/api/projects" \\
  -H "x-api-key: YOUR_API_KEY"`}
              language="curl"
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Python</h3>
            <CodeBlock
              code={`import requests

API_KEY = "your_api_key_here"
BASE_URL = "https://explorableresearch.com"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# List your projects
response = requests.get(f"{BASE_URL}/api/projects", headers=headers)
projects = response.json()
print(projects)`}
              language="python"
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">JavaScript / TypeScript</h3>
            <CodeBlock
              code={`const API_KEY = "your_api_key_here";
const BASE_URL = "https://explorableresearch.com";

async function listProjects() {
  const response = await fetch(\`\${BASE_URL}/api/projects\`, {
    headers: {
      "x-api-key": API_KEY,
    },
  });
  return response.json();
}`}
              language="typescript"
            />
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="space-y-4">
        <h2 id="endpoints" className="text-2xl font-semibold">
          API Endpoints
        </h2>
        <p className="text-muted-foreground">
          All endpoints that support JWT authentication also support API key authentication:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium">Method</th>
                <th className="text-left py-2 pr-4 font-medium">Endpoint</th>
                <th className="text-left py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  <code className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-xs">
                    GET
                  </code>
                </td>
                <td className="py-2 pr-4 font-mono text-xs">/api/projects</td>
                <td className="py-2 text-muted-foreground">List your projects</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  <code className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-xs">
                    POST
                  </code>
                </td>
                <td className="py-2 pr-4 font-mono text-xs">/api/projects</td>
                <td className="py-2 text-muted-foreground">Create a new project</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  <code className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-xs">
                    GET
                  </code>
                </td>
                <td className="py-2 pr-4 font-mono text-xs">/api/projects/:id</td>
                <td className="py-2 text-muted-foreground">Get a specific project</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  <code className="bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-xs">
                    DELETE
                  </code>
                </td>
                <td className="py-2 pr-4 font-mono text-xs">/api/projects/:id</td>
                <td className="py-2 text-muted-foreground">Delete a project</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          See the{' '}
          <Link href="/docs/api" className="text-primary hover:underline">
            full API reference
          </Link>{' '}
          for detailed documentation.
        </p>
      </section>

      {/* Managing Keys */}
      <section className="space-y-4">
        <h2 id="managing-keys" className="text-2xl font-semibold">
          Managing API Keys
        </h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Viewing Keys</h3>
            <p className="text-sm text-muted-foreground">
              Go to{' '}
              <Link href="/profile/api-keys" className="text-primary hover:underline">
                Profile → API Keys
              </Link>{' '}
              to see all your active keys. The list shows:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Key name</li>
              <li>Partial key prefix (first 8 characters)</li>
              <li>Creation date</li>
              <li>Last used timestamp</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Rotating Keys
            </h3>
            <p className="text-sm text-muted-foreground">
              If you need to update a key (e.g., suspected compromise):
            </p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Click the rotate icon next to the key</li>
              <li>Confirm the rotation</li>
              <li>Copy the new key (the old key is immediately invalidated)</li>
              <li>Update your applications with the new key</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Revoking Keys
            </h3>
            <p className="text-sm text-muted-foreground">
              To permanently disable a key:
            </p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Click the trash icon next to the key</li>
              <li>Confirm the revocation</li>
              <li>The key is immediately invalidated</li>
            </ol>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              Note: Revocation cannot be undone. You&apos;ll need to create a new key 
              if you revoked one by mistake.
            </p>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="space-y-4">
        <h2 id="best-practices" className="text-2xl font-semibold">
          Best Practices
        </h2>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
              1
            </span>
            <div>
              <p className="font-medium">Use descriptive names</p>
              <p className="text-sm text-muted-foreground">
                Name keys by their use case (e.g., &ldquo;Production Server&rdquo;, &ldquo;Local Development&rdquo;)
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
              2
            </span>
            <div>
              <p className="font-medium">One key per application</p>
              <p className="text-sm text-muted-foreground">
                Create separate keys for different integrations
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
              3
            </span>
            <div>
              <p className="font-medium">Regular rotation</p>
              <p className="text-sm text-muted-foreground">
                Periodically rotate keys as a security measure
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
              4
            </span>
            <div>
              <p className="font-medium">Environment variables</p>
              <p className="text-sm text-muted-foreground">
                Store keys in environment variables, not in code
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
              5
            </span>
            <div>
              <p className="font-medium">Limit exposure</p>
              <p className="text-sm text-muted-foreground">
                Only grant API access where necessary
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-4">
        <h2 id="troubleshooting" className="text-2xl font-semibold">
          Troubleshooting
        </h2>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-medium text-destructive">&ldquo;Unauthorized&rdquo; Error</h3>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Verify the API key is correct and not revoked</li>
              <li>• Ensure the key is sent in the <code className="bg-muted px-1 rounded">x-api-key</code> header (not <code className="bg-muted px-1 rounded">Authorization</code>)</li>
              <li>• Check that your key hasn&apos;t expired</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-medium text-destructive">&ldquo;Invalid API key format&rdquo; Error</h3>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Ensure you&apos;re using the complete key (including the prefix)</li>
              <li>• The key should be a long string (160+ characters)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="space-y-4">
        <h2 id="rate-limits" className="text-2xl font-semibold">
          Rate Limits
        </h2>
        <p className="text-muted-foreground">
          Currently, API key requests have the same rate limits as regular authenticated 
          requests. Contact support if you need higher limits for your use case.
        </p>
      </section>

      {/* Support */}
      <section className="space-y-4 pb-8">
        <h2 id="support" className="text-2xl font-semibold">
          Support
        </h2>
        <p className="text-muted-foreground">
          If you encounter issues with API keys, please:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Check this documentation first</li>
          <li>Review the troubleshooting section</li>
          <li>
            <a 
              href="https://github.com/michaltakac/explorable-research/issues" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Open an issue on GitHub
            </a>{' '}
            with your key ID (not the full key) and error messages
          </li>
        </ol>
      </section>
    </div>
  )
}


