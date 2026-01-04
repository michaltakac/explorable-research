'use client'

import { cn } from '@/lib/utils'
import { CopyButton } from '@/components/ui/copy-button'
import { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-json'
import '@/components/code-theme.css'

type JsonViewerProps = {
  data: unknown
  title?: string
  className?: string
  maxHeight?: string
}

export function JsonViewer({
  data,
  title,
  className,
  maxHeight = '400px',
}: JsonViewerProps) {
  const codeRef = useRef<HTMLElement>(null)
  const jsonString = JSON.stringify(data, null, 2)

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [data])

  return (
    <div className={cn('relative group rounded-lg overflow-hidden border', className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <CopyButton
            content={jsonString}
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      )}
      <div className="relative">
        {!title && (
          <CopyButton
            content={jsonString}
            variant="ghost"
            className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          />
        )}
        <pre
          className="overflow-auto p-4 text-sm bg-muted/30"
          style={{ maxHeight }}
        >
          <code ref={codeRef} className="language-json">
            {jsonString}
          </code>
        </pre>
      </div>
    </div>
  )
}

