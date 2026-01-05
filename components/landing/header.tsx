'use client'

import Logo from '../logo'
import { UserDropdown } from '@/components/user-dropdown'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Session } from '@supabase/supabase-js'
import { track } from '@vercel/analytics'
import { ArrowRight, LogOut, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface HeaderProps {
  session?: Session | null
  signOut?: () => void
}

export function Header({ session, signOut }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2.5 group"
            onClick={() => track('Explorable Research Link Click', { location: 'header' })}
          >
            <div className="flex items-center justify-center rounded-lg bg-primary p-1.5 transition-transform group-hover:scale-105">
              <Logo className="text-primary-foreground w-5 h-5" />
            </div>
            <span className="font-semibold text-foreground">Explorable Research</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="#features" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link 
              href="#how-it-works" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </Link>
            <Link 
              href="/docs" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <a 
              href="https://github.com/michaltakac/explorable-research" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              onClick={() => track('Star on GitHub Click', { location: 'header' })}
            >
              <GitHubLogoIcon className="w-4 h-4" />
              GitHub
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/projects">Projects</Link>
                </Button>
                <UserDropdown
                  session={session}
                  signOut={signOut!}
                  trackingLocation="header"
                />
              </>
            ) : (
              <Button 
                asChild
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 border-0"
              >
                <Link 
                  href="/create"
                  onClick={() => track('Get Started Click', { location: 'header' })}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-4">
              <Link 
                href="#features" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#how-it-works" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it works
              </Link>
              <Link 
                href="/docs" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <a 
                href="https://github.com/michaltakac/explorable-research" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                onClick={() => track('Star on GitHub Click', { location: 'header-mobile' })}
              >
                <GitHubLogoIcon className="w-4 h-4" />
                GitHub
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                {session ? (
                  <>
                    <Link 
                      href="/projects"
                      className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Projects
                    </Link>
                    <div className="flex items-center gap-2 py-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage
                          src={
                            session.user.user_metadata?.avatar_url ||
                            'https://avatar.vercel.sh/' + session.user.email
                          }
                          alt={session.user.email}
                        />
                      </Avatar>
                      <span className="text-sm text-muted-foreground truncate">
                        {session.user.email}
                      </span>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        signOut?.()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <Button 
                    asChild
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                  >
                    <Link 
                      href="/create"
                      onClick={() => track('Get Started Click', { location: 'header-mobile' })}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
