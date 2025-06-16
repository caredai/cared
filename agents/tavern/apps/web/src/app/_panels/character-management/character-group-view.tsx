import type { Character } from '@/hooks/use-character'
import type { CharacterGroup } from '@/hooks/use-character-group'
import type { CharGroupMetadata } from '@tavern/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { faCheck, faLeftLong, faSkull, faStar, faXmark } from '@fortawesome/free-solid-svg-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { charGroupMetadataSchema, GroupActivationStrategy, GroupGenerationMode } from '@tavern/core'
import { ChevronDownIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Virtualizer } from 'virtua'

import { Button } from '@ownxai/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ownxai/ui/components/collapsible'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@ownxai/ui/components/form'
import { Input } from '@ownxai/ui/components/input'
import { Label } from '@ownxai/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'
import { cn } from '@ownxai/ui/lib/utils'

import { CharacterTagsView } from '@/app/_panels/character-management/character-tags-view'
import { useClearAllFlags, useSetShowCharacterList } from '@/app/_panels/character-management/hooks'
import { CharacterGroupAvatar } from '@/components/avatar'
import { CheckboxField } from '@/components/checkbox-field'
import { FaButton } from '@/components/fa-button'
import { ImageCropDialog } from '@/components/image-crop-dialog'
import { OptionalNumberInput } from '@/components/number-input'
import { useCharacters } from '@/hooks/use-character'
import { useCreateCharacterGroup, useUpdateCharacterGroup } from '@/hooks/use-character-group'
import { useSetActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useCharacterSettings, useUpdateCharacterSettings } from '@/hooks/use-settings'
import { CharacterGroupItem } from './character-group-item'
import { DeleteCharacterOrGroupDialog } from './delete-character-or-group-dialog'

