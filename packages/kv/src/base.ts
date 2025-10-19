export abstract class KV {
  protected constructor(protected namespace: string) {}

  key(key: string) {
    return `${this.namespace}::${key}`
  }

  abstract get(key: string): Promise<string | null>

  abstract getex(
    key: string,
    opts: {
      ex?: number // Set the specified expire time, in seconds.
      px?: number // Set the specified expire time, in milliseconds.
      exat?: number // Set the specified Unix time at which the key will expire, in seconds.
      pxat?: number // Set the specified Unix time at which the key will expire, in milliseconds.
      persist?: boolean // Remove the existing timeout on key, turning the key from volatile (a key with an expire set) to persistent (a key that will never expire as no timeout is associated).
    },
  ): Promise<string | null>

  abstract set(
    key: string,
    value: string,
    opts?: {
      ex?: number
      px?: number
      exat?: number
      pxat?: number
      nx?: true // Only set the key if it does not already exist.
      xx?: true // Only set the key if it already exists.
      keepTtl?: true // Retain the time to live associated with the key.
    } | number,
  ): Promise<void>

  abstract delete(key: string): Promise<void>

  abstract eval<TArgs extends unknown[], TData = unknown>(
    script: ScriptInfo,
    keys: string[],
    args: TArgs,
  ): Promise<TData>
}

export interface ScriptInfo {
  script: string
  hash: string
}
