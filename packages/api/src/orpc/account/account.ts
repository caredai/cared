import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import type { AccountRole } from '@cared/auth'
import type { Invitation } from '@cared/db/schema'
import { authHeaders, getAuth } from '@cared/auth'
import { desc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Account, Member, User } from '@cared/db/schema'

import { formatAccount, invalidateUserAccounts } from '../../operation'
import { userPlainProtectedProcedure, userProtectedProcedure } from '../../orpc'
import { forwardSetCookieHeader } from '../../utils'

type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'canceled'

function formatInvitation(
  invitation: Omit<Invitation, 'accountId' | 'status' | 'role' | 'teamId'> & {
    organizationId: string
    status: InvitationStatus
    role: AccountRole
    teamId?: string | null
  },
) {
  const { organizationId, teamId, ...inv } = invitation
  return {
    ...inv,
    accountId: organizationId,
    teamId: teamId ?? undefined,
  }
}

export const accountRouter = {
  // ---- Account ----
  create: userProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/accounts',
      tags: ['account'],
      summary: 'Create a new account',
    })
    .input(
      z.object({
        name: z.string().min(1).max(64),
        // logo: z.url().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const account = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.createOrganization({
        headers: authHeaders(context.headers),
        body: {
          name: input.name,
          slug: 'slug', // slug will be set in `organizationCreation.beforeCreate`
          // logo: input.logo,
          keepCurrentActiveOrganization: false,
        },
      })
      if (!account) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to create account',
        })
      }

      await invalidateUserAccounts(
        ...account.members.map((m) => m?.userId).filter((id): id is string => Boolean(id)),
      )

      return { account: formatAccount(account) }
    }),

  list: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/accounts',
      tags: ['account'],
      summary: 'List all accounts for current user',
    })
    .handler(async ({ context }) => {
      const accounts = await db
        .select({
          account: Account,
          role: Member.role,
        })
        .from(Account)
        .innerJoin(Member, eq(Member.accountId, Account.id))
        .where(eq(Member.userId, context.auth.userId))
        .orderBy(desc(Account.createdAt))

      return {
        accounts: accounts.map(({ account, role }) => ({
          ...formatAccount(account),
          role: role as AccountRole,
        })),
      }
    }),

  setActive: userPlainProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/accounts/{id}/set-active',
      tags: ['account'],
      summary: 'Set active account for current user',
    })
    .input(
      z.object({
        id: z.string().min(32).nullable(),
      }),
    )
    .handler(async ({ context, input }) => {
      const { headers: resHeaders, response: account } = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.setActiveOrganization({
        returnHeaders: true,
        headers: authHeaders(context.headers),
        body: {
          organizationId: input.id,
        },
      })
      if (!account && input.id) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to set active account',
        })
      }
      forwardSetCookieHeader(context.resHeaders, resHeaders)
    }),

  get: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/accounts/{id}',
      tags: ['account'],
      summary: 'Get account details by ID',
    })
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      const fullAccount = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.getFullOrganization({
        headers: authHeaders(context.headers),
        query: { organizationId: input.id },
      })
      if (!fullAccount) {
        throw new ORPCError('NOT_FOUND', { message: 'Account not found' })
      }
      const { members, invitations, teams, ...account } = fullAccount
      return {
        account: {
          ...formatAccount(account),
          members,
          invitations: invitations.map(formatInvitation),
          teams,
        },
      }
    }),

  update: userProtectedProcedure
    .route({
      method: 'PATCH',
      path: '/v1/accounts/{id}',
      tags: ['account'],
      summary: 'Update account details',
    })
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(128),
      }),
    )
    .handler(async ({ context, input }) => {
      const account = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.updateOrganization({
        headers: authHeaders(context.headers),
        body: {
          organizationId: input.id,
          data: {
            name: input.name,
          },
        },
      })
      if (!account) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to update account',
        })
      }

      const members = (
        await db.query.Member.findMany({
          where: eq(Member.accountId, account.id),
          columns: {
            userId: true,
          },
        })
      ).map(({ userId }) => userId)

      await invalidateUserAccounts(...members)

      return { account: formatAccount(account) }
    }),

  delete: userProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/v1/accounts/{id}',
      tags: ['account'],
      summary: 'Delete account',
    })
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      const members = (
        await db.query.Member.findMany({
          where: eq(Member.accountId, input.id),
          columns: {
            userId: true,
          },
        })
      ).map(({ userId }) => userId)

      await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.deleteOrganization({
        headers: authHeaders(context.headers),
        body: { organizationId: input.id },
      })

      await invalidateUserAccounts(...members)
    }),

  // ---- Invitations ----
  createInvitation: userProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/accounts/{accountId}/invitations',
      tags: ['account'],
      summary: 'Create invitation for account',
    })
    .input(
      z.object({
        accountId: z.string().min(32),
        email: z.email(),
        teamId: z.string().min(1).optional(),
        resend: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const inv = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.createInvitation({
        headers: authHeaders(context.headers),
        body: {
          organizationId: input.accountId,
          email: input.email,
          // @ts-ignore
          role: 'member',
          resend: input.resend,
          teamId: input.teamId,
        },
      })
      return { invitation: formatInvitation(inv as any) }
    }),

  acceptInvitation: userProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/invitations/{invitationId}/accept',
      tags: ['account'],
      summary: 'Accept invitation',
    })
    .input(z.object({ invitationId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const res = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.acceptInvitation({
        headers: authHeaders(context.headers),
        body: { invitationId: input.invitationId },
      })
      if (!res) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to accept invitation',
        })
      }

      await invalidateUserAccounts(res.member.userId)

      return { invitation: formatInvitation(res.invitation) }
    }),

  cancelInvitation: userProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/invitations/{invitationId}/cancel',
      tags: ['account'],
      summary: 'Cancel invitation',
    })
    .input(z.object({ invitationId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const invitation = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.cancelInvitation({
        headers: authHeaders(context.headers),
        body: { invitationId: input.invitationId },
      })
      if (!invitation) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to cancel invitation',
        })
      }
      return { invitation: formatInvitation(invitation) }
    }),

  rejectInvitation: userProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/invitations/{invitationId}/reject',
      tags: ['account'],
      summary: 'Reject invitation',
    })
    .input(z.object({ invitationId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const res = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.rejectInvitation({
        headers: authHeaders(context.headers),
        body: { invitationId: input.invitationId },
      })
      if (!res.invitation) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to reject invitation',
        })
      }
      return { invitation: formatInvitation(res.invitation) }
    }),

  getInvitation: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/invitations/{invitationId}',
      tags: ['account'],
      summary: 'Get invitation details',
    })
    .input(z.object({ invitationId: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const {
        organizationName,
        organizationSlug: _,
        inviterEmail,
        ...invitation
      } = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.getInvitation({
        headers: authHeaders(context.headers),
        query: { id: input.invitationId },
      })
      const inviter = await db.query.User.findFirst({
        where: eq(User.email, inviterEmail),
      })
      if (!inviter) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Inviter not found',
        })
      }
      return {
        invitation: {
          ...formatInvitation(invitation),
          accountName: organizationName,
          inviterEmail,
          inviterName: inviter.name,
        } as ReturnType<typeof formatInvitation> & {
          accountName: string
          inviterEmail: string
          inviterName: string
        },
      }
    }),

  listInvitations: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/accounts/{accountId}/invitations',
      tags: ['account'],
      summary: 'List account invitations',
    })
    .input(z.object({ accountId: z.string().min(32) }))
    .handler(async ({ context, input }) => {
      const invitations = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.listInvitations({
        headers: authHeaders(context.headers),
        query: { organizationId: input.accountId },
      })
      return { invitations: invitations.map(formatInvitation) }
    }),

  listUserInvitations: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/me/invitations',
      tags: ['account'],
      summary: 'List user invitations',
    })
    .handler(async ({ context }) => {
      const invitations = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.listUserInvitations({
        headers: authHeaders(context.headers),
      })
      return { invitations: invitations.map(formatInvitation) }
    }),

  // ---- Members ----
  listMembers: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/accounts/{accountId}/members',
      tags: ['account'],
      summary: 'List account members',
    })
    .input(z.object({ accountId: z.string().min(32) }))
    .handler(async ({ context, input }) => {
      const res = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.listMembers({
        headers: authHeaders(context.headers),
        query: {
          organizationId: input.accountId,
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
    .route({
      method: 'POST',
      path: '/v1/accounts/{accountId}/members',
      tags: ['account'],
      summary: 'Add member to account',
    })
    .input(
      z.object({
        accountId: z.string().min(32),
        userId: z.string().min(1),
        role: z.enum(['admin', 'member']).default('member'),
        teamId: z.string().min(1).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      // NOTE: fix `auth.api.addMember` missing permission check
      await context.auth.requirePermissions(
        {
          member: ['write'],
        },
        { accountId: input.accountId },
      )

      const member = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.addMember({
        headers: authHeaders(context.headers),
        body: {
          organizationId: input.accountId,
          userId: input.userId,
          // @ts-ignore
          role: input.role,
          teamId: input.teamId,
        },
      })
      if (!member) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to add member to account',
        })
      }

      await invalidateUserAccounts(member.userId)

      return { member }
    }),

  removeMember: userProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/v1/accounts/{accountId}/members/{memberId}',
      tags: ['account'],
      summary: 'Remove member from account',
    })
    .input(
      z.object({
        accountId: z.string().min(32),
        memberId: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      const res = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.removeMember({
        headers: authHeaders(context.headers),
        body: {
          organizationId: input.accountId,
          memberIdOrEmail: input.memberId,
        },
      })
      if (!res) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to remove member from account',
        })
      }

      await invalidateUserAccounts(res.member.userId)

      return { member: res.member }
    }),

  updateMemberRole: userProtectedProcedure
    .route({
      method: 'PATCH',
      path: '/v1/accounts/{accountId}/members/{memberId}',
      tags: ['account'],
      summary: 'Update member role',
    })
    .input(
      z.object({
        accountId: z.string().min(32),
        memberId: z.string().min(1),
        role: z.enum(['admin', 'member']),
      }),
    )
    .handler(async ({ context, input }) => {
      const member = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.updateMemberRole({
        headers: authHeaders(context.headers),
        body: { organizationId: input.accountId, memberId: input.memberId, role: input.role },
      })

      await invalidateUserAccounts(member.userId)

      return { member }
    }),

  transferOwnership: userProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/accounts/{accountId}/transfer-ownership',
      tags: ['account'],
      summary: 'Transfer account ownership',
    })
    .input(
      z.object({
        accountId: z.string().min(32),
        memberId: z.string().min(1),
      }),
    )
    .handler(async ({ input, context }) => {
      const previousOwnerMember = await db.query.Member.findFirst({
        where: eq(Member.userId, context.auth.userId),
      })
      if (!previousOwnerMember) {
        throw new ORPCError('FORBIDDEN', {
          message: 'You must be a member of the account to transfer ownership',
        })
      }

      // First, update the target member's role to owner
      const newOwner = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.updateMemberRole({
        headers: authHeaders(context.headers),
        body: {
          organizationId: input.accountId,
          memberId: input.memberId,
          role: 'owner',
        },
      })

      // Then, update the current user's role to member
      const previousOwner = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.updateMemberRole({
        headers: authHeaders(context.headers),
        body: {
          organizationId: input.accountId,
          memberId: previousOwnerMember.id,
          role: 'member',
        },
      })

      await invalidateUserAccounts(newOwner.userId, previousOwner.userId)

      return {
        newOwner,
        previousOwner,
      }
    }),

  leaveAccount: userProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/accounts/{accountId}/members/leave',
      tags: ['account'],
      summary: 'Leave account',
    })
    .input(z.object({ accountId: z.string().min(32) }))
    .handler(async ({ context, input }) => {
      const member = await getAuth(undefined, {
        useOriginalAccessControl: true,
      }).api.leaveOrganization({
        headers: authHeaders(context.headers),
        body: { organizationId: input.accountId },
      })

      await invalidateUserAccounts(member.userId)

      return { member }
    }),
}
