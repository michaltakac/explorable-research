import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

/**
 * Server-side Supabase client for API routes and server components
 * This client uses cookies to maintain user sessions
 */
export async function createServerClient(): Promise<SupabaseClient<Database> | null> {
  const cookieStore = await cookies()

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  ) {
    console.warn('Supabase environment variables not configured')
    return null
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )
}

/**
 * Get the current authenticated user from the session
 * Returns null if not authenticated
 */
export async function getServerUser() {
  const supabase = await createServerClient()
  if (!supabase) return null

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Get the current user's session
 * Returns null if not authenticated
 */
export async function getServerSession() {
  const supabase = await createServerClient()
  if (!supabase) return null

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  return session
}

/**
 * Require authentication - throws if user is not authenticated
 * Use this in API routes that require authentication
 */
export async function requireAuth() {
  const user = await getServerUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Get user's default team
 */
export async function getUserDefaultTeam(userId: string) {
  const supabase = await createServerClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('users_teams')
    .select('teams (id, name, tier, email)')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single()

  if (error || !data) {
    return null
  }

  return data.teams as unknown as {
    id: string
    name: string
    tier: string
    email: string
  }
}
