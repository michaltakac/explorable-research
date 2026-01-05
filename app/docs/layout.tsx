'use client'

import { DocsHeader } from '@/components/docs/docs-header'
import { DocsSidebar, MobileDocsSidebar } from '@/components/docs/docs-sidebar'
import { useState } from 'react'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <DocsHeader onMenuClick={() => setSidebarOpen(true)} />
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


