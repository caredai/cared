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
  onDelete: () => Promise<void>
}

export function DeleteTraceDialog({
  open,
  onOpenChange,
  traceIds,
  onDelete,
}: DeleteTraceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
      onOpenChange(false)
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
            onClick={(e) => {
              e.preventDefault()
              void handleDelete()
            }}
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
