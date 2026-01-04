'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiKeySelector } from './api-key-selector'
import { JsonViewer } from './json-viewer'
import { MethodBadge } from './endpoint-card'
import { cn } from '@/lib/utils'
import { Loader2, Play, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type ApiPlaygroundProps = {
  method: HttpMethod
  endpoint: string
  defaultBody?: string
  pathParams?: {
    name: string
    placeholder: string
  }[]
  className?: string
}

type ResponseState = {
  status: 'idle' | 'loading' | 'success' | 'error'
  data?: Record<string, unknown> | string | null
  error?: string
  statusCode?: number
  duration?: number
}

export function ApiPlayground({
  method,
  endpoint,
  defaultBody,
  pathParams = [],
  className,
}: ApiPlaygroundProps) {
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string>('')
  const [body, setBody] = useState(defaultBody || '')
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [response, setResponse] = useState<ResponseState>({ status: 'idle' })
  const { session } = useAuth(() => {}, () => {})

  // Fetch the actual API key when a key ID is selected
  const fetchApiKey = useCallback(async (keyId: string) => {
    if (!session?.access_token) return

    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // We don't actually get the full key back for security
        // Instead, we'll use the session token for testing
        setApiKey(keyId)
      }
    } catch (err) {
      console.error('Failed to fetch API key:', err)
    }
  }, [session?.access_token])

  const handleKeySelect = useCallback((keyId: string | null) => {
    setSelectedKeyId(keyId)
    if (keyId) {
      fetchApiKey(keyId)
    } else {
      setApiKey('')
    }
  }, [fetchApiKey])

  const buildEndpoint = () => {
    let url = endpoint
    pathParams.forEach((param) => {
      const value = paramValues[param.name] || `:${param.name}`
      url = url.replace(`:${param.name}`, value)
    })
    return url
  }

  const handleExecute = async () => {
    if (!session?.access_token) {
      setResponse({
        status: 'error',
        error: 'Please sign in to use the API playground',
      })
      return
    }

    // Check if all required path params are filled
    const missingParams = pathParams.filter(
      (param) => !paramValues[param.name]
    )
    if (missingParams.length > 0) {
      setResponse({
        status: 'error',
        error: `Missing required parameters: ${missingParams.map((p) => p.name).join(', ')}`,
      })
      return
    }

    setResponse({ status: 'loading' })
    const startTime = performance.now()

    try {
      const url = buildEndpoint()
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      }

      if (method !== 'GET' && body) {
        try {
          // Validate JSON
          JSON.parse(body)
          options.body = body
        } catch {
          setResponse({
            status: 'error',
            error: 'Invalid JSON in request body',
          })
          return
        }
      }

      const res = await fetch(url, options)
      const duration = Math.round(performance.now() - startTime)

      let data
      const contentType = res.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await res.json()
      } else {
        data = await res.text()
      }

      setResponse({
        status: res.ok ? 'success' : 'error',
        data,
        statusCode: res.status,
        duration,
        error: res.ok ? undefined : `Request failed with status ${res.status}`,
      })
    } catch (err) {
      const duration = Math.round(performance.now() - startTime)
      setResponse({
        status: 'error',
        error: err instanceof Error ? err.message : 'Request failed',
        duration,
      })
    }
  }

  return (
    <Card className={cn('mt-4', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Play className="h-4 w-4" />
          Try it out
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key Selector */}
        <ApiKeySelector
          selectedKeyId={selectedKeyId}
          onKeySelect={handleKeySelect}
        />

        {/* Endpoint display */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <MethodBadge method={method} />
          <code className="text-sm font-mono flex-1 overflow-x-auto">
            {buildEndpoint()}
          </code>
        </div>

        {/* Path parameters */}
        {pathParams.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Path Parameters</Label>
            {pathParams.map((param) => (
              <div key={param.name} className="flex items-center gap-2">
                <Label className="w-24 text-sm font-mono text-muted-foreground">
                  {param.name}
                </Label>
                <Input
                  placeholder={param.placeholder}
                  value={paramValues[param.name] || ''}
                  onChange={(e) =>
                    setParamValues({ ...paramValues, [param.name]: e.target.value })
                  }
                  className="font-mono"
                />
              </div>
            ))}
          </div>
        )}

        {/* Request body */}
        {method !== 'GET' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Request Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="font-mono text-sm min-h-[100px]"
            />
          </div>
        )}

        {/* Execute button */}
        <Button
          onClick={handleExecute}
          disabled={response.status === 'loading' || !session}
          className="w-full"
        >
          {response.status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending request...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Send Request
            </>
          )}
        </Button>

        {/* Response */}
        <AnimatePresence mode="wait">
          {response.status !== 'idle' && response.status !== 'loading' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {/* Status bar */}
              <div className="flex items-center gap-3 text-sm">
                {response.status === 'success' ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Success</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Error</span>
                  </div>
                )}
                {response.statusCode && (
                  <span className="text-muted-foreground">
                    Status: <code>{response.statusCode}</code>
                  </span>
                )}
                {response.duration && (
                  <span className="text-muted-foreground">
                    Time: <code>{response.duration}ms</code>
                  </span>
                )}
              </div>

              {/* Response data */}
              {response.data && (
                <JsonViewer
                  data={response.data}
                  title="Response"
                  maxHeight="300px"
                />
              )}

              {/* Error message */}
              {response.error && !response.data && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {response.error}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

