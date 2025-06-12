'use client'

import type { Character } from '@/hooks/use-character'
import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import {
  faBook,
  faClone,
  faComments,
  faEllipsisVertical,
  faFaceSmile,
  faFileExport,
  faGlobe,
  faLeftLong,
  faPassport,
  faSkull,
  faStar,
} from '@fortawesome/free-solid-svg-icons'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ownxai/ui/components/dropdown-menu'
import { cn } from '@ownxai/ui/lib/utils'

import type { CharacterBasicFormValues } from './character-basic-form'
import {
  useSetShowCharacterList,
  useSetShowChatList,
} from '@/app/_panels/character-management/hooks'
import { CharacterAvatar } from '@/components/avatar'
import { FaButton } from '@/components/fa-button'
import { ImageCropDialog } from '@/components/image-crop-dialog'
import { useUpdateCharacterDebounce, useUpdateCharacterImage } from '@/hooks/use-character'
import { useCharacterSettings, useUpdateCharacterSettings } from '@/hooks/use-settings'
import { useIsShowCharacterAdvancedView } from '@/hooks/use-show-in-content-area'
import { CharacterBasicForm } from './character-basic-form'
import { CharacterTagsView } from './character-tags-view'
import { CharacterViewAdvanced } from './character-view-advanced'
import { DeleteCharacterOrGroupDialog } from './delete-character-or-group-dialog'
import { useImportTags } from './import-tags-dialog'

export function CharacterView({ character }: { character: Character }) {
  const setShowCharacterList = useSetShowCharacterList()
  const setShowChatList = useSetShowChatList()
  const { isShowCharacterAdvancedView, toggleIsShowCharacterAdvancedView } =
    useIsShowCharacterAdvancedView()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const characterSettings = useCharacterSettings()
  const updateCharacterSettings = useUpdateCharacterSettings()

  const handleClose = () => {
    setShowCharacterList()
  }

  const handleToggleShowChatList = () => {
    setShowChatList()
  }

  const handleAddToFavorites = async () => {
    const isFavorite = characterSettings.favorites.includes(character.id)
    const newFavorites = isFavorite
      ? characterSettings.favorites.filter((id) => id !== character.id)
      : [...characterSettings.favorites, character.id]

    await updateCharacterSettings({
      favorites: newFavorites,
    })
  }

  const handleShowAdvancedDefinitions = () => {
    toggleIsShowCharacterAdvancedView()
  }

  const handleDeleteCharacter = () => {
    setShowDeleteDialog(true)
  }

  const operateActions = [
    {
      action: handleClose,
      icon: faLeftLong,
    },
    {
      action: handleToggleShowChatList,
      icon: faComments,
      tooltip: 'Show Chat History',
    },
    {
      action: handleAddToFavorites,
      icon: faStar,
      tooltip: characterSettings.favorites.includes(character.id)
        ? 'Remove from Favorites'
        : 'Add to Favorites',
      className: characterSettings.favorites.includes(character.id)
        ? 'text-yellow-400 hover:text-yellow-400'
        : '',
    },
    {
      action: handleShowAdvancedDefinitions,
      icon: faBook,
      tooltip: 'Advanced Definitions',
    },
    {
      action: handleAddToFavorites,
      icon: faGlobe,
      tooltip: 'Character Lore',
    },
    {
      action: handleAddToFavorites,
      icon: faPassport,
      tooltip: 'Chat Lore',
    },
    {
      action: handleAddToFavorites,
      icon: faFaceSmile,
      tooltip: 'Connected Personas',
    },
    {
      action: handleAddToFavorites,
      icon: faFileExport,
      tooltip: 'Export Character',
    },
    {
      action: handleAddToFavorites,
      icon: faClone,
      tooltip: 'Duplicate Character',
    },
    {
      action: handleDeleteCharacter,
      icon: faSkull,
      tooltip: 'Delete character',
      className: 'bg-destructive/50 hover:bg-destructive',
    },
    {
      action: handleAddToFavorites,
      icon: faEllipsisVertical,
      tooltip: 'More...',
      wrapper: MoreActionsDropdownMenu,
    },
  ]

  const updateCharacter = useUpdateCharacterDebounce()

  const onSubmit = useCallback(
    async (updates: Partial<CharacterBasicFormValues>) => {
      await updateCharacter(character, {
        ...character.content,
        data: {
          ...character.content.data,
          ...updates,
        },
      })
    },
    [character, updateCharacter],
  )

  const [showImageCropDialog, setShowImageCropDialog] = useState(false)
  const [inputImageFile, setInputImageFile] = useState<File>()

  const updateCharacterImage = useUpdateCharacterImage()

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-[1px]">
      <div className="flex flex-row justify-between items-center gap-4">
        <CharacterAvatar
          src={character.metadata.url}
          alt={character.content.data.name}
          onFileChange={(file) => {
            setInputImageFile(file)
            setShowImageCropDialog(!!file)
          }}
        />

        <div className="flex flex-row flex-wrap justify-end gap-1">
          {operateActions.map(({ action, icon, tooltip, className, wrapper: Wrapper }, index) => {
            const btn = (
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

            return Wrapper ? <Wrapper key={index} trigger={btn} character={character} /> : btn
          })}
        </div>
      </div>

      <CharacterTagsView />

      <CharacterBasicForm onChange={onSubmit} />

      {isShowCharacterAdvancedView && <CharacterViewAdvanced />}

      <ImageCropDialog
        open={showImageCropDialog}
        onOpenChange={setShowImageCropDialog}
        imageFile={inputImageFile}
        onCrop={(image) => updateCharacterImage(character, image)}
      />

      <DeleteCharacterOrGroupDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        charOrGroup={character}
        onDelete={handleClose}
      />
    </div>
  )
}

export function MoreActionsDropdownMenu({
  trigger,
  character,
}: {
  trigger: ReactNode
  character: Character
}) {
  const importTags = useImportTags()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 z-5000" side="bottom" align="end">
        <DropdownMenuLabel>More Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => importTags(character)}>
          Import Tags
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
