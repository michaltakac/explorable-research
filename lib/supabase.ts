import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const enableSupabase = process.env.NEXT_PUBLIC_ENABLE_SUPABASE
const isSupabaseEnabled = enableSupabase
  ? !['false', '0', 'off'].includes(enableSupabase.toLowerCase())
  : true

export const supabase =
  isSupabaseEnabled && supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : undefined
