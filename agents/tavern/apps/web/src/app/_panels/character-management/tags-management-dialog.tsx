import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { Tag, TagsSettings } from '@tavern/core'
import type { ColorResult } from 'react-color'
import { forwardRef, memo, useCallback, useEffect, useState } from 'react'
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
  faEye,
  faFolder,
  faTrashCan,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { atom, useAtom } from 'jotai'
import { SketchPicker } from 'react-color'
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
  const tagsSettings = useTagsSettings()
  const updateTagsSettings = useUpdateTagsSettings()

  const [activeName, setActiveName] = useState<string | null>(null)
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
    setActiveName(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.name === active.id)
        const newIndex = currentItems.findIndex((item) => item.name === over.id)
        return arrayMove(currentItems, oldIndex, newIndex)
      })
    }
  }, [])

  const handleDeleteTag = useCallback((nameToDelete: string) => {
    setItems((currentItems) => {
      const newItems = currentItems.filter((item) => item.name !== nameToDelete)
      return newItems
    })
  }, [])

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
      return newItems
    })
  }, [])

  const handleColorChange = useCallback(
    (nameToUpdate: string, newColor: string, type: 'bg' | 'text') => {
      setItems((currentItems) => {
        const newItems = currentItems.map((item) =>
          item.name === nameToUpdate
            ? { ...item, [type === 'bg' ? 'bgColor' : 'textColor']: newColor }
            : item,
        )
        return newItems
      })
    },
    [],
  )

  const handleToggleFolder = useCallback((nameToUpdate: string) => {
    setItems((currentItems) => {
      const newItems = currentItems.map((item) => {
        if (item.name === nameToUpdate) {
          let newFolderState: Tag['folder'] = 'no'
          if (item.folder === 'no') {
            newFolderState = 'closed'
          } else if (item.folder === 'closed') {
            newFolderState = 'open'
          } else {
            newFolderState = 'no'
          }
          return { ...item, folder: newFolderState }
        }
        return item
      })
      return newItems
    })
  }, [])

  const characterCountMap = new Map<string, number>()
  tagsSettings.tags.forEach((tag) =>
    characterCountMap.set(tag.name, Math.floor(Math.random() * 10)),
  )

  const Row = memo(
    forwardRef<HTMLDivElement, { item: Tag }>(({ item, ...props }, _ref) => {
      const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.name,
      })

      const [isEditing, setIsEditing] = useState(false)
      const [editingName, setEditingName] = useState(item.name)

      useEffect(() => {
        if (!isDragging) {
          setEditingName(item.name) // Reset editingName if item.name changes from outside (e.g. undo)
        }
      }, [item.name, isDragging])

      const handleNameSubmit = useCallback(() => {
        if (editingName.trim() === '') {
          setEditingName(item.name) // Reset to original if empty
          setIsEditing(false)
          return
        }
        if (editingName !== item.name) {
          handleRenameTag(item.name, editingName.trim())
        }
        setIsEditing(false)
      }, [editingName, item.name])

      const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        padding: '10px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        height: '65px',
        boxSizing: 'border-box' as const,
      }

      let folderClassName
      let folderBadgeIcon
      let folderBadgeClassName
      let folderBtnTitle

      if (item.folder === 'closed') {
        folderBadgeIcon = faEye
        folderBtnTitle = 'Closed Folder (Hide all characters unless selected)'
      } else if (item.folder === 'open') {
        folderBadgeIcon = faCheck
        folderBadgeClassName = 'text-green-500'
        folderBtnTitle = 'Open Folder (Show all characters even if not selected)'
      } else {
        folderBadgeIcon = faXmark
        folderClassName = 'brightness-25 saturate-25'
        folderBadgeClassName = 'text-red-500 brightness-50 saturate-50'
        folderBtnTitle = 'No Folder'
      }

      return (
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...props}
          className="flex justify-between items-center gap-4 rounded border cursor-default"
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
            onClick={() => handleToggleFolder(item.name)}
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
              handleColorChange(item.name, color.hex, 'bg')
            }}
            ariaLabel="Change background color"
          />

          <ColorPicker
            color={item.textColor}
            defaultColor="#ffffff"
            onChangeComplete={(color: ColorResult) => {
              handleColorChange(item.name, color.hex, 'text')
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
                setEditingName(item.name) // Ensure editingName starts with current item name
              }
            }}
            readOnly={!isEditing}
            autoFocus={isEditing} // autoFocus when isEditing becomes true
            className={`flex-shrink w-fit max-w-32 truncate px-2 py-1 rounded text-sm bg-background text-foreground h-auto border ${
              isEditing ? 'border-primary' : 'border-ring cursor-pointer'
            }`}
            style={{ backgroundColor: item.bgColor, color: item.textColor }}
            title={item.name}
          />

          <span className="text-sm text-muted-foreground w-16 text-center">
            {characterCountMap.get(item.name) ?? 0} entries
          </span>

          <FaButton
            icon={faTrashCan}
            btnSize="size-7"
            iconSize="1x"
            title="Delete tag"
            className="text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm"
            onClick={() => handleDeleteTag(item.name)}
          />
        </div>
      )
    }),
  )
  Row.displayName = 'Row'

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
              <VList style={{ height: '100%' }} className="pr-2">
                {items.map((item) => (
                  <Row key={item.name} item={item} />
                ))}
              </VList>
            </SortableContext>
            <DragOverlay>{activeItem ? <Row item={activeItem} /> : null}</DragOverlay>
          </DndContext>
        </div>

        <DialogFooter className="flex gap-2 mt-auto">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void updateTagsSettings({ ...tagsSettings, tags: items } as TagsSettings)
              setOpen(false)
            }}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
