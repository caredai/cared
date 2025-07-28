import type { Message } from '@tavern/core'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { Button } from '@cared/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cared/ui/components/dialog'

import { CircleSpinner } from '@/components/spinner'
import { useActiveChat } from '@/hooks/use-chat'
import { useDeleteMessage } from '@/hooks/use-message'

export function DeleteMessageDialog({
  trigger,
  message,
}: {
  trigger: ReactNode
  message: Message
}) {
  const { activeChat } = useActiveChat()
  const deleteMessage = useDeleteMessage(activeChat?.id)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteMessage(message.id, {
        deleteTrailing: false,
        excludeSelf: false,
      })
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Delete Message</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this message? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? (
              <>
                <CircleSpinner />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
