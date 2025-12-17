import { ConstraintType, EntityType } from 'falkordb'
import { z } from 'zod'

import type { GraphValue } from './types.js'
import { getFalkor } from '../client.js'
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
    .handler(async ({ input }) => {
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

  readonlyQuery: procedure
    .input(
      z.object({
        graph: z.string(),
        query: z.string(),
        params: queryParamsSchema.optional(),
      }),
    )
    .handler(async ({ input }) => {
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

  delete: procedure
    .input(
      z.object({
        graph: z.string(),
      }),
    )
    .handler(async ({ input }) => {
      const client = await getFalkor()
      const graph = client.selectGraph(input.graph)
      await graph.delete()
      return {
        success: true,
      }
    }),

  copy: procedure
    .input(
      z.object({
        graph: z.string(),
        targetGraph: z.string(),
      }),
    )
    .handler(async ({ input }) => {
      const client = await getFalkor()
      const graph = client.selectGraph(input.graph)
      const result = (await graph.copy(input.targetGraph)) as unknown
      return {
        success: true,
        result,
      }
    }),

  explain: procedure
    .input(
      z.object({
        graph: z.string(),
        query: z.string(),
      }),
    )
    .handler(async ({ input }) => {
      const client = await getFalkor()
      const graph = client.selectGraph(input.graph)
      const result = (await graph.explain(input.query)) as unknown
      return {
        result,
      }
    }),

  profile: procedure
    .input(
      z.object({
        graph: z.string(),
        query: z.string(),
      }),
    )
    .handler(async ({ input }) => {
      const client = await getFalkor()
      const graph = client.selectGraph(input.graph)
      const result = (await graph.profile(input.query)) as unknown
      return {
        result,
      }
    }),

  slowLog: procedure
    .input(
      z.object({
        graph: z.string(),
      }),
    )
    .handler(async ({ input }) => {
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
    .handler(async ({ input }) => {
      const client = await getFalkor()
      const graph = client.selectGraph(input.graph)
      const result = await graph.memoryUsage({
        SAMPLES: input.options?.samples,
      })
      return {
        memory: result,
      }
    }),

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
    .handler(async ({ input }) => {
      const client = await getFalkor()
      const graph = client.selectGraph(input.graph)
      await graph.constraintCreate(
        input.constraintType,
        input.entityType,
        input.label,
        ...input.attributes,
      )
    }),

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
    .handler(async ({ input }) => {
      const client = await getFalkor()
      const graph = client.selectGraph(input.graph)
      await graph.constraintDrop(
        input.constraintType,
        input.entityType,
        input.label,
        ...input.attributes,
      )
    }),

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
    .handler(async ({ input }) => {
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
        result,
      }
    }),

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
    .handler(async ({ input }) => {
      const client = await getFalkor()
      const graph = client.selectGraph(input.graph)
      const result = await graph.dropTypedIndex(
        input.idxType,
        input.entityType,
        input.label,
        input.property,
      )
      return {
        result,
      }
    }),
}
