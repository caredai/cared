import { Suspense, useEffect, useRef, useState } from 'react'
import type { VirtualizerHandle } from 'virtua'
import { Virtualizer } from 'virtua'
import { ServerIcon } from 'lucide-react'

import type { ConnectionStatus } from '@cared/api'
import { Avatar, AvatarFallback, AvatarImage } from '@cared/ui/components/avatar'
import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@cared/ui/components/sheet'

import { SearchInput } from '@/components/search-input'
import { SkeletonCard } from '@/components/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { ConnectionDetail } from './connection-detail'
import { ToolDetail } from './tool-detail'
import { useConnections, useTools } from '@/hooks/use-tools'

interface Toolkit {
  name: string
  slug: string
  meta?: {
    logo?: string
  }
}

/**
 * Toolkit sheet component
 * Displays toolkit details with Connections and Tools tabs
 */
export function ToolkitSheet({
  toolkit,
  open,
  onOpenChange,
}: {
  toolkit: Toolkit
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [activeTab, setActiveTab] = useState<'connections' | 'tools'>('connections')
  const [connectionType, setConnectionType] = useState<'user' | 'account'>('user')
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)
  const [selectedToolSlug, setSelectedToolSlug] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const vListRef = useRef<VirtualizerHandle>(null)

  // Reset state when sheet opens/closes
  useEffect(() => {
    if (!open) {
      setActiveTab('connections')
      setConnectionType('user')
      setSelectedConnectionId(null)
      setSelectedToolSlug(null)
      setSearchQuery('')
    }
  }, [open])

  // Reset detail view when switching tabs
  useEffect(() => {
    setSelectedConnectionId(null)
    setSelectedToolSlug(null)
    setSearchQuery('')
  }, [activeTab])

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

  // Connections list component that uses hooks
  function ConnectionsListContent() {
    const connections = useConnections(toolkit.slug, connectionType)

    // Filter connections by search
    const filteredConnections = connections.filter((connection) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        connection.id.toLowerCase().includes(query) ||
        connection.toolkit.toLowerCase().includes(query) ||
        connection.status.toLowerCase().includes(query)
      )
    })

    if (filteredConnections.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-muted-foreground mb-4">
            <p className="text-lg font-medium">
              {searchQuery.trim()
                ? 'No connections found matching your search'
                : 'No connections found'}
            </p>
            <p className="text-sm">
              {searchQuery.trim() ? 'Try adjusting your search terms' : 'Create a connection to get started'}
            </p>
          </div>
        </div>
      )
    }

    return (
      <Virtualizer ref={vListRef} count={filteredConnections.length}>
        {(index) => {
          const connection = filteredConnections[index]
          if (!connection) return <></>

          return (
            <button
              key={connection.id}
              type="button"
              className="mb-2 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors w-full text-left"
              onClick={() => setSelectedConnectionId(connection.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold truncate">{connection.toolkit}</span>
                    <Badge variant={getStatusBadgeVariant(connection.status)}>
                      {connection.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground font-mono truncate">
                    {connection.id}
                  </div>
                  {connection.statusReason && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {connection.statusReason}
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        }}
      </Virtualizer>
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
        tool.description?.toLowerCase().includes(query) ||
        false
      )
    })

    if (filteredTools.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-muted-foreground mb-4">
            <p className="text-lg font-medium">
              {searchQuery.trim()
                ? 'No tools found matching your search'
                : 'No tools found'}
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
            <button
              key={tool.slug}
              type="button"
              className="mb-2 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors w-full text-left"
              onClick={() => setSelectedToolSlug(tool.slug)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold truncate">{tool.name}</span>
                    {tool.isDeprecated && <Badge variant="destructive">Deprecated</Badge>}
                    {tool.isNoAuth && <Badge variant="secondary">No Auth</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono truncate">
                    {tool.slug}
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
            </button>
          )
        }}
      </Virtualizer>
    )
  }

  // Connections count component for badge
  function ConnectionsCount() {
    const connections = useConnections(toolkit.slug, connectionType)
    if (connections.length === 0) return null
    return (
      <Badge variant="secondary" className="ml-2 h-4 min-w-4 rounded-full px-1 font-mono tabular-nums">
        {connections.length}
      </Badge>
    )
  }

  // Tools count component for badge
  function ToolsCount() {
    const tools = useTools({ toolkits: [toolkit.slug] })
    if (tools.length === 0) return null
    return (
      <Badge variant="secondary" className="ml-2 h-4 min-w-4 rounded-full px-1 font-mono tabular-nums">
        {tools.length}
      </Badge>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[800px]">
        <SheetHeader className="flex flex-row items-center gap-4">
          <Avatar className="size-10 rounded-lg">
            {toolkit.meta?.logo ? (
              <AvatarImage src={toolkit.meta.logo} alt={toolkit.name} />
            ) : null}
            <AvatarFallback>
              <ServerIcon />
            </AvatarFallback>
          </Avatar>
          <div>
            <SheetTitle>{toolkit.name}</SheetTitle>
            <SheetDescription>Manage connections and tools</SheetDescription>
          </div>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'connections' | 'tools')}
          className="min-h-0 flex-1"
        >
          <div className="px-4 pt-4">
            <TabsList>
              <TabsTrigger value="connections">
                Connections
                <Suspense fallback={null}>
                  <ConnectionsCount />
                </Suspense>
              </TabsTrigger>
              <TabsTrigger value="tools">
                Tools
                <Suspense fallback={null}>
                  <ToolsCount />
                </Suspense>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Connections Tab */}
          <TabsContent
            value="connections"
            className="flex-1 flex flex-col px-4 pb-4 overflow-y-auto [overflow-anchor:none]"
          >
            {selectedConnectionId ? (
              <ConnectionDetail
                connectionId={selectedConnectionId}
                type={connectionType}
                onBack={() => setSelectedConnectionId(null)}
              />
            ) : (
              <>
                <div className="my-4 flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={connectionType === 'user' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setConnectionType('user')}
                    >
                      User
                    </Button>
                    <Button
                      variant={connectionType === 'account' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setConnectionType('account')}
                    >
                      Account
                    </Button>
                  </div>
                  <SearchInput
                    placeholder="Search connections..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className="flex-1"
                  />
                </div>
                <Suspense fallback={<SkeletonCard />}>
                  <ConnectionsListContent />
                </Suspense>
              </>
            )}
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent
            value="tools"
            className="flex-1 flex flex-col px-4 pb-4 overflow-y-auto [overflow-anchor:none]"
          >
            {selectedToolSlug ? (
              <ToolDetail toolSlug={selectedToolSlug} onBack={() => setSelectedToolSlug(null)} />
            ) : (
              <>
                <div className="my-4">
                  <SearchInput
                    placeholder="Search tools by name, slug, or description..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className="w-full"
                  />
                </div>
                <Suspense fallback={<SkeletonCard />}>
                  <ToolsListContent />
                </Suspense>
              </>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

