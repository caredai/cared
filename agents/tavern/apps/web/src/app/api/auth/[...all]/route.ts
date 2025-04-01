import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@tavern/auth'

export const { GET, POST } = toNextJsHandler(auth.handler)
