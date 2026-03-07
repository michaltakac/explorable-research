'use client'

import { FragmentInterpreter } from './fragment-interpreter'
import { FragmentWeb } from './fragment-web'
import { getTemplateId } from '@/lib/templates'
import {
  ExecutionResult,
  ExecutionResultInterpreter,
  ExecutionResultWeb,
} from '@/lib/types'

type FragmentPreviewProps = {
  result: ExecutionResult
  onRegenerateSandbox?: () => Promise<void>
  isRegenerating?: boolean
}

export function FragmentPreview({ result, onRegenerateSandbox, isRegenerating }: FragmentPreviewProps) {
  if (getTemplateId(result.template) === 'code-interpreter-v1') {
    return <FragmentInterpreter result={result as ExecutionResultInterpreter} />
  }

  return (
    <FragmentWeb
      result={result as ExecutionResultWeb}
      onRegenerateSandbox={onRegenerateSandbox}
      isRegenerating={isRegenerating}
    />
  )
}
