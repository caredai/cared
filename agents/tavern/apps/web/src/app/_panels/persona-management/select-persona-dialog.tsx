import type { Persona } from '@/hooks/use-persona'
import type { VListHandle } from 'virtua'
import { useEffect, useRef, useState } from 'react'
import { VList } from 'virtua'

import { Button } from '@ownxai/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ownxai/ui/components/dialog'
import { cn } from '@ownxai/ui/lib/utils'

import { CharacterAvatar } from '@/components/avatar'
import { useActiveChatId } from '@/hooks/use-chat'
import { usePersonaByActiveChat, useUnlinkPersona } from '@/hooks/use-persona'
import { usePersonaSettings, useUpdatePersonaSettings } from '@/hooks/use-settings'
import defaultPng from '@/public/images/user-default.png'

export function SelectPersonaDialog() {
  const { active: activePersonaId, default: defaultPersonaId } = usePersonaSettings()
  const updatePersonaSettings = useUpdatePersonaSettings()

  const { activeChatId } = useActiveChatId()
  const { persona, linkedPersonas, characterId, groupId } = usePersonaByActiveChat()
  const unlinkPersona = useUnlinkPersona()

  const [alternativePersonas, setAlternativePersonas] = useState<Persona[]>()
  const [isOpen, setIsOpen] = useState(false)

  const vlistRef = useRef<VListHandle>(null)

  // Handle mouse wheel horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    vlistRef.current?.scrollBy(e.deltaY)
  }

  const [lastChatId, setLastChatId] = useState<string>()

  useEffect(() => {
    // If the active chat ID hasn't changed, do nothing
    if (activeChatId === lastChatId) {
      return
    }

    setLastChatId(activeChatId)

    if (linkedPersonas?.length) {
      // manual select by user
      setAlternativePersonas(linkedPersonas)
      setIsOpen(true)
      return
    } else if (persona && persona.id !== activePersonaId) {
      void updatePersonaSettings({
        active: persona.id,
      })
    }

    setAlternativePersonas(undefined)
    setIsOpen(false)
  }, [activeChatId, activePersonaId, lastChatId, linkedPersonas, persona, updatePersonaSettings])

  const handleSelect = (id: string) => {
    void updatePersonaSettings({
      active: id,
    })
    setIsOpen(false)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleRemove = () => {
    if (linkedPersonas?.length) {
      void Promise.all(
        linkedPersonas.map((p) => {
          return unlinkPersona(p.id, {
            characterId,
            groupId,
          })
        }),
      )
    }

    setIsOpen(false)
  }

  if (!alternativePersonas?.length) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="z-7000 max-w-md">
        <DialogHeader>
          <DialogTitle>Select Persona</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Multiple personas are connected to this character. Select a persona to use for this
            chat.
          </p>

          {/* Horizontal virtual list of persona avatars */}
          <VList
            horizontal
            count={alternativePersonas.length}
            className="h-15 no-scrollbar"
            style={{
              height: '60px',
            }}
            ref={vlistRef}
            onWheel={handleWheel}
          >
            {alternativePersonas.map((persona) => (
              <div
                key={persona.id}
                className={cn('flex items-center justify-center')}
                onClick={() => handleSelect(persona.id)}
              >
                <CharacterAvatar
                  src={persona.metadata.imageUrl ?? defaultPng}
                  alt={persona.name}
                  outline={defaultPersonaId === persona.id}
                />
              </div>
            ))}
          </VList>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleRemove}>
              Remove All Connections
            </Button>
            <Button type="button" onClick={handleClose}>
              None
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
