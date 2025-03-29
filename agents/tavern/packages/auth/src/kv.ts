import { env } from './env'

/**
 * Client for interacting with Cloudflare Workers KV API
 */
export class KVClient {
  private static instance?: KVClient

  static getInstance() {
    if (!this.instance) {
      const baseURL = env.CLOUDFLARE_WORKERS_KV_URL
      const apiToken = env.CLOUDFLARE_WORKERS_KV_API_TOKEN
      if (!baseURL || !apiToken) {
        return undefined
      }
      this.instance = new KVClient(baseURL, apiToken)
    }
    return this.instance
  }

  private constructor(
    private baseUrl: string,
    private apiToken: string,
  ) {}

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    const response = await fetch(`${this.baseUrl}/api/kv/${encodeURIComponent(key)}`, {
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
    const response = await fetch(`${this.baseUrl}/api/kv/${encodeURIComponent(key)}`, {
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
    const response = await fetch(`${this.baseUrl}/api/kv/${encodeURIComponent(key)}`, {
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
  async list(options: any): Promise<any> {
    const params = new URLSearchParams()
    if (options.prefix) params.append('prefix', options.prefix)
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
