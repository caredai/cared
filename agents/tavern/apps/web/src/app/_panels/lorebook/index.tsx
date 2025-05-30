import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  faArrowDown91,
  faCompress,
  faExpand,
  faFileExport,
  faFileImport,
  faFill,
  faLock,
  faPaste,
  faPencil,
  faPlus,
  faSquarePlus,
  faTrashCan,
  faUnlock,
} from '@fortawesome/free-solid-svg-icons'
import { lorebookEntrySchema, Position, SelectiveLogic } from '@tavern/core'
import { toast } from 'sonner'
import { Virtualizer } from 'virtua'

import { Label } from '@ownxai/ui/components/label'
import { cn } from '@ownxai/ui/lib/utils'

import { FaButton } from '@/components/fa-button'
import { useLorebook, useLorebooks, useUpdateLorebook } from '@/hooks/use-lorebook'
import { useAppearanceSettings, useUpdateSettingsMutation } from '@/lib/settings'
import { AddLorebookDialog } from './add-lorebook-dialog'
import { DeleteLorebookDialog } from './delete-lorebook-dialog'
import { LorebookEntryItemEdit } from './lorebook-entry-item'
import { LorebookSettings } from './lorebook-settings'
import { SelectActiveLorebooks } from './select-active-lorebooks'
import { SelectLorebook, useSelectedLorebookId } from './select-lorebook'

export function LorebookPanel() {
  const { selectedLorebookId } = useSelectedLorebookId()
  const [openEntries, setOpenEntries] = useState<Record<number, boolean>>({})
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { lorebooks } = useLorebooks()
  const { lorebook } = useLorebook(selectedLorebookId ?? '')
  const updateLorebook = useUpdateLorebook()

  const appearanceSettings = useAppearanceSettings()
  const updateSettings = useUpdateSettingsMutation()

  // Calculate maxUid using useMemo
  const maxUid = useMemo(() => {
    return lorebook?.entries.reduce((max, entry) => Math.max(max, entry.uid), 0) ?? 0
  }, [lorebook?.entries])

  // Update openEntries when lorebook entries change
  useEffect(() => {
    if (!lorebook) {
      setOpenEntries({})
      return
    }

    // Keep existing open states for entries that still exist
    const newOpenEntries = lorebook.entries.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.uid]: openEntries[entry.uid] ?? false,
      }),
      {},
    )

    setOpenEntries(newOpenEntries)
  }, [lorebook?.entries])

  const handleAddEntry = useCallback(async () => {
    if (!selectedLorebookId || !lorebook) return

    const newUid = maxUid + 1

    const newEntry = {
      uid: newUid,
      disabled: false,
      keys: [],
      secondaryKeys: undefined,
      comment: '',
      content: '',
      constant: false,
      vectorized: false,
      selectiveLogic: SelectiveLogic.AND_ANY,
      order: 100,
      position: Position.Before,
      excludeRecursion: false,
      preventRecursion: false,
      delayUntilRecursion: false,
      probability: 100,
      depth: 0,
      group: '',
      groupOverride: false,
      groupWeight: 100,
      sticky: 0,
      cooldown: 0,
      delay: 0,
      scanDepth: undefined,
      caseSensitive: undefined,
      matchWholeWords: undefined,
      useGroupScoring: undefined,
      automationId: undefined,
      role: undefined,
      selective: false,
      useProbability: false,
      addMemo: false,
      characterFilter: { isExclude: false, names: [], tags: [] },
    }

    // Validate the new entry
    lorebookEntrySchema.parse(newEntry)

    await updateLorebook({
      id: selectedLorebookId,
      entries: [...lorebook.entries, newEntry],
    })
  }, [maxUid, selectedLorebookId, updateLorebook, lorebook])

  const handleFillEmptyTitles = useCallback(async () => {
    if (!selectedLorebookId || !lorebook) return

    let filledCount = 0
    const updatedEntries = lorebook.entries.map((entry) => {
      if (!entry.comment && entry.keys.length > 0) {
        filledCount++
        return {
          ...entry,
          comment: entry.keys[0]!,
        }
      }
      return entry
    })

    if (filledCount > 0) {
      toast.success(`Backfilled ${filledCount} titles`)
      await updateLorebook({
        id: selectedLorebookId,
        entries: updatedEntries,
      })
    }
  }, [selectedLorebookId, lorebook, updateLorebook])

  const handleOpenChange = useCallback((uid: number, open: boolean) => {
    setOpenEntries((prev) => ({
      ...prev,
      [uid]: open,
    }))
  }, [])

  const handleExpandAll = useCallback(() => {
    if (!lorebook) return
    const newState = lorebook.entries.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.uid]: true,
      }),
      {},
    )
    setOpenEntries(newState)
  }, [lorebook])

  const handleCollapseAll = useCallback(() => {
    if (!lorebook) return
    const newState = lorebook.entries.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.uid]: false,
      }),
      {},
    )
    setOpenEntries(newState)
  }, [lorebook])

  const operateActions = [
    {
      action: handleAddEntry,
      icon: faPlus,
      tooltip: 'New Entry',
      disabled: !selectedLorebookId,
    },
    {
      action: handleExpandAll,
      icon: faExpand,
      tooltip: 'Open all Entries',
    },
    {
      action: handleCollapseAll,
      icon: faCompress,
      tooltip: 'Close all Entries',
    },
    {
      action: handleFillEmptyTitles,
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
      icon: faTrashCan,
      tooltip: 'Delete Lorebook',
      disabled: !selectedLorebookId,
      wrapper: DeleteLorebookDialog,
    },
  ]

  return (
    <Virtualizer>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <FaButton
            icon={appearanceSettings.lorebookPanelLocked ? faLock : faUnlock}
            btnSize="size-6"
            iconSize="xl"
            title="If locked, lorebook panel will stay open"
            onClick={async () => {
              await updateSettings({
                appearance: {
                  ...appearanceSettings,
                  lorebookPanelLocked: !appearanceSettings.lorebookPanelLocked,
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
            <LorebookSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
          </div>
        </div>

        <div className="flex flex-wrap justify-start items-center gap-1">
          <SelectLorebook />

          {operateActions.map(
            ({ action, icon, tooltip, disabled, className, wrapper: Wrapper }, index) => {
              const btn = (
                <FaButton
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
              )
              return Wrapper ? <Wrapper key={index} trigger={btn} /> : btn
            },
          )}
        </div>

        <div />

        <div className="grid grid-cols-[24px_20px_1fr_52px_72px_60px_60px_60px_24px_24px] items-center gap-2">
          <Label className="col-start-3 text-xs">Title/Memo</Label>
          <Label className="text-xs">Strategy</Label>
          <Label className="text-xs">Position</Label>
          <Label className="text-xs">Depth</Label>
          <Label className="text-xs">Order</Label>
          <Label className="text-xs">Trigger %</Label>
        </div>
      </div>

      {lorebook?.entries.map((entry) => (
        <LorebookEntryItemEdit
          key={entry.uid}
          id={lorebook.id}
          uid={entry.uid}
          defaultValues={entry}
          maxUid={maxUid}
          lorebooks={lorebooks}
          open={openEntries[entry.uid]}
          onOpenChange={handleOpenChange}
        />
      ))}
    </Virtualizer>
  )
}
