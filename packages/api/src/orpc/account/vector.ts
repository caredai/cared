import { z } from 'zod'

import { noneAppUserProtectedProcedure } from '../../orpc'
import {
  MAX_NAMESPACE_NAME_LENGTH,
  multiQueryInputSchema,
  multiQueryOutputSchema,
  namespaceMetadataSchema,
  queryInputSchema,
  queryOutputSchema,
  VectorService,
  writeInputSchema,
  writeOutputSchema,
} from '../../service/vector'

export const vectorRouter = {
  /**
   * List all namespaces from vector db.
   * Only accessible by authenticated users.
   * @returns List of namespaces
   */
  listNamespaces: noneAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/vector/namespaces',
      tags: ['vector'],
      summary: 'List all vector namespaces',
    })
    .input(
      z.object({
        prefix: z
          .string()
          .max(MAX_NAMESPACE_NAME_LENGTH)
          .optional()
          .describe('Retrieve only namespaces that match the prefix'),
        limit: z
          .int()
          .positive()
          .max(1000)
          .default(100)
          .describe('Pagination size, limit the number of results per page'),
        cursor: z
          .string()
          .optional()
          .describe(
            'Pagination cursor, pass the previously returned cursor value to retrieve the next page',
          ),
      }),
    )
    .output(
      z.object({
        namespaces: z.array(z.string()),
        hasMore: z.boolean(),
        cursor: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const service = new VectorService(context.auth.accountId)
      return await service.listNamespaces({
        prefix: input.prefix,
        limit: input.limit,
        cursor: input.cursor,
      })
    }),

  /**
   * Get namespace metadata from vector db.
   * Only accessible by authenticated users.
   * @returns Namespace metadata
   */
  getNamespace: noneAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/vector/namespaces/{namespace}',
      tags: ['vector'],
      summary: 'Get namespace metadata',
    })
    .input(
      z.object({
        namespace: z.string().max(MAX_NAMESPACE_NAME_LENGTH).describe('The namespace to get'),
      }),
    )
    .output(
      z.object({
        namespace: namespaceMetadataSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      const service = new VectorService(context.auth.accountId)
      return await service.getNamespace(input.namespace)
    }),

  /**
   * Delete a namespace from vector db.
   * Only accessible by authenticated users.
   * @returns Success status
   */
  deleteNamespace: noneAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/vector/namespaces/{namespace}',
      tags: ['vector'],
      summary: 'Delete a vector namespace',
    })
    .input(
      z.object({
        namespace: z.string().max(MAX_NAMESPACE_NAME_LENGTH).describe('The namespace to delete'),
      }),
    )
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      const service = new VectorService(context.auth.accountId)
      await service.deleteNamespace(input.namespace)
    }),

  /**
   * Query documents within a namespace.
   * Only accessible by authenticated users.
   * @returns Query results including rows, aggregations, and billing info
   */
  query: noneAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/vector/namespaces/{namespace}/query',
      tags: ['vector'],
      summary: 'Query documents within a namespace',
    })
    .input(queryInputSchema)
    .output(queryOutputSchema)
    .handler(async ({ context, input }) => {
      const { namespace, ...payload } = input
      const service = new VectorService(context.auth.accountId)
      return await service.query(namespace, payload)
    }),

  /**
   * Issue multiple concurrent queries within a namespace.
   * Only accessible by authenticated users.
   * @returns Batched query results with billing details
   */
  multiQuery: noneAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/vector/namespaces/{namespace}/multi-query',
      tags: ['vector'],
      summary: 'Run multiple queries within a namespace',
    })
    .input(multiQueryInputSchema)
    .output(multiQueryOutputSchema)
    .handler(async ({ context, input }) => {
      const { namespace, ...payload } = input
      const service = new VectorService(context.auth.accountId)
      return await service.multiQuery(namespace, payload)
    }),

  /**
   * Create, update, patch, or delete documents within a namespace.
   * Only accessible by authenticated users.
   * @returns Write operation status
   */
  write: noneAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/vector/namespaces/{namespace}',
      tags: ['vector'],
      summary: 'Creates, updates, or deletes documents within a namespace',
    })
    .input(writeInputSchema)
    .output(writeOutputSchema)
    .handler(async ({ context, input }) => {
      const { namespace, ...payload } = input
      const service = new VectorService(context.auth.accountId)
      return await service.write(namespace, payload)
    }),
}
