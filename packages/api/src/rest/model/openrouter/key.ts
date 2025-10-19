import type { Context } from 'hono'

import { authenticate } from '../../../auth'

export async function GET(c: Context): Promise<Response> {
  const a = await authenticate(c.req.raw.headers)
  if (!a.isAuthenticated()) {
    return new Response('Unauthorized', { status: 401 })
  }

  return Response.json({
    data: {
      label: 'sk-or-v1-abc...def',
      limit: 0,
      usage: 0,
      usage_daily: 0,
      usage_weekly: 0,
      usage_monthly: 0,
      byok_usage: 0,
      byok_usage_daily: 0,
      byok_usage_weekly: 0,
      byok_usage_monthly: 0,
      is_free_tier: false,
      is_provisioning_key: false,
      limit_remaining: 0,
      limit_reset: 'monthly',
      include_byok_in_limit: false,
      rate_limit: {
        requests: -1,
        interval: '10s',
        note: 'This field is deprecated and safe to ignore.',
      },
    },
  })
}
