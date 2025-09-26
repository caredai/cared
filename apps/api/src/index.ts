import type { Hono } from 'hono'

let app: Hono | undefined = undefined

export default {
  async fetch(request: any, env: any, ctx: any) {
    app ??= (await import('./app')).default
    return app.fetch(request, env, ctx)
  },
}
