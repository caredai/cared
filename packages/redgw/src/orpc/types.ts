import type { Temporal } from '@js-temporal/polyfill'

export type GraphEntityProperties = Record<string, GraphValue>

export interface GraphEdge {
  id: number
  relationshipType: string
  sourceId: number
  destinationId: number
  properties: GraphEntityProperties
}

export interface GraphNode {
  id: number
  labels: string[]
  properties: GraphEntityProperties
}

export interface GraphPath {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphMap {
  [key: string]: GraphValue
}

export type GraphValue =
  | null
  | string
  | number
  | boolean
  | GraphValue[]
  | GraphEdge
  | GraphNode
  | GraphPath
  | GraphMap
  | {
      latitude: string
      longitude: string
    }
  | number[]
  | Temporal.PlainDateTime
  | Temporal.PlainDate
  | Temporal.PlainTime
  | Temporal.Duration
