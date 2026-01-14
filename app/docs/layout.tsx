'use client'

import { DocsHeader } from '@/components/docs/docs-header'
import { DocsSidebar, MobileDocsSidebar } from '@/components/docs/docs-sidebar'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <DocsHeader 
        onMenuClick={() => setSidebarOpen(true)} 
        session={session}
        signOut={signOut}
      />
      <MobileDocsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex">
          {/* Desktop sidebar */}
          <DocsSidebar className="hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] border-r" />
          
          {/* Main content */}
          <main className="flex-1 min-w-0 py-8 lg:pl-8">
            <div className="max-w-3xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}


