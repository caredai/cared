import type { AccountRole } from '@cared/auth'
import type { Invitation as DbInvitation } from '@cared/db/schema'

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'canceled'

export interface Invitation {
  id: string
  accountId: string
  email: string
  role: AccountRole
  status: InvitationStatus
  expiresAt: Date
  inviterId: string
  teamId?: string
}

export function formatInvitation(
  invitation: Omit<DbInvitation, 'accountId' | 'status' | 'role' | 'teamId'> & {
    organizationId: string
    status: InvitationStatus
    role: AccountRole
    teamId?: string | null
  },
): Invitation {
  const { organizationId, teamId, ...inv } = invitation
  return {
    ...inv,
    accountId: organizationId,
    teamId: teamId ?? undefined,
  }
}
