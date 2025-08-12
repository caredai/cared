import { CaredClient } from '@cared/sdk'
import { eq } from '@tavern/db'
import { Account } from '@tavern/db/schema'
import AsyncLock from 'async-lock'

import type { Context } from './trpc'
import { env } from './env'

const lock = new AsyncLock()

export function createCaredClient(ctx: Context, useApiKey?: boolean) {
  return new CaredClient(
    useApiKey
      ? {
          apiKey: env.CARED_API_KEY,
        }
      : {
          accessToken: async () => {
            return await lock.acquire(ctx.auth.userId!, () => getCaredUserToken(ctx))
          },
        },
  )
}

// TODO: cache
async function getCaredUserToken(ctx: Context) {
  const account = await ctx.db.query.Account.findFirst({
    where: eq(Account.userId, ctx.auth.userId!),
  })
  if (!account || account.providerId !== 'cared') {
    throw new Error('Account not found')
  }

  let token = account.accessToken!

  // Refresh token if it's expired
  if (+account.accessTokenExpiresAt! - +new Date() < 1000 * 60) {
    const result = (await (
      await fetch(env.CARED_API_URL + '/auth/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: account.refreshToken!,
          client_id: env.CARED_CLIENT_ID,
        }),
      })
    ).json()) as any

    token = result.access_token!

    await ctx.db
      .update(Account)
      .set({
        accessToken: result.access_token,
        accessTokenExpiresAt: getDate(result.expires_in, 'sec'),
        refreshToken: result.refresh_token,
        updatedAt: new Date(),
      })
      .where(eq(Account.id, account.id))
  }

  return token
}

const getDate = (span: number, unit: 'sec' | 'ms' = 'ms') => {
  return new Date(Date.now() + (unit === 'sec' ? span * 1000 : span))
}
