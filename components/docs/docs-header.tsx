'use client'

import Logo from '@/components/logo'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Menu, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function DocsHeader({
  onMenuClick,
  className,
}: {
  onMenuClick?: () => void
  className?: string
}) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Logo width={24} height={24} />
          <span className="font-semibold hidden sm:inline-block">Explorable Research</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/docs"
            className="text-foreground font-medium transition-colors hover:text-foreground/80"
          >
            Docs
          </Link>
          <Link
            href="/docs/api"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            API
          </Link>
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com/michaltakac/explorable-research"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubLogoIcon className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
          </Button>
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:flex">
            <Link href="/create">
              <ArrowLeft className="h-4 w-4 mr-2 rotate-180" />
              Back to App
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

