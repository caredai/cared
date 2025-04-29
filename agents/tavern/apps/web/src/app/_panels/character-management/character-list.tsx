import { useRef, useState } from 'react'
import {
  faCloudArrowDown,
  faFileImport,
  faGear,
  faStar,
  faTags,
  faTrash,
  faSquareCheck,
  faCheckDouble,
  faListSquares,
  faUserPlus,
  faUsers,
  faUsersGear,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { VList } from 'virtua'

import { FaButton } from '@/components/fa-button'
import { useCharacters, useImportCharactersFromFiles } from '@/lib/character'
import { CharacterItem } from './character-item'
import { ImportUrlDialog } from './import-url-dialog'
import { DeleteCharactersDialog } from './delete-characters-dialog'

export function CharacterList() {
  const { characters } = useCharacters()
  const importCharacters = useImportCharactersFromFiles()
  const [isImportUrlDialogOpen, setIsImportUrlDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())

  // Create file input reference
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void importCharacters(event.target.files).finally(() => {
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    })
  }

  // Handle import button click
  const handleImportClick = () => {
    fileInputRef.current?.click()
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
    setIsSelectMode(!isSelectMode)
    if (!isSelectMode) {
      setSelectedCharacters(new Set())
    }
  }

  const handleSelectAll = () => {
    const allIds = new Set(characters.map(char => char.id))
    setSelectedCharacters(allIds)
  }

  const handleDeselectAll = () => {
    setSelectedCharacters(new Set())
  }

  const handleDeleteSelected = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleCharacterSelect = (characterId: string, selected: boolean) => {
    const newSelected = new Set(selectedCharacters)
    if (selected) {
      newSelected.add(characterId)
    } else {
      newSelected.delete(characterId)
    }
    setSelectedCharacters(newSelected)
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

  const operateActions = [{
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
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".png,.json,.charx"
        multiple
        onChange={handleFileChange}
      />

      <div className="flex flex-row gap-1">
        {createActions.map(({ action, icon, tooltip }, index) => (
          <FaButton
            key={index}
            icon={icon}
            btnSize="size-8"
            iconSize="lg"
            title={tooltip}
            className="text-foreground border-1 border-background hover:bg-muted-foreground rounded-sm"
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
            className={`border-1 border-ring/60 bg-ring/10 hover:border-ring hover:bg-ring rounded-full ${className || ''}`}
            onClick={typeof action === 'function' ? action : undefined}
          />
        ))}
      </div>

      {isSelectMode && (
        <div className="flex flex-row gap-2 items-center">
          <span className="text-sm text-muted-foreground">
            {selectedCharacters.size} selected
          </span>
          <div className="flex flex-row gap-1">
            {selectedCharacters.size < characters.length && (
              <FaButton
                icon={faCheckDouble}
                btnSize="size-8"
                iconSize="1x"
                title="Select All"
                className="border-1 border-ring/60 bg-ring/10 hover:border-ring hover:bg-ring rounded-full"
                onClick={handleSelectAll}
              />
            )}
            {selectedCharacters.size > 0 && (
              <>
                <FaButton
                  icon={faSquareCheck}
                  btnSize="size-8"
                  iconSize="1x"
                  title="Deselect All"
                  className="border-1 border-ring/60 bg-ring/10 hover:border-ring hover:bg-ring rounded-full"
                  onClick={handleDeselectAll}
                />
                <FaButton
                  icon={faTrash}
                  btnSize="size-8"
                  iconSize="1x"
                  title="Delete Selected"
                  className="border-1 border-ring/60 bg-ring/10 hover:border-ring hover:bg-ring rounded-full"
                  onClick={handleDeleteSelected}
                />
              </>
            )}
            <FaButton
              icon={faXmark}
              btnSize="size-8"
              iconSize="1x"
              title="Exit Selection Mode"
              className="border-1 border-ring/60 bg-ring/10 hover:border-ring hover:bg-ring rounded-full"
              onClick={() => setIsSelectMode(false)}
            />
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

      <ImportUrlDialog open={isImportUrlDialogOpen} onOpenChange={setIsImportUrlDialogOpen} />
      <DeleteCharactersDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedCharacterIds={Array.from(selectedCharacters)}
      />
    </div>
  )
}
