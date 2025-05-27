import { useCallback } from 'react'
import {
  faArrowDown91,
  faSquarePlus,
  faFileExport,
  faFileImport,
  faFill,
  faExpand,
  faCompress,
  faLock,
  faPaste,
  faPencil,
  faPlus,
  faTrashCan,
  faUnlock,
} from '@fortawesome/free-solid-svg-icons'
import { lorebookEntrySchema, SelectiveLogic } from '@tavern/core'
import { Virtualizer } from 'virtua'

import { cn } from '@ownxai/ui/lib/utils'

import { FaButton } from '@/components/fa-button'
import { useLorebook, useUpdateLorebook } from '@/hooks/use-lorebook'
import { useAppearanceSettings, useUpdateSettingsMutation } from '@/lib/settings'
import { AddLorebookDialog } from './add-lorebook-dialog'
import { DeleteLorebookDialog } from './delete-lorebook-dialog'
import { EntryItemEdit } from './entry-item'
import { LorebookSettings } from './lorebook-settings'
import { SelectActiveLorebooks } from './select-active-lorebooks'
import { SelectLorebook, useSelectedLorebookId } from './select-lorebook'

export function LorebookPanel() {
  const { selectedLorebookId } = useSelectedLorebookId()
  const { lorebook } = useLorebook(selectedLorebookId ?? '')
  const updateLorebook = useUpdateLorebook()
  const appearanceSettings = useAppearanceSettings()
  const updateSettingsMutation = useUpdateSettingsMutation()

  const handleAddEntry = useCallback(async () => {
    if (!selectedLorebookId) return

    // Calculate the new uid based on the maximum existing uid
    const maxUid = lorebook?.entries.reduce((max, entry) => Math.max(max, entry.uid), 0) ?? 0
    const newUid = maxUid + 1

    const newEntry = {
      uid: newUid,
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

    await updateLorebook(selectedLorebookId, [
      { type: 'addEntry', entry: newEntry },
    ])
  }, [selectedLorebookId, updateLorebook])

  const operateActions = [
    {
      action: handleAddEntry,
      icon: faPlus,
      tooltip: 'New Entry',
      disabled: !selectedLorebookId,
    },
    {
      action: () => {},
      icon: faExpand,
      tooltip: 'Open all Entries',
    },
    {
      action: () => {},
      icon: faCompress,
      tooltip: 'Close all Entries',
    },
    {
      action: () => {},
      icon: faFill,
      tooltip: 'Fill empty Memo/Titles with Keywords',
    },
    {
      action: () => {},
      icon: faArrowDown91,
      tooltip: 'Apply current sorting as Order',
    },
    {
      action: () => {},
      icon: faPencil,
      tooltip: 'Rename Lorebook',
      disabled: false,
      className: '',
    },
    {
      action: () => {},
      icon: faSquarePlus,
      tooltip: 'New Lorebook',
      disabled: false,
      className: '',
      wrapper: AddLorebookDialog,
    },
    {
      action: () => {},
      icon: faFileImport,
      tooltip: 'Import Lorebook',
    },
    {
      action: () => {},
      icon: faFileExport,
      tooltip: 'Export Lorebook',
    },
    {
      action: () => {},
      icon: faPaste,
      tooltip: 'Duplicate Lorebook',
    },
    {
      action: () => {},
      icon: faTrashCan,
      tooltip: 'Delete Lorebook',
      disabled: !selectedLorebookId,
      wrapper: DeleteLorebookDialog,
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto [overflow-anchor:none]">
      <div className="flex items-center gap-2">
        <FaButton
          icon={appearanceSettings.lorebookPanelLocked ? faLock : faUnlock}
          btnSize="size-6"
          iconSize="xl"
          title="If locked, lorebook panel will stay open"
          onClick={async () => {
            await updateSettingsMutation.mutateAsync({
              settings: {
                appearance: {
                  ...appearanceSettings,
                  lorebookPanelLocked: !appearanceSettings.lorebookPanelLocked,
                },
              },
            })
          }}
        />
        <h1 className="text-lg font-bold">Worlds / Lorebooks</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <SelectActiveLorebooks />
        </div>
        <div className="w-full md:w-1/2">
          <LorebookSettings />
        </div>
      </div>

      <div className="flex flex-wrap justify-start items-center gap-1">
        <SelectLorebook />

        {operateActions.map(({ action, icon, tooltip, disabled, className, wrapper: Wrapper }, index) => {
          const btn = <FaButton
            key={index}
            icon={icon}
            btnSize="size-6"
            iconSize="1x"
            title={tooltip}
            className={cn(
              'text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm',
              className,
            )}
            disabled={disabled}
            onClick={action}
          />
          return Wrapper ? <Wrapper key={index} trigger={btn} /> : btn
        })}
      </div>

      {lorebook && (
        <Virtualizer startMargin={300}>
          {lorebook.entries.map((entry) => (
            <EntryItemEdit key={entry.uid} id={lorebook.id} uid={entry.uid} defaultValues={entry} />
          ))}
        </Virtualizer>
      )}
    </div>
  )
}
