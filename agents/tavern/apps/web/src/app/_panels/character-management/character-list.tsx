import type { Character } from '@tavern/db/schema'
import { useRef } from 'react'
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

import { TooltipFaButton } from '@/components/fa-button'
import { RemoteImage } from '@/components/image'
import { useCharacters, useImportCharacters } from '@/lib/character'

function CharacterCard({ character }: { character: Character }) {
  const data = character.content.data

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        <RemoteImage src={character.metadata.url} alt={data.name} fill className="object-cover" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-medium">{data.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{data.description}</p>
        <div className="flex flex-wrap gap-1">
          {data.tags.map((tag: string) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">Version: {data.character_version}</div>
      </div>
    </div>
  )
}

export function CharacterList() {
  const { characters } = useCharacters()
  const importCharacters = useImportCharacters()

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
    // Logic for importing character from URL
    console.log('Import character from URL')
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
    <div className="flex flex-col gap-4">
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
          <TooltipFaButton
            key={index}
            icon={icon}
            btnSize="size-8"
            iconSize="lg"
            tooltip={tooltip}
            className="text-foreground border-1 border-background hover:bg-muted-foreground rounded-sm"
            onClick={action}
          />
        ))}
      </div>

      <div className="flex flex-row gap-1">
        {filterActions.map(({ action, icon, tooltip }, index) => (
          <TooltipFaButton
            key={index}
            icon={icon}
            btnSize="size-8"
            iconSize="1x"
            tooltip={tooltip}
            className="border-1 border-ring/60 bg-ring/10 hover:border-ring hover:bg-ring rounded-full"
            onClick={typeof action === 'function' ? action : undefined}
          />
        ))}
      </div>

      {/* Character list grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>
    </div>
  )
}
