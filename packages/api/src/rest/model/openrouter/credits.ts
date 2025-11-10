import type { Context } from 'hono'

import { eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Credits } from '@cared/db/schema'

import { ProtectedAuth } from '../../../auth'

export async function GET(c: Context): Promise<Response> {
  const auth = await ProtectedAuth.authenticate(c.req.raw.headers)
  if (!auth) {
    return new Response('Unauthorized', { status: 401 })
  }

  const credits = await db.query.Credits.findFirst({
    where: eq(Credits.accountId, auth.ctx.accountId),
  })
  if (!credits) {
    throw new Error('Credits not found')
  }

  return Response.json({
    data: {
      total_credits: Number(credits.credits),
      total_usage: 0,
    },
  })
}
