'use client'

import { Avatar, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  GitHubLogoIcon,
  TwitterLogoIcon,
} from '@radix-ui/react-icons'
import { Session } from '@supabase/supabase-js'
import { track } from '@vercel/analytics'
import { BookImage, CircleUser, Key, LogOut } from 'lucide-react'
import Link from 'next/link'

interface UserDropdownProps {
  session: Session
  signOut: () => void
  trackingLocation?: string
}

export function UserDropdown({ session, signOut, trackingLocation = 'navbar' }: UserDropdownProps) {
  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarImage
                  src={
                    session.user.user_metadata?.avatar_url ||
                    'https://avatar.vercel.sh/' + session.user.email
                  }
                  alt={session.user.email}
                />
              </Avatar>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>My Account</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm">My Account</span>
          <span className="text-xs text-muted-foreground">
            {session.user.email || 'Signed in'}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <CircleUser className="mr-2 h-4 w-4 text-muted-foreground" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/projects">
            <BookImage className="mr-2 h-4 w-4 text-muted-foreground" />
            Projects
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/api-keys">
            <Key className="mr-2 h-4 w-4 text-muted-foreground" />
            API Keys
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            track('Star on GitHub Click', { location: `${trackingLocation}-dropdown` })
            window.open('https://github.com/michaltakac/explorable-research', '_blank')
          }}
        >
          <GitHubLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          Star on GitHub
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open('https://x.com/michaltakac', '_blank')}>
          <TwitterLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          Follow @michaltakac on X
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4 text-muted-foreground" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
