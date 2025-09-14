'use client'

import { useState } from 'react'
import { TrashIcon } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@cared/ui/components/alert-dialog'
import { Spinner } from '@cared/ui/components/spinner'

interface DeleteTraceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  traceIds: string[]
  onConfirm: () => Promise<void>
}

export function DeleteTraceDialog({
  open,
  onOpenChange,
  traceIds,
  onConfirm,
}: DeleteTraceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const title = traceIds.length > 1 ? 'Delete Traces' : 'Delete Trace'
  const description = `This action permanently deletes ${traceIds.length > 1 ? `${traceIds.length} traces` : 'this trace'} and cannot be undone. Trace deletion happens asynchronously and may take up to 15 minutes.`

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TrashIcon className="h-5 w-5 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Spinner />
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon />
                Delete
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
