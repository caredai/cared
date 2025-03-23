import { createAuthHooks } from '@daveyplate/better-auth-tanstack'
import { socialProviders } from '@daveyplate/better-auth-ui'

import { allowedProviders as _allowedProviders, authClient } from '@mindworld/auth/client'

export const {
  useSession,
  usePrefetchSession,
  useToken,
  useListAccounts,
  useListSessions,
  useListPasskeys,
} = createAuthHooks(authClient)

export const allowedProviders = _allowedProviders
  .map((provider) => socialProviders.find((p) => p.provider === provider)!)
  .map((provider) => {
    if (provider.name === 'X') {
      return {
        ...provider,
        name: 'Twitter',
      }
    }
    return provider
  })

export type Provider = (typeof socialProviders)[number]['provider']
