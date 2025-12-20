import { ConstraintType, EntityType } from 'falkordb'
import { z } from 'zod'

import type { GraphValue } from './types.js'
import { getFalkor } from '../client.js'
import { GraphOffloader } from '../offloader/graph.js'
import { procedure } from './orpc.js'

export type QueryParam = null | string | number | boolean | QueryParams | QueryParam[]

export interface QueryParams {
  [key: string]: QueryParam
}

export const queryParamSchema: z.ZodType<QueryParam> = z.lazy(() =>
  z.union([
    z.null(),
    z.string(),
    z.number(),
    z.boolean(),
    queryParamsSchema,
    z.array(queryParamSchema),
  ]),
)

export const queryParamsSchema: z.ZodType<QueryParams> = z.record(z.string(), queryParamSchema)

export interface QueryStats {
  labelsAdded?: number
  labelsRemoved?: number
  nodesCreated?: number
  nodesDeleted?: number
  propertiesSet?: number
  propertiesRemoved?: number
  relationshipsCreated?: number
  relationshipsDeleted?: number
  indicesCreated?: number
  indicesDeleted?: number
  queryInternalExecutionTime: number // Required field
}

/**
 * Memory usage statistics for a graph, returned by GRAPH.MEMORY USAGE command.
 * All values are in megabytes (MB).
 */
export interface MemoryUsage {
  totalGraphSzMb: number
  labelMatricesSzMb: number
  relationMatricesSzMb: number
  amortizedNodeBlockSzMb: number
  amortizedNodeStorageSzMb?: number
  amortizedNodeAttributesByLabelSzMb: Record<string, number>
  amortizedUnlabeledNodesAttributesSzMb: number
  amortizedEdgeBlockSzMb: number
  amortizedEdgeStorageSzMb?: number
  amortizedEdgeAttributesByTypeSzMb: Record<string, number>
  indicesSzMb: number
}

const regex = /^(.+):\s*\((.+)\)(?:\s+milliseconds)?$/

/**
 “Labels added: (integer)”
 “Labels removed: (integer)”
 “Nodes created: (integer)”
 “Nodes deleted: (integer)”
 “Properties set: (integer)”
 “Properties removed: (integer)”
 “Relationships created: (integer)”
 “Relationships deleted: (integer)”
 “Indices created: (integer)”
 “Indices deleted: (integer)”
 “Query internal execution time: (float) milliseconds”
 */
function parseMetadata(metadata: string[]): QueryStats {
  const stats: Partial<QueryStats> = {}

  for (const line of metadata) {
    // Match pattern: "key: value"
    const match = regex.exec(line)
    if (!match) continue

    const [, key, valueStr] = match
    if (!key || !valueStr) {
      continue
    }

    const normalizedKey = key.trim().toLowerCase()

    // Parse numeric value (remove commas if present)
    const numericValue = parseFloat(valueStr.replace(/,/g, ''))
    if (Number.isNaN(numericValue)) {
      throw new Error(`Invalid stats line: ${line}`)
    }

    // Map keys to object properties
    switch (normalizedKey) {
      case 'labels added':
        stats.labelsAdded = numericValue
        break
      case 'labels removed':
        stats.labelsRemoved = numericValue
        break
      case 'nodes created':
        stats.nodesCreated = numericValue
        break
      case 'nodes deleted':
        stats.nodesDeleted = numericValue
        break
      case 'properties set':
        stats.propertiesSet = numericValue
        break
      case 'properties removed':
        stats.propertiesRemoved = numericValue
        break
      case 'relationships created':
        stats.relationshipsCreated = numericValue
        break
      case 'relationships deleted':
        stats.relationshipsDeleted = numericValue
        break
      case 'indices created':
        stats.indicesCreated = numericValue
        break
      case 'indices deleted':
        stats.indicesDeleted = numericValue
        break
      case 'query internal execution time':
        stats.queryInternalExecutionTime = numericValue
        break
    }
  }

  if (stats.queryInternalExecutionTime === undefined) {
    throw new Error('Query internal execution time is required but not found')
  }

  return stats as QueryStats
}

