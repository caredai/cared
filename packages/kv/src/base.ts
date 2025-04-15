export abstract class KV {
  protected constructor(protected namespace: string) {}

  protected key(key: string) {
    return `${this.namespace}::${key}`
  }

  abstract get(key: string): Promise<string | null>

  abstract set(key: string, value: string, expirationTtl?: number): Promise<void>

  abstract delete(key: string): Promise<void>
}
