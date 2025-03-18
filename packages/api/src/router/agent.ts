import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { SQL } from '@mindworld/db'
import { and, count, desc, eq, gt, inArray, lt } from '@mindworld/db'
import {
  Agent,
  AgentVersion,
  CreateAgentSchema,
  CreateAgentVersionSchema,
  DRAFT_VERSION,
  UpdateAgentSchema,
} from '@mindworld/db/schema'

import type { Context } from '../trpc'
import { cfg } from '../config'
import { userProtectedProcedure } from '../trpc'
import { getAppById } from './app'

/**
 * Get an agent by ID.
 * @param ctx - The context object
 * @param id - The agent ID
 * @returns The agent if found
 * @throws {TRPCError} If agent not found
 */
export async function getAgentById(ctx: Context, id: string) {
  const result = await ctx.db.query.Agent.findFirst({
    where: eq(Agent.id, id),
  })

  if (!result) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Agent with id ${id} not found`,
    })
  }

  return result
}

/**
 * Get an agent version by agent ID and version.
 * @param ctx - The context object
 * @param agentId - The agent ID
 * @param version - The version number or 'latest' or 'draft'
 * @returns The agent version if found
 * @throws {TRPCError} If agent version not found
 */
export async function getAgentVersion(
  ctx: Context,
  agentId: string,
  version?: number | 'latest' | 'draft',
) {
  let agentVersion

  if (!version) {
    version = 'latest'
  }

  if (version === 'draft') {
    agentVersion = await ctx.db.query.AgentVersion.findFirst({
      where: and(eq(AgentVersion.agentId, agentId), eq(AgentVersion.version, DRAFT_VERSION)),
    })
  } else if (version === 'latest') {
    agentVersion = await ctx.db.query.AgentVersion.findFirst({
      where: and(
        eq(AgentVersion.agentId, agentId),
        lt(AgentVersion.version, DRAFT_VERSION), // Exclude draft version
      ),
      orderBy: desc(AgentVersion.version),
    })
  } else {
    agentVersion = await ctx.db.query.AgentVersion.findFirst({
      where: and(eq(AgentVersion.agentId, agentId), eq(AgentVersion.version, version)),
    })
  }

  if (!agentVersion) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Agent version '${version}' not found for agent ${agentId}`,
    })
  }

  return agentVersion
}

