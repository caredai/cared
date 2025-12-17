import type { Api } from 'lago-javascript-client'
import { ORPCError } from '@orpc/server'
import { Client } from 'lago-javascript-client'

import { env } from '../env'

let lago: Api<unknown> | undefined

export function getLago() {
  if (!lago) {
    if (!env.LAGO_API_KEY) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Lago api key is not set',
      })
    }
    if (!env.LAGO_API_URL) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Lago api url is not set',
      })
    }
    lago = Client(env.LAGO_API_KEY, { baseUrl: env.LAGO_API_URL })
  }

  return lago
}
