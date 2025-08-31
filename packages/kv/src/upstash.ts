import { Redis } from '@upstash/redis'

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

  async set(key: string, value: string, expirationTtl?: number): Promise<void> {
    if (expirationTtl) {
      await this.redis.set(this.key(key), value, { ex: expirationTtl })
    } else {
      await this.redis.set(this.key(key), value)
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.key(key))
  }

  /**
   * Runs the specified script with EVALSHA using the scriptHash parameter.
   *
   * If the EVALSHA fails, loads the script to redis and runs again with the
   * hash returned from Redis.
   */
  async eval<TArgs extends unknown[], TData = unknown>(
    script: { script: string; hash: string },
    keys: string[],
    args: TArgs,
  ): Promise<TData> {
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

export async function sha1(str: string) {
  const buffer = new TextEncoder().encode(str)
  const digest = await crypto.subtle.digest('SHA-1', buffer)

  // Convert digest to hex string
  return Array.from(new Uint8Array(digest))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
}
