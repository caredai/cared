import { useEffect, useMemo, useState } from 'react'
import { formatDistance } from 'date-fns'
import { Activity, ClockIcon, MoreHorizontalIcon, RefreshCwIcon, TrashIcon } from 'lucide-react'

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
import { RefreshCwSpinner, Spinner } from '@cared/ui/components/spinner'

import type { TraceWithDetails } from '@langfuse/core'
import type { ColumnDef } from '@tanstack/react-table'
import { MemberSelect } from '@/components/member-select'
import { SectionTitle } from '@/components/section'
import { useSession } from '@/hooks/use-session'
import { useDeleteTraces, useTraces } from '@/hooks/use-telemetry'
import { DeleteTraceDialog } from './DeleteTraceDialog'
import { TraceDetailsSheet } from './TraceDetailsSheet'

type TraceScope = 'user' | 'account'

/**
 * TracingWithSelector component
 * Default: user scope with current user
 * If user is owner/admin: show scope selector (empty/user/account)
 * If "user" scope is selected: show member selector
 */
export function TracingWithSelector() {
  const { user } = useSession()

  // Check if current user is owner or admin
  const canManageTraces = user.role === 'owner' || user.role === 'admin'

  // State for scope selection
  // Options: '' (current user), 'user' (select member), 'account'
  const [scopeSelection, setScopeSelection] = useState<'' | 'user' | 'account'>('')
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    setSelectedUserId(undefined)
  }, [scopeSelection])

  // Determine effective scope and userId
  const effectiveScope: TraceScope = scopeSelection === 'account' ? 'account' : 'user'
  const effectiveUserId = scopeSelection === 'user' ? selectedUserId : undefined

  return (
    <TracingInner
      scope={effectiveScope}
      userId={effectiveUserId}
      scopeSelector={
        canManageTraces ? (
          <div className="flex items-center gap-2">
            <Select
              value={scopeSelection}
              onValueChange={(v) => setScopeSelection(v as '' | 'user' | 'account')}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue>
                  <span className="text-muted-foreground/70">
                    {scopeSelection === ''
                      ? '--'
                      : scopeSelection === 'account'
                        ? 'Account'
                        : 'Member'}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- None --</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="user">Member</SelectItem>
              </SelectContent>
            </Select>
            {scopeSelection === 'user' && (
              <MemberSelect
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                className="w-[200px]"
              />
            )}
          </div>
        ) : undefined
      }
    />
  )
}

export function Tracing({ scope }: { scope: TraceScope }) {
  return <TracingInner scope={scope} />
}

