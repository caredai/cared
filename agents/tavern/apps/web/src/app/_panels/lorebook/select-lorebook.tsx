import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { atom, useAtom } from 'jotai'
import { Virtualizer } from 'virtua'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'

import { useLorebooks } from '@/hooks/use-lorebook'

// Atom for storing the selected lorebook ID
export const selectedLorebookIdAtom = atom<string | undefined>(undefined)

export function useSelectedLorebookId() {
  const [selectedLorebookId, setSelectedLorebookId] = useAtom(selectedLorebookIdAtom)
  return {
    selectedLorebookId,
    setSelectedLorebookId,
  }
}

export function SelectLorebook() {
  const { lorebooks } = useLorebooks()

  const { selectedLorebookId, setSelectedLorebookId } = useSelectedLorebookId()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setSelectedLorebookId(lorebooks.at(0)?.id)
  }, [lorebooks, setSelectedLorebookId])

  // Virtual list ref
  const ref = useRef<any>(null)

  // Transform lorebooks into select options
  const items = useMemo(
    () =>
      lorebooks.map((lorebook) => ({
        id: lorebook.id,
        label: lorebook.name,
      })),
    [lorebooks],
  )

  // Find index of selected item
  const index = useMemo(
    () => items.findIndex((d) => d.id === selectedLorebookId),
    [items, selectedLorebookId],
  )

  // Scroll to selected item when dropdown opens
  useLayoutEffect(() => {
    if (!open || !selectedLorebookId) return
    if (index === -1) return

    // Scroll to selected item
    ref.current?.scrollToIndex(index)

    // Recover focus
    setTimeout(() => {
      const element = document.querySelector('.SelectItem[data-state=checked]')
      if (element instanceof HTMLElement) {
        element.focus({ preventScroll: true })
      }
    })
  }, [open, selectedLorebookId, index])

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
        <SelectValue>
          {items.find((d) => d.id === selectedLorebookId)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px] z-6000">
        <Virtualizer ref={ref} keepMounted={index !== -1 ? [index] : undefined} overscan={2}>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </Virtualizer>
      </SelectContent>
    </Select>
  )
}
