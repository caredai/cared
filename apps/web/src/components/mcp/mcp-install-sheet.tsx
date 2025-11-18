'use client'

import type { VirtualizerHandle } from 'virtua'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCwIcon,
  Trash2Icon,
} from 'lucide-react'
import { Virtualizer } from 'virtua'

import type { ConnectionStatus } from '@cared/api'
import { Alert, AlertDescription } from '@cared/ui/components/alert'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { Label } from '@cared/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@cared/ui/components/radio-group'
import { Separator } from '@cared/ui/components/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@cared/ui/components/sheet'
import { CircleSpinner } from '@cared/ui/components/spinner'
import { Switch } from '@cared/ui/components/switch'
import { cn } from '@cared/ui/lib/utils'

import type { ConnectionType } from '@/components/connection-type-selector'
import type { Connection } from '@/hooks/use-tools'
import { ConnectionTypeSelector } from '@/components/connection-type-selector'
import { CopyButton } from '@/components/copy-button'
import { SkeletonCard } from '@/components/skeleton'
import { useMcpServer } from '@/hooks/use-mcp'
import {
  useConnections,
  useCreateConnection,
  useDeleteConnection,
  useRefreshConnection,
  useToolkits,
  useUpdateConnection,
} from '@/hooks/use-tools'
import { stripIdPrefix } from '@/lib/utils'

