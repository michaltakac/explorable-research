import { SupabaseClient } from '@supabase/supabase-js'
import { Sandbox } from '@e2b/code-interpreter'
import { FragmentSchema } from '@/lib/schema'
import { ProjectStatus, ExecutionResultInterpreter, ExecutionResultWeb } from '@/lib/types'

const sandboxTimeout = 10 * 60 * 1000 // 10 minutes in ms

export type ProcessProjectOptions = {
  projectId: string
  fragment: FragmentSchema
  userID?: string
}

async function updateProjectStatus(
  supabase: SupabaseClient,
  projectId: string,
  status: ProjectStatus,
  updates: Record<string, unknown> = {}
) {
  const { error } = await supabase
    .from('projects')
    .update({ status, ...updates })
    .eq('id', projectId)

  if (error) {
    console.error(`Failed to update project ${projectId} status to ${status}:`, error)
  }
}

/**
 * Process a project asynchronously - creates sandbox, installs dependencies, executes code
 * This function runs in the background and updates the project status as it progresses
 */
export async function processProjectAsync(
  supabase: SupabaseClient,
  options: ProcessProjectOptions
): Promise<void> {
  const { projectId, fragment, userID } = options

  try {
    // Update status: creating_sandbox
    await updateProjectStatus(supabase, projectId, 'creating_sandbox')

    // Create sandbox
    const sbx = await Sandbox.create(fragment.template, {
      metadata: {
        template: fragment.template,
        userID: userID ?? '',
      },
      timeoutMs: sandboxTimeout,
    })

    // Update status: installing_dependencies (if needed)
    if (fragment.has_additional_dependencies) {
      await updateProjectStatus(supabase, projectId, 'installing_dependencies')
      await sbx.commands.run(fragment.install_dependencies_command)
    }

    // Update status: executing_code
    await updateProjectStatus(supabase, projectId, 'executing_code')

    // Copy code to filesystem
    if (fragment.code && Array.isArray(fragment.code)) {
      for (const file of fragment.code) {
        await sbx.files.write(file.file_path, file.file_content)
      }
    } else if (fragment.code) {
      await sbx.files.write(fragment.file_path, fragment.code)
    }

    // Execute code or get URL based on template
    let result: ExecutionResultInterpreter | ExecutionResultWeb

    if (fragment.template === 'code-interpreter-v1') {
      const { logs, error, results } = await sbx.runCode(fragment.code || '')
      result = {
        sbxId: sbx.sandboxId,
        template: fragment.template,
        stdout: logs.stdout,
        stderr: logs.stderr,
        runtimeError: error,
        cellResults: results,
      }
    } else {
      result = {
        sbxId: sbx.sandboxId,
        template: fragment.template,
        url: `https://${sbx.getHost(fragment.port || 80)}`,
      }
    }

    // Update status: ready with result
    await updateProjectStatus(supabase, projectId, 'ready', { result })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error(`Project ${projectId} processing failed:`, error)
    await updateProjectStatus(supabase, projectId, 'failed', { error_message: errorMessage })
  }
}
