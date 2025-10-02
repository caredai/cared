// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Hono } from 'hono'
import { WorkerEntrypoint } from 'cloudflare:workers'

import type { HonoApp } from '@cared/api/hono'

let app: HonoApp | undefined = undefined

export default class extends WorkerEntrypoint {
  async fetch(request: Request): Promise<Response> {
    if (!app) {
      app = (await import('@cared/api/hono')).newHonoApp()

      const { checkRestrictedColo, checkRestrictedColoHandler, innerCheckPath } = await import(
        './colo'
      )

      app.use(async (c, next) => {
        if (new URL(c.req.url).pathname !== innerCheckPath) {
          await checkRestrictedColo()
        }

        await next()
      })

      app.get(innerCheckPath, (c) => c.json(checkRestrictedColoHandler(c.req.raw.headers)))
    }

    return app.fetch(request, this.env, this.ctx)
  }
}
