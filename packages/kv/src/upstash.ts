import { Redis } from '@upstash/redis'

import { KV } from './base'

export class UpstashKV extends KV {
  private static instance?: Redis

  private client: Redis

  constructor(namespace: string) {
    super(namespace)

    if (!UpstashKV.instance) {
      UpstashKV.instance = Redis.fromEnv({
        automaticDeserialization: false,
      })
    }

    this.client = UpstashKV.instance
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get<string>(this.key(key))
  }

  async set(key: string, value: string, expirationTtl?: number): Promise<void> {
    if (expirationTtl) {
      await this.client.set(this.key(key), value, { ex: expirationTtl })
    } else {
      await this.client.set(this.key(key), value)
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(this.key(key))
  }
}
