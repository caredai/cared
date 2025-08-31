import { CloudflareKV } from './cloudflare'
import { UpstashKV } from './upstash'

export * from './base'
export * from './cloudflare'
export * from './upstash'

export function getKV<K extends 'upstash' | 'cloudflare'>(
  namespace: string,
  kind: K,
): K extends 'upstash' ? UpstashKV : CloudflareKV {
  switch (kind) {
    case 'upstash':
      return new UpstashKV(namespace) as any
    case 'cloudflare':
      return new CloudflareKV(namespace) as any
  }
}
