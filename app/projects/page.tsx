'use client'

import { ViewType } from '@/components/auth'
import { AuthDialog } from '@/components/auth-dialog'
import { NavBar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { ExecutionResult } from '@/lib/types'
import { Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const emptyProjects: ProjectSummary[] = []

type ProjectSummary = {
  id: string
  title: string | null
  description: string | null
  created_at: string
  result: ExecutionResult | null
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export default function ProjectsPage() {
  const [authView, setAuthView] = useState<ViewType>('sign_in')
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [projects, setProjects] = useState<ProjectSummary[]>(emptyProjects)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<ProjectSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { session } = useAuth(setAuthDialog, setAuthView)
  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true

    async function loadProjects() {
      if (!session?.access_token) {
        setProjects(emptyProjects)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await fetch('/api/projects', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            setAuthDialog(true)
            return
          }
          throw new Error('Failed to load projects')
        }

        const data = (await response.json()) as { projects: ProjectSummary[] }
        if (isMounted) {
          setProjects(data.projects ?? emptyProjects)
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Unable to load projects right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      isMounted = false
    }
  }, [session?.access_token])

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

  function openDeleteDialog(project: ProjectSummary) {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteProject() {
    if (!projectToDelete || !session?.access_token) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      // Remove the project from the list
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id))
      
      toast({
        title: 'Project deleted',
        description: 'The project and its sandbox have been deleted.',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete the project. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    }
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{projectToDelete?.title || 'Untitled project'}&quot; 
              and terminate its sandbox. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-5xl mx-auto px-4 py-6">
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

        <div className="mt-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Projects</h2>
            <p className="text-muted-foreground">
              Review your saved sessions and generated websites.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/create">New project</Link>
          </Button>
        </div>

        {!session && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Sign in to view your projects</CardTitle>
              <CardDescription>
                Your saved sessions are private to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setAuthDialog(true)}>Sign in</Button>
            </CardContent>
          </Card>
        )}

        {session && (
          <div className="mt-6 space-y-4">
            {isLoading && (
              <Card>
                <CardHeader>
                  <CardTitle>Loading projects...</CardTitle>
                </CardHeader>
              </Card>
            )}

            {!isLoading && errorMessage && (
              <Card>
                <CardHeader>
                  <CardTitle>Unable to load projects</CardTitle>
                  <CardDescription>{errorMessage}</CardDescription>
                </CardHeader>
              </Card>
            )}

            {!isLoading && !errorMessage && projects.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>No projects yet</CardTitle>
                  <CardDescription>
                    Create your first explorable to see it here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href="/create">Create a project</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isLoading && !errorMessage && projects.length > 0 && (
              <div className="grid gap-4">
                {projects.map((project) => {
                  const hasPreviewUrl =
                    project.result && 'url' in project.result

                  return (
                    <Card key={project.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>
                              {project.title || 'Untitled project'}
                            </CardTitle>
                            <CardDescription>
                              {project.description || 'No description'} ·{' '}
                              {formatDate(project.created_at)}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => openDeleteDialog(project)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        <Button asChild variant="default">
                          <Link href={`/p/${project.id}`}>View session</Link>
                        </Button>
                        {hasPreviewUrl && (
                          <Button asChild variant="outline">
                            <a
                              href={(project.result as { url: string }).url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open preview
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
