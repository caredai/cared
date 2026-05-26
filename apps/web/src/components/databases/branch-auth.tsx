import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@cared/ui/components/alert-dialog'
import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { Card, CardContent } from '@cared/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import { Input } from '@cared/ui/components/input'
import { Label } from '@cared/ui/components/label'
import { cn } from '@cared/ui/lib/utils'

import { CopyButton } from '@/components/copy-button'
import { SectionTitle } from '@/components/section'
import { useDatabaseJwks, useDatabaseJwksActions } from '@/hooks/use-database'
import { RelativeTime } from './database-format'

interface BranchAuthProps {
  namespaceId: string
  branchId: string
}

export function BranchAuth({ namespaceId, branchId }: BranchAuthProps) {
  const jwks = useDatabaseJwks(namespaceId, branchId)
  const { addJwks, deleteJwks, isPending } = useDatabaseJwksActions(namespaceId)

  const [open, setOpen] = useState(false)
  const [providerName, setProviderName] = useState('')
  const [jwksUrl, setJwksUrl] = useState('')
  const [jwtAudience, setJwtAudience] = useState('')
  const [jwksToDelete, setJwksToDelete] = useState<string | null>(null)

  const handleAdd = async () => {
    const provider = providerName.trim()
    const url = jwksUrl.trim()
    if (!provider) {
      toast.error('Provider name is required')
      return
    }
    if (!url) {
      toast.error('JWKS URL is required')
      return
    }

    await addJwks({
      providerName: provider,
      jwksUrl: url,
      branchId,
      jwtAudience: jwtAudience.trim() || undefined,
    })
    setProviderName('')
    setJwksUrl('')
    setJwtAudience('')
    setOpen(false)
  }

  const handleDelete = async () => {
    if (!jwksToDelete) return
    await deleteJwks(jwksToDelete)
    setJwksToDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          title="Auth"
          description="Configure JWT authentication providers for Neon Data API and protected database access."
        />
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add provider
        </Button>
      </div>

      <div className="space-y-3">
        {jwks.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{item.providerName}</span>
                  <Badge variant="secondary">JWKS</Badge>
                  {item.jwtAudience && <Badge variant="outline">{item.jwtAudience}</Badge>}
                </div>
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                  <code className="min-w-0 flex-1 truncate text-xs">{item.jwksUrl}</code>
                  <CopyButton value={item.jwksUrl} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>ID {item.id}</span>
                  <span>
                    Updated <RelativeTime value={item.updatedAt} className="inline" />
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                aria-label="Delete provider"
                onClick={() => setJwksToDelete(item.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {jwks.length === 0 && (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            No authentication providers configured for this branch.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add authentication provider</DialogTitle>
            <DialogDescription>
              Add a JWKS URL that Neon can use to verify JWTs for this branch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="jwks-provider-name">Provider name</Label>
              <Input
                id="jwks-provider-name"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="Clerk"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jwks-url">JWKS URL</Label>
              <Input
                id="jwks-url"
                value={jwksUrl}
                onChange={(e) => setJwksUrl(e.target.value)}
                placeholder="https://example.com/.well-known/jwks.json"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jwt-audience">JWT audience</Label>
              <Input
                id="jwt-audience"
                value={jwtAudience}
                onChange={(e) => setJwtAudience(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={() => void handleAdd()}>
              {isPending ? 'Adding…' : 'Add provider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={jwksToDelete != null}
        onOpenChange={(open) => !open && setJwksToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete authentication provider?</AlertDialogTitle>
            <AlertDialogDescription>
              JWTs signed by this provider will no longer be accepted by Neon for this branch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn('bg-destructive text-destructive-foreground hover:bg-destructive/90')}
              disabled={isPending}
              onClick={() => void handleDelete()}
            >
              {isPending ? 'Deleting…' : 'Delete provider'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