/**
 * Parse memory usage result from GRAPH.MEMORY USAGE command.
 * Redis returns an array of key-value pairs, where some values are integers
 * and others are nested arrays (for attributes by label/type).
 *
 * @param result - Array format from Redis: [key1, value1, key2, value2, ...]
 * @returns Structured memory usage object
 */
function parseMemoryUsage(result: unknown): MemoryUsage {
  // Handle array format from Redis
  if (!Array.isArray(result)) {
    throw new Error('Memory usage result must be an array')
  }

  const memory: Partial<MemoryUsage> = {
    amortizedNodeAttributesByLabelSzMb: {},
    amortizedEdgeAttributesByTypeSzMb: {},
  }

  // Parse array of key-value pairs
  for (let i = 0; i < result.length; i += 2) {
    const key: unknown = result[i]
    const value: unknown = result[i + 1]

    if (typeof key !== 'string' || value === undefined) {
      continue
    }

    // Convert snake_case to camelCase
    const normalizedKey = key
      .toLowerCase()
      .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())

    // Handle nested arrays for attributes by label/type
    if (normalizedKey === 'amortizedNodeAttributesByLabelSzMb' && Array.isArray(value)) {
      // Format: ["User", 0, "Post", 0, ...]
      const nodeAttrs = memory.amortizedNodeAttributesByLabelSzMb
      if (nodeAttrs) {
        for (let j = 0; j < value.length; j += 2) {
          const label: unknown = value[j]
          const size: unknown = value[j + 1]
          if (typeof label === 'string' && typeof size === 'number') {
            nodeAttrs[label] = size
          }
        }
      }
    } else if (normalizedKey === 'amortizedEdgeAttributesByTypeSzMb' && Array.isArray(value)) {
      // Format: ["FRIENDS_WITH", 0, "CREATED", 0, ...]
      const edgeAttrs = memory.amortizedEdgeAttributesByTypeSzMb
      if (edgeAttrs) {
        for (let j = 0; j < value.length; j += 2) {
          const type: unknown = value[j]
          const size: unknown = value[j + 1]
          if (typeof type === 'string' && typeof size === 'number') {
            edgeAttrs[type] = size
          }
        }
      }
    } else if (typeof value === 'number') {
      // Handle simple numeric values
      switch (normalizedKey) {
        case 'totalgraphszmb':
          memory.totalGraphSzMb = value
          break
        case 'labelmatricesszmb':
          memory.labelMatricesSzMb = value
          break
        case 'relationmatricesszmb':
          memory.relationMatricesSzMb = value
          break
        case 'amortizednodeblockszmb':
          memory.amortizedNodeBlockSzMb = value
          break
        case 'amortizednodestorageszmb':
          memory.amortizedNodeStorageSzMb = value
          break
        case 'amortizedunlabelednodesattributesszmb':
          memory.amortizedUnlabeledNodesAttributesSzMb = value
          break
        case 'amortizededgeblockszmb':
          memory.amortizedEdgeBlockSzMb = value
          break
        case 'amortizededgestorageszmb':
          memory.amortizedEdgeStorageSzMb = value
          break
        case 'indicesszmb':
          memory.indicesSzMb = value
          break
      }
    }
  }

  // Validate required fields
  if (memory.totalGraphSzMb === undefined) {
    throw new Error('Missing required field: total_graph_sz_mb')
  }
  if (memory.labelMatricesSzMb === undefined) {
    throw new Error('Missing required field: label_matrices_sz_mb')
  }
  if (memory.relationMatricesSzMb === undefined) {
    throw new Error('Missing required field: relation_matrices_sz_mb')
  }
  if (memory.amortizedNodeBlockSzMb === undefined) {
    throw new Error('Missing required field: amortized_node_block_sz_mb')
  }
  if (memory.amortizedUnlabeledNodesAttributesSzMb === undefined) {
    throw new Error('Missing required field: amortized_unlabeled_nodes_attributes_sz_mb')
  }
  if (memory.amortizedEdgeBlockSzMb === undefined) {
    throw new Error('Missing required field: amortized_edge_block_sz_mb')
  }
  if (memory.indicesSzMb === undefined) {
    throw new Error('Missing required field: indices_sz_mb')
  }

  return memory as MemoryUsage
}

