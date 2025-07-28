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

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { CheckboxIndeterminate } from '@cared/ui/components/checkbox-indeterminate'
import { Input } from '@cared/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { cn } from '@cared/ui/lib/utils'

import { FaButton, FaButtonWithBadge } from '@/components/fa-button'
import {
  isCharacterGroup,
  useCharactersAndGroups,
  useSetActiveCharacterOrGroup,
} from '@/hooks/use-character-or-group'
import { useCharacterSettings, useTagsSettings, useUpdateTagsSettings } from '@/hooks/use-settings'
import { CharacterItem } from './character-item'
import { DeleteCharactersOrGroupsDialog } from './delete-characters-or-groups-dialog'
import { useClearAllFlags, useSetIsCreateCharacter, useSetIsCreateCharacterGroup } from './hooks'
import { ImportFileInput } from './import-file-input'
import { ImportUrlDialog } from './import-url-dialog'
import { useOpenTagsManagementDialog } from './tags-management-dialog'

export function CharacterList() {
  const charactersAndGroups = useCharactersAndGroups()
  const tags = useTagsSettings()
  const updateTagsSettings = useUpdateTagsSettings()

  const setActiveCharacterOrGroup = useSetActiveCharacterOrGroup()
  const setIsCreateCharacter = useSetIsCreateCharacter()
  const setIsCreateCharacterGroup = useSetIsCreateCharacterGroup()
  const clearAllFlags = useClearAllFlags()

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

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const characterSettings = useCharacterSettings()

  // Initialize search index
  useEffect(() => {
    const index = new Document({
      document: {
        id: 'id',
        index: [
          // for character
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
          // for character group
          'metadata:name',
          'metadata:chatMetadata:scenario',
          'characters:content:data:name',
          'characters:content:data:description',
          'characters:content:data:mes_example',
          'characters:content:data:scenario',
          'characters:content:data:personality',
          'characters:content:data:first_mes',
          'characters:content:data:creator_notes',
          'characters:content:data:creator',
          'characters:content:data:tags',
          'characters:content:data:alternate_greetings',
        ],
        store: ['id'],
      },
      tokenize: 'bidirectional',
    })

    // Add all characters and groups to the index
    void Promise.all(
      charactersAndGroups.map((item) => {
        // @ts-ignore
        return index.add(item)
      }),
    )

    // @ts-ignore
    setSearchIndex(index)
  }, [charactersAndGroups])

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

  // Filter and sort characters and groups
  const filteredAndSortedItems = useMemo(
    () =>
      charactersAndGroups
        .filter((item) => {
          if (showFavoritesOnly && !characterSettings.favorites.includes(item.id)) {
            return false
          }
          return !searchQuery.trim() || searchResults.has(item.id)
        })
        .sort((a, b) => {
          const aName = isCharacterGroup(a) ? a.metadata.name : a.content.data.name
          const bName = isCharacterGroup(b) ? b.metadata.name : b.content.data.name
          const aDate = isCharacterGroup(a)
            ? new Date(a.createdAt).getTime()
            : new Date(a.createdAt).getTime()
          const bDate = isCharacterGroup(b)
            ? new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime()

          switch (sortBy) {
            case 'a-z':
              return aName.localeCompare(bName)
            case 'z-a':
              return bName.localeCompare(aName)
            case 'newest':
              return bDate - aDate
            case 'oldest':
              return aDate - bDate
            default:
              return 0
          }
        }),
    [
      charactersAndGroups,
      searchQuery,
      searchResults,
      sortBy,
      showFavoritesOnly,
      characterSettings.favorites,
    ],
  )

  const openTagsManagementDialog = useOpenTagsManagementDialog()

  // Handle import button click
  const handleImportClick = () => {
    importFileInputRef.current?.click()
  }

  const handleCreateCharacter = () => {
    setIsCreateCharacter()
  }

  const handleImportFromUrl = () => {
    setIsImportUrlDialogOpen(true)
  }

  const handleCreateGroup = () => {
    setIsCreateCharacterGroup()
  }

  const handleShowFavorites = () => {
    setShowFavoritesOnly(!showFavoritesOnly)
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
    const allIds = new Set(charactersAndGroups.map((item) => item.id))
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

  const handleCharacterSelect = (itemId: string, selected: boolean, event?: React.MouseEvent) => {
    if (!isSelectMode) {
      setActiveCharacterOrGroup(charactersAndGroups.find((item) => item.id === itemId)?.id)
      clearAllFlags()
      return
    }

    const newSelected = new Set(selectedCharacters)

    // Handle shift-click selection
    if (event?.shiftKey && lastSelectedId && selectedCharacters.has(lastSelectedId)) {
      const lastIndex = charactersAndGroups.findIndex((item) => item.id === lastSelectedId)
      const currentIndex = charactersAndGroups.findIndex((item) => item.id === itemId)

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex)
        const end = Math.max(lastIndex, currentIndex)

        // Select all items between last selected and current
        for (let i = start; i <= end; i++) {
          newSelected.add(charactersAndGroups[i]!.id)
        }
      }
    } else {
      // Normal selection
      if (selected) {
        newSelected.add(itemId)
      } else {
        newSelected.delete(itemId)
      }
    }

    setSelectedCharacters(newSelected)
    setLastSelectedId(itemId)

    // Update select state based on selection
    if (newSelected.size === 0) {
      setSelectState(false)
    } else if (newSelected.size === charactersAndGroups.length) {
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
      tooltip: showFavoritesOnly ? 'Show all characters' : 'Show only favorite characters',
      className: showFavoritesOnly ? 'text-yellow-400' : '',
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

      <VList className="flex-1" count={filteredAndSortedItems.length}>
        {(i) => {
          const item = filteredAndSortedItems[i]!
          return (
            <CharacterItem
              key={item.id}
              charOrGroup={item}
              isSelectMode={isSelectMode}
              isSelected={selectedCharacters.has(item.id)}
              onSelect={handleCharacterSelect}
            />
          )
        }}
      </VList>

      <ImportFileInput ref={importFileInputRef} />

      <ImportUrlDialog open={isImportUrlDialogOpen} onOpenChange={setIsImportUrlDialogOpen} />

      <DeleteCharactersOrGroupsDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        ids={Array.from(selectedCharacters)}
        onDelete={() => setSelectMode(false)}
      />
    </div>
  )
}
