import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const enableSupabase = process.env.NEXT_PUBLIC_ENABLE_SUPABASE
const isSupabaseEnabled = enableSupabase
  ? !['false', '0', 'off'].includes(enableSupabase.toLowerCase())
  : true

export type AuthMode = 'jwt' | 'api_key' | 'none'

export type AuthContext = {
  mode: AuthMode
  token?: string
  apiKey?: string
}

export function createSupabaseServerClient(accessToken?: string, apiKey?: string) {
  if (!isSupabaseEnabled || !supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing')
  }

  const headers: Record<string, string> = {}
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  
  if (apiKey) {
    headers['x-api-key'] = apiKey
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: Object.keys(headers).length > 0 ? { headers } : undefined,
  })
}

export function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

export function getApiKey(request: Request): string | null {
  return request.headers.get('x-api-key')
}

export function getAuthContext(request: Request): AuthContext {
  const accessToken = getAccessToken(request)
  const apiKey = getApiKey(request)

  if (accessToken) {
    return { mode: 'jwt', token: accessToken }
  }

  if (apiKey) {
    return { mode: 'api_key', apiKey }
  }

  return { mode: 'none' }
}

/**
 * Creates a Supabase client from the request's authentication context.
 * Supports both JWT (Bearer token) and API key (x-api-key header) authentication.
 */
export function createSupabaseFromRequest(request: Request): {
  supabase: SupabaseClient
  authContext: AuthContext
} {
  const authContext = getAuthContext(request)

  const supabase = createSupabaseServerClient(
    authContext.token,
    authContext.apiKey
  )

  return { supabase, authContext }
}

/**
 * Verifies the user from the request's authentication context.
 * For JWT: validates the token and returns user data.
 * For API key: verifies the key via KeyHippo and returns user data.
 */
export async function verifyUser(
  supabase: SupabaseClient,
  authContext: AuthContext
): Promise<{ userId: string; email?: string } | null> {
  if (authContext.mode === 'jwt' && authContext.token) {
    const { data: userData, error } = await supabase.auth.getUser(authContext.token)
    if (error || !userData?.user) {
      return null
    }
    return { userId: userData.user.id, email: userData.user.email ?? undefined }
  }

  if (authContext.mode === 'api_key' && authContext.apiKey) {
    // KeyHippo handles API key verification through the current_user_context function
    // The pre-request hook in PostgREST validates the key, so if we reach here,
    // we need to fetch the user context from KeyHippo via public wrapper
    const { data, error } = await supabase.rpc('current_user_context')
    if (error || !data || data.length === 0 || !data[0].user_id) {
      return null
    }
    return { userId: data[0].user_id }
  }

  return null
}
