'use client'

import type { CheckedState } from '@radix-ui/react-checkbox'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  faCloudArrowDown,
  faEye,
  faEyeSlash,
  faFileImport,
  faGear,
  faListSquares,
  faStar,
  faTags,
  faUserPlus,
  faUsers,
  faUsersGear,
} from '@fortawesome/free-solid-svg-icons'
import { Document } from 'flexsearch'
import { TrashIcon, XIcon } from 'lucide-react'
import { VList } from 'virtua'

import { Badge } from '@ownxai/ui/components/badge'
import { Button } from '@ownxai/ui/components/button'
import { CheckboxIndeterminate } from '@ownxai/ui/components/checkbox-indeterminate'
import { Input } from '@ownxai/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'
import { cn } from '@ownxai/ui/lib/utils'

import { FaButton, FaButtonWithBadge } from '@/components/fa-button'
import { useSetActiveCharacter } from '@/hooks/use-active-character'
import { useCharacters } from '@/hooks/use-characters'
import { useTagsSettings, useUpdateTagsSettings } from '@/hooks/use-settings'
import { CharacterItem } from './character-item'
import { DeleteCharactersDialog } from './delete-characters-dialog'
import { useSetIsCreateCharacter, useSetShowCharacterList } from './hooks'
import { ImportFileInput } from './import-file-input'
import { ImportUrlDialog } from './import-url-dialog'
import { useOpenTagsManagementDialog } from './tags-management-dialog'

export function CharacterList() {
  const { characters } = useCharacters()
  const tags = useTagsSettings()
  const updateTagsSettings = useUpdateTagsSettings()

  const setActiveCharacter = useSetActiveCharacter()
  const setIsCreateCharacter = useSetIsCreateCharacter()
  const setShowCharacterList = useSetShowCharacterList()

  const [isImportUrlDialogOpen, setIsImportUrlDialogOpen] = useState(false)

  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())
  const [selectState, setSelectState] = useState<CheckedState>(false)
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const importFileInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState<Document>()
  const [searchResults, setSearchResults] = useState<Set<string>>(new Set())

  const [sortBy, setSortBy] = useState<'a-z' | 'z-a' | 'newest' | 'oldest'>('a-z')

  // Initialize search index
  useEffect(() => {
    const index = new Document({
      document: {
        id: 'id',
        index: [
          'content:data:name',
          'content:data:description',
          'content:data:mes_example',
          'content:data:scenario',
          'content:data:personality',
          'content:data:first_mes',
          'content:data:creator_notes',
          'content:data:creator',
          'content:data:tags',
          'content:data:alternate_greetings',
        ],
        store: ['id'],
      },
      tokenize: 'bidirectional',
    })

    // Add all characters to the index
    void Promise.all(
      characters.map((char) => {
        // @ts-ignore
        return index.add(char)
      }),
    )

    // @ts-ignore
    setSearchIndex(index)
  }, [characters])

  // Handle search
  useEffect(() => {
    if (!searchIndex || !searchQuery.trim()) {
      setSearchResults(new Set())
      return
    }

    const results = searchIndex.search(searchQuery)
    const matchedIds = new Set(results.flatMap((result) => result.result as string[]))
    setSearchResults(matchedIds)
  }, [searchQuery, searchIndex])

  // Filter and sort characters
  const filteredAndSortedCharacters = useMemo(
    () =>
      characters
        .filter((char) => !searchQuery.trim() || searchResults.has(char.id))
        .sort((a, b) => {
          switch (sortBy) {
            case 'a-z':
              return a.content.data.name.localeCompare(b.content.data.name)
            case 'z-a':
              return b.content.data.name.localeCompare(a.content.data.name)
            case 'newest':
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            case 'oldest':
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            default:
              return 0
          }
        }),
    [characters, searchQuery, searchResults, sortBy],
  )

  const openTagsManagementDialog = useOpenTagsManagementDialog()

  // Handle import button click
  const handleImportClick = () => {
    importFileInputRef.current?.click()
  }

  const handleCreateCharacter = () => {
    setIsCreateCharacter(true)
    setShowCharacterList(false)
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
    openTagsManagementDialog()
  }

  const handleShowTags = () => {
    void updateTagsSettings({ isShow: !tags.isShow })
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
      setActiveCharacter(characters.find((char) => char.id === characterId)?.id)
      setIsCreateCharacter(false)
      setShowCharacterList(false)
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
      icon: faTags,
      badgeIcon: faGear,
      tooltip: 'Manage tags',
    },
    {
      action: handleShowTags,
      icon: faTags,
      badgeIcon: tags.isShow ? faEye : faEyeSlash,
      tooltip: 'Show tags',
    },
    {
      action: handleSelectCharacters,
      icon: faListSquares,
      tooltip: 'Select characters',
      className: isSelectMode ? 'text-yellow-500' : '',
    },
  ]

  const setSelectMode = (isSelectMode: boolean) => {
    setIsSelectMode(isSelectMode)
    setSelectedCharacters(new Set())
    setSelectState(false)
    setLastSelectedId(null)
  }

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

        <Input
          type="search"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />

        <Select
          value={sortBy}
          onValueChange={(value: 'a-z' | 'z-a' | 'newest' | 'oldest') => setSortBy(value)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="z-6000">
            <SelectItem value="a-z">A-Z</SelectItem>
            <SelectItem value="z-a">Z-A</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-row gap-1">
        {operateActions.map(({ action, icon, badgeIcon, tooltip, className }, index) => {
          const classname = cn(
            'border-1 border-ring/60 bg-ring/10 hover:border-ring hover:bg-ring rounded-full',
            className,
          )
          return !badgeIcon ? (
            <FaButton
              key={index}
              icon={icon}
              btnSize="size-8"
              iconSize="1x"
              title={tooltip}
              className={classname}
              onClick={action}
            />
          ) : (
            <FaButtonWithBadge
              key={index}
              icon={icon}
              badgeIcon={badgeIcon}
              btnSize="size-8"
              iconSize="1x"
              title={tooltip}
              className={classname}
              badgeClassName="-top-0 -right-0"
              onClick={action}
            />
          )
        })}
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

      {tags.isShow && tags.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.tags.map((tag) => (
            <Badge
              key={tag.name}
              variant="outline"
              className="text-muted-foreground border-ring px-1 py-0 rounded-sm"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <VList className="flex-1" count={filteredAndSortedCharacters.length}>
        {(i) => {
          const character = filteredAndSortedCharacters[i]!
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
