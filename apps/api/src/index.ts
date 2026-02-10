import { createServer } from 'node:https'
import { Command } from '@commander-js/extra-typings'
import { serve } from '@hono/node-server'

import { newHonoApp } from '@cared/api/hono'

const program = new Command()
  .option('-p, --port <number>', 'Listening port', parseInt, 3001)
  .option('--https-key-path <path>', 'Path to https key file')
  .option('--https-cert-path <path>', 'Path to https cert file')
const options = program.opts() // smart type

const app = newHonoApp()

const server = serve(
  {
    fetch: async (request, env): Promise<Response> => {
      return app.fetch(request, env, {
        waitUntil: (promise: Promise<unknown>) => {
          void promise
        },
        passThroughOnException() {
          // Nothing
        },
        props: undefined,
      })
    },
    port: options.port,
    ...(options.httpsCertPath &&
      options.httpsCertPath && {
        createServer,
        serverOptions: {
          key: options.httpsKeyPath,
          cert: options.httpsCertPath,
        },
      }),
  },
  (info) => {
    console.log(`Listening on :${info.port}`)
  },
)

server.on('error', (err: Error) => {
  console.error('Server error:', err)
  process.exit(1)
})

process.on('SIGINT', () => {
  server.close()
  process.exit(0)
})
process.on('SIGTERM', () => {
  server.close((err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    } else {
      process.exit(0)
    }
  })
})
