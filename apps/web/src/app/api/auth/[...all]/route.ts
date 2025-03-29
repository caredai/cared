import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@ownxai/auth'

export const { GET, POST } = toNextJsHandler(auth.handler)
