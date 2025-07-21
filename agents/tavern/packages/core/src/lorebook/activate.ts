import type { LorebookSettings } from '../settings'
import type { ReducedLorebook } from '../types'
import type { LorebookEntry } from './types'

enum ScanState {
  NONE = 'NONE',
  INITIAL = 'INITIAL',
  RECURSION = 'RECURSION',
  MIN_ACTIVATIONS = 'MIN_ACTIVATIONS',
}

export function activateLorebookInfo({
  lorebooks,
  chatId,
  characterId,
  groupId,
  personaId,
  global,
  settings,
}: {
  lorebooks: ReducedLorebook[]
  chatId: string
  characterId: string
  groupId?: string
  personaId: string
  global: string[]
  settings: LorebookSettings
}) {
  const {activatedLorebookEntries: entries} = activateLorebooks({
    lorebooks,
    chatId,
    characterId,
    groupId,
    personaId,
    global,
    settings,
  })
  if (!entries.length) {
    return
  }

  let scanState = ScanState.INITIAL
  let count = 0

  while (scanState) {
    if (settings.maxRecursionSteps && count >= settings.maxRecursionSteps) {
      console.debug(
        `[Lorebook] Stopping scan after ${count} steps, maxRecursionSteps reached.`,
      )
      break
    }

    // Track how many times the loop has run.
    count++;

    console.debug(`[Lorebook] --- LOOP #${count} START ---`)
    console.debug(`[Lorebook] Scan state: ${scanState}`)

    // Until decided otherwise, we set the loop to stop scanning after this.
    let nextScanState = ScanState.NONE;

    // Loop and find all entries that can activate here.
    let activatedNow = new Set();
  }
}

export function activateLorebooks({
  lorebooks,
  chatId,
  characterId,
  groupId,
  personaId,
  global,
  settings,
}: {
  lorebooks: ReducedLorebook[]
  chatId: string
  characterId: string
  groupId?: string
  personaId: string
  global: string[]
  settings: LorebookSettings
}) {
  const globalLorebooks: ReducedLorebook[] = []
  const chatLorebooks: ReducedLorebook[] = []
  const personaLorebooks: ReducedLorebook[] = []
  const groupLorebooks: ReducedLorebook[] = []
  let characterLorebooks: ReducedLorebook[] = []
  const characterPrimaryLorebooks: ReducedLorebook[] = []

  for (const lorebook of lorebooks) {
    if (global.includes(lorebook.id)) {
      globalLorebooks.push(lorebook)
    } else if (lorebook.chatIds.includes(chatId)) {
      chatLorebooks.push(lorebook)
    } else if (lorebook.personaIds.includes(personaId)) {
      personaLorebooks.push(lorebook)
    } else if (groupId && lorebook.groupIds.includes(groupId)) {
      groupLorebooks.push(lorebook)
    } else if (lorebook.primaryCharacterIds.includes(characterId)) {
      characterPrimaryLorebooks.push(lorebook)
    } else if (lorebook.characterIds.includes(characterId)) {
      characterLorebooks.push(lorebook)
    }
  }

  console.log(
    `[Lorebook] Activated lorebooks,`,
    `global: '${globalLorebooks.map((l) => l.name).join(', ')}',`,
    `chat: '${chatLorebooks.map((l) => l.name).join(', ')}',`,
    `persona: '${personaLorebooks.map((l) => l.name).join(', ')}',`,
    `group: '${groupLorebooks.map((l) => l.name).join(', ')}',`,
    `character primary: '${characterPrimaryLorebooks.map((l) => l.name).join(', ')}',`,
    `character: '${characterLorebooks.map((l) => l.name).join(', ')}'`,
  )

  characterLorebooks = [
    ...groupLorebooks,
    ...characterPrimaryLorebooks,
    ...characterLorebooks,
  ]

  const activatedLorebooks: ReducedLorebook[] = [
    ...chatLorebooks,
    ...personaLorebooks,
  ]
  if (settings.insertionStrategy === 'character_first') {
    activatedLorebooks.push(...characterLorebooks, ...globalLorebooks)
  } else {
    activatedLorebooks.push(...globalLorebooks, ...characterLorebooks)
  }

  function sort(a: LorebookEntry, b: LorebookEntry) {
    return b.order - a.order
  }

  const activatedLorebookEntries = [
    ...chatLorebooks
      .map((l) => l.entries)
      .flat()
      .sort(sort),
    ...personaLorebooks
      .map((l) => l.entries)
      .flat()
      .sort(sort),
  ]
  switch (settings.insertionStrategy) {
    case 'character_first':
      activatedLorebookEntries.push(
        ...characterLorebooks
          .map((l) => l.entries)
          .flat()
          .sort(sort),
        ...globalLorebooks
          .map((l) => l.entries)
          .flat()
          .sort(sort),
      )
      break
    case 'global_first':
      activatedLorebookEntries.push(
        ...globalLorebooks
          .map((l) => l.entries)
          .flat()
          .sort(sort),
        ...characterLorebooks
          .map((l) => l.entries)
          .flat()
          .sort(sort),
      )
      break
    default:
      activatedLorebookEntries.push(
        ...[...globalLorebooks, ...characterLorebooks]
          .map((l) => l.entries)
          .flat()
          .sort(sort),
      )
      break
  }

  return {
    activatedLorebooks,
    activatedLorebookEntries: structuredClone(activatedLorebookEntries),
  }
}
