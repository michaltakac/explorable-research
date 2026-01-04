'use client'

import { cn } from '@/lib/utils'
import { CopyButton } from '@/components/ui/copy-button'
import Prism from 'prismjs'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-javascript'
import '@/components/code-theme.css'
import { useEffect, useRef } from 'react'

type CodeBlockProps = {
  code: string
  language?: 'bash' | 'json' | 'python' | 'typescript' | 'javascript' | 'curl'
  title?: string
  showLineNumbers?: boolean
  className?: string
}

export function CodeBlock({
  code,
  language = 'bash',
  title,
  showLineNumbers = false,
  className,
}: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [code, language])

  // Map curl to bash for syntax highlighting
  const prismLanguage = language === 'curl' ? 'bash' : language

  return (
    <div className={cn('relative group rounded-lg overflow-hidden', className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <CopyButton content={code} variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
      <div className="relative">
        {!title && (
          <CopyButton
            content={code}
            variant="ghost"
            className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          />
        )}
        <pre
          className={cn(
            'overflow-x-auto p-4 text-sm bg-muted/50 dark:bg-muted/30',
            showLineNumbers && 'pl-12'
          )}
        >
          <code
            ref={codeRef}
            className={`language-${prismLanguage}`}
          >
            {code.trim()}
          </code>
        </pre>
      </div>
    </div>
  )
}

type InlineCodeProps = {
  children: React.ReactNode
  className?: string
}

export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm',
        className
      )}
    >
      {children}
    </code>
  )
}

