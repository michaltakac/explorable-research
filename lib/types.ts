import { ExecutionError, Result } from '@e2b/code-interpreter'

// Project status values for async project creation pipeline
export type ProjectStatus =
  | 'created'
  | 'generating_code'
  | 'creating_sandbox'
  | 'installing_dependencies'
  | 'executing_code'
  | 'ready'
  | 'failed'

export type ProjectStatusResponse = {
  id: string
  status: ProjectStatus
  error_message?: string | null
  updated_at: string
}

type ExecutionResultBase = {
  sbxId: string
}

export type ExecutionResultInterpreter = ExecutionResultBase & {
  template: string
  stdout: string[]
  stderr: string[]
  runtimeError?: ExecutionError
  cellResults: Result[]
}

export type ExecutionResultWeb = ExecutionResultBase & {
  template: string
  url: string
}

export type ExecutionResult = ExecutionResultInterpreter | ExecutionResultWeb
