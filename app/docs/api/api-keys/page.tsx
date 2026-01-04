'use client'

import { EndpointCard } from '@/components/docs/endpoint-card'
import { ApiPlayground } from '@/components/docs/api-playground'
import { Separator } from '@/components/ui/separator'
import { AlertCircle } from 'lucide-react'

export default function ApiKeysApiPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">API Keys API</h1>
        <p className="text-xl text-muted-foreground">
          Manage your API keys programmatically.
        </p>
      </div>

      {/* Note */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-600 dark:text-amber-400">
            Authentication Required
          </p>
          <p className="text-muted-foreground mt-1">
            The API Keys endpoints require a valid session token (JWT) in the Authorization header, 
            not an API key. These endpoints are primarily used by the web application.
          </p>
        </div>
      </div>

      {/* List API Keys */}
      <section className="space-y-4">
        <h2 id="list-keys" className="text-2xl font-semibold">
          List API Keys
        </h2>
        <EndpointCard
          method="GET"
          endpoint="/api/api-keys"
          title="List all API keys"
          description="Returns a list of all API keys for the authenticated user. Only metadata is returned; the actual key values are not exposed."
          requestExample={{
            language: 'curl',
            code: `curl -X GET "https://explorableresearch.com/api/api-keys" \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"`,
          }}
          responseExample={{
            code: `{
  "keys": [
    {
      "id": "key-uuid-here",
      "description": "Production API",
      "prefix": "sk_live_abc123...",
      "created_at": "2024-01-15T10:30:00Z",
      "last_used_at": "2024-01-20T14:22:00Z",
      "is_revoked": false,
      "expires_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "key-uuid-here-2",
      "description": "Development",
      "prefix": "sk_test_xyz789...",
      "created_at": "2024-01-10T08:00:00Z",
      "last_used_at": null,
      "is_revoked": false,
      "expires_at": "2025-01-10T08:00:00Z"
    }
  ]
}`,
          }}
        >
          <ApiPlayground
            method="GET"
            endpoint="/api/api-keys"
          />
        </EndpointCard>
      </section>

      <Separator />

      {/* Create API Key */}
      <section className="space-y-4">
        <h2 id="create-key" className="text-2xl font-semibold">
          Create API Key
        </h2>
        <EndpointCard
          method="POST"
          endpoint="/api/api-keys"
          title="Create a new API key"
          description="Creates a new API key. The full key is returned only once in the response; make sure to save it immediately."
          parameters={[
            {
              name: 'description',
              type: 'string',
              required: true,
              description: 'A descriptive name for the key (max 255 characters, alphanumeric with spaces, underscores, and hyphens)',
            },
            {
              name: 'scope',
              type: 'string',
              required: false,
              description: 'Optional scope for the key (reserved for future use)',
            },
          ]}
          requestExample={{
            language: 'curl',
            code: `curl -X POST "https://explorableresearch.com/api/api-keys" \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"description": "Production API"}'`,
          }}
          responseExample={{
            code: `{
  "api_key": "sk_live_abc123def456ghi789...",
  "api_key_id": "key-uuid-here"
}`,
            title: 'Response (201 Created)',
          }}
        >
          <ApiPlayground
            method="POST"
            endpoint="/api/api-keys"
            defaultBody='{"description": "My New API Key"}'
          />
        </EndpointCard>
      </section>

      <Separator />

      {/* Get API Key */}
      <section className="space-y-4">
        <h2 id="get-key" className="text-2xl font-semibold">
          Get API Key
        </h2>
        <EndpointCard
          method="GET"
          endpoint="/api/api-keys/:key_id"
          title="Get API key metadata"
          description="Retrieves metadata for a specific API key. The actual key value is never returned."
          parameters={[
            {
              name: 'key_id',
              type: 'string',
              required: true,
              description: 'The unique identifier of the API key',
            },
          ]}
          requestExample={{
            language: 'curl',
            code: `curl -X GET "https://explorableresearch.com/api/api-keys/key-uuid-here" \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"`,
          }}
          responseExample={{
            code: `{
  "key": {
    "id": "key-uuid-here",
    "description": "Production API",
    "prefix": "sk_live_abc123...",
    "created_at": "2024-01-15T10:30:00Z",
    "last_used_at": "2024-01-20T14:22:00Z",
    "is_revoked": false,
    "expires_at": "2025-01-15T10:30:00Z"
  }
}`,
          }}
        >
          <ApiPlayground
            method="GET"
            endpoint="/api/api-keys/:key_id"
            pathParams={[
              { name: 'key_id', placeholder: 'Enter key ID' },
            ]}
          />
        </EndpointCard>
      </section>

      <Separator />

      {/* Revoke API Key */}
      <section className="space-y-4">
        <h2 id="revoke-key" className="text-2xl font-semibold">
          Revoke API Key
        </h2>
        <EndpointCard
          method="DELETE"
          endpoint="/api/api-keys/:key_id"
          title="Revoke an API key"
          description="Permanently revokes an API key. This action cannot be undone. Any applications using this key will immediately lose access."
          parameters={[
            {
              name: 'key_id',
              type: 'string',
              required: true,
              description: 'The unique identifier of the API key to revoke',
            },
          ]}
          requestExample={{
            language: 'curl',
            code: `curl -X DELETE "https://explorableresearch.com/api/api-keys/key-uuid-here" \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"`,
          }}
          responseExample={{
            code: `// Returns 204 No Content on success`,
            title: 'Success Response',
          }}
        >
          <ApiPlayground
            method="DELETE"
            endpoint="/api/api-keys/:key_id"
            pathParams={[
              { name: 'key_id', placeholder: 'Enter key ID to revoke' },
            ]}
          />
        </EndpointCard>
      </section>

      <Separator />

      {/* Rotate API Key */}
      <section className="space-y-4 pb-8">
        <h2 id="rotate-key" className="text-2xl font-semibold">
          Rotate API Key
        </h2>
        <EndpointCard
          method="POST"
          endpoint="/api/api-keys/:key_id?action=rotate"
          title="Rotate an API key"
          description="Generates a new API key and immediately revokes the old one. The new key is returned in the response. Update your applications promptly."
          parameters={[
            {
              name: 'key_id',
              type: 'string',
              required: true,
              description: 'The unique identifier of the API key to rotate',
            },
            {
              name: 'action',
              type: 'string',
              required: true,
              description: 'Must be set to "rotate"',
            },
          ]}
          requestExample={{
            language: 'curl',
            code: `curl -X POST "https://explorableresearch.com/api/api-keys/key-uuid-here?action=rotate" \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"`,
          }}
          responseExample={{
            code: `{
  "api_key": "sk_live_new_key_xyz789...",
  "api_key_id": "new-key-uuid-here"
}`,
            title: 'Response (200 OK)',
          }}
        >
          <ApiPlayground
            method="POST"
            endpoint="/api/api-keys/:key_id?action=rotate"
            pathParams={[
              { name: 'key_id', placeholder: 'Enter key ID to rotate' },
            ]}
          />
        </EndpointCard>
      </section>
    </div>
  )
}

