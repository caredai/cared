import { TRPCError } from '@trpc/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod/v4'

import type { OrganizationRole } from '@cared/auth'
import type { Invitation } from '@cared/db/schema'
import { auth, headers } from '@cared/auth'
import { Member, Organization } from '@cared/db/schema'

import { userProtectedProcedure } from '../trpc'

type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'canceled'

function formatOrganization(org: Pick<Organization, 'id' | 'name' | 'slug' | 'createdAt'>) {
  const { id, name, slug, createdAt } = org
  return {
    id,
    name,
    slug,
    createdAt,
  }
}

function formatInvitation(
  invitation: Omit<Invitation, 'status' | 'role' | 'teamId'> & {
    status: InvitationStatus
    role: OrganizationRole
    teamId?: string | null
  },
) {
  const { teamId, ...inv } = invitation
  return {
    ...inv,
    teamId: teamId ?? undefined,
  }
}

export const organizationRouter = {
  // ---- Organization ----
  create: userProtectedProcedure
    .meta({
      openapi: { method: 'POST', path: '/v1/organizations', protect: true, tags: ['organization'] },
    })
    .input(
      z.object({
        name: z.string().min(1).max(64),
        // logo: z.url().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const org = await auth.api.createOrganization({
        body: {
          name: input.name,
          slug: '', // slug will be set in `organizationCreation.beforeCreate`
          // logo: input.logo,
          keepCurrentActiveOrganization: false,
        },
      })
      if (!org) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create organization',
        })
      }

      return { organization: formatOrganization(org) }
    }),

  list: userProtectedProcedure
    .meta({
      openapi: { method: 'GET', path: '/v1/organizations', protect: true, tags: ['organization'] },
    })
    .query(async ({ ctx }) => {
      const orgs = await ctx.db
        .select({
          org: Organization,
          role: Member.role,
        })
        .from(Organization)
        .innerJoin(Member, eq(Member.organizationId, Organization.id))
        .where(eq(Member.userId, ctx.auth.userId))
        .orderBy(desc(Organization.createdAt))

      return {
        organizations: orgs.map(({ org, role }) => ({
          ...formatOrganization(org),
          role: role as OrganizationRole,
        })),
      }
    }),

  setActive: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/organizations/set-active',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(
      z.object({
        organizationId: z.string().min(1).nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      // NOTE: The method `auth.api.setActiveOrganization()` will set the session cookie.
      // However, since trpc cannot return headers here, the client must call `authClient.getSession()`
      // again with the parameter `{ disableCookieCache: true }` to refresh the session cookie.
      const org = await auth.api.setActiveOrganization({
        body: {
          organizationId: input.organizationId,
        },
      })
      if (!org && input.organizationId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set active organization',
        })
      }
    }),

  get: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/organizations/{organizationId}',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const organization = await auth.api.getFullOrganization({
        headers: await headers(),
        query: { organizationId: input.id },
      })
      if (!organization) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found' })
      }
      const { members, invitations, teams, ...org } = organization
      return {
        organization: {
          ...formatOrganization(org),
          members,
          invitations: invitations.map(formatInvitation),
          teams,
        },
      }
    }),

  update: userProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/organizations/{organizationId}',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(128),
      }),
    )
    .mutation(async ({ input }) => {
      const org = await auth.api.updateOrganization({
        headers: await headers(),
        body: {
          organizationId: input.id,
          data: {
            name: input.name,
          },
        },
      })
      if (!org) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update organization',
        })
      }
      return { organization: formatOrganization(org) }
    }),

  delete: userProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/organizations/{organizationId}',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      await auth.api.deleteOrganization({
        headers: await headers(),
        body: { organizationId: input.id },
      })
    }),

  // ---- Invitations ----
  createInvitation: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/organizations/{organizationId}/invitations',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(
      z.object({
        organizationId: z.string().min(1),
        email: z.email(),
        teamId: z.string().min(1).optional(),
        resend: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const inv = await auth.api.createInvitation({
        body: {
          organizationId: input.organizationId,
          email: input.email,
          role: 'member',
          resend: input.resend,
          teamId: input.teamId,
        },
      })
      return { invitation: formatInvitation(inv) }
    }),

  acceptInvitation: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/invitations/{invitationId}/accept',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(z.object({ invitationId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const res = await auth.api.acceptInvitation({
        body: { invitationId: input.invitationId },
      })
      if (!res) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to accept invitation',
        })
      }
      return { invitation: formatInvitation(res.invitation) }
    }),

  cancelInvitation: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/invitations/{invitationId}/cancel',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(z.object({ invitationId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const invitation = await auth.api.cancelInvitation({
        body: { invitationId: input.invitationId },
      })
      if (!invitation) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel invitation',
        })
      }
      return { invitation: formatInvitation(invitation) }
    }),

  rejectInvitation: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/invitations/{invitationId}/reject',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(z.object({ invitationId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const res = await auth.api.rejectInvitation({
        body: { invitationId: input.invitationId },
      })
      if (!res.invitation) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reject invitation',
        })
      }
      return { invitation: formatInvitation(res.invitation) }
    }),

  getInvitation: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/invitations/{invitationId}',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(z.object({ invitationId: z.string().min(1) }))
    .query(async ({ input }) => {
      const invitation = await auth.api.getInvitation({
        headers: await headers(),
        query: { id: input.invitationId },
      })
      return { invitation: formatInvitation(invitation) }
    }),

  listInvitations: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/organizations/{organizationId}/invitations',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(z.object({ organizationId: z.string().min(1) }))
    .query(async ({ input }) => {
      const invitations = await auth.api.listInvitations({
        query: { organizationId: input.organizationId },
      })
      return { invitations: invitations.map(formatInvitation) }
    }),

  listUserInvitations: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/me/invitations',
        protect: true,
        tags: ['organization'],
      },
    })
    .query(async () => {
      const invitations = await auth.api.listUserInvitations({})
      return { invitations: invitations.map(formatInvitation) }
    }),

  // ---- Members ----
  listMembers: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/organizations/{organizationId}/members',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(z.object({ organizationId: z.string().min(1) }))
    .query(async ({ input }) => {
      const res = await auth.api.listMembers({
        query: {
          organizationId: input.organizationId,
          sortBy: 'createdAt',
          sortDirection: 'desc',
        },
      })
      const owners = []
      const admins = []
      const members = []
      for (const member of res.members) {
        if (member.role === 'owner') {
          owners.push(member)
        } else if (member.role === 'admin') {
          admins.push(member)
        } else {
          members.push(member)
        }
      }
      return { members: [...owners, ...admins, ...members] }
    }),

  addMember: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/organizations/{organizationId}/members',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(
      z.object({
        organizationId: z.string().min(1),
        userId: z.string().min(1),
        role: z.enum(['admin', 'member']).default('member'),
        teamId: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.auth.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only organization admins can add members',
        })
      }

      const member = await auth.api.addMember({
        body: {
          organizationId: input.organizationId,
          userId: input.userId,
          role: input.role,
          teamId: input.teamId,
        },
      })
      if (!member) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add member to organization',
        })
      }
      return { member }
    }),

  removeMember: userProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/organizations/{organizationId}/members/{memberId}',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(
      z.object({
        organizationId: z.string().min(1),
        memberId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const res = await auth.api.removeMember({
        body: {
          organizationId: input.organizationId,
          memberIdOrEmail: input.memberId,
        },
      })
      if (!res) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove member from organization',
        })
      }
      return { member: res.member }
    }),

  updateMemberRole: userProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/organizations/{organizationId}/members/{memberId}',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(
      z.object({
        organizationId: z.string().min(1),
        memberId: z.string().min(1),
        role: z.enum(['admin', 'member']),
      }),
    )
    .mutation(async ({ input }) => {
      const member = await auth.api.updateMemberRole({
        body: { organizationId: input.organizationId, memberId: input.memberId, role: input.role },
      })
      return { member }
    }),

  leaveOrganization: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/organizations/{organizationId}/members/leave',
        protect: true,
        tags: ['organization'],
      },
    })
    .input(z.object({ organizationId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const member = await auth.api.leaveOrganization({
        headers: await headers(),
        body: { organizationId: input.organizationId },
      })
      return { member }
    }),
}
