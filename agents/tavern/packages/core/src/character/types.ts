import assert from 'assert'
import type {
  CharacterBook,
  CharacterCardV1,
  CharacterCardV2,
  CharacterCardV3,
  Lorebook,
  LorebookEntry,
} from '@risuai/ccardlib'
import { z } from 'zod'

export type { CharacterCardV1, CharacterCardV2, CharacterCardV3 } from '@risuai/ccardlib'
export type LorebookV2 = CharacterBook
export type LorebookV3 = Lorebook
export type LorebookEntryV2 = LorebookV2['entries'][number]
export type LorebookEntryV3 = LorebookEntry

export const characterCardV1Schema = z.object({
  name: z.string(),
  description: z.string(),
  personality: z.string(),
  scenario: z.string(),
  first_mes: z.string(),
  mes_example: z.string(),
})

export const lorebookEntryV2Schema = z.object({
  keys: z.array(z.string()),
  content: z.string(),
  extensions: z.record(z.any()),
  enabled: z.boolean(),
  insertion_order: z.coerce.number(),
  name: z.string().optional(),
  priority: z.coerce.number().optional(),
  id: z.coerce.number().optional(),
  comment: z.string().optional(),
  selective: z.boolean().optional(),
  secondary_keys: z.array(z.string()).optional(),
  constant: z.boolean().optional(),
  position: z.enum(['before_char', 'after_char']).optional(),
  case_sensitive: z.boolean().optional(),
})

export const lorebookV2Schema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  scan_depth: z.coerce.number().optional(),
  token_budget: z.coerce.number().optional(),
  recursive_scanning: z.boolean().optional(),
  extensions: z.record(z.any()),
  entries: z.array(lorebookEntryV2Schema),
})

export const characterCardV2Schema = z.object({
  spec: z.literal('chara_card_v2'),
  spec_version: z.literal('2.0'),
  data: z.object({
    name: z.string(),
    description: z.string(),
    personality: z.string(),
    scenario: z.string(),
    first_mes: z.string(),
    mes_example: z.string(),
    creator_notes: z.string(),
    system_prompt: z.string(),
    post_history_instructions: z.string(),
    alternate_greetings: z.array(z.string()),
    character_book: lorebookV2Schema.optional(),
    tags: z.array(z.string()),
    creator: z.string(),
    character_version: z.string(),
    extensions: z.record(z.any()),
  }),
})

export const lorebookEntryV3Schema = z.object({
  keys: z.array(z.string()),
  content: z.string(),
  extensions: z.record(z.any()),
  enabled: z.boolean(),
  insertion_order: z.coerce.number(),
  case_sensitive: z.boolean().optional(),
  use_regex: z.boolean(),
  constant: z.boolean().optional(),
  name: z.string().optional(),
  priority: z.coerce.number().optional(),
  id: z.coerce.number().optional(),
  comment: z.string().optional(),
  selective: z.boolean().optional(),
  secondary_keys: z.array(z.string()).optional(),
  position: z.enum(['before_char', 'after_char']).optional(),
})

export const lorebookV3Schema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  scan_depth: z.coerce.number().optional(),
  token_budget: z.coerce.number().optional(),
  recursive_scanning: z.boolean().optional(),
  extensions: z.record(z.any()),
  entries: z.array(lorebookEntryV3Schema),
})

export const characterCardV3Schema = z.object({
  spec: z.literal('chara_card_v3'),
  spec_version: z.literal('3.0'),
  data: z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    creator: z.string(),
    character_version: z.string(),
    mes_example: z.string(),
    extensions: z.record(z.any()),
    system_prompt: z.string(),
    post_history_instructions: z.string(),
    first_mes: z.string(),
    alternate_greetings: z.array(z.string()),
    personality: z.string(),
    scenario: z.string(),
    creator_notes: z.string(),
    character_book: lorebookV3Schema.optional(),
    assets: z
      .array(
        z.object({
          type: z.string(),
          uri: z.string(),
          name: z.string(),
          ext: z.string(),
        }),
      )
      .optional(),
    nickname: z.string().optional(),
    creator_notes_multilingual: z.record(z.string()).optional(),
    source: z.array(z.string()).optional(),
    group_only_greetings: z.array(z.string()),
    creation_date: z.coerce.number().optional(),
    modification_date: z.coerce.number().optional(),
  }),
})

