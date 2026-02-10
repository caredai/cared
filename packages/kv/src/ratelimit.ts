import type { IRateLimiterRedisOptions } from 'rate-limiter-flexible'
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible'

import { getRedisClient } from './redis'

export class RateLimiter extends RateLimiterRedis {
  private constructor(opts: IRateLimiterRedisOptions) {
    super(opts)
  }

  static async new(opts: {
    keyPrefix?: string
    points?: number
    duration?: number
    insuranceLimiter?: {
      points?: number
      duration?: number
    }
  }) {
    return new RateLimiter({
      storeClient: await getRedisClient(),
      useRedisPackage: true,
      keyPrefix: opts.keyPrefix,
      points: opts.points,
      duration: opts.duration,
      inMemoryBlockOnConsumed: opts.points,
      insuranceLimiter: new RateLimiterMemory({
        points: opts.insuranceLimiter?.points,
        duration: opts.insuranceLimiter?.duration,
      }),
    })
  }
}
