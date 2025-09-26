import { useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { Activity, FoldVertical, Settings2, UnfoldVertical, XIcon } from 'lucide-react'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@cared/ui/components/resizable'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@cared/ui/components/sheet'
import { Spinner } from '@cared/ui/components/spinner'
import { Switch } from '@cared/ui/components/switch'
import { Tabs, TabsList, TabsTrigger } from '@cared/ui/components/tabs'

import type { TraceTimelineRef } from './TraceTimeline'
import type { TraceTreeRef } from './TraceTree'
import type { TraceWithDetails } from '@langfuse/core'
import { useSession } from '@/hooks/use-session'
import { useObservations } from '@/hooks/use-telemetry'
import { ObservationPreview } from './ObservationPreview'
import { TraceGraphView } from './TraceGraphView'
import { TraceNavigation } from './TraceNavigation'
import { TracePreview } from './TracePreview'
import { TraceTimeline } from './TraceTimeline'
import { TraceTree } from './TraceTree'

export function TraceDetailsSheet({
  trace,
  isOpen,
  onOpenChange,
  organizationId,
  workspaceId,
  appId,
  traces,
  onNavigate,
}: {
  trace: TraceWithDetails
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: string
  workspaceId?: string
  appId?: string
  traces?: TraceWithDetails[]
  onNavigate?: (traceId: string) => void
}) {
  const [selectedTab, setSelectedTab] = useState<'tree' | 'timeline'>('tree')
  const [currentId, setCurrentId] = useState(trace.id)
  const [showGraph, setShowGraph] = useState(true)
  const [showMetrics, setShowMetrics] = useState(true)
  const [colorCodeMetrics, setColorCodeMetrics] = useState(true)
  const [isTraceTreeExpanded, setIsTraceTreeExpanded] = useState(false)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false)

  useEffect(() => {
    setCurrentId(trace.id)
  }, [trace.id])

  const { user } = useSession()

  // Get observations for the trace
  const { observations, isLoading: isObservationsLoading } = useObservations({
    traceId: trace.id,
    userId: user.id,
    organizationId,
    workspaceId,
    appId,
  })

  const treeRef = useRef<TraceTreeRef>(null)
  const timelineRef = useRef<TraceTimelineRef>(null)

  const toggleExpandCollapse = () => {
    if (selectedTab === 'tree') {
      if (isTraceTreeExpanded) {
        treeRef.current?.collapseAll()
      } else {
        treeRef.current?.expandAll()
      }
    } else {
      if (isTimelineExpanded) {
        timelineRef.current?.collapseAll()
      } else {
        timelineRef.current?.expandAll()
      }
    }
  }

  const handleTraceTreeExpandedChange = (expanded: boolean) => {
    setIsTraceTreeExpanded(expanded)
  }

  const handleTimelineExpandedChange = (expanded: boolean) => {
    setIsTimelineExpanded(expanded)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        close={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-full sm:max-w-[1000px] overflow-x-auto text-sm"
      >
        <div className="min-w-[800px] h-full flex flex-col">
          <SheetHeader className="bg-muted border-b">
            <SheetTitle className="w-full flex items-center gap-2">
              <Badge variant="outline">
                <Activity className="h-4 w-4" />
                Trace
              </Badge>
              <span>{trace.id}</span>
              <div className="ml-auto flex justify-between items-center gap-2">
                {traces && onNavigate && (
                  <TraceNavigation
                    traces={traces}
                    currentTraceId={trace.id}
                    onNavigate={onNavigate}
                  />
                )}
                <SheetClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
                  <XIcon className="size-4" />
                  <span className="sr-only">Close</span>
                </SheetClose>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 flex flex-col">
            {/* Main Content */}
            {isObservationsLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* Left Panel - Tree/Timeline */}
                <ResizablePanel defaultSize={30} minSize={25} maxSize={80}>
                  <div className="flex h-full flex-col">
                    {/* Controls */}
                    <div className="flex items-center justify-between border-b p-2">
                      <div className="flex items-center gap-2">
                        <Tabs
                          value={selectedTab}
                          onValueChange={(value) => setSelectedTab(value as 'tree' | 'timeline')}
                        >
                          <TabsList>
                            <TabsTrigger value="tree">Tree</TabsTrigger>
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                          </TabsList>
                        </Tabs>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleExpandCollapse}
                          title={
                            selectedTab === 'tree'
                              ? isTraceTreeExpanded
                                ? 'Collapse all'
                                : 'Expand all'
                              : isTimelineExpanded
                                ? 'Collapse all'
                                : 'Expand all'
                          }
                        >
                          {(selectedTab === 'tree' ? isTraceTreeExpanded : isTimelineExpanded) ? (
                            <FoldVertical className="h-4 w-4" />
                          ) : (
                            <UnfoldVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="View Options">
                              <Settings2 className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>View Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <div className="space-y-1 p-1">
                              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                                <div className="flex w-full items-center justify-between">
                                  <span className="mr-2">Show Graph</span>
                                  <Switch
                                    checked={showGraph}
                                    onCheckedChange={(e) => setShowGraph(e)}
                                  />
                                </div>
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                                <div className="flex w-full items-center justify-between">
                                  <span className="mr-2">Show Metrics</span>
                                  <Switch checked={showMetrics} onCheckedChange={setShowMetrics} />
                                </div>
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                                <div className="flex w-full items-center justify-between">
                                  <span className="mr-2">Color Code Metrics</span>
                                  <Switch
                                    checked={colorCodeMetrics}
                                    onCheckedChange={setColorCodeMetrics}
                                    disabled={!showMetrics}
                                  />
                                </div>
                              </DropdownMenuItem>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Tree/Timeline Content */}
                    <div className="flex-1 overflow-hidden">
                      {selectedTab === 'tree' ? (
                        showGraph ? (
                          <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={60} minSize={30}>
                              <TraceTree
                                ref={treeRef}
                                trace={trace}
                                observations={observations}
                                currentNodeId={currentId}
                                setCurrentNodeId={setCurrentId}
                                showMetrics={showMetrics}
                                colorCodeMetrics={colorCodeMetrics}
                                onExpandedChange={handleTraceTreeExpandedChange}
                              />
                            </ResizablePanel>
                            <ResizableHandle />
                            <ResizablePanel defaultSize={40} minSize={20}>
                              <TraceGraphView
                                trace={trace}
                                observations={observations}
                                selected={currentId}
                                onSelect={setCurrentId}
                              />
                            </ResizablePanel>
                          </ResizablePanelGroup>
                        ) : (
                          <TraceTree
                            ref={treeRef}
                            trace={trace}
                            observations={observations}
                            currentNodeId={currentId}
                            setCurrentNodeId={setCurrentId}
                            showMetrics={showMetrics}
                            colorCodeMetrics={colorCodeMetrics}
                            onExpandedChange={handleTraceTreeExpandedChange}
                          />
                        )
                      ) : (
                        <TraceTimeline
                          ref={timelineRef}
                          trace={trace}
                          observations={observations}
                          currentNodeId={currentId}
                          setCurrentNodeId={setCurrentId}
                          showMetrics={showMetrics}
                          colorCodeMetrics={colorCodeMetrics}
                          onExpandedChange={handleTimelineExpandedChange}
                        />
                      )}
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle />

                {/* Right Panel - Details */}
                <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
                  <div className="h-full py-2 px-3">
                    {currentId === trace.id ? (
                      <TracePreview trace={trace} />
                    ) : (
                      <ObservationPreview
                        observationId={currentId}
                        observations={observations}
                        trace={trace}
                      />
                    )}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
