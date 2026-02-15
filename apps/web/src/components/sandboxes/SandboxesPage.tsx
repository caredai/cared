import { useCallback, useMemo, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { Check, Copy, Loader2, MoreVertical, Pause, Play, Plus, Terminal, Wrench } from 'lucide-react'
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
import { DataTable } from '@cared/ui/components/data-table'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { Input } from '@cared/ui/components/input'
import { Label } from '@cared/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'

import type { ListSandboxesInput, SandboxItem, SnapshotItem } from '@/hooks/use-sandbox'
import type { ColumnDef } from '@tanstack/react-table'
import { CopyButton } from '@/components/copy-button'
import { SectionTitle } from '@/components/section'
import {
  useArchiveSandbox,
  useCreateSandbox,
  useCreateSandboxSshAccess,
  useDeleteSandbox,
  useListRegions,
  useListSandboxes,
  useListSnapshots,
  useRecoverSandbox,
  useRevokeSandboxSshAccess,
  useStartSandbox,
  useStopSandbox,
} from '@/hooks/use-sandbox'
import { copyTextToClipboard } from '@/lib/clipboard'
import { orpc } from '@/lib/orpc'

import { SandboxDetailsSheet } from './SandboxDetailsSheet'

function stateLabel(state: string | undefined) {
  if (!state) return 'unknown'
  const s = state.toLowerCase()
  if (s === 'started') return 'Running'
  if (s === 'stopped') return 'Stopped'
  if (s === 'starting' || s === 'stopping') return state
  if (s === 'error' || s === 'build_failed') return 'Error'
  if (s === 'archived' || s === 'archiving') return state
  if (s === 'destroyed' || s === 'destroying') return 'Destroyed'
  return state
}

function stateVariant(
  state: string | undefined,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!state) return 'secondary'
  const s = state.toLowerCase()
  if (s === 'started') return 'default'
  if (s === 'stopped') return 'secondary'
  if (s === 'error' || s === 'build_failed' || s === 'destroyed') return 'destructive'
  return 'outline'
}

