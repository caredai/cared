import type { Character } from '@/hooks/use-character'
import type { CharacterGroup } from '@/hooks/use-character-group'
import type { Persona } from '@/hooks/use-persona'
import type { VListHandle } from 'virtua'
import { useCallback, useRef, useState } from 'react'
import { VList } from 'virtua'

import { Button } from '@ownxai/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@ownxai/ui/components/dialog'
import { cn } from '@ownxai/ui/lib/utils'

import { CharacterAvatar } from '@/components/avatar'
import { isCharacterGroup, useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { usePersonasByCharacterOrGroup, useUnlinkPersona } from '@/hooks/use-persona'
import { usePersonaSettings, useUpdatePersonaSettings } from '@/hooks/use-settings'
import defaultPng from '@/public/images/user-default.png'

interface PersonaConnectionsDialogProps {
  trigger: React.ReactNode
  character?: Character
  group?: CharacterGroup
}

export function PersonaConnectionsDialog({
  trigger,
  character,
  group,
}: PersonaConnectionsDialogProps) {
  const { active: activePersonaId } = usePersonaSettings()
  const updatePersonaSettings = useUpdatePersonaSettings()
  const activeCharOrGroup = useActiveCharacterOrGroup()

  // Use provided character/group or fall back to active character/group
  const targetCharOrGroup = character || group || activeCharOrGroup
  const { linkedPersonas } = usePersonasByCharacterOrGroup(targetCharOrGroup?.id)
  const unlinkPersona = useUnlinkPersona()

  const [isOpen, setIsOpen] = useState(false)
  const vlistRef = useRef<VListHandle>(null)

  // Handle mouse wheel horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    vlistRef.current?.scrollBy(e.deltaY)
  }

  const handleSelect = useCallback(
    (personaId: string) => {
      void updatePersonaSettings({
        active: personaId,
      })
      setIsOpen(false)
    },
    [updatePersonaSettings],
  )

  const handleUnlink = useCallback(
    async (personaId: string) => {
      if (!targetCharOrGroup) return

      const params = isCharacterGroup(targetCharOrGroup)
        ? { groupId: targetCharOrGroup.id }
        : { characterId: targetCharOrGroup.id }

      await unlinkPersona(personaId, params)
    },
    [targetCharOrGroup, unlinkPersona],
  )

  const handleRemoveAll = useCallback(async () => {
    if (!targetCharOrGroup || !linkedPersonas.length) {
      setIsOpen(false)
      return
    }

    const params = isCharacterGroup(targetCharOrGroup)
      ? { groupId: targetCharOrGroup.id }
      : { characterId: targetCharOrGroup.id }

    // Remove all linked personas
    await Promise.all(linkedPersonas.map((persona) => unlinkPersona(persona.id, params)))

    setIsOpen(false)
  }, [targetCharOrGroup, linkedPersonas, unlinkPersona])

  const handlePersonaClick = useCallback(
    (e: React.MouseEvent, persona: Persona) => {
      if (e.shiftKey) {
        // Shift + Click to unlink
        void handleUnlink(persona.id)
      } else {
        // Normal click to select
        handleSelect(persona.id)
      }
    },
    [handleSelect, handleUnlink],
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000 max-w-md">
        <DialogHeader>
          <DialogTitle>Persona Connections</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            The following personas are connected to the current character.
            <br />
            Click on a persona to select it for the current character.
            <br />
            Shift + Click to unlink the persona from the character.
          </p>

          {/* Horizontal virtual list of persona avatars */}
          {linkedPersonas.length > 0 ? (
            <VList
              horizontal
              count={linkedPersonas.length}
              className="h-15 no-scrollbar"
              style={{
                height: '60px',
              }}
              ref={vlistRef}
              onWheel={handleWheel}
            >
              {linkedPersonas.map((persona) => (
                <div
                  key={persona.id}
                  className={cn('flex items-center justify-center cursor-pointer')}
                  onClick={(e) => handlePersonaClick(e, persona)}
                  title={`${persona.name}${activePersonaId === persona.id ? ' (Active)' : ''}`}
                >
                  <CharacterAvatar
                    src={persona.metadata.imageUrl ?? defaultPng}
                    alt={persona.name}
                    outline={activePersonaId === persona.id}
                  />
                </div>
              ))}
            </VList>
          ) : (
            <p className="text-sm text-muted-foreground">[Currently no personas connected]</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleRemoveAll}>
              Remove All Connections
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
