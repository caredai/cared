import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import type { StatementsSubset } from '@cared/auth'
import type {
  BaseModelInfo,
  BaseProviderInfo,
  EmbeddingModelInfo as EmbeddingModelInfo_,
  ImageModelInfo as ImageModelInfo_,
  LanguageModelInfo as LanguageModelInfo_,
  ModelFullId,
  ModelInfos,
  ModelType,
  SpeechModelInfo as SpeechModelInfo_,
  TranscriptionModelInfo as TranscriptionModelInfo_,
} from '@cared/providers'
import { and, eq, isNull, or } from '@cared/db'
import { db } from '@cared/db/client'
import { ProviderModels as ProviderModelsTable, ProviderSettings } from '@cared/db/schema'
import {
  getBaseProviderInfos,
  modelFullId,
  modelFullIdSchema,
  modelTypes,
  providerIdSchema,
  splitModelFullId,
} from '@cared/providers'

import type { ReturnedProviderInfo } from '../../operation'
import type { ProtectedContext } from '../../orpc'
import type { ModelSource } from '../../types'
import { getProviderModelInfos, invalidateProviderModelsCache } from '../../operation'
import { protectedProcedure, publicProcedure } from '../../orpc'
import { modelSourceSchema, updateModelArgsSchema, updateModelsArgsSchema } from '../../types'

export type ProviderInfo = BaseProviderInfo & {
  enabled: boolean
}

export type LanguageProviderModelsInfo = BaseProviderInfo & {
  models: LanguageModelInfo[]
}
export type ImageProviderModelsInfo = BaseProviderInfo & {
  models: ImageModelInfo[]
}
export type SpeechProviderModelsInfo = BaseProviderInfo & {
  models: SpeechModelInfo[]
}
export type TranscriptionProviderModelsInfo = BaseProviderInfo & {
  models: TranscriptionModelInfo[]
}
export type EmbeddingProviderModelsInfo = BaseProviderInfo & {
  models: EmbeddingModelInfo[]
}

export interface ProviderModelsInfo {
  language?: LanguageProviderModelsInfo[]
  image?: ImageProviderModelsInfo[]
  speech?: SpeechProviderModelsInfo[]
  transcription?: TranscriptionProviderModelsInfo[]
  textEmbedding?: EmbeddingProviderModelsInfo[]
}

export type LanguageModelInfo = LanguageModelInfo_ & {
  isSystem?: boolean
  id: ModelFullId
}
export type ImageModelInfo = ImageModelInfo_ & {
  isSystem?: boolean
  id: ModelFullId
}
export type SpeechModelInfo = SpeechModelInfo_ & {
  isSystem?: boolean
  id: ModelFullId
}
export type TranscriptionModelInfo = TranscriptionModelInfo_ & {
  isSystem?: boolean
  id: ModelFullId
}
export type EmbeddingModelInfo = EmbeddingModelInfo_ & {
  isSystem?: boolean
  id: ModelFullId
}

export interface ModelsInfo {
  language?: LanguageModelInfo[]
  image?: ImageModelInfo[]
  speech?: SpeechModelInfo[]
  transcription?: TranscriptionModelInfo[]
  textEmbedding?: EmbeddingModelInfo[]
}

