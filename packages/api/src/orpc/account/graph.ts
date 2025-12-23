import { ConstraintType, EntityType } from 'falkordb'
import { z } from 'zod/v4'

import { graph as rg } from '@cared/redgw'

import { noneAppUserProtectedProcedure } from '../../orpc'
import { graphService } from '../../service/graph'

export const graphRouter = {
  /**
   * Create a new graph.
   * @param input - Graph name
   * @returns The created graph
   */
  create: noneAppUserProtectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      const graph = await graphService.createGraph(input.name, accountId)
      return { graph }
    }),

  /**
   * List all graphs for an account.
   * @returns Array of graphs
   */
  list: noneAppUserProtectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      const { limit, cursor } = input

      return await graphService.listGraphs(accountId, {
        limit,
        cursor,
      })
    }),

  /**
   * Delete a graph.
   * @param input - Graph name
   */
  delete: noneAppUserProtectedProcedure
    .input(
      z.object({
        graph: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      await graphService.deleteGraphByName(input.graph, accountId)
    }),

  /**
   * Copy a graph.
   * @param input - Source graph name and target graph name
   */
  copy: noneAppUserProtectedProcedure
    .input(
      z.object({
        graph: z.string(),
        targetGraph: z.string().min(1),
        create: z.boolean().default(true),
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId

      const sourceGraph = await graphService.getGraphByName(input.graph, accountId)

      const targetGraph = input.create
        ? await graphService.createGraph(input.targetGraph, accountId)
        : await graphService.getGraphByName(input.targetGraph, accountId)

      // Copy in redgw
      await graphService.client.graph.copy({
        graph: sourceGraph.key,
        targetGraph: targetGraph.key,
      })
    }),

  /**
   * Execute a query on a graph.
   * @param input - Graph name, query string, and optional parameters
   */
  query: noneAppUserProtectedProcedure
    .input(
      z.object({
        graph: z.string(),
        query: z.string(),
        params: rg.queryParamsSchema.optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId

      // Get graph by name
      const graph = await graphService.getGraphByName(input.graph, accountId)

      // Execute query
      return await graphService.client.graph.query({
        graph: graph.key,
        query: input.query,
        params: input.params,
      })
    }),

  /**
   * Execute a readonly query on a graph.
   * @param input - Graph name, query string, and optional parameters
   */
  readonlyQuery: noneAppUserProtectedProcedure
    .input(
      z.object({
        graph: z.string(),
        query: z.string(),
        params: rg.queryParamsSchema.optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId

      // Get graph by name
      const graph = await graphService.getGraphByName(input.graph, accountId)

      // Execute readonly query
      return await graphService.client.graph.readonlyQuery({
        graph: graph.key,
        query: input.query,
        params: input.params,
      })
    }),

  /**
   * Explain a query execution plan.
   * @param input - Graph name and query string
   */
  explain: noneAppUserProtectedProcedure
    .input(
      z.object({
        graph: z.string(),
        query: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId

      // Get graph by name
      const graph = await graphService.getGraphByName(input.graph, accountId)

      // Execute explain
      const { explain } = await graphService.client.graph.explain({
        graph: graph.key,
        query: input.query,
      })

      return {
        explain,
      }
    }),

  /**
   * Get slow log for a graph.
   * @param input - Graph name and optional reset flag
   */
  slowLog: noneAppUserProtectedProcedure
    .input(
      z.object({
        graph: z.string(),
        reset: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId

      // Get graph by name
      const graph = await graphService.getGraphByName(input.graph, accountId)

      // Get slow log
      const { logs } = await graphService.client.graph.slowLog({
        graph: graph.key,
        reset: input.reset,
      })

      return {
        logs,
      }
    }),

  /**
   * Create a constraint on a graph.
   * @param input - Graph name, constraint type, entity type, label, and attributes
   */
  createConstraint: noneAppUserProtectedProcedure
    .input(
      z.object({
        graph: z.string(),
        constraintType: z.enum(ConstraintType),
        entityType: z.enum(EntityType),
        label: z.string(),
        attributes: z.array(z.string()).min(1).max(255),
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId

      // Get graph by name
      const graph = await graphService.getGraphByName(input.graph, accountId)

      // Create constraint
      await graphService.client.graph.createConstraint({
        graph: graph.key,
        constraintType: input.constraintType,
        entityType: input.entityType,
        label: input.label,
        attributes: input.attributes,
      })
    }),

  /**
   * Drop a constraint from a graph.
   * @param input - Graph name, constraint type, entity type, label, and attributes
   */
  dropConstraint: noneAppUserProtectedProcedure
    .input(
      z.object({
        graph: z.string(),
        constraintType: z.enum(ConstraintType),
        entityType: z.enum(EntityType),
        label: z.string(),
        attributes: z.array(z.string()).min(1).max(255),
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId

      // Get graph by name
      const graph = await graphService.getGraphByName(input.graph, accountId)

      // Drop constraint
      // Type assertion needed because ConstraintType and EntityType from falkordb are not compatible with zod enum
      await graphService.client.graph.dropConstraint({
        graph: graph.key,
        constraintType: input.constraintType,
        entityType: input.entityType,
        label: input.label,
        attributes: input.attributes,
      })
    }),

  /**
   * Create an index on a graph.
   * @param input - Graph name, index type, entity type, label, properties, and optional options
   */
  createIndex: noneAppUserProtectedProcedure
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
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId

      // Get graph by name
      const graph = await graphService.getGraphByName(input.graph, accountId)

      // Create index
      if (input.idxType === 'VECTOR') {
        return await graphService.client.graph.createIndex({
          graph: graph.key,
          idxType: input.idxType,
          entityType: input.entityType,
          label: input.label,
          properties: input.properties,
          options: input.options,
        })
      } else {
        return await graphService.client.graph.createIndex({
          graph: graph.key,
          idxType: input.idxType,
          entityType: input.entityType,
          label: input.label,
          properties: input.properties,
        })
      }
    }),

  /**
   * Drop an index from a graph.
   * @param input - Graph name, index type, entity type, label, and property
   */
  dropIndex: noneAppUserProtectedProcedure
    .input(
      z.object({
        graph: z.string(),
        idxType: z.enum(['RANGE', 'FULLTEXT', 'VECTOR']),
        entityType: z.enum(['NODE', 'EDGE']),
        label: z.string(),
        property: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId

      // Get graph by name
      const graph = await graphService.getGraphByName(input.graph, accountId)

      // Drop index
      return await graphService.client.graph.dropIndex({
        graph: graph.key,
        idxType: input.idxType,
        entityType: input.entityType,
        label: input.label,
        property: input.property,
      })
    }),
}
