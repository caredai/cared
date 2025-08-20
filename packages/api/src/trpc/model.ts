import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'

import type { SQL } from '@cared/db'
import type { BaseModelInfo, BaseProviderInfo, ModelInfos, ModelType } from '@cared/providers'
import { and, eq, inArray, or, sql } from '@cared/db'
import { ProviderModels } from '@cared/db/schema'
import log from '@cared/log'
import {
  defaultModels,
  embeddingModelInfoSchema,
  getBaseProviderInfos,
  imageModelInfoSchema,
  languageModelInfoSchema,
  modelFullId,
  modelFullIdSchema,
  modelTypes,
  providerIdSchema,
  speechModelInfoSchema,
  splitModelFullId,
  transcriptionModelInfoSchema,
} from '@cared/providers'

import type { Context } from '../trpc'
import { OrganizationScope } from '../auth'
import { protectedProcedure, publicProcedure } from '../trpc'

type ReturnedProviderInfo = BaseProviderInfo & ReturnedModelInfos

type ReturnedModelInfos = {
  [K in keyof ModelInfos]: ModelInfos[K] extends (infer T)[] | undefined
    ? (T & { isSystem?: boolean })[] | undefined
    : never
}

const sourceSchema = z.enum(['system', 'custom'])
type Source = z.infer<typeof sourceSchema>

