import type { Character } from '@/hooks/use-character'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Virtualizer } from 'virtua'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cared/ui/components/dialog'
import { MultiSelectVirtual } from '@cared/ui/components/multi-select-virtual'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'

import { CircleSpinner } from '@/components/spinner'
import {
  useLinkLorebook,
  useLorebooks,
  useLorebooksByCharacter,
  useUnlinkLorebook,
} from '@/hooks/use-lorebook'

interface CharacterLorebookDialogProps {
  trigger: ReactNode
  character: Character
}

export function CharacterLorebookDialog({ trigger, character }: CharacterLorebookDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPrimaryLorebookId, setSelectedPrimaryLorebookId] = useState<string | undefined>(
    undefined,
  )
  const [selectedAdditionalLorebookIds, setSelectedAdditionalLorebookIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { lorebooks } = useLorebooks()
  const { lorebooks: linkedLorebooks } = useLorebooksByCharacter(character.id)
  const linkLorebook = useLinkLorebook()
  const unlinkLorebook = useUnlinkLorebook()

  // Virtual list ref
  const ref = useRef<any>(null)

  // Initialize selected lorebook IDs when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log(
        'linkedLorebooks:',
        linkedLorebooks.map((lorebook) => lorebook.id),
      )

      // Find primary lorebook (the one with primary: true)
      const primaryLorebook = linkedLorebooks.find((lorebook) =>
        lorebook.primaryCharacterIds.includes(character.id),
      )

      // Find additional lorebooks (non-primary)
      const additionalLorebooks = linkedLorebooks.filter(
        (lorebook) => !lorebook.primaryCharacterIds.includes(character.id),
      )

      setSelectedPrimaryLorebookId(primaryLorebook?.id ?? 'none')
      setSelectedAdditionalLorebookIds(additionalLorebooks.map((lorebook) => lorebook.id))
    } else {
      setSelectedPrimaryLorebookId(undefined)
      setSelectedAdditionalLorebookIds([])
    }
  }, [isOpen, linkedLorebooks, character.id])

  // Transform lorebooks into select options with "None" as first option for primary
  const primaryItems = useMemo(
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

  // Transform lorebooks into multi-select options for additional (excluding the primary one)
  const additionalOptions = useMemo(
    () =>
      lorebooks
        .filter((lorebook) => lorebook.id !== selectedPrimaryLorebookId)
        .map((lorebook) => ({
          value: lorebook.id,
          label: lorebook.name,
        })),
    [lorebooks, selectedPrimaryLorebookId],
  )

  const handlePrimaryLorebookChange = async (newLorebookId: string) => {
    setSelectedPrimaryLorebookId(newLorebookId)
    setIsLoading(true)

    try {
      const currentPrimaryLorebook = linkedLorebooks.find((lorebook) =>
        lorebook.primaryCharacterIds.includes(character.id),
      )

      if (newLorebookId === 'none' && currentPrimaryLorebook) {
        await unlinkLorebook({
          lorebookId: currentPrimaryLorebook.id,
          characterId: character.id,
        })
      } else if (newLorebookId !== 'none' && newLorebookId !== currentPrimaryLorebook?.id) {
        await linkLorebook({
          lorebookId: newLorebookId,
          primaryCharacterId: character.id,
        })
      }

      // Remove the new primary lorebook from additional lorebooks if it was there
      if (newLorebookId !== 'none') {
        setSelectedAdditionalLorebookIds((prev) => prev.filter((id) => id !== newLorebookId))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdditionalLorebooksChange = async (newLorebookIds: string[]) => {
    setSelectedAdditionalLorebookIds(newLorebookIds)
    setIsLoading(true)

    try {
      const currentAdditionalLorebooks = linkedLorebooks.filter(
        (lorebook) => !lorebook.primaryCharacterIds.includes(character.id),
      )
      const currentAdditionalIds = currentAdditionalLorebooks.map((lorebook) => lorebook.id)

      // Find lorebooks to add
      const toAdd = newLorebookIds.filter((id) => !currentAdditionalIds.includes(id))

      // Find lorebooks to remove
      const toRemove = currentAdditionalIds.filter((id) => !newLorebookIds.includes(id))

      const promises = []

      // Add new lorebooks
      for (const lorebookId of toAdd) {
        promises.push(
          linkLorebook({
            lorebookId,
            characterId: character.id,
          }),
        )
      }

      // Remove lorebooks
      for (const lorebookId of toRemove) {
        promises.push(
          unlinkLorebook({
            lorebookId,
            characterId: character.id,
          }),
        )
      }

      await Promise.all(promises)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPrimaryName = primaryItems.find(
    (item) => item.id === selectedPrimaryLorebookId,
  )?.name

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000 max-w-md">
        <DialogHeader>
          <DialogTitle className="line-clamp-1">
            Character Lorebooks for {character.content.data.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Primary Lorebook Section */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-center">Primary Lorebook</span>
            <p className="text-muted-foreground text-sm">
              A selected lorebook will be bound to this character as its own lorebook. When
              generating an AI reply, it will be combined with the entries from global, persona and
              chat lorebooks. Exporting a character would also export the selected lorebook embedded
              in the JSON data.
            </p>
            <Select
              value={selectedPrimaryLorebookId ?? 'none'}
              onValueChange={handlePrimaryLorebookChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {isLoading ? (
                    <span className="flex items-center gap-1">
                      <CircleSpinner className="size-3" />
                      {selectedPrimaryName}
                    </span>
                  ) : (
                    selectedPrimaryName
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px] z-8000">
                <Virtualizer ref={ref} overscan={2}>
                  {primaryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </Virtualizer>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Lorebooks Section */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Additional Lorebooks</span>
            <p className="text-muted-foreground text-sm">
              Associate one or more auxiliary lorebooks with this character. These choices are
              optional and won't be preserved on character export!
            </p>
            <MultiSelectVirtual
              disabled={isLoading || !lorebooks.length}
              options={additionalOptions}
              values={selectedAdditionalLorebookIds}
              onValuesChange={handleAdditionalLorebooksChange}
              maxCount={5}
              modalPopover
              placeholder="No lorebooks selected. Click here to select."
              className="border-input"
              contentClassName="z-8000 w-full border-input"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
