import { memo, useCallback, useEffect, useMemo, useState } from 'react'
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
import hash from 'stable-hash'
import { Virtualizer } from 'virtua'

import { Label } from '@ownxai/ui/components/label'
import { Separator } from '@ownxai/ui/components/separator'
import { cn } from '@ownxai/ui/lib/utils'

import { FaButton } from '@/components/fa-button'
import { useLorebooks, useUpdateLorebook } from '@/hooks/use-lorebook'
import { useAppearanceSettings, useUpdateSettingsMutation } from '@/hooks/use-settings'
import { AddLorebookDialog } from './add-lorebook-dialog'
import { ApplySortingDialog } from './apply-sorting-dialog'
import { DeleteLorebookDialog } from './delete-lorebook-dialog'
import { DuplicateLorebookDialog } from './duplicate-lorebook-dialog'
import { ExportLorebookDialog } from './export-lorebook-dialog'
import { ImportLorebookDialog, useImportLorebookFileInputRef } from './import-lorebook-dialog'
import { LorebookEntryItemEdit } from './lorebook-entry-item'
import { LorebookSettings } from './lorebook-settings'
import { RenameLorebookDialog } from './rename-lorebook-dialog'
import { SelectActiveLorebooks } from './select-active-lorebooks'
import { SelectLorebook, useSelectedLorebook } from './select-lorebook'

function useOpenEntries() {
  const [openEntries, _setOpenEntries] = useState<Record<number, boolean>>({})
  const { selectedLorebook } = useSelectedLorebook()

  const setOpenEntries = useCallback((entries: Record<number, boolean>) => {
    _setOpenEntries((prev) => {
      // Only update if the new state is different
      if (hash(entries) !== hash(prev)) {
        return entries
      }
      return prev
    })
  }, [])

  useEffect(() => {
    if (!selectedLorebook) {
      setOpenEntries({})
      return
    }

    // Keep existing open states for entries that still exist
    const newOpenEntries = selectedLorebook.entries.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.uid]: openEntries[entry.uid] ?? false,
      }),
      {},
    )
    setOpenEntries(newOpenEntries)
  }, [selectedLorebook, openEntries, setOpenEntries])

  const handleEntryOpenChange = useCallback(
    (uid: number, open: boolean) => {
      setOpenEntries({
        ...openEntries,
        [uid]: open,
      })
    },
    [openEntries, setOpenEntries],
  )

  return {
    openEntries,
    setOpenEntries,
    handleEntryOpenChange,
  }
}

export function LorebookPanel() {
  const { lorebooks } = useLorebooks()
  const { selectedLorebook } = useSelectedLorebook()

  const { openEntries, setOpenEntries, handleEntryOpenChange } = useOpenEntries()

  // Calculate maxUid using useMemo
  const maxUid = useMemo(() => {
    return selectedLorebook?.entries.reduce((max, entry) => Math.max(max, entry.uid), 0) ?? 0
  }, [selectedLorebook?.entries])

  return (
    <Virtualizer>
      <LorebookPanelUpperPart setOpenEntries={setOpenEntries} />

      {selectedLorebook?.entries.map((entry) => (
        <LorebookEntryItemEdit
          key={entry.uid}
          id={selectedLorebook.id}
          uid={entry.uid}
          defaultValues={entry}
          maxUid={maxUid}
          lorebooks={lorebooks}
          open={openEntries[entry.uid]}
          onOpenChange={handleEntryOpenChange}
        />
      ))}
    </Virtualizer>
  )
}