export const modelRouter = {
  /**
   * List default models used by the platform.
   * Accessible by anyone.
   * @returns Default models
   */
  listDefaultModels: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/default-models',
        tags: ['models'],
        summary: 'Get default models used by the platform',
      },
    })
    .query(() => {
      return { defaultModels }
    }),

  /**
   * List all available model providers.
   * Accessible by anyone.
   * @returns List of providers with their basic information
   */
  listProviders: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/providers',
        tags: ['models'],
        summary: 'List all available model providers',
      },
    })
    .query(() => {
      const providers = getBaseProviderInfos()

      return {
        providers,
      }
    }),

  /**
   * List all providers with their models, grouped by model type.
   * Accessible by authenticated users.
   * @param input - Object containing optional model type filter and organizationId
   * @returns Models organized by type, each containing providers with their models
   */
  listProvidersModels: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/providers-models',
        tags: ['models'],
        summary: 'List all providers with their models, grouped by model type',
      },
    })
    .input(
      z
        .object({
          organizationId: z.string().optional(),
          type: z.enum(modelTypes).optional(),
          source: sourceSchema.optional(),
        })
        .default({}),
    )
    .query(async ({ input, ctx }) => {
      const providerInfos = await getProviderInfos(ctx, input.source, input.organizationId)

      function format<M extends BaseModelInfo>(provider: ReturnedProviderInfo, models?: M[]) {
        return {
          id: provider.id,
          name: provider.name,
          description: provider.description,
          icon: provider.icon,
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

      return {
        models: {
          language: !input.type || input.type === 'language' ? language : undefined,
          image: !input.type || input.type === 'image' ? image : undefined,
          speech: !input.type || input.type === 'speech' ? speech : undefined,
          transcription: !input.type || input.type === 'transcription' ? transcription : undefined,
          textEmbedding: !input.type || input.type === 'textEmbedding' ? textEmbedding : undefined,
        },
      }
    }),

  /**
   * List all available models across all providers.
   * Accessible by authenticated users.
   * @param input - Object containing model type filter and organizationId
   * @returns List of models matching the type
   */
  listModels: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/models',
        tags: ['models'],
        summary: 'List all available models across all providers',
      },
    })
    .input(
      z
        .object({
          organizationId: z.string().optional(),
          type: z.enum(modelTypes).optional(),
          source: sourceSchema.optional(),
        })
        .default({}),
    )
    .query(async ({ input, ctx }) => {
      const providerInfos = await getProviderInfos(ctx, input.source, input.organizationId)

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

      return {
        models: {
          language: !input.type || input.type === 'language' ? language : undefined,
          image: !input.type || input.type === 'image' ? image : undefined,
          speech: !input.type || input.type === 'speech' ? speech : undefined,
          transcription: !input.type || input.type === 'transcription' ? transcription : undefined,
          textEmbedding: !input.type || input.type === 'textEmbedding' ? textEmbedding : undefined,
        },
      }
    }),

  /**
   * Get detailed information about a specific model.
   * Accessible by authenticated users.
   * @param input - Object containing model full ID, type, and organizationId
   * @returns The model information if found
   */
  getModel: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/models/{id}',
        tags: ['models'],
        summary: 'Get detailed information about a specific model',
      },
    })
    .input(
      z.object({
        organizationId: z.string().optional(),
        id: modelFullIdSchema,
        type: z.enum(modelTypes),
        source: sourceSchema.optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const userId = await checkPermissions(ctx, input.organizationId)

      const { providerId, modelId } = splitModelFullId(input.id)

      // Get provider models from database (system + user/organization)
      const providerModels = await ctx.db
        .select()
        .from(ProviderModels)
        .where(
          and(
            or(
              eq(ProviderModels.isSystem, true),
              input.organizationId
                ? eq(ProviderModels.organizationId, input.organizationId)
                : eq(ProviderModels.userId, userId!),
            ),
            eq(ProviderModels.providerId, providerId),
          ),
        )

      function findModel(models: ModelInfos | undefined, type: ModelType) {
        return models?.[`${type}Models` as const]?.find((m) => m.id === modelId)
      }

      const systemModel = findModel(providerModels.find((pm) => pm.isSystem)?.models, input.type)
      const userOrgModel = findModel(providerModels.find((pm) => !pm.isSystem)?.models, input.type)

      let model
      switch (input.source) {
        case 'system':
          model = systemModel
          break
        case 'custom':
          model = userOrgModel
          break
        default:
          model = systemModel ?? userOrgModel // if both exist, prefer system models
          break
      }

      if (!model) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Model not found',
        })
      }

      return {
        model: {
          ...model,
          id: input.id,
          isSystem: model === systemModel,
        },
      }
    }),

  /**
   * Add a new model to a provider for an organization.
   * Accessible by authenticated users with organization permissions.
   * @param input - Object containing organizationId, providerId, and model information
   * @returns Success message
   */
  updateModel: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/models',
        tags: ['models'],
        summary: 'Add or update a model to a provider',
      },
    })
    .input(
      z
        .object({
          organizationId: z.string().optional(),
          providerId: providerIdSchema,
          isSystem: z.boolean().optional(),
        })
        .and(
          z.discriminatedUnion('type', [
            z.object({
              type: z.literal('language'),
              model: languageModelInfoSchema.extend({
                id: modelFullIdSchema,
              }),
            }),
            z.object({
              type: z.literal('image'),
              model: imageModelInfoSchema.extend({
                id: modelFullIdSchema,
              }),
            }),
            z.object({
              type: z.literal('speech'),
              model: speechModelInfoSchema.extend({
                id: modelFullIdSchema,
              }),
            }),
            z.object({
              type: z.literal('transcription'),
              model: transcriptionModelInfoSchema.extend({
                id: modelFullIdSchema,
              }),
            }),
            z.object({
              type: z.literal('textEmbedding'),
              model: embeddingModelInfoSchema.extend({
                id: modelFullIdSchema,
              }),
            }),
          ]),
        )
        .refine((data) => !(data.organizationId && data.isSystem), {
          message: 'organizationId and isSystem cannot both be present',
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = await checkPermissions(ctx, input.organizationId, input.isSystem)

      let providerModels = await ctx.db.query.ProviderModels.findFirst({
        where: and(
          input.isSystem
            ? eq(ProviderModels.isSystem, true)
            : input.organizationId
              ? eq(ProviderModels.organizationId, input.organizationId)
              : eq(ProviderModels.userId, userId!),
          eq(ProviderModels.providerId, input.providerId),
        ),
      })

      if (!providerModels) {
        providerModels = (
          await ctx.db
            .insert(ProviderModels)
            .values({
              isSystem: input.isSystem ?? false,
              userId: !input.isSystem && !input.organizationId ? userId! : undefined,
              organizationId: !input.isSystem ? input.organizationId : undefined,
              providerId: input.providerId,
              models: {},
            })
            .returning()
        )[0]
        if (!providerModels) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create provider models record',
          })
        }
      }

      const type = input.type
      const model = input.model

      // Validate that the model id matches the provider
      const { providerId, modelId } = splitModelFullId(model.id)
      if (providerId !== input.providerId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
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
      await ctx.db
        .update(ProviderModels)
        .set({ models: providerModels.models })
        .where(eq(ProviderModels.id, providerModels.id))

      return {
        model: {
          ...model,
          isSystem: providerModels.isSystem,
        },
      }
    }),

  /**
   * Add or update multiple models to a provider.
   * Accessible by authenticated users.
   * @returns Success message with updated models
   */
  updateModels: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/models/batch',
        tags: ['models'],
        summary: 'Add or update multiple models to a provider',
      },
    })
    .input(
      z
        .object({
          organizationId: z.string().optional(),
          providerId: providerIdSchema,
          isSystem: z.boolean().optional(),
        })
        .and(
          z.discriminatedUnion('type', [
            z.object({
              type: z.literal('language'),
              models: z.array(
                languageModelInfoSchema.extend({
                  id: modelFullIdSchema,
                }),
              ),
            }),
            z.object({
              type: z.literal('image'),
              models: z.array(
                imageModelInfoSchema.extend({
                  id: modelFullIdSchema,
                }),
              ),
            }),
            z.object({
              type: z.literal('speech'),
              models: z.array(
                speechModelInfoSchema.extend({
                  id: modelFullIdSchema,
                }),
              ),
            }),
            z.object({
              type: z.literal('transcription'),
              models: z.array(
                transcriptionModelInfoSchema.extend({
                  id: modelFullIdSchema,
                }),
              ),
            }),
            z.object({
              type: z.literal('textEmbedding'),
              models: z.array(
                embeddingModelInfoSchema.extend({
                  id: modelFullIdSchema,
                }),
              ),
            }),
          ]),
        )
        .refine((data) => !(data.organizationId && data.isSystem), {
          message: 'organizationId and isSystem cannot both be present',
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = await checkPermissions(ctx, input.organizationId, input.isSystem)

      let providerModels = await ctx.db.query.ProviderModels.findFirst({
        where: and(
          input.isSystem
            ? eq(ProviderModels.isSystem, true)
            : input.organizationId
              ? eq(ProviderModels.organizationId, input.organizationId)
              : eq(ProviderModels.userId, userId!),
          eq(ProviderModels.providerId, input.providerId),
        ),
      })

      if (!providerModels) {
        providerModels = (
          await ctx.db
            .insert(ProviderModels)
            .values({
              isSystem: input.isSystem ?? false,
              userId: !input.isSystem && !input.organizationId ? userId! : undefined,
              organizationId: !input.isSystem ? input.organizationId : undefined,
              providerId: input.providerId,
              models: {},
            })
            .returning()
        )[0]
        if (!providerModels) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
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
          throw new TRPCError({
            code: 'BAD_REQUEST',
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
      await ctx.db
        .update(ProviderModels)
        .set({ models: providerModels.models })
        .where(eq(ProviderModels.id, providerModels.id))

      return {
        models: validatedModels.map((model) => ({
          ...model,
          id: modelFullId(input.providerId, model.id),
          isSystem: providerModels.isSystem,
        })),
      }
    }),

  /**
   * Delete a single model from a provider.
   * Accessible by authenticated users.
   * @returns Success message
   */
  deleteModel: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/models',
        tags: ['models'],
        summary: 'Delete a model from a provider',
      },
    })
    .input(
      z.object({
        organizationId: z.string().optional(),
        id: modelFullIdSchema,
        type: z.enum(modelTypes),
        isSystem: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = await checkPermissions(ctx, input.organizationId, input.isSystem)

      const { providerId, modelId } = splitModelFullId(input.id)

      const providerModels = await ctx.db.query.ProviderModels.findFirst({
        where: and(
          input.isSystem
            ? eq(ProviderModels.isSystem, true)
            : input.organizationId
              ? eq(ProviderModels.organizationId, input.organizationId)
              : eq(ProviderModels.userId, userId!),
          eq(ProviderModels.providerId, providerId),
        ),
      })

      if (!providerModels) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider models not found',
        })
      }

      const modelsKey = `${input.type}Models` as const
      const existingModels = providerModels.models[modelsKey]

      if (!existingModels?.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Model not found',
        })
      }

      // Find and remove the model by id
      const deletedModel = existingModels.find((model) => model.id === modelId)
      if (!deletedModel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Model not found',
        })
      }

      // Update the models array
      providerModels.models[modelsKey] = existingModels.filter((model) => model.id !== modelId)

      // Update the database record
      await ctx.db
        .update(ProviderModels)
        .set({ models: providerModels.models })
        .where(eq(ProviderModels.id, providerModels.id))

      return {
        model: {
          ...deletedModel,
          id: input.id,
          isSystem: providerModels.isSystem,
        },
      }
    }),

  /**
   * Delete multiple models from a provider.
   * Accessible by authenticated users.
   * @returns Success message with deleted model ids
   */
  deleteModels: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/models/batch',
        tags: ['models'],
        summary: 'Delete multiple models from a provider',
      },
    })
    .input(
      z.object({
        organizationId: z.string().optional(),
        providerId: providerIdSchema,
        ids: z.array(modelFullIdSchema),
        type: z.enum(modelTypes),
        isSystem: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = await checkPermissions(ctx, input.organizationId, input.isSystem)

      // Extract modelIds from the full model ids
      const modelIds = input.ids.map((id) => {
        const { providerId, modelId } = splitModelFullId(id)
        if (providerId !== input.providerId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Model id ${id} has providerId ${providerId}, but expected ${input.providerId}`,
          })
        }
        return modelId
      })

      const providerModels = await ctx.db.query.ProviderModels.findFirst({
        where: and(
          input.isSystem
            ? eq(ProviderModels.isSystem, true)
            : input.organizationId
              ? eq(ProviderModels.organizationId, input.organizationId)
              : eq(ProviderModels.userId, userId!),
          eq(ProviderModels.providerId, input.providerId),
        ),
      })

      if (!providerModels) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider models not found',
        })
      }

      const modelsKey = `${input.type}Models` as const
      const existingModels = providerModels.models[modelsKey]

      if (!existingModels?.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No models found to delete`,
        })
      }

      // Find and remove models by modelIds
      const deletedModels = existingModels.filter((model) => modelIds.includes(model.id))
      if (deletedModels.length !== modelIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Not all models found for deletion',
        })
      }

      // Update the models array
      providerModels.models[modelsKey] = existingModels.filter(
        (model) => !modelIds.includes(model.id),
      )

      // Update the database record
      await ctx.db
        .update(ProviderModels)
        .set({ models: providerModels.models })
        .where(eq(ProviderModels.id, providerModels.id))

      return {
        models: deletedModels.map((model) => ({
          ...model,
          id: modelFullId(input.providerId, model.id),
          isSystem: providerModels.isSystem,
        })),
      }
    }),
}

