import { LangfuseClient } from '@langfuse/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'

import log from '@cared/log'

import type { GetTracesRequest } from '@langfuse/core'
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
            return specifiedIds.length <= 1
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
}
