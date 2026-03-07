import { Sandbox } from '@e2b/code-interpreter'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sbxId: string }> },
): Promise<NextResponse> {
  try {
    const { sbxId } = await params

    if (!sbxId) {
      return NextResponse.json({ error: 'Missing sandbox ID' }, { status: 400 })
    }

    // Try to connect to the sandbox to check if it's alive
    try {
      const sandboxes = await Sandbox.list()
      const exists = sandboxes.some((s) => s.sandboxId === sbxId)

      return NextResponse.json({
        sbxId,
        alive: exists,
        status: exists ? 'running' : 'expired',
      })
    } catch (e) {
      console.error('[API] Failed to check sandbox status:', e)
      // If we can't list sandboxes, assume the sandbox is expired
      return NextResponse.json({
        sbxId,
        alive: false,
        status: 'expired',
      })
    }
  } catch (err) {
    console.error('Unexpected error in GET /api/sandbox/[sbxId]/status:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
