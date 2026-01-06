import { FragmentSchema } from '@/lib/schema'
import { ExecutionResultInterpreter, ExecutionResultWeb } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'

const sandboxTimeout = 10 * 60 * 1000 // 10 minute in ms

export const maxDuration = 60

export async function POST(req: Request) {
  const {
    fragment,
    userID,
    existingSandboxId,
  }: {
    fragment: FragmentSchema
    userID: string | undefined
    existingSandboxId?: string
  } = await req.json()

  let sbx: Sandbox

  // Try to reuse existing sandbox if provided
  if (existingSandboxId) {
    try {
      sbx = await Sandbox.connect(existingSandboxId)
    } catch (error) {
      // Connection failed - sandbox might have expired, create a new one
      console.log(`Failed to connect to existing sandbox ${existingSandboxId}, creating new one:`, error)
      sbx = await Sandbox.create(fragment.template, {
        metadata: {
          template: fragment.template,
          userID: userID ?? '',
        },
        timeoutMs: sandboxTimeout,
      })
    }
  } else {
    // Create a new sandbox
    sbx = await Sandbox.create(fragment.template, {
      metadata: {
        template: fragment.template,
        userID: userID ?? '',
      },
      timeoutMs: sandboxTimeout,
    })
  }

  // Install packages
  if (fragment.has_additional_dependencies) {
    await sbx.commands.run(fragment.install_dependencies_command)
  }

  // Copy code to fs
  if (fragment.code && Array.isArray(fragment.code)) {
    for (const file of fragment.code as Array<{ file_path: string; file_content: string }>) {
      await sbx.files.write(file.file_path, file.file_content)
    }
  } else {
    await sbx.files.write(fragment.file_path, fragment.code)
  }

  // Execute code or return a URL to the running sandbox
  if (fragment.template === 'code-interpreter-v1') {
    const { logs, error, results } = await sbx.runCode(fragment.code || '')

    return new Response(
      JSON.stringify({
        sbxId: sbx?.sandboxId,
        template: fragment.template,
        stdout: logs.stdout,
        stderr: logs.stderr,
        runtimeError: error,
        cellResults: results,
      } as ExecutionResultInterpreter),
    )
  }

  return new Response(
    JSON.stringify({
      sbxId: sbx?.sandboxId,
      template: fragment.template,
      url: `https://${sbx?.getHost(fragment.port || 80)}`,
    } as ExecutionResultWeb),
  )
}
