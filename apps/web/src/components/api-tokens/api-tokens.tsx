import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { formatDistance } from 'date-fns'
import { MoreHorizontal, PlusIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'

import type { RouterOutputs } from '@cared/api'
import { Button } from '@cared/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
import { DataTable } from '@cared/ui/components/data-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cared/ui/components/form'
import { Input } from '@cared/ui/components/input'
import { CircleSpinner } from '@cared/ui/components/spinner'

import type { ColumnDef } from '@tanstack/react-table'
import { useAccounts } from '@/hooks/use-account'
import { useActiveAccount } from '@/hooks/use-active'
import {
  useApiTokens,
  useCreateApiToken,
  useDeleteApiToken,
  useListPermissionGroups,
  useRotateApiToken,
} from '@/hooks/use-api-token'
import { useMembers } from '@/hooks/use-members'
import { useSession } from '@/hooks/use-session'
import { stripIdPrefix } from '@/lib/utils'
import { ApiTokenDialog, useShowApiTokenDialog } from './show-api-token-dialog'

type ApiToken = RouterOutputs['apiToken']['list']['tokens'][number]

function scopeDisplayName(scope: 'account' | 'user'): string {
  return scope === 'account' ? 'Account' : 'User'
}

// Helper function to check if a token is AI API Key (only has dev.cared.api.ai resources)
function isAiApiKey(token: ApiToken): boolean {
  // Check all policies
  for (const policy of token.policies) {
    const resources = Object.keys(policy.resources)
    for (const resource of resources) {
      // If any resource is dev.cared.api.user or dev.cared.api.account, it's not an AI API Key
      if (
        resource.startsWith('dev.cared.api.user') ||
        resource.startsWith('dev.cared.api.account')
      ) {
        return false
      }
    }
  }
  // If we only have dev.cared.api.ai resources (or no resources), it's an AI API Key
  return true
}

// Schema for creating AI API Key
const createAiApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(64, 'Name cannot exceed 64 characters').trim(),
})

type CreateAiApiKeyFormValues = z.infer<typeof createAiApiKeySchema>

// Component for AI API Keys management
function AiApiKeys({
  aiApiKeys,
  refetchApiTokens,
  showApiTokenDialog,
  openRotateDialog,
  openDeleteDialog,
}: {
  aiApiKeys: ApiToken[]
  refetchApiTokens: () => void
  showApiTokenDialog: (token: string, tokenType: 'ai-api-key' | 'api-token') => void
  openRotateDialog: (apiToken: ApiToken) => void
  openDeleteDialog: (apiToken: ApiToken) => void
}) {
  const [showCreateAiKeyDialog, setShowCreateAiKeyDialog] = useState(false)
  const createApiToken = useCreateApiToken()
  const activeAccount = useActiveAccount()
  const { session } = useSession()
  const {
    data: { permissionGroups },
  } = useListPermissionGroups()

  // Get members for account scope to display creator names
  const members = useMembers(activeAccount?.id)

  // Create a map of userId to member name for quick lookup
  const userIdToMemberNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const member of members) {
      if (member.user.id && member.user.name) {
        map.set(member.user.id, member.user.name)
      }
    }
    return map
  }, [members])

  // Helper function to get creator name from userId
  const getCreatorName = (userId: string | null | undefined): string => {
    if (!userId) return ''
    return userIdToMemberNameMap.get(userId) ?? ''
  }

  // Handle creating AI API Key
  const handleCreateAiApiKey = async (name: string) => {
    // Get all permission groups that include dev.cared.api.ai scope
    const aiPermissionGroups = permissionGroups.filter((group) =>
      group.scopes.includes('dev.cared.api.ai'),
    )

    if (aiPermissionGroups.length === 0) {
      throw new Error('No permission groups found for dev.cared.api.ai scope')
    }

    // Create policies for the active account only
    if (!activeAccount) {
      throw new Error('No active account found')
    }

    // Build policies with dev.cared.api.ai resources for the active account
    const policies: {
      effect: 'allow' | 'deny'
      resources: Record<string, '*'>
      permissionGroups: { id: string }[]
    }[] = [
      {
        effect: 'allow',
        resources: {
          [`dev.cared.api.ai.${activeAccount.id}.${session.userId}`]: '*',
        },
        permissionGroups: aiPermissionGroups.map(({ id }) => ({ id })),
      },
    ]

    const result = await createApiToken({
      name,
      scope: 'account',
      policies,
      enabled: true,
    })

    showApiTokenDialog(result.token.token, 'ai-api-key')
    setShowCreateAiKeyDialog(false)
    void refetchApiTokens()
  }

  // Define table columns for AI API Keys (with Created by column)
  const aiApiKeyColumns: ColumnDef<ApiToken>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const apiToken = row.original
        return (
          <div className="flex flex-col max-w-50">
            <span className="font-medium truncate">{apiToken.name}</span>
            <span className="text-sm text-muted-foreground">
              Created {formatDistance(apiToken.createdAt, new Date(), { addSuffix: true })}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'token',
      header: 'API Key',
      cell: ({ row }) => {
        const apiToken = row.original
        return (
          <code className="font-mono">
            {`${apiToken.start}...${apiToken.end}`}
          </code>
        )
      },
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      cell: ({ row }) => {
        const apiToken = row.original
        const creatorName = getCreatorName(apiToken.userId)
        return <span>{creatorName}</span>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const apiToken = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => openRotateDialog(apiToken)}
                className="cursor-pointer"
              >
                <RefreshCwIcon className="h-4 w-4" />
                Regenerate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(apiToken)}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2Icon className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI API Keys</CardTitle>
              <CardDescription>Dedicated API Keys for accessing AI models.</CardDescription>
            </div>
            <Button onClick={() => setShowCreateAiKeyDialog(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create AI API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiApiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border rounded-md">
              <p className="text-sm text-muted-foreground">No AI API Keys found</p>
            </div>
          ) : (
            <DataTable
              columns={aiApiKeyColumns}
              data={aiApiKeys}
              searchKeys={['name']}
              searchPlaceholder="Search AI API Keys..."
            />
          )}
        </CardContent>
      </Card>

      {/* Create AI API Key Dialog */}
      <CreateAiApiKeyDialog
        open={showCreateAiKeyDialog}
        onOpenChange={setShowCreateAiKeyDialog}
        onCreate={handleCreateAiApiKey}
      />
    </>
  )
}

