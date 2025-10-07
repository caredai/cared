// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Hono } from 'hono'
import { waitUntil } from '@vercel/functions'

import { newHonoApp } from '@cared/api/hono'

const app = newHonoApp()

// Create a proxy wrapper for the app to intercept fetch method
const proxiedApp = new Proxy(app, {
  get(target, prop, receiver) {
    // Intercept the fetch method
    if (prop === 'fetch') {
      return function (request: Request) {
        // Call the original fetch method
        return target.fetch(
          request,
          {},
          {
            waitUntil,
            passThroughOnException() {
              // Nothing
            },
            props: undefined,
          },
        )
      }
    }

    // For all other properties, return the original value
    return Reflect.get(target, prop, receiver)
  },
})

export default proxiedApp
