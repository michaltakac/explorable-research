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
import { useAuth } from '@/lib/auth'
import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { supabase } from '@/lib/supabase'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const emptyMessages: Message[] = []

type ProjectRecord = {
  id: string
  title: string | null
  description: string | null
  created_at: string
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
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { session, userTeam } = useAuth(setAuthDialog, setAuthView)

  useEffect(() => {
    let isMounted = true

    async function loadProject() {
      if (!session?.access_token || !projectId) {
        setIsLoading(false)
        return
      }

      setProject(null)
      setMessages(emptyMessages)
      setCurrentFragment(undefined)
      setCurrentResult(undefined)
      setIsLoading(true)
      setErrorMessage('')

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
        if (isMounted) {
          setProject(data.project)
          setMessages(data.project.messages ?? emptyMessages)
          setCurrentFragment(data.project.fragment ?? undefined)
          setCurrentResult(data.project.result ?? undefined)
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Unable to load this project right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProject()

    return () => {
      isMounted = false
    }
  }, [projectId, session?.access_token])

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
      <div className="max-w-6xl mx-auto px-4 py-6">
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

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Project</p>
            <h2 className="text-2xl font-semibold">
              {project?.title || 'Project session'}
            </h2>
            {project?.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
          <Button asChild variant="outline">
            <Link href="/projects">Back to projects</Link>
          </Button>
        </div>

        {!session && (
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
        )}

        {session && (
          <div className="mt-6">
            {isLoading && (
              <Card>
                <CardHeader>
                  <CardTitle>Loading session...</CardTitle>
                </CardHeader>
              </Card>
            )}

            {!isLoading && errorMessage && (
              <Card>
                <CardHeader>
                  <CardTitle>Unable to load session</CardTitle>
                  <CardDescription>{errorMessage}</CardDescription>
                </CardHeader>
              </Card>
            )}

            {!isLoading && !errorMessage && project && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Session chat</CardTitle>
                      <CardDescription>
                        The conversation that produced this explorable.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Chat
                    messages={messages}
                    isLoading={false}
                    setCurrentPreview={setCurrentPreview}
                  />
                </div>
                <div className="relative min-h-[600px]">
                  <Preview
                    teamID={userTeam?.id}
                    accessToken={session?.access_token}
                    selectedTab={currentTab}
                    onSelectedTabChange={setCurrentTab}
                    isChatLoading={false}
                    isPreviewLoading={false}
                    fragment={currentFragment}
                    result={currentResult}
                    onClose={() => setCurrentFragment(undefined)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
