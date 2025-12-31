'use client'

import { ViewType } from '@/components/auth'
import { AuthDialog } from '@/components/auth-dialog'
import { Header, Hero, Features, HowItWorks, CTASection, Footer } from '@/components/landing'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export default function Home() {
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<ViewType>('sign_in')
  const { session } = useAuth(setAuthDialog, setAuthView)

  function logout() {
    if (supabase) {
      supabase.auth.signOut()
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {supabase && (
        <AuthDialog
          open={isAuthDialogOpen}
          setOpen={setAuthDialog}
          view={authView}
          supabase={supabase}
        />
      )}
      
      <Header session={session} signOut={logout} />
      
      <Hero />
      
      <Features />
      
      <HowItWorks />
      
      <CTASection />
      
      <Footer />
    </main>
  )
}
