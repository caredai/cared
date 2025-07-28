import type { Chat } from '@/hooks/use-chat'
import { useState } from 'react'

import { Button } from '@cared/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'

import { CircleSpinner } from '@/components/spinner'
import { useDeleteChat } from '@/hooks/use-chat'

export function DeleteChatDialog({
  open,
  onOpenChange,
  chat,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  chat: Chat
  onDelete?: () => void
}) {
  const deleteChat = useDeleteChat(chat.characterId, chat.groupId)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      onDelete?.()
      await deleteChat(chat.id)
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Delete Chat</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this chat? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? <CircleSpinner className="h-4 w-4" /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
