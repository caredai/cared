import type { ModelPreset } from '../model-preset'
import type { LorebookSettings, TagsSettings } from '../settings'
import type { ReducedCharacter, ReducedGroup, ReducedLorebook, ReducedMessage } from '../types'
import type { GlobalScanData } from './scan-buffer'
import type { LorebookEntryExtended, TimedEffects } from './timed-effects'
import type { LorebookEntry } from './types'
import { getRegexedString, RegexPlacement } from '../regex'
import { hashAny } from '../utils'
import { ScanBuffer } from './scan-buffer'
import { TimedEffectsManager } from './timed-effects'
import { Position, SelectiveLogic } from './types'

export enum ScanState {
  NONE = 'NONE',
  INITIAL = 'INITIAL',
  RECURSION = 'RECURSION',
  MIN_ACTIVATIONS = 'MIN_ACTIVATIONS',
}

export const DEFAULT_DEPTH = 4

export async function activateLorebookInfo({
  lorebooks,
  chatHistory,
  timedEffects,
  character,
  group,
  chatId,
  characterId,
  groupId,
  personaId,
  global,
  modelPreset,
  lorebookSettings,
  tagsSettings,
  globalScanData,
  substituteMacros,
  countTokens,
}: {
  lorebooks: ReducedLorebook[]
  chatHistory: ReducedMessage[]
  timedEffects: TimedEffects
  character: ReducedCharacter
  group?: ReducedGroup
  chatId: string
  characterId: string
  groupId?: string
  personaId: string
  global: string[]
  modelPreset: ModelPreset
  lorebookSettings: LorebookSettings
  tagsSettings: TagsSettings
  globalScanData: GlobalScanData
  substituteMacros: (content: string) => string
  countTokens: (text: string) => Promise<number>
}) {
  if (!modelPreset.maxContext) {
    return
  }

  const buffer = new ScanBuffer(
    chatHistory.map((msg) =>
      msg.content.parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('\n'),
    ),
    globalScanData,
    lorebookSettings,
  )

  let budget = Math.round((lorebookSettings.context * modelPreset.maxContext) / 100) || 1
  if (lorebookSettings.budgetCap && budget > lorebookSettings.budgetCap) {
    console.debug(
      `[Lorebook] Budget ${budget} exceeds cap ${lorebookSettings.budgetCap}, using cap`,
    )
    budget = lorebookSettings.budgetCap
  }
  console.debug(
    `[Lorebook] Context size: ${modelPreset.maxContext}; Lorebook budget: ${budget} (max% = ${lorebookSettings.context}%, cap = ${lorebookSettings.budgetCap})`,
  )

  const { activatedLorebookEntries: sortedEntries } = activateLorebooks({
    lorebooks,
    chatId,
    characterId,
    groupId,
    personaId,
    global,
    settings: lorebookSettings,
  })
  if (!sortedEntries.length) {
    return
  }

  const timedEffectsManager = new TimedEffectsManager(
    timedEffects,
    chatHistory.length,
    sortedEntries,
  )
  timedEffectsManager.checkTimedEffects()

  const tags = new Set(tagsSettings.tagMap[character.id])
  if (group) {
    tagsSettings.tagMap[group.id]?.forEach((tag) => tags.add(tag))
  }

  let scanState = ScanState.INITIAL
  let count = 0
  const allActivatedEntries = new Map<string, LorebookEntryExtended>()
  const failedProbabilityChecks = new Set<string>()
  let allActivatedText = ''
  let tokenBudgetOverflowed = false

  const availableRecursionDelayLevels = [
    ...new Set(
      sortedEntries
        .filter((entry) => entry.delayUntilRecursion)
        .map((entry) =>
          entry.delayUntilRecursion === true ? 1 : (entry.delayUntilRecursion as number),
        ),
    ),
  ].sort((a, b) => a - b)
  // Already preset with the first level
  let currentRecursionDelayLevel = availableRecursionDelayLevels.shift() ?? 0
  if (currentRecursionDelayLevel > 0 && availableRecursionDelayLevels.length) {
    console.debug(
      `[Lorebook] Preparing first delayed recursion level: ${currentRecursionDelayLevel}. Still delayed: ${availableRecursionDelayLevels.join(', ')}`,
    )
  }

  while (scanState !== ScanState.NONE) {
    if (lorebookSettings.maxRecursionSteps && count >= lorebookSettings.maxRecursionSteps) {
      console.debug(`[Lorebook] Stopping scan after ${count} steps, maxRecursionSteps reached.`)
      break
    }

    // Track how many times the loop has run.
    count++

    console.debug(`[Lorebook] --- LOOP #${count} START ---`)
    console.debug(`[Lorebook] Scan state: ${scanState}`)

    // Until decided otherwise, we set the loop to stop scanning after this.
    let nextScanState = ScanState.NONE

    // Loop and find all entries that can activate here.
    const activatedNow = new Set<LorebookEntryExtended>()

    for (const entry of sortedEntries) {
      // Logging preparation
      let headerLogged = false

      function log(...args: any[]) {
        if (!headerLogged) {
          console.debug(`[Lorebook] Entry ${entry.uid} from '${entry.lorebook}' processing`, entry)
          headerLogged = true
        }
        console.debug(`[Lorebook] Entry ${entry.uid}`, ...args)
      }

      // Already processed, considered and then skipped entries should still be skipped
      if (
        failedProbabilityChecks.has(entry.hash) ||
        allActivatedEntries.has(`${entry.lorebook}.${entry.uid}`)
      ) {
        continue
      }

      if (entry.disabled) {
        log('disabled')
        continue
      }

      // Check if this entry applies to the character or if it's excluded
      if (entry.characterFilter && entry.characterFilter.names.length > 0) {
        const nameIncluded = entry.characterFilter.names.includes(character.id)
        const filtered = entry.characterFilter.isExclude ? nameIncluded : !nameIncluded
        if (filtered) {
          log('filtered out by character')
          continue
        }
      }

      if (entry.characterFilter && entry.characterFilter.tags.length > 0) {
        const includesTag = entry.characterFilter.tags.some((tag) => tags.has(tag))
        const filtered = entry.characterFilter.isExclude ? includesTag : !includesTag
        if (filtered) {
          log('filtered out by tag')
          continue
        }
      }

      const isSticky = timedEffectsManager.isEffectActive('sticky', entry)
      const isCooldown = timedEffectsManager.isEffectActive('cooldown', entry)
      const isDelay = timedEffectsManager.isEffectActive('delay', entry)

      if (isDelay) {
        log('suppressed by delay')
        continue
      }
      if (isCooldown && !isSticky) {
        log('suppressed by cooldown')
        continue
      }

      // Only use checks for recursion flags if the scan step was activated by recursion
      if (scanState !== ScanState.RECURSION && entry.delayUntilRecursion && !isSticky) {
        log('suppressed by delay until recursion')
        continue
      }

      if (
        scanState === ScanState.RECURSION &&
        entry.delayUntilRecursion &&
        Number(entry.delayUntilRecursion) > currentRecursionDelayLevel &&
        !isSticky
      ) {
        log(
          `suppressed by delay until recursion level: ${entry.delayUntilRecursion}. Currently: ${currentRecursionDelayLevel}`,
        )
        continue
      }

      if (
        scanState === ScanState.RECURSION &&
        lorebookSettings.recursiveScan &&
        entry.excludeRecursion &&
        !isSticky
      ) {
        log('suppressed by exclude recursion')
        continue
      }

      // TODO

      // Now do checks for immediate activations
      if (entry.constant) {
        log('activated because of constant')
        activatedNow.add(entry)
        continue
      }

      if (isSticky) {
        log('activated because active sticky')
        activatedNow.add(entry)
        continue
      }

      if (!entry.keys.length) {
        log('has no keys defined, skipped')
        continue
      }

      const textToScan = buffer.get(entry, scanState)

      const primaryKeyMatch = entry.keys.find((key) => {
        const substituted = substituteMacros(key)
        return substituted && buffer.matchKeys(textToScan, substituted.trim(), entry)
      })
      if (!primaryKeyMatch) {
        continue
      }

      const hasSecondaryKeywords = entry.selective && !!entry.secondaryKeys?.length

      if (!hasSecondaryKeywords) {
        log('activated by primary key match', primaryKeyMatch)
        activatedNow.add(entry)
        continue
      }

      log(
        `Entry with primary key match '${primaryKeyMatch}' has secondary keywords. Checking with logic '${entry.selectiveLogic}'`,
      )

      function matchSecondaryKeys() {
        let hasAnyMatch = false
        let hasAllMatch = true
        for (const secondaryKey of entry.secondaryKeys ?? []) {
          const secondarySubstituted = substituteMacros(secondaryKey)
          const hasSecondaryMatch =
            secondarySubstituted && buffer.matchKeys(textToScan, secondarySubstituted.trim(), entry)

          if (hasSecondaryMatch) hasAnyMatch = true
          if (!hasSecondaryMatch) hasAllMatch = false

          // Simplified AND ANY / NOT ALL if statement. (Proper fix for PR#1356 by Bronya)
          // If AND ANY logic and the main checks pass OR if NOT ALL logic and the main checks do not pass
          if (entry.selectiveLogic === SelectiveLogic.AND_ANY && hasSecondaryMatch) {
            log(`activated. (AND ANY) Found match secondary keyword: ${secondarySubstituted}`)
            return true
          }
          if (entry.selectiveLogic === SelectiveLogic.NOT_ALL && !hasSecondaryMatch) {
            log(
              `activated. (NOT ALL) Found not matching secondary keyword': ${secondarySubstituted}`,
            )
            return true
          }
        }

        // Handle NOT ANY logic
        if (entry.selectiveLogic === SelectiveLogic.NOT_ANY && !hasAnyMatch) {
          log(
            `activated. (NOT ANY) No secondary keywords found: ${entry.secondaryKeys?.join(', ')}`,
          )
          return true
        }

        // Handle AND ALL logic
        if (entry.selectiveLogic === SelectiveLogic.AND_ALL && hasAllMatch) {
          log(
            `activated. (AND ALL) All secondary keywords found: ${entry.secondaryKeys?.join(', ')}`,
          )
          return true
        }

        return false
      }

      const matched = matchSecondaryKeys()
      if (!matched) {
        log(`skipped. Secondary keywords not satisfied: ${entry.secondaryKeys?.join(', ')}`)
        continue
      }

      activatedNow.add(entry)
    }

    console.debug(`[Lorebook] Search done. Found ${activatedNow.size} possible entries.`)

    const newEntries = [...activatedNow].sort((a, b) => {
      const isASticky = timedEffectsManager.isEffectActive('sticky', a) ? 1 : 0
      const isBSticky = timedEffectsManager.isEffectActive('sticky', b) ? 1 : 0
      return isBSticky - isASticky || sortedEntries.indexOf(a) - sortedEntries.indexOf(b)
    })

    let newContent = ''
    const textToScanTokens = await countTokens(allActivatedText)

    function filterByInclusionGroups() {
      console.debug('[WI] --- INCLUSION GROUP CHECKS ---')

      const grouped = newEntries
        .filter((x) => x.group)
        .reduce(
          (acc, item) => {
            item.group
              .split(/,\s*/)
              .filter((x) => x)
              .forEach((group) => {
                if (!acc[group]) {
                  acc[group] = []
                }
                acc[group].push(item)
              })
            return acc
          },
          {} as Record<string, LorebookEntryExtended[]>,
        )

      if (Object.keys(grouped).length === 0) {
        console.debug('[Lorebook] No inclusion groups found')
        return
      }

      const removeEntry = (entry: LorebookEntryExtended) =>
        newEntries.splice(newEntries.indexOf(entry), 1)

      function removeAllBut(
        group: LorebookEntryExtended[],
        chosen?: LorebookEntryExtended,
        logging = true,
      ) {
        for (const entry of group) {
          if (entry === chosen) {
            continue
          }

          if (logging)
            console.debug(
              `[Lorebook] Entry ${entry.uid}`,
              `removed as loser from inclusion group '${entry.group}'`,
              entry,
            )
          removeEntry(entry)
        }
      }

      function filterGroupsByTimedEffects() {
        const hasStickyMap = new Map<string, boolean>()

        for (const [key, group] of Object.entries(grouped)) {
          hasStickyMap.set(key, false)

          // If the group has any sticky entries, leave only the sticky entries
          const stickyEntries = group.filter((x) => timedEffectsManager.isEffectActive('sticky', x))
          if (stickyEntries.length) {
            for (const entry of group) {
              if (stickyEntries.includes(entry)) {
                continue
              }

              console.debug(
                `[Lorebook] Entry ${entry.uid}`,
                `removed as a non-sticky loser from inclusion group '${key}'`,
                entry,
              )
              removeEntry(entry)
            }

            hasStickyMap.set(key, true)
          }

          const cooldownEntries = group.filter((x) =>
            timedEffectsManager.isEffectActive('cooldown', x),
          )
          if (cooldownEntries.length) {
            console.debug(
              `[WI] Inclusion group '${key}' has entries on cooldown. They will be removed.`,
              cooldownEntries,
            )
            for (const entry of cooldownEntries) {
              removeEntry(entry)
            }
          }

          const delayEntries = group.filter((x) => timedEffectsManager.isEffectActive('delay', x))
          if (delayEntries.length) {
            console.debug(
              `[WI] Inclusion group '${key}' has entries with delay. They will be removed.`,
              delayEntries,
            )
            for (const entry of delayEntries) {
              removeEntry(entry)
            }
          }
        }

        return hasStickyMap
      }

      const hasStickyMap = filterGroupsByTimedEffects()

      function filterGroupsByScoring() {
        for (const [key, group] of Object.entries(grouped)) {
          // Group scoring is disabled both globally and for the group entries
          if (!lorebookSettings.useGroupScoring && !group.some((x) => x.useGroupScoring)) {
            console.debug(`[WI] Skipping group scoring for group '${key}'`)
            continue
          }

          // If the group has any sticky entries, the rest are already removed by the timed effects filter
          const hasAnySticky = hasStickyMap.get(key)
          if (hasAnySticky) {
            console.debug(`[WI] Skipping group scoring check, group '${key}' has sticky entries`)
            continue
          }

          const scores = group.map((entry) => buffer.getScore(entry, scanState))
          const maxScore = Math.max(...scores)
          console.debug(`[WI] Group '${key}' max score:`, maxScore)
          //console.table(group.map((entry, i) => ({ uid: entry.uid, key: JSON.stringify(entry.key), score: scores[i] })));

          for (let i = 0; i < group.length; i++) {
            const isScored = group[i]!.useGroupScoring ?? lorebookSettings.useGroupScoring

            if (!isScored) {
              continue
            }

            if (scores[i]! < maxScore) {
              console.debug(
                `[WI] Entry ${group[i]!.uid}`,
                `removed as score loser from inclusion group '${key}'`,
                group[i],
              )
              removeEntry(group[i]!)
              group.splice(i, 1)
              scores.splice(i, 1)
              i--
            }
          }
        }
      }

      filterGroupsByScoring()

      for (const [key, group] of Object.entries(grouped)) {
        console.debug(`[WI] Checking inclusion group '${key}' with ${group.length} entries`, group)

        // If the group has any sticky entries, the rest are already removed by the timed effects filter
        const hasAnySticky = hasStickyMap.get(key)
        if (hasAnySticky) {
          console.debug(`[WI] Skipping inclusion group check, group '${key}' has sticky entries`)
          continue
        }

        if (Array.from(allActivatedEntries.values()).some((x) => x.group === key)) {
          console.debug(`[WI] Skipping inclusion group check, group '${key}' was already activated`)
          // We need to forcefully deactivate all other entries in the group
          removeAllBut(group, undefined, false)
          continue
        }

        if (!Array.isArray(group) || group.length <= 1) {
          console.debug('[WI] Skipping inclusion group check, only one entry')
          continue
        }

        // Check for group prio
        const prios = group.filter((x) => x.groupOverride).sort(sort)
        if (prios.length) {
          console.debug(
            `[WI] Entry ${prios[0]!.uid}`,
            `activated as prio winner from inclusion group '${key}'`,
            prios[0],
          )
          removeAllBut(group, prios[0])
          continue
        }

        // Do weighted random using entry's weight
        const totalWeight = group.reduce((acc, item) => acc + item.groupWeight, 0)
        const rollValue = Math.random() * totalWeight
        let currentWeight = 0
        let winner = null

        for (const entry of group) {
          currentWeight += entry.groupWeight

          if (rollValue <= currentWeight) {
            console.debug(
              `[WI] Entry ${entry.uid}`,
              `activated as roll winner from inclusion group '${key}'`,
              entry,
            )
            winner = entry
            break
          }
        }

        if (!winner) {
          console.debug(`[WI] Failed to activate inclusion group '${key}', no winner found`)
          continue
        }

        // Remove every group item from newEntries but the winner
        removeAllBut(group, winner)
      }
    }

    filterByInclusionGroups()

    console.debug('[WI] --- PROBABILITY CHECKS ---')
    if (!newEntries.length) {
      console.debug('[WI] No probability checks to do')
    }

    for (const entry of newEntries) {
      function verifyProbability() {
        // If we don't need to roll, it's always true
        if (!entry.useProbability || entry.probability === 100) {
          console.debug(`WI entry ${entry.uid} does not use probability`)
          return true
        }

        const isSticky = timedEffectsManager.isEffectActive('sticky', entry)
        if (isSticky) {
          console.debug(`WI entry ${entry.uid} is sticky, does not need to re-roll probability`)
          return true
        }

        const rollValue = Math.random() * 100
        if (rollValue <= entry.probability) {
          console.debug(`WI entry ${entry.uid} passed probability check of ${entry.probability}%`)
          return true
        }

        failedProbabilityChecks.add(entry.hash)
        return false
      }

      const success = verifyProbability()
      if (!success) {
        console.debug(
          `WI entry ${entry.uid} failed probability check, removing from activated entries`,
          entry,
        )
        continue
      }

      // Substitute macros inline, for both this checking and also future processing
      entry.content = substituteMacros(entry.content)
      newContent += `${entry.content}\n`

      if (textToScanTokens + (await countTokens(newContent)) >= budget) {
        console.debug('[WI] --- BUDGET OVERFLOW CHECK ---')
        if (lorebookSettings.alertOnOverflow) {
          console.warn(
            `[WI] budget of ${budget} reached, stopping after ${allActivatedEntries.size} entries`,
          )
        } else {
          console.debug(
            `[WI] budget of ${budget} reached, stopping after ${allActivatedEntries.size} entries`,
          )
        }
        tokenBudgetOverflowed = true
        break
      }

      allActivatedEntries.set(`${entry.lorebook}.${entry.uid}`, entry)
      console.debug(`[WI] Entry ${entry.uid} activation successful, adding to prompt`, entry)
    }

    const successfulNewEntries = newEntries.filter((x) => !failedProbabilityChecks.has(x.hash))
    const successfulNewEntriesForRecursion = successfulNewEntries.filter((x) => !x.preventRecursion)

    console.debug(`[WI] --- LOOP #${count} RESULT ---`)
    if (!newEntries.length) {
      console.debug('[WI] No new entries activated.')
    } else if (!successfulNewEntries.length) {
      console.debug(
        '[WI] Probability checks failed for all activated entries. No new entries activated.',
      )
    } else {
      console.debug(
        `[WI] Successfully activated ${successfulNewEntries.length} new entries to prompt. ${allActivatedEntries.size} total entries activated.`,
        successfulNewEntries,
      )
    }

    function logNextState(...args: any[]) {
      if (args.length) {
        console.debug(...args)
      }
      console.debug(`[Lorebook] Setting scan state: ${scanState}`)
    }

    // After processing and rolling entries are done, see if we should continue with normal recursion
    if (
      lorebookSettings.recursiveScan &&
      !tokenBudgetOverflowed &&
      successfulNewEntriesForRecursion.length
    ) {
      nextScanState = ScanState.RECURSION
      logNextState(
        '[WI] Found',
        successfulNewEntriesForRecursion.length,
        'new entries for recursion',
      )
    }

    // If we are inside min activations scan, and we have recursive buffer, we should do a recursive scan before increasing the buffer again
    // There might be recurse-trigger-able entries that match the buffer, so we need to check that
    if (
      lorebookSettings.recursiveScan &&
      !tokenBudgetOverflowed &&
      scanState === ScanState.MIN_ACTIVATIONS &&
      buffer.hasRecurse()
    ) {
      nextScanState = ScanState.RECURSION
      logNextState(
        '[WI] Min Activations run done, whill will always be followed by a recursive scan',
      )
    }

    // If scanning is planned to stop, but min activations is set and not satisfied, check if we should continue
    const minActivationsNotSatisfied =
      lorebookSettings.minActivations > 0 &&
      allActivatedEntries.size < lorebookSettings.minActivations
    if (nextScanState === ScanState.NONE && !tokenBudgetOverflowed && minActivationsNotSatisfied) {
      console.debug('[WI] --- MIN ACTIVATIONS CHECK ---')

      const over_max =
        (lorebookSettings.maxDepth > 0 && buffer.getDepth() > lorebookSettings.maxDepth) ||
        buffer.getDepth() > chatHistory.length

      if (!over_max) {
        nextScanState = ScanState.MIN_ACTIVATIONS // loop
        logNextState(
          `[WI] Min activations not reached (${allActivatedEntries.size}/${lorebookSettings.minActivations}), advancing depth to ${buffer.getDepth() + 1}, starting another scan`,
        )
        buffer.advanceScan()
      } else {
        console.debug(
          `[WI] Min activations not reached (${allActivatedEntries.size}/${lorebookSettings.minActivations}), but reached on of depth. Stopping`,
        )
      }
    }

    // If the scan is done, but we still have open "delay until recursion" levels, we should continue with the next one
    if (nextScanState === ScanState.NONE && availableRecursionDelayLevels.length) {
      nextScanState = ScanState.RECURSION
      currentRecursionDelayLevel = availableRecursionDelayLevels.shift() ?? 0
      logNextState(
        '[WI] Open delayed recursion levels left. Preparing next delayed recursion level',
        currentRecursionDelayLevel,
        '. Still delayed:',
        availableRecursionDelayLevels,
      )
    }

    // Final check if we should really continue scan, and extend the current WI recurse buffer
    scanState = nextScanState
    if (scanState === ScanState.NONE) {
      const text = successfulNewEntriesForRecursion.map((x) => x.content).join('\n')
      if (text) {
        buffer.addRecurse(text)
        allActivatedText = text + '\n' + allActivatedText
      }
    } else {
      logNextState('[Lorebook] Scan done. No new entries to prompt. Stopping.')
    }
  }

  console.debug('[WI] --- BUILDING PROMPT ---')

  const WIBeforeEntries: string[] = []
  const WIAfterEntries: string[] = []
  const EMEntries: {
    position: 'before' | 'after'
    content: string
  }[] = []
  const ANTopEntries: string[] = []
  const ANBottomEntries: string[] = []
  const WIDepthEntries: {
    depth: number
    entries: string[]
    role: 'system' | 'user' | 'assistant'
  }[] = []

  const sortedAllActivatedEntries = [...allActivatedEntries.values()].sort(sort)
  for (const entry of sortedAllActivatedEntries) {
    const regexDepth =
      entry.position === Position.AtDepth ? (entry.depth ?? DEFAULT_DEPTH) : undefined
    // TODO
    const content = getRegexedString(
      [],
      entry.content,
      RegexPlacement.WORLD_INFO,
      substituteMacros,
      { depth: regexDepth, isPrompt: true },
    )

    if (!content) {
      console.debug(
        `[WI] Entry ${entry.uid}`,
        'skipped adding to prompt due to empty content',
        entry,
      )
      return
    }

    switch (entry.position) {
      case Position.Before:
        WIBeforeEntries.unshift(content)
        break
      case Position.After:
        WIAfterEntries.unshift(content)
        break
      case Position.EMTop:
        EMEntries.unshift({ position: 'before', content: content })
        break
      case Position.EMBottom:
        EMEntries.unshift({ position: 'after', content: content })
        break
      case Position.ANTop:
        ANTopEntries.unshift(content)
        break
      case Position.ANBottom:
        ANBottomEntries.unshift(content)
        break
      case Position.AtDepth: {
        const existingDepthIndex = WIDepthEntries.findIndex(
          (e) => e.depth === (entry.depth ?? DEFAULT_DEPTH) && e.role === (entry.role ?? 'system'),
        )
        if (existingDepthIndex !== -1) {
          WIDepthEntries[existingDepthIndex]!.entries.unshift(content)
        } else {
          WIDepthEntries.push({
            depth: entry.depth ?? DEFAULT_DEPTH,
            entries: [content],
            role: entry.role ?? 'system',
          })
        }
        break
      }
      default:
        break
    }
  }

  const worldInfoBefore = WIBeforeEntries.length ? WIBeforeEntries.join('\n') : ''
  const worldInfoAfter = WIAfterEntries.length ? WIAfterEntries.join('\n') : ''

  // TODO
  const shouldLorebookAddPrompt = false
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (shouldLorebookAddPrompt) {
    const originalAN = ''
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ANWithWI =
      `${ANTopEntries.join('\n')}\n${originalAN}\n${ANBottomEntries.join('\n')}`.replace(
        /(^\n)|(\n$)/g,
        '',
      )
  }

  timedEffectsManager.setTimedEffects(Array.from(allActivatedEntries.values()))

  console.log(
    `[WI] Adding ${allActivatedEntries.size} entries to prompt`,
    Array.from(allActivatedEntries.values()),
  )
  console.debug(`[WI] --- DONE ---`)

  return {
    worldInfoBefore,
    worldInfoAfter,
    EMEntries,
    WIDepthEntries,
    ANBeforeEntries: ANTopEntries,
    ANAfterEntries: ANBottomEntries,
    allActivatedEntries: new Set(allActivatedEntries.values()),
    tokenBudgetOverflowed,
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

  function getEntries(lorebooks: ReducedLorebook[]) {
    return lorebooks
      .map((l) =>
        l.entries.map((entry) => ({
          ...entry,
          lorebook: l.name,
          hash: hashAny(entry),
        })),
      )
      .flat()
      .sort(sort)
  }

  const activatedLorebookEntries = [
    ...getEntries(chatLorebooks),
    ...getEntries(personaLorebooks),
  ]
  switch (settings.insertionStrategy) {
    case 'character_first':
      activatedLorebookEntries.push(
        ...getEntries(characterLorebooks),
        ...getEntries(globalLorebooks),
      )
      break
    case 'global_first':
      activatedLorebookEntries.push(
        ...getEntries(globalLorebooks),
        ...getEntries(characterLorebooks),
      )
      break
    default:
      activatedLorebookEntries.push(...getEntries([...globalLorebooks, ...characterLorebooks]))
      break
  }

  return {
    activatedLorebooks,
    activatedLorebookEntries: structuredClone(activatedLorebookEntries),
  }
}

function sort(a: LorebookEntry, b: LorebookEntry) {
  return b.order - a.order
}
