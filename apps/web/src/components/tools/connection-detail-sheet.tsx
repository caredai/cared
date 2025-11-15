import { Suspense, useState } from 'react'
import { ServerIcon } from 'lucide-react'

import type { ConnectionStatus } from '@cared/api'
import { Avatar, AvatarFallback, AvatarImage } from '@cared/ui/components/avatar'
import { Badge } from '@cared/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
import { Separator } from '@cared/ui/components/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@cared/ui/components/sheet'
import { Tabs, TabsList, TabsTrigger } from '@cared/ui/components/tabs'

import { CopyButton } from '@/components/copy-button'
import { SkeletonCard } from '@/components/skeleton'
import { PrettyJsonView } from '@/components/tracing/PrettyJsonView'
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
  const [stateView, setStateView] = useState<'pretty' | 'json'>('pretty')

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
    <div className="flex flex-col space-y-4">
      {/* Basic Information */}
      <Card>
        <CardContent className="space-y-4">
          {/* ID */}
          <div className="flex items-center gap-2 h-8">
            <span className="text-sm text-muted-foreground font-bold">ID</span>
            <Separator orientation="vertical" className="max-h-4" />
            <span className="text-sm font-bold font-mono">{connection.id}</span>
            <CopyButton value={connection.id} />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 h-8">
            <span className="text-sm text-muted-foreground font-bold">Status</span>
            <Separator orientation="vertical" className="max-h-4" />
            <Badge variant={getStatusBadgeVariant(connection.status)}>{connection.status}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Connection State */}
      {connection.state && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>State</CardTitle>
                <CardDescription>Authentication and connection data</CardDescription>
              </div>
              <Tabs
                className="h-fit"
                value={stateView}
                onValueChange={(value) => setStateView(value as 'pretty' | 'json')}
              >
                <TabsList className="h-fit py-0.5">
                  <TabsTrigger value="pretty" className="h-fit px-1 text-xs">
                    Formatted
                  </TabsTrigger>
                  <TabsTrigger value="json" className="h-fit px-1 text-xs">
                    JSON
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <PrettyJsonView json={connection.state} currentView={stateView} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Connection detail sheet component
 * Displays detailed information about a connection in a sheet
 */
export function ConnectionDetailSheet({
  connectionId,
  type,
  toolkitName,
  toolkitLogoUrl,
  open,
  onOpenChange,
}: {
  connectionId: string
  type: 'user' | 'account'
  toolkitName: string
  toolkitLogoUrl?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[800px] gap-2">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {toolkitLogoUrl && (
              <Avatar className="size-6 rounded-lg">
                <AvatarImage src={toolkitLogoUrl} alt="" />
                <AvatarFallback>
                  <ServerIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            <SheetTitle>{toolkitName} Connection</SheetTitle>
          </div>
        </SheetHeader>
        <Separator />
        <div className="h-full overflow-y-auto p-4">
          <Suspense fallback={<SkeletonCard />}>
            <ConnectionDetailContent connectionId={connectionId} type={type} />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  )
}
