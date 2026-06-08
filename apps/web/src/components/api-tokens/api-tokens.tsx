import { useCallback, useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { formatDistance } from 'date-fns'
import { MoreHorizontal, PencilIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react'

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
import { CircleSpinner } from '@cared/ui/components/spinner'

import type { ColumnDef } from '@tanstack/react-table'
import { MemberIdentity } from '@/components/member-select'
import { PopoverTooltip } from '@/components/tooltip'
import { useAccounts } from '@/hooks/use-account'
import {
  useApiTokens,
  useDeleteApiToken,
  useRotateApiToken,
} from '@/hooks/use-api-token'
import type { Member } from '@/hooks/use-members'
import { useMemberByUserIdLookup, useMembers } from '@/hooks/use-members'
import { stripIdPrefix } from '@/lib/utils'
import { formatMaskedApiToken } from './format-masked-api-token'
import { ApiTokenDialog, useShowApiTokenDialog } from './show-api-token-dialog'

type ApiToken = RouterOutputs['account']['apiToken']['list']['tokens'][number]

function credentialTypeDisplayName(credentialType: 'account' | 'user'): string {
  return credentialType === 'account' ? 'Account' : 'User'
}

export function ApiTokens({
  credentialType,
  showTitle,
}: {
  credentialType: 'account' | 'user'
  showTitle?: boolean
}) {
  if (credentialType === 'account') {
    return <AccountApiTokens showTitle={showTitle} />
  }

  return <ApiTokensContent credentialType="user" showTitle={showTitle} />
}

function AccountApiTokens({ showTitle }: { showTitle?: boolean }) {
  const { members } = useMembers()
  const getMemberByUserId = useMemberByUserIdLookup(members)

  return (
    <ApiTokensContent
      credentialType="account"
      showTitle={showTitle}
      getMemberByUserId={getMemberByUserId}
    />
  )
}

function ApiTokensContent({
  credentialType,
  showTitle,
  getMemberByUserId,
}: {
  credentialType: 'account' | 'user'
  showTitle?: boolean
  getMemberByUserId?: (userId: string | null | undefined) => Member | undefined
}) {
  const { apiTokens, refetchApiTokens } = useApiTokens(credentialType)
  const router = useRouter()
  const accounts = useAccounts()

  const { showApiTokenDialog, closeApiTokenDialog } = useShowApiTokenDialog()
  const [showRotateDialog, setShowRotateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedApiToken, setSelectedApiToken] = useState<ApiToken | null>(null)
  const [isRotating, setIsRotating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const rotateApiToken = useRotateApiToken()
  const deleteApiToken = useDeleteApiToken()

  useEffect(() => {
    return () => {
      closeApiTokenDialog()
    }
  }, [closeApiTokenDialog])

  const handleRotate = async () => {
    if (!selectedApiToken) return

    try {
      setIsRotating(true)
      const result = await rotateApiToken(selectedApiToken.id)
      showApiTokenDialog(result.token.token)
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

  const getAccountIdNoPrefix = useCallback(() => {
    if (credentialType === 'account') {
      try {
        const match = /\/acc_([^/]+)/.exec(router.state.location.pathname)
        if (match?.[1]) {
          return match[1]
        }
      } catch {
        if (accounts.length > 0) {
          const firstAccount = accounts[0]
          if (firstAccount) {
            return stripIdPrefix(firstAccount.id)
          }
        }
      }
    }
    return undefined
  }, [accounts, credentialType, router.state.location.pathname])

  const handleNavigateToCreateApiToken = () => {
    if (credentialType === 'account') {
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

  const navigateToApiToken = useCallback(
    (apiToken: ApiToken) => {
      if (credentialType === 'account') {
        const accountIdNoPrefix = getAccountIdNoPrefix()
        if (!accountIdNoPrefix) return

        void router.navigate({
          to: '/acc_{$accountIdNoPrefix}/api-tokens/at_{$apiTokenIdNoPrefix}',
          params: {
            accountIdNoPrefix,
            apiTokenIdNoPrefix: stripIdPrefix(apiToken.id),
          },
        })
        return
      }

      void router.navigate({
        to: '/user/api-tokens/at_{$apiTokenIdNoPrefix}',
        params: {
          apiTokenIdNoPrefix: stripIdPrefix(apiToken.id),
        },
      })
    },
    [credentialType, getAccountIdNoPrefix, router],
  )

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
          <code className="font-mono">{formatMaskedApiToken(apiToken.start, apiToken.end)}</code>
        )
      },
    },
    ...(credentialType === 'account'
      ? [
          {
            accessorKey: 'member',
            header: () => (
              <div className="flex items-center gap-1">
                Member
                <PopoverTooltip
                  className="inline-block align-bottom"
                  content="The member this token is scoped to. Empty for account-wide tokens."
                />
              </div>
            ),
            cell: ({ row }: { row: { original: ApiToken } }) => {
              const apiToken = row.original
              const member = getMemberByUserId?.(apiToken.userId)

              if (!member) {
                return null
              }

              return <MemberIdentity member={member} className="max-w-50" />
            },
          } satisfies ColumnDef<ApiToken>,
        ]
      : []),
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
                onClick={(e) => {
                  e.stopPropagation()
                  navigateToApiToken(apiToken)
                }}
                className="cursor-pointer"
              >
                <PencilIcon className="h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  openRotateDialog(apiToken)
                }}
                className="cursor-pointer"
              >
                <RefreshCwIcon className="h-4 w-4" />
                Regenerate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  openDeleteDialog(apiToken)
                }}
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
          <h3 className="text-lg font-semibold">
            {credentialTypeDisplayName(credentialType)} API Tokens
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure API tokens to securely control access to your accounts, models and apps. Keep
            these tokens secure and never share them publicly.
          </p>
        </div>
      )}

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
          {apiTokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border rounded-md">
              <p className="text-sm text-muted-foreground">No API Tokens found</p>
            </div>
          ) : (
            <DataTable
              columns={apiTokenColumns}
              data={apiTokens}
              searchKeys={['name']}
              searchPlaceholder="Search API Tokens..."
              getRowId={(row) => row.id}
              onRowClick={navigateToApiToken}
            />
          )}
        </CardContent>
      </Card>

      <ApiTokenDialog />

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
