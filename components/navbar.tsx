import Logo from './logo'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  GitHubLogoIcon,
  StarFilledIcon,
  TwitterLogoIcon,
} from '@radix-ui/react-icons'
import { Session } from '@supabase/supabase-js'
import { track } from '@vercel/analytics'
import { ArrowRight, LogOut, Trash, Undo, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function NavBar({
  session,
  showLogin,
  signOut,
  onClear,
  canClear,
  onSocialClick,
  onUndo,
  canUndo,
  showGitHubStar = false,
}: {
  session: Session | null
  showLogin: () => void
  signOut: () => void
  onClear: () => void
  canClear: boolean
  onSocialClick: (target: 'github' | 'x') => void
  onUndo: () => void
  canUndo: boolean
  showGitHubStar?: boolean
}) {
  const router = useRouter()
  return (
    <nav className="w-full flex bg-background py-4">
      <div className="flex flex-1 items-center">
        <Link 
          href="/" 
          className="flex items-center gap-2"
          onClick={() => track('Explorable Research Link Click', { location: 'navbar' })}
        >
          <Logo width={24} height={24} />
          <h1 className="whitespace-pre font-medium">Explorable Research</h1>
        </Link>
      </div>
      <div className="flex items-center gap-1 md:gap-3">
        {/* GitHub Star button */}
        {showGitHubStar && (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/michaltakac/explorable-research"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border bg-background hover:bg-muted transition-colors"
                  onClick={() => track('Star on GitHub Click', { location: 'navbar' })}
                >
                  <GitHubLogoIcon className="w-4 h-4" />
                  <span>Star</span>
                  <StarFilledIcon className="w-3.5 h-3.5 text-amber-500" />
                </a>
              </TooltipTrigger>
              <TooltipContent>Star on GitHub</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                disabled={!canClear}
              >
                <Trash className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <ThemeToggle />
            </TooltipTrigger>
            <TooltipContent>Toggle theme</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {session ? (
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
                  {session.user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/projects')}>
                <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                My Projects
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  window.open('https://github.com/michaltakac/explorable-research', '_blank')
                }}
              >
                <Logo className="mr-2 h-4 w-4 text-muted-foreground" />
                About Explorable Research
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSocialClick('github')}>
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
        ) : (
          <Button variant="default" onClick={showLogin}>
            Sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  )
}
