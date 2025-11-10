import type { AccountRole } from '@cared/auth'
import { asc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Account, Member } from '@cared/db/schema'

import { Cache } from './cache'

type ReducedAccount = Pick<Account, 'id' | 'name' | 'slug' | 'createdAt'>

export function formatAccount(account: ReducedAccount) {
  const { id, name, createdAt } = account
  return {
    id,
    name,
    createdAt,
  }
}

const userAccountsCache = new Cache<
  {
    id: string
    role: AccountRole
  }[]
>(
  'userAccounts',
  async (userId) => {
    const accounts = await db
      .select({
        account: Account,
        role: Member.role,
      })
      .from(Account)
      .innerJoin(Member, eq(Member.accountId, Account.id))
      .where(eq(Member.userId, userId))
      .orderBy(asc(Account.id))

    return {
      value: accounts.map(({ account, role }) => ({
        id: account.id,
        role: role as AccountRole,
      })),
      // ttl: 5 * 60,
    }
  },
  // undefined,
)

export async function getUserAccounts(userId: string, forceFetch = false) {
  return await userAccountsCache.getOrDefault(userId, [], forceFetch)
}

export async function invalidateUserAccounts(...userIds: string[]) {
  await userAccountsCache.batchInvalidate(...userIds)
}
