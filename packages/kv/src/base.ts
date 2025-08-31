export abstract class KV {
  protected constructor(protected namespace: string) {}

  key(key: string) {
    return `${this.namespace}::${key}`
  }

  abstract get(key: string): Promise<string | null>

  abstract set(key: string, value: string, expirationTtl?: number): Promise<void>

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
