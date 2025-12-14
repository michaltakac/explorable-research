'use client'

import Logo from '../logo'
import { GitHubLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="py-12 border-t border-border/50 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and tagline */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center rounded-lg bg-primary p-1.5">
                <Logo className="text-primary-foreground w-5 h-5" />
              </div>
              <span className="font-semibold text-foreground">Explorable Research</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Transform research into interactive experiences
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com/michaltakac/explorable-research" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <GitHubLogoIcon className="w-5 h-5" />
            </a>
            <a 
              href="https://x.com/michaltakac" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <TwitterLogoIcon className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Explorable Research. Open source under Apache 2.0.
          </p>
          <p>
            Built by{' '}
            <a 
              href="https://github.com/michaltakac" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              Michal Takáč
            </a>
            {' '}· Based on{' '}
            <a 
              href="https://github.com/e2b-dev/fragments" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              Fragments
            </a>
            {' '}by{' '}
            <a 
              href="https://e2b.dev" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              ✶ E2B
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
