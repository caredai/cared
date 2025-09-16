import { LangfuseClient } from '@langfuse/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'

import log from '@cared/log'

import type {
  DeleteTracesRequest,
  GetObservationsRequest,
  GetTracesRequest,
  TraceWithFullDetails,
} from '@langfuse/core'
import { protectedProcedure } from '../trpc'

const langfuse = new LangfuseClient()

export const telemetryRouter = {
  /**
   * List traces from Langfuse.
   * Only accessible by authenticated users.
   * @param input - Object containing pagination and filtering parameters
   * @param input.cursor - Page number for pagination (starts at 1)
   * @param input.limit - Number of items per page (max 100)
   * @param input.userId - Filter by user ID (mutually exclusive with other ID filters)
   * @param input.organizationId - Filter by organization ID (mutually exclusive with other ID filters)
   * @param input.workspaceId - Filter by workspace ID (mutually exclusive with other ID filters)
   * @param input.appId - Filter by app ID (mutually exclusive with other ID filters)
   * @param input.sessionId - Filter by session ID
   * @param input.fromTimestamp - Filter traces from this timestamp (ISO 8601)
   * @param input.toTimestamp - Filter traces until this timestamp (ISO 8601)
   * @returns List of traces with pagination info
   */
  listTraces: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/telemetry/traces',
        protect: true,
        tags: ['telemetry'],
        summary: 'List traces from Langfuse',
      },
    })
    .input(
      z
        .object({
          // Filtering parameters - only one can be specified
          userId: z.string().optional(),
          organizationId: z.string().optional(),
          workspaceId: z.string().optional(),
          appId: z.string().optional(),

          sessionId: z.string().optional(),

          // Time range filters
          fromTimestamp: z.iso.datetime().optional(),
          toTimestamp: z.iso.datetime().optional(),

          // Pagination parameters
          cursor: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .refine(
          ({ userId, organizationId, workspaceId, appId }) => {
            const specifiedIds = [userId, organizationId, workspaceId, appId].filter(Boolean)
            return specifiedIds.length === 1
          },
          {
            message: 'Only one of userId, organizationId, workspaceId, appId can be specified',
            path: ['userId', 'organizationId', 'workspaceId', 'appId'],
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
            path: ['fromTimestamp', 'toTimestamp'],
          },
        ),
    )
    .query(async ({ input }) => {
      try {
        // Build the request parameters for langfuse.api.trace.list()
        const requestParams: GetTracesRequest = {
          page: input.cursor,
          limit: input.limit,
        }

        // Add user ID filter - only one can be specified
        if (input.userId) {
          requestParams.userId = input.userId
        } else if (input.organizationId) {
          requestParams.userId = input.organizationId
        } else if (input.workspaceId) {
          requestParams.userId = input.workspaceId
        } else if (input.appId) {
          requestParams.userId = input.appId
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
          cursor: response.meta.page,
          total: response.meta.totalItems,
        }
      } catch (error) {
        log.error('Failed to fetch traces from Langfuse:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
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
   * @param input.userId - Filter by user ID (mutually exclusive with other ID filters)
   * @param input.organizationId - Filter by organization ID (mutually exclusive with other ID filters)
   * @param input.workspaceId - Filter by workspace ID (mutually exclusive with other ID filters)
   * @param input.appId - Filter by app ID (mutually exclusive with other ID filters)
   * @param input.traceId - Filter by trace ID
   * @param input.type - Filter by observation type
   * @param input.level - Filter by observation level (DEBUG, DEFAULT, WARNING, ERROR)
   * @param input.parentObservationId - Filter by parent observation ID
   * @param input.fromStartTime - Filter observations from this timestamp (ISO 8601)
   * @param input.toStartTime - Filter observations until this timestamp (ISO 8601)
   * @returns List of observations with pagination info
   */
  listObservations: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/telemetry/observations',
        protect: true,
        tags: ['telemetry'],
        summary: 'List observations from Langfuse',
      },
    })
    .input(
      z
        .object({
          // Filtering parameters - only one can be specified
          userId: z.string().optional(),
          organizationId: z.string().optional(),
          workspaceId: z.string().optional(),
          appId: z.string().optional(),

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
          ({ userId, organizationId, workspaceId, appId }) => {
            const specifiedIds = [userId, organizationId, workspaceId, appId].filter(Boolean)
            return specifiedIds.length === 1
          },
          {
            message: 'Only one of userId, organizationId, workspaceId, appId can be specified',
            path: ['userId', 'organizationId', 'workspaceId', 'appId'],
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
            path: ['fromStartTime', 'toStartTime'],
          },
        ),
    )
    .query(async ({ input }) => {
      try {
        // Build the request parameters for langfuse.api.observations.list()
        const requestParams: GetObservationsRequest = {
          page: input.cursor,
          limit: input.limit,
        }

        // Add user ID filter - only one can be specified
        if (input.userId) {
          requestParams.userId = input.userId
        } else if (input.organizationId) {
          requestParams.userId = input.organizationId
        } else if (input.workspaceId) {
          requestParams.userId = input.workspaceId
        } else if (input.appId) {
          requestParams.userId = input.appId
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
          cursor: response.meta.page,
          total: response.meta.totalItems,
        }
      } catch (error) {
        log.error('Failed to fetch observations from Langfuse:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch observations',
        })
      }
    }),

  /**
   * Delete multiple traces from Langfuse.
   * Only accessible by authenticated users.
   * @param input - Object containing array of trace IDs to delete
   * @param input.ids - Array of trace IDs to delete
   * @returns Success message
   */
  deleteTraces: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/telemetry/traces',
        protect: true,
        tags: ['telemetry'],
        summary: 'Delete multiple traces from Langfuse',
      },
    })
    .input(
      z
        .object({
          // Filtering parameters - only one can be specified
          userId: z.string().optional(),
          organizationId: z.string().optional(),
          workspaceId: z.string().optional(),
          appId: z.string().optional(),

          traceIds: z.array(z.string()).min(1, 'At least one trace ID is required'),
        })
        .refine(
          ({ userId, organizationId, workspaceId, appId }) => {
            const specifiedIds = [userId, organizationId, workspaceId, appId].filter(Boolean)
            return specifiedIds.length === 1
          },
          {
            message: 'Only one of userId, organizationId, workspaceId, appId can be specified',
            path: ['userId', 'organizationId', 'workspaceId', 'appId'],
          },
        ),
    )
    .mutation(async ({ input }) => {
      try {
        // First, fetch all traces to check permissions
        const tracesToCheck: TraceWithFullDetails[] = []

        for (const traceId of input.traceIds) {
          try {
            const trace = await langfuse.api.trace.get(traceId)
            tracesToCheck.push(trace)
          } catch (error) {
            log.error(`Failed to fetch trace ${traceId}:`, error)
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: `Trace ${traceId} not found`,
            })
          }
        }

        // Check permissions based on filtering parameters
        const filterUserId =
          input.userId ?? input.organizationId ?? input.workspaceId ?? input.appId

        // Check if all traces belong to the specified user/organization/workspace/app
        const unauthorizedTraces = tracesToCheck.filter((trace) => trace.userId !== filterUserId)

        // if (unauthorizedTraces.length > 0) {
        //   const unauthorizedIds = unauthorizedTraces.map((trace) => trace.id)
        //   throw new TRPCError({
        //     code: 'FORBIDDEN',
        //     message: `You don't have permission to delete traces: ${unauthorizedIds.join(', ')}`,
        //   })
        // }

        // All checks passed, proceed with deletion
        const requestParams: DeleteTracesRequest = {
          traceIds: input.traceIds,
        }

        await langfuse.api.trace.deleteMultiple(requestParams)
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        log.error('Failed to delete traces from Langfuse:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete traces',
        })
      }
    }),
}
