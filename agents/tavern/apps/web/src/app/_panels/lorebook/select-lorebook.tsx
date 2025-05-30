import { useEffect, useMemo, useRef, useState } from 'react'
import { atom, useAtom } from 'jotai'
import { Virtualizer } from 'virtua'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'

import { useLorebook, useLorebooks } from '@/hooks/use-lorebook'

// Atom for storing the selected lorebook ID
export const selectedLorebookIdAtom = atom<string | undefined>(undefined)

export function useSelectedLorebook() {
  const [selectedLorebookId, setSelectedLorebookId] = useAtom(selectedLorebookIdAtom)

  const { lorebook } = useLorebook(selectedLorebookId)

  return {
    selectedLorebook: lorebook,
    selectedLorebookId,
    setSelectedLorebookId,
  }
}

export function SelectLorebook() {
  const { lorebooks } = useLorebooks()

  const { selectedLorebookId, setSelectedLorebookId } = useSelectedLorebook()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!selectedLorebookId || !lorebooks.some((lorebook) => lorebook.id === selectedLorebookId)) {
      setSelectedLorebookId(lorebooks.at(0)?.id)
    }
  }, [lorebooks, selectedLorebookId, setSelectedLorebookId])

  // Virtual list ref
  const ref = useRef<any>(null)

  // Transform lorebooks into select options
  const items = useMemo(
    () =>
      lorebooks.map((lorebook) => ({
        id: lorebook.id,
        name: lorebook.name,
      })),
    [lorebooks],
  )

  const name = items.find((d) => d.id === selectedLorebookId)?.name

  if (!selectedLorebookId) {
    return null
  }

  return (
    <Select
      value={selectedLorebookId}
      onValueChange={setSelectedLorebookId}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className="w-40 h-7 px-2 py-0.5">
        <SelectValue>{name}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px] z-6000">
        <Virtualizer ref={ref} overscan={2}>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </Virtualizer>
      </SelectContent>
    </Select>
  )
}