export function SandboxesPage() {
  const [filters] = useState<ListSandboxesInput>({ limit: 20 })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sandboxToDelete, setSandboxToDelete] = useState<string | null>(null)
  const [selectedSandbox, setSelectedSandbox] = useState<SandboxItem | null>(null)
  const [showDetailsSheet, setShowDetailsSheet] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [showCreateSshDialog, setShowCreateSshDialog] = useState(false)
  const [showRevokeSshDialog, setShowRevokeSshDialog] = useState(false)
  const [sshAccess, setSshAccess] = useState<{ sshCommand: string } | null>(null)
  const [sshSandboxId, setSshSandboxId] = useState('')
  const [sshExpiryMinutes, setSshExpiryMinutes] = useState(60)
  const [revokeSshToken, setRevokeSshToken] = useState('')
  const [copiedSsh, setCopiedSsh] = useState(false)

  const [createName, setCreateName] = useState('')
  const [createSnapshot, setCreateSnapshot] = useState<string>('')
  const [createRegionId, setCreateRegionId] = useState<string>('')

  const { data: regionsData } = useListRegions()
  const { snapshots } = useListSnapshots({ limit: 100 })
  const { sandboxes, hasMore, isFetchingNextPage, fetchNextPage, refetch } =
    useListSandboxes(filters)

  const createMutation = useCreateSandbox()
  const deleteMutation = useDeleteSandbox()
  const startMutation = useStartSandbox()
  const stopMutation = useStopSandbox()
  const archiveMutation = useArchiveSandbox()
  const recoverMutation = useRecoverSandbox()
  const createSshMutation = useCreateSandboxSshAccess()
  const revokeSshMutation = useRevokeSandboxSshAccess()

  const regions = useMemo(
    () => regionsData?.regions ?? [],
    [regionsData?.regions],
  )

  const getRegionName = useCallback(
    (regionId: string) => regions.find((r) => r.id === regionId)?.name,
    [regions],
  )

  const getPortPreviewUrl = useCallback(async (sandboxId: string, port: number): Promise<string | null> => {
    try {
      const result = await orpc.account.sandbox.getSandboxSignedPortPreviewUrl.call({
        idOrName: sandboxId,
        port,
      })
      return result.url
    } catch {
      return null
    }
  }, [])


  const runAction = useCallback(
    async (id: string, name: string, fn: () => Promise<unknown>) => {
      setActionLoading((prev) => ({ ...prev, [id]: true }))
      try {
        await fn()
        toast.success(`${name} succeeded`)
        void refetch()
      } catch (e) {
        toast.error(`${name} failed`)
        console.error(e)
      } finally {
        setActionLoading((prev) => ({ ...prev, [id]: false }))
      }
    },
    [refetch],
  )

  const handleDelete = (id: string) => {
    setSandboxToDelete(id)
    setShowDeleteDialog(true)
  }

  const openCreateSshDialog = useCallback((id: string) => {
    setSshSandboxId(id)
    setSshAccess(null)
    setSshExpiryMinutes(60)
    setShowCreateSshDialog(true)
  }, [])

  const handleCreateSshSubmit = useCallback(async () => {
    if (!sshSandboxId) return
    setActionLoading((prev) => ({ ...prev, [sshSandboxId]: true }))
    try {
      const result = await createSshMutation.mutateAsync({
        idOrName: sshSandboxId,
        expiresInMinutes: sshExpiryMinutes,
      })
      // Ensure we have the sshCommand before updating state
      const sshCommand = result.sshAccess.sshCommand
      if (sshCommand) {
        // Use a new object to ensure React detects the state change
        setSshAccess({ sshCommand })
        toast.success('SSH access created successfully')
      } else {
        console.error('Invalid SSH access response:', result)
        toast.error('Failed to create SSH access: Invalid response')
      }
    } catch (e) {
      toast.error('Failed to create SSH access')
      console.error('SSH access creation error:', e)
    } finally {
      setActionLoading((prev) => ({ ...prev, [sshSandboxId]: false }))
    }
  }, [sshSandboxId, sshExpiryMinutes, createSshMutation])

  const handleRevokeSshAccess = useCallback(async () => {
    if (!sshSandboxId) return
    try {
      await revokeSshMutation.mutateAsync({
        idOrName: sshSandboxId,
        token: revokeSshToken.trim() || undefined,
      })
      toast.success('SSH access revoked')
      setShowRevokeSshDialog(false)
      setRevokeSshToken('')
      setSshSandboxId('')
    } catch (e) {
      toast.error('Failed to revoke SSH access')
      console.error(e)
    }
  }, [sshSandboxId, revokeSshToken, revokeSshMutation])

  const confirmDelete = async () => {
    if (!sandboxToDelete) return
    await runAction(sandboxToDelete, 'Delete sandbox', () =>
      deleteMutation.mutateAsync({ idOrName: sandboxToDelete }),
    )
    setShowDeleteDialog(false)
    setSandboxToDelete(null)
  }

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        name: createName.trim() || undefined,
        snapshot: createSnapshot || undefined,
        regionId: createRegionId || undefined,
      })
      toast.success('Sandbox created')
      setShowCreateDialog(false)
      setCreateName('')
      setCreateSnapshot('')
      setCreateRegionId('')
      void refetch()
    } catch (e) {
      toast.error('Failed to create sandbox')
      console.error(e)
    }
  }

  const openDetails = useCallback((sandbox: SandboxItem) => {
    setSelectedSandbox(sandbox)
    setShowDetailsSheet(true)
  }, [])

  const columns = useMemo<ColumnDef<SandboxItem, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const s = row.original
          const displayName = s.name || s.id
          return (
            <button
              type="button"
              className="font-medium text-left truncate block w-full max-w-[120px] hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                openDetails(s)
              }}
            >
              {displayName}
            </button>
          )
        },
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 min-w-0 max-w-[120px]">
            <span className="font-mono text-xs text-muted-foreground truncate block">
              {row.original.id}
            </span>
            <CopyButton value={row.original.id} />
          </div>
        ),
      },
      {
        accessorKey: 'state',
        header: 'State',
        cell: ({ row }) => {
          const state = row.original.state
          return <Badge variant={stateVariant(state)}>{stateLabel(state)}</Badge>
        },
      },
      {
        accessorKey: 'snapshot',
        header: 'Snapshot',
        cell: ({ row }) => row.original.snapshot ?? '—',
      },
      {
        accessorKey: 'regionId',
        header: 'Region',
        cell: ({ row }) =>
          regions.find((r) => r.id === row.original.regionId)?.name ?? row.original.regionId,
      },
      {
        id: 'resources',
        header: 'Resources',
        cell: ({ row }) => {
          const s = row.original
          return (
            <div className="flex items-center gap-2 min-w-[220px] whitespace-nowrap">
              <span>
                {s.cpu} <span className="text-muted-foreground">vCPU</span>
              </span>
              <span className="w-[1px] h-4 bg-muted-foreground/20 rounded-full shrink-0" />
              <span>
                {s.memory} <span className="text-muted-foreground">GiB</span>
              </span>
              <span className="w-[1px] h-4 bg-muted-foreground/20 rounded-full shrink-0" />
              <span>
                {s.disk} <span className="text-muted-foreground">GiB</span>
              </span>
            </div>
          )
        },
      },
      {
        id: 'lastEvent',
        header: 'Last Event',
        cell: ({ row }) => {
          const updatedAt = row.original.updatedAt
          return (
            <span className="text-muted-foreground text-sm">
              {updatedAt
                ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true })
                : '—'}
            </span>
          )
        },
      },
      {
        id: 'createdAt',
        header: 'Created',
        cell: ({ row }) => {
          const createdAt = row.original.createdAt
          return (
            <span className="text-muted-foreground text-sm">
              {createdAt ? format(new Date(createdAt), 'PP') : '—'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const s = row.original
          const id = s.id
          const state = (s.state ?? '').toLowerCase()
          const loading = actionLoading[id]

          const handleOpenPort = async (port: number) => {
            const url = await getPortPreviewUrl(id, port)
            if (url) window.open(url, '_blank')
            else toast.error('Failed to get URL')
          }

          type MenuItem =
            | { type: 'separator' }
            | {
                key: string
                label: string
                onClick: () => void
                disabled?: boolean
                className?: string
              }
          const menuItems: MenuItem[] = []
          if (state === 'started') {
            menuItems.push({
              key: 'vnc',
              label: 'VNC',
              disabled: loading,
              onClick: () => void handleOpenPort(6080),
            })
            menuItems.push({
              key: 'screen-recordings',
              label: 'Screen Recordings',
              disabled: loading,
              onClick: () => void handleOpenPort(33333),
            })
            menuItems.push({
              key: 'stop',
              label: 'Stop',
              disabled: loading,
              onClick: () => void runAction(id, 'Stop', () => stopMutation.mutateAsync({ idOrName: id })),
            })
          } else if (state === 'stopped' || state === 'archived') {
            menuItems.push({
              key: 'start',
              label: 'Start',
              disabled: loading,
              onClick: () => void runAction(id, 'Start', () => startMutation.mutateAsync({ idOrName: id })),
            })
          } else if ((state === 'error' || state === 'build_failed') && s.recoverable) {
            menuItems.push({
              key: 'recover',
              label: 'Recover',
              disabled: loading,
              onClick: () =>
                void runAction(id, 'Recover', () => recoverMutation.mutateAsync({ idOrName: id })),
            })
          }
          if (state === 'stopped') {
            menuItems.push({
              key: 'archive',
              label: 'Archive',
              disabled: loading,
              onClick: () =>
                void runAction(id, 'Archive', () => archiveMutation.mutateAsync({ idOrName: id })),
            })
          }
          menuItems.push({
            key: 'create-ssh',
            label: 'Create SSH Access',
            disabled: loading,
            onClick: () => openCreateSshDialog(id),
          })
          menuItems.push({
            key: 'revoke-ssh',
            label: 'Revoke SSH Access',
            disabled: loading,
            onClick: () => {
              setSshSandboxId(id)
              setRevokeSshToken('')
              setShowRevokeSshDialog(true)
            },
          })
          if (menuItems.length > 0 && (state === 'stopped' || state === 'started')) {
            menuItems.push({ type: 'separator' })
          }
          if (!['destroyed', 'destroying'].includes(state)) {
            menuItems.push({
              key: 'delete',
              label: 'Delete',
              disabled: loading,
              className: 'text-red-600 dark:text-red-400',
              onClick: () => handleDelete(id),
            })
          }

          return (
            <div className="w-full flex justify-end items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 p-0 text-muted-foreground"
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation()
                  if (state === 'started') {
                    void runAction(id, 'Stop', () => stopMutation.mutateAsync({ idOrName: id }))
                  } else if ((state === 'error' || state === 'build_failed') && s.recoverable) {
                    void runAction(id, 'Recover', () =>
                      recoverMutation.mutateAsync({ idOrName: id }),
                    )
                  } else if (state === 'stopped' || state === 'archived') {
                    void runAction(id, 'Start', () => startMutation.mutateAsync({ idOrName: id }))
                  }
                }}
              >
                {state === 'started' ? (
                  <Pause className="w-4 h-4" />
                ) : state === 'stopping' || state === 'starting' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (state === 'error' || state === 'build_failed') && s.recoverable ? (
                  <Wrench className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              {state === 'started' ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 p-0 text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    void handleOpenPort(22222)
                  }}
                >
                  <Terminal className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 p-0 text-muted-foreground"
                  disabled
                >
                  <Terminal className="w-4 h-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 p-0 text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {menuItems.map((item) => {
                    if ('type' in item) {
                      return <DropdownMenuSeparator key="separator" />
                    }
                    const action = item as {
                      key: string
                      label: string
                      onClick: () => void
                      disabled?: boolean
                      className?: string
                    }
                    return (
                      <DropdownMenuItem
                        key={action.key}
                        className={`cursor-pointer ${action.className ?? ''}`}
                        disabled={action.disabled}
                        onClick={(e) => {
                          e.stopPropagation()
                          action.onClick()
                        }}
                      >
                        {action.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [
      regions,
      actionLoading,
      openDetails,
      getPortPreviewUrl,
      runAction,
      startMutation,
      stopMutation,
      archiveMutation,
      recoverMutation,
      openCreateSshDialog,
    ],
  )

  return (
    <>
      <SectionTitle title="Sandboxes" description="Create and manage sandboxes" />
      <div className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Sandbox
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Sandbox</DialogTitle>
                <DialogDescription>
                  Create a new sandbox from a snapshot. Optionally set name, snapshot, and region.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Name (optional)</Label>
                  <Input
                    id="create-name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="my-sandbox"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Snapshot</Label>
                  <Select value={createSnapshot} onValueChange={setCreateSnapshot}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select snapshot" />
                    </SelectTrigger>
                    <SelectContent>
                      {snapshots.map((sn: SnapshotItem) => (
                        <SelectItem key={sn.id} value={sn.name}>
                          {sn.name} ({sn.state})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select value={createRegionId} onValueChange={setCreateRegionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          columns={columns}
          data={sandboxes}
          searchKeys={['name', 'id']}
          searchPlaceholder="Search sandboxes..."
          getRowId={(row) => row.id}
          enableInfiniteScroll
          hasNextPage={hasMore}
          isFetchingNextPage={isFetchingNextPage}
          onFetchNextPage={() => void fetchNextPage()}
          onRowClick={openDetails}
        />
      </div>

      <SandboxDetailsSheet
        sandbox={selectedSandbox}
        open={showDetailsSheet}
        onOpenChange={setShowDetailsSheet}
        getRegionName={getRegionName}
        onStart={(id) => runAction(id, 'Start', () => startMutation.mutateAsync({ idOrName: id }))}
        onStop={(id) => runAction(id, 'Stop', () => stopMutation.mutateAsync({ idOrName: id }))}
        onArchive={(id) =>
          runAction(id, 'Archive', () => archiveMutation.mutateAsync({ idOrName: id }))
        }
        onDelete={(id) => {
          setShowDetailsSheet(false)
          setSelectedSandbox(null)
          handleDelete(id)
        }}
        onRecover={(id) =>
          runAction(id, 'Recover', () => recoverMutation.mutateAsync({ idOrName: id }))
        }
        actionLoading={actionLoading}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sandbox</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The sandbox will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSandboxToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showCreateSshDialog}
        onOpenChange={(open) => {
          // Don't close dialog if SSH access was just created and is being displayed
          if (!open && sshAccess?.sshCommand) {
            return
          }
          setShowCreateSshDialog(open)
          if (!open) {
            setSshAccess(null)
            setSshSandboxId('')
            setSshExpiryMinutes(60)
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Create SSH Access</AlertDialogTitle>
            <AlertDialogDescription>
              {sshAccess?.sshCommand
                ? 'SSH access has been created successfully. Use the token below to connect:'
                : 'Set the expiration time for SSH access:'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            {!sshAccess?.sshCommand ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Expiry (minutes):</Label>
                <Input
                  type="number"
                  min={1}
                  max={1440}
                  value={sshExpiryMinutes}
                  onChange={(e) => setSshExpiryMinutes(Number(e.target.value))}
                  className="h-10"
                />
              </div>
            ) : (
              <div className="p-3 flex justify-between items-center rounded-md bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
                <span className="overflow-x-auto pr-2 cursor-text select-all">{sshAccess.sshCommand}</span>
                {copiedSsh ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <Copy
                    className="w-4 h-4 cursor-pointer shrink-0"
                    onClick={() => {
                      void copyTextToClipboard(sshAccess.sshCommand).then(() => {
                        setCopiedSsh(true)
                        setTimeout(() => setCopiedSsh(false), 2000)
                      })
                    }}
                  />
                )}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            {!sshAccess?.sshCommand ? (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  onClick={() => void handleCreateSshSubmit()}
                  disabled={!sshSandboxId || createSshMutation.isPending}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  {createSshMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </>
            ) : (
              <AlertDialogAction
                onClick={() => setShowCreateSshDialog(false)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Close
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showRevokeSshDialog}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeSshToken('')
            setSshSandboxId('')
          }
          setShowRevokeSshDialog(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke SSH Access</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the SSH access token to revoke, or leave empty to revoke all for this sandbox.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Token (optional)</Label>
            <Input
              value={revokeSshToken}
              onChange={(e) => setRevokeSshToken(e.target.value)}
              placeholder="Leave empty to revoke all"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleRevokeSshAccess()}
              disabled={revokeSshMutation.isPending}
            >
              {revokeSshMutation.isPending ? 'Revoking...' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
