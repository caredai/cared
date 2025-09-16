import { Decimal } from 'decimal.js'

import type { ObservationsView, TraceWithDetails } from '@langfuse/core'

export const heatMapTextColor = (p: {
  min?: Decimal | number
  max: Decimal | number
  value: Decimal | number
}) => {
  const { min, max, value } = p
  const minDecimal = min ? new Decimal(min) : new Decimal(0)
  const maxDecimal = new Decimal(max)
  const valueDecimal = new Decimal(value)

  const cutOffs: [number, string][] = [
    [0.75, 'text-red-600'], // 75%
    [0.5, 'text-yellow-600'], // 50%
  ]
  const standardizedValueOnStartEndScale = valueDecimal
    .sub(minDecimal)
    .div(maxDecimal.sub(minDecimal))
  const ratio = standardizedValueOnStartEndScale.toNumber()

  // pick based on ratio if threshold is exceeded
  for (const [threshold, color] of cutOffs) {
    if (ratio >= threshold) {
      return color
    }
  }
  return ''
}

// Tree node type definition
export type TreeNode =
  | (ObservationsView & { children: TreeNode[] })
  | (TraceWithDetails & {
      type: 'TRACE'
      isTraceRoot: true
      children: TreeNode[]
    })

// Calculate duration for a node
export const calculateDuration = (node: TreeNode) => {
  const isTraceRoot = 'isTraceRoot' in node
  if (isTraceRoot) {
    return node.latency * 1000
  } else if (node.endTime) {
    return new Date(node.endTime).getTime() - new Date(node.startTime).getTime()
  } else {
    return (node.latency ?? 0) * 1000
  }
}

// Format duration for display
export const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// Format cost for display
export const formatCost = (cost: number) => {
  return `$${cost.toFixed(6)}`
}

// Format token usage
export const formatTokenUsage = (input?: number, output?: number, total?: number) => {
  const inputTokens = input ?? 0
  const outputTokens = output ?? 0
  const totalTokens = total ?? 0
  return `${inputTokens} → ${outputTokens} (∑ ${totalTokens})`
}

// Build tree structure from observations and trace
export const buildTraceTree = (
  trace: TraceWithDetails,
  observations: ObservationsView[],
  sortByStartTime = false,
): TreeNode[] => {
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
    const filteredObservations = observations.filter((obs) => obs.parentObservationId === parentId)

    const sortedObservations = sortByStartTime
      ? filteredObservations.sort((a, b) => {
          // Sort by start time if both have start times
          if (a.startTime && b.startTime) {
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          }
          // If only one has start time, prioritize the one with start time
          if (a.startTime && !b.startTime) return -1
          if (!a.startTime && b.startTime) return 1
          // If neither has start time, sort by id as fallback
          return a.id.localeCompare(b.id)
        })
      : filteredObservations

    return sortedObservations.map((obs) => ({
      ...obs,
      children: buildTree(obs.id),
    }))
  }

  // Create trace root node
  const traceRootNode: TreeNode = {
    ...trace,
    name: trace.name ?? 'Untitled Trace',
    type: 'TRACE',
    isTraceRoot: true,
    children: (sortByStartTime
      ? rootObservations.sort((a, b) => {
          // Sort by start time if both have start times
          if (a.startTime && b.startTime) {
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          }
          // If only one has start time, prioritize the one with start time
          if (a.startTime && !b.startTime) return -1
          if (!a.startTime && b.startTime) return 1
          // If neither has start time, sort by id as fallback
          return a.id.localeCompare(b.id)
        })
      : rootObservations
    ).map((obs) => ({
      ...obs,
      children: buildTree(obs.id),
    })),
  }

  return [traceRootNode]
}

// Collect all node IDs for expand/collapse functionality
export const getAllNodeIds = (nodes: TreeNode[]): string[] => {
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
}

// Flatten tree to get all nodes in chronological order
export const flattenTreeToTimeline = (nodes: TreeNode[]): TreeNode[] => {
  const result: TreeNode[] = []

  const flatten = (nodeList: TreeNode[]) => {
    nodeList.forEach((node) => {
      result.push(node)
      if (node.children.length > 0) {
        flatten(node.children)
      }
    })
  }

  flatten(nodes)
  return result
}

// Get start time for a node
export const getNodeStartTime = (node: TreeNode): Date => {
  const isTraceRoot = 'isTraceRoot' in node
  if (isTraceRoot) {
    return new Date(node.timestamp)
  } else {
    return new Date(node.startTime)
  }
}

// Get end time for a node
export const getNodeEndTime = (node: TreeNode): Date => {
  const isTraceRoot = 'isTraceRoot' in node
  if (isTraceRoot) {
    // For trace root, calculate end time from start time + latency
    const startTime = getNodeStartTime(node)
    return new Date(startTime.getTime() + node.latency * 1000)
  } else if (node.endTime) {
    return new Date(node.endTime)
  } else {
    // If no end time, use start time + latency
    const startTime = getNodeStartTime(node)
    return new Date(startTime.getTime() + (node.latency ?? 0) * 1000)
  }
}

// Calculate timeline bounds (earliest start time and latest end time)
export const calculateTimelineBounds = (nodes: TreeNode[]): { start: Date; end: Date } | null => {
  if (nodes.length === 0) return null

  let earliestStart: Date | undefined
  let latestEnd: Date | undefined

  nodes.forEach((node) => {
    const startTime = getNodeStartTime(node)
    const endTime = getNodeEndTime(node)

    if (!earliestStart || startTime < earliestStart) {
      earliestStart = startTime
    }

    if (!latestEnd || endTime > latestEnd) {
      latestEnd = endTime
    }
  })

  if (!earliestStart || !latestEnd) return null

  return { start: earliestStart, end: latestEnd }
}

// Calculate position and width for timeline visualization
export const calculateTimelinePosition = (
  node: TreeNode,
  bounds: { start: Date; end: Date },
  rootDuration?: number,
): { left: number; width: number } | null => {
  const startTime = getNodeStartTime(node)
  const endTime = getNodeEndTime(node)

  const isTraceRoot = 'isTraceRoot' in node
  const nodeDuration = endTime.getTime() - startTime.getTime()

  // If this is the root trace node, use fixed width of 600px
  if (isTraceRoot) {
    return { left: 0, width: 600 }
  }

  // For other nodes, calculate width based on ratio with root duration
  if (rootDuration && rootDuration > 0) {
    const width = (nodeDuration / rootDuration) * 600 // Scale based on root's 600px width
    const totalDuration = bounds.end.getTime() - bounds.start.getTime()
    const nodeStart = startTime.getTime() - bounds.start.getTime()
    const left = (nodeStart / totalDuration) * 600 // Scale left position to 600px container

    return { left: Math.max(0, left), width: Math.max(1, width) }
  }

  // Fallback to original percentage-based calculation
  const totalDuration = bounds.end.getTime() - bounds.start.getTime()
  const nodeStart = startTime.getTime() - bounds.start.getTime()

  const left = (nodeStart / totalDuration) * 100
  const width = (nodeDuration / totalDuration) * 100

  return { left: Math.max(0, left), width: Math.max(0.1, width) }
}
