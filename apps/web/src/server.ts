import handler from '@tanstack/react-start/server-entry'

// import { registerTelemetry } from '@cared/api'
//
// registerTelemetry()

if (
  // eslint-disable-next-line no-restricted-properties
  process.env.NODE_ENV === 'development'
) {
  // await import('@/lib/proxy')
}

export default {
  fetch(request: Request) {
    return handler.fetch(request)
  },
}
