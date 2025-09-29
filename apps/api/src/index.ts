import type { Hono } from 'hono'
import { WorkerEntrypoint } from "cloudflare:workers";

import type { Bindings } from './app'

let app: Hono<{ Bindings: Bindings }> | undefined = undefined

export default class extends WorkerEntrypoint {
  async fetch(request: Request): Promise<Response> {
    app ??= (await import('./app')).default
    return app.fetch(request, this.env, this.ctx);
  }
}
