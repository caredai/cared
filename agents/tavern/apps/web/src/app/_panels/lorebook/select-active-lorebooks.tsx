import { MultiSelectVirtual } from '@ownxai/ui/components/multi-select-virtual'

import { useLorebooks } from '@/hooks/use-lorebook'
import { useLorebookSettings, useUpdateLorebookSettings } from '@/lib/settings'

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

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">Active lorebooks for all chats</span>
      <MultiSelectVirtual
        disabled={!lorebooks.length}
        options={options}
        value={lorebookSettings.active}
        onValueChange={handleValueChange}
        maxCount={5}
        placeholder="No lorebooks active. Click here to select."
        className="border-input"
        contentClassName="z-6000 w-48 border-input"
      />
    </div>
  )
}
