import { z } from 'zod/v4'

import type { LorebookEntry } from './types'

export interface TimedEffect {
  hash: string
  start: number
  end: number
  protected: boolean
}

export interface TimedEffects {
  sticky: Record<string, TimedEffect> // lorebook entry key => sticky number
  cooldown: Record<string, TimedEffect> // lorebook entry key => cooldown number
}

export const timedEffectSchema = z.object({
  hash: z.string(),
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  protected: z.boolean(),
})

export const timedEffectsSchema = z.object({
  sticky: z.record(z.string(), timedEffectSchema),
  cooldown: z.record(z.string(), timedEffectSchema),
})

export type LorebookEntryExtended = LorebookEntry & {
  lorebook: string
  hash: string
}

export class TimedEffectsManager {
  constructor(
    private state: TimedEffects,
    private chatLength: number,
    private entries: LorebookEntryExtended[],
  ) {
    for (const entry of entries) {
      this.entryMap.set(entry.hash, entry)
    }
  }

  checkTimedEffects() {
    this.checkTimedEffectOfType('sticky')
    this.checkTimedEffectOfType('cooldown')
    this.checkDelayEffect()
  }

  isEffectActive(type: 'sticky' | 'cooldown' | 'delay', entry: LorebookEntryExtended): boolean {
    const buffer =
      type === 'sticky'
        ? this.stickyBuffer
        : type === 'cooldown'
          ? this.cooldownBuffer
          : this.delayBuffer
    return buffer.has(entry.hash)
  }

  setTimedEffects(activatedEntries: LorebookEntryExtended[]) {
    for (const entry of activatedEntries) {
      this.setTimedEffectOfType('sticky', entry)
      this.setTimedEffectOfType('cooldown', entry)
    }
  }

  finalizeTimedEffects() {
    return this.state
  }

  private entryMap = new Map<string, LorebookEntryExtended>()

  private stickyBuffer = new Map<string, LorebookEntryExtended>()
  private cooldownBuffer = new Map<string, LorebookEntryExtended>()
  private delayBuffer = new Map<string, LorebookEntryExtended>()

  private checkTimedEffectOfType(type: 'sticky' | 'cooldown') {
    const state = type === 'sticky' ? this.state.sticky : this.state.cooldown
    const buffer = type === 'sticky' ? this.stickyBuffer : this.cooldownBuffer

    for (const [key, value] of Object.entries(state)) {
      console.log(`[Lorebook] Processing ${type} entry ${key}`, value)
      const entry = this.entryMap.get(value.hash)

      if (this.chatLength <= value.start && !value.protected) {
        console.log(
          `[Lorebook] Removing ${type} entry ${key} from timed-effects state: chat not advanced`,
          value,
        )
        delete state[key]
        continue
      }

      // Missing entries (they could be from another character's lorebook)
      if (!entry) {
        if (this.chatLength >= value.end) {
          console.log(
            `[Lorebook] Removing ${type} entry from timed-effects state: entry not found and interval passed`,
            entry,
          )
          delete state[key]
        }
        continue
      }

      // Ignore invalid entries (not configured for timed effects)
      if (!entry[type]) {
        console.log(
          `[Lorebook] Removing ${type} entry from timed-effects state: entry not ${type}`,
          entry,
        )
        delete state[key]
        continue
      }

      if (this.chatLength >= value.end) {
        console.log(
          `[Lorebook] Removing ${type} entry from timed-effects state: ${type} interval passed`,
          entry,
        )
        delete state[key]

        if (type === 'sticky') {
          if (entry.cooldown) {
            const key = this.getEntryKey(entry)
            const effect = this.getEntryTimedEffect('cooldown', entry, true)
            this.state.cooldown[key] = effect
            console.log(
              `[Lorebook] Adding cooldown entry ${key} on ended sticky: start=${effect.start}, end=${effect.end}, protected=${effect.protected}`,
            )
            // Set the cooldown immediately for this evaluation
            this.cooldownBuffer.set(effect.hash, entry)
          }
        } else {
          console.debug('[Lorebook] Cooldown ended for entry', entry)
        }

        continue
      }

      buffer.set(value.hash, entry)
    }
  }

  private checkDelayEffect() {
    for (const entry of this.entries) {
      if (!entry.delay) {
        continue
      }

      if (this.chatLength < entry.delay) {
        this.delayBuffer.set(entry.hash, entry)
        console.log('[Lorebook] Timed effect "delay" applied to entry', entry)
      }
    }
  }

  private setTimedEffectOfType(type: 'sticky' | 'cooldown', entry: LorebookEntryExtended) {
    // Skip if entry does not have the type (sticky or cooldown)
    if (!entry[type]) {
      return
    }

    const key = this.getEntryKey(entry)

    if (!this.state[type][key]) {
      const effect = this.getEntryTimedEffect(type, entry, false)
      this.state[type][key] = effect
      console.log(
        `[Lorebook] Adding ${type} entry ${key}: start=${effect.start}, end=${effect.end}, protected=${effect.protected}`,
      )
    }
  }

  private getEntryKey(entry: LorebookEntryExtended) {
    return `${entry.lorebook}.${entry.uid}`
  }

  private getEntryTimedEffect(
    type: 'sticky' | 'cooldown',
    entry: LorebookEntryExtended,
    isProtected: boolean,
  ) {
    return {
      hash: entry.hash,
      start: this.chatLength,
      end: this.chatLength + entry[type],
      protected: isProtected,
    }
  }
}
