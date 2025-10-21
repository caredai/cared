import { asc, eq } from '@cared/db'
import { getDb } from '@cared/db/client'
import { User } from '@cared/db/schema'

import { Cache } from './cache'

const cache = new Cache<string[]>('adminUsers', async () => ({
  value: await getDb()
    .query.User.findMany({
      columns: {
        id: true,
      },
      where: eq(User.role, 'admin'),
      orderBy: asc(User.id),
    })
    .then((ids) => ids.map(({ id }) => id)),
}))

const ADMIN_USERS_KEY = 'all'

export async function invalidateAdminUsers() {
  await cache.invalidate(ADMIN_USERS_KEY)
}

export async function getAdminUsers() {
  return (await cache.get(ADMIN_USERS_KEY))!
}

export async function isAdminUser(userId: string) {
  const adminUsers = await getAdminUsers()
  return adminUsers.includes(userId)
}
