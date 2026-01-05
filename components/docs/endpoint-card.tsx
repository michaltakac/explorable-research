'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBlock } from './code-block'
import { motion } from 'framer-motion'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  POST: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  PUT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  PATCH: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
}

type EndpointCardProps = {
  method: HttpMethod
  endpoint: string
  title: string
  description: string
  requestExample?: {
    language?: 'bash' | 'json' | 'python' | 'typescript' | 'curl'
    code: string
    title?: string
  }
  responseExample?: {
    code: string
    title?: string
  }
  parameters?: {
    name: string
    type: string
    required: boolean
    description: string
  }[]
  children?: React.ReactNode
  className?: string
}

export function EndpointCard({
  method,
  endpoint,
  title,
  description,
  requestExample,
  responseExample,
  parameters,
  children,
  className,
}: EndpointCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className={cn('font-mono font-semibold', methodColors[method])}>
              {method}
            </Badge>
            <code className="text-sm font-mono text-muted-foreground">{endpoint}</code>
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Parameters */}
          {parameters && parameters.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Parameters</h4>
              <div className="space-y-3">
                {parameters.map((param) => (
                  <div
                    key={param.name}
                    className="flex flex-col sm:flex-row sm:items-start gap-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <code className="font-mono text-foreground">{param.name}</code>
                      {param.required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-muted-foreground text-xs font-mono">{param.type}</span>
                      <p className="text-muted-foreground mt-0.5">{param.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Example */}
          {requestExample && (
            <div>
              <h4 className="text-sm font-medium mb-3">Request</h4>
              <CodeBlock
                code={requestExample.code}
                language={requestExample.language || 'curl'}
                title={requestExample.title}
              />
            </div>
          )}

          {/* Response Example */}
          {responseExample && (
            <div>
              <h4 className="text-sm font-medium mb-3">Response</h4>
              <CodeBlock
                code={responseExample.code}
                language="json"
                title={responseExample.title || 'Response'}
              />
            </div>
          )}

          {/* Interactive playground slot */}
          {children}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <Badge variant="outline" className={cn('font-mono font-semibold', methodColors[method])}>
      {method}
    </Badge>
  )
}


