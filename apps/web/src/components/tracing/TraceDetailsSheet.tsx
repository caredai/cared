'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDistance } from 'date-fns'
import {
  Activity,
  ClockIcon,
  Download,
  FoldVertical,
  InfoIcon,
  Settings2,
  UnfoldVertical,
} from 'lucide-react'

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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@cared/ui/components/sheet'
import { Switch } from '@cared/ui/components/switch'
import { Tabs, TabsList, TabsTrigger } from '@cared/ui/components/tabs'

import type { TraceTreeRef } from './TraceTree'
import type { TraceWithDetails } from '@langfuse/core'
import { useObservations } from '@/hooks/use-telemetry'
import { ObservationPreview } from './ObservationPreview'
import { TraceGraphView } from './TraceGraphView'
import { TracePreview } from './TracePreview'
import { TraceTree } from './TraceTree'
import { useSession } from '@/hooks/use-session'

export function TraceDetailsSheet({
  trace,
  isOpen,
  onOpenChange,
  organizationId,
  workspaceId,
  appId,
}: {
  trace: TraceWithDetails
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: string
  workspaceId?: string
  appId?: string
}) {
  const [selectedTab, setSelectedTab] = useState<'tree' | 'timeline'>('tree')
  const [currentId, setCurrentId] = useState(trace.id)
  const [showGraph, setShowGraph] = useState(true)
  const [showComments, setShowComments] = useState(false)
  const [showMetrics, setShowMetrics] = useState(true)
  const [showScores, setShowScores] = useState(false)
  const [colorCodeMetrics, setColorCodeMetrics] = useState(true)
  const [isTraceTreeExpanded, setIsTraceTreeExpanded] = useState(false)

  useEffect(() => {
    setCurrentId(trace.id)
  }, [trace.id])

  const { user } = useSession()

  // Get observations for the trace
  const { observations, isSuccess: isObservationsSuccess } = useObservations({
    traceId: trace.id,
    userId: user.id,
    organizationId,
    workspaceId,
    appId,
  })

  // Calculate total cost
  const totalCost = useMemo(() => {
    if (!observations.length) return 0
    return observations.reduce((sum, obs) => {
      const cost = obs.costDetails?.total || 0
      return sum + cost
    }, 0)
  }, [observations])

  // Calculate total usage
  const totalUsage = useMemo(() => {
    if (!observations.length) return { input: 0, output: 0, total: 0 }
    return observations.reduce(
      (sum, obs) => {
        const input = obs.usageDetails?.input || 0
        const output = obs.usageDetails?.output || 0
        return {
          input: sum.input + input,
          output: sum.output + output,
          total: sum.total + input + output,
        }
      },
      { input: 0, output: 0, total: 0 },
    )
  }, [observations])

  const treeRef = useRef<TraceTreeRef>(null)

  const toggleExpandCollapse = () => {
    if (isTraceTreeExpanded) {
      treeRef.current?.collapseAll()
    } else {
      treeRef.current?.expandAll()
    }
  }

  const handleTraceTreeExpandedChange = (expanded: boolean) => {
    setIsTraceTreeExpanded(expanded)
  }

  const downloadTraceAsJson = () => {
    const exportData = {
      trace,
      observations,
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `trace-${trace.id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[1000px] gap-0 text-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Badge variant="outline">
              <Activity className="h-4 w-4" />
              Trace
            </Badge>
            {trace.id}
            <div className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
              <span>
                {formatDistance(new Date(trace.timestamp), new Date(), { addSuffix: true })}
              </span>
              <span>•</span>
              <span>{new Date(trace.timestamp).toLocaleString()}</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 flex flex-col">
          {/* Trace Header */}
          <div className="flex items-center justify-between border-b px-4 pb-4">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">{trace.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {formatDistance(new Date(trace.timestamp), new Date(), { addSuffix: true })}
                  </span>
                  <span>•</span>
                  <span>{new Date(trace.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Cost and Usage Badges */}
              {totalCost > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <span>${totalCost.toFixed(4)}</span>
                  <InfoIcon className="h-3 w-3" />
                </Badge>
              )}

              {totalUsage.total > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <span>{totalUsage.total} tokens</span>
                  <InfoIcon className="h-3 w-3" />
                </Badge>
              )}

              {trace.latency && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  <span>{trace.latency}s</span>
                </Badge>
              )}

              {/* Actions */}
              <Button variant="outline" size="sm" onClick={downloadTraceAsJson}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
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
                      title={isTraceTreeExpanded ? 'Collapse all' : 'Expand all'}
                    >
                      {isTraceTreeExpanded ? (
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
                              <span className="mr-2">Show Comments</span>
                              <Switch checked={showComments} onCheckedChange={setShowComments} />
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                            <div className="flex w-full items-center justify-between">
                              <span className="mr-2">Show Scores</span>
                              <Switch checked={showScores} onCheckedChange={setShowScores} />
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
                            showScores={showScores}
                            showComments={showComments}
                            colorCodeMetrics={colorCodeMetrics}
                            onExpandedChange={handleTraceTreeExpandedChange}
                          />
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel defaultSize={40} minSize={20}>
                          {isObservationsSuccess && (
                            <TraceGraphView
                              trace={trace}
                              observations={observations}
                              selected={currentId}
                              onSelect={setCurrentId}
                            />
                          )}
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
                        showScores={showScores}
                        showComments={showComments}
                        colorCodeMetrics={colorCodeMetrics}
                        onExpandedChange={handleTraceTreeExpandedChange}
                      />
                    )
                  ) : (
                    <div className="h-full">
                      {/* Timeline view - simplified for now */}
                      <div className="p-4 text-center text-muted-foreground">
                        Timeline view coming soon
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Right Panel - Details */}
            <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
              <div className="h-full py-2 px-3">
                {currentId === trace.id ? (
                  <TracePreview trace={trace} observations={observations} />
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
