import { CloudflareKV } from './cloudflare'
import { RedisKV } from './redis'
import { UpstashKV } from './upstash'

export * from './base'
export * from './redis'
export * from './cloudflare'
export * from './upstash'
export * from './ratelimit'

export function getKV<K extends 'redis' | 'upstash' | 'cloudflare' = 'redis'>(
  namespace: string,
  // @ts-ignore
  kind: K = 'redis',
): K extends 'redis' ? RedisKV : K extends 'upstash' ? UpstashKV : CloudflareKV {
  switch (kind) {
    case 'redis':
      return new RedisKV(namespace) as any
    case 'upstash':
      return new UpstashKV(namespace) as any
    case 'cloudflare':
      return new CloudflareKV(namespace) as any
  }
}