function TracingInner({
  scope,
  userId,
  scopeSelector,
}: {
  scope: TraceScope
  userId?: string
  scopeSelector?: React.ReactNode
}) {
  const [pageSize, setPageSize] = useState(20)
  const [dateRange, setDateRange] = useState<string>('7d')

  const [selectedTrace, setSelectedTrace] = useState<TraceWithDetails | null>(null)

  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tracesToDelete, setTracesToDelete] = useState<string[]>([])

  // Calculate date range filters
  const dateRangeFilters = useMemo(() => {
    const now = new Date()
    let fromTimestamp: string | undefined

    switch (dateRange) {
      case '30m':
        fromTimestamp = new Date(now.getTime() - 30 * 60 * 1000).toISOString()
        break
      case '1h':
        fromTimestamp = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
        break
      case '6h':
        fromTimestamp = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
        break
      case '1d':
        fromTimestamp = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        break
      case '3d':
        fromTimestamp = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '7d':
        fromTimestamp = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '30d':
        fromTimestamp = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '90d':
        fromTimestamp = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
        break
      default:
        fromTimestamp = undefined
    }

    return { fromTimestamp }
  }, [dateRange])

  const deleteTraces = useDeleteTraces()

  const { traces, isLoading, isFetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTraces({
      scope,
      userId: scope === 'user' ? userId : undefined,
      pageSize,
      ...dateRangeFilters,
    })

  // Calculate selected rows from rowSelection
  const selectedRows = useMemo(() => {
    return Object.keys(rowSelection).filter((id) => rowSelection[id])
  }, [rowSelection])

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return
    setTracesToDelete(selectedRows)
    setDeleteDialogOpen(true)
  }

  // Handle single trace delete
  const handleDeleteTrace = (traceId: string) => {
    setTracesToDelete([traceId])
    setDeleteDialogOpen(true)
  }

  // Handle trace navigation
  const handleNavigate = (traceId: string) => {
    const targetTrace = traces.find((trace) => trace.id === traceId)
    if (targetTrace) {
      setSelectedTrace(targetTrace)
    }
  }

  // Handle confirmed delete
  const handleConfirmDelete = async () => {
    await deleteTraces({
      scope,
      userId: scope === 'user' ? userId : undefined,
      traceIds: tracesToDelete,
    })

    // Clear selection if bulk delete
    setRowSelection({})
    setTracesToDelete([])
  }

  // Define table columns
  const columns: ColumnDef<TraceWithDetails>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => {
        const trace = row.original
        return (
          <div className="flex flex-col">
            <span className="text-xs">
              {formatDistance(new Date(trace.timestamp), new Date(), { addSuffix: true })}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(trace.timestamp).toLocaleString()}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const trace = row.original
        return (
          <p className=" max-w-50 text-xs font-medium whitespace-normal line-clamp-1">
            {trace.name}
          </p>
        )
      },
    },
    {
      accessorKey: 'input',
      header: 'Input',
      cell: ({ row }) => {
        const trace = row.original
        const inputText = trace.input ? JSON.stringify(trace.input) : ''
        return (
          <p className="w-80 whitespace-normal text-xs line-clamp-2" title={inputText}>
            {inputText}
          </p>
        )
      },
    },
    {
      accessorKey: 'output',
      header: 'Output',
      cell: ({ row }) => {
        const trace = row.original
        const outputText =
          typeof trace.output === 'object'
            ? JSON.stringify(trace.output)
            : trace.output
              ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
                String(trace.output)
              : ''
        return (
          <p className="w-80 whitespace-normal text-xs line-clamp-1" title={outputText}>
            {outputText}
          </p>
        )
      },
    },
    {
      accessorKey: 'observations',
      header: 'Observations',
      cell: ({ row }) => {
        const trace = row.original
        const observations = trace.observations
        const count = Array.isArray(observations) ? observations.length : 0
        return (
          <div>
            <span className="text-xs">{count}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'cost',
      header: 'Cost',
      cell: ({ row }) => {
        const trace = row.original
        return <span className="font-mono text-xs">{`$ ${trace.totalCost}`}</span>
      },
    },
    {
      accessorKey: 'metadata',
      header: 'Metadata',
      cell: ({ row }) => {
        const trace = row.original
        const metadataText = trace.metadata ? JSON.stringify(trace.metadata) : ''
        return (
          <p className="w-80 whitespace-normal text-xs line-clamp-2" title={metadataText}>
            {metadataText}
          </p>
        )
      },
    },
    {
      accessorKey: 'latency',
      header: 'Latency',
      cell: ({ row }) => {
        const trace = row.original
        return (
          <div className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            <span className="text-xs">{trace.latency ? `${trace.latency}s` : 'N/A'}</span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const trace = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleDeleteTrace(trace.id)}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <TrashIcon className="h-4 w-4" />
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
      <SectionTitle title="Tracing" description="Monitor and analyze trace data for your account" />

      <div>
        <div className="w-full flex flex-wrap items-center gap-2">
          {scopeSelector}

          <div className="lg:ml-auto flex items-center gap-2">
            {/* Date range filter */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30m">Last 30m</SelectItem>
                <SelectItem value="1h">Last 1h</SelectItem>
                <SelectItem value="6h">Last 6h</SelectItem>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="3d">Last 3 days</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" disabled={isFetching} onClick={() => refetch()}>
              {!isLoading && isFetching ? (
                <RefreshCwSpinner className="h-4 w-4" />
              ) : (
                <RefreshCwIcon className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : traces.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 mt-8 py-8 border rounded-md">
            <Activity className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No traces found</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={traces}
              enableInfiniteScroll={true}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onFetchNextPage={fetchNextPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50]}
              enableRowSelection={true}
              rowSelection={rowSelection}
              onSelectionChange={setRowSelection}
              getRowId={(trace) => trace.id}
              bulkActions={[
                {
                  label: `Delete ${selectedRows.length} trace${selectedRows.length > 1 ? 's' : ''}`,
                  icon: TrashIcon,
                  action: () => handleBulkDelete(),
                  variant: 'destructive',
                },
              ]}
              onRowClick={(trace: TraceWithDetails) => {
                setSelectedTrace(trace)
                setIsSheetOpen(true)
              }}
            />
          </>
        )}
      </div>

      {/* Trace Details Sheet */}
      {selectedTrace && (
        <TraceDetailsSheet
          trace={selectedTrace}
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          scope={scope}
          traces={traces}
          onNavigate={handleNavigate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteTraceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        traceIds={tracesToDelete}
        onDelete={handleConfirmDelete}
      />
    </>
  )
}
