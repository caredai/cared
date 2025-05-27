import { useCallback } from 'react'
import { PlusIcon } from 'lucide-react'

import { Button } from '@ownxai/ui/components/button'

import { EntryItemEdit } from './entry-item'
import { useLorebook, useUpdateLorebook } from '@/hooks/use-lorebook'
import { lorebookEntrySchema, SelectiveLogic } from '@tavern/core'

export function EntryList({ id }: { id: string }) {
  const { lorebook } = useLorebook(id)
  const updateLorebook = useUpdateLorebook()

  const handleAddEntry = useCallback(async () => {
    const newEntry = {
      uid: Date.now(),
      disabled: false,
      keys: [],
      secondaryKeys: [],
      comment: '',
      content: '',
      constant: false,
      vectorized: false,
      selectiveLogic: SelectiveLogic.AND_ANY,
      order: 0,
      position: 0,
      excludeRecursion: false,
      preventRecursion: false,
      delayUntilRecursion: false,
      probability: 1,
      depth: 0,
      group: '',
      groupOverride: false,
      groupWeight: 100,
      sticky: 0,
      cooldown: 0,
      delay: 0,
      scanDepth: 0,
      caseSensitive: false,
      matchWholeWords: false,
      useGroupScoring: false,
      automationId: '',
      role: 'system' as const,
      selective: false,
      useProbability: false,
      addMemo: false,
      characterFilter: { isExclude: false, names: [], tags: [] },
    }

    // Validate the new entry
    lorebookEntrySchema.parse(newEntry)

    await updateLorebook(id, [
      { type: 'addEntry', entry: newEntry },
    ])
  }, [id, updateLorebook])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Entries</h2>
        <Button onClick={handleAddEntry} size="sm">
          <PlusIcon className="size-4 mr-2" />
          Add Entry
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        {lorebook.entries.map((entry) => (
          <EntryItemEdit
            key={entry.uid}
            id={id}
            uid={entry.uid}
            defaultValues={entry}
          />
        ))}
      </div>
    </div>
  )
}