async function getProviderInfos(ctx: Context, source?: Source, organizationId?: string) {
  const userId = await checkPermissions(ctx, organizationId)

  const baseProviderInfos = getBaseProviderInfos()

  // Get provider models from database (system + user/organization)
  const providerModelsList = await ctx.db
    .select()
    .from(ProviderModels)
    .where(
      source === 'system' // only system models
        ? eq(ProviderModels.isSystem, true)
        : source === 'custom' // only user/organization customized models
          ? organizationId
            ? eq(ProviderModels.organizationId, organizationId)
            : eq(ProviderModels.userId, userId!)
          : or(
              // both system models and user/organization customized models
              eq(ProviderModels.isSystem, true),
              organizationId
                ? eq(ProviderModels.organizationId, organizationId)
                : eq(ProviderModels.userId, userId!),
            ),
    )

  // Separate system and user/organization models
  const systemProviderModels = new Map<string, ProviderModels>()
  const userOrgProviderModels = new Map<string, ProviderModels>()
  for (const providerModels of providerModelsList) {
    const map = providerModels.isSystem ? systemProviderModels : userOrgProviderModels
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
    const system = systemProviderModels.get(providerInfo.id)
    const userOrg = userOrgProviderModels.get(providerInfo.id)
    const { shouldUpdateUserOrg, ...models } = mergeModels(
      system?.models,
      userOrg?.models, // may be updated in place if deduplicated
    )
    providers.push({
      ...providerInfo,
      ...models,
    })

    if (shouldUpdateUserOrg && userOrg) {
      const models = userOrg.models
      if (
        models.languageModels?.length ||
        models.imageModels?.length ||
        models.speechModels?.length ||
        models.transcriptionModels?.length ||
        models.textEmbeddingModels?.length
      ) {
        updateIds.push(userOrg.id)
        updateSqlChunks.push(sql`when ${ProviderModels.id} = ${userOrg.id} then ${userOrg.models}`)
      } else {
        // If all model arrays are empty, delete the record
        deleteIds.push(userOrg.id)
      }
    }
  }

  updateSqlChunks.push(sql`end)`)

  if (updateIds.length) {
    const finalSql: SQL = sql.join(updateSqlChunks, sql.raw(' '))
    await ctx.db
      .update(ProviderModels)
      .set({ models: finalSql })
      .where(inArray(ProviderModels.id, updateIds))
  }

  if (deleteIds.length) {
    await ctx.db.delete(ProviderModels).where(inArray(ProviderModels.id, deleteIds))
  }

  return providers
}

