import type { Character } from '@/hooks/use-character'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Virtualizer } from 'virtua'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@ownxai/ui/components/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'

import { CircleSpinner } from '@/components/spinner'
import { useActiveChat } from '@/hooks/use-chat'
import {
  useLinkLorebook,
  useLorebooks,
  useLorebooksByChat,
  useUnlinkLorebook,
} from '@/hooks/use-lorebook'

interface ChatLorebookDialogProps {
  trigger: ReactNode
  character: Character
}

export function ChatLorebookDialog({ trigger, character: _character }: ChatLorebookDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLorebookId, setSelectedLorebookId] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)

  const { activeChat } = useActiveChat()
  const { lorebooks } = useLorebooks()
  const { lorebooks: linkedLorebooks } = useLorebooksByChat(activeChat?.id)
  const linkLorebook = useLinkLorebook()
  const unlinkLorebook = useUnlinkLorebook()

  // Virtual list ref
  const ref = useRef<any>(null)

  // Initialize selected lorebook ID when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Set to the first linked lorebook, or 'none' if none
      setSelectedLorebookId(linkedLorebooks.at(0)?.id ?? 'none')
    }
  }, [isOpen, linkedLorebooks])

  // Transform lorebooks into select options with "None" as first option
  const items = useMemo(
    () => [
      {
        id: 'none',
        name: '- None -',
      },
      ...lorebooks.map((lorebook) => ({
        id: lorebook.id,
        name: lorebook.name,
      })),
    ],
    [lorebooks],
  )

  const handleLorebookChange = async (newLorebookId: string) => {
    if (!activeChat) return

    setSelectedLorebookId(newLorebookId)
    setIsLoading(true)

    try {
      const linkedLorebookId = linkedLorebooks[0]?.id

      if (newLorebookId === 'none' && linkedLorebookId) {
        await unlinkLorebook({
          lorebookId: linkedLorebookId,
          chatId: activeChat.id,
        })
      } else if (newLorebookId !== 'none' && newLorebookId !== linkedLorebookId) {
        await linkLorebook({
          lorebookId: newLorebookId,
          chatId: activeChat.id,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const selectedName = items.find((item) => item.id === selectedLorebookId)?.name

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000 max-w-md">
        <DialogHeader>
          <DialogTitle className="line-clamp-1">
            Chat Lorebook for {activeChat?.metadata.title}
          </DialogTitle>
          <DialogDescription>
            A selected lorebook will be bound to this chat. When generating an AI reply, it will be
            combined with the entries from global, character and persona lorebooks.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Select
            value={selectedLorebookId ?? 'none'}
            onValueChange={handleLorebookChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <CircleSpinner className="size-3" />
                    {selectedName}
                  </span>
                ) : (
                  selectedName
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px] z-8000">
              <Virtualizer ref={ref} overscan={2}>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </Virtualizer>
            </SelectContent>
          </Select>
        </div>
      </DialogContent>
    </Dialog>
  )
}
