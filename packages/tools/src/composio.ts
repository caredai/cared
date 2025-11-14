import { Composio } from '@composio/core'
import { VercelProvider } from '@composio/vercel'

import type ComposioClient from '@composio/client'
import { env } from './env'

let composio: CustomComposio | undefined

export function getComposio() {
  composio ??= new CustomComposio({
    apiKey: env.COMPOSIO_API_KEY,
    provider: new VercelProvider(),
  })

  return composio
}

export class CustomComposio extends Composio<VercelProvider> {
  getClient(): ComposioClient {
    return this.client
  }
}
