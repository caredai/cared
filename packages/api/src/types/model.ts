import { z } from 'zod/v4'

import {
  embeddingModelInfoSchema,
  imageModelInfoSchema,
  languageModelInfoSchema,
  modelFullIdSchema,
  speechModelInfoSchema,
  transcriptionModelInfoSchema,
} from '@cared/providers'

export type UpdateModelArgs = z.infer<typeof updateModelArgsSchema>

export const updateModelArgsSchema = z.discriminatedUnion('type', [
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
])

export type UpdateModelsArgs = z.infer<typeof updateModelsArgsSchema>

export const updateModelsArgsSchema = z.discriminatedUnion('type', [
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
])
