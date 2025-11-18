import type { VirtualizerHandle } from 'virtua'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeftIcon, MoreHorizontal, RefreshCwIcon, ServerIcon, Trash2Icon } from 'lucide-react'
import { Virtualizer } from 'virtua'

import type { ConnectionStatus } from '@cared/api'
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
import { Avatar, AvatarFallback, AvatarImage } from '@cared/ui/components/avatar'
import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { DataTable } from '@cared/ui/components/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { CircleSpinner } from '@cared/ui/components/spinner'
import { Switch } from '@cared/ui/components/switch'

import type { Connection } from '@/hooks/use-tools'
import type { ColumnDef } from '@tanstack/react-table'
import { ConnectionTypeSelector } from '@/components/connection-type-selector'
import { CopyButton } from '@/components/copy-button'
import { SearchInput } from '@/components/search-input'
import { SkeletonCard } from '@/components/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import {
  useConnections,
  useCreateConnection,
  useDeleteConnection,
  useRefreshConnection,
  useTools,
  useUpdateConnection,
} from '@/hooks/use-tools'
import { ConnectionDetailSheet } from './connection-detail-sheet'
import { ToolDetailSheet } from './tool-detail-sheet'

interface Toolkit {
  name: string
  slug: string
  noAuth?: boolean
  meta?: {
    logo?: string
  }
}

/**
 * Toolkit detail component
 * Displays toolkit details with Connections and Tools tabs
 */
