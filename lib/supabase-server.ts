import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const enableSupabase = process.env.NEXT_PUBLIC_ENABLE_SUPABASE
const isSupabaseEnabled = enableSupabase
  ? !['false', '0', 'off'].includes(enableSupabase.toLowerCase())
  : true

export function createSupabaseServerClient(accessToken?: string) {
  if (!isSupabaseEnabled || !supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  })
}

export function getAccessToken(request: Request) {
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
