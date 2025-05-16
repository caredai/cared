import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { Tag } from '@tavern/core'
import type { ComponentPropsWithoutRef } from 'react'
import type { ColorResult } from 'react-color'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  faBars,
  faCheck,
  faEyeSlash,
  faFolder,
  faTrashCan,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { atom, useAtom } from 'jotai'
import { SketchPicker } from 'react-color'
import { createPortal } from 'react-dom'
import { VList } from 'virtua'

import { Button } from '@ownxai/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ownxai/ui/components/dialog'
import { Input } from '@ownxai/ui/components/input'
import { Popover, PopoverContent, PopoverTrigger } from '@ownxai/ui/components/popover'
import { cn } from '@ownxai/ui/lib/utils'

import { FaButton, FaButtonWithBadge } from '@/components/fa-button'
import { useTagsSettings, useUpdateTagsSettings } from '@/lib/settings'

const openAtom = atom(false)

export function useOpenTagsManagementDialog() {
  const [, setOpen] = useAtom(openAtom)

  return () => {
    setOpen(true)
  }
}

export function TagsManagementDialog() {
  const [open, setOpen] = useAtom(openAtom)
  const updateTagsSettings = useUpdateTagsSettings()
  const tagsSettings = useTagsSettings()
  const tagMap = tagsSettings.tagMap

  const [activeName, setActiveName] = useState<string>()
  const [items, setItems] = useState<Tag[]>(() => tagsSettings.tags)

  useEffect(() => {
    setItems(tagsSettings.tags)
  }, [tagsSettings.tags])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveName(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveName(undefined)
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.name === active.id)
        const newIndex = currentItems.findIndex((item) => item.name === over.id)
        const newItems = arrayMove(currentItems, oldIndex, newIndex)
        void updateTagsSettings({ ...tagsSettings, tags: newItems })
        return newItems
      })
    }
  }, [tagsSettings, updateTagsSettings])

  const handleDeleteTag = useCallback((nameToDelete: string) => {
    setItems((currentItems) => {
      const newItems = currentItems.filter((item) => item.name !== nameToDelete)
      // Update tagMap to remove references to the deleted tag
      const newTagMap = { ...tagMap }
      for (const [charId, tags] of Object.entries(newTagMap)) {
        newTagMap[charId] = tags.filter(tag => tag !== nameToDelete)
      }
      void updateTagsSettings({ ...tagsSettings, tags: newItems, tagMap: newTagMap })
      return newItems
    })
  }, [tagMap, tagsSettings, updateTagsSettings])

  const handleRenameTag = useCallback((oldName: string, newName: string) => {
    setItems((currentItems) => {
      // Check if the new name already exists (and it's not the same item)
      const isNameTaken = currentItems.some(
        (item) => item.name === newName && item.name !== oldName,
      )
      if (isNameTaken) {
        // Ideally, show a toast or some error message to the user
        console.warn('Tag name already exists:', newName)
        return currentItems // Don't update if name is taken
      }
      const newItems = currentItems.map((item) =>
        item.name === oldName ? { ...item, name: newName } : item,
      )
      // Update tagMap to reflect the renamed tag
      const newTagMap = { ...tagMap }
      for (const [charId, tags] of Object.entries(newTagMap)) {
        newTagMap[charId] = tags.map(tag => tag === oldName ? newName : tag)
      }
      void updateTagsSettings({ ...tagsSettings, tags: newItems, tagMap: newTagMap })
      return newItems
    })
  }, [tagMap, tagsSettings, updateTagsSettings])

  const handleColorChange = useCallback(
    (nameToUpdate: string, newColor: string, type: 'bg' | 'text') => {
      setItems((currentItems) => {
        const newItems = currentItems.map((item) =>
          item.name === nameToUpdate
            ? { ...item, [type === 'bg' ? 'bgColor' : 'textColor']: newColor }
            : item,
        )
        void updateTagsSettings({ ...tagsSettings, tags: newItems })
        return newItems
      })
    },
    [tagsSettings, updateTagsSettings],
  )

  const handleToggleFolder = useCallback((nameToUpdate: string) => {
    setItems((currentItems) => {
      const newItems = currentItems.map((item) => {
        if (item.name === nameToUpdate) {
          let newFolderState: Tag['folder'] = 'no'
          if (item.folder === 'no') {
            newFolderState = 'open'
          } else if (item.folder === 'open') {
            newFolderState = 'closed'
          } else {
            newFolderState = 'no'
          }
          return { ...item, folder: newFolderState }
        }
        return item
      })
      void updateTagsSettings({ ...tagsSettings, tags: newItems })
      return newItems
    })
  }, [tagsSettings, updateTagsSettings])

  const characterCountMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const tags of Object.values(tagMap)) {
      for (const tag of tags) {
        map.set(tag, (map.get(tag) ?? 0) + 1)
      }
    }
    return map
  }, [tagMap])

  const activeItem = activeName ? items.find((item) => item.name === activeName) : null

  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] z-6000 flex flex-col">
        <DialogHeader>
          <DialogTitle>Tag Management</DialogTitle>
          <DialogDescription>
            Drag handle to reorder. Click name to rename. Click color to change display. Click on
            the folder icon to manage folder status.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-auto my-4 h-[50dvh]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.name)}
              strategy={verticalListSortingStrategy}
            >
              <VList className="w-full h-full pr-2">
                {items.map((item) => (
                  <TagRow
                    key={item.name}
                    item={item}
                    onRename={handleRenameTag}
                    onDelete={handleDeleteTag}
                    onColorChange={handleColorChange}
                    onToggleFolder={handleToggleFolder}
                    characterCount={characterCountMap.get(item.name) ?? 0}
                  />
                ))}
              </VList>
            </SortableContext>
            {createPortal(
              <DragOverlay zIndex={7000}>
                {activeItem ? (
                  <TagRow
                    item={activeItem}
                    characterCount={characterCountMap.get(activeItem.name) ?? 0}
                  />
                ) : null}
              </DragOverlay>,
              document.body,
            )}
          </DndContext>
        </div>

        <DialogFooter className="flex gap-2 mt-auto">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const TagRow = memo(function TagRow({
  item,
  onRename,
  onDelete,
  onColorChange,
  onToggleFolder,
  characterCount,
  ...props
}: {
  item: Tag
  onRename?: (oldName: string, newName: string) => void
  onDelete?: (name: string) => void
  onColorChange?: (name: string, color: string, type: 'bg' | 'text') => void
  onToggleFolder?: (name: string) => void
  characterCount: number
} & ComponentPropsWithoutRef<'div'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.name,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState(item.name)

  useEffect(() => {
    setEditingName(item.name)
  }, [item.name])

  const handleNameSubmit = useCallback(() => {
    if (editingName.trim() === '') {
      setEditingName(item.name)
      setIsEditing(false)
      return
    }
    if (editingName !== item.name) {
      onRename?.(item.name, editingName.trim())
    }
    setIsEditing(false)
  }, [editingName, item.name, onRename])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  let folderClassName
  let folderBadgeIcon
  let folderBadgeClassName
  let folderBtnTitle

  if (item.folder === 'closed') {
    folderBadgeIcon = faEyeSlash
    folderBtnTitle = 'Closed Folder (Hide all characters unless selected)'
  } else if (item.folder === 'open') {
    folderBadgeIcon = faCheck
    folderBadgeClassName = 'text-green-500'
    folderBtnTitle = 'Open Folder (Show all characters even if not selected)'
  } else {
    folderBadgeIcon = faXmark
    folderClassName = 'brightness-25 saturate-25'
    folderBadgeClassName = 'text-red-500 brightness-25 saturate-25'
    folderBtnTitle = 'No Folder'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...props}
      className={cn(
        'flex justify-between items-center gap-4 cursor-default p-2',
        isDragging && 'invisible',
      )}
    >
      <FaButton
        icon={faBars}
        btnSize="size-4"
        iconSize="sm"
        className="text-foreground hover:bg-muted-foreground cursor-grab"
        {...listeners}
      />

      <FaButtonWithBadge
        icon={faFolder}
        badgeIcon={folderBadgeIcon}
        onClick={() => onToggleFolder?.(item.name)}
        btnSize="size-6"
        iconSize="lg"
        badgeClassName={folderBadgeClassName}
        className={cn('text-muted-foreground', folderClassName)}
        title={folderBtnTitle}
      />

      <ColorPicker
        color={item.bgColor}
        defaultColor="#000000"
        onChangeComplete={(color: ColorResult) => {
          onColorChange?.(item.name, color.hex, 'bg')
        }}
        ariaLabel="Change background color"
      />

      <ColorPicker
        color={item.textColor}
        defaultColor="#ffffff"
        onChangeComplete={(color: ColorResult) => {
          onColorChange?.(item.name, color.hex, 'text')
        }}
        ariaLabel="Change text color"
      />

      <Input
        type="text"
        value={editingName}
        onChange={(e) => setEditingName(e.target.value)}
        onBlur={handleNameSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleNameSubmit()
          } else if (e.key === 'Escape') {
            setEditingName(item.name)
            setIsEditing(false)
          }
        }}
        onClick={() => {
          if (!isEditing) {
            setIsEditing(true)
            setEditingName(item.name)
          }
        }}
        readOnly={!isEditing}
        autoFocus={isEditing}
        className={`max-w-24 truncate px-2 py-1 rounded text-sm bg-background text-foreground h-auto border ${
          isEditing ? 'border-primary' : 'border-ring cursor-pointer'
        }`}
        style={{ backgroundColor: item.bgColor, color: item.textColor }}
        title={item.name}
      />

      <span className="text-sm text-muted-foreground w-16 text-center">
        {characterCount} entries
      </span>

      <FaButton
        icon={faTrashCan}
        btnSize="size-7"
        iconSize="1x"
        title="Delete tag"
        className="text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm"
        onClick={() => onDelete?.(item.name)}
      />
    </div>
  )
})

function ColorPicker({
  color,
  defaultColor,
  onChangeComplete,
  ariaLabel,
}: {
  color?: string
  defaultColor: string
  onChangeComplete: (color: ColorResult) => void
  ariaLabel: string
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <Popover open={showPicker} onOpenChange={setShowPicker}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="p-0 w-9 h-4 border rounded-none"
          style={{ backgroundColor: color ?? defaultColor }}
          onClick={() => setShowPicker((prev) => !prev)}
          aria-label={ariaLabel}
          title={ariaLabel}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none z-7000">
        <SketchPicker
          color={color ?? defaultColor}
          onChangeComplete={(newColor: ColorResult) => {
            onChangeComplete(newColor)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
