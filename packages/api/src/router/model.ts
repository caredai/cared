import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
  getImageModelInfo,
  getImageModelInfos,
  getLanguageModelInfo,
  getLanguageModelInfos,
  getProviderInfos,
  getTextEmbeddingModelInfo,
  getTextEmbeddingModelInfos,
  modelFullId,
  modelTypes,
} from '@mindworld/providers'

import { publicProcedure } from '../trpc'

export const modelRouter = {
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
    .query(async () => {
      const providerInfos = await getProviderInfos()
      return {
        providers: providerInfos.map(({ id, name, description, icon }) => ({
          id,
          name,
          description,
          icon,
        })),
      }
    }),

  /**
   * List all available models across all providers.
   * Accessible by anyone.
   * @param input - Object containing model type filter
   * @returns List of models matching the type
   */
  listModels: publicProcedure
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
          type: z.enum(modelTypes).optional(),
        })
        .default({}),
    )
    .query(async ({ input }) => {
      const languageModelInfos = await getLanguageModelInfos()
      const textEmbeddingModelInfos = await getTextEmbeddingModelInfos()
      const imageModelInfos = await getImageModelInfos()

      if (!input.type) {
        return {
          models: {
            language: languageModelInfos,
            'text-embedding': textEmbeddingModelInfos,
            image: imageModelInfos,
          },
        }
      }

      return {
        models: {
          ...(input.type === 'language' ? { language: languageModelInfos } : {}),
          ...(input.type === 'text-embedding' ? { 'text-embedding': textEmbeddingModelInfos } : {}),
          ...(input.type === 'image' ? { image: imageModelInfos } : {}),
        },
      }
    }),

  /**
   * List all models from a specific provider.
   * Accessible by anyone.
   * @param input - Object containing provider ID and optional model type filter
   * @returns List of models from the provider
   */
  listModelsByProvider: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/providers/{providerId}/models',
        tags: ['models'],
        summary: 'List all models from a specific provider',
      },
    })
    .input(
      z.object({
        providerId: z.string(),
        type: z.enum(modelTypes).optional(),
      }),
    )
    .query(async ({ input }) => {
      const providerInfos = await getProviderInfos()
      const provider = providerInfos.find((p) => p.id === input.providerId)
      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',

          message: `Provider ${input.providerId} not found`,
        })
      }

      const models = {
        language: (provider.languageModels ?? []).map((model) => ({
          ...model,
          id: modelFullId(provider.id, model.id),
        })),
        'text-embedding': (provider.textEmbeddingModels ?? []).map((model) => ({
          ...model,
          id: modelFullId(provider.id, model.id),
        })),
        image: (provider.imageModels ?? []).map((model) => ({
          ...model,
          id: modelFullId(provider.id, model.id),
        })),
      }

      if (!input.type) {
        return { models }
      }

      return {
        models: {
          ...(input.type === 'language' ? { language: models.language } : {}),
          ...(input.type === 'text-embedding'
            ? { 'text-embedding': models['text-embedding'] }
            : {}),
          ...(input.type === 'image' ? { image: models.image } : {}),
        },
      }
    }),

  /**
   * Get detailed information about a specific model.
   * Accessible by anyone.
   * @param input - Object containing model full ID and type
   * @returns The model information if found
   */
  getModel: publicProcedure
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
        id: z.string(),
        type: z.enum(modelTypes),
      }),
    )
    .query(async ({ input }) => {
      const getModelInfo = {
        language: getLanguageModelInfo,
        'text-embedding': getTextEmbeddingModelInfo,
        image: getImageModelInfo,
      }[input.type]

      const model = await getModelInfo(input.id)
      if (!model) {
        throw new TRPCError({
          code: 'NOT_FOUND',

          message: `Model ${input.id} not found`,
        })
      }

      return { model }
    }),
}
