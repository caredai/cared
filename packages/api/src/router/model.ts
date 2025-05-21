import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
  defaultModels,
  getImageModelInfo,
  getImageModelInfos,
  getLanguageModelInfo,
  getLanguageModelInfos,
  getProviderInfos,
  getTextEmbeddingModelInfo,
  getTextEmbeddingModelInfos,
  modelFullId,
  modelTypes,
} from '@ownxai/providers'

import { publicProcedure } from '../trpc'

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
   * List all providers with their models, grouped by model type.
   * Accessible by anyone.
   * @param input - Object containing optional model type filter
   * @returns Models organized by type, each containing providers with their models
   */
  listProvidersModels: publicProcedure
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
          type: z.enum(modelTypes).optional(),
        })
        .default({}),
    )
    .query(async ({ input }) => {
      const providerInfos = await getProviderInfos()

      type Models = {
        id: string
        name: string
        description?: string
        icon?: string
        models: any[]
      }[]

      const models: Record<string, Models> = {}

      // Process language models if type is not specified or type is 'language'
      if (!input.type || input.type === 'language') {
        models.language = providerInfos
          .filter((provider) => provider.languageModels?.length)
          .map((provider) => ({
            id: provider.id,
            name: provider.name,
            description: provider.description,
            icon: provider.icon,
            models: (provider.languageModels ?? []).map((model) => ({
              ...model,
              id: modelFullId(provider.id, model.id),
            })),
          }))
      }

      // Process text-embedding models if type is not specified or type is 'text-embedding'
      if (!input.type || input.type === 'text-embedding') {
        models['text-embedding'] = providerInfos
          .filter((provider) => provider.textEmbeddingModels?.length)
          .map((provider) => ({
            id: provider.id,
            name: provider.name,
            description: provider.description,
            icon: provider.icon,
            models: (provider.textEmbeddingModels ?? []).map((model) => ({
              ...model,
              id: modelFullId(provider.id, model.id),
            })),
          }))
      }

      // Process image models if type is not specified or type is 'image'
      if (!input.type || input.type === 'image') {
        models.image = providerInfos
          .filter((provider) => provider.imageModels?.length)
          .map((provider) => ({
            id: provider.id,
            name: provider.name,
            description: provider.description,
            icon: provider.icon,
            models: (provider.imageModels ?? []).map((model) => ({
              ...model,
              id: modelFullId(provider.id, model.id),
            })),
          }))
      }

      return { models } as {
        models: {
          language?: Models
          'text-embedding'?: Models
          image?: Models
        }
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
