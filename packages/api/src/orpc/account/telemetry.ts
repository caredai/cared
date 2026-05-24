import { LangfuseClient } from '@langfuse/client'
import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import log from '@cared/log'

import type {
  DeleteTracesRequest,
  GetObservationsRequest,
  GetTracesRequest,
  TraceWithFullDetails,
} from '@langfuse/core'
import { protectedProcedure } from '../../orpc'

const langfuse = new LangfuseClient()

export const telemetryRouter = {
  /**
   * List traces from Langfuse.
   * Only accessible by authenticated users.
   * @param input - Object containing pagination and filtering parameters
   * @param input.cursor - Page number for pagination (starts at 1)
   * @param input.limit - Number of items per page (max 100)
   * @param input.scope - Scope of the query (user or account)
   * @param input.userId - Filter by user ID (mutually exclusive with other ID filters)
   * @param input.accountId - Filter by accountId ID (mutually exclusive with other ID filters)
   * @param input.sessionId - Filter by session ID
   * @param input.fromTimestamp - Filter traces from this timestamp (ISO 8601)
   * @param input.toTimestamp - Filter traces until this timestamp (ISO 8601)
   * @returns List of traces with pagination info
   */
  listTraces: protectedProcedure
    .route({
      method: 'GET',
      path: '/telemetry/traces',
      tags: ['telemetry'],
      summary: 'List traces from Langfuse',
    })
    .input(
      z
        .object({
          scope: z.enum(['user', 'account']).default('user'),
          userId: z.string().optional(),

          sessionId: z.string().optional(),

          // Time range filters
          fromTimestamp: z.iso.datetime().optional(),
          toTimestamp: z.iso.datetime().optional(),

          // Pagination parameters
          cursor: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .refine(
          ({ userId, scope }) => {
            return !userId || scope === 'user'
          },
          {
            message: 'userId can only be specified if scope is user',
            path: ['userId'],
          },
        )
        .refine(
          ({ fromTimestamp, toTimestamp }) => {
            if (fromTimestamp && toTimestamp) {
              return new Date(fromTimestamp) < new Date(toTimestamp)
            }
            return true
          },
          {
            message: 'fromTimestamp must be before toTimestamp',
            path: ['fromTimestamp'],
          },
        ),
    )
    .handler(async ({ context, input }) => {
      try {
        // Build the request parameters for langfuse.api.trace.list()
        const requestParams: GetTracesRequest = {
          page: input.cursor,
          limit: input.limit,
        }

        const authUserId = 'userId' in context.auth.ctx ? context.auth.ctx.userId : undefined

        // Add user ID filter
        let isSelfAccess = false
        if (input.scope === 'user') {
          const userId = input.userId ?? authUserId
          if (!userId) {
            throw new ORPCError('BAD_REQUEST')
          }
          requestParams.userId = `${context.auth.accountId}:${userId}`
          isSelfAccess = userId === authUserId
        } else {
          requestParams.userId = context.auth.accountId
        }

        if (!isSelfAccess) {
          await context.auth.requirePermissions(
            { pseudo: [] },
            {
              roles: ['owner', 'admin'],
            },
          )
        }

        // Add optional filters
        if (input.sessionId) requestParams.sessionId = input.sessionId
        if (input.fromTimestamp) requestParams.fromTimestamp = input.fromTimestamp
        if (input.toTimestamp) requestParams.toTimestamp = input.toTimestamp

        // Call langfuse API
        const response = await langfuse.api.trace.list(requestParams)

        return {
          traces: response.data,
          hasMore: response.meta.page < response.meta.totalPages,
          cursor:
            response.meta.page < response.meta.totalPages ? response.meta.page + 1 : undefined,
          total: response.meta.totalItems,
        }
      } catch (error) {
        if (error instanceof ORPCError) {
          throw error
        }

        log.error('Failed to fetch traces from Langfuse:', error)
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to fetch traces',
        })
      }
    }),

  /**
   * List observations from Langfuse.
   * Only accessible by authenticated users.
   * @param input - Object containing pagination and filtering parameters
   * @param input.cursor - Page number for pagination (starts at 1)
   * @param input.limit - Number of items per page (max 100)
   * @param input.scope - Scope of the query (user or account)
   * @param input.userId - Filter by user ID (only valid when scope is 'user')
   * @param input.traceId - Filter by trace ID
   * @param input.type - Filter by observation type
   * @param input.level - Filter by observation level (DEBUG, DEFAULT, WARNING, ERROR)
   * @param input.parentObservationId - Filter by parent observation ID
   * @param input.fromStartTime - Filter observations from this timestamp (ISO 8601)
   * @param input.toStartTime - Filter observations until this timestamp (ISO 8601)
   * @returns List of observations with pagination info
   */
  listObservations: protectedProcedure
    .route({
      method: 'GET',
      path: '/telemetry/observations',
      tags: ['telemetry'],
      summary: 'List observations from Langfuse',
    })
    .input(
      z
        .object({
          scope: z.enum(['user', 'account']).default('user'),
          userId: z.string().optional(),

          traceId: z.string().optional(),

          type: z.string().optional(),
          level: z.enum(['DEBUG', 'DEFAULT', 'WARNING', 'ERROR']).optional(),
          parentObservationId: z.string().optional(),

          // Time range filters
          fromStartTime: z.iso.datetime().optional(),
          toStartTime: z.iso.datetime().optional(),

          // Pagination parameters
          cursor: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .refine(
          ({ userId, scope }) => {
            return !userId || scope === 'user'
          },
          {
            message: 'userId can only be specified if scope is user',
            path: ['userId'],
          },
        )
        .refine(
          ({ fromStartTime, toStartTime }) => {
            if (fromStartTime && toStartTime) {
              return new Date(fromStartTime) < new Date(toStartTime)
            }
            return true
          },
          {
            message: 'fromStartTime must be before toStartTime',
            path: ['fromStartTime'],
          },
        ),
    )
    .handler(async ({ context, input }) => {
      try {
        // Build the request parameters for langfuse.api.observations.list()
        const requestParams: GetObservationsRequest = {
          page: input.cursor,
          limit: input.limit,
        }

        const authUserId = 'userId' in context.auth.ctx ? context.auth.ctx.userId : undefined

        // Add user ID filter
        let isSelfAccess = false
        if (input.scope === 'user') {
          const userId = input.userId ?? authUserId
          if (!userId) {
            throw new ORPCError('BAD_REQUEST')
          }
          requestParams.userId = `${context.auth.accountId}:${userId}`
          isSelfAccess = userId === authUserId
        } else {
          requestParams.userId = context.auth.accountId
        }

        if (!isSelfAccess) {
          await context.auth.requirePermissions(
            { pseudo: [] },
            {
              roles: ['owner', 'admin'],
            },
          )
        }

        // Add optional filters
        if (input.traceId) requestParams.traceId = input.traceId
        if (input.type) requestParams.type = input.type
        if (input.level) requestParams.level = input.level
        if (input.parentObservationId) requestParams.parentObservationId = input.parentObservationId
        if (input.fromStartTime) requestParams.fromStartTime = input.fromStartTime
        if (input.toStartTime) requestParams.toStartTime = input.toStartTime

        // Call langfuse API
        const response = await langfuse.api.observations.getMany(requestParams)

        return {
          observations: response.data,
          hasMore: response.meta.page < response.meta.totalPages,
          cursor:
            response.meta.page < response.meta.totalPages ? response.meta.page + 1 : undefined,
          total: response.meta.totalItems,
        }
      } catch (error) {
        if (error instanceof ORPCError) {
          throw error
        }

        log.error('Failed to fetch observations from Langfuse:', error)
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to fetch observations',
        })
      }
    }),

  /**
   * Delete multiple traces from Langfuse.
   * Only accessible by authenticated users.
   * @param input - Object containing array of trace IDs to delete
   * @param input.traceIds - Array of trace IDs to delete
   * @param input.scope - Scope of the deletion (user or account)
   * @param input.userId - Filter by user ID (only valid when scope is 'user')
   * @returns Success message
   */
  deleteTraces: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/telemetry/traces',
      tags: ['telemetry'],
      summary: 'Delete multiple traces from Langfuse',
    })
    .input(
      z
        .object({
          scope: z.enum(['user', 'account']).default('user'),
          userId: z.string().optional(),

          traceIds: z.array(z.string()).min(1, 'At least one trace ID is required'),
        })
        .refine(
          ({ userId, scope }) => {
            return !userId || scope === 'user'
          },
          {
            message: 'userId can only be specified if scope is user',
            path: ['userId'],
          },
        ),
    )
    .handler(async ({ context, input }) => {
      try {
        const authUserId = 'userId' in context.auth.ctx ? context.auth.ctx.userId : undefined

        // Determine the filter user ID
        let filterUserId: string | undefined
        let isSelfAccess = false
        if (input.scope === 'user') {
          const userId = input.userId ?? authUserId
          if (!userId) {
            throw new ORPCError('BAD_REQUEST')
          }
          filterUserId = `${context.auth.accountId}:${userId}`
          isSelfAccess = userId === authUserId
        } else {
          filterUserId = context.auth.accountId
        }

        // Check permissions if accessing other user's data
        if (!isSelfAccess) {
          await context.auth.requirePermissions(
            { pseudo: [] },
            {
              roles: ['owner', 'admin'],
            },
          )
        }

        // First, fetch all traces to check permissions
        const tracesToCheck: TraceWithFullDetails[] = []

        for (const traceId of input.traceIds) {
          try {
            const trace = await langfuse.api.trace.get(traceId)
            tracesToCheck.push(trace)
          } catch (error) {
            log.error(`Failed to fetch trace ${traceId}:`, error)
            throw new ORPCError('NOT_FOUND', {
              message: `Trace ${traceId} not found`,
            })
          }
        }

        // Check if all traces belong to the specified user/account
        const unauthorizedTraces = tracesToCheck.filter((trace) => trace.userId !== filterUserId)

        if (unauthorizedTraces.length > 0) {
          const unauthorizedIds = unauthorizedTraces.map((trace) => trace.id)
          throw new ORPCError('FORBIDDEN', {
            message: `You don't have permission to delete traces: ${unauthorizedIds.join(', ')}`,
          })
        }

        // All checks passed, proceed with deletion
        const requestParams: DeleteTracesRequest = {
          traceIds: input.traceIds,
        }

        await langfuse.api.trace.deleteMultiple(requestParams)
      } catch (error) {
        if (error instanceof ORPCError) {
          throw error
        }

        log.error('Failed to delete traces from Langfuse:', error)
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to delete traces',
        })
      }
    }),
}
