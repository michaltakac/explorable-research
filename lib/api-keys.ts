import { SupabaseClient } from '@supabase/supabase-js'

export type ApiKeyMetadata = {
  id: string
  description: string
  prefix: string
  created_at: string
  last_used_at: string | null
  is_revoked: boolean
  expires_at: string
}

export type CreateApiKeyResult = {
  api_key: string
  api_key_id: string
}

/**
 * Create a new API key for the authenticated user
 */
export async function createApiKey(
  supabase: SupabaseClient,
  description: string,
  scope?: string
): Promise<CreateApiKeyResult> {
  const { data, error } = await supabase.rpc('create_api_key', {
    key_description: description,
    scope_name: scope ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw new Error('Failed to create API key')
  }

  return {
    api_key: data[0].api_key,
    api_key_id: data[0].api_key_id,
  }
}

/**
 * List all API keys for the authenticated user
 */
export async function listApiKeys(
  supabase: SupabaseClient
): Promise<ApiKeyMetadata[]> {
  const { data, error } = await supabase.rpc('list_my_api_keys')

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  supabase: SupabaseClient,
  keyId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('revoke_api_key', {
    api_key_id: keyId,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data === true
}

/**
 * Rotate an API key (revoke old, create new with same description)
 */
export async function rotateApiKey(
  supabase: SupabaseClient,
  keyId: string
): Promise<CreateApiKeyResult> {
  const { data, error } = await supabase.rpc('rotate_api_key', {
    old_api_key_id: keyId,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw new Error('Failed to rotate API key')
  }

  return {
    api_key: data[0].new_api_key,
    api_key_id: data[0].new_api_key_id,
  }
}

