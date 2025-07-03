import { z } from 'zod/v4'

export interface CharGroupMetadata {
  name: string
  imageUrl?: string
  activationStrategy: GroupActivationStrategy
  generationMode: GroupGenerationMode
  generationModePrefix?: string
  generationModeSuffix?: string
  allowSelfResponses: boolean
  disabledCharacters?: string[] // characters that should not auto-reply
  autoModeDelay?: number
  hideMutedSprites: boolean
}

export enum GroupActivationStrategy {
  Natural = 'natural',
  List = 'list',
  Manual = 'manual',
  Pooled = 'pooled',
}

export enum GroupGenerationMode {
  Swap = 'swap', // swap character cards
  Append = 'append', // join character cards, exclude disabled ones
  AppendDisabled = 'append-disabled', // join character cards, include disabled ones
}

export const charGroupMetadataSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().url().optional(),
  activationStrategy: z.nativeEnum(GroupActivationStrategy),
  generationMode: z.nativeEnum(GroupGenerationMode),
  generationModePrefix: z.string().optional(),
  generationModeSuffix: z.string().optional(),
  allowSelfResponses: z.boolean(),
  disabledCharacters: z.array(z.string()).optional(),
  autoModeDelay: z.number().int().min(0).optional(),
  hideMutedSprites: z.boolean(),
})