// Merge system and user/organization models, ensuring no duplicates and system models override user models
function mergeModels(
  system?: ModelInfos,
  userOrg?: ModelInfos,
): ReturnedModelInfos & {
  shouldUpdateUserOrg: boolean
} {
  let shouldUpdateUserOrg = false

  function deduplicate<T extends { id: string; isSystem?: boolean }[]>(system?: T, userOrg?: T) {
    const newUserOrg = [] as unknown as T
    const seen = new Set<string>()
    const sep = system?.length ?? 0
    const deduplicated = [...(system ?? []), ...(userOrg ?? [])]
      // ensure system models override user models
      .filter((item, index) => {
        if (seen.has(item.id)) {
          return false
        }
        if (index < sep) {
          // Mark it as system if it's from system models
          item.isSystem = true
        } else {
          // None-duplicate userOrg models
          newUserOrg.push(item)
        }
        seen.add(item.id)
        return true
      })

    // Update userOrg in place if it has fewer models than before
    if (newUserOrg.length < (userOrg?.length ?? 0)) {
      shouldUpdateUserOrg = true
      userOrg?.splice(0, userOrg.length, ...newUserOrg)
    }

    return deduplicated
  }

  return {
    languageModels: deduplicate(system?.languageModels, userOrg?.languageModels),
    imageModels: deduplicate(system?.imageModels, userOrg?.imageModels),
    speechModels: deduplicate(system?.speechModels, userOrg?.speechModels),
    transcriptionModels: deduplicate(system?.transcriptionModels, userOrg?.transcriptionModels),
    textEmbeddingModels: deduplicate(system?.textEmbeddingModels, userOrg?.textEmbeddingModels),
    shouldUpdateUserOrg,
  }
}