export const agentRouter = {
  /**
   * List all agents for an app.
   * @param input - Object containing app ID and pagination parameters
   * @returns List of agents with hasMore flag
   */
  listByApp: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/agents',
        protect: true,
        tags: ['agents'],
        summary: 'List all agents for an app',
      },
    })
    .input(
      z
        .object({
          appId: z.string().min(32),
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .query(async ({ ctx, input }) => {
      const conditions: SQL<unknown>[] = [eq(Agent.appId, input.appId)]

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(Agent.id, input.after))
      } else if (input.before) {
        conditions.push(lt(Agent.id, input.before))
      }

      const query = and(...conditions)

      // Determine if this is backward pagination
      const isBackwardPagination = !!input.before

      // Fetch agents with appropriate ordering
      let agents
      if (isBackwardPagination) {
        agents = await ctx.db.query.Agent.findMany({
          where: query,
          orderBy: Agent.id, // Ascending order
          limit: input.limit + 1,
        })
      } else {
        agents = await ctx.db.query.Agent.findMany({
          where: query,
          orderBy: desc(Agent.id), // Descending order
          limit: input.limit + 1,
        })
      }

      const hasMore = agents.length > input.limit
      if (hasMore) {
        agents.pop()
      }

      // Reverse results for backward pagination to maintain consistent ordering
      agents = isBackwardPagination ? agents.reverse() : agents

      // Get first and last agent IDs
      const first = agents[0]?.id
      const last = agents[agents.length - 1]?.id

      return {
        agents,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * List all agent versions for a specific app version.
   * @param input - Object containing app ID and version
   * @returns List of agent versions bound to the specified app version
   */
  listByAppVersion: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/agents/by-app-version',
        protect: true,
        tags: ['agents'],
        summary: 'List all agent versions for a specific app version',
      },
    })
    .input(
      z.object({
        appId: z.string().min(32),
        version: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify app exists
      await getAppById(ctx, input.appId)

      const agents = await ctx.db.query.Agent.findMany({
        where: eq(Agent.appId, input.appId),
      })

      const agentIds = agents.map((agent) => agent.id)

      const versions = await ctx.db
        .select()
        .from(AgentVersion)
        .where(
          and(inArray(AgentVersion.agentId, agentIds), eq(AgentVersion.version, input.version)),
        )
        .orderBy(AgentVersion.agentId)

      return {
        versions,
      }
    }),

  /**
   * List all versions of an agent.
   * @param input - Object containing agent ID and pagination parameters
   * @returns List of agent versions sorted by version number
   */
  listVersions: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/agents/{agentId}/versions',
        protect: true,
        tags: ['agents'],
        summary: 'List all versions of an agent',
      },
    })
    .input(
      z
        .object({
          agentId: z.string().min(32),
          after: z.number().optional(),
          before: z.number().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .query(async ({ ctx, input }) => {
      await getAgentById(ctx, input.agentId)

      const conditions: SQL<unknown>[] = [eq(AgentVersion.agentId, input.agentId)]

      // Add cursor conditions based on pagination direction
      if (typeof input.after === 'number') {
        conditions.push(gt(AgentVersion.version, input.after))
      } else if (typeof input.before === 'number') {
        conditions.push(lt(AgentVersion.version, input.before))
      }

      const query = and(...conditions)

      // Determine if this is backward pagination
      const isBackwardPagination = !!input.before

      // Fetch versions with appropriate ordering
      let versions
      if (isBackwardPagination) {
        versions = await ctx.db
          .select()
          .from(AgentVersion)
          .where(query)
          .orderBy(AgentVersion.version) // Ascending order
          .limit(input.limit + 1)
      } else {
        versions = await ctx.db
          .select()
          .from(AgentVersion)
          .where(query)
          .orderBy(desc(AgentVersion.version)) // Descending order
          .limit(input.limit + 1)
      }

      const hasMore = versions.length > input.limit
      if (hasMore) {
        versions.pop()
      }

      // Reverse results for backward pagination to maintain consistent ordering
      versions = isBackwardPagination ? versions.reverse() : versions

      // Get first and last version numbers
      const first = versions[0]?.version
      const last = versions[versions.length - 1]?.version

      return {
        versions,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * Get a single agent by ID.
   * @param input - The agent ID
   * @returns The agent if found
   */
  byId: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/agents/{id}',
        protect: true,
        tags: ['agents'],
        summary: 'Get a single agent by ID',
      },
    })
    .input(
      z.object({
        id: z.string().min(32),
      }),
    )
    .query(async ({ ctx, input }) => {
      const agent = await getAgentById(ctx, input.id)
      return { agent }
    }),

  /**
   * Create a new agent for an app.
   * @param input - The agent data following the {@link CreateAgentSchema}
   * @returns The created agent and its draft version
   */
  create: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/agents',
        protect: true,
        tags: ['agents'],
        summary: 'Create a new agent for an app',
      },
    })
    .input(CreateAgentSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify app exists
      await getAppById(ctx, input.appId)

      // Check if the app has reached its agent limit
      const agentCount = await ctx.db
        .select({ count: count() })
        .from(Agent)
        .where(eq(Agent.appId, input.appId))
        .then((r) => r[0]!.count)

      if (agentCount >= cfg.perApp.maxAgents) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `App has reached the maximum limit of ${cfg.perApp.maxAgents} agents`,
        })
      }

      return ctx.db.transaction(async (tx) => {
        const [agent] = await tx.insert(Agent).values(input).returning()

        if (!agent) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create agent',
          })
        }

        const [draft] = await tx
          .insert(AgentVersion)
          .values(
            CreateAgentVersionSchema.parse({
              agentId: agent.id,
              version: DRAFT_VERSION,
              name: input.name,
              metadata: input.metadata,
            }),
          )
          .returning()

        if (!draft) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create draft version',
          })
        }

        return {
          agent,
          draft,
        }
      })
    }),

  /**
   * Update an existing agent.
   * Only updates the draft version.
   * @param input - The agent data following the {@link UpdateAgentSchema}
   * @returns The updated agent and its draft version
   */
  update: userProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/agents/{id}',
        protect: true,
        tags: ['agents'],
        summary: 'Update an existing agent',
      },
    })
    .input(UpdateAgentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...update } = input

      const agent = await getAgentById(ctx, id)
      const draft = await getAgentVersion(ctx, id, 'draft')
      // Check if there's any published version
      const publishedVersion = await getAgentVersion(ctx, id, 'latest').catch(() => undefined)

      // Merge new metadata with existing metadata
      if (update.metadata) {
        update.metadata = {
          ...draft.metadata,
          ...update.metadata,
        }
      }

      return ctx.db.transaction(async (tx) => {
        // Update draft version
        const [updatedDraft] = await tx
          .update(AgentVersion)
          .set(update)
          .where(and(eq(AgentVersion.agentId, id), eq(AgentVersion.version, DRAFT_VERSION)))
          .returning()

        if (!updatedDraft) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update draft version',
          })
        }

        // If no published version exists, update the agent's main record as well
        let updatedAgent = agent
        if (!publishedVersion) {
          const [newAgent] = await tx.update(Agent).set(update).where(eq(Agent.id, id)).returning()

          if (!newAgent) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to update agent',
            })
          }
          updatedAgent = newAgent
        }

        return {
          agent: updatedAgent,
          draft: updatedDraft,
        }
      })
    }),
}
