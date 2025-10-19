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
    fetch: (
      key: string,
    ) => Promise<VALUE | undefined | [VALUE | undefined, number | Date | undefined]>,
    ex: number | undefined = DEFAULT_KV_TTL,
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
        let result = await fetch(key)
        let value, ttl
        if (Array.isArray(result)) {
          value = result[0]
          ttl = result[1]
        } else {
          value = result
        }

        if (!value) {
          return null
        }

        if (typeof ttl !== 'undefined') {
          if (ttl instanceof Date) {
            ttl = Math.max(Math.floor((Number(ttl) - Date.now()) / 1000), 0)
          }
        }

        await this.kv.set(key, JSON.stringify(value), {
          ex: typeof ttl === 'number' ? ttl : ex,
        })

        return value
      },
    )

    this.kv = getKV(namespace, 'upstash')
  }

  async get(key: string) {
    const value = await this.cache().fetch(`${this.namespace}::${key}`)
    return value ?? undefined
  }

  async invalidate(key: string) {
    await this.kv.delete(key)
    this.cache().delete(`${this.namespace}::${key}`)
  }
}
