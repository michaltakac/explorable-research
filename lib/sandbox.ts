import { Sandbox } from '@e2b/code-interpreter'
import { FragmentSchema } from './schema'
import {
  ExecutionResult,
  ExecutionResultInterpreter,
  ExecutionResultWeb,
} from './types'

// Default sandbox timeout: 10 minutes
const DEFAULT_SANDBOX_TIMEOUT = 10 * 60 * 1000

export type SandboxCreationResult = {
  success: true
  result: ExecutionResult
}

export type SandboxCreationError = {
  success: false
  error: string
  errorCode?: 'SANDBOX_CREATION_FAILED' | 'DEPENDENCY_INSTALL_FAILED' | 'CODE_WRITE_FAILED' | 'EXECUTION_FAILED'
}

export type SandboxOptions = {
  userId?: string
  timeoutMs?: number
}

/**
 * Create a sandbox from a fragment and execute/deploy the code
 */
export async function createSandboxFromFragment(
  fragment: FragmentSchema,
  options?: SandboxOptions
): Promise<SandboxCreationResult | SandboxCreationError> {
  const timeoutMs = options?.timeoutMs || DEFAULT_SANDBOX_TIMEOUT
  const userId = options?.userId || ''

  let sbx: Sandbox | null = null

  try {
    // Create the sandbox
    sbx = await Sandbox.create(fragment.template, {
      metadata: {
        template: fragment.template,
        userID: userId,
      },
      timeoutMs,
    })

    // Install additional dependencies if needed
    if (fragment.has_additional_dependencies && fragment.install_dependencies_command) {
      try {
        await sbx.commands.run(fragment.install_dependencies_command)
      } catch (error) {
        console.error('Failed to install dependencies:', error)
        return {
          success: false,
          error: `Failed to install dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`,
          errorCode: 'DEPENDENCY_INSTALL_FAILED',
        }
      }
    }

    // Write code to the filesystem
    try {
      if (fragment.code && Array.isArray(fragment.code)) {
        // Multiple files
        for (const file of fragment.code as Array<{ file_path: string; file_content: string }>) {
          await sbx.files.write(file.file_path, file.file_content)
        }
      } else if (fragment.code && fragment.file_path) {
        // Single file
        await sbx.files.write(fragment.file_path, fragment.code)
      }
    } catch (error) {
      console.error('Failed to write code:', error)
      return {
        success: false,
        error: `Failed to write code to sandbox: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'CODE_WRITE_FAILED',
      }
    }

    // Execute code or return URL depending on template
    if (fragment.template === 'code-interpreter-v1') {
      try {
        const { logs, error, results } = await sbx.runCode(fragment.code || '')

        const result: ExecutionResultInterpreter = {
          sbxId: sbx.sandboxId,
          template: fragment.template,
          stdout: logs.stdout,
          stderr: logs.stderr,
          runtimeError: error,
          cellResults: results,
        }

        return {
          success: true,
          result,
        }
      } catch (error) {
        console.error('Code execution failed:', error)
        return {
          success: false,
          error: `Code execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          errorCode: 'EXECUTION_FAILED',
        }
      }
    }

    // For web templates, return the sandbox URL
    const result: ExecutionResultWeb = {
      sbxId: sbx.sandboxId,
      template: fragment.template,
      url: `https://${sbx.getHost(fragment.port || 80)}`,
    }

    return {
      success: true,
      result,
    }
  } catch (error) {
    console.error('Sandbox creation failed:', error)

    // Try to clean up if sandbox was created
    if (sbx) {
      try {
        await Sandbox.kill(sbx.sandboxId)
      } catch {
        // Ignore cleanup errors
      }
    }

    return {
      success: false,
      error: `Failed to create sandbox: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errorCode: 'SANDBOX_CREATION_FAILED',
    }
  }
}

/**
 * Kill an existing sandbox by ID
 */
export async function killSandbox(sandboxId: string): Promise<boolean> {
  try {
    await Sandbox.kill(sandboxId)
    return true
  } catch (error) {
    console.error(`Failed to kill sandbox ${sandboxId}:`, error)
    return false
  }
}

/**
 * Get the preview URL from an execution result
 */
export function getPreviewUrl(result: ExecutionResult): string | null {
  if ('url' in result) {
    return result.url
  }
  return null
}
