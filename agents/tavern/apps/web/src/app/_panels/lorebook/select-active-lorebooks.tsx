import { useEffect, useState } from 'react'

import { MultiSelectVirtual } from '@cared/ui/components/multi-select-virtual'

import { useLorebooks } from '@/hooks/use-lorebook'
import { useLorebookSettings, useUpdateLorebookSettings } from '@/hooks/use-settings'

export function SelectActiveLorebooks() {
  const { lorebooks } = useLorebooks()
  const lorebookSettings = useLorebookSettings()
  const updateLorebookSettings = useUpdateLorebookSettings()

  const options = lorebooks.map((lorebook) => ({
    value: lorebook.id,
    label: lorebook.name,
  }))

  const handleValueChange = (selectedIds: string[]) => {
    console.log('Selected Lorebooks:', selectedIds.length)
    void updateLorebookSettings({
      active: selectedIds,
    })
  }

  const [hasAttemptedCheck, setHasAttemptedCheck] = useState(false)

  useEffect(() => {
    const lorebookIds = new Set(lorebooks.map((lorebook) => lorebook.id))
    const newActive = lorebookSettings.active.filter((id) => lorebookIds.has(id))
    if (newActive.length !== lorebookSettings.active.length && !hasAttemptedCheck) {
      setHasAttemptedCheck(true)
      void updateLorebookSettings({
        active: newActive,
      }).finally(() => {
        setHasAttemptedCheck(false)
      })
    }
  }, [lorebookSettings.active, lorebooks, updateLorebookSettings, hasAttemptedCheck])

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">Active lorebooks for all chats</span>
      <MultiSelectVirtual
        disabled={!lorebooks.length}
        options={options}
        values={lorebookSettings.active}
        onValuesChange={handleValueChange}
        maxCount={5}
        placeholder="No lorebooks active. Click here to select."
        className="border-input"
        contentClassName="z-6000 w-48 border-input"
      />
    </div>
  )
}
