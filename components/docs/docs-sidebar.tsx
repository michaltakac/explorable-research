'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Book,
  Rocket,
  Sparkles,
  BookOpen,
  Code2,
  Key,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers,
  Cpu,
  Globe,
  Zap,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type NavItem = {
  title: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  items?: NavItem[]
}

const navigation: NavItem[] = [
  {
    title: 'Overview',
    href: '/docs',
    icon: Book,
  },
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
    icon: Rocket,
  },
  {
    title: 'Features',
    href: '/docs/features',
    icon: Sparkles,
  },
  {
    title: 'Guides',
    icon: BookOpen,
    items: [
      {
        title: 'Creating Explorables',
        href: '/docs/guides/creating-explorables',
        icon: Layers,
      },
      {
        title: 'ArXiv Papers',
        href: '/docs/guides/arxiv-papers',
        icon: FileText,
      },
    ],
  },
  {
    title: 'API Reference',
    icon: Code2,
    items: [
      {
        title: 'Overview',
        href: '/docs/api',
        icon: Globe,
      },
      {
        title: 'Projects',
        href: '/docs/api/projects',
        icon: Layers,
      },
      {
        title: 'API Keys',
        href: '/docs/api/api-keys',
        icon: Key,
      },
    ],
  },
  {
    title: 'API Keys Guide',
    href: '/docs/api-keys',
    icon: Key,
  },
]

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(() => {
    if (item.items) {
      return item.items.some((child) => pathname === child.href)
    }
    return false
  })

  const isActive = pathname === item.href
  const hasChildren = item.items && item.items.length > 0
  const Icon = item.icon

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            depth > 0 && 'pl-8'
          )}
        >
          {Icon && <Icon className="h-4 w-4" />}
          <span className="flex-1 text-left">{item.title}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 border-l border-border ml-5 pl-2">
                {item.items?.map((child) => (
                  <NavItemComponent key={child.title} item={child} depth={depth + 1} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <Link
      href={item.href || '#'}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground',
        depth > 0 && 'pl-4'
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{item.title}</span>
    </Link>
  )
}

export function DocsSidebar({ className }: { className?: string }) {
  return (
    <aside className={cn('w-64 flex-shrink-0', className)}>
      <ScrollArea className="h-full py-6 pr-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavItemComponent key={item.title} item={item} />
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}

export function MobileDocsSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-background border-r z-50 lg:hidden"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Documentation</span>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-65px)] p-4">
              <nav className="space-y-1">
                {navigation.map((item) => (
                  <div key={item.title} onClick={onClose}>
                    <NavItemComponent item={item} />
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}


