import { useCallback, useMemo } from 'react'
import { useRouter } from '@tanstack/react-router'
import { format, formatDistance } from 'date-fns'
import { LayoutDashboard, MoreVertical, Settings } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import { DataTable } from '@cared/ui/components/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { cn } from '@cared/ui/lib/utils'

import type { DatabaseNamespace } from '@/hooks/use-database'
import type { ColumnDef } from '@tanstack/react-table'
import { SectionTitle } from '@/components/section'
import { useDatabaseNamespaces } from '@/hooks/use-database'
import { stripIdPrefix } from '@/lib/utils'
import { CreateNamespaceDialog } from './create-namespace-dialog'
import { formatDatabaseRegion } from './region-label'

interface NamespacesProps {
  accountIdNoPrefix: string
}

type NamespaceDestination = 'dashboard' | 'settings'

const ABSOLUTE_TIME_FORMAT = 'MMM dd, yyyy hh:mm a'

function formatStorageBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  const decimals = unitIndex === 0 ? 0 : value >= 10 ? 0 : 1
  return `${value.toFixed(decimals)} ${units[unitIndex]}`
}

function RelativeTime({
  value,
  muted = true,
}: {
  value: string | Date | null | undefined
  muted?: boolean
}) {
  if (!value) {
    return <span className={cn('text-sm', muted && 'text-muted-foreground')}>—</span>
  }
  const date = new Date(value)
  return (
    <span
      className={cn('text-sm', muted && 'text-muted-foreground')}
      title={format(date, ABSOLUTE_TIME_FORMAT)}
    >
      {formatDistance(date, new Date(), { addSuffix: true })}
    </span>
  )
}

export function Namespaces({ accountIdNoPrefix }: NamespacesProps) {
  const router = useRouter()
  const namespaces = useDatabaseNamespaces()

  const navigateToNamespace = useCallback(
    (namespace: DatabaseNamespace, destination: NamespaceDestination) => {
      const namespaceIdNoPrefix = stripIdPrefix(namespace.id)
      const params = { accountIdNoPrefix, namespaceIdNoPrefix }

      if (destination === 'dashboard') {
        void router.navigate({
          to: '/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/dashboard',
          params,
        })
        return
      }
      void router.navigate({
        to: '/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/settings',
        params,
      })
    },
    [accountIdNoPrefix, router],
  )

  const columns = useMemo<ColumnDef<DatabaseNamespace, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Namespace',
        cell: ({ row }) => (
          <span className="font-medium truncate block max-w-[200px]">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'regionId',
        header: 'Region',
        cell: ({ row }) => (
          <span className="text-sm">{formatDatabaseRegion(row.original.regionId)}</span>
        ),
      },
      {
        id: 'storage',
        header: 'Storage',
        cell: ({ row }) => {
          const storageBytes = row.original.syntheticStorageSize
          if (storageBytes == null) {
            return <span className="text-sm">—</span>
          }
          return <span className="text-sm">{formatStorageBytes(storageBytes)}</span>
        },
      },
      {
        id: 'branches',
        header: 'Branches',
        cell: ({ row }) => {
          const branchCount = row.original.branchCount
          return <span className="text-sm">{branchCount}</span>
        },
      },
      {
        id: 'computeLastActive',
        header: 'Compute last active',
        cell: ({ row }) => <RelativeTime value={row.original.computeLastActiveAt} muted={false} />,
      },
      {
        id: 'createdAt',
        header: 'Created',
        cell: ({ row }) => <RelativeTime value={row.original.createdAt} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const namespace = row.original
          return (
            <NamespaceRowMenu
              onDashboard={() => navigateToNamespace(namespace, 'dashboard')}
              onSettings={() => navigateToNamespace(namespace, 'settings')}
            />
          )
        },
      },
    ],
    [navigateToNamespace],
  )

  return (
    <>
      <SectionTitle
        title="Databases"
        description="Managed Postgres database namespaces powered by Neon"
      />

      <div className="flex justify-end">
        <CreateNamespaceDialog accountIdNoPrefix={accountIdNoPrefix} />
      </div>

      <DataTable
        columns={columns}
        data={namespaces}
        searchKeys={['name', 'id']}
        searchPlaceholder="Search namespaces..."
        getRowId={(row) => row.id}
        onRowClick={(namespace) => navigateToNamespace(namespace, 'dashboard')}
      />
    </>
  )
}

function NamespaceRowMenu({
  onDashboard,
  onSettings,
}: {
  onDashboard: () => void
  onSettings: () => void
}) {
  return (
    <div className="flex justify-end">
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
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onDashboard()
            }}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onSettings()
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
