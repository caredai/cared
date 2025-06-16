import type { Persona } from '@/hooks/use-persona'
import { useCallback, useState } from 'react'
import { Virtualizer } from 'virtua'

import { cn } from '@ownxai/ui/lib/utils'

import { CharacterAvatar } from '@/components/avatar'
import { ImageCropDialog } from '@/components/image-crop-dialog'
import { useUpdatePersona } from '@/hooks/use-persona'
import { usePersonaSettings, useUpdatePersonaSettings } from '@/hooks/use-settings'
import defaultPng from '@/public/images/user-default.png'

export function PersonaList({ personas }: { personas: Persona[] }) {
  const [inputImageFile, setInputImageFile] = useState<File>()
  const [showImageCropDialog, setShowImageCropDialog] = useState(false)
  const [editingPersonaId, setEditingPersonaId] = useState<string>()

  const updatePersona = useUpdatePersona()
  const { active: activePersonaId } = usePersonaSettings()
  const updatePersonaSettings = useUpdatePersonaSettings()

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
    <div className="flex flex-col gap-2">
      <Virtualizer>
        {personas.map((persona) => (
          <div
            key={persona.id}
            className={cn(
              'flex items-center gap-2 p-2 my-2 rounded-md border border-border cursor-pointer hover:bg-muted',
              activePersonaId === persona.id && 'bg-muted border-ring',
            )}
            onClick={() => handleSelectPersona(persona.id)}
          >
            <CharacterAvatar
              src={persona.metadata.imageUrl ?? defaultPng}
              alt={persona.name}
              onFileChange={(file) => {
                setInputImageFile(file)
                setEditingPersonaId(persona.id)
                setShowImageCropDialog(!!file)
              }}
            />
            <div className="flex flex-col min-w-0">
              <div className="font-medium truncate">{persona.name}</div>
              <div className="text-sm text-muted-foreground truncate">
                {persona.metadata.description}
              </div>
            </div>
          </div>
        ))}
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