export function convertToV2(
  card: CharacterCardV1 | CharacterCardV2 | CharacterCardV3,
): CharacterCardV2 {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if ((card as CharacterCardV2).spec === 'chara_card_v2') {
    const { data, spec_version } = characterCardV2Schema.deepPartial().parse(card)
    assert(spec_version === '2.0', 'invalid spec_version')

    const book = data?.character_book
    const entries = book?.entries

    return {
      spec: 'chara_card_v2' as const,
      spec_version: '2.0' as const,
      data: {
        name: data?.name ?? '',
        description: data?.description ?? '',
        personality: data?.personality ?? '',
        scenario: data?.scenario ?? '',
        first_mes: data?.first_mes ?? '',
        mes_example: data?.mes_example ?? '',
        creator_notes: data?.creator_notes ?? '',
        system_prompt: data?.system_prompt ?? '',
        post_history_instructions: data?.post_history_instructions ?? '',
        alternate_greetings: data?.alternate_greetings ?? [],
        character_book: {
          name: book?.name,
          description: book?.description,
          scan_depth: book?.scan_depth,
          token_budget: book?.token_budget,
          recursive_scanning: book?.recursive_scanning,
          extensions: book?.extensions ?? {},
          entries:
            entries?.map((entry) => ({
              keys: entry.keys ?? [],
              content: entry.content ?? '',
              extensions: entry.extensions ?? {},
              enabled: entry.enabled ?? false,
              insertion_order: entry.insertion_order ?? 0,
              name: entry.name,
              priority: entry.priority,
              id: entry.id,
              comment: entry.comment,
              selective: entry.selective,
              secondary_keys: entry.secondary_keys,
              constant: entry.constant,
              position: entry.position,
              case_sensitive: entry.case_sensitive,
            })) ?? [],
        },
        tags: data?.tags ?? [],
        creator: data?.creator ?? '',
        character_version: data?.character_version ?? '',
        extensions: data?.extensions ?? {},
      },
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if ((card as CharacterCardV3).spec === 'chara_card_v3') {
    const { data, spec_version } = characterCardV3Schema.deepPartial().parse(card)
    assert(spec_version === '3.0', 'invalid spec_version')

    const book = data?.character_book
    const entries = book?.entries

    return {
      spec: 'chara_card_v2' as const,
      spec_version: '2.0' as const,
      data: {
        name: data?.name ?? '',
        description: data?.description ?? '',
        personality: data?.personality ?? '',
        scenario: data?.scenario ?? '',
        first_mes: data?.first_mes ?? '',
        mes_example: data?.mes_example ?? '',
        creator_notes: data?.creator_notes ?? '',
        system_prompt: data?.system_prompt ?? '',
        post_history_instructions: data?.post_history_instructions ?? '',
        alternate_greetings: data?.alternate_greetings ?? [],
        character_book: {
          name: book?.name,
          description: book?.description,
          scan_depth: book?.scan_depth,
          token_budget: book?.token_budget,
          recursive_scanning: book?.recursive_scanning,
          extensions: book?.extensions ?? {},
          entries:
            entries?.map((entry) => ({
              keys: entry.keys ?? [],
              content: entry.content ?? '',
              extensions: entry.extensions ?? {},
              enabled: entry.enabled ?? false,
              insertion_order: entry.insertion_order ?? 0,
              name: entry.name,
              priority: entry.priority,
              id: entry.id,
              comment: entry.comment,
              selective: entry.selective,
              secondary_keys: entry.secondary_keys,
              constant: entry.constant,
              position: entry.position,
              case_sensitive: entry.case_sensitive,
            })) ?? [],
        },
        tags: data?.tags ?? [],
        creator: data?.creator ?? '',
        character_version: data?.character_version ?? '',
        extensions: data?.extensions ?? {},
      },
    }
  }

  const data = characterCardV1Schema.deepPartial().parse(card)
  if (data.name) {
    return {
      spec: 'chara_card_v2' as const,
      spec_version: '2.0' as const,
      data: {
        name: data.name,
        description: data.description ?? '',
        personality: data.personality ?? '',
        scenario: data.scenario ?? '',
        first_mes: data.first_mes ?? '',
        mes_example: data.mes_example ?? '',
        creator_notes: '',
        system_prompt: '',
        post_history_instructions: '',
        alternate_greetings: [],
        character_book: undefined,
        tags: [],
        creator: '',
        character_version: '',
        extensions: {},
      },
    }
  }

  throw new Error('unknown character card format')
}

export function updateWithV2(
  card: CharacterCardV1 | CharacterCardV2 | CharacterCardV3,
  newCard: CharacterCardV2,
): CharacterCardV1 | CharacterCardV2 | CharacterCardV3 {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if ((card as CharacterCardV2).spec === 'chara_card_v2') {
    return newCard
  }

  const cardV3 = card as CharacterCardV3
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (cardV3.spec === 'chara_card_v3') {
    const book =
      (cardV3.data.character_book ?? newCard.data.character_book) &&
      ({
        ...cardV3.data.character_book,
        ...newCard.data.character_book,
      } as LorebookV3)

    return {
      ...cardV3,
      data: {
        ...cardV3.data,
        ...newCard.data,
        character_book: book,
      },
    }
  }

  return {
    name: newCard.data.name,
    description: newCard.data.description,
    personality: newCard.data.personality,
    scenario: newCard.data.scenario,
    first_mes: newCard.data.first_mes,
    mes_example: newCard.data.mes_example,
  }
}

export const characterCardV2ExtensionsSchema = z.object({
  talkativeness: z.coerce.number().min(0).max(1).step(0.05),
  fav: z.boolean(),
  world: z.string(),
  depth_prompt_prompt: z.string(),
  depth_prompt_depth: z.coerce.number().int().nonnegative().max(999).step(1),
  depth_prompt_role: z.enum(['system', 'user', 'assistant']),
})

export type CharacterCardV2Extensions = z.infer<typeof characterCardV2ExtensionsSchema>

export function extractExtensions(card: CharacterCardV2): CharacterCardV2Extensions {
  const extensions = card.data.extensions
  const depthPrompt = extensions.depth_prompt

  let depthPromptRole = String(depthPrompt?.role ?? 'system')
  if (!['system', 'user', 'assistant'].includes(depthPromptRole)) {
    depthPromptRole = 'system'
  }

  return {
    talkativeness: !isNaN(Number(extensions.talkativeness))
      ? Number(extensions.talkativeness)
      : 0.5,
    fav: !!extensions.fav,
    world: String(extensions.world ?? ''), // TODO: parse world info
    depth_prompt_prompt: String(depthPrompt?.prompt ?? ''),
    depth_prompt_depth: !isNaN(Number(depthPrompt?.depth)) ? Number(depthPrompt?.depth) : 4,
    depth_prompt_role: depthPromptRole as 'system' | 'user' | 'assistant',
  }
}

export function formatExtensions(extensions: CharacterCardV2Extensions): Record<string, any> {
  return {
    talkativeness: extensions.talkativeness,
    fav: extensions.fav,
    world: extensions.world,
    depth_prompt: {
      prompt: extensions.depth_prompt_prompt,
      depth: extensions.depth_prompt_depth,
      role: extensions.depth_prompt_role,
    },
  }
}
