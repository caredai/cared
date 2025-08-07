import { HelioSDK } from '@heliofi/sdk'

import { env } from './env'

export function getHelio() {
  if (!env.HELIO_PUBLIC_API_KEY || !env.HELIO_SECRET_API_KEY) {
    throw new Error('Helio API keys are not set')
  }
  return new HelioSDK({
    apiKey: env.HELIO_PUBLIC_API_KEY,
    secretKey: env.HELIO_SECRET_API_KEY,
    network: 'mainnet',
  })
}
