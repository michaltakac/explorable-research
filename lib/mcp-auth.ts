import { createSupabaseServerClient } from '@/lib/supabase-server'

export type McpAuthInfo = {
  userId: string
  email?: string
  apiKey: string
}

/**
 * Validates an API key and returns the user context.
 * Uses KeyHippo's current_user_context function via Supabase RPC.
 */
export async function validateApiKey(apiKey: string): Promise<McpAuthInfo | null> {
  if (!apiKey) {
    return null
  }

  try {
    const supabase = createSupabaseServerClient(undefined, apiKey)

    // KeyHippo validates the API key and returns user context
    const { data, error } = await supabase.rpc('current_user_context')

    if (error || !data || data.length === 0 || !data[0].user_id) {
      console.log('[MCP Auth] API key validation failed:', error?.message || 'No user context')
      return null
    }

    return {
      userId: data[0].user_id,
      apiKey,
    }
  } catch (err) {
    console.error('[MCP Auth] Error validating API key:', err)
    return null
  }
}

/**
 * Extracts API key from request headers.
 * Supports x-api-key header (primary) and Authorization Bearer token (fallback).
 */
export function extractApiKey(request: Request): string | null {
  // Primary: x-api-key header (like Context7)
  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    return apiKey
  }

  // Fallback: Authorization Bearer token for MCP spec compliance
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}

/**
 * MCP authentication middleware.
 * Validates the API key from request headers and returns auth info.
 */
export async function authenticateMcpRequest(request: Request): Promise<McpAuthInfo | null> {
  const apiKey = extractApiKey(request)

  if (!apiKey) {
    console.log('[MCP Auth] No API key provided')
    return null
  }

  return validateApiKey(apiKey)
}
