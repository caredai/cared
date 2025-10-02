import handler from '@tanstack/react-start/server-entry'

// import { setApiWorker } from '@/lib/orpc'

import { registerTelemetry } from '@cared/api/telemetry'

registerTelemetry()

if (
  // eslint-disable-next-line no-restricted-properties
  process.env.NODE_ENV === 'development'
) {
  // await import('@/lib/proxy')
}

export default {
  fetch(request: Request, env?: CloudflareEnv) {
    if (env?.API) {
      // setApiWorker(env.API)
    }

    return handler.fetch(request)
  },
}
