'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { lorebookEntriesSchema } from '@tavern/core'
import { atom, useAtom } from 'jotai'
import { toast } from 'sonner'

import { Input } from '@cared/ui/components/input'

import { useCreateLorebook, useLorebooks } from '@/hooks/use-lorebook'
import { useSelectedLorebook } from './select-lorebook'

const refAtom = atom({ current: null as HTMLInputElement | null })

export function useImportLorebookFileInputRef() {
  const [ref] = useAtom(refAtom)
  return ref
}

export function ImportLorebookDialog({ trigger }: { trigger: ReactNode }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [, setRefState] = useAtom(refAtom)

  useEffect(() => {
    setRefState(fileInputRef)
  }, [fileInputRef, setRefState])

  const [isImporting, setIsImporting] = useState(false)

  const { lorebooks } = useLorebooks()
  const createLorebook = useCreateLorebook()

  const { setSelectedLorebookId } = useSelectedLorebook()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file')
      return
    }

    setIsImporting(true)
    try {
      const text = await file.text()
      const lorebook = JSON.parse(text)

      let entries: any[]
      // Auto-detect format: array (CryptoTavern) or object (SillyTavern)
      if (Array.isArray(lorebook.entries)) {
        // CryptoTavern format: entries is an array
        entries = lorebook.entries
      } else if (typeof lorebook.entries === 'object') {
        // SillyTavern format: entries is an object
        // Map SillyTavern fields to local entry fields
        const selectiveLogicReverseMap = {
          0: 'andAny',
          1: 'notAll',
          2: 'notAny',
          3: 'andAll',
        } as const
        // Convert SillyTavern entries object to array and sort by displayIndex
        const entriesArray = Object.values(lorebook.entries).map((entry: any) => {
          let delayUntilRecursion = entry.delayUntilRecursion
          if (typeof delayUntilRecursion === 'number') {
            if (delayUntilRecursion < 1) {
              delayUntilRecursion = false
            } else {
              delayUntilRecursion = Math.round(delayUntilRecursion)
            }
          }

          return {
            uid: entry.uid,
            disabled: entry.disable,
            keys: entry.key ?? [],
            secondaryKeys: entry.keysecondary ?? [],
            comment: entry.comment ?? '',
            content: entry.content ?? '',
            constant: entry.constant ?? false,
            vectorized: entry.vectorized ?? false,
            // @ts-ignore
            selectiveLogic: selectiveLogicReverseMap[entry.selectiveLogic ?? 0] ?? 'andAny',
            order: entry.order ?? 100,
            position: entry.position ?? 0,
            excludeRecursion: entry.excludeRecursion ?? false,
            preventRecursion: entry.preventRecursion ?? false,
            delayUntilRecursion: delayUntilRecursion,
            probability: entry.probability ?? 100,
            depth: entry.depth ?? undefined,
            group: entry.group ?? '',
            groupOverride: entry.groupOverride ?? false,
            groupWeight: entry.groupWeight ?? 100,
            sticky: entry.sticky ?? 0,
            cooldown: entry.cooldown ?? 0,
            delay: entry.delay ?? 0,
            scanDepth: entry.scanDepth ?? undefined,
            caseSensitive: entry.caseSensitive ?? undefined,
            matchWholeWords: entry.matchWholeWords ?? undefined,
            useGroupScoring: entry.useGroupScoring ?? undefined,
            automationId: entry.automationId ?? undefined,
            role: entry.role ?? undefined,
            characterFilter: entry.characterFilter ?? undefined,
            selective: entry.selective ?? false,
            useProbability: entry.useProbability ?? false,
            addMemo: entry.addMemo ?? false,
            matchPersonaDescription: entry.matchPersonaDescription ?? undefined,
            matchCharacterDescription: entry.matchCharacterDescription ?? undefined,
            matchCharacterPersonality: entry.matchCharacterPersonality ?? undefined,
            matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt ?? undefined,
            matchScenario: entry.matchScenario ?? undefined,
            matchCreatorNotes: entry.matchCreatorNotes ?? undefined,
            // Store displayIndex for sorting
            displayIndex: entry.displayIndex ?? 0,
          }
        })

        // Sort entries by displayIndex to preserve SillyTavern ordering
        entries = entriesArray.sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0))

        // Remove displayIndex from final entries as it's not part of our schema
        entries = entries.map(({ displayIndex: _displayIndex, ...entry }) => entry)
      } else {
        throw new Error('Invalid lorebook format: entries field is missing or invalid')
      }

      // Validate the entries using schema
      const validatedEntries = lorebookEntriesSchema.parse(entries)

      // Get name from file name without extension
      const name = file.name.replace(/\.json$/, '')

      // Check if name exists and add suffix if needed
      let finalName = name
      let counter = 1
      while (lorebooks.some((p) => p.name === finalName)) {
        finalName = `${name} (${counter})`
        counter++
      }

      const {
        lorebook: { id },
      } = await createLorebook(finalName, undefined, validatedEntries)

      setSelectedLorebookId(id)

      toast.success('Lorebook imported successfully')
    } catch (error) {
      console.error(error)
      // toast.error('Failed to import lorebook: invalid file format')
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex justify-center items-center">
      {trigger}
      <Input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        disabled={isImporting}
        className="hidden"
      />
    </div>
  )
}
