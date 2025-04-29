import { useRef, useState } from 'react'
import {
  faCloudArrowDown,
  faFileImport,
  faGear,
  faStar,
  faTags,
  faUserPlus,
  faUsers,
  faUsersGear,
} from '@fortawesome/free-solid-svg-icons'
import { VList } from 'virtua'

import { FaButton } from '@/components/fa-button'
import { useCharacters, useImportCharactersFromFiles } from '@/lib/character'
import { CharacterItem } from './character-item'
import { ImportUrlDialog } from './import-url-dialog'

export function CharacterList() {
  const { characters } = useCharacters()
  const importCharacters = useImportCharactersFromFiles()
  const [isImportUrlDialogOpen, setIsImportUrlDialogOpen] = useState(false)

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

  const filterActions = [
    {
      action: 'show-favorites',
      icon: faStar,
      tooltip: 'Show only favorite characters',
    },
    {
      action: 'show-groups',
      icon: faUsers,
      tooltip: 'Show only groups',
    },
    {
      action: 'manage-tags',
      icon: faGear,
      tooltip: 'Manage tags',
    },
    {
      action: 'show-tags',
      icon: faTags,
      tooltip: 'Show tags',
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
        {filterActions.map(({ action, icon, tooltip }, index) => (
          <FaButton
            key={index}
            icon={icon}
            btnSize="size-8"
            iconSize="1x"
            title={tooltip}
            className="border-1 border-ring/60 bg-ring/10 hover:border-ring hover:bg-ring rounded-full"
            onClick={typeof action === 'function' ? action : undefined}
          />
        ))}
      </div>

      <VList className="flex-1">
        {characters.map((character) => (
          <CharacterItem key={character.id} character={character} />
        ))}
      </VList>

      <ImportUrlDialog
        open={isImportUrlDialogOpen}
        onOpenChange={setIsImportUrlDialogOpen}
      />
    </div>
  )
}
