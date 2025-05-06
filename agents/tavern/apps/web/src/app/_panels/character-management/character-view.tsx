'use client'

import type { Character } from '@/lib/character'
import { ReactNode, useState } from 'react'
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
import { Textarea } from '@ownxai/ui/components/textarea'
import { cn } from '@ownxai/ui/lib/utils'

import { CharacterAvatar } from '@/components/avatar'
import { FaButton } from '@/components/fa-button'
import { CharacterViewAdvanced } from './character-view-advanced'

export function CharacterView({ character }: { character: Character }) {
  const data = character.content.data
  const metadata = character.metadata

  const [isAdvancedDialogOpen, setIsAdvancedDialogOpen] = useState(false)

  const handleAddToFavorites = () => {
    console.log('Set favorite character')
  }

  const handleShowAdvancedDefinitions = () => {
    setIsAdvancedDialogOpen(!isAdvancedDialogOpen)
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
      action: handleAddToFavorites,
      icon: faSkull,
      tooltip: 'Add to favorites',
      className: 'bg-destructive/50 hover:bg-destructive',
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
        <CharacterAvatar src={character.metadata.url} alt={data.name} />

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

      <div className="flex flex-col gap-2">
        <h2>Creator's Notes</h2>
        <Textarea defaultValue={data.creator_notes} disabled className="h-30" />
      </div>

      <div className="flex flex-col gap-2">
        <h2>Description</h2>
        <Textarea value={data.description} className="h-80" />
      </div>

      <div className="flex flex-col gap-2">
        <h2>First message</h2>
        <Textarea value={data.first_mes} className="h-30" />
      </div>

      {isAdvancedDialogOpen && (
        <CharacterViewAdvanced
          character={character}
          onClose={() => setIsAdvancedDialogOpen(false)}
        />
      )}
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
