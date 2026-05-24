import type { Context } from 'hono'
import type { BlankEnv, BlankInput } from 'hono/types'
import { Hono } from 'hono'
import { proxy } from 'hono/proxy'

import { ProtectedAuth } from '../../auth'
import { env } from '../../env'
import { langflowService } from '../../service/langflow/langflow'

export const langflow = new Hono({ strict: false })

langflow.on('GET', ['/health_check', '/health'], () =>
  Response.json({
    status: 'ok',
  }),
)

langflow.on(
  ['GET', 'POST', 'PARCH', 'DELETE'],
  [
    '/task/*',
    '/upload/*',
    '/store/*',
    '/users/*',
    '/api_key/*',
    '/login',
    '/auto_login',
    '/refresh',
    '/logout',
    '/folders',
    '/mcp',
    '/mcp/sse',
    '/mcp/streamable',
    '/registration',
    '/logs',
    '/logs-stream',
  ],
  () => new Response('Invalid request', { status: 400 }),
)

async function handler(c: Context<BlankEnv, string, BlankInput>) {
  const auth = await ProtectedAuth.authenticate(c.req.raw.headers)
  if (!auth) {
    return new Response('Unauthorized', { status: 401 })
  }

  const url = new URL(c.req.url)
  url.host = env.LANGFLOW_API_URL!
  url.pathname = '/api' + url.pathname.replace(/\/(v1|v2)\/flow/, '/$1')

  const res = await proxy(url, {
    ...c.req,
    headers: {
      ...c.req.header(),
      'X-API-KEY': langflowService.userApiKey(auth.accountId),
      Cookie: undefined,
      Authorization: undefined,
      'X-API-TOKEN': undefined,
      'X-ACCOUNT-ID': undefined,
      'X-APP-ID': undefined,
    },
  })

  res.headers.delete('Set-Cookie')

  return res
}

langflow.all('/*', handler)
