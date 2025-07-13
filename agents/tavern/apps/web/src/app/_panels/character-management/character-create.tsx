import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import {
  faBook,
  faCheck,
  faEllipsisVertical,
  faStar,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { formatExtensions } from '@tavern/core'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@ownxai/ui/components/dropdown-menu'
import { cn } from '@ownxai/ui/lib/utils'

import type { CharacterAdvancedFormValues } from './character-advanced-form'
import type { CharacterBasicFormValues } from './character-basic-form'
import { CharacterAvatar } from '@/components/avatar'
import { FaButton } from '@/components/fa-button'
import { ImageCropDialog } from '@/components/image-crop-dialog'
import { useCreateCharacter } from '@/hooks/use-character'
import { useIsShowCharacterAdvancedView } from '@/hooks/use-show-in-content-area'
import defaultPng from '@/public/images/ai4.png'
import {
  CharacterAdvancedForm,
  defaultCharacterAdvancedFormValues,
} from './character-advanced-form'
import { CharacterBasicForm } from './character-basic-form'
import { CharacterTagsView } from './character-tags-view'
import { useSetShowCharacterList } from './hooks'

export function CharacterCreate() {
  const setShowCharacterList = useSetShowCharacterList()

  const { isShowCharacterAdvancedView, toggleIsShowCharacterAdvancedView } =
    useIsShowCharacterAdvancedView()

  const getBasicValuesRef = useRef<() => Promise<CharacterBasicFormValues | false>>(null)
  const getAdvancedValuesRef = useRef<() => Promise<CharacterAdvancedFormValues | false>>(null)
  const setTagsRef = useRef<(id: string) => Promise<void>>(null)

  const [imageDataUrl, setImageDataUrl] = useState<string>()
  const [showImageCropDialog, setShowImageCropDialog] = useState(false)
  const [inputImageFile, setInputImageFile] = useState<File>()

  const createCharacter = useCreateCharacter()

  const handleCreate = async () => {
    const basic = await getBasicValuesRef.current?.()
    const advanced = isShowCharacterAdvancedView
      ? await getAdvancedValuesRef.current?.()
      : defaultCharacterAdvancedFormValues

    if (!basic || !advanced) {
      return
    }

    handleClose()

    const { character } = await createCharacter(
      {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: {
          ...basic,
          ...advanced,
          name: basic.name, // avoid overriding
          extensions: formatExtensions(advanced),
        },
      },
      imageDataUrl,
    )

    await setTagsRef.current?.(character.id)
  }

  const handleClose = () => {
    setShowCharacterList()
  }

  const handleAddToFavorites = () => {
    console.log('Set favorite character')
  }

  const handleShowAdvancedDefinitions = () => {
    toggleIsShowCharacterAdvancedView()
  }

  const operateActions = [
    {
      action: handleClose,
      icon: faXmark,
      tooltip: 'Cancel creation',
    },
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
      action: handleCreate,
      icon: faCheck,
      tooltip: 'Create character',
    },
    {
      action: handleAddToFavorites,
      icon: faEllipsisVertical,
      tooltip: 'More...',
      wrapper: MoreActionsDropdownMenu,
    },
  ]

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-[1px]">
      <div className="flex flex-row justify-between items-center gap-4">
        <CharacterAvatar
          src={imageDataUrl ?? defaultPng}
          alt="character avatar"
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

              return Wrapper ? <Wrapper key={index} trigger={btn} /> : btn
            })}
          </div>
        </div>
      </div>

      <CharacterTagsView ref={setTagsRef} />

      <CharacterBasicForm ref={getBasicValuesRef} />

      {isShowCharacterAdvancedView && <CharacterAdvancedForm ref={getAdvancedValuesRef} />}

      <ImageCropDialog
        open={showImageCropDialog}
        onOpenChange={setShowImageCropDialog}
        imageFile={inputImageFile}
        onCrop={setImageDataUrl}
        title="Crop Character Image"
      />
    </div>
  )
}

export function MoreActionsDropdownMenu({ trigger }: { trigger: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 z-5000" side="bottom" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Keyboard shortcuts
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>More...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>
            New Team
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>GitHub</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuItem disabled>API</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
