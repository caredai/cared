import { Suspense } from 'react'
import { ArrowLeftIcon } from 'lucide-react'

import type { ConnectionStatus } from '@cared/api'
import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cared/ui/components/card'

import { SkeletonCard } from '@/components/skeleton'
import { JSONView } from '@/components/tracing/JsonView'
import { useConnection } from '@/hooks/use-tools'

/**
 * Connection detail content component
 * Displays detailed information about a connection
 */
function ConnectionDetailContent({
  connectionId,
  type,
}: {
  connectionId: string
  type: 'user' | 'account'
}) {
  const connection = useConnection(connectionId, type)

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

  return (
    <div className="flex-1 overflow-y-auto space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ID</span>
              <span className="text-sm font-mono">{connection.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Toolkit</span>
              <span className="text-sm">{connection.toolkit}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={getStatusBadgeVariant(connection.status)}>
                {connection.status}
              </Badge>
            </div>
            {connection.statusReason && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Status Reason</span>
                <span className="text-sm text-right max-w-[70%]">{connection.statusReason}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection State */}
        {connection.state && (
          <Card>
            <CardHeader>
              <CardTitle>Connection State</CardTitle>
              <CardDescription>Authentication and connection data</CardDescription>
            </CardHeader>
            <CardContent>
              <JSONView json={connection.state} title="State" />
            </CardContent>
          </Card>
        )}
      </div>
  )
}

/**
 * Connection detail component
 * Displays detailed information about a connection with Suspense
 */
export function ConnectionDetail({
  connectionId,
  type,
  onBack,
}: {
  connectionId: string
  type: 'user' | 'account'
  onBack: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Connection Details</h2>
      </div>

      <Suspense fallback={<SkeletonCard />}>
        <ConnectionDetailContent connectionId={connectionId} type={type} />
      </Suspense>
    </div>
  )
}

