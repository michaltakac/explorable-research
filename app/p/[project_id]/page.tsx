'use client'

import { ViewType } from '@/components/auth'
import { AuthDialog } from '@/components/auth-dialog'
import { Chat } from '@/components/chat'
import { NavBar } from '@/components/navbar'
import { Preview } from '@/components/preview'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth'
import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { supabase } from '@/lib/supabase'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Loader2, FileText, Sparkles, Box, CheckCircle2, XCircle, Clock } from 'lucide-react'

const emptyMessages: Message[] = []

// Processing statuses (non-terminal)
const PROCESSING_STATUSES = [
  'pending',
  'initializing',
  'fetching_arxiv',
  'downloading_pdf',
  'uploading_pdf',
  'processing_pdf',
  'building_messages',
  'generating',
  'creating_sandbox',
  'deploying',
]

// Status display info
const STATUS_INFO: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  pending: { label: 'Pending', icon: <Clock className="h-5 w-5" />, description: 'Waiting to start processing...' },
  initializing: { label: 'Initializing', icon: <Loader2 className="h-5 w-5 animate-spin" />, description: 'Starting background processing...' },
  fetching_arxiv: { label: 'Fetching Paper', icon: <FileText className="h-5 w-5 animate-pulse" />, description: 'Fetching paper metadata from ArXiv...' },
  downloading_pdf: { label: 'Downloading PDF', icon: <FileText className="h-5 w-5 animate-pulse" />, description: 'Downloading PDF from ArXiv...' },
  uploading_pdf: { label: 'Uploading PDF', icon: <FileText className="h-5 w-5 animate-pulse" />, description: 'Uploading PDF to storage...' },
  processing_pdf: { label: 'Processing PDF', icon: <FileText className="h-5 w-5 animate-pulse" />, description: 'Processing uploaded PDF...' },
  building_messages: { label: 'Preparing', icon: <Loader2 className="h-5 w-5 animate-spin" />, description: 'Preparing AI prompt...' },
  generating: { label: 'Generating', icon: <Sparkles className="h-5 w-5 animate-pulse" />, description: 'AI is creating your interactive visualization...' },
  creating_sandbox: { label: 'Creating Sandbox', icon: <Box className="h-5 w-5 animate-pulse" />, description: 'Setting up the sandbox environment...' },
  deploying: { label: 'Deploying', icon: <Box className="h-5 w-5 animate-pulse" />, description: 'Deploying your project...' },
  ready: { label: 'Ready', icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, description: 'Project is ready!' },
  failed: { label: 'Failed', icon: <XCircle className="h-5 w-5 text-red-500" />, description: 'Processing failed' },
}

type ProjectRecord = {
  id: string
  title: string | null
  description: string | null
  status?: string
  status_message?: string
  error_message?: string
  created_at: string
  updated_at?: string
  started_at?: string
  completed_at?: string
  fragment: FragmentSchema | null
  result: ExecutionResult | null
  messages: Message[] | null
}

