import type { CharacterBook, Lorebook, LorebookEntry } from '@risuai/ccardlib'

export * from './import-file'
export * from './import-url'
export * from './png-chunks'
export type { CharacterCardV1, CharacterCardV2, CharacterCardV3 } from '@risuai/ccardlib'
export { CharacterBook as LorebookV2, Lorebook as LorebookV3, LorebookEntry as LorebookEntryV3 }
export type LorebookEntryV2 = CharacterBook['entries'][number]
