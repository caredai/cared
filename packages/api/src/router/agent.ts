import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { and, desc, eq, gt, inArray, lt, SQL } from '@mindworld/db'
import {
  Agent,
  AgentVersion,
  CreateAgentSchema,
  CreateAgentVersionSchema,
  DRAFT_VERSION,
  UpdateAgentSchema,
} from '@mindworld/db/schema'

import type { Context } from '../trpc'
import { protectedProcedure } from '../trpc'
import { getAppById } from './app'

/**
 * Get an agent by ID.
 * @param ctx - The context object
 * @param id - The agent ID
 * @returns The agent if found
 * @throws {TRPCError} If agent not found
 */
async function getAgentById(ctx: Context, id: string) {
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
 * Get draft version of an agent.
 * @param ctx - The context object
 * @param agentId - The agent ID
 * @returns The draft version if found
 * @throws {TRPCError} If draft version not found
 */
async function getDraftVersion(ctx: Context, agentId: string) {
  const draft = await ctx.db.query.AgentVersion.findFirst({
    where: and(eq(AgentVersion.agentId, agentId), eq(AgentVersion.version, DRAFT_VERSION)),
  })

  if (!draft) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Draft version not found',
    })
  }

  return draft
}

export const agentRouter = {
  /**
   * List all agents for an app.
   * @param input - Object containing app ID and pagination parameters
   * @returns List of agents with hasMore flag
   */
  listByApp: protectedProcedure
    .input(
      z.object({
        appId: z.string().min(32),
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions: SQL<unknown>[] = [eq(Agent.appId, input.appId)]

      // Add cursor conditions
      if (input.after) {
        conditions.push(gt(Agent.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Agent.id, input.before))
      }

      const agents = await ctx.db.query.Agent.findMany({
        where: and(...conditions),
        orderBy: desc(Agent.id),
        limit: input.limit + 1,
      })

      const hasMore = agents.length > input.limit
      if (hasMore) {
        agents.pop()
      }

      return {
        agents,
        hasMore,
        limit: input.limit,
      }
    }),

  /**
   * List all agent versions for a specific app version.
   * @param input - Object containing app ID and version
   * @returns List of agent versions bound to the specified app version
   */
  listByAppVersion: protectedProcedure
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

      const agentIds = agents.map(agent => agent.id)

      const versions = await ctx.db
        .select()
        .from(AgentVersion)
        .where(
          and(
            inArray(AgentVersion.agentId, agentIds),
            eq(AgentVersion.version, input.version)
          )
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
  listVersions: protectedProcedure
    .input(
      z.object({
        agentId: z.string().min(32),
        after: z.number().optional(),
        before: z.number().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await getAgentById(ctx, input.agentId)

      const conditions: SQL<unknown>[] = [eq(AgentVersion.agentId, input.agentId)]

      // Add cursor conditions
      if (typeof input.after === 'number') {
        conditions.push(gt(AgentVersion.version, input.after))
      }
      if (typeof input.before === 'number') {
        conditions.push(lt(AgentVersion.version, input.before))
      }

      const versions = await ctx.db
        .select()
        .from(AgentVersion)
        .where(and(...conditions))
        .orderBy(desc(AgentVersion.version))
        .limit(input.limit + 1)

      const hasMore = versions.length > input.limit
      if (hasMore) {
        versions.pop()
      }

      return {
        versions,
        hasMore,
        limit: input.limit,
      }
    }),

  /**
   * Get a single agent by ID.
   * @param input - Object containing agent ID
   * @returns The agent if found
   */
  byId: protectedProcedure
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
  create: protectedProcedure.input(CreateAgentSchema).mutation(async ({ ctx, input }) => {
    // Verify app exists
    await getAppById(ctx, input.appId)

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
  update: protectedProcedure.input(UpdateAgentSchema).mutation(async ({ ctx, input }) => {
    const { id, ...update } = input

    const agent = await getAgentById(ctx, id)
    const draft = await getDraftVersion(ctx, id)

    // Merge new metadata with existing metadata
    if (update.metadata) {
      update.metadata = {
        ...draft.metadata,
        ...update.metadata,
      }
    }

    // Update only the draft version
    const [updatedDraft] = await ctx.db
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

    return {
      agent,
      draft: updatedDraft,
    }
  }),
}
