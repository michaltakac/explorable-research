'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Code2,
  Calendar,
  FolderOpen,
  ExternalLink,
  Loader2,
} from 'lucide-react'

type Project = Database['public']['Tables']['projects']['Row']

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadProjects() {
      try {
        if (!supabase) {
          setError('Authentication not configured')
          setLoading(false)
          return
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setError('You must be logged in to view projects')
          setLoading(false)
          router.push('/')
          return
        }

        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setProjects(data || [])
      } catch (err: any) {
        console.error('Error loading projects:', err)
        setError(err.message || 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [router])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">My Projects</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">My Projects</h1>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Button onClick={() => router.push('/')}>Create New Project</Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              Create your first explorable research project to get started
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')}>Create Project</Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/p/${project.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  {project.title}
                </CardTitle>
                {project.description && (
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  <span className="capitalize">
                    {project.template.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(project.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      project.execution_status === 'completed'
                        ? 'bg-green-500'
                        : project.execution_status === 'running'
                          ? 'bg-yellow-500'
                          : project.execution_status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                    }`}
                  />
                  <span className="capitalize">{project.execution_status}</span>
                </div>
              </CardContent>
              <CardFooter>
                {project.is_published && project.published_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(project.published_url!, '_blank')
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Published
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
