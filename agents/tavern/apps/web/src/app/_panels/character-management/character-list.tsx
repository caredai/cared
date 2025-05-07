'use client'

import type { Character } from '@/lib/character'
import type { CheckedState } from '@radix-ui/react-checkbox'
import { useRef, useState } from 'react'
import {
  faCloudArrowDown,
  faFileImport,
  faGear,
  faListSquares,
  faStar,
  faTags,
  faUserPlus,
  faUsers,
  faUsersGear,
} from '@fortawesome/free-solid-svg-icons'
import { TrashIcon, XIcon } from 'lucide-react'
import { VList } from 'virtua'

import { Button } from '@ownxai/ui/components/button'
import { CheckboxIndeterminate } from '@ownxai/ui/components/checkbox-indeterminate'
import { cn } from '@ownxai/ui/lib/utils'

import { FaButton } from '@/components/fa-button'
import { useCharacters } from '@/lib/character'
import { CharacterItem } from './character-item'
import { DeleteCharactersDialog } from './delete-characters-dialog'
import { ImportFileInput } from './import-file-input'
import { ImportUrlDialog } from './import-url-dialog'

export function CharacterList({
  selectCharacter,
}: {
  selectCharacter: (character: Character | undefined) => void
}) {
  const { characters } = useCharacters()

  const [isImportUrlDialogOpen, setIsImportUrlDialogOpen] = useState(false)

  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())
  const [selectState, setSelectState] = useState<CheckedState>(false)
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)
  const setSelectMode = (isSelectMode: boolean) => {
    setIsSelectMode(isSelectMode)
    setSelectedCharacters(new Set())
    setSelectState(false)
    setLastSelectedId(null)
  }

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const importFileInputRef = useRef<HTMLInputElement>(null)

  // Handle import button click
  const handleImportClick = () => {
    importFileInputRef.current?.click()
  }

  const handleCreateCharacter = () => {
    // Logic for creating new character
    console.log('Create new character')
  }

  const handleImportFromUrl = () => {
    setIsImportUrlDialogOpen(true)
  }

  const handleCreateGroup = () => {
    // Logic for creating character group
    console.log('Create character group')
  }

  const handleShowFavorites = () => {
    console.log('Show only favorite characters')
  }

  const handleShowGroups = () => {
    console.log('Show only groups')
  }

  const handleManageTags = () => {
    console.log('Manage tags')
  }

  const handleShowTags = () => {
    console.log('Show tags')
  }

  const handleSelectCharacters = () => {
    setSelectMode(!isSelectMode)
  }

  const handleSelectAll = () => {
    const allIds = new Set(characters.map((char) => char.id))
    setSelectedCharacters(allIds)
    setSelectState(true)
  }

  const handleDeselectAll = () => {
    setSelectedCharacters(new Set())
    setSelectState(false)
  }

  const handleDeleteSelected = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleCharacterSelect = (
    characterId: string,
    selected: boolean,
    event?: React.MouseEvent,
  ) => {
    if (!isSelectMode) {
      selectCharacter(characters.find((char) => char.id === characterId))
      return
    }

    const newSelected = new Set(selectedCharacters)

    // Handle shift-click selection
    if (event?.shiftKey && lastSelectedId && selectedCharacters.has(lastSelectedId)) {
      const lastIndex = characters.findIndex((char) => char.id === lastSelectedId)
      const currentIndex = characters.findIndex((char) => char.id === characterId)

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex)
        const end = Math.max(lastIndex, currentIndex)

        // Select all characters between last selected and current
        for (let i = start; i <= end; i++) {
          newSelected.add(characters[i]!.id)
        }
      }
    } else {
      // Normal selection
      if (selected) {
        newSelected.add(characterId)
      } else {
        newSelected.delete(characterId)
      }
    }

    setSelectedCharacters(newSelected)
    setLastSelectedId(characterId)

    // Update select state based on selection
    if (newSelected.size === 0) {
      setSelectState(false)
    } else if (newSelected.size === characters.length) {
      setSelectState(true)
    } else {
      setSelectState('indeterminate')
    }
  }

  const createActions = [
    {
      action: handleCreateCharacter,
      icon: faUserPlus,
      tooltip: 'Create New Character',
    },
    {
      action: handleImportClick,
      icon: faFileImport,
      tooltip: 'Import Character from File',
    },
    {
      action: handleImportFromUrl,
      icon: faCloudArrowDown,
      tooltip: 'Import Character from external URL',
    },
    {
      action: handleCreateGroup,
      icon: faUsersGear,
      tooltip: 'Create New Character Group',
    },
  ]

  const operateActions = [
    {
      action: handleShowFavorites,
      icon: faStar,
      tooltip: 'Show only favorite characters',
    },
    {
      action: handleShowGroups,
      icon: faUsers,
      tooltip: 'Show only groups',
    },
    {
      action: handleManageTags,
      icon: faGear,
      tooltip: 'Manage tags',
    },
    {
      action: handleShowTags,
      icon: faTags,
      tooltip: 'Show tags',
    },
    {
      action: handleSelectCharacters,
      icon: faListSquares,
      tooltip: 'Select characters',
      className: isSelectMode ? 'text-yellow-500' : '',
    },
  ]

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-row gap-1">
        {createActions.map(({ action, icon, tooltip }, index) => (
          <FaButton
            key={index}
            icon={icon}
            btnSize="size-8"
            iconSize="lg"
            title={tooltip}
            className="text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm"
            onClick={action}
          />
        ))}
      </div>

      <div className="flex flex-row gap-1">
        {operateActions.map(({ action, icon, tooltip, className }, index) => (
          <FaButton
            key={index}
            icon={icon}
            btnSize="size-8"
            iconSize="1x"
            title={tooltip}
            className={cn(
              'border-1 border-ring/60 bg-ring/10 hover:border-ring hover:bg-ring rounded-full',
              className,
            )}
            onClick={typeof action === 'function' ? action : undefined}
          />
        ))}
      </div>

      {isSelectMode && (
        <div className="flex flex-row gap-2 items-center">
          <span className="text-sm text-muted-foreground">{selectedCharacters.size} selected</span>
          <div className="flex flex-row gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-6 text-muted-foreground"
              title="Select/deselect all characters"
              asChild
            >
              <CheckboxIndeterminate
                className="border-ring text-muted-foreground data-[state=checked]:bg-transparent data-[state=checked]:text-muted-foreground data-[state=checked]:border-ring data-[state=checked]:hover:bg-accent"
                checked={selectState}
                onCheckedChange={(checked) => {
                  if (checked === true) {
                    handleSelectAll()
                  } else {
                    handleDeselectAll()
                  }
                }}
              />
            </Button>
            {selectedCharacters.size > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="size-6 border-ring text-muted-foreground hover:text-muted-foreground"
                title="Delete selected characters"
                onClick={handleDeleteSelected}
              >
                <TrashIcon />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="size-6 border-ring text-muted-foreground hover:text-muted-foreground"
              title="Exit selection mode"
              onClick={() => {
                setSelectMode(false)
              }}
            >
              <XIcon />
            </Button>
          </div>
        </div>
      )}

      <VList className="flex-1" count={characters.length}>
        {(i) => {
          const character = characters[i]!
          return (
            <CharacterItem
              key={character.id}
              character={character}
              isSelectMode={isSelectMode}
              isSelected={selectedCharacters.has(character.id)}
              onSelect={handleCharacterSelect}
            />
          )
        }}
      </VList>

      <ImportFileInput ref={importFileInputRef} />

      <ImportUrlDialog open={isImportUrlDialogOpen} onOpenChange={setIsImportUrlDialogOpen} />

      <DeleteCharactersDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedCharacterIds={Array.from(selectedCharacters)}
        onDelete={() => setSelectMode(false)}
      />
    </div>
  )
}
