import { useCallback, useEffect, useState } from 'react'

import { Button } from '@cared/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cared/ui/components/dialog'

import { NumberInput } from '@/components/number-input'
import { CircleSpinner } from '@/components/spinner'
import { useUpdateLorebook } from '@/hooks/use-lorebook'
import { useSelectedLorebook } from './select-lorebook'

export function ApplySortingDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [startOrder, setStartOrder] = useState(100)

  const { selectedLorebook } = useSelectedLorebook()
  const updateLorebook = useUpdateLorebook()

  useEffect(() => {
    if (open) {
      setStartOrder(100)
    }
  }, [open])

  const handleConfirm = useCallback(() => {
    if (!selectedLorebook) return

    setLoading(true)
    try {
      const updatedEntries = selectedLorebook.entries.map((entry, index) => ({
        ...entry,
        order: Math.max(0, startOrder - index),
      }))

      void updateLorebook({
        id: selectedLorebook.id,
        entries: updatedEntries,
      })

      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [selectedLorebook, startOrder, updateLorebook])

  const entryCount = selectedLorebook?.entries.length ?? 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Apply Current Sorting</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4 text-sm">
          <p>
            Apply your current sorting to the &quot;Order&quot; field. The Order values will go down
            from the chosen number.
          </p>
          {entryCount > 100 && (
            <p className="text-yellow-500">
              More than 100 entries in this world. If you don&apos;t choose a number higher than
              that, the lower entries will default to 0.
              <br />
              (Usual default: 100)
              <br />
              Minimum: {entryCount}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span>Start Order:</span>
            <NumberInput
              value={startOrder}
              onChange={setStartOrder}
              min={0}
              step={1}
              className="w-24 h-7 px-2 py-0.5"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? (
                <>
                  <CircleSpinner />
                  Applying...
                </>
              ) : (
                'Apply'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
