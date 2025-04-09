'use client'

import { useCallback, useState } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { CheckIcon, CopyIcon, RefreshCwIcon, TrashIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@ownxai/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@ownxai/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ownxai/ui/components/dialog'
import { Input } from '@ownxai/ui/components/input'

import { CircleSpinner } from '@/components/spinner'
import { useTRPC } from '@/trpc/client'

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

export function ApiKey({ appId }: { appId: string }) {
  const trpc = useTRPC()
  const {
    data: { exists },
  } = useSuspenseQuery(
    trpc.apiKey.has.queryOptions({
      appId,
    }),
  )

  if (!exists) {
    return <CreateApiKey appId={appId} />
  } else {
    return <UpdateApiKey appId={appId} />
  }
}

// Create API key component
export function CreateApiKey({ appId }: { appId: string }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    ...trpc.apiKey.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.apiKey.has.queryKey({ appId }),
        })
        void queryClient.invalidateQueries({
          queryKey: trpc.apiKey.get.queryKey({ appId }),
        })
      },
      onError: (error) => {
        toast.error(`Failed to create API key: ${error.message}`)
      },
    }),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create API Key</CardTitle>
        <CardDescription>
          Create a new API key to authenticate your application. Keep this key secure and never
          share it publicly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => createMutation.mutate({ appId })}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <CircleSpinner className="h-4 w-4" />
              Creating...
            </>
          ) : (
            'Create API Key'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Update API key component
export function UpdateApiKey({ appId }: { appId: string }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [keyToShow, setKeyToShow] = useState<string>()
  const [showRotateDialog, setShowRotateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const {
    data: { key: apiKey },
  } = useSuspenseQuery(
    trpc.apiKey.get.queryOptions({
      appId,
    }),
  )

  const rotateMutation = useMutation({
    ...trpc.apiKey.rotate.mutationOptions({
      onSuccess: (data) => {
        void queryClient.invalidateQueries({
          queryKey: trpc.apiKey.get.queryKey({ appId }),
        })
        setKeyToShow(data.key.key)
        setShowKeyDialog(true)
        setShowRotateDialog(false)
      },
      onError: (error) => {
        toast.error(`Failed to rotate API key: ${error.message}`)
      },
    }),
  })

  const deleteMutation = useMutation({
    ...trpc.apiKey.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.apiKey.has.queryKey({ appId }),
        })
        setShowDeleteDialog(false)
      },
      onError: (error) => {
        toast.error(`Failed to delete API key: ${error.message}`)
      },
    }),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key</CardTitle>
        <CardDescription>
          Your API key for authenticating requests. Keep this key secure and never share it
          publicly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {`${apiKey.start ?? ''}••••••••••••••••••••••••••`}
          </code>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowRotateDialog(true)}
          disabled={rotateMutation.isPending}
        >
          <RefreshCwIcon className="h-4 w-4" />
          Regenerate
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          disabled={deleteMutation.isPending}
        >
          <TrashIcon className="h-4 w-4" />
          Delete
        </Button>
      </CardFooter>

      {/* Show Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key</DialogTitle>
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

      {/* Rotate Key Dialog */}
      <Dialog
        open={showRotateDialog}
        onOpenChange={(open) => {
          if (!rotateMutation.isPending) {
            setShowRotateDialog(open)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to rotate your API key? This will invalidate the current key and
              generate a new one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRotateDialog(false)}
              disabled={rotateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => rotateMutation.mutate({ appId })}
              disabled={rotateMutation.isPending}
            >
              {rotateMutation.isPending ? (
                <>
                  <CircleSpinner className="h-4 w-4" />
                  Regenerate...
                </>
              ) : (
                'Regenerate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Key Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending) {
            setShowDeleteDialog(open)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate({ appId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <CircleSpinner className="h-4 w-4" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
