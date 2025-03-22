import { apiKeyClient, oidcClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import { getBaseUrl } from './server'

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    oidcClient(),
    apiKeyClient(),
  ],
})
