'use client'

import { CopyButton } from './ui/copy-button'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { usePostHog } from 'posthog-js/react'
import { useState, useEffect, useCallback } from 'react'
import { Globe, Loader2, ExternalLink, Trash2, RefreshCw, AlertCircle } from 'lucide-react'

type PublishDialogProps = {
  projectId: string
  sbxId: string | undefined
  publishedUrl: string | null
  isStaticDeployed: boolean
  accessToken: string
  onPublishChange?: (published: boolean, url: string | null) => void
}

export function PublishDialog({
  projectId,
  sbxId,
  publishedUrl,
  isStaticDeployed,
  accessToken,
  onPublishChange,
}: PublishDialogProps) {
  const posthog = usePostHog()
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPublishedUrl, setLocalPublishedUrl] = useState<string | null>(
    publishedUrl,
  )
  const [isOutdated, setIsOutdated] = useState<boolean | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const isPublished = isStaticDeployed || !!localPublishedUrl

  const checkOutdatedStatus = useCallback(async () => {
    if (!isPublished || !accessToken || !projectId) return

    setIsCheckingStatus(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/publish/status`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        setIsOutdated(data.is_outdated ?? null)
      }
    } catch {
      // Silently fail - outdated status is not critical
    } finally {
      setIsCheckingStatus(false)
    }
  }, [isPublished, accessToken, projectId])

  // Check status when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && isPublished) {
      checkOutdatedStatus()
    }
  }, [isDropdownOpen, isPublished, checkOutdatedStatus])

  // Also check status on mount if published
  useEffect(() => {
    if (isPublished) {
      checkOutdatedStatus()
    }
  }, [isPublished, checkOutdatedStatus])

  async function handlePublish() {
    if (!sbxId) {
      setError('No active sandbox. Please run the preview first.')
      return
    }

    setIsPublishing(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish')
      }

      setLocalPublishedUrl(data.published_url)
      setIsOutdated(false) // Just published, so not outdated
      onPublishChange?.(true, data.published_url)

      posthog.capture('publish_static', {
        project_id: projectId,
        published_url: data.published_url,
        is_update: isPublished, // Track if this was an update
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleUnpublish() {
    setIsUnpublishing(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/publish`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to unpublish')
      }

      setLocalPublishedUrl(null)
      setIsOutdated(null)
      onPublishChange?.(false, null)

      posthog.capture('unpublish_static', {
        project_id: projectId,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish')
    } finally {
      setIsUnpublishing(false)
    }
  }

  // Determine button appearance
  const getButtonVariant = () => {
    if (!isPublished) return 'secondary'
    if (isOutdated) return 'default' // More prominent when update needed
    return 'outline'
  }

  const getButtonLabel = () => {
    if (!isPublished) return 'Publish'
    if (isOutdated) return 'Update'
    return 'Published'
  }

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={getButtonVariant()} size="sm" className="relative">
          {isOutdated ? (
            <RefreshCw className="mr-2 h-4 w-4" />
          ) : (
            <Globe className="mr-2 h-4 w-4" />
          )}
          {getButtonLabel()}
          {isOutdated && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-4 w-80 flex flex-col gap-3">
        <div className="text-sm font-semibold">Publish to Web</div>

        {isPublished && localPublishedUrl ? (
          <>
            {isOutdated && (
              <div className="flex items-start gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 p-2 rounded">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Your preview has changes that aren&apos;t published yet. Click
                  &quot;Update&quot; to publish the latest version.
                </span>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Your project is live at:
            </div>
            <div className="flex items-center gap-2">
              <Input value={localPublishedUrl} readOnly className="text-xs" />
              <CopyButton content={localPublishedUrl} />
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="shrink-0"
              >
                <a
                  href={localPublishedUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              {isOutdated && (
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing || !sbxId}
                  className="flex-1"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Update Published Site
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="destructive"
                size={isOutdated ? 'icon' : 'default'}
                onClick={handleUnpublish}
                disabled={isUnpublishing}
                className={isOutdated ? '' : 'w-full'}
              >
                {isUnpublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isOutdated ? (
                  <Trash2 className="h-4 w-4" />
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Unpublish
                  </>
                )}
              </Button>
            </div>
            {isCheckingStatus && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking for updates...
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Publish your project as a static website. It will be available at
              a unique URL on explorableresearch.com.
            </div>
            <div className="text-sm text-muted-foreground">
              The published site will stay online permanently until you
              unpublish it.
            </div>
            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                {error}
              </div>
            )}
            <Button
              onClick={handlePublish}
              disabled={isPublishing || !sbxId}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Publish Now
                </>
              )}
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
