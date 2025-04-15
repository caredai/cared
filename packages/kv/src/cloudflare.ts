import { KV } from './base'
import { env } from './env'

/**
 * KV Client for interacting with Cloudflare Workers KV API
 */
export class CloudflareKV extends KV {
  private baseUrl = env.CLOUDFLARE_WORKERS_KV_URL ?? ''
  private apiToken = env.CLOUDFLARE_WORKERS_KV_API_TOKEN ?? ''

  constructor(namespace: string) {
    super(namespace)

    if (!this.baseUrl || !this.apiToken) {
      throw new Error('Cloudflare Workers KV URL and API token are required')
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    const response = await fetch(`${this.baseUrl}/api/kv/${encodeURIComponent(this.key(key))}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`Failed to get value: ${response.statusText}`)
    }

    const data: any = await response.json()
    return data.value
  }

  /**
   * Set key-value pair
   */
  async set(key: string, value: string, expirationTtl?: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/kv/${encodeURIComponent(this.key(key))}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value, expirationTtl }),
    })

    if (!response.ok) {
      throw new Error(`Failed to set value: ${response.statusText}`)
    }
  }

  /**
   * Delete key
   */
  async delete(key: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/kv/${encodeURIComponent(this.key(key))}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete key: ${response.statusText}`)
    }
  }

  /**
   * List all keys with optional prefix
   */
  async list(options: { prefix?: string; limit?: number; cursor?: string }): Promise<any> {
    const params = new URLSearchParams()
    params.append('prefix', this.key(options.prefix ?? ''))
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.cursor) params.append('cursor', options.cursor)

    const response = await fetch(`${this.baseUrl}/api/kv?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to list keys: ${response.statusText}`)
    }

    return await response.json()
  }
}