interface McpInstallSheetProps {
  mcpId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * McpInstallSheet component
 * Sheet for installing and configuring an MCP server
 * Shows toolkits on the left and connections on the right
 */
export function McpInstallSheet({ mcpId, open, onOpenChange }: McpInstallSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[1000px] gap-2">
        <SheetHeader>
          <Suspense fallback={<SheetTitle>Install MCP Server</SheetTitle>}>
            <McpInstallSheetHeader mcpId={mcpId} />
          </Suspense>
        </SheetHeader>
        <div className="min-h-0 flex-1 flex flex-col gap-4 px-4">
          <Suspense fallback={<SkeletonCard />}>
            <McpInstallSheetContent mcpId={mcpId} />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * McpInstallSheetHeader component
 * Header with title and description for the install sheet
 */
function McpInstallSheetHeader({ mcpId }: { mcpId: string }) {
  const mcpServer = useMcpServer(mcpId)

  return (
    <>
      <SheetTitle>Install MCP Server</SheetTitle>
      <SheetDescription>
        <strong>{mcpServer.name}</strong> is ready to use.
      </SheetDescription>
    </>
  )
}

/**
 * McpInstallSheetContent component
 * Main content for the install sheet
 */
function McpInstallSheetContent({ mcpId }: { mcpId: string }) {
  const mcpServer = useMcpServer(mcpId)
  const allToolkits = useToolkits()
  const [activeToolkitSlug, setActiveToolkitSlug] = useState<string | null>(null)
  const [connectionType, setConnectionType] = useState<ConnectionType>('user')
  // Map of toolkit slug to selected connection ID
  const [selectedConnections, setSelectedConnections] = useState<Map<string, string | null>>(
    new Map(),
  )

  // Get toolkits for this MCP server
  const mcpToolkits = useMemo(() => {
    const toolkitSlugs = mcpServer.configuration.toolkits ?? []
    return allToolkits.filter((tk) => toolkitSlugs.includes(tk.slug))
  }, [mcpServer, allToolkits])

  // Get all toolkit slugs for this MCP server
  const mcpToolkitSlugs = useMemo(() => {
    return mcpToolkits.map((tk) => tk.slug)
  }, [mcpToolkits])

  // Fetch connections for all MCP toolkits
  const { connections: allConnections, refetchConnections } = useConnections(
    mcpToolkitSlugs,
    connectionType,
  )

  // Set initial active toolkit
  useEffect(() => {
    if (!activeToolkitSlug && mcpToolkits.length > 0) {
      setActiveToolkitSlug(mcpToolkits[0]?.slug ?? null)
    }
  }, [mcpToolkits, activeToolkitSlug])

  // Auto-select first active connection for each toolkit
  useEffect(() => {
    setSelectedConnections((prevSelections) => {
      const newSelections = new Map(prevSelections)
      let hasChanges = false

      // For each toolkit, auto-select first active connection if none selected
      for (const toolkitSlug of mcpToolkitSlugs) {
        const toolkitConnections = allConnections.filter((conn) => conn.toolkit === toolkitSlug)

        const currentSelection = prevSelections.get(toolkitSlug)
        if (
          !currentSelection ||
          toolkitConnections.find((conn) => conn.id === currentSelection)?.status !== 'ACTIVE'
        ) {
          const firstActive = toolkitConnections.find((conn) => conn.status === 'ACTIVE')
          if (firstActive) {
            newSelections.set(toolkitSlug, firstActive.id)
          } else {
            newSelections.set(toolkitSlug, null)
          }
          hasChanges = true
        }
      }

      return hasChanges ? newSelections : prevSelections
    })
  }, [allConnections, mcpToolkitSlugs])

  // Handle connection selection
  const handleSelectConnection = useCallback(
    (toolkitSlug: string, connectionId: string | null) => {
      const newSelections = new Map(selectedConnections)
      newSelections.set(toolkitSlug, connectionId)
      setSelectedConnections(newSelections)
    },
    [selectedConnections],
  )

  // Get toolkit info by slug
  const getToolkitInfo = useCallback(
    (slug: string) => {
      return allToolkits.find((tk) => tk.slug === slug)
    },
    [allToolkits],
  )

  const activeToolkit = activeToolkitSlug ? (getToolkitInfo(activeToolkitSlug) ?? null) : null

  // Build MCP server URL with selected connections
  const mcpServerUrl = useMemo(() => {
    const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
    const baseUrl = `${apiUrl}/v1/mcp/${stripIdPrefix(mcpId)}`

    // Build connections query param
    const connectionIds: string[] = []
    for (const [, connectionId] of selectedConnections.entries()) {
      if (connectionId) {
        connectionIds.push(connectionId)
      }
    }

    if (connectionIds.length === 0) {
      return baseUrl
    }

    return `${baseUrl}?connections=${connectionIds.join(',')}`
  }, [mcpId, selectedConnections])

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="select-connections">Select connections</Label>
        <div id="select-connections" className="text-sm text-muted-foreground">
          For each toolkit, the selected connection will be used when invoking this toolkit's tools
          from clients.
        </div>
      </div>

      {/* Two-column layout: Toolkits (left) | Connections (right) */}
      <div className="flex-1 flex border rounded-lg overflow-x-auto">
        {/* Left side: Toolkits list */}
        <div className="flex flex-col w-[300px] min-w-[180px] border-r">
          {/* Header */}
          <div className="p-3 border-b">
            <div className="h-8 flex items-center">
              <Label className="text-sm font-semibold">Toolkits</Label>
            </div>
          </div>

          {/* Toolkit list */}
          <div className="flex-1 overflow-y-auto">
            <ToolkitList
              mcpToolkits={mcpToolkits}
              activeToolkitSlug={activeToolkitSlug}
              selectedConnections={selectedConnections}
              onSetActiveToolkit={setActiveToolkitSlug}
            />
          </div>
        </div>

        {/* Right side: Connections for active toolkit */}
        <div className="flex-1 flex flex-col min-w-[600px]">
          {!activeToolkit || !activeToolkitSlug ? (
            <div className="flex-1 flex items-center justify-center text-center text-sm text-muted-foreground p-4">
              Select a toolkit to view connections
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <ConnectionsPanel
                toolkitSlug={activeToolkitSlug}
                toolkitName={activeToolkit.name}
                toolkitLogo={activeToolkit.meta.logo}
                noAuth={activeToolkit.noAuth}
                connections={allConnections.filter((conn) => conn.toolkit === activeToolkitSlug)}
                refetchConnections={refetchConnections}
                selectedConnectionId={selectedConnections.get(activeToolkitSlug) ?? null}
                connectionType={connectionType}
                onConnectionTypeChange={setConnectionType}
                onSelectConnection={(connectionId) =>
                  handleSelectConnection(activeToolkitSlug, connectionId)
                }
              />
            </Suspense>
          )}
        </div>
      </div>

      <Separator />

      {/* MCP Server URL */}
      <div className="space-y-2">
        <Label htmlFor="mcp-url">MCP Server URL</Label>
        <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted font-mono text-sm">
          <div className="flex-1 break-all">{mcpServerUrl}</div>
          <CopyButton value={mcpServerUrl} />
        </div>
        <p className="text-xs text-muted-foreground">
          Use this URL to connect to the MCP server from your client application
        </p>
      </div>
    </>
  )
}

/**
 * ToolkitList component
 * Virtualized list of toolkits for the MCP server
 */
function ToolkitList({
  mcpToolkits,
  activeToolkitSlug,
  selectedConnections,
  onSetActiveToolkit,
}: {
  mcpToolkits: { slug: string; name: string; meta?: { logo?: string }; noAuth?: boolean }[]
  activeToolkitSlug: string | null
  selectedConnections: Map<string, string | null>
  onSetActiveToolkit: (slug: string) => void
}) {
  const toolkitListRef = useRef<VirtualizerHandle>(null)

  return (
    <Virtualizer ref={toolkitListRef}>
      {mcpToolkits.map((toolkit) => {
        const isActive = activeToolkitSlug === toolkit.slug
        const hasConnection = selectedConnections.get(toolkit.slug) != null

        return (
          <div className="mx-2 my-1">
            <button
              key={toolkit.slug}
              type="button"
              className={cn(
                'flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors w-full',
                isActive && 'bg-accent',
              )}
              onClick={() => onSetActiveToolkit(toolkit.slug)}
            >
              <Avatar className="w-8 h-8 rounded-md">
                {toolkit.meta?.logo ? (
                  <AvatarImage src={toolkit.meta.logo} alt={toolkit.name} />
                ) : null}
                <AvatarFallback className="rounded-md text-xs">
                  {toolkit.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium truncate">{toolkit.name}</div>
                <div className="text-xs text-muted-foreground">
                  {toolkit.noAuth ? (
                    'No Auth'
                  ) : hasConnection ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-3! w-3!" />
                      <span className="text-green-600">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="h-3! w-3!" />
                      <span>No connection</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>
        )
      })}
    </Virtualizer>
  )
}

/**
 * ConnectionsPanel component
 * Right panel showing connections for the active toolkit
 */
function ConnectionsPanel({
  toolkitSlug,
  toolkitName,
  toolkitLogo,
  noAuth,
  connections,
  refetchConnections,
  selectedConnectionId,
  connectionType,
  onConnectionTypeChange,
  onSelectConnection,
}: {
  toolkitSlug: string
  toolkitName: string
  toolkitLogo?: string
  noAuth?: boolean
  connections: Connection[]
  refetchConnections: () => void
  selectedConnectionId: string | null
  connectionType: ConnectionType
  onConnectionTypeChange: (type: ConnectionType) => void
  onSelectConnection: (connectionId: string | null) => void
}) {
  const createConnection = useCreateConnection()
  const deleteConnection = useDeleteConnection()
  const updateConnection = useUpdateConnection()
  const refreshConnection = useRefreshConnection()
  const [isConnecting, setIsConnecting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const connectionsListRef = useRef<VirtualizerHandle>(null)

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
        toolkit: toolkitSlug,
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
      // If deleted connection was selected, clear selection
      if (selectedConnectionId === connectionToDelete) {
        onSelectConnection(null)
      }
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

  // If toolkit requires no auth
  if (noAuth) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Alert>
          <AlertDescription>
            This toolkit does not require authentication. No connection setup needed.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6 rounded-md">
            {toolkitLogo ? <AvatarImage src={toolkitLogo} alt={toolkitName} /> : null}
            <AvatarFallback className="rounded-md text-xs">
              {toolkitName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">Connections for {toolkitName}</span>
        </div>
        <div className="flex items-center gap-8">
          <ConnectionTypeSelector value={connectionType} onChange={onConnectionTypeChange} />
          <Button size="sm" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <CircleSpinner className="h-4 w-4" />
                Connecting...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Connect
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Connections list */}
      <div className="flex-1 overflow-y-auto p-4">
        {connections.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            <p className="mb-2">No connections available</p>
            <p className="text-xs">Click the Connect button to create a new connection</p>
          </div>
        ) : (
          <RadioGroup
            value={selectedConnectionId ?? ''}
            onValueChange={(value) => onSelectConnection(value || null)}
          >
            <Virtualizer ref={connectionsListRef}>
              {connections.map((connection) => {
                const isSelected = selectedConnectionId === connection.id
                const isActive = connection.status === 'ACTIVE'

                return (
                  <div
                    key={connection.id}
                    className={cn(
                      'mb-2 p-4 border rounded-lg transition-colors w-full text-left',
                      isSelected && 'bg-accent',
                      !isSelected && isActive && 'hover:bg-accent',
                    )}
                  >
                    <div
                      role={isActive ? 'button' : undefined}
                      tabIndex={isActive ? 0 : undefined}
                      className={cn(
                        'flex items-center justify-between gap-4',
                        isActive && 'cursor-pointer',
                      )}
                      onClick={() => {
                        if (isActive) {
                          onSelectConnection(isSelected ? null : connection.id)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (isActive && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          onSelectConnection(isSelected ? null : connection.id)
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <RadioGroupItem
                          value={connection.id}
                          id={connection.id}
                          disabled={!isActive}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs font-mono truncate max-w-[200px]">
                              {connection.id}
                            </code>
                            <CopyButton value={connection.id} />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {connection.state?.authScheme && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {connection.state.authScheme}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Created at{' '}
                              {connection.createdAt.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(connection.status)} className="text-xs">
                        {connection.status}
                      </Badge>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch
                          checked={isActive}
                          disabled={!isActive && connection.status !== 'INACTIVE'}
                          onCheckedChange={(checked) => {
                            void handleToggleEnabled(connection.id, checked)
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
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
                      </div>
                    </div>
                  </div>
                )
              })}
            </Virtualizer>
          </RadioGroup>
        )}
      </div>

      {/* Delete confirmation dialog */}
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
    </>
  )
}
