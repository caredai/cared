'use client'

import type { Character } from '@/hooks/use-character'
import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import {
  faBook,
  faClone,
  faEllipsisVertical,
  faFaceSmile,
  faFileExport,
  faGlobe,
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
import { useSetShowCharacterList } from '@/app/_panels/character-management/hooks'
import { CharacterAvatar } from '@/components/avatar'
import { FaButton } from '@/components/fa-button'
import { ImageCropDialog } from '@/components/image-crop-dialog'
import { useUpdateCharacterDebounce, useUpdateCharacterImage } from '@/hooks/use-character'
import { useIsShowCharacterAdvancedView } from '@/hooks/use-show-in-content-area'
import { CharacterBasicForm } from './character-basic-form'
import { CharacterTagsView } from './character-tags-view'
import { CharacterViewAdvanced } from './character-view-advanced'
import { DeleteCharacterDialog } from './delete-character-dialog'
import { useImportTags } from './import-tags-dialog'

export function CharacterView({ character }: { character: Character }) {
  const setShowCharacterList = useSetShowCharacterList()
  const { isShowCharacterAdvancedView, toggleIsShowCharacterAdvancedView } =
    useIsShowCharacterAdvancedView()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleAddToFavorites = () => {
    console.log('Set favorite character')
  }

  const handleShowAdvancedDefinitions = () => {
    toggleIsShowCharacterAdvancedView()
  }

  const handleDeleteCharacter = () => {
    setShowDeleteDialog(true)
  }

  const operateActions = [
    {
      action: handleAddToFavorites,
      icon: faStar,
      tooltip: 'Add to favorites',
      className: 'text-yellow-400',
    },
    {
      action: handleShowAdvancedDefinitions,
      icon: faBook,
      tooltip: 'Advanced definitions',
    },
    {
      action: handleAddToFavorites,
      icon: faGlobe,
      tooltip: 'Add to favorites',
    },
    {
      action: handleAddToFavorites,
      icon: faPassport,
      tooltip: 'Add to favorites',
    },
    {
      action: handleAddToFavorites,
      icon: faFaceSmile,
      tooltip: 'Add to favorites',
    },
    {
      action: handleAddToFavorites,
      icon: faFileExport,
      tooltip: 'Add to favorites',
    },
    {
      action: handleAddToFavorites,
      icon: faClone,
      tooltip: 'Add to favorites',
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
    <div className="flex flex-col gap-4 overflow-y-auto p-[1px]">
      <div className="flex flex-row justify-between items-center gap-4">
        <CharacterAvatar
          src={character.metadata.url}
          alt={character.content.data.name}
          onFileChange={(file) => {
            setInputImageFile(file)
            setShowImageCropDialog(!!file)
          }}
        />

        <div className="flex flex-col gap-2">
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

      <DeleteCharacterDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        character={character}
        onDelete={() => setShowCharacterList(true)}
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
