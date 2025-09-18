import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import type { SQL } from '@cared/db'
import { and, asc, desc, eq, gt, lt } from '@cared/db'
import { Member, Organization, User } from '@cared/db/schema'

import { adminProcedure } from '../../orpc'

export const organizationRouter = {
  /**
   * List all organizations across the platform.
   * Only accessible by admin users.
   * @param input - Pagination parameters
   * @returns List of organizations with hasMore flag
   */
  listOrganizations: adminProcedure
    .route({
      method: 'GET',
      path: '/v1/admin/organizations',
      tags: ['admin'],
      summary: 'List all organizations across the platform',
    })
    .input(
      z
        .object({
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          order: z.enum(['desc', 'asc']).default('desc'),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .handler(async ({ context, input }) => {
      const conditions: SQL<unknown>[] = []

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(Organization.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Organization.id, input.before))
      }

      const query = conditions.length > 0 ? and(...conditions) : undefined

      const organizations = await context.db.query.Organization.findMany({
        where: query,
        orderBy: input.order === 'desc' ? desc(Organization.id) : asc(Organization.id),
        limit: input.limit + 1,
      })

      const hasMore = organizations.length > input.limit
      if (hasMore) {
        organizations.pop()
      }

      // Get first and last organization IDs
      const first = organizations[0]?.id
      const last = organizations[organizations.length - 1]?.id

      return {
        organizations,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * Get a single organization by ID.
   * Only accessible by admin users.
   * @param input - The organization ID
   * @returns The organization if found
   * @throws {ORPCError} If organization not found
   */
  getOrganization: adminProcedure
    .route({
      method: 'GET',
      path: '/v1/admin/organizations/{id}',
      tags: ['admin'],
      summary: 'Get a single organization by ID',
    })
    .input(z.string().min(32))
    .handler(async ({ context, input }) => {
      const organization = await context.db.query.Organization.findFirst({
        where: eq(Organization.id, input),
      })

      if (!organization) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Organization not found',
        })
      }

      return {
        organization,
      }
    }),

  /**
   * List all members of a specific organization.
   * Only accessible by admin users.
   * @param input - Object containing organization ID and pagination parameters
   * @returns List of organization members with user details and hasMore flag
   */
  listMembers: adminProcedure
    .route({
      method: 'GET',
      path: '/v1/admin/organizations/{organizationId}/members',
      tags: ['admin'],
      summary: 'List all members of a specific organization',
    })
    .input(
      z
        .object({
          organizationId: z.string().min(32),
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          order: z.enum(['desc', 'asc']).default('desc'),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .handler(async ({ context, input }) => {
      // First verify the organization exists
      const organization = await context.db.query.Organization.findFirst({
        where: eq(Organization.id, input.organizationId),
      })

      if (!organization) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Organization not found',
        })
      }

      const conditions: SQL<unknown>[] = [eq(Member.organizationId, input.organizationId)]

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(Member.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Member.id, input.before))
      }

      const query = and(...conditions)

      // Fetch members with user details and appropriate ordering
      const members = await context.db
        .select({
          id: Member.id,
          role: Member.role,
          createdAt: Member.createdAt,
          user: User,
        })
        .from(Member)
        .innerJoin(User, eq(Member.userId, User.id))
        .where(query)
        .orderBy(input.order === 'desc' ? desc(Member.id) : asc(Member.id))
        .limit(input.limit + 1)

      const hasMore = members.length > input.limit
      if (hasMore) {
        members.pop()
      }

      // Get first and last member IDs
      const first = members[0]?.id
      const last = members[members.length - 1]?.id

      return {
        members,
        hasMore,
        first,
        last,
      }
    }),
}
