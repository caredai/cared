'use client'

import { useMemo, useState } from 'react'
import { Download, MoreHorizontal, Pencil, Plus, Trash2Icon } from 'lucide-react'

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { CircleSpinner } from '@cared/ui/components/spinner'

import type { McpServer } from '@/hooks/use-mcp'
import type { ColumnDef } from '@tanstack/react-table'
import { CopyButton } from '@/components/copy-button'
import { useDeleteMcpServer, useMcpServers } from '@/hooks/use-mcp'
import { McpDetailSheet } from './mcp-detail-sheet'
import { McpInstallSheet } from './mcp-install-sheet'

/**
 * Mcps component
 * Displays MCP servers in a table with create, update, and delete actions
 */
export function Mcps() {
  const mcpServers = useMcpServers()
  const [selectedMcpId, setSelectedMcpId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [installMcpId, setInstallMcpId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mcpToDelete, setMcpToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteMcpServer = useDeleteMcpServer()

  // Handle delete MCP server - open confirmation dialog
  const handleDeleteMcpServer = (mcpId: string) => {
    setMcpToDelete(mcpId)
    setDeleteDialogOpen(true)
  }

  // Confirm delete MCP server
  const confirmDeleteMcpServer = async () => {
    if (!mcpToDelete) return

    setIsDeleting(true)
    try {
      await deleteMcpServer({ id: mcpToDelete })
      // Only close dialog on success
      setDeleteDialogOpen(false)
      setMcpToDelete(null)
    } catch {
      // Error already handled in mutation
      // Keep dialog open on error
    } finally {
      setIsDeleting(false)
    }
  }

  // Define table columns
  const columns: ColumnDef<McpServer>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const mcp = row.original
          return <span className="font-medium">{mcp.name}</span>
        },
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => {
          const mcp = row.original
          return (
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono truncate max-w-[200px]">{mcp.id}</code>
              <CopyButton value={mcp.id} />
            </div>
          )
        },
      },
      {
        id: 'toolkits',
        header: 'Toolkits',
        cell: ({ row }) => {
          const mcp = row.original
          const toolkits = mcp.configuration.toolkits ?? []
          if (toolkits.length === 0) {
            return <span className="text-muted-foreground text-sm">--</span>
          }
          return (
            <div className="flex flex-wrap gap-1">
              {toolkits.slice(0, 2).map((toolkit) => (
                <Badge key={toolkit} variant="outline" className="font-mono text-xs">
                  {toolkit}
                </Badge>
              ))}
              {toolkits.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{toolkits.length - 2}
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        id: 'tools',
        header: 'Tools',
        cell: ({ row }) => {
          const mcp = row.original
          const tools = mcp.configuration.tools ?? []
          return (
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="font-mono text-xs">
                {tools.length}
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => {
          const mcp = row.original
          const createdAt = mcp.createdAt
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
          const mcp = row.original
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setInstallMcpId(mcp.id)
                }}
                title="Install"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Install</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedMcpId(mcp.id)
                }}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
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
                      handleDeleteMcpServer(mcp.id)
                    }}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2Icon className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">MCP Servers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your Model Context Protocol servers
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4" />
          Create MCP Server
        </Button>
      </div>

      {/* Empty state */}
      {mcpServers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <div className="text-muted-foreground mb-4">
            <p className="text-lg font-medium">No MCP servers found</p>
            <p className="text-sm">Create your first MCP server to get started</p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4" />
            Create MCP Server
          </Button>
        </div>
      ) : (
        /* MCP servers table */
        <DataTable
          columns={columns}
          data={mcpServers}
          defaultPageSize={50}
          getRowId={(row) => row.id}
          onRowClick={(mcp) => setSelectedMcpId(mcp.id)}
        />
      )}

      {/* Create MCP server sheet */}
      {isCreating && (
        <McpDetailSheet
          open={isCreating}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreating(false)
            }
          }}
          onCreated={(mcpId) => {
            setInstallMcpId(mcpId)
          }}
        />
      )}

      {/* Edit MCP server sheet */}
      {selectedMcpId && (
        <McpDetailSheet
          mcpId={selectedMcpId}
          open={!!selectedMcpId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMcpId(null)
            }
          }}
        />
      )}

      {/* Install MCP server sheet */}
      {installMcpId && (
        <McpInstallSheet
          mcpId={installMcpId}
          open={!!installMcpId}
          onOpenChange={(open) => {
            if (!open) {
              setInstallMcpId(null)
            }
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete MCP Server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this MCP server? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMcpServer}
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
