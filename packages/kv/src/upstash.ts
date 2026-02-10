import { Redis } from '@upstash/redis'

import type { SetCommandOptions } from '@upstash/redis'
import { KV } from './base'

export class UpstashKV extends KV {
  public static instance?: Redis

  public redis: Redis

  constructor(namespace: string) {
    super(namespace)

    UpstashKV.instance ??= Redis.fromEnv({
      automaticDeserialization: false,
      enableAutoPipelining: true,
      readYourWrites: true,
    })

    this.redis = UpstashKV.instance
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get<string>(this.key(key))
  }

  async getex(
    key: string,
    opts: {
      ex?: number
      px?: number
      exat?: number
      pxat?: number
      persist?: boolean
    },
  ): Promise<string | null> {
    return await this.redis.getex<string>(this.key(key), opts as any)
  }

  async set(
    key: string,
    value: string,
    opts?:
      | {
          ex?: number
          px?: number
          exat?: number
          pxat?: number
          nx?: true
          xx?: true
          keepTtl?: true
        }
      | number,
  ): Promise<void> {
    await this.redis.set(
      this.key(key),
      value,
      typeof opts === 'number' ? { ex: opts } : (opts as SetCommandOptions),
    )
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.key(key))
  }

  async batchDelete(...keys: string[]): Promise<void> {
    await this.redis.del(...keys.map((key) => this.key(key)))
  }

  /**
   * Runs the specified script with EVALSHA using the scriptHash parameter.
   *
   * If the EVALSHA fails, loads the script to redis and runs again with the
   * hash returned from Redis.
   */
  async eval(
    script: { script: string; hash: string },
    keys: string[],
    args: string[],
  ): Promise<unknown> {
    keys = keys.map((k) => this.key(k))

    try {
      return await this.redis.evalsha(script.hash, keys, args)
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      if (`${error}`.includes('NOSCRIPT')) {
        return await this.redis.eval(script.script, keys, args)
      }
      throw error
    }
  }
}