export default function ProjectDetailPage() {
  const params = useParams<{ project_id: string }>()
  const projectId = Array.isArray(params.project_id)
    ? params.project_id[0]
    : params.project_id
  const [authView, setAuthView] = useState<ViewType>('sign_in')
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [messages, setMessages] = useState<Message[]>(emptyMessages)
  const [currentTab, setCurrentTab] = useState<'code' | 'fragment'>('fragment')
  const [currentFragment, setCurrentFragment] = useState<
    DeepPartial<FragmentSchema> | undefined
  >(undefined)
  const [currentResult, setCurrentResult] = useState<ExecutionResult | undefined>(
    undefined,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false)
  const { session } = useAuth(setAuthDialog, setAuthView)

  // Check if project is still processing
  const isProcessing = project?.status && PROCESSING_STATUSES.includes(project.status)

  const loadProject = useCallback(async () => {
    if (!session?.access_token || !projectId) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setAuthDialog(true)
          return
        }
        throw new Error('Failed to load project')
      }

      const data = (await response.json()) as { project: ProjectRecord }
      setProject(data.project)
      setMessages(data.project.messages ?? emptyMessages)
      setCurrentFragment(data.project.fragment ?? undefined)
      setCurrentResult(data.project.result ?? undefined)
    } catch {
      setErrorMessage('Unable to load this project right now.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, session?.access_token])

  // Initial load
  useEffect(() => {
    setProject(null)
    setMessages(emptyMessages)
    setCurrentFragment(undefined)
    setCurrentResult(undefined)
    setIsLoading(true)
    setErrorMessage('')
    loadProject()
  }, [loadProject])

  // Poll for updates while processing
  useEffect(() => {
    if (!isProcessing || !session?.access_token) return

    const pollInterval = setInterval(() => {
      loadProject()
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [isProcessing, session?.access_token, loadProject])

  function handleSocialClick(target: 'github' | 'x') {
    if (target === 'github') {
      window.open('https://github.com/michaltakac/explorable-research', '_blank')
      return
    }
    window.open('https://x.com/michaltakac', '_blank')
  }

  function logout() {
    if (supabase) {
      supabase.auth.signOut()
    }
  }

  function setCurrentPreview(preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) {
    setCurrentFragment(preview.fragment)
    setCurrentResult(preview.result)
  }

  // Show loading state
  if (isLoading) {
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
        <div className="max-w-2xl mx-auto px-4 py-6">
          <NavBar
            session={session}
            showLogin={() => setAuthDialog(true)}
            signOut={logout}
            onSocialClick={handleSocialClick}
            onClear={() => undefined}
            canClear={false}
            onUndo={() => undefined}
            canUndo={false}
            showGitHubStar={false}
          />
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Loading session...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  // Show sign in prompt if not authenticated
  if (!session) {
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
        <div className="max-w-2xl mx-auto px-4 py-6">
          <NavBar
            session={session}
            showLogin={() => setAuthDialog(true)}
            signOut={logout}
            onSocialClick={handleSocialClick}
            onClear={() => undefined}
            canClear={false}
            onUndo={() => undefined}
            canUndo={false}
            showGitHubStar={false}
          />
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Sign in to view this session</CardTitle>
              <CardDescription>
                This project is only visible to its owner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setAuthDialog(true)}>Sign in</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Show error state
  if (errorMessage) {
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
        <div className="max-w-2xl mx-auto px-4 py-6">
          <NavBar
            session={session}
            showLogin={() => setAuthDialog(true)}
            signOut={logout}
            onSocialClick={handleSocialClick}
            onClear={() => undefined}
            canClear={false}
            onUndo={() => undefined}
            canUndo={false}
            showGitHubStar={false}
          />
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Unable to load session</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/projects">Back to projects</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Show processing state (only when actively processing and no fragment yet)
  // Once project is ready OR we have a fragment, we show the full view with code panel
  const isProjectReady = project?.status === 'ready'
  if (isProcessing && !currentFragment && !isProjectReady) {
    const statusKey = project?.status || 'pending'
    const statusInfo = STATUS_INFO[statusKey] || STATUS_INFO.pending
    
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
        <div className="max-w-2xl mx-auto px-4 py-6">
          <NavBar
            session={session}
            showLogin={() => setAuthDialog(true)}
            signOut={logout}
            onSocialClick={handleSocialClick}
            onClear={() => undefined}
            canClear={false}
            onUndo={() => undefined}
            canUndo={false}
            showGitHubStar={false}
          />
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                {statusInfo.icon}
                <div>
                  <CardTitle className="text-lg">{project?.title || 'Processing Project'}</CardTitle>
                  <CardDescription className="mt-1">
                    {project?.status_message || statusInfo.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress steps */}
              <div className="space-y-3">
                <ProcessingStep 
                  label="Fetch paper" 
                  status={getStepStatus(statusKey, ['fetching_arxiv', 'downloading_pdf', 'uploading_pdf', 'processing_pdf'])}
                />
                <ProcessingStep 
                  label="Generate code for interactive website" 
                  status={getStepStatus(statusKey, ['building_messages', 'generating'])}
                />
                <ProcessingStep 
                  label="Deploy sandbox" 
                  status={getStepStatus(statusKey, ['creating_sandbox', 'deploying'])}
                />
              </div>
              
              {/* Preview skeleton */}
              <div className="space-y-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Preview will appear here once ready</p>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <Skeleton className="h-4 w-64 mx-auto" />
                    <Skeleton className="h-32 w-full max-w-md mx-auto" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/projects">Back to projects</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Show failed state
  if (project?.status === 'failed') {
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
        <div className="max-w-2xl mx-auto px-4 py-6">
          <NavBar
            session={session}
            showLogin={() => setAuthDialog(true)}
            signOut={logout}
            onSocialClick={handleSocialClick}
            onClear={() => undefined}
            canClear={false}
            onUndo={() => undefined}
            canUndo={false}
            showGitHubStar={false}
          />
          <Card className="mt-6 border-red-200 dark:border-red-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <CardTitle className="text-lg">{project?.title || 'Processing Failed'}</CardTitle>
                  <CardDescription className="mt-1 text-red-600 dark:text-red-400">
                    {project?.error_message || 'An error occurred during processing'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/projects">Back to projects</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/create">Try again</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Check if sandbox is still being created (we have fragment but no result)
  const isSandboxLoading = currentFragment && !currentResult && isProcessing
  
  // Default to code tab when sandbox is loading (so user can see the generated code)
  const effectiveTab = isSandboxLoading && currentTab === 'fragment' ? 'code' : currentTab

  // Show project view (same layout as /create when fragment is shown)
  return (
    <main className="flex min-h-screen max-h-screen">
      {supabase && (
        <AuthDialog
          open={isAuthDialogOpen}
          setOpen={setAuthDialog}
          view={authView}
          supabase={supabase}
        />
      )}
      <div className="grid w-full md:grid-cols-2">
        {/* Chat panel - hidden when preview is expanded */}
        <div
          className={`flex flex-col w-full max-h-full max-w-[800px] mx-auto px-4 overflow-auto ${
            isPreviewExpanded 
              ? 'hidden' 
              : currentFragment 
                ? 'col-span-1' 
                : 'col-span-2'
          }`}
        >
          <NavBar
            session={session}
            showLogin={() => setAuthDialog(true)}
            signOut={logout}
            onSocialClick={handleSocialClick}
            onClear={() => undefined}
            canClear={false}
            onUndo={() => undefined}
            canUndo={false}
            showGitHubStar={true}
          />
          {/* Show processing banner when fragment exists but sandbox is loading */}
          {isSandboxLoading && (
            <div className="flex items-center gap-2 px-4 py-2 mb-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300">
                {project?.status_message || 'Creating sandbox environment...'}
              </span>
            </div>
          )}
          <Chat
            messages={messages}
            isLoading={false}
            setCurrentPreview={setCurrentPreview}
          />
        </div>
        {/* Preview panel - takes full width when expanded */}
        <div className={isPreviewExpanded ? 'col-span-2' : ''}>
          <Preview
            selectedTab={effectiveTab}
            onSelectedTabChange={setCurrentTab}
            isChatLoading={false}
            isPreviewLoading={!!isSandboxLoading}
            fragment={currentFragment}
            result={currentResult}
            onClose={() => {
              setCurrentFragment(undefined)
              setIsPreviewExpanded(false)
            }}
            isExpanded={isPreviewExpanded}
            onToggleExpand={() => setIsPreviewExpanded(!isPreviewExpanded)}
          />
        </div>
      </div>
    </main>
  )
}

// Helper to determine step status
function getStepStatus(currentStatus: string, stepStatuses: string[]): 'pending' | 'active' | 'complete' {
  const statusOrder = [
    'pending', 'initializing', 
    'fetching_arxiv', 'downloading_pdf', 'uploading_pdf', 'processing_pdf',
    'building_messages', 'generating',
    'creating_sandbox', 'deploying',
    'ready', 'failed'
  ]
  
  const currentIndex = statusOrder.indexOf(currentStatus)
  const stepStartIndex = statusOrder.indexOf(stepStatuses[0])
  const stepEndIndex = statusOrder.indexOf(stepStatuses[stepStatuses.length - 1])
  
  if (currentIndex > stepEndIndex) return 'complete'
  if (currentIndex >= stepStartIndex && currentIndex <= stepEndIndex) return 'active'
  return 'pending'
}

// Processing step component
function ProcessingStep({ label, status }: { label: string; status: 'pending' | 'active' | 'complete' }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
        ${status === 'complete' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
        ${status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}
        ${status === 'pending' ? 'bg-muted text-muted-foreground' : ''}
      `}>
        {status === 'complete' && <CheckCircle2 className="h-4 w-4" />}
        {status === 'active' && <Loader2 className="h-4 w-4 animate-spin" />}
        {status === 'pending' && <Clock className="h-3 w-3" />}
      </div>
      <span className={`text-sm ${status === 'pending' ? 'text-muted-foreground' : ''}`}>
        {label}
      </span>
    </div>
  )
}
