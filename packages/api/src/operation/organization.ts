import type { OrganizationRole } from '@cared/auth'
import { desc, eq } from '@cared/db'
import { getDb } from '@cared/db/client'
import { Member, Organization } from '@cared/db/schema'

import { Cache } from './cache'

type ReducedOrganization = Pick<Organization, 'id' | 'name' | 'slug' | 'createdAt'>

export function formatOrganization(org: ReducedOrganization) {
  const { id, name, slug, createdAt } = org
  return {
    id,
    name,
    slug,
    createdAt,
  }
}

const userOrgsCache = new Cache<
  {
    id: string
    role: OrganizationRole
  }[]
>(
  'userOrganizations',
  async (userId) => {
    const orgs = await getDb()
      .select({
        org: Organization,
        role: Member.role,
      })
      .from(Organization)
      .innerJoin(Member, eq(Member.organizationId, Organization.id))
      .where(eq(Member.userId, userId))
      .orderBy(desc(Organization.createdAt))

    return {
      value: orgs.map(({ org, role }) => ({
        id: org.id,
        role: role as OrganizationRole,
      })),
      // TODO: set short ttl since we now cannot update all the members on organization change
      ttl: 5 * 60,
    }
  },
  undefined,
)

export async function getUserOrganizations(userId: string) {
  return await userOrgsCache.getOrDefault(userId, [])
}

export async function invalidateUserOrganization(userId: string) {
  await userOrgsCache.invalidate(userId)
}
