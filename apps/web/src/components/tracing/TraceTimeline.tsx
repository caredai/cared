'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Activity, ChevronRight, Clock } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import { cn } from '@cared/ui/lib/utils'

import type { TreeNode } from './utils'
import type { ObservationsView, TraceWithDetails } from '@langfuse/core'
import { ItemBadge } from './ItemBadge'
import {
  buildTraceTree,
  calculateDuration,
  calculateTimelineBounds,
  calculateTimelinePosition,
  formatCost,
  formatDuration,
  getAllNodeIds,
  getNodeEndTime,
  getNodeStartTime,
  heatMapTextColor,
} from './utils'

export interface TraceTimelineRef {
  expandAll: () => void
  collapseAll: () => void
}

export interface TraceTimelineProps {
  trace: TraceWithDetails
  observations: ObservationsView[]
  currentNodeId?: string
  setCurrentNodeId: (id: string) => void
  showMetrics: boolean
  colorCodeMetrics: boolean
  onExpandedChange?: (isExpanded: boolean) => void
}

export const TraceTimeline = forwardRef<TraceTimelineRef, TraceTimelineProps>(
  (
    {
      trace,
      observations,
      currentNodeId,
      setCurrentNodeId,
      showMetrics,
      colorCodeMetrics,
      onExpandedChange,
    },
    ref,
  ) => {
    // State for expanded items
    const [expandedItems, setExpandedItems] = useState<string[]>([])

    // Track trace root node expansion state and notify parent
    useEffect(() => {
      const isTraceExpanded = expandedItems.includes(trace.id)
      onExpandedChange?.(isTraceExpanded)
    }, [expandedItems, trace.id, onExpandedChange])

    // Build tree structure
    const tree = useMemo(() => {
      return buildTraceTree(trace, observations, true)
    }, [trace, observations])

    // Filter timeline nodes based on expansion state
    const timelineNodes = useMemo(() => {
      const filteredNodes: TreeNode[] = []

      const filterNodes = (nodes: TreeNode[]) => {
        nodes.forEach((node) => {
          filteredNodes.push(node)

          // If node is expanded and has children, include children
          if (expandedItems.includes(node.id) && node.children.length > 0) {
            filterNodes(node.children)
          }
        })
      }

      filterNodes(tree)
      return filteredNodes
    }, [tree, expandedItems])

    // Calculate timeline bounds for visualization
    const timelineBounds = useMemo(() => {
      return calculateTimelineBounds(timelineNodes)
    }, [timelineNodes])

    // Calculate root duration for width scaling
    const rootDuration = useMemo(() => {
      const rootNode = timelineNodes.find((node) => 'isTraceRoot' in node)
      return rootNode ? calculateDuration(rootNode) : undefined
    }, [timelineNodes])

    // Calculate total duration for color coding (use root duration as reference)
    const totalDuration = useMemo(() => {
      return rootDuration ?? 0
    }, [rootDuration])

    // Handle expand all
    const handleExpandAll = useCallback(() => {
      const allIds = getAllNodeIds(tree)
      setExpandedItems(allIds)
    }, [tree])

    // Handle collapse all
    const handleCollapseAll = useCallback(() => {
      setExpandedItems([])
    }, [])

    // Toggle expansion state for a node
    const toggleExpanded = useCallback((nodeId: string) => {
      setExpandedItems((prev) => {
        if (prev.includes(nodeId)) {
          return prev.filter((id) => id !== nodeId)
        } else {
          return [...prev, nodeId]
        }
      })
    }, [])

    // Check if a node is expanded
    const isExpanded = useCallback(
      (nodeId: string) => {
        return expandedItems.includes(nodeId)
      },
      [expandedItems],
    )

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        expandAll: handleExpandAll,
        collapseAll: handleCollapseAll,
      }),
      [handleExpandAll, handleCollapseAll],
    )

    // Auto-expand all on mount
    useEffect(() => {
      handleExpandAll()
    }, [handleExpandAll])

    // Scroll to selected node
    const currentNodeRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (currentNodeId && currentNodeRef.current) {
        currentNodeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }, [currentNodeId])

    // Render timeline item
    const renderTimelineItem = (node: TreeNode) => {
      const isTraceRoot = 'isTraceRoot' in node
      const isSelected = currentNodeId === node.id
      const duration = calculateDuration(node)
      const startTime = getNodeStartTime(node)
      const endTime = getNodeEndTime(node)
      const hasChildren = node.children.length > 0
      const isNodeExpanded = isExpanded(node.id)

      // Calculate timeline position if bounds are available
      const timelinePosition = timelineBounds
        ? calculateTimelinePosition(node, timelineBounds, rootDuration)
        : null

      // Check if we should render cost
      const shouldRenderCost =
        showMetrics && !isTraceRoot && 'costDetails' in node && Boolean(node.costDetails?.total)

      if (!(timelinePosition && startTime && endTime)) {
        return null
      }

      return (
        <div
          key={node.id}
          onClick={() => setCurrentNodeId(node.id)}
          ref={isSelected ? currentNodeRef : undefined}
          className="cursor-pointer relative h-8 overflow-hidden w-fit flex group"
          style={{
            minWidth: `${timelinePosition.left + timelinePosition.width + 32}px`,
          }}
        >
          <>
            {/* Offset */}
            <div
              style={{
                width: `${timelinePosition.left}px`,
              }}
            />
            {/* Expand/Collapse button */}
            <div className="w-8 h-8 px-1 flex items-center">
              {hasChildren && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(ev) => {
                    ev.stopPropagation()
                    toggleExpanded(node.id)
                  }}
                  className="h-6 w-6 flex-shrink-0 hover:bg-primary/10"
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform transition-transform duration-200 ease-in-out',
                      !isNodeExpanded ? 'rotate-0' : 'rotate-90',
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Button>
              )}
            </div>
            <div className="relative">
              {/* Duration bar */}
              <div
                className={cn(
                  'absolute h-8 rounded-sm border group-hover:border-3 transition-all duration-200',
                  isSelected
                    ? 'bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                    : 'bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800',
                )}
                style={{
                  width: `${timelinePosition.width}px`,
                }}
              />

              {/* Content overlay on timeline bar */}
              <div className="relative w-fit max-w-100 h-8 flex items-center px-2 gap-2">
                {/* ItemBadge and Title */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <ItemBadge
                    type={node.type as 'SPAN' | 'GENERATION' | 'EVENT'}
                    isSmall
                    className="!size-3"
                  />
                  <span className="text-xs truncate" title={node.name}>
                    {node.name}
                  </span>
                </div>

                {/* Duration */}
                {showMetrics && typeof duration === 'number' && (
                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span
                      className={cn(
                        colorCodeMetrics &&
                          totalDuration &&
                          heatMapTextColor({
                            max: totalDuration,
                            value: duration,
                          }),
                      )}
                    >
                      {formatDuration(duration)}
                    </span>
                  </div>
                )}

                {/* Cost */}
                {shouldRenderCost && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatCost(node.costDetails?.total ?? 0)}
                  </span>
                )}
              </div>
            </div>
          </>
        </div>
      )
    }

    return (
      <div className="h-full overflow-auto p-4 flex flex-col gap-2">
        {/* Timeline items */}
        {timelineNodes.map((node) => renderTimelineItem(node))}

        {/* Empty state */}
        {timelineNodes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No timeline data</h4>
            <p className="text-sm text-muted-foreground">
              This trace doesn't have any observations to display in the timeline.
            </p>
          </div>
        )}
      </div>
    )
  },
)

TraceTimeline.displayName = 'TraceTimeline'
