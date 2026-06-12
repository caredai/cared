import { Suspense, useCallback, useMemo, useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { formatDistance } from 'date-fns'
import {
  CopyIcon,
  KeyRoundIcon,
  MoreHorizontal,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'

import type { RouterOutputs } from '@cared/api'
import { Button } from '@cared/ui/components/button'
import { Card, CardContent } from '@cared/ui/components/card'
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
import { LocalImage, RemoteImage } from '@/components/image'
import { SectionTitle } from '@/components/section'
import { SkeletonCard } from '@/components/skeleton'
import { useDeleteOAuthApp, useListOAuthApps } from '@/hooks/use-oauth-app'
import { copyTextToClipboard } from '@/lib/clipboard'
import { orpc } from '@/lib/orpc'
import { stripIdPrefix } from '@/lib/utils'
import defaultLogo from '/images/oauth-app-default.svg'

type OAuthApp = RouterOutputs['account']['oauthApp']['list']['oauthApps'][number]

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/oauth-apps')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.account.oauthApp.list.queryOptions())
  },
  component: OAuthAppsPage,
})

function OAuthAppsPage() {
  const { accountIdNoPrefix } = Route.useParams()

  return (
    <>
      <SectionTitle title="OAuth Apps" description="Manage your OAuth Apps" />

      <Suspense fallback={<SkeletonCard />}>
        <OAuthAppsList accountIdNoPrefix={accountIdNoPrefix} />
      </Suspense>
    </>
  )
}

function OAuthAppsList({ accountIdNoPrefix }: { accountIdNoPrefix: string }) {
  const router = useRouter()
  const { oauthApps } = useListOAuthApps()
  const { deleteOAuthApp, isDeleting } = useDeleteOAuthApp()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [appToDelete, setAppToDelete] = useState<OAuthApp | null>(null)

  const navigateToApp = useCallback(
    (oauthAppId: string) => {
      void router.navigate({
        to: '/acc_{$accountIdNoPrefix}/oauth-apps/oa_{$oauthAppIdNoPrefix}',
        params: {
          accountIdNoPrefix,
          oauthAppIdNoPrefix: stripIdPrefix(oauthAppId),
        },
      })
    },
    [accountIdNoPrefix, router],
  )

  const openDeleteDialog = useCallback((app: OAuthApp) => {
    setAppToDelete(app)
    setShowDeleteDialog(true)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!appToDelete) {
      return
    }

    await deleteOAuthApp(appToDelete.id)
    toast.success('OAuth App deleted')
    setShowDeleteDialog(false)
    setAppToDelete(null)
  }, [appToDelete, deleteOAuthApp])

  const copyClientId = useCallback(async (clientId: string) => {
    await copyTextToClipboard(clientId)
    toast.success('Client ID copied to clipboard')
  }, [])

  const copyPublicClientId = useCallback(async (publicClientId: string) => {
    await copyTextToClipboard(publicClientId)
    toast.success('Public client ID copied to clipboard')
  }, [])

  const columns: ColumnDef<OAuthApp>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'App',
        cell: ({ row }) => {
          const app = row.original
          return (
            <div className="flex items-center gap-3 min-w-0 max-w-50">
              <div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden">
                {app.logo ? (
                  <RemoteImage src={app.logo} alt={app.name} fill className="object-cover" />
                ) : (
                  <LocalImage
                    src={defaultLogo}
                    alt="OAuth App Logo"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-medium truncate block">{app.name}</span>
                {app.description && (
                  <span className="text-sm text-muted-foreground truncate block">
                    {app.description}
                  </span>
                )}
              </div>
            </div>
          )
        },
      },
      {
        id: 'scopes',
        header: 'Scopes',
        cell: ({ row }) => row.original.scopes?.length ?? 0,
      },
      {
        id: 'redirectUris',
        header: 'Redirect URIs',
        cell: ({ row }) => row.original.redirectUris.length,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => formatDistance(row.original.createdAt, new Date(), { addSuffix: true }),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const app = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateToApp(app.id)
                  }}
                  className="cursor-pointer"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    void copyClientId(app.clientId)
                  }}
                  className="cursor-pointer"
                >
                  <CopyIcon className="h-4 w-4" />
                  Copy client ID
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    void copyPublicClientId(app.publicClientId)
                  }}
                  className="cursor-pointer"
                >
                  <CopyIcon className="h-4 w-4" />
                  Copy public client ID
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    openDeleteDialog(app)
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
    ],
    [copyClientId, copyPublicClientId, navigateToApp, openDeleteDialog],
  )

  if (oauthApps.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <KeyRoundIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No OAuth Apps</h3>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Register an OAuth App to enable third-party integrations with your account.
          </p>
          <Button asChild>
            <Link to="/acc_{$accountIdNoPrefix}/oauth-apps/create" params={{ accountIdNoPrefix }}>
              <PlusIcon />
              New OAuth App
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={oauthApps}
        searchKeys={['name', 'description']}
        searchPlaceholder="Search OAuth apps..."
        getRowId={(row) => row.id}
        onRowClick={(app) => navigateToApp(app.id)}
        beforeColumnsSelector={
          <Button asChild size="sm">
            <Link to="/acc_{$accountIdNoPrefix}/oauth-apps/create" params={{ accountIdNoPrefix }}>
              <PlusIcon />
              New OAuth App
            </Link>
          </Button>
        }
      />

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setShowDeleteDialog(open)
            if (!open) {
              setAppToDelete(null)
            }
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete OAuth App</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{appToDelete?.name}&quot;? This action cannot be
              undone.
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
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
              {isDeleting ? (
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
    </>
  )
}
