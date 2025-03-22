import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@mindworld/auth'

export const { GET, POST } = toNextJsHandler(auth.handler)