export function CharacterGroupView({ group }: { group?: CharacterGroup }) {
  const isCreate = !group

  const defaultMetadata: CharGroupMetadata = useMemo(() => {
    return (
      group?.metadata ?? {
        name: '',
        activationStrategy: GroupActivationStrategy.Natural,
        generationMode: GroupGenerationMode.Swap,
        allowSelfResponses: false,
        autoModeDelay: undefined,
        hideMutedSprites: false,
        disabledCharacters: [],
      }
    )
  }, [group])

  const metadataForm = useForm({
    resolver: zodResolver(charGroupMetadataSchema),
    defaultValues: defaultMetadata,
  })

  const { characters } = useCharacters()
  const setShowCharacterList = useSetShowCharacterList()
  const clearAllFlags = useClearAllFlags()
  const setActiveCharacterOrGroup = useSetActiveCharacterOrGroup()
  const createCharacterGroup = useCreateCharacterGroup()
  const updateCharacterGroup = useUpdateCharacterGroup()
  const characterSettings = useCharacterSettings()
  const updateCharacterSettings = useUpdateCharacterSettings()

  const [showImageCropDialog, setShowImageCropDialog] = useState(false)
  const [inputImageFile, setInputImageFile] = useState<File>()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pendingFavorite, setPendingFavorite] = useState(false)

  const setTagsRef = useRef<(id: string) => Promise<void>>(null)

  const [currentMembers, _setCurrentMembers] = useState<Character[]>([])

  useEffect(() => {
    _setCurrentMembers(group?.characters ?? [])
  }, [group])

  const setCurrentMembers = useCallback(
    (members: Character[] | ((prevMembers: Character[]) => Character[])) => {
      _setCurrentMembers((prev) => {
        const newMembers = typeof members === 'function' ? members(prev) : members

        if (group) {
          void updateCharacterGroup(
            group.id,
            newMembers.map((c) => c.id),
            metadataForm.getValues(),
          )
        }

        return newMembers
      })
    },
    [group, metadataForm, updateCharacterGroup],
  )

  const addableChars = useMemo(() => {
    const members = new Set(currentMembers.map((c) => c.id))
    return characters.filter((c) => !members.has(c.id))
  }, [characters, currentMembers])

  const handleClose = () => {
    setShowCharacterList()
  }

  const handleAddToFavorites = async () => {
    if (isCreate) {
      // Toggle pending favorite state during creation
      setPendingFavorite(!pendingFavorite)
      return
    }

    // Handle favorite for existing group
    const isFavorite = characterSettings.favorites.includes(group.id)
    const newFavorites = isFavorite
      ? characterSettings.favorites.filter((id) => id !== group.id)
      : [...characterSettings.favorites, group.id]

    await updateCharacterSettings({
      favorites: newFavorites,
    })
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const handleCreate = async () => {
    handleClose()

    if (!metadataForm.watch('name')) {
      metadataForm.setValue(
        'name',
        `Group: ${currentMembers.map((c) => c.content.data.name).join(', ')}`.trim(),
      )
    }

    const { group } = await createCharacterGroup(currentMembers, metadataForm.getValues())

    // Apply pending favorite state after creation
    if (pendingFavorite) {
      const newFavorites = [...characterSettings.favorites, group.id]
      void updateCharacterSettings({
        favorites: newFavorites,
      })
    }

    void setTagsRef.current?.(group.id)
  }

  const operateActions = [
    {
      action: handleClose,
      icon: isCreate ? faXmark : faLeftLong,
      tooltip: 'Cancel',
    },
    {
      action: handleAddToFavorites,
      icon: faStar,
      tooltip: (isCreate ? pendingFavorite : characterSettings.favorites.includes(group.id))
        ? 'Remove from Favorites'
        : 'Add to Favorites',
      className: (isCreate ? pendingFavorite : characterSettings.favorites.includes(group.id))
        ? 'text-yellow-400 hover:text-yellow-400'
        : '',
    },
    {
      action: !isCreate && handleDelete,
      icon: faSkull,
      tooltip: 'Delete character group',
      className: 'bg-destructive/50 hover:bg-destructive',
    },
    {
      action: isCreate && handleCreate,
      icon: faCheck,
      tooltip: 'Create character group',
    },
  ]

  // Handle character selection
  const handleSelect = (char: Character) => {
    // TODO
    setActiveCharacterOrGroup(char.id)
    clearAllFlags()
  }

  // Handle character trigger
  const handleTrigger = (_char: Character) => {
    // TODO: Implement character trigger logic
  }

  // Handle character add
  const handleAdd = (char: Character) => {
    setCurrentMembers((prev) => [...prev, char])
  }

  // Handle character removal
  const handleRemove = (char: Character) => {
    setCurrentMembers((prev) => prev.filter((c) => c.id !== char.id))
  }

  // Handle move character up
  const handleMoveUp = (char: Character) => {
    setCurrentMembers((prev) => {
      const index = prev.findIndex((c) => c.id === char.id)
      if (index <= 0) return prev
      const newMembers = [...prev]
      const temp = newMembers[index - 1]!
      newMembers[index - 1] = newMembers[index]!
      newMembers[index] = temp
      return newMembers
    })
  }

  // Handle move character down
  const handleMoveDown = (char: Character) => {
    setCurrentMembers((prev) => {
      const index = prev.findIndex((c) => c.id === char.id)
      if (index === -1 || index >= prev.length - 1) return prev
      const newMembers = [...prev]
      const temp = newMembers[index + 1]!
      newMembers[index + 1] = newMembers[index]!
      newMembers[index] = temp
      return newMembers
    })
  }

  // Handle toggle disabled
  const handleToggleDisabled = (char: Character) => {
    const disabledChars = metadataForm.getValues('disabledCharacters') ?? []
    const isDisabled = disabledChars.includes(char.id)

    if (isDisabled) {
      metadataForm.setValue(
        'disabledCharacters',
        disabledChars.filter((id) => id !== char.id),
      )
    } else {
      metadataForm.setValue('disabledCharacters', [...disabledChars, char.id])
    }

    if (group) {
      void updateCharacterGroup(group.id, undefined, metadataForm.getValues())
    }
  }

  const [isShowCurrentMembers, setIsShowCurrentMembers] = useState(true)
  const [isShowAddableChars, setIsShowAddableChars] = useState(isCreate)

  return (
    <div className="flex-1 overflow-y-auto p-[1px]">
      <Virtualizer>
        <Collapsible defaultOpen className="my-2">
          <CollapsibleTrigger asChild>
            <div className="flex justify-between items-center cursor-pointer [&[data-state=open]>button>svg]:rotate-180">
              <Label className="cursor-pointer">Group Controls</Label>
              <Button type="button" variant="outline" size="icon" className="size-6">
                <ChevronDownIcon className="transition-transform duration-200" />
              </Button>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden pt-2 px-[1px] flex flex-col gap-2">
            <div className="flex flex-row justify-between items-center gap-4">
              <CharacterGroupAvatar
                src={metadataForm.watch('imageUrl')}
                characterAvatars={group?.characters.map((c) => c.metadata.url)}
                alt={metadataForm.watch('name')}
                onFileChange={(file) => {
                  setInputImageFile(file)
                  setShowImageCropDialog(!!file)
                }}
              />

              <div className="flex flex-row flex-wrap justify-end gap-1">
                {operateActions
                  .filter(
                    (
                      value,
                    ): value is (typeof operateActions)[number] & {
                      action: () => void
                    } => !!value.action,
                  )
                  .map(({ action, icon, tooltip, className }, index) => {
                    return (
                      <FaButton
                        key={index}
                        icon={icon}
                        btnSize="size-7"
                        iconSize="1x"
                        title={tooltip}
                        className={cn(
                          'text-foreground border-1 hover:bg-muted-foreground rounded-sm',
                          className,
                        )}
                        onClick={action}
                      />
                    )
                  })}
              </div>
            </div>

            <Form {...metadataForm}>
              <form
                onBlur={() => {
                  if (group) {
                    void updateCharacterGroup(group.id, undefined, metadataForm.getValues())
                  }
                }}
                className="flex flex-col gap-2"
              >
                <FormField
                  control={metadataForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Group name (optional)" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <CharacterTagsView ref={setTagsRef} />

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <FormField
                      control={metadataForm.control}
                      name="activationStrategy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activation Strategy</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-6000">
                              <SelectItem value={GroupActivationStrategy.Natural}>
                                Natural
                              </SelectItem>
                              <SelectItem value={GroupActivationStrategy.List}>List</SelectItem>
                              <SelectItem value={GroupActivationStrategy.Manual}>Manual</SelectItem>
                              <SelectItem value={GroupActivationStrategy.Pooled}>Pooled</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={metadataForm.control}
                      name="generationMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Generation Mode</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-6000">
                              <SelectItem value={GroupGenerationMode.Swap}>Swap</SelectItem>
                              <SelectItem value={GroupGenerationMode.Append}>Append</SelectItem>
                              <SelectItem value={GroupGenerationMode.AppendDisabled}>
                                Append Disabled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <FormField
                      control={metadataForm.control}
                      name="autoModeDelay"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-1">
                          <FormLabel className="mb-0">Auto mode delay</FormLabel>
                          <FormControl>
                            <OptionalNumberInput
                              min={1}
                              step={1}
                              {...field}
                              className="w-16 h-7 px-2 py-0.5"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <CheckboxField
                      label="Allow Self Responses"
                      name="allowSelfResponses"
                      control={metadataForm.control}
                    />

                    <CheckboxField
                      label="Hide Muted Sprites"
                      name="hideMutedSprites"
                      control={metadataForm.control}
                    />
                  </div>
                </div>
              </form>
            </Form>
          </CollapsibleContent>
        </Collapsible>

        <CollapsibleHeader
          title="Current Members"
          open={isShowCurrentMembers}
          onOpenChange={setIsShowCurrentMembers}
        />

        {isShowCurrentMembers &&
          (currentMembers.length ? (
            currentMembers.map((char) => (
              <CharacterGroupItem
                key={char.id}
                character={char}
                disabled={metadataForm.watch('disabledCharacters')?.includes(char.id)}
                onToggleDisabled={() => handleToggleDisabled(char)}
                onTrigger={() => handleTrigger(char)}
                onSelect={() => handleSelect(char)}
                onRemove={() => handleRemove(char)}
                onMoveUp={() => handleMoveUp(char)}
                onMoveDown={() => handleMoveDown(char)}
              />
            ))
          ) : (
            <div className="text-sm text-muted-foreground mb-2">No members yet</div>
          ))}

        <CollapsibleHeader
          title="Add Members"
          open={isShowAddableChars}
          onOpenChange={setIsShowAddableChars}
        />

        {isShowAddableChars &&
          (addableChars.length ? (
            addableChars.map((char) => (
              <CharacterGroupItem
                key={char.id}
                character={char}
                onSelect={() => handleSelect(char)}
                onAdd={() => handleAdd(char)}
              />
            ))
          ) : (
            <div className="text-sm text-muted-foreground mb-2">No characters available</div>
          ))}
      </Virtualizer>

      <ImageCropDialog
        open={showImageCropDialog}
        onOpenChange={setShowImageCropDialog}
        imageFile={inputImageFile}
        onCrop={(image) => {
          metadataForm.setValue('imageUrl', image)
          if (group) {
            void updateCharacterGroup(group.id, undefined, metadataForm.getValues())
          }
        }}
        title="Crop Character Group Image"
      />

      {group && (
        <DeleteCharacterOrGroupDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          charOrGroup={group}
          onDelete={handleClose}
        />
      )}
    </div>
  )
}

function CollapsibleHeader({
  title,
  open,
  onOpenChange,
}: {
  title: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="my-2">
      <CollapsibleTrigger asChild>
        <div className="flex justify-between items-center cursor-pointer [&[data-state=open]>button>svg]:rotate-180">
          <span className="text-sm">{title}</span>
          <Button type="button" variant="outline" size="icon" className="size-6">
            <ChevronDownIcon className="transition-transform duration-200" />
          </Button>
        </div>
      </CollapsibleTrigger>
    </Collapsible>
  )
}
