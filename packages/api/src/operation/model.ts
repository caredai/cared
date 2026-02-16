import type { SQL } from '@cared/db'
import type {
  BaseProviderInfo,
  ModelFullId,
  ModelInfos,
  ModelType,
  ProviderId,
} from '@cared/providers'
import { eq, inArray, isNull, sql } from '@cared/db'
import { db } from '@cared/db/client'
import { ProviderModels } from '@cared/db/schema'
import log from '@cared/log'
import {
  getBaseProviderInfos,
  getExtendedBaseProviderInfos,
  modelFullId,
  splitModelFullId,
} from '@cared/providers'

import type { AuthContext } from '../auth'
import type { ModelSource } from '../types'
import { Cache } from './cache'

export type ReturnedProviderInfo = BaseProviderInfo & ReturnedModelInfos

export type ReturnedModelInfos = {
  [K in keyof ModelInfos]: ModelInfos[K] extends (infer T)[] | undefined
    ? (T & { isSystem?: boolean })[] | undefined
    : never
}

const cache = new Cache<ProviderModels[]>('providerModels', async (key) => {
  let value
  if (key === 'system') {
    // When accountId is null, it's system-level
    value = await db.select().from(ProviderModels).where(isNull(ProviderModels.accountId))
  } else {
    value = await db.select().from(ProviderModels).where(eq(ProviderModels.accountId, key))
  }
  return {
    value,
  }
})

export async function invalidateProviderModelsCache(key: string | ProviderModels) {
  if (typeof key !== 'string') {
    // When accountId is null, it's system-level
    key = key.accountId ?? 'system'
  }
  await cache.invalidate(key)
}

export async function getProviderModelInfos(source: ModelSource, accountId?: string) {
  const baseProviderInfos = getBaseProviderInfos()

  // Get provider models from database (system + account)
  const providerModelsList =
    source === 'system'
      ? await cache.getOrDefault('system', []) // system
      : source === 'custom'
        ? await cache.getOrDefault(accountId!, []) // account
        : (
            await Promise.all([
              // system + account
              cache.getOrDefault('system', []),
              cache.getOrDefault(accountId!, []),
            ])
          ).flat()

  // Separate system and account models
  const systemProviderModelsMap = new Map<string, ProviderModels>()
  const accountProviderModelsMap = new Map<string, ProviderModels>()
  for (const providerModels of providerModelsList) {
    // When accountId is null, it's system-level
    const map = !providerModels.accountId ? systemProviderModelsMap : accountProviderModelsMap
    if (map.has(providerModels.providerId)) {
      log.error('Duplicate provider models found', {
        providerModels,
      })
    }
    map.set(providerModels.providerId, providerModels)
  }

  const providers: ReturnedProviderInfo[] = []

  const deleteIds: string[] = []
  const updateIds: string[] = []
  const updateSqlChunks: SQL[] = []

  updateSqlChunks.push(sql`(case`)

  for (const providerInfo of baseProviderInfos) {
    const systemProviderModels = systemProviderModelsMap.get(providerInfo.id)
    const accountProviderModels = accountProviderModelsMap.get(providerInfo.id)
    const { shouldUpdateAccountModels, ...models } = mergeModels(
      systemProviderModels?.models,
      accountProviderModels?.models, // may be updated in place if deduplicated
    )
    providers.push({
      ...providerInfo,
      ...models,
    })

    if (shouldUpdateAccountModels && accountProviderModels) {
      const models = accountProviderModels.models
      if (
        models.languageModels?.length ||
        models.imageModels?.length ||
        models.speechModels?.length ||
        models.transcriptionModels?.length ||
        models.textEmbeddingModels?.length
      ) {
        updateIds.push(accountProviderModels.id)
        updateSqlChunks.push(
          sql`when ${ProviderModels.id} = ${accountProviderModels.id} then ${accountProviderModels.models}`,
        )
      } else {
        // If all model arrays are empty, delete the record
        deleteIds.push(accountProviderModels.id)
      }
    }
  }

  updateSqlChunks.push(sql`end)`)

  if (updateIds.length) {
    const finalSql: SQL = sql.join(updateSqlChunks, sql.raw(' '))
    await db
      .update(ProviderModels)
      .set({ models: finalSql })
      .where(inArray(ProviderModels.id, updateIds))
  }

  if (deleteIds.length) {
    await db.delete(ProviderModels).where(inArray(ProviderModels.id, deleteIds))
  }

  if (updateIds.length || deleteIds.length) {
    if (source === 'system') {
      await invalidateProviderModelsCache('system')
    } else if (source === 'custom') {
      await invalidateProviderModelsCache(accountId!)
    } else {
      await Promise.all([
        invalidateProviderModelsCache('system'),
        invalidateProviderModelsCache(accountId!),
      ])
    }
  }

  return providers
}

