import type { KV } from './base'
import { CloudflareKV } from './cloudflare'
import { UpstashKV } from './upstash'

export { CloudflareKV } from './cloudflare'
export { UpstashKV } from './upstash'

export function getKV(namespace: string, kind: 'upstash' | 'cloudflare'): KV {
  switch (kind) {
    case 'upstash':
      return new UpstashKV(namespace)
    case 'cloudflare':
      return new CloudflareKV(namespace)
  }
}
