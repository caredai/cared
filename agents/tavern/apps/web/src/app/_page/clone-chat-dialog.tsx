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
import { useActiveChat, useActiveChatId, useCloneChat } from '@/hooks/use-chat'
import { useMessageTree } from '@/hooks/use-message-tree'

export function CloneChatDialog({ trigger, message }: { trigger: ReactNode; message: Message }) {
  const { activeChat } = useActiveChat()
  const { setActiveChat } = useActiveChatId()
  const cloneChat = useCloneChat()
  const { branch } = useMessageTree()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClone = async () => {
    if (!activeChat) {
      return
    }

    setLoading(true)
    try {
      const index = branch.findIndex((node) => node.message.id === message.id)
      if (index < 0) {
        console.error('Could not find path to root for message:', message.id)
        return
      }
      const messagePath = branch.slice(0, index + 1).map((node) => node.message.id)

      // Clone the chat with the specified message path
      const clonedChat = await cloneChat(activeChat.id, messagePath)

      setActiveChat(clonedChat.chat.id)

      setOpen(false)
    } catch (error) {
      console.error('Failed to clone chat:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Clone Chat</DialogTitle>
          <DialogDescription>
            This will create a new chat which will contain all messages from the root up to this
            message.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={loading}>
            {loading ? (
              <>
                <CircleSpinner />
                Cloning...
              </>
            ) : (
              'Clone Chat'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
