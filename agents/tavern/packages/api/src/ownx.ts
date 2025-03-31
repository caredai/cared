import { eq } from '@tavern/db'
import { Account } from '@tavern/db/schema'

import { createOwnxTrpcClientWithApiKey, createOwnxTrpcClientWithUserToken } from '@ownxai/sdk'

import type { Context } from './trpc'
import { env } from './env'

export const ownx = createOwnxTrpcClientWithApiKey(env.OWNX_API_KEY)

export async function ownxForUser(ctx: Context) {
  const token = await getTokenForOwnx(ctx)
  return createOwnxTrpcClientWithUserToken(token)
}

async function getTokenForOwnx(ctx: Context) {
  const account = await ctx.db.query.Account.findFirst({
    where: eq(Account.userId, ctx.auth.userId),
  })
  if (!account || account.providerId !== 'ownx') {
    throw new Error('Account not found')
  }

  let token = account.accessToken!

  // Refresh token if it's expired
  if (+account.accessTokenExpiresAt! - +new Date() < 1000 * 60) {
    const result = (await (
      await fetch(env.OWNX_API_URL + '/auth/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: account.refreshToken!,
          client_id: env.OWNX_CLIENT_ID,
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
