import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import type { AccountRole } from '@cared/auth'
import { withAuthSession } from '@cared/auth'
import { and, desc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Account, Member, User } from '@cared/db/schema'

import type { ProtectedAuth } from '../../auth'
import { formatAccount, invalidateUserAccounts } from '../../operation'
import { protectedProcedure } from '../../orpc'
import { formatInvitation } from '../../types'

async function getUserId(auth: ProtectedAuth): Promise<string> {
  if (auth.type === 'account') {
    const owner = await db.query.Member.findFirst({
      where: and(eq(Member.accountId, auth.accountId), eq(Member.role, 'owner')),
      columns: { userId: true },
    })
    if (!owner) {
      throw new ORPCError('NOT_FOUND', { message: 'Account owner not found' })
    }
    return owner.userId
  }
  if (!auth.userId) {
    throw new ORPCError('UNAUTHORIZED')
  }
  return auth.userId
}

export const accountRouter = {
  // ---- Account ----
  create: protectedProcedure
    .route({
      method: 'POST',
      path: '/accounts',
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
      const account = await withAuthSession(await getUserId(context.auth), (auth, headers) =>
        auth.api.createOrganization({
          headers,
          body: {
            name: input.name,
            slug: 'slug', // slug will be set in `organizationCreation.beforeCreate`
            // logo: input.logo,
            keepCurrentActiveOrganization: false,
          },
        }),
      )

      await invalidateUserAccounts(
        ...account.members.map((m) => m?.userId).filter((id): id is string => Boolean(id)),
      )

      return { account: formatAccount(account) }
    }),

  list: protectedProcedure
    .route({
      method: 'GET',
      path: '/accounts',
      tags: ['account'],
      summary: 'List all accounts for current user',
    })
    .handler(async ({ context }) => {
      const userId = await getUserId(context.auth)
      const accounts = await db
        .select({
          account: Account,
          role: Member.role,
        })
        .from(Account)
        .innerJoin(Member, eq(Member.accountId, Account.id))
        .where(eq(Member.userId, userId))
        .orderBy(desc(Account.createdAt))

      return {
        accounts: accounts.map(({ account, role }) => ({
          ...formatAccount(account),
          role: role as AccountRole,
        })),
      }
    }),

  get: protectedProcedure
    .route({
      method: 'GET',
      path: '/account',
      tags: ['account'],
      summary: 'Get current account details',
    })
    .handler(async ({ context }) => {
      const fullAccount = await withAuthSession(await getUserId(context.auth), (auth, headers) =>
        auth.api.getFullOrganization({
          headers,
          query: { organizationId: context.auth.accountId },
        }),
      )
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

  update: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/account',
      tags: ['account'],
      summary: 'Update current account details',
    })
    .input(
      z.object({
        name: z.string().min(1).max(128),
      }),
    )
    .handler(async ({ context, input }) => {
      const account = await withAuthSession(await getUserId(context.auth), (auth, headers) =>
        auth.api.updateOrganization({
          headers,
          body: {
            organizationId: context.auth.accountId,
            data: {
              name: input.name,
            },
          },
        }),
      )
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

  delete: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/account',
      tags: ['account'],
      summary: 'Delete current account',
    })
    .handler(async ({ context }) => {
      const accountId = context.auth.accountId
      const members = (
        await db.query.Member.findMany({
          where: eq(Member.accountId, accountId),
          columns: {
            userId: true,
          },
        })
      ).map(({ userId }) => userId)

      await withAuthSession(await getUserId(context.auth), (auth, headers) =>
        auth.api.deleteOrganization({
          headers,
          body: { organizationId: accountId },
        }),
      )

      await invalidateUserAccounts(...members)

      // TODO
    }),

  // ---- Invitations ----
  createInvitation: protectedProcedure
    .route({
      method: 'POST',
      path: '/account/invitations',
      tags: ['account'],
      summary: 'Create invitation for the current account',
    })
    .input(
      z.object({
        email: z.email(),
        teamId: z.string().min(1).optional(),
        resend: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const inv = await withAuthSession(await getUserId(context.auth), (auth, headers) =>
        auth.api.createInvitation({
          headers,
          body: {
            organizationId: context.auth.accountId,
            email: input.email,
            role: 'member',
            resend: input.resend,
            teamId: input.teamId,
          },
        }),
      )
      return { invitation: formatInvitation(inv) }
    }),

  cancelInvitation: protectedProcedure
    .route({
      method: 'POST',
      path: '/account/invitations/{invitationId}/cancel',
      tags: ['account'],
      summary: 'Cancel invitation',
    })
    .input(z.object({ invitationId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const invitation = await withAuthSession(await getUserId(context.auth), (auth, headers) =>
        auth.api.cancelInvitation({
          headers,
          body: { invitationId: input.invitationId },
        }),
      )
      if (!invitation) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to cancel invitation',
        })
      }
      return { invitation: formatInvitation(invitation) }
    }),

  getInvitation: protectedProcedure
    .route({
      method: 'GET',
      path: '/account/invitations/{invitationId}',
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
      } = await withAuthSession(await getUserId(context.auth), (auth, headers) =>
        auth.api.getInvitation({
          headers,
          query: { id: input.invitationId },
        }),
      )
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
        },
      }
    }),

  listInvitations: protectedProcedure
    .route({
      method: 'GET',
      path: '/account/invitations',
      tags: ['account'],
      summary: 'List invitations for the current account',
    })
    .handler(async ({ context }) => {
      const invitations = await withAuthSession(await getUserId(context.auth), (auth, headers) =>
        auth.api.listInvitations({
          headers,
          query: { organizationId: context.auth.accountId },
        }),
      )
      return { invitations: invitations.map(formatInvitation) }
    }),

  // ---- Members ----
  listMembers: protectedProcedure
    .route({
      method: 'GET',
      path: '/account/members',
      tags: ['account'],
      summary: 'List members for the current account',
    })
    .handler(async ({ context }) => {
      const res = await withAuthSession(await getUserId(context.auth), (auth, headers) =>
        auth.api.listMembers({
          headers,
          query: {
            organizationId: context.auth.accountId,
            sortBy: 'createdAt',
            sortDirection: 'desc',
          },
        }),
      )
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

  addMember: protectedProcedure
    .route({
      method: 'POST',
      path: '/account/members',
      tags: ['account'],
      summary: 'Add member to the current account',
    })
    .input(
      z.object({
        userId: z.string().min(1),
        role: z.enum(['admin', 'member']).default('member'),
        teamId: z.string().min(1).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      // NOTE: fix `auth.api.addMember` missing permission check
      await context.auth.requirePermissions({
        member: ['write'],
      })

      const member = await withAuthSession(await getUserId(context.auth), (auth, headers) =>
        auth.api.addMember({
          headers,
          body: {
            organizationId: context.auth.accountId,
            userId: input.userId,
            role: input.role,
            teamId: input.teamId,
          },
        }),
      )

      await invalidateUserAccounts(member.userId)

      return { member }
    }),

  removeMember: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/account/members/{memberId}',
      tags: ['account'],
      summary: 'Remove member from the current account',
    })
    .input(
      z.object({
        memberId: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      const res = await withAuthSession(await getUserId(context.auth), (auth, headers) =>
        auth.api.removeMember({
          headers,
          body: {
            organizationId: context.auth.accountId,
            memberIdOrEmail: input.memberId,
          },
        }),
      )

      await invalidateUserAccounts(res.member.userId)

      return { member: res.member }
    }),

  updateMemberRole: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/account/members/{memberId}',
      tags: ['account'],
      summary: 'Update member role',
    })
    .input(
      z.object({
        memberId: z.string().min(1),
        role: z.enum(['admin', 'member']),
      }),
    )
    .handler(async ({ context, input }) => {
      const member = await withAuthSession(await getUserId(context.auth), (auth, headers) =>
        auth.api.updateMemberRole({
          headers,
          body: {
            organizationId: context.auth.accountId,
            memberId: input.memberId,
            role: input.role,
          },
        }),
      )

      await invalidateUserAccounts(member.userId)

      return { member }
    }),

  transferOwnership: protectedProcedure
    .route({
      method: 'POST',
      path: '/account/transfer-ownership',
      tags: ['account'],
      summary: 'Transfer ownership of the current account',
    })
    .input(
      z.object({
        memberId: z.string().min(1),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = await getUserId(context.auth)
      const previousOwnerMember = await db.query.Member.findFirst({
        where: and(eq(Member.userId, userId), eq(Member.accountId, context.auth.accountId)),
      })
      if (previousOwnerMember?.role !== 'owner') {
        throw new ORPCError('FORBIDDEN', {
          message: 'You must be the owner of the account to transfer ownership',
        })
      }

      return await withAuthSession(userId, async (auth, headers) => {
        // First, update the target member's role to owner
        const newOwner = await auth.api.updateMemberRole({
          headers,
          body: {
            organizationId: context.auth.accountId,
            memberId: input.memberId,
            role: 'owner',
          },
        })

        // Then, update the current user's role to member
        const previousOwner = await auth.api.updateMemberRole({
          headers,
          body: {
            organizationId: context.auth.accountId,
            memberId: previousOwnerMember.id,
            role: 'member',
          },
        })

        await invalidateUserAccounts(newOwner.userId, previousOwner.userId)

        return {
          newOwner,
          previousOwner,
        }
      })
    }),
}
