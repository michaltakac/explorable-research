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
import { CopyButton } from '@/components/ui/copy-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, Key, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type ApiKeyMetadata = {
  id: string
  description: string
  prefix: string
  created_at: string
  last_used_at: string | null
  is_revoked: boolean
  expires_at: string
}

export default function ApiKeysPage() {
  const [authView, setAuthView] = useState<ViewType>('sign_in')
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isRevoking, setIsRevoking] = useState<string | null>(null)
  const [isRotating, setIsRotating] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKeyMetadata[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRevokeDialog, setShowRevokeDialog] = useState<string | null>(null)
  const [showRotateDialog, setShowRotateDialog] = useState<string | null>(null)
  
  const { session } = useAuth(setAuthDialog, setAuthView)
  const { toast } = useToast()

  const fetchApiKeys = useCallback(async () => {
    if (!session?.access_token) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/api-keys', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch API keys')
      }

      const data = await response.json()
      setApiKeys(data.keys.filter((k: ApiKeyMetadata) => !k.is_revoked))
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
      toast({
        title: 'Error',
        description: 'Failed to load API keys.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [session?.access_token, toast])

  useEffect(() => {
    if (session) {
      fetchApiKeys()
    }
  }, [session, fetchApiKeys])

  async function handleCreateKey() {
    if (!session?.access_token || !newKeyName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: newKeyName.trim() }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to create API key')
      }

      const data = await response.json()
      setNewApiKey(data.api_key)
      setNewKeyName('')
      fetchApiKeys()
      toast({
        title: 'API key created',
        description: 'Your new API key has been created. Make sure to copy it now!',
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create API key.'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleRevokeKey(keyId: string) {
    if (!session?.access_token) return

    setIsRevoking(keyId)
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to revoke API key')
      }

      setShowRevokeDialog(null)
      fetchApiKeys()
      toast({
        title: 'API key revoked',
        description: 'The API key has been revoked and can no longer be used.',
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to revoke API key.'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsRevoking(null)
    }
  }

  async function handleRotateKey(keyId: string) {
    if (!session?.access_token) return

    setIsRotating(keyId)
    try {
      const response = await fetch(`/api/api-keys/${keyId}?action=rotate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to rotate API key')
      }

      const data = await response.json()
      setShowRotateDialog(null)
      setShowCreateDialog(true)
      setNewApiKey(data.api_key)
      fetchApiKeys()
      toast({
        title: 'API key rotated',
        description: 'Your API key has been rotated. The old key is no longer valid.',
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to rotate API key.'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsRotating(null)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function maskKey(prefix: string) {
    const visible = prefix.slice(0, 8)
    return `${visible}...`
  }

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

  function resetCreateDialog() {
    setShowCreateDialog(false)
    setNewApiKey(null)
    setNewKeyName('')
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
      <div className="max-w-4xl mx-auto px-4 py-6">
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

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Key className="h-6 w-6" />
                API Keys
              </h2>
              <p className="text-muted-foreground mt-1">
                Manage your API keys for programmatic access to Explorable Research.
              </p>
            </div>
            <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Profile
            </Link>
          </div>
        </div>

        {!session && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Sign in to manage API keys</CardTitle>
              <CardDescription>
                You need to be signed in to create and manage API keys.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setAuthDialog(true)}>Sign in</Button>
            </CardContent>
          </Card>
        )}

        {session && (
          <div className="mt-6 space-y-6">
            {/* Info Card */}
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      Keep your API keys secure
                    </p>
                    <p className="text-muted-foreground mt-1">
                      API keys allow access to your data outside of this website. Treat them like passwords — 
                      do not share them publicly or commit them to version control.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Keys List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your API Keys</CardTitle>
                    <CardDescription>
                      Use these keys to access the Explorable Research API programmatically.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create API Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-4">
                      You have no API keys yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Create one to get started with programmatic access.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.description}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {maskKey(key.prefix)}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(key.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowRotateDialog(key.id)}
                                disabled={isRotating === key.id}
                              >
                                {isRotating === key.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowRevokeDialog(key.id)}
                                disabled={isRevoking === key.id}
                                className="text-destructive hover:text-destructive"
                              >
                                {isRevoking === key.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Usage Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>How to use your API key</CardTitle>
                <CardDescription>
                  Include your API key in the <code className="bg-muted px-1 rounded">x-api-key</code> header of your requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre>{`curl -X GET "https://explorableresearch.com/api/projects" \\
  -H "x-api-key: YOUR_API_KEY"`}</pre>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  For more information, see the{' '}
                  <a 
                    href="https://github.com/michaltakac/explorable-research/blob/main/docs/api-keys.md" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    API documentation
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => !open && resetCreateDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newApiKey ? 'API Key Created' : 'Create API Key'}
            </DialogTitle>
            <DialogDescription>
              {newApiKey
                ? 'Your new API key has been created. Copy it now — it will not be shown again.'
                : 'Give your API key a descriptive name to help you remember what it\'s for.'}
            </DialogDescription>
          </DialogHeader>

          {newApiKey ? (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Make sure to copy your API key now. For security reasons, it will not be displayed again.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newApiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <CopyButton content={newApiKey} variant="outline" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production API, Development, My Script"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  maxLength={255}
                />
                <p className="text-xs text-muted-foreground">
                  Only letters, numbers, spaces, underscores, and hyphens are allowed.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {newApiKey ? (
              <Button onClick={resetCreateDialog}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={resetCreateDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateKey}
                  disabled={isCreating || !newKeyName.trim()}
                >
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Key
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={!!showRevokeDialog} onOpenChange={() => setShowRevokeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone, 
              and any applications using this key will no longer be able to access the API.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showRevokeDialog && handleRevokeKey(showRevokeDialog)}
              disabled={!!isRevoking}
            >
              {isRevoking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rotate Confirmation Dialog */}
      <Dialog open={!!showRotateDialog} onOpenChange={() => setShowRotateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate API Key</DialogTitle>
            <DialogDescription>
              This will generate a new API key and revoke the old one. 
              Any applications using the current key will need to be updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRotateDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => showRotateDialog && handleRotateKey(showRotateDialog)}
              disabled={!!isRotating}
            >
              {isRotating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Rotate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

