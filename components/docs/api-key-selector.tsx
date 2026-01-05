'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Key, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'

type ApiKeyMetadata = {
  id: string
  description: string
  prefix: string
  created_at: string
  last_used_at: string | null
  is_revoked: boolean
}

type ApiKeySelectorProps = {
  onKeySelect: (keyId: string | null) => void
  selectedKeyId: string | null
  className?: string
}

export function ApiKeySelector({
  onKeySelect,
  selectedKeyId,
  className,
}: ApiKeySelectorProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeyMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { session } = useAuth(() => {}, () => {})

  const fetchApiKeys = useCallback(async () => {
    if (!session?.access_token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/api-keys', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch API keys')
      }

      const data = await response.json()
      const activeKeys = data.keys.filter((k: ApiKeyMetadata) => !k.is_revoked)
      setApiKeys(activeKeys)
      
      // Auto-select first key if none selected
      if (activeKeys.length > 0 && !selectedKeyId) {
        onKeySelect(activeKeys[0].id)
      }
    } catch (err) {
      setError('Failed to load API keys')
      console.error('Failed to fetch API keys:', err)
    } finally {
      setIsLoading(false)
    }
  }, [session?.access_token, selectedKeyId, onKeySelect])

  useEffect(() => {
    fetchApiKeys()
  }, [fetchApiKeys])

  if (!session) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span className="text-amber-600 dark:text-amber-400">
            Sign in to use the interactive API playground
          </span>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading API keys...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
          <Button variant="link" size="sm" onClick={fetchApiKeys}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (apiKeys.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
          <Key className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">
            No API keys found.{' '}
            <Link href="/profile/api-keys" className="text-primary hover:underline">
              Create one
            </Link>{' '}
            to use the interactive playground.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <Key className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedKeyId || undefined}
          onValueChange={(value) => onKeySelect(value)}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select an API key" />
          </SelectTrigger>
          <SelectContent>
            {apiKeys.map((key) => (
              <SelectItem key={key.id} value={key.id}>
                <div className="flex items-center gap-2">
                  <span>{key.description}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({key.prefix.slice(0, 8)}...)
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}


