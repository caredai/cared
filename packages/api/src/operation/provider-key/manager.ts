import type { ProviderId, ProviderKey as ProviderKeyContent } from '@cared/providers'
import { and, desc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { ProviderKey } from '@cared/db/schema'
import { getKV } from '@cared/kv'

import type { AuthObject } from '../../auth'
import { decryptProviderKey } from './encryption'

const kv = getKV('providerKey', 'upstash')

export class ProviderKeyManager {
  constructor(
    private systemKeys: ProviderKeyStatus[],
    private userOrOrgKeys: ProviderKeyStatus[],
  ) {}

  static async from({ auth, providerId }: { auth: AuthObject; providerId: ProviderId }) {
    const [systemKeysStatusStr, userOrOrgKeysStatusStr] = await Promise.all([
      kv.get(providerKeyStatusKey({ isSystem: true })),
      kv.get(
        providerKeyStatusKey({
          userId:
            auth.type === 'user' || auth.type === 'appUser' || auth.scope === 'user'
              ? auth.userId
              : undefined,
          organizationId: !(
            auth.type === 'user' ||
            auth.type === 'appUser' ||
            auth.scope === 'user'
          )
            ? auth.organizationId
            : undefined,
        }),
      ),
    ])

    let systemKeysStatus: ProviderKeyStatus[] | null =
      systemKeysStatusStr && JSON.parse(systemKeysStatusStr)
    let userOrOrgKeysStatus: ProviderKeyStatus[] | null =
      userOrOrgKeysStatusStr && JSON.parse(userOrOrgKeysStatusStr)

    if (!systemKeysStatus) {
      const keys = await db
        .select()
        .from(ProviderKey)
        .where(and(eq(ProviderKey.providerId, providerId), eq(ProviderKey.isSystem, true)))
        .orderBy(desc(ProviderKey.id))

      systemKeysStatus = keys.map((k) => ({
        id: k.id,
        key: k.key,
        disabled: k.disabled,
      }))
    }

    if (!userOrOrgKeysStatus) {
      const keys = await db
        .select()
        .from(ProviderKey)
        .where(
          and(
            eq(ProviderKey.providerId, providerId),
            auth.type === 'user' || auth.type === 'appUser' || auth.scope === 'user'
              ? eq(ProviderKey.userId, auth.userId)
              : eq(ProviderKey.organizationId, auth.organizationId),
          ),
        )
        .orderBy(desc(ProviderKey.id))

      userOrOrgKeysStatus = keys.map((k) => ({
        id: k.id,
        key: k.key,
        disabled: k.disabled,
      }))
    }

    return new ProviderKeyManager(
      await Promise.all(
        systemKeysStatus.map(async (k) => ({
          ...k,
          key: await decryptProviderKey(k.key, true),
        })),
      ),
      await Promise.all(
        userOrOrgKeysStatus.map(async (k) => ({
          ...k,
          key: await decryptProviderKey(k.key, true),
        })),
      ),
    )
  }

  selectKeys(): {
    id: string
    key: ProviderKeyContent
  }[] {
    return [...this.systemKeys, ...this.userOrOrgKeys].filter((k) => !k.disabled)
  }

  setStatus() {
    // Not implemented yet
  }

  async saveStatus() {
    // Not implemented yet
  }
}

export type ProviderKeyStrategy =
  | 'random'
  | 'round-robin'
  | 'weighted-round-robin'
  | 'failover'
  | 'rate-limit'
  | 'hybrid'

function providerKeyStatusKey({
  isSystem,
  userId,
  organizationId,
}: {
  isSystem?: boolean
  userId?: string | null
  organizationId?: string | null
}) {
  if (isSystem) {
    return `system:status`
  } else if (userId) {
    return `${userId}:status`
  } else {
    return `${organizationId!}:status`
  }
}

export interface ProviderKeyStatus {
  /**
   * Unique identifier for the Key.
   */
  id: string

  /**
   * Encrypted or decrypted Key value.
   */
  key: ProviderKeyContent

  /**
   * Whether the Key is disabled.
   */
  disabled: boolean

  /**
   * Consecutive error count. The Key may be marked unhealthy if this exceeds a threshold.
   */
  errorCount?: number

  /**
   * Unix Epoch timestamp of the last error occurrence. Null if no errors.
   */
  lastErrorAt?: number

  /**
   * Remaining requests quota (parsed from API response headers).
   */
  rateLimitRemainingRequests?: number

  /**
   * Unix Epoch timestamp when the request quota will reset.
   */
  rateLimitResetRequestsAt?: number

  /**
   * Remaining token quota (parsed from API response headers).
   */
  rateLimitRemainingTokens?: number

  /**
   * Unix Epoch timestamp when the token quota will reset.
   */
  rateLimitResetTokensAt?: number

  /**
   * Unix Epoch timestamp of the last time this Key was used.
   * Can be used for LRU (Least Recently Used) or other time-based strategies.
   */
  lastUsedAt?: number
}
