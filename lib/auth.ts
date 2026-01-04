import { supabase } from './supabase'
import { ViewType } from '@/components/auth'
import { Session } from '@supabase/supabase-js'
import { usePostHog } from 'posthog-js/react'
import { useState, useEffect, useRef } from 'react'

export function useAuth(
  setAuthDialog: (value: boolean) => void,
  setAuthView: (value: ViewType) => void,
) {
  const [session, setSession] = useState<Session | null>(null)
  const [recovery, setRecovery] = useState(false)
  const posthog = usePostHog()

  // Use refs for callbacks to avoid infinite re-render loops
  // when callers pass inline arrow functions
  const setAuthDialogRef = useRef(setAuthDialog)
  const setAuthViewRef = useRef(setAuthView)

  // Keep refs up to date
  useEffect(() => {
    setAuthDialogRef.current = setAuthDialog
    setAuthViewRef.current = setAuthView
  })

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        if (!session.user.user_metadata.is_fragments_user) {
          supabase?.auth.updateUser({
            data: { is_fragments_user: true },
          })
        }
        posthog.identify(session?.user.id, {
          email: session?.user.email,
          supabase_id: session?.user.id,
        })
        posthog.capture('sign_in')
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (_event === 'PASSWORD_RECOVERY') {
        setRecovery(true)
        setAuthViewRef.current('update_password')
        setAuthDialogRef.current(true)
      }

      if (_event === 'USER_UPDATED' && recovery) {
        setRecovery(false)
      }

      if (_event === 'SIGNED_IN' && !recovery) {
        setAuthDialogRef.current(false)
        if (!session?.user.user_metadata.is_fragments_user) {
          supabase?.auth.updateUser({
            data: { is_fragments_user: true },
          })
        }
        posthog.identify(session?.user.id, {
          email: session?.user.email,
          supabase_id: session?.user.id,
        })
        posthog.capture('sign_in')
      }

      if (_event === 'SIGNED_OUT') {
        setAuthViewRef.current('sign_in')
        posthog.capture('sign_out')
        posthog.reset()
        setRecovery(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [recovery, posthog])

  return {
    session,
  }
}