// Simple dialog for creating AI API Key
function CreateAiApiKeyDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => Promise<void>
}) {
  const [isCreating, setIsCreating] = useState(false)
  const form = useForm<CreateAiApiKeyFormValues>({
    resolver: zodResolver(createAiApiKeySchema),
    defaultValues: {
      name: '',
    },
  })

  useEffect(() => {
    form.reset()
  }, [form, open])

  const onSubmit = async (data: CreateAiApiKeyFormValues) => {
    try {
      setIsCreating(true)
      await onCreate(data.name)
      onOpenChange(false)
    } catch (err) {
      // Set form error for display
      form.setError('root', {
        type: 'manual',
        message: err instanceof Error ? err.message : 'Failed to create AI API Key',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isCreating) {
      onOpenChange(newOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create AI API Key</DialogTitle>
          <DialogDescription>
            Create a new AI API Key with dedicated permissions for accessing AI models.
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
                    <Input
                      placeholder="Enter API key name"
                      disabled={isCreating}
                      maxLength={64}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <div className="text-sm text-destructive">{form.formState.errors.root.message}</div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <CircleSpinner />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function ApiTokens({
  scope,
  showTitle,
}: {
  scope: 'account' | 'user'
  showTitle?: boolean
}) {
  const { apiTokens, refetchApiTokens } = useApiTokens(scope)
  const router = useRouter()

  // Separate tokens into two categories
  const { aiApiKeys, apiTokens: regularApiTokens } = useMemo(() => {
    const aiKeys: ApiToken[] = []
    const regularTokens: ApiToken[] = []

    for (const token of apiTokens) {
      if (isAiApiKey(token)) {
        aiKeys.push(token)
      } else {
        regularTokens.push(token)
      }
    }

    return { aiApiKeys: aiKeys, apiTokens: regularTokens }
  }, [apiTokens])

  // Shared dialog states for all cards
  const { showApiTokenDialog, closeApiTokenDialog } = useShowApiTokenDialog()
  const [showRotateDialog, setShowRotateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedApiToken, setSelectedApiToken] = useState<ApiToken | null>(null)
  const [isRotating, setIsRotating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const rotateApiToken = useRotateApiToken()
  const deleteApiToken = useDeleteApiToken()
  const accounts = useAccounts()

  // Close API token dialog when component unmounts
  useEffect(() => {
    return () => {
      closeApiTokenDialog()
    }
  }, [closeApiTokenDialog])

  // Shared handlers for all cards
  const handleRotate = async () => {
    if (!selectedApiToken) return

    try {
      setIsRotating(true)
      const result = await rotateApiToken(selectedApiToken.id)
      const tokenType = isAiApiKey(selectedApiToken) ? 'ai-api-key' : 'api-token'
      showApiTokenDialog(result.token.token, tokenType)
      setShowRotateDialog(false)
      void refetchApiTokens()
    } finally {
      setIsRotating(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedApiToken) return

    try {
      setIsDeleting(true)
      await deleteApiToken(selectedApiToken.id)
      setShowDeleteDialog(false)
      void refetchApiTokens()
    } finally {
      setIsDeleting(false)
    }
  }

  const openRotateDialog = (apiToken: ApiToken) => {
    setSelectedApiToken(apiToken)
    setShowRotateDialog(true)
  }

  const openDeleteDialog = (apiToken: ApiToken) => {
    setSelectedApiToken(apiToken)
    setShowDeleteDialog(true)
  }

  // Get accountId from route params for navigation
  const getAccountIdNoPrefix = () => {
    if (scope === 'account') {
      // Try to get from route context
      try {
        const match = /\/acc_([^/]+)/.exec(router.state.location.pathname)
        if (match?.[1]) {
          return match[1]
        }
      } catch {
        // Fallback: use first account
        if (accounts.length > 0) {
          const firstAccount = accounts[0]
          if (firstAccount) {
            return stripIdPrefix(firstAccount.id)
          }
        }
      }
    }
    return undefined
  }

  // Navigate to create API token page
  const handleNavigateToCreateApiToken = () => {
    if (scope === 'account') {
      const accountIdNoPrefix = getAccountIdNoPrefix()
      if (accountIdNoPrefix) {
        void router.navigate({
          to: '/acc_{$accountIdNoPrefix}/api-tokens/create',
          params: {
            accountIdNoPrefix,
          },
        })
      }
    } else {
      void router.navigate({
        to: '/user/api-tokens/create',
      })
    }
  }

  // Define table columns for regular API Tokens (without Created by column)
  const apiTokenColumns: ColumnDef<ApiToken>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const apiToken = row.original
        return (
          <div className="flex flex-col max-w-50">
            <span className="font-medium truncate">{apiToken.name}</span>
            <span className="text-sm text-muted-foreground">
              Created {formatDistance(apiToken.createdAt, new Date(), { addSuffix: true })}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'token',
      header: 'API Token',
      cell: ({ row }) => {
        const apiToken = row.original
        return (
          <code className="font-mono">
            {`${apiToken.start}...${apiToken.end}`}
          </code>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const apiToken = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => openRotateDialog(apiToken)}
                className="cursor-pointer"
              >
                <RefreshCwIcon className="h-4 w-4" />
                Regenerate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(apiToken)}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2Icon className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="w-full">
          <h3 className="text-lg font-semibold">{scopeDisplayName(scope)} API Tokens</h3>
          <p className="text-sm text-muted-foreground">
            Configure API tokens to securely control access to your accounts, models and apps. Keep
            these tokens secure and never share them publicly.
          </p>
        </div>
      )}

      {/* AI API Keys Card - Only show for account scope */}
      {scope === 'account' && (
        <AiApiKeys
          aiApiKeys={aiApiKeys}
          refetchApiTokens={refetchApiTokens}
          showApiTokenDialog={showApiTokenDialog}
          openRotateDialog={openRotateDialog}
          openDeleteDialog={openDeleteDialog}
        />
      )}

      {/* API Tokens Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Tokens</CardTitle>
              <CardDescription>
                API tokens with restricted permissions to control access to resources.
              </CardDescription>
            </div>
            <Button onClick={handleNavigateToCreateApiToken}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create API Token
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {regularApiTokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border rounded-md">
              <p className="text-sm text-muted-foreground">No API Tokens found</p>
            </div>
          ) : (
            <DataTable
              columns={apiTokenColumns}
              data={regularApiTokens}
              searchKeys={['name']}
              searchPlaceholder="Search API Tokens..."
            />
          )}
        </CardContent>
      </Card>

      {/* Shared Show Token Dialog for all cards */}
      <ApiTokenDialog />

      {/* Shared Rotate Token Dialog for all cards */}
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
            <DialogTitle>Regenerate API Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate your API token? This will invalidate the current
              token and generate a new one.
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

      {/* Shared Delete Token Dialog for all cards */}
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
            <DialogTitle>Delete API Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API token? This action cannot be undone.
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