// Merge system and account models, ensuring no duplicates and system models override account models
function mergeModels(
  systemModelInfos?: ModelInfos,
  accountModelInfos?: ModelInfos,
): ReturnedModelInfos & {
  shouldUpdateAccountModels: boolean
} {
  let shouldUpdateAccountModels = false

  function deduplicate<T extends { id: string; isSystem?: boolean }[]>(
    systemModels?: T,
    accountModels?: T,
  ) {
    const newAccountModels = [] as unknown as T
    const seen = new Set<string>()
    const sep = systemModels?.length ?? 0
    const deduplicated = [...(systemModels ?? []), ...(accountModels ?? [])]
      // ensure system models override account models
      .filter((item, index) => {
        if (seen.has(item.id)) {
          return false
        }
        if (index < sep) {
          // Mark it as system if it's from system models
          item.isSystem = true
        } else {
          // None-duplicate account models
          newAccountModels.push(item)
        }
        seen.add(item.id)
        return true
      })

    // Update `accountModels` in place if it has fewer models than before
    if (newAccountModels.length < (accountModels?.length ?? 0)) {
      shouldUpdateAccountModels = true
      accountModels?.splice(0, accountModels.length, ...newAccountModels)
    }

    return deduplicated
  }

  return {
    languageModels: deduplicate(
      systemModelInfos?.languageModels,
      accountModelInfos?.languageModels,
    ),
    imageModels: deduplicate(systemModelInfos?.imageModels, accountModelInfos?.imageModels),
    speechModels: deduplicate(systemModelInfos?.speechModels, accountModelInfos?.speechModels),
    transcriptionModels: deduplicate(
      systemModelInfos?.transcriptionModels,
      accountModelInfos?.transcriptionModels,
    ),
    textEmbeddingModels: deduplicate(
      systemModelInfos?.textEmbeddingModels,
      accountModelInfos?.textEmbeddingModels,
    ),
    shouldUpdateAccountModels,
  }
}

export async function findProvidersByModel<T extends ModelType>(
  auth: AuthContext,
  queryModelId: string,
  modelType: T,
) {
  const providers = new Map(getExtendedBaseProviderInfos().map((info) => [info.id, info]))

  const providerModelsArray = await getProviderModelInfos('effective', auth.accountId)

  const ids = splitModelFullId(queryModelId)
  let queryProviderId: ProviderId | undefined
  if (providers.has(ids.providerId)) {
    queryProviderId = ids.providerId
    queryModelId = ids.modelId
  }

  // provide id => model
  const foundProviderModels = new Map<
    string,
    NonNullable<ReturnedModelInfos[`${typeof modelType}Models`]>[number] & {
      id: ModelFullId
    }
  >()

  if (queryProviderId) {
    // TODO: optimize
    const providerModels = providerModelsArray.find((p) => p.id === queryProviderId)
    if (providerModels) {
      const modelsByType = providerModels[`${modelType}Models`]
      const model = modelsByType?.find((model) => model.id === queryModelId)
      if (model) {
        foundProviderModels.set(queryProviderId, {
          ...model,
          id: modelFullId(queryProviderId, model.id),
        })
      }
    }
  } else {
    // If no provider is specified, search all providers for those supporting this model
    providerModelsArray.forEach((providerModels) => {
      const providerId = providerModels.id
      const modelsByType = providerModels[`${modelType}Models`]

      return modelsByType?.forEach((model) => {
        if (model.id === queryModelId) {
          // If the model id matches exactly, always select it
          foundProviderModels.set(providerId, {
            ...model,
            id: modelFullId(providerId, model.id),
          })
        } else {
          const provider = providers.get(providerId)
          if (provider?.isGateway && provider.modelSeparator) {
            const { modelId: modelIdNoPrefix } = provider.modelSeparator(model.id)
            if (modelIdNoPrefix === queryModelId) {
              if (!foundProviderModels.has(providerId)) {
                foundProviderModels.set(providerId, {
                  ...model,
                  id: modelFullId(providerId, model.id),
                })
              }
            }
          }
        }
      })
    })
  }

  const result = Array.from(foundProviderModels.values())
  if (result.length > 0) {
    // Always move the provider with an exact match of the specified model id to the front.
    // This ensures that the provider whose model id exactly matches queryModelId is prioritized.
    const exactProviderIndex = result.findIndex(
      (m) => splitModelFullId(m.id).modelId === queryModelId,
    )
    if (exactProviderIndex >= 0) {
      // Move the exact match to the front
      const [exact] = result.splice(exactProviderIndex, 1)
      result.unshift(exact!)
    }
  }
  return result
}
