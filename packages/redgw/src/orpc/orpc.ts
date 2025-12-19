import { os } from '@orpc/server'

import type { ResponseHeadersPluginContext } from '@orpc/server/plugins'
import { env } from '../env.js'

export interface Context extends ResponseHeadersPluginContext {
  headers: Headers
}

const apiKey = env.API_KEY

export const createORPCContext = ({ headers }: { headers: Headers }) => {
  const bearerToken = headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!bearerToken || !apiKey || bearerToken !== apiKey) {
    throw new Error('Invalid API key')
  }

  return {
    headers,
  }
}

export const procedure = os.$context<Context>()
