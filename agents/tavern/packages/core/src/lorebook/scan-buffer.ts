import type { LorebookSettings } from '../settings'
import type { LorebookEntryExtended } from './timed-effects'
import { escapeRegex } from '../utils'
import { ScanState } from './activate'
import { SelectiveLogic } from './types'

export interface GlobalScanData {
  personaDescription: string
  characterDescription: string
  characterPersonality: string
  characterDepthPrompt: string
  scenario: string
  creatorNotes: string
}

export const MAX_SCAN_DEPTH = 1000

export class ScanBuffer {
  constructor(
    messages: string[],
    private globalScanData: GlobalScanData,
    private settings: LorebookSettings,
  ) {
    let depth = 0
    for (const message of [...messages].reverse()) {
      this.depthBuffer.push(message)

      if (++depth >= MAX_SCAN_DEPTH) {
        break
      }
    }
  }

  get(entry: LorebookEntryExtended, scanState: ScanState) {
    let depth = entry.scanDepth ?? this.getDepth()
    if (depth <= this.startDepth) {
      return ''
    }
    if (depth > MAX_SCAN_DEPTH) {
      console.warn(
        `[Lorebook] Invalid lorebook scan depth ${depth}. Truncating to ${MAX_SCAN_DEPTH}`,
      )
      depth = MAX_SCAN_DEPTH
    }

    const MATCHER = '\x01'
    const JOINER = '\n' + MATCHER

    let result = MATCHER + this.depthBuffer.slice(this.startDepth, depth).join(JOINER)

    if (entry.matchPersonaDescription && this.globalScanData.personaDescription) {
      result += JOINER + this.globalScanData.personaDescription
    }
    if (entry.matchCharacterDescription && this.globalScanData.characterDescription) {
      result += JOINER + this.globalScanData.characterDescription
    }
    if (entry.matchCharacterPersonality && this.globalScanData.characterPersonality) {
      result += JOINER + this.globalScanData.characterPersonality
    }
    if (entry.matchCharacterDepthPrompt && this.globalScanData.characterDepthPrompt) {
      result += JOINER + this.globalScanData.characterDepthPrompt
    }
    if (entry.matchScenario && this.globalScanData.scenario) {
      result += JOINER + this.globalScanData.scenario
    }
    if (entry.matchCreatorNotes && this.globalScanData.creatorNotes) {
      result += JOINER + this.globalScanData.creatorNotes
    }

    if (this.injectBuffer.length > 0) {
      result += JOINER + this.injectBuffer.join(JOINER)
    }

    // Min activations should not include the recursion buffer
    if (this.recurseBuffer.length > 0 && scanState !== ScanState.MIN_ACTIVATIONS) {
      result += JOINER + this.recurseBuffer.join(JOINER)
    }

    return result
  }

  matchKeys(haystack: string, needle: string, entry: LorebookEntryExtended) {
    // If the needle is a regex, we do regex pattern matching and override all the other options
    const keyRegex = parseRegexFromString(needle)
    if (keyRegex) {
      return keyRegex.test(haystack)
    }

    // Otherwise, we do normal matching of plaintext with the chosen entry settings
    haystack = this.transformString(haystack, entry)
    const transformedString = this.transformString(needle, entry)

    const matchWholeWords = entry.matchWholeWords ?? this.settings.matchWholeWords

    if (matchWholeWords) {
      const keyWords = transformedString.split(/\s+/)

      if (keyWords.length > 1) {
        return haystack.includes(transformedString)
      } else {
        // Use custom boundaries to include punctuation and other non-alphanumeric characters
        const regex = new RegExp(`(?:^|\\W)(${escapeRegex(transformedString)})(?:$|\\W)`)
        if (regex.test(haystack)) {
          return true
        }
      }
    } else {
      return haystack.includes(transformedString)
    }

    return false
  }

  getScore(entry: LorebookEntryExtended, scanState: ScanState) {
    if (!entry.keys.length) {
      // No keys, no score
      return 0
    }

    const buffer = this.get(entry, scanState)

    let primaryScore = 0
    let secondaryScore = 0

    // Increment score for every key found in the buffer
    for (const key of entry.keys) {
      if (this.matchKeys(buffer, key, entry)) {
        primaryScore++
      }
    }

    const numberOfSecondaryKeys = entry.secondaryKeys?.length ?? 0
    if (!numberOfSecondaryKeys) {
      return primaryScore
    }

    // Increment score for every secondary key found in the buffer
    for (const key of entry.secondaryKeys ?? []) {
      if (this.matchKeys(buffer, key, entry)) {
        secondaryScore++
      }
    }

    // Only positive logic influences the score
    switch (entry.selectiveLogic) {
      // AND_ANY: Add both scores
      case SelectiveLogic.AND_ANY:
        return primaryScore + secondaryScore
      // AND_ALL: Add both scores if all secondary keys are found, otherwise only primary score
      case SelectiveLogic.AND_ALL:
        return secondaryScore === numberOfSecondaryKeys
          ? primaryScore + secondaryScore
          : primaryScore
    }

    return primaryScore
  }

  addRecurse(message: string) {
    this.recurseBuffer.push(message)
  }

  addInject(message: string) {
    this.injectBuffer.push(message)
  }

  hasRecurse() {
    return this.recurseBuffer.length > 0
  }

  advanceScan() {
    this.skew++
  }

  getDepth() {
    return this.settings.scanDepth + this.skew
  }

  private depthBuffer: string[] = []
  private recurseBuffer: string[] = []
  private injectBuffer: string[] = []

  private skew = 0

  private startDepth = 0

  private transformString(str: string, entry: LorebookEntryExtended) {
    const caseSensitive = entry.caseSensitive ?? this.settings.caseSensitive
    return caseSensitive ? str : str.toLowerCase()
  }
}

export function parseRegexFromString(input: string) {
  // Extracting the regex pattern and flags
  const match = /^\/([\w\W]+?)\/([gimsuy]*)$/.exec(input)
  if (!match) {
    return
  }

  const [, pattern, flags] = match

  // If we find any unescaped slash delimiter, we also exit out.
  // JS doesn't care about delimiters inside regex patterns, but for this to be a valid regex outside of our implementation,
  // we have to make sure that our delimiter is correctly escaped. Or every other engine would fail.
  if (/(^|[^\\])\//.exec(pattern!)) {
    return
  }

  // Now we need to actually unescape the slash delimiters, because JS doesn't care about delimiters
  const unescapedPattern = pattern!.replace('\\/', '/')

  // Then we return the regex.
  try {
    return new RegExp(unescapedPattern, flags)
  } catch {
    return
  }
}