export const LorebookPanelUpperPart = memo(function LorebookPanelUpperPart({
  setOpenEntries,
}: {
  setOpenEntries: (entries: Record<number, boolean>) => void
}) {
  const { selectedLorebook } = useSelectedLorebook()

  const [settingsOpen, setSettingsOpen] = useState(false)

  const importFileInputRef = useImportLorebookFileInputRef()

  const updateLorebook = useUpdateLorebook()

  const appearanceSettings = useAppearanceSettings()
  const updateSettings = useUpdateSettingsMutation()

  // Calculate maxUid using useMemo
  const maxUid = useMemo(() => {
    return selectedLorebook?.entries.reduce((max, entry) => Math.max(max, entry.uid), 0) ?? 0
  }, [selectedLorebook?.entries])

  const handleAddEntry = useCallback(async () => {
    if (!selectedLorebook) return

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
      id: selectedLorebook.id,
      entries: [...selectedLorebook.entries, newEntry],
    })
  }, [maxUid, updateLorebook, selectedLorebook])

  const handleFillEmptyTitles = useCallback(async () => {
    if (!selectedLorebook) return

    let filledCount = 0
    const updatedEntries = selectedLorebook.entries.map((entry) => {
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
        id: selectedLorebook.id,
        entries: updatedEntries,
      })
    }
  }, [selectedLorebook, updateLorebook])

  const handleExpandAll = useCallback(() => {
    if (!selectedLorebook) return
    const newState = selectedLorebook.entries.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.uid]: true,
      }),
      {},
    )
    setOpenEntries(newState)
  }, [selectedLorebook, setOpenEntries])

  const handleCollapseAll = useCallback(() => {
    if (!selectedLorebook) return
    const newState = selectedLorebook.entries.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.uid]: false,
      }),
      {},
    )
    setOpenEntries(newState)
  }, [selectedLorebook, setOpenEntries])

  const operateActions = [
    {
      action: handleAddEntry,
      icon: faPlus,
      tooltip: 'New Entry',
      disabled: !selectedLorebook,
    },
    {
      action: handleExpandAll,
      icon: faExpand,
      tooltip: 'Open all Entries',
      disabled: !selectedLorebook?.entries.length,
    },
    {
      action: handleCollapseAll,
      icon: faCompress,
      tooltip: 'Close all Entries',
      disabled: !selectedLorebook?.entries.length,
    },
    {
      action: handleFillEmptyTitles,
      icon: faFill,
      tooltip: 'Fill empty Memo/Titles with Keywords',
      disabled: !selectedLorebook?.entries.length,
    },
    {
      icon: faArrowDown91,
      tooltip: 'Apply current sorting as Order',
      wrapper: ApplySortingDialog,
      disabled: !selectedLorebook?.entries.length,
    },
    {
      icon: faPencil,
      tooltip: 'Rename Lorebook',
      wrapper: RenameLorebookDialog,
      disabled: !selectedLorebook,
    },
    {
      icon: faSquarePlus,
      tooltip: 'New Lorebook',
      wrapper: AddLorebookDialog,
    },
    {
      action: () => importFileInputRef.current?.click(),
      icon: faFileImport,
      tooltip: 'Import Lorebook',
      wrapper: ImportLorebookDialog,
    },
    {
      icon: faFileExport,
      tooltip: 'Export Lorebook',
      wrapper: ExportLorebookDialog,
      disabled: !selectedLorebook,
    },
    {
      icon: faPaste,
      tooltip: 'Duplicate Lorebook',
      wrapper: DuplicateLorebookDialog,
      disabled: !selectedLorebook,
    },
    {
      icon: faTrashCan,
      tooltip: 'Delete Lorebook',
      wrapper: DeleteLorebookDialog,
      disabled: !selectedLorebook,
      className: 'hover:bg-destructive',
    },
  ]

  return (
    <div className={cn('flex flex-col gap-6', !selectedLorebook?.entries.length && 'pb-4')}>
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

      <SelectActiveLorebooks />

      <LorebookSettings open={settingsOpen} onOpenChange={setSettingsOpen} />

      <Separator className="bg-gradient-to-r from-transparent via-ring/50 to-transparent" />

      <div className="flex flex-wrap justify-start items-center gap-1">
        <SelectLorebook />

        {operateActions.map(({ action, icon, tooltip, disabled, className, wrapper: Wrapper }) => {
          const btn = (
            <FaButton
              key={tooltip}
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
          return Wrapper ? <Wrapper key={tooltip} trigger={btn} /> : btn
        })}
      </div>

      {selectedLorebook && (
        <div className="hidden md:grid grid-cols-[24px_20px_1fr_52px_72px_60px_60px_60px_24px_24px] items-center gap-2">
          <Label className="col-start-3 text-xs">Title/Memo</Label>
          <Label className="text-xs">Strategy</Label>
          <Label className="text-xs">Position</Label>
          <Label className="text-xs">Depth</Label>
          <Label className="text-xs">Order</Label>
          <Label className="text-xs">Trigger %</Label>
        </div>
      )}
    </div>
  )
})
