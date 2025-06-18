import type { Persona } from '@/hooks/use-persona'
import { useCallback, useState } from 'react'
import { faComments, faLock, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Virtualizer } from 'virtua'

import { Button } from '@ownxai/ui/components/button'
import { cn } from '@ownxai/ui/lib/utils'

import { CharacterAvatar } from '@/components/avatar'
import { ImageCropDialog } from '@/components/image-crop-dialog'
import { useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useActiveChat } from '@/hooks/use-chat'
import { useUpdatePersona } from '@/hooks/use-persona'
import { usePersonaSettings, useUpdatePersonaSettings } from '@/hooks/use-settings'
import defaultPng from '@/public/images/user-default.png'

export function PersonaList({ personas }: { personas: Persona[] }) {
  const [inputImageFile, setInputImageFile] = useState<File>()
  const [showImageCropDialog, setShowImageCropDialog] = useState(false)
  const [editingPersonaId, setEditingPersonaId] = useState<string>()

  const updatePersona = useUpdatePersona()
  const { active: activePersonaId, default: defaultPersonaId } = usePersonaSettings()
  const updatePersonaSettings = useUpdatePersonaSettings()

  // Get current active character/group and chat for link status
  const activeCharacterOrGroup = useActiveCharacterOrGroup()
  const { activeChat } = useActiveChat()

  // Handle persona selection
  const handleSelectPersona = useCallback(
    (id: string) => {
      void updatePersonaSettings({
        active: id,
      })
    },
    [updatePersonaSettings],
  )

  // Handle avatar update
  const handleAvatarUpdate = useCallback(
    async (persona: Persona, image: string) => {
      await updatePersona(persona.id, {
        metadata: {
          ...persona.metadata,
          imageUrl: image,
        },
      })
    },
    [updatePersona],
  )

  return (
    <div className="h-[470px] flex flex-col gap-2 pr-2 overflow-y-auto">
      <Virtualizer>
        {personas.map((persona) => {
          // Check link status for current persona
          const isCharacterLinked =
            activeCharacterOrGroup &&
            (persona.characters.includes(activeCharacterOrGroup.id) ||
              persona.groups.includes(activeCharacterOrGroup.id))
          const isChatLinked = activeChat && persona.chats.includes(activeChat.id)

          return (
            <div
              key={persona.id}
              className={cn(
                'h-[78px] flex items-center gap-2 p-1 my-2 rounded-md border border-border cursor-pointer hover:bg-muted relative',
                activePersonaId === persona.id && 'border-ring',
              )}
              onClick={() => handleSelectPersona(persona.id)}
            >
              {/* Active indicator dot */}
              {activePersonaId === persona.id && (
                <div className="absolute top-2 right-2 w-1 h-1 bg-green-500 rounded-full" />
              )}
              <CharacterAvatar
                src={persona.metadata.imageUrl ?? defaultPng}
                alt={persona.name}
                onFileChange={(file) => {
                  setInputImageFile(file)
                  setEditingPersonaId(persona.id)
                  setShowImageCropDialog(!!file)
                }}
                outline={defaultPersonaId === persona.id}
              />
              <div className="flex flex-col min-w-0 flex-1 mb-3">
                <div className="font-medium text-sm truncate">{persona.name}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {persona.metadata.description}
                </div>
              </div>

              {/* Link status buttons */}
              {(isCharacterLinked || isChatLinked) && (
                <div className="absolute bottom-1 right-2 flex flex-row justify-end gap-1">
                  {/* Chat Button */}
                  {isChatLinked && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'h-5 px-1 has-[>svg]:px-1 gap-0.5 text-xs transition-colors pointer-events-none',
                        'bg-amber-700/20 text-amber-700 border-amber-700/30',
                      )}
                      disabled
                    >
                      <FontAwesomeIcon icon={faLock} size="sm" className="fa-fw" />
                      <FontAwesomeIcon icon={faComments} size="sm" className="fa-fw" />
                    </Button>
                  )}

                  {/* Character Button */}
                  {isCharacterLinked && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'h-5 px-1 has-[>svg]:px-1 gap-0.5 text-xs transition-colors pointer-events-none',
                        'bg-green-500/20 text-green-600 border-green-500/30',
                      )}
                      disabled
                    >
                      <FontAwesomeIcon icon={faLock} size="sm" className="fa-fw" />
                      <FontAwesomeIcon icon={faUser} size="sm" className="fa-fw" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </Virtualizer>

      <ImageCropDialog
        open={showImageCropDialog}
        onOpenChange={setShowImageCropDialog}
        imageFile={inputImageFile}
        onCrop={(image) => {
          if (editingPersonaId) {
            const persona = personas.find((p) => p.id === editingPersonaId)
            if (persona) {
              void handleAvatarUpdate(persona, image)
            }
          }
        }}
        title="Crop Persona Avatar"
      />
    </div>
  )
}
