'use client'

import { useCallback, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, CopyIcon, PlusIcon, RefreshCwIcon, TrashIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { ApiKey } from '@cared/api'
import { Button } from '@cared/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cared/ui/components/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cared/ui/components/form'
import { Input } from '@cared/ui/components/input'

import { CircleSpinner } from '@/components/spinner'
import {
  useAppApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  useRotateApiKey,
} from '@/hooks/use-api-key'

// Form schema for creating API key
const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(64, 'Name cannot exceed 64 characters'),
})

type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>

// Copy button component for copying API key
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  return (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={copy}>
      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
    </Button>
  )
}

export function ApiKeys({ appId }: { appId: string }) {
  const { apiKeys, refetchApiKeys } = useAppApiKeys(appId)

  // Shared dialog states for all cards
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [keyToShow, setKeyToShow] = useState<string>()
  const [showRotateDialog, setShowRotateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null)
  const [isRotating, setIsRotating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const rotateApiKey = useRotateApiKey()
  const deleteApiKey = useDeleteApiKey()

  // Shared handlers for all cards
  const handleRotate = async () => {
    if (!selectedApiKey) return

    try {
      setIsRotating(true)
      const result = await rotateApiKey(selectedApiKey.id)
      setKeyToShow(result.key.key)
      setShowKeyDialog(true)
      setShowRotateDialog(false)
      void refetchApiKeys()
    } finally {
      setIsRotating(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedApiKey) return

    try {
      setIsDeleting(true)
      await deleteApiKey(selectedApiKey.id)
      setShowDeleteDialog(false)
      void refetchApiKeys()
    } finally {
      setIsDeleting(false)
    }
  }

  const openRotateDialog = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey)
    setShowRotateDialog(true)
  }

  const openDeleteDialog = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey)
    setShowDeleteDialog(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Keys</h3>
          <p className="text-sm text-muted-foreground">
            Manage API keys for authenticating your application. Keep these keys secure and never
            share them publicly.
          </p>
        </div>
        <CreateApiKeyDialog appId={appId} onSuccess={refetchApiKeys} />
      </div>

      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground mb-4">No API keys found</p>
            <CreateApiKeyDialog appId={appId} onSuccess={refetchApiKeys} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((apiKey) => (
            <ApiKeyCard
              key={apiKey.id}
              apiKey={apiKey}
              onRotate={openRotateDialog}
              onDelete={openDeleteDialog}
            />
          ))}
        </div>
      )}

      {/* Shared Show Key Dialog for all cards */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key</DialogTitle>
            <DialogDescription>
              This is your new API key. Make sure to copy it now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input value={keyToShow ?? ''} readOnly className="font-mono" />
            <CopyButton value={keyToShow ?? ''} />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shared Rotate Key Dialog for all cards */}
      <Dialog
        open={showRotateDialog}
        onOpenChange={(open) => {
          if (!isRotating) {
            setShowRotateDialog(open)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate your API key? This will invalidate the current key
              and generate a new one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRotateDialog(false)}
              disabled={isRotating}
            >
              Cancel
            </Button>
            <Button variant="default" onClick={handleRotate} disabled={isRotating}>
              {isRotating ? (
                <>
                  <CircleSpinner />
                  Regenerating...
                </>
              ) : (
                'Regenerate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shared Delete Key Dialog for all cards */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setShowDeleteDialog(open)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <CircleSpinner />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Create API key dialog component
function CreateApiKeyDialog({ appId, onSuccess }: { appId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [keyToShow, setKeyToShow] = useState<string>()
  const [isCreating, setIsCreating] = useState(false)

  const createApiKey = useCreateApiKey()

  const form = useForm<CreateApiKeyFormValues>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: '',
    },
  })

  const onSubmit = async (data: CreateApiKeyFormValues) => {
    try {
      setIsCreating(true)
      const result = await createApiKey({
        name: data.name,
        scope: 'app',
        appId,
      })

      setKeyToShow(result.key.key)
      setShowKeyDialog(true)
      setOpen(false)
      form.reset()
      onSuccess()
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusIcon />
            Create
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key to authenticate your application. Keep this key secure and never
              share it publicly.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter API key name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <CircleSpinner />
                      Creating...
                    </>
                  ) : (
                    'Create API Key'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Show Key Dialog for newly created key */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              This is your API key. Make sure to copy it now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input value={keyToShow ?? ''} readOnly className="font-mono" />
            <CopyButton value={keyToShow ?? ''} />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Individual API key card component - simplified without dialogs
function ApiKeyCard({
  apiKey,
  onRotate,
  onDelete,
}: {
  apiKey: ApiKey
  onRotate: (apiKey: ApiKey) => void
  onDelete: (apiKey: ApiKey) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{apiKey.name || 'Unnamed API Key'}</span>
          <span className="text-sm font-normal text-muted-foreground">
            Created {new Date(apiKey.createdAt).toLocaleDateString()}
          </span>
        </CardTitle>
        <CardDescription>API key for authenticating requests to your application</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm truncate">
            {`${apiKey.start}••••••••••••••••••••••••••`}
          </code>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" className="hidden" onClick={() => onRotate(apiKey)}>
          <RefreshCwIcon />
          Regenerate
        </Button>
        <Button variant="destructive" onClick={() => onDelete(apiKey)}>
          <TrashIcon />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
