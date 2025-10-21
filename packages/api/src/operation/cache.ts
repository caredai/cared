import type { UpstashKV } from '@cared/kv'
import { getKV } from '@cared/kv'
import { LRUCache, lruCacheSizeCalculation } from '@cared/shared'

const DEFAULT_MEMORY_TTL = 5 * 60
const DEFAULT_KV_TTL = 24 * 60 * 60

export class Cache<VALUE extends object> {
  static #cache: LRUCache<string, object> | undefined = undefined
  static #fetchMethods = new Map<string, LRUCache.Fetcher<string, object>>()

  static setup(maxSize = 50 * 1024 * 1024) {
    Cache.#cache = new LRUCache<string, object>({
      maxSize,
      sizeCalculation: lruCacheSizeCalculation,
      ttl: DEFAULT_MEMORY_TTL * 1000,
      allowStale: true, // always allow stale
      // eslint-disable-next-line @typescript-eslint/unbound-method
      fetchMethod: Cache.#fetchMethod,
    })
  }

  static #fetchMethod(
    key: string,
    staleValue: object | undefined,
    opts: LRUCache.FetcherOptions<string, object>,
  ) {
    const namespace = key.split('::', 1)[0]
    const fetch = Cache.#fetchMethods.get(namespace ?? '')
    if (!fetch) {
      throw new Error(`No fetch method for namespace '${namespace}'`)
    }
    return fetch(key.slice(namespace!.length + 2), staleValue, opts)
  }

  cache() {
    return Cache.#cache! as unknown as LRUCache<string, VALUE>
  }

  private kv: UpstashKV

  constructor(
    private namespace: string,
    fetch: (key: string) => Promise<
      | {
          value?: VALUE
          ttl?: number | Date
        }
      | undefined
    >,
    private ex: number | undefined = DEFAULT_KV_TTL,
  ) {
    Cache.#fetchMethods.set(
      namespace,
      async (
        key: string,
        _staleValue: object | undefined,
        _opts: LRUCache.FetcherOptions<string, object>,
      ) => {
        const valueFromKv =
          typeof ex === 'number'
            ? await this.kv.getex(key, {
                ex,
              })
            : await this.kv.get(key)
        if (valueFromKv) {
          console.log('KV cache hit')
          return JSON.parse(valueFromKv) as VALUE
        }

        console.log('Cache miss')

        // eslint-disable-next-line prefer-const
        let { value, ttl } = (await fetch(key)) ?? {}

        if (!value) {
          return null
        }

        await this.set(key, value, ttl, true)

        return value
      },
    )

    this.kv = getKV(namespace, 'upstash')
  }

  async get(key: string, forceFetch = false) {
    const value = await this.cache().fetch(`${this.namespace}::${key}`, {
      forceRefresh: forceFetch,
    })
    return value ?? undefined
  }

  async getOrDefault(key: string, defaultValue: VALUE, forceFetch = false) {
    return (await this.get(key, forceFetch)) ?? defaultValue
  }

  async set(key: string, value: VALUE, ttl?: number | Date, inFetch = false) {
    if (typeof ttl !== 'undefined') {
      if (ttl instanceof Date) {
        ttl = Math.max(Math.floor((Number(ttl) - Date.now()) / 1000), 0)
      }
    }

    if (!inFetch) {
      this.cache().set(`${this.namespace}::${key}`, value, {
        ttl,
      })
    }

    await this.kv.set(key, JSON.stringify(value), {
      ex: typeof ttl === 'number' ? ttl : this.ex,
    })
  }

  async invalidate(key: string) {
    await this.kv.delete(key)
    this.cache().delete(`${this.namespace}::${key}`)
  }
}
