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
import { ChevronRight } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import { cn } from '@cared/ui/lib/utils'

import type { ObservationsView, TraceWithDetails } from '@langfuse/core'
import { ItemBadge } from '@/components/tracing/ItemBadge'
import { LevelColors } from './level-colors'

type TreeNode =
  | (ObservationsView & { children: TreeNode[] })
  | {
      id: string
      name: string
      type: 'TRACE'
      isTraceRoot: true
      children: TreeNode[]
    }

export interface TraceTreeRef {
  expandAll: () => void
  collapseAll: () => void
}

export const TraceTree = forwardRef<
  TraceTreeRef,
  {
    trace: TraceWithDetails
    observations: ObservationsView[]
    currentNodeId?: string
    setCurrentNodeId: (id: string) => void
    showMetrics: boolean
    showScores: boolean
    showComments: boolean
    colorCodeMetrics: boolean
    onExpandedChange?: (isExpanded: boolean) => void
  }
>(
  (
    {
      trace,
      observations,
      currentNodeId,
      setCurrentNodeId,
      showMetrics,
      showScores: _showScores,
      showComments: _showComments,
      colorCodeMetrics: _colorCodeMetrics,
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

    // Build tree structure from observations, with trace root node as the first item
    const tree: TreeNode[] = useMemo(() => {
      // Create a map of observations by ID for efficient lookup
      const observationMap = new Map<string, ObservationsView>()
      observations.forEach((obs) => {
        observationMap.set(obs.id, obs)
      })

      // Find root observations (those whose parentObservationId doesn't exist in the observations list)
      const rootObservations = observations.filter(
        (obs) => !obs.parentObservationId || !observationMap.has(obs.parentObservationId),
      )

      // Build tree structure recursively
      const buildTree = (parentId: string): TreeNode[] => {
        return observations
          .filter((obs) => obs.parentObservationId === parentId)
          .map((obs) => ({
            ...obs,
            children: buildTree(obs.id),
          }))
      }

      // Create trace root node
      const traceRootNode: TreeNode = {
        id: trace.id,
        name: trace.name ?? 'Untitled Trace',
        type: 'TRACE',
        isTraceRoot: true,
        children: rootObservations.map((obs) => ({
          ...obs,
          children: buildTree(obs.id),
        })),
      }

      return [traceRootNode]
    }, [observations, trace.id, trace.name])

    // Collect all node IDs for expand/collapse functionality
    const getAllNodeIds = useCallback((nodes: TreeNode[]): string[] => {
      const ids: string[] = []
      const collectIds = (nodeList: TreeNode[]) => {
        nodeList.forEach((node) => {
          ids.push(node.id)
          if (node.children.length) {
            collectIds(node.children)
          }
        })
      }
      collectIds(nodes)
      return ids
    }, [])

    // Handle expand all
    const handleExpandAll = useCallback(() => {
      const allIds = getAllNodeIds(tree)
      setExpandedItems(allIds)
    }, [tree, getAllNodeIds])

    // Handle collapse all
    const handleCollapseAll = useCallback(() => {
      setExpandedItems([])
    }, [])

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        expandAll: handleExpandAll,
        collapseAll: handleCollapseAll,
      }),
      [handleExpandAll, handleCollapseAll],
    )

    useEffect(() => {
      handleExpandAll()
    }, [handleExpandAll])

    // Render node content following SpanItem layout
    const renderNodeContent = (node: TreeNode) => {
      const isTraceRoot = 'isTraceRoot' in node

      // Calculate duration
      const duration =
        !isTraceRoot && 'endTime' in node && 'startTime' in node && node.endTime && node.startTime
          ? new Date(node.endTime).getTime() - new Date(node.startTime).getTime()
          : !isTraceRoot && 'latency' in node && node.latency
            ? node.latency * 1000
            : undefined

      // Format duration for display
      const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms.toFixed(0)}ms`
        return `${(ms / 1000).toFixed(2)}s`
      }

      // Format cost for display
      const formatCost = (cost: number) => {
        return `$${cost.toFixed(6)}`
      }

      // Format token usage
      const formatTokenUsage = (input?: number, output?: number, total?: number) => {
        const inputTokens = input ?? 0
        const outputTokens = output ?? 0
        const totalTokens = total ?? 0
        return `${inputTokens} → ${outputTokens} (∑ ${totalTokens})`
      }

      // Check if we should render metrics
      const shouldRenderMetrics =
        showMetrics &&
        Boolean(
          duration ??
            (!isTraceRoot && 'costDetails' in node && node.costDetails?.total) ??
            (!isTraceRoot &&
              'usageDetails' in node &&
              (node.usageDetails?.input ?? node.usageDetails?.output)),
        )

      return (
        <div className="flex min-w-0 items-start gap-2">
          {/* Node Type Badge */}
          <div className="relative z-20 flex-shrink-0">
            <ItemBadge
              type={node.type as 'SPAN' | 'GENERATION' | 'EVENT'}
              isSmall
              className="!size-3"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Main content row */}
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <span className="flex-shrink truncate text-xs" title={node.name}>
                {node.name}
              </span>

              <div className="flex items-center gap-2">
                {/* Level badge for observations only */}
                {!isTraceRoot &&
                  node.type !== 'TRACE' &&
                  'level' in node &&
                  node.level !== 'DEFAULT' && (
                    <div className="flex">
                      <span
                        className={cn(
                          'rounded-sm p-0.5 text-xs',
                          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                          LevelColors[node.level]?.bg,
                          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                          LevelColors[node.level]?.text,
                        )}
                      >
                        {node.level}
                      </span>
                    </div>
                  )}
              </div>
            </div>

            {/* Metrics row */}
            {shouldRenderMetrics && (
              <div className="flex flex-wrap gap-2 mt-1">
                {duration && (
                  <span className="text-xs text-muted-foreground">{formatDuration(duration)}</span>
                )}

                {!isTraceRoot && 'usageDetails' in node && (
                  <span className="text-xs text-muted-foreground">
                    {formatTokenUsage(
                      node.usageDetails?.input,
                      node.usageDetails?.output,
                      node.usageDetails?.total,
                    )}
                  </span>
                )}

                {!isTraceRoot && 'costDetails' in node && node.costDetails?.total && (
                  <span className="text-xs text-muted-foreground">
                    {formatCost(node.costDetails.total)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

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

    // Scroll to selected node
    const currentNodeRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
      if (currentNodeId && currentNodeRef.current) {
        currentNodeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }, [currentNodeId])

    // Render tree items recursively with tree lines
    const renderTreeItems = (
      nodes: TreeNode[],
      level = 0,
      treeLines: boolean[] = [],
      _isLastSibling = true,
    ) => {
      return nodes.map((node, index) => {
        const hasChildren = node.children.length > 0
        const isNodeExpanded = isExpanded(node.id)
        const isSelected = currentNodeId === node.id
        const isChildLastSibling = index === nodes.length - 1
        const childTreeLines = [...treeLines, !isChildLastSibling]

        return (
          <div key={node.id} className="select-none">
            {/* Node content with tree structure */}
            <div
              className={cn(
                'relative flex w-full rounded-md px-0 hover:rounded-lg',
                isSelected ? 'bg-muted' : 'hover:bg-muted/50',
              )}
            >
              <div className="flex w-full pl-2">
                {/* Tree structure indicators */}
                {level > 0 && (
                  <div className="flex flex-shrink-0">
                    {/* Vertical lines for ancestor levels */}
                    {Array.from({ length: level - 1 }, (_, i) => (
                      <div key={i} className="relative w-6">
                        {treeLines[i + 1] && (
                          <div className="absolute bottom-0 left-3 top-0 w-px bg-border" />
                        )}
                      </div>
                    ))}
                    {/* Branch indicator for current level */}
                    <div className="relative w-6">
                      <div
                        className="absolute left-3 w-px bg-border"
                        style={{
                          top: 0,
                          bottom: isChildLastSibling ? 'calc(100% - 12px)' : '12px',
                        }}
                      />
                      <div className="absolute left-3 top-3 h-px w-3 bg-border" />
                      {!isChildLastSibling && (
                        <div className="absolute bottom-0 left-3 top-3 w-px bg-border" />
                      )}
                      {/* Downward connector for nodes with children */}
                      {hasChildren && isNodeExpanded && (
                        <div
                          className="absolute w-px bg-border"
                          style={{ left: '36px', top: '18px', bottom: 0 }}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Downward connector placeholder for root */}
                {level === 0 && (
                  <div
                    className={cn(
                      'absolute w-px',
                      hasChildren && isNodeExpanded ? 'bg-border' : 'bg-transparent',
                    )}
                    style={{ left: '20px', top: '18px', bottom: 0 }}
                  />
                )}

                {/* Node content button */}
                <button
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => setCurrentNodeId(node.id)}
                  className={cn(
                    'peer relative flex min-w-0 flex-1 items-center rounded-md py-1.5 pl-0 pr-2 text-left',
                  )}
                  ref={isSelected ? currentNodeRef : undefined}
                >
                  {renderNodeContent(node)}
                </button>

                {/* Expand/Collapse button */}
                {hasChildren && (
                  <div className="flex items-center justify-end py-1 pr-2">
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
                          isNodeExpanded ? 'rotate-0' : 'rotate-90',
                        )}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Children */}
            {hasChildren && isNodeExpanded && (
              <div className="flex w-full flex-col">
                {renderTreeItems(node.children, level + 1, childTreeLines, isChildLastSibling)}
              </div>
            )}
          </div>
        )
      })
    }

    return (
      <div className="h-full overflow-y-auto p-2 text-sm">
        {/* Render unified tree structure */}
        {renderTreeItems(tree, 0)}
      </div>
    )
  },
)

TraceTree.displayName = 'TraceTree'
