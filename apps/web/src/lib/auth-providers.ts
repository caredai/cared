import type {
  DiscordProfile,
  GithubProfile,
  GoogleProfile,
  TwitterProfile,
} from 'better-auth/social-providers'
import { socialProviders } from '@daveyplate/better-auth-ui'

import type { Account } from '@mindworld/db/schema'
import { allowedProviders as _allowedProviders } from '@mindworld/auth/client'

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

export function getAccountInfo(account: Account): { displayUsername?: string } {
  if (!account.profile) {
    return {}
  }
  const profile = JSON.parse(account.profile)
  switch (account.providerId as Provider) {
    case 'google':
      return {
        displayUsername: (profile as GoogleProfile).email,
      }
    case 'twitter':
      return {
        displayUsername: (profile as TwitterProfile['data']).username,
      }
    case 'discord':
      return {
        displayUsername: (profile as DiscordProfile).username,
      }
    case 'github':
      return {
        displayUsername: (profile as GithubProfile).login,
      }
    default:
      return {}
  }
}
