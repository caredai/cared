import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
  getImageModelInfo,
  getLanguageModelInfo,
  getTextEmbeddingModelInfo,
  imageModelInfos,
  languageModelInfos,
  modelFullId,
  modelTypes,
  providerInfos,
  textEmbeddingModelInfos,
} from '@mindworld/providers'

import { publicProcedure } from '../trpc'

export const modelRouter = {
  /**
   * List all available model providers.
   * Accessible by anyone.
   * @returns List of providers with their basic information
   */
  listProviders: publicProcedure.query(() => {
    return {
      providers: providerInfos.map(({ id, name }) => ({ id, name })),
    }
  }),

  /**
   * List all available models across all providers.
   * Accessible by anyone.
   * @param input - Object containing model type filter
   * @returns List of models matching the type
   */
  listModels: publicProcedure
    .input(
      z.object({
        type: z.enum(modelTypes).optional(),
      }),
    )
    .query(({ input }) => {
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
    .input(
      z.object({
        providerId: z.string(),
        type: z.enum(modelTypes).optional(),
      }),
    )
    .query(({ input }) => {
      const provider = providerInfos.find((p) => p.id === input.providerId)
      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
    .input(
      z.object({
        id: z.string(),
        type: z.enum(modelTypes),
      }),
    )
    .query(({ input }) => {
      const getModelInfo = {
        language: getLanguageModelInfo,
        'text-embedding': getTextEmbeddingModelInfo,
        image: getImageModelInfo,
      }[input.type]

      const model = getModelInfo(input.id)
      if (!model) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          message: `Model ${input.id} not found`,
        })
      }

      return { model }
    }),
}