async function checkPermissions(ctx: Context, organizationId?: string, isSystem?: boolean) {
  const auth = ctx.auth.auth
  switch (auth?.type) {
    case 'user':
    case 'appUser':
      if (organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, organizationId)
        await scope.checkPermissions()
      } else {
        if (isSystem && auth.type === 'user' && !auth.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
          })
        }
        return auth.userId
      }
      break
    case 'apiKey':
      switch (auth.scope) {
        case 'user':
          if (organizationId) {
            const scope = OrganizationScope.fromOrganization({ db: ctx.db }, organizationId)
            await scope.checkPermissions()
          } else {
            if (isSystem && !auth.isAdmin) {
              throw new TRPCError({
                code: 'FORBIDDEN',
              })
            }
            return auth.userId
          }
          break
        default:
          if (organizationId) {
            let scope
            switch (auth.scope) {
              case 'organization':
                scope = OrganizationScope.fromOrganization(ctx, auth.organizationId)
                break
              case 'workspace':
                scope = await OrganizationScope.fromWorkspace(ctx, auth.workspaceId)
                break
              case 'app':
                scope = await OrganizationScope.fromApp(ctx, auth.appId)
                break
            }

            await scope.checkPermissions()

            if (organizationId !== scope.organizationId) {
              throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You have no permission to access this organization',
              })
            }
          } else {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `API key with '${auth.scope}' scope cannot access models owned by user`,
            })
          }
      }
  }
}
