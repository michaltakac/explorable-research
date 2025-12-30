'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Code2,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  Trash2,
} from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import { useToast } from '@/components/ui/use-toast'

type Project = Database['public']['Tables']['projects']['Row']

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const projectId = params.project_id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function loadProject() {
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
          setError('You must be logged in to view this project')
          setLoading(false)
          router.push('/')
          return
        }

        // Fetch project - RLS will ensure user can only see their own projects
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Project not found or you do not have access')
          } else {
            throw fetchError
          }
          setLoading(false)
          return
        }

        setProject(data)
      } catch (err: any) {
        console.error('Error loading project:', err)
        setError(err.message || 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId, router])

  useEffect(() => {
    if (project?.code) {
      Prism.highlightAll()
    }
  }, [project])

  const handleCopyCode = () => {
    if (project?.code) {
      navigator.clipboard.writeText(project.code)
      setCopied(true)
      toast({
        title: 'Code copied',
        description: 'The code has been copied to your clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDelete = async () => {
    if (
      !project ||
      !confirm(
        'Are you sure you want to delete this project? This action cannot be undone.',
      )
    ) {
      return
    }

    setDeleting(true)
    try {
      const { error: deleteError } = await supabase!
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (deleteError) throw deleteError

      toast({
        title: 'Project deleted',
        description: 'Your project has been successfully deleted',
      })
      router.push('/projects')
    } catch (err: any) {
      console.error('Error deleting project:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete project',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-96 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/projects')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              {error || 'Project not found'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => router.push('/projects')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <>Deleting...</>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="secondary" className="capitalize">
          {project.template.replace('-', ' ')}
        </Badge>
        <Badge
          variant={
            project.execution_status === 'completed'
              ? 'default'
              : project.execution_status === 'failed'
                ? 'destructive'
                : 'secondary'
          }
          className="capitalize"
        >
          {project.execution_status}
        </Badge>
        {project.is_published && (
          <Badge variant="outline">Published</Badge>
        )}
        {project.model_name && (
          <Badge variant="outline">{project.model_name}</Badge>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Created</p>
              <p className="font-medium">
                {format(new Date(project.created_at), 'PPpp')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Last Updated</p>
              <p className="font-medium">
                {format(new Date(project.updated_at), 'PPpp')}
              </p>
            </div>
            {project.model_provider && (
              <div>
                <p className="text-muted-foreground mb-1">AI Model</p>
                <p className="font-medium">
                  {project.model_provider} / {project.model_name}
                </p>
              </div>
            )}
            {project.file_path && (
              <div>
                <p className="text-muted-foreground mb-1">File Path</p>
                <p className="font-medium font-mono text-xs">
                  {project.file_path}
                </p>
              </div>
            )}
          </div>

          {project.published_url && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-2">Published URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                    {project.published_url}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(project.published_url!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {project.sandbox_url && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-2">Sandbox URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                    {project.sandbox_url}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(project.sandbox_url!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Source Code
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            disabled={copied}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="language-javascript">
              <code className="language-javascript">{project.code}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
