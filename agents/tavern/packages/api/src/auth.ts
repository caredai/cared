import { cache } from 'react'
import { headers } from 'next/headers'
import { auth as authApi } from '@tavern/auth'

export interface Auth {
  userId: string
}

export async function auth() {
  return authWithHeaders(await headers())
}

export const authWithHeaders = cache(async (headers: Headers): Promise<Partial<Auth>> => {
  const { session } =
    (await authApi.api.getSession({
      headers,
    })) ?? {}
  return {
    userId: session?.userId,
  }
})