export const modelRouter = {
  /**
   * List all available model providers.
   * Accessible by anyone.
   * @returns List of providers with their basic information
   */
  listProviders: publicProcedure
    .route({
      method: 'GET',
      path: '/providers',
      tags: ['models'],
      summary: 'List all available model providers',
    })
    .handler(async () => {
      const providers = getBaseProviderInfos()

      // When accountId is null, it's system-level
      const providerSettings = (
        await db.query.ProviderSettings.findFirst({
          where: isNull(ProviderSettings.accountId),
        })
      )?.settings

      const result: ProviderInfo[] = providers.map((provider) => ({
        ...provider,
        enabled: Boolean(providerSettings?.providers[provider.id]?.enabled),
      }))

      return {
        providers: result,
      }
    }),

  /**
   * List all providers with their models, grouped by model type.
   * Accessible by authenticated users.
   * @param input - Object containing optional model type filter and accountId
   * @returns Models organized by type, each containing providers with their models
   */
  listProvidersModels: publicProcedure
    .route({
      method: 'GET',
      path: '/providers-models',
      tags: ['models'],
      summary: 'List all providers with their models, grouped by model type',
    })
    .input(
      z
        .object({
          type: z.enum(modelTypes).optional(),
          source: modelSourceSchema.default('effective'),
        })
        .default({
          source: 'effective',
        }),
    )
    .handler(async ({ input, context }) => {
      if (context.auth.isAuthenticated) {
        await context.auth.requirePermissions()
      }
      const providerInfos = await getProviderModelInfos(input.source, context.auth.ctx?.accountId)

      function format<M extends BaseModelInfo>(provider: ReturnedProviderInfo, models?: M[]) {
        return {
          id: provider.id,
          name: provider.name,
          description: provider.description,
          icon: provider.icon,
          isGateway: provider.isGateway,
          models:
            models?.map((model) => ({
              ...model,
              id: modelFullId(provider.id, model.id),
            })) ?? [],
        }
      }

      const language = []
      const image = []
      const speech = []
      const transcription = []
      const textEmbedding = []

      for (const provider of providerInfos) {
        language.push(format(provider, provider.languageModels))
        image.push(format(provider, provider.imageModels))
        speech.push(format(provider, provider.speechModels))
        transcription.push(format(provider, provider.transcriptionModels))
        textEmbedding.push(format(provider, provider.textEmbeddingModels))
      }

      const models: ProviderModelsInfo = {
        language: !input.type || input.type === 'language' ? language : undefined,
        image: !input.type || input.type === 'image' ? image : undefined,
        speech: !input.type || input.type === 'speech' ? speech : undefined,
        transcription: !input.type || input.type === 'transcription' ? transcription : undefined,
        textEmbedding: !input.type || input.type === 'textEmbedding' ? textEmbedding : undefined,
      }

      return { models }
    }),

  /**
   * List all available models across all providers.
   * Accessible by authenticated users.
   * @param input - Object containing model type filter and accountId
   * @returns List of models matching the type
   */
  listModels: publicProcedure
    .route({
      method: 'GET',
      path: '/models',
      tags: ['models'],
      summary: 'List all available models across all providers',
    })
    .input(
      z
        .object({
          type: z.enum(modelTypes).optional(),
          source: modelSourceSchema.default('effective'),
        })
        .default({
          source: 'effective',
        }),
    )
    .handler(async ({ input, context }) => {
      if (context.auth.isAuthenticated) {
        await context.auth.requirePermissions()
      }
      const providerInfos = await getProviderModelInfos(input.source, context.auth.ctx?.accountId)

      function format<M extends { id: string }>(provider: ReturnedProviderInfo, models?: M[]) {
        return (
          models?.map((model) => ({
            ...model,
            id: modelFullId(provider.id, model.id),
          })) ?? []
        )
      }

      const language = []
      const image = []
      const speech = []
      const transcription = []
      const textEmbedding = []

      for (const provider of providerInfos) {
        language.push(...format(provider, provider.languageModels))
        image.push(...format(provider, provider.imageModels))
        speech.push(...format(provider, provider.speechModels))
        transcription.push(...format(provider, provider.transcriptionModels))
        textEmbedding.push(...format(provider, provider.textEmbeddingModels))
      }

      const models: ModelsInfo = {
        language: !input.type || input.type === 'language' ? language : undefined,
        image: !input.type || input.type === 'image' ? image : undefined,
        speech: !input.type || input.type === 'speech' ? speech : undefined,
        transcription: !input.type || input.type === 'transcription' ? transcription : undefined,
        textEmbedding: !input.type || input.type === 'textEmbedding' ? textEmbedding : undefined,
      }

      return { models }
    }),

  /**
   * Get detailed information about a specific model.
   * Accessible by authenticated users.
   * @param input - Object containing model full ID, type, and accountId
   * @returns The model information if found
   */
  getModel: publicProcedure
    .route({
      method: 'GET',
      path: '/models/{id}',
      tags: ['models'],
      summary: 'Get detailed information about a specific model',
    })
    .input(
      z.object({
        id: modelFullIdSchema,
        type: z.enum(modelTypes),
        source: modelSourceSchema.default('effective'),
      }),
    )
    .handler(async ({ input, context }) => {
      if (context.auth.isAuthenticated) {
        await context.auth.requirePermissions()
      }

      const { providerId, modelId } = splitModelFullId(input.id)

      // Get provider models from database (system + account)
      const providerModels = await db
        .select()
        .from(ProviderModelsTable)
        .where(
          and(
            context.auth.ctx?.accountId
              ? or(
                  isNull(ProviderModelsTable.accountId),
                  eq(ProviderModelsTable.accountId, context.auth.ctx.accountId),
                )
              : isNull(ProviderModelsTable.accountId),
            eq(ProviderModelsTable.providerId, providerId),
          ),
        )

      function findModel(models: ModelInfos | undefined, type: ModelType) {
        return models?.[`${type}Models` as const]?.find((m) => m.id === modelId)
      }

      // When accountId is null, it's system-level
      const systemModel = findModel(providerModels.find((pm) => !pm.accountId)?.models, input.type)
      const accountModel = findModel(providerModels.find((pm) => pm.accountId)?.models, input.type)

      let model: BaseModelInfo | undefined
      switch (input.source) {
        case 'system':
          model = systemModel
          break
        case 'custom':
          model = accountModel
          break
        default:
          // if both exist, prefer system models
          model = systemModel ?? accountModel
          break
      }

      if (!model) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Model not found',
        })
      }

      const result:
        | LanguageModelInfo
        | ImageModelInfo
        | SpeechModelInfo
        | TranscriptionModelInfo
        | EmbeddingModelInfo = {
        ...model,
        id: input.id,
        isSystem: model === systemModel,
      }

      return {
        model: result,
      }
    }),

  /**
   * Add a new model to a provider for an account.
   * Accessible by authenticated users with account permissions.
   * @param input - Object containing accountId, providerId, and model information
   * @returns Success message
   */
  updateModel: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/models',
      tags: ['models'],
      summary: 'Add or update a model to a provider',
    })
    .input(
      z
        .object({
          providerId: providerIdSchema,
          source: modelSourceSchema.exclude(['effective']).default('custom'),
        })
        .and(updateModelArgsSchema),
    )
    .handler(async ({ input, context }) => {
      await checkPermissionsBySource(context, input.source, {
        model: ['write'],
      })

      // When accountId is null, it's system-level
      let providerModels = await db.query.ProviderModels.findFirst({
        where: and(
          input.source === 'custom'
            ? eq(ProviderModelsTable.accountId, context.auth.accountId)
            : isNull(ProviderModelsTable.accountId),
          eq(ProviderModelsTable.providerId, input.providerId),
        ),
      })

      if (!providerModels) {
        providerModels = (
          await db
            .insert(ProviderModelsTable)
            .values({
              accountId: input.source === 'custom' ? context.auth.accountId : undefined,
              providerId: input.providerId,
              models: {},
            })
            .returning()
        )[0]
        if (!providerModels) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: 'Failed to create provider models record',
          })
        }
      }

      const type = input.type
      const model = input.model

      // Validate that the model id matches the provider
      const { providerId, modelId } = splitModelFullId(model.id)
      if (providerId !== input.providerId) {
        throw new ORPCError('BAD_REQUEST', {
          message: `Model id ${model.id} has providerId ${providerId}, but expected ${input.providerId}`,
        })
      }

      let models = providerModels.models[`${type}Models` as const]
      if (!models) {
        models = []
        providerModels.models[`${type}Models` as const] = models
      }
      const index = models.findIndex((m) => m.id === modelId)
      if (index >= 0) {
        // Update existing model
        models[index] = { ...model, id: modelId }
      } else {
        // Add new model
        models.push({ ...model, id: modelId })
      }

      // Update the existing record
      await db
        .update(ProviderModelsTable)
        .set({ models: providerModels.models })
        .where(eq(ProviderModelsTable.id, providerModels.id))

      await invalidateProviderModelsCache(providerModels)

      const result:
        | LanguageModelInfo
        | ImageModelInfo
        | SpeechModelInfo
        | TranscriptionModelInfo
        | EmbeddingModelInfo = {
        ...model,
        isSystem: input.source === 'system',
      }

      return {
        model: result,
      }
    }),

  /**
   * Add or update multiple models to a provider.
   * Accessible by authenticated users.
   * @returns Success message with updated models
   */
  updateModels: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/models/batch',
      tags: ['models'],
      summary: 'Add or update multiple models to a provider',
    })
    .input(
      z
        .object({
          providerId: providerIdSchema,
          source: modelSourceSchema.exclude(['effective']).default('custom'),
        })
        .and(updateModelsArgsSchema),
    )
    .handler(async ({ input, context }) => {
      await checkPermissionsBySource(context, input.source, {
        model: ['write'],
      })

      // When accountId is null, it's system-level
      let providerModels = await db.query.ProviderModels.findFirst({
        where: and(
          input.source === 'custom'
            ? eq(ProviderModelsTable.accountId, context.auth.accountId)
            : isNull(ProviderModelsTable.accountId),
          eq(ProviderModelsTable.providerId, input.providerId),
        ),
      })

      if (!providerModels) {
        providerModels = (
          await db
            .insert(ProviderModelsTable)
            .values({
              accountId: input.source === 'custom' ? context.auth.accountId : undefined,
              providerId: input.providerId,
              models: {},
            })
            .returning()
        )[0]
        if (!providerModels) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: 'Failed to create provider models record',
          })
        }
      }

      const type = input.type
      const models = input.models

      // Validate that all model ids match the provider
      const validatedModels = models.map((model) => {
        const { providerId, modelId } = splitModelFullId(model.id)
        if (providerId !== input.providerId) {
          throw new ORPCError('BAD_REQUEST', {
            message: `Model id ${model.id} has providerId ${providerId}, but expected ${input.providerId}`,
          })
        }
        return { ...model, id: modelId }
      })

      let existingModels = providerModels.models[`${type}Models` as const]
      if (!existingModels) {
        existingModels = []
        providerModels.models[`${type}Models` as const] = existingModels
      }

      // Process each model in the input array
      for (const model of validatedModels) {
        const index = existingModels.findIndex((m) => m.id === model.id)
        if (index >= 0) {
          // Update existing model
          existingModels[index] = model
        } else {
          // Add new model
          existingModels.push(model)
        }
      }

      // Update the existing record
      await db
        .update(ProviderModelsTable)
        .set({ models: providerModels.models })
        .where(eq(ProviderModelsTable.id, providerModels.id))

      await invalidateProviderModelsCache(providerModels)

      const result: (
        | LanguageModelInfo
        | ImageModelInfo
        | SpeechModelInfo
        | TranscriptionModelInfo
        | EmbeddingModelInfo
      )[] = validatedModels.map((model) => ({
        ...model,
        id: modelFullId(input.providerId, model.id),
        isSystem: input.source === 'system',
      }))

      return {
        models: result,
      }
    }),

  /**
   * Sort models for a specific provider and type.
   * Accessible by authenticated users.
   * @returns Success message with sorted models
   */
  sortModels: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/models/sort',
      tags: ['models'],
      summary: 'Sort models for a specific provider and type',
    })
    .input(
      z.object({
        providerId: providerIdSchema,
        type: z.enum(modelTypes),
        ids: z.array(modelFullIdSchema),
        source: modelSourceSchema.exclude(['effective']).default('custom'),
      }),
    )
    .handler(async ({ input, context }) => {
      await checkPermissionsBySource(context, input.source, {
        model: ['write'],
      })

      // When accountId is null, it's system-level
      const providerModels = await db.query.ProviderModels.findFirst({
        where: and(
          input.source === 'custom'
            ? eq(ProviderModelsTable.accountId, context.auth.accountId)
            : isNull(ProviderModelsTable.accountId),
          eq(ProviderModelsTable.providerId, input.providerId),
        ),
      })

      if (!providerModels) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Provider models not found',
        })
      }

      const type = input.type
      const modelsKey = `${type}Models` as const
      const existingModels = providerModels.models[modelsKey]

      if (!existingModels?.length) {
        throw new ORPCError('NOT_FOUND', {
          message: `No models found for type ${type}`,
        })
      }

      // Validate that all model ids match the provider
      const validatedModelIds = input.ids.map((id) => {
        const { providerId, modelId } = splitModelFullId(id)
        if (providerId !== input.providerId) {
          throw new ORPCError('BAD_REQUEST', {
            message: `Model id ${id} has providerId ${providerId}, but expected ${input.providerId}`,
          })
        }
        return modelId
      })

      // Check if all existing models are included in the ids array
      const existingModelIds = existingModels.map((model) => model.id)
      const missingModels = existingModelIds.filter((id) => !validatedModelIds.includes(id))
      if (missingModels.length > 0) {
        throw new ORPCError('BAD_REQUEST', {
          message: `Missing models in ids array: ${missingModels.join(', ')}`,
        })
      }

      // Check if all ids in the array exist in the existing models
      const extraModels = validatedModelIds.filter((id) => !existingModelIds.includes(id))
      if (extraModels.length > 0) {
        throw new ORPCError('BAD_REQUEST', {
          message: `Extra models in ids array that do not exist: ${extraModels.join(', ')}`,
        })
      }

      // Create a map for quick lookup of existing models
      const modelMap = new Map(existingModels.map((model) => [model.id, model]))

      // Reorder models according to the ids array
      const sortedModels = validatedModelIds.map((modelId) => {
        const model = modelMap.get(modelId)
        if (!model) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: `Model ${modelId} not found in existing models`,
          })
        }
        return model
      })

      // Update the models array with the new order
      providerModels.models[modelsKey] = sortedModels

      // Update the database record
      await db
        .update(ProviderModelsTable)
        .set({ models: providerModels.models })
        .where(eq(ProviderModelsTable.id, providerModels.id))

      await invalidateProviderModelsCache(providerModels)

      const result: (
        | LanguageModelInfo
        | ImageModelInfo
        | SpeechModelInfo
        | TranscriptionModelInfo
        | EmbeddingModelInfo
      )[] = sortedModels.map((model) => ({
        ...model,
        id: modelFullId(input.providerId, model.id),
        isSystem: input.source === 'system',
      }))

      return {
        models: result,
      }
    }),

  /**
   * Delete a single model from a provider.
   * Accessible by authenticated users.
   * @returns Success message
   */
  deleteModel: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/models',
      tags: ['models'],
      summary: 'Delete a model from a provider',
    })
    .input(
      z.object({
        id: modelFullIdSchema,
        type: z.enum(modelTypes),
        source: modelSourceSchema.exclude(['effective']).default('custom'),
      }),
    )
    .handler(async ({ input, context }) => {
      await checkPermissionsBySource(context, input.source, {
        model: ['write'],
      })

      const { providerId, modelId } = splitModelFullId(input.id)

      // When accountId is null, it's system-level
      const providerModels = await db.query.ProviderModels.findFirst({
        where: and(
          input.source === 'custom'
            ? eq(ProviderModelsTable.accountId, context.auth.accountId)
            : isNull(ProviderModelsTable.accountId),
          eq(ProviderModelsTable.providerId, providerId),
        ),
      })

      if (!providerModels) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Provider models not found',
        })
      }

      const modelsKey = `${input.type}Models` as const
      const existingModels = providerModels.models[modelsKey]

      if (!existingModels?.length) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Model not found',
        })
      }

      // Find and remove the model by id
      const deletedModel = existingModels.find((model) => model.id === modelId)
      if (!deletedModel) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Model not found',
        })
      }

      // Update the models array
      providerModels.models[modelsKey] = existingModels.filter((model) => model.id !== modelId)

      // Update the database record
      await db
        .update(ProviderModelsTable)
        .set({ models: providerModels.models })
        .where(eq(ProviderModelsTable.id, providerModels.id))

      await invalidateProviderModelsCache(providerModels)

      const result:
        | LanguageModelInfo
        | ImageModelInfo
        | SpeechModelInfo
        | TranscriptionModelInfo
        | EmbeddingModelInfo = {
        ...deletedModel,
        id: input.id,
        isSystem: input.source === 'system',
      }

      return {
        model: result,
      }
    }),

  /**
   * Delete multiple models from a provider.
   * Accessible by authenticated users.
   * @returns Success message with deleted model ids
   */
  deleteModels: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/models/batch',
      tags: ['models'],
      summary: 'Delete multiple models from a provider',
    })
    .input(
      z.object({
        providerId: providerIdSchema,
        ids: z.array(modelFullIdSchema),
        type: z.enum(modelTypes),
        source: modelSourceSchema.exclude(['effective']).default('custom'),
      }),
    )
    .handler(async ({ input, context }) => {
      await checkPermissionsBySource(context, input.source, {
        model: ['write'],
      })

      // Extract modelIds from the full model ids
      const modelIds = input.ids.map((id) => {
        const { providerId, modelId } = splitModelFullId(id)
        if (providerId !== input.providerId) {
          throw new ORPCError('BAD_REQUEST', {
            message: `Model id ${id} has providerId ${providerId}, but expected ${input.providerId}`,
          })
        }
        return modelId
      })

      // When accountId is null, it's system-level
      const providerModels = await db.query.ProviderModels.findFirst({
        where: and(
          input.source === 'custom'
            ? eq(ProviderModelsTable.accountId, context.auth.accountId)
            : isNull(ProviderModelsTable.accountId),
          eq(ProviderModelsTable.providerId, input.providerId),
        ),
      })

      if (!providerModels) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Provider models not found',
        })
      }

      const modelsKey = `${input.type}Models` as const
      const existingModels = providerModels.models[modelsKey]

      if (!existingModels?.length) {
        throw new ORPCError('NOT_FOUND', {
          message: `No models found to delete`,
        })
      }

      // Find and remove models by modelIds
      const deletedModels = existingModels.filter((model) => modelIds.includes(model.id))
      if (deletedModels.length !== modelIds.length) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Not all models found for deletion',
        })
      }

      // Update the models array
      providerModels.models[modelsKey] = existingModels.filter(
        (model) => !modelIds.includes(model.id),
      )

      // Update the database record
      await db
        .update(ProviderModelsTable)
        .set({ models: providerModels.models })
        .where(eq(ProviderModelsTable.id, providerModels.id))

      await invalidateProviderModelsCache(providerModels)

      const result: (
        | LanguageModelInfo
        | ImageModelInfo
        | SpeechModelInfo
        | TranscriptionModelInfo
        | EmbeddingModelInfo
      )[] = deletedModels.map((model) => ({
        ...model,
        id: modelFullId(input.providerId, model.id),
        isSystem: input.source === 'system',
      }))

      return {
        models: result,
      }
    }),
}

export async function checkPermissionsBySource(
  context: ProtectedContext,
  source: Omit<ModelSource, 'effective'>,
  permissions?: StatementsSubset,
  accountId?: string | null,
) {
  switch (source) {
    case 'system':
      if (!context.auth.isAdmin) {
        throw new ORPCError('FORBIDDEN')
      }
      break
    case 'custom':
      await context.auth.requirePermissions(permissions, { accountId: accountId ?? undefined })
      break
  }
}