export function ToolkitDetail({ toolkit, onBack }: { toolkit: Toolkit; onBack?: () => void }) {
  // For NO_AUTH toolkits, default to 'tools' tab, otherwise 'connections'
  const [activeTab, setActiveTab] = useState<'connections' | 'tools'>(
    toolkit.noAuth ? 'tools' : 'connections',
  )
  const [connectionType, setConnectionType] = useState<'user' | 'account'>('user')
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<{ slug: string; name: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ConnectionStatus | 'ALL'>('ALL')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const vListRef = useRef<VirtualizerHandle>(null)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { connections, refetchConnections } = useConnections([toolkit.slug], connectionType)
  const createConnection = useCreateConnection()
  const deleteConnection = useDeleteConnection()
  const updateConnection = useUpdateConnection()
  const refreshConnection = useRefreshConnection()
  const [isConnecting, setIsConnecting] = useState(false)

  // Reset detail view when switching tabs
  useEffect(() => {
    setSelectedConnectionId(null)
    setSelectedTool(null)
    setSearchQuery('')
  }, [activeTab])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
      }
    }
  }, [])

  // Handle connect button click
  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const result = await createConnection({
        toolkit: toolkit.slug,
        type: connectionType,
      })

      // If there's a redirect URL, open it in a popup window
      if (result.connection.redirectUrl) {
        const width = 600
        const height = 700
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2

        const popup = window.open(
          result.connection.redirectUrl,
          'oauth-popup',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`,
        )

        // Poll to check if popup is closed
        if (popup) {
          // Clear any existing timer
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current)
          }

          pollTimerRef.current = setInterval(() => {
            if (popup.closed) {
              if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current)
                pollTimerRef.current = null
              }
              // Refetch connections after popup is closed
              void refetchConnections()
              setIsConnecting(false)
            }
          }, 500)
        } else {
          setIsConnecting(false)
        }
      } else {
        setIsConnecting(false)
      }
    } catch {
      // Error already handled in mutation options
      setIsConnecting(false)
    }
  }

  const getStatusBadgeVariant = (status: ConnectionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'INITIALIZING':
      case 'INITIATED':
        return 'secondary'
      case 'FAILED':
        return 'destructive'
      case 'EXPIRED':
      case 'INACTIVE':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  // Handle refresh connection
  const handleRefreshConnection = async (connectionId: string) => {
    try {
      const result = await refreshConnection({
        id: connectionId,
        type: connectionType,
      })

      // If there's a redirect URL, open it in a popup window
      if (result.connection.redirectUrl) {
        const width = 600
        const height = 700
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2

        const popup = window.open(
          result.connection.redirectUrl,
          'oauth-popup',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`,
        )

        // Poll to check if popup is closed
        if (popup) {
          // Clear any existing timer
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current)
          }

          pollTimerRef.current = setInterval(() => {
            if (popup.closed) {
              if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current)
                pollTimerRef.current = null
              }
              // Refetch connections after popup is closed
              void refetchConnections()
            }
          }, 500)
        }
      }
    } catch {
      // Error already handled in mutation
    }
  }

  // Handle delete connection - open confirmation dialog
  const handleDeleteConnection = (connectionId: string) => {
    setConnectionToDelete(connectionId)
    setDeleteDialogOpen(true)
  }

  // Confirm delete connection
  const confirmDeleteConnection = async () => {
    if (!connectionToDelete) return

    setIsDeleting(true)
    try {
      await deleteConnection({
        id: connectionToDelete,
        type: connectionType,
      })
      // Only close dialog on success
      setDeleteDialogOpen(false)
      setConnectionToDelete(null)
    } catch {
      // Error already handled in mutation
      // Keep dialog open on error
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle toggle enabled status
  const handleToggleEnabled = async (connectionId: string, enabled: boolean) => {
    try {
      await updateConnection({
        id: connectionId,
        enabled,
        type: connectionType,
      })
    } catch {
      // Error already handled in mutation
    }
  }

  // Connections list component that uses hooks
  function ConnectionsListContent({ connections }: { connections: Connection[] }) {
    // Filter connections by status
    const filteredConnections = connections.filter((connection) => {
      if (statusFilter !== 'ALL' && connection.status !== statusFilter) {
        return false
      }
      return true
    })

    // Define table columns
    const columns: ColumnDef<Connection>[] = useMemo(
      () => [
        {
          accessorKey: 'id',
          header: 'ID',
          cell: ({ row }) => {
            const connection = row.original
            return (
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono truncate max-w-[200px]">{connection.id}</code>
                <CopyButton value={connection.id} />
              </div>
            )
          },
        },
        {
          id: 'authScheme',
          header: 'Auth Scheme',
          cell: ({ row }) => {
            const connection = row.original
            const authScheme = connection.state?.authScheme
            return (
              <Badge variant="outline" className="font-mono text-xs">
                {authScheme ?? 'N/A'}
              </Badge>
            )
          },
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => {
            const connection = row.original
            return (
              <Badge variant={getStatusBadgeVariant(connection.status)}>{connection.status}</Badge>
            )
          },
        },
        {
          id: 'enabled',
          header: 'Enabled',
          cell: ({ row }) => {
            const connection = row.original
            const isActive = connection.status === 'ACTIVE'
            return (
              <Switch
                checked={isActive}
                disabled={!isActive && connection.status !== 'INACTIVE'}
                onCheckedChange={(checked) => {
                  void handleToggleEnabled(connection.id, checked)
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )
          },
        },
        {
          accessorKey: 'createdAt',
          header: 'Created',
          cell: ({ row }) => {
            const connection = row.original
            const createdAt = connection.createdAt
            return (
              <span className="text-sm">
                {createdAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )
          },
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: ({ row }) => {
            const connection = row.original
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
                      void handleRefreshConnection(connection.id)
                    }}
                    className="cursor-pointer"
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                    Refresh
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteConnection(connection.id)
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
      [],
    )

    if (connections.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-muted-foreground mb-4">
            <p className="text-lg font-medium">No connections found</p>
            <p className="text-sm">Create a connection to get started</p>
          </div>
        </div>
      )
    }

    return (
      <DataTable
        columns={columns}
        data={filteredConnections}
        defaultPageSize={50}
        getRowId={(row) => row.id}
        onRowClick={(connection) => setSelectedConnectionId(connection.id)}
        beforeColumnsSelector={
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as ConnectionStatus | 'ALL')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="INITIALIZING">Initializing</SelectItem>
              <SelectItem value="INITIATED">Initiated</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    )
  }

  // Tools list component that uses hooks
  function ToolsListContent() {
    const tools = useTools({ toolkits: [toolkit.slug] })

    // Filter tools by search
    const filteredTools = tools.filter((tool) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        tool.slug.toLowerCase().includes(query) ||
        tool.name.toLowerCase().includes(query) ||
        (tool.description?.toLowerCase().includes(query) ?? false)
      )
    })

    if (filteredTools.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-muted-foreground mb-4">
            <p className="text-lg font-medium">
              {searchQuery.trim() ? 'No tools found matching your search' : 'No tools found'}
            </p>
            <p className="text-sm">
              {searchQuery.trim() ? 'Try adjusting your search terms' : 'This toolkit has no tools'}
            </p>
          </div>
        </div>
      )
    }

    return (
      <Virtualizer ref={vListRef} count={filteredTools.length}>
        {(index) => {
          const tool = filteredTools[index]
          if (!tool) return <></>

          return (
            <div
              key={tool.slug}
              className="mb-2 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors w-full text-left"
              onClick={() => setSelectedTool({ slug: tool.slug, name: tool.name })}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold truncate">{tool.name}</span>
                    {tool.isDeprecated && <Badge variant="destructive">Deprecated</Badge>}
                    {tool.isNoAuth && <Badge variant="secondary">No Auth</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground font-mono truncate">
                      {tool.slug}
                    </span>
                    <CopyButton value={tool.slug} />
                  </div>
                  {tool.description && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {tool.description}
                    </div>
                  )}
                  {tool.tags && tool.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tool.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {tool.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{tool.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }}
      </Virtualizer>
    )
  }

  // Connections count component for badge
  function ConnectionsCount({ count }: { count: number }) {
    if (count === 0) return null
    return (
      <Badge
        variant="secondary"
        className="ml-2 h-4 min-w-4 rounded-full px-1 font-mono tabular-nums"
      >
        {count}
      </Badge>
    )
  }

  // Tools count component for badge
  function ToolsCount() {
    const tools = useTools({ toolkits: [toolkit.slug] })
    if (tools.length === 0) return null
    return (
      <Badge
        variant="secondary"
        className="ml-2 h-4 min-w-4 rounded-full px-1 font-mono tabular-nums"
      >
        {tools.length}
      </Badge>
    )
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Header */}
      <div className="flex flex-row items-center gap-2">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="size-8 rounded-lg">
          {toolkit.meta?.logo ? <AvatarImage src={toolkit.meta.logo} alt={toolkit.name} /> : null}
          <AvatarFallback>
            <ServerIcon />
          </AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-semibold">{toolkit.name}</h1>
        <div className="ml-4 flex items-center gap-1">
          <span className="text-sm text-muted-foreground font-mono">{toolkit.slug}</span>
          <CopyButton value={toolkit.slug} />
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'connections' | 'tools')}
        className="min-h-0 flex-1 flex flex-col"
      >
        <TabsList>
          {/* Hide Connections tab for NO_AUTH toolkits */}
          {!toolkit.noAuth && (
            <TabsTrigger value="connections">
              Connections
              <Suspense fallback={null}>
                <ConnectionsCount count={connections.length} />
              </Suspense>
            </TabsTrigger>
          )}
          <TabsTrigger value="tools">
            Tools
            <Suspense fallback={null}>
              <ToolsCount />
            </Suspense>
          </TabsTrigger>
        </TabsList>

        {/* Connections Tab - Hide for NO_AUTH toolkits */}
        {!toolkit.noAuth && (
          <TabsContent
            value="connections"
            className="flex-1 flex flex-col overflow-y-auto [overflow-anchor:none]"
          >
            <div className="my-4 flex flex-col gap-4">
              <div className="flex justify-between items-center gap-2">
                <ConnectionTypeSelector value={connectionType} onChange={setConnectionType} />
                <div className="flex items-center gap-2">
                  <Button onClick={handleConnect} disabled={isConnecting} size="sm">
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </div>
            </div>
            <Suspense fallback={<SkeletonCard />}>
              <ConnectionsListContent connections={connections} />
            </Suspense>
          </TabsContent>
        )}

        {/* Tools Tab */}
        <TabsContent
          value="tools"
          className="flex-1 flex flex-col overflow-y-auto [overflow-anchor:none]"
        >
          <div className="my-4">
            <SearchInput
              placeholder="Search tools by name, slug, or description..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <Suspense fallback={<SkeletonCard />}>
            <ToolsListContent />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Connection detail sheet - only show for non-NO_AUTH toolkits */}
      {!!selectedConnectionId && !toolkit.noAuth && (
        <ConnectionDetailSheet
          connectionId={selectedConnectionId}
          type={connectionType}
          toolkitName={toolkit.name}
          toolkitLogoUrl={toolkit.meta?.logo}
          open={!!selectedConnectionId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedConnectionId(null)
            }
          }}
        />
      )}

      {!!selectedTool && (
        <ToolDetailSheet
          tool={selectedTool}
          toolkitLogoUrl={toolkit.meta?.logo}
          open={!!selectedTool}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTool(null)
            }
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this connection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteConnection}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <CircleSpinner className="h-4 w-4" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