const offloader = new GraphOffloader()

function withGraphAccess<T extends { input: { graph: string } }, R>(
  handler: (opts: T) => Promise<R>,
) {
  return async (opts: T) => {
    await offloader.init()
    await offloader.access(opts.input.graph)
    return await handler(opts)
  }
}

// TODO: cache graph clients
export const graphRouter = {
  query: procedure
    .input(
      z.object({
        graph: z.string(),
        query: z.string(),
        params: queryParamsSchema.optional(),
      }),
    )
    .handler(
      withGraphAccess(async ({ input }) => {
        const client = await getFalkor()
        const graph = client.selectGraph(input.graph)
        const result = await graph.query(input.query, {
          params: input.params,
        })
        return {
          rows: result.data as Record<string, GraphValue>[] | undefined,
          stats: parseMetadata(result.metadata),
        }
      }),
    ),

  readonlyQuery: procedure
    .input(
      z.object({
        graph: z.string(),
        query: z.string(),
        params: queryParamsSchema.optional(),
      }),
    )
    .handler(
      withGraphAccess(async ({ input }) => {
        const client = await getFalkor()
        const graph = client.selectGraph(input.graph)
        const result = await graph.roQuery(input.query, {
          params: input.params,
        })
        return {
          rows: result.data as Record<string, GraphValue>[] | undefined,
          stats: parseMetadata(result.metadata),
        }
      }),
    ),

  delete: procedure
    .input(
      z.object({
        graph: z.string(),
      }),
    )
    .handler(async ({ input }) => {
      await offloader.delete(input.graph)
    }),

  copy: procedure
    .input(
      z.object({
        graph: z.string(),
        targetGraph: z.string(),
      }),
    )
    .handler(
      withGraphAccess(async ({ input }) => {
        const client = await getFalkor()
        const graph = client.selectGraph(input.graph)

        // Also ensure the target graph is accessible if it needs to be modified,
        // although copy is a read operation on the source.
        await offloader.access(input.targetGraph)
        // May throw error `destination key already exists`
        try {
          await graph.copy(input.targetGraph)
        } catch (error) {
          await offloader.delete(input.targetGraph)
          throw error
        }
      }),
    ),

  explain: procedure
    .input(
      z.object({
        graph: z.string(),
        query: z.string(),
      }),
    )
    .handler(
      withGraphAccess(async ({ input }) => {
        const client = await getFalkor()
        const graph = client.selectGraph(input.graph)
        const explain = (await graph.explain(input.query)) as string[]
        return {
          explain,
        }
      }),
    ),

  profile: procedure
    .input(
      z.object({
        graph: z.string(),
        query: z.string(),
      }),
    )
    .handler(
      withGraphAccess(async ({ input }) => {
        const client = await getFalkor()
        const graph = client.selectGraph(input.graph)
        const profile = (await graph.profile(input.query)) as string[]
        return {
          profile,
        }
      }),
    ),

  slowLog: procedure
    .input(
      z.object({
        graph: z.string(),
        reset: z.boolean().optional(),
      }),
    )
    .handler(
      withGraphAccess(async ({ input }) => {
        const client = await getFalkor()
        const graph = client.selectGraph(input.graph)
        const logs = await graph.slowLog()
        return {
          logs: logs.map(({ took, ...log }) => ({
            ...log,
            tookMs: took,
          })),
        }
      }),
    ),

  memoryUsage: procedure
    .input(
      z.object({
        graph: z.string(),
        options: z
          .object({
            samples: z.number().optional(),
          })
          .optional(),
      }),
    )
    .handler(
      withGraphAccess(async ({ input }) => {
        const client = await getFalkor()
        const graph = client.selectGraph(input.graph)
        const result = await graph.memoryUsage({
          SAMPLES: input.options?.samples,
        })
        return {
          memoryUsage: parseMemoryUsage(result),
        }
      }),
    ),

  createConstraint: procedure
    .input(
      z.object({
        graph: z.string(),
        constraintType: z.enum(ConstraintType),
        entityType: z.enum(EntityType),
        label: z.string(),
        attributes: z.array(z.string()).min(1).max(255),
      }),
    )
    .handler(
      withGraphAccess(async ({ input }) => {
        const client = await getFalkor()
        const graph = client.selectGraph(input.graph)
        await graph.constraintCreate(
          input.constraintType,
          input.entityType,
          input.label,
          ...input.attributes,
        )
      }),
    ),

  dropConstraint: procedure
    .input(
      z.object({
        graph: z.string(),
        constraintType: z.enum(ConstraintType),
        entityType: z.enum(EntityType),
        label: z.string(),
        attributes: z.array(z.string()).min(1).max(255),
      }),
    )
    .handler(
      withGraphAccess(async ({ input }) => {
        const client = await getFalkor()
        const graph = client.selectGraph(input.graph)
        await graph.constraintDrop(
          input.constraintType,
          input.entityType,
          input.label,
          ...input.attributes,
        )
      }),
    ),

  createIndex: procedure
    .input(
      z.discriminatedUnion('idxType', [
        // RANGE and FULLTEXT index types
        z.object({
          graph: z.string(),
          idxType: z.enum(['RANGE', 'FULLTEXT']),
          entityType: z.enum(['NODE', 'EDGE']),
          label: z.string().min(1),
          properties: z.array(z.string()).min(1),
        }),
        // VECTOR index type with required options
        z.object({
          graph: z.string(),
          idxType: z.literal('VECTOR'),
          entityType: z.enum(['NODE', 'EDGE']),
          label: z.string().min(1),
          properties: z.array(z.string()).min(1),
          options: z.object({
            dimension: z.number().int().positive(),
            similarityFunction: z.enum(['euclidean', 'cosine']),
            M: z.number().int().positive().optional(),
            efConstruction: z.number().int().positive().optional(),
            efRuntime: z.number().int().positive().optional(),
          }),
        }),
      ]),
    )
    .handler(
      withGraphAccess(async ({ input }) => {
        const client = await getFalkor()
        const graph = client.selectGraph(input.graph)

        // Build options object for VECTOR type
        let options: Record<string, string | number | boolean> | undefined
        if (input.idxType === 'VECTOR') {
          options = {
            dimension: input.options.dimension,
            similarityFunction: input.options.similarityFunction,
            ...(input.options.M !== undefined && { M: input.options.M }),
            ...(input.options.efConstruction !== undefined && {
              efConstruction: input.options.efConstruction,
            }),
            ...(input.options.efRuntime !== undefined && {
              efRuntime: input.options.efRuntime,
            }),
          }
        }

        const result = await graph.createTypedIndex(
          input.idxType,
          input.entityType,
          input.label,
          input.properties,
          options,
        )
        return {
          rows: result.data as Record<string, GraphValue>[] | undefined,
          stats: parseMetadata(result.metadata),
        }
      }),
    ),

  dropIndex: procedure
    .input(
      z.object({
        graph: z.string(),
        idxType: z.enum(['RANGE', 'FULLTEXT', 'VECTOR']),
        entityType: z.enum(['NODE', 'EDGE']),
        label: z.string(),
        property: z.string(),
      }),
    )
    .handler(
      withGraphAccess(async ({ input }) => {
        const client = await getFalkor()
        const graph = client.selectGraph(input.graph)
        const result = await graph.dropTypedIndex(
          input.idxType,
          input.entityType,
          input.label,
          input.property,
        )
        return {
          rows: result.data as Record<string, GraphValue>[] | undefined,
          stats: parseMetadata(result.metadata),
        }
      }),
    ),
}
