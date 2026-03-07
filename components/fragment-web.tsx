import { CopyButton } from './ui/copy-button'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ExecutionResultWeb } from '@/lib/types'
import { RotateCw, AlertTriangle, Play, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

type FragmentWebProps = {
  result: ExecutionResultWeb
  onRegenerateSandbox?: () => Promise<void>
  isRegenerating?: boolean
}

export function FragmentWeb({ result, onRegenerateSandbox, isRegenerating }: FragmentWebProps) {
  const [iframeKey, setIframeKey] = useState(0)
  const [sandboxStatus, setSandboxStatus] = useState<'loading' | 'active' | 'expired'>('loading')

  useEffect(() => {
    // Check if sandbox is still alive using our API
    async function checkSandbox() {
      if (!result?.sbxId) {
        setSandboxStatus('expired')
        return
      }

      try {
        const response = await fetch(`/api/sandbox/${result.sbxId}/status`)
        if (!response.ok) {
          setSandboxStatus('expired')
          return
        }

        const data = await response.json()
        setSandboxStatus(data.alive ? 'active' : 'expired')
      } catch {
        // If the API call fails, assume the sandbox might still be active
        // and let the iframe show the error page if needed
        setSandboxStatus('active')
      }
    }

    checkSandbox()
  }, [result?.sbxId, iframeKey])

  if (!result) return null

  function refreshIframe() {
    setSandboxStatus('loading')
    setIframeKey((prevKey) => prevKey + 1)
  }

  // Extract sandbox ID from the URL for display
  const sandboxId = result.sbxId || result.url?.match(/https:\/\/(\d+-[a-z0-9]+)/)?.[1] || 'unknown'

  return (
    <div className="flex flex-col w-full h-full relative">
      {/* Sandbox Expired Overlay */}
      {sandboxStatus === 'expired' && onRegenerateSandbox && (
        <div className="absolute inset-0 z-10 bg-background/95 flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Sandbox Expired</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The sandbox <code className="px-1 py-0.5 bg-muted rounded text-xs">{sandboxId}</code> is no longer available.
              Sandboxes automatically expire after 10 minutes of inactivity.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Don&apos;t worry - your code is saved! Click below to create a new sandbox with your latest code.
            </p>
            <Button
              onClick={onRegenerateSandbox}
              disabled={isRegenerating}
              size="lg"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Sandbox...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Regenerate Sandbox
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <iframe
        key={iframeKey}
        className="h-full w-full"
        sandbox="allow-forms allow-scripts allow-same-origin"
        loading="lazy"
        src={result.url}
        onError={() => setSandboxStatus('expired')}
      />
      <div className="p-2 border-t">
        <div className="flex items-center bg-muted dark:bg-white/10 rounded-2xl">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="link"
                  className="text-muted-foreground"
                  onClick={refreshIframe}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-muted-foreground text-xs flex-1 text-ellipsis overflow-hidden whitespace-nowrap">
            {result.url}
          </span>
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <CopyButton
                  variant="link"
                  content={result.url}
                  className="text-muted-foreground"
                />
              </TooltipTrigger>
              <TooltipContent>Copy URL</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
