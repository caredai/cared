import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { Prompt } from '@tavern/core'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
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
  faArrowRotateLeft,
  faLocationDot,
  faPen,
  faPlusSquare,
  faSquarePollHorizontal,
  faSyringe,
  faTrash,
  faUserNinja,
} from '@fortawesome/free-solid-svg-icons'
import { systemPromptIdentifiers } from '@tavern/core'
import { createPortal } from 'react-dom'
import { v7 as uuid } from 'uuid'

import { Button } from '@ownxai/ui/components/button'
import { Switch } from '@ownxai/ui/components/switch'
import { cn } from '@ownxai/ui/lib/utils'

import { FaButton, FaButtonWithBadge } from '@/components/fa-button'
import { useCustomizeModelPreset } from '@/hooks/use-model-preset'
import { useTextTokens } from '@/hooks/use-tokenizer'
import { usePromptEdit } from './prompt-edit'
import { usePromptInspect } from './prompt-inspect'

export function PromptList() {
  const { togglePromptEdit } = usePromptEdit()
  const { togglePromptInspect } = usePromptInspect()

  const {
    customization,
    activeCustomizedPreset,
    saveCustomization,
    hasPromptsCustomization,
    restoreModelPresetPrompts,
  } = useCustomizeModelPreset()

  // Get prompts from active preset
  const [prompts, setPrompts] = useState(activeCustomizedPreset.prompts)

  useEffect(() => {
    setPrompts(activeCustomizedPreset.prompts)
  }, [activeCustomizedPreset.prompts])

  const handleNewPrompt = useCallback(async () => {
    const newPrompt = {
      identifier: uuid(),
      enabled: true,
      name: 'New Prompt',
      system_prompt: false,
      marker: false,
      role: 'system' as const,
      content: '',
    }
    setPrompts((items) => [newPrompt, ...items])
    await saveCustomization({
      ...customization,
      prompts: {
        ...customization?.prompts,
        [newPrompt.identifier]: newPrompt,
      },
      promptOrder: [
        newPrompt.identifier,
        ...activeCustomizedPreset.prompts.map((p) => p.identifier),
      ],
    })
  }, [activeCustomizedPreset, customization, saveCustomization])

  const operateActions = [
    {
      action: handleNewPrompt,
      icon: faPlusSquare,
      tooltip: 'New prompt',
    },
    {
      action: restoreModelPresetPrompts,
      icon: faArrowRotateLeft,
      tooltip: 'Restore prompts',
      disabled: !hasPromptsCustomization,
      className: hasPromptsCustomization
        ? 'text-destructive-foreground hover:text-destructive-foreground hover:bg-destructive'
        : 'disabled:pointer-events-none disabled:opacity-50',
    },
  ]

  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Track active drag item
  const [activeId, setActiveId] = useState<string | null>(null)

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      const { active, over } = event
      if (over && active.id !== over.id) {
        setPrompts((items) => {
          const oldIndex = items.findIndex((item) => item.identifier === active.id)
          const newIndex = items.findIndex((item) => item.identifier === over.id)
          const newItems = arrayMove(items, oldIndex, newIndex)

          // Save new order to customization
          void saveCustomization({
            ...customization,
            promptOrder: newItems.map((prompt) => prompt.identifier),
          })

          return newItems
        })
      }
    },
    [customization, saveCustomization],
  )

  // Handle prompt deletion
  const handleDeletePrompt = useCallback(
    async (prompt: Prompt) => {
      await saveCustomization({
        ...customization,
        prompts: {
          ...customization?.prompts,
          [prompt.identifier]: null,
        },
        promptOrder: customization?.promptOrder?.filter((id) => id !== prompt.identifier),
      })
      setPrompts((items) => items.filter((item) => item.identifier !== prompt.identifier))
    },
    [customization, saveCustomization],
  )

  // Combine content of all enabled prompts
  const combinedContent = useMemo(() => {
    return prompts
      .filter((prompt) => prompt.enabled)
      .map((prompt) => prompt.content ?? '')
      .join('\n')
  }, [prompts])

  // Calculate total tokens
  const totalTokens = useTextTokens(combinedContent)

  // Handle prompt enable/disable
  const handleTogglePrompt = useCallback(
    async (prompt: Prompt, enabled: boolean) => {
      await saveCustomization({
        ...customization,
        prompts: {
          ...customization?.prompts,
          [prompt.identifier]: {
            ...customization?.prompts?.[prompt.identifier],
            enabled,
          },
        },
      })
    },
    [customization, saveCustomization],
  )

  const activePrompt = activeId ? prompts.find((p) => p.identifier === activeId) : null

  const id = useId()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        <div className="flex justify-between items-center px-2 py-1 text-muted-foreground">
          <h3 className="font-medium">Prompts</h3>
          <span className="text-sm">Total Tokens: {totalTokens ?? 0}</span>
        </div>

        <div className="flex justify-end items-center gap-1">
          {operateActions.map(({ action, icon, tooltip, disabled, className }, index) => (
            <FaButton
              key={index}
              icon={icon}
              btnSize="size-6"
              iconSize="1x"
              title={tooltip}
              className={cn(
                'text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm',
                className,
              )}
              disabled={disabled}
              onClick={action}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 border border-border p-2 rounded-sm bg-black/20">
        <DndContext
          // https://github.com/clauderic/dnd-kit/issues/926#issuecomment-1640115665
          id={id}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={prompts.map((p) => p.identifier)}
            strategy={verticalListSortingStrategy}
          >
            {prompts.map((prompt: Prompt) => (
              <PromptListItem
                key={prompt.identifier}
                prompt={prompt}
                onTogglePrompt={handleTogglePrompt}
                onEditPrompt={togglePromptEdit}
                onInspectPrompt={togglePromptInspect}
                onDeletePrompt={handleDeletePrompt}
              />
            ))}
          </SortableContext>
          {(globalThis as any).document &&
            createPortal(
              <DragOverlay zIndex={7000}>
                {activePrompt ? <PromptListItem prompt={activePrompt} /> : null}
              </DragOverlay>,
              globalThis.document.body,
            )}
        </DndContext>
      </div>
    </div>
  )
}

function PromptListItem({
  prompt,
  onTogglePrompt,
  onEditPrompt,
  onInspectPrompt,
  onDeletePrompt,
}: {
  prompt: Prompt
  onTogglePrompt?: (prompt: Prompt, enabled: boolean) => Promise<void>
  onEditPrompt?: (identifier: string) => void
  onInspectPrompt?: (identifier: string) => void
  onDeletePrompt?: (prompt: Prompt) => Promise<void>
}) {
  const tokens = useTextTokens(prompt.enabled ? (prompt.content ?? '') : '')

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: prompt.identifier,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const icon = prompt.system_prompt
    ? prompt.marker
      ? faLocationDot
      : faSquarePollHorizontal
    : faUserNinja

  const title = prompt.system_prompt
    ? prompt.marker
      ? 'System Marker Prompt'
      : 'System Prompt'
    : 'User-defined Prompt'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'w-full grid grid-cols-[4fr_80px_30px] justify-between items-center px-2 py-1 rounded-sm border border-border hover:bg-muted/50',
        isDragging && 'invisible',
      )}
    >
      <span className="flex items-center overflow-x-hidden">
        {prompt.injection_position !== 'absolute' ? (
          <FaButton
            icon={icon}
            btnSize="size-6"
            iconSize="lg"
            className={cn('text-muted-foreground cursor-grab')}
            title={title}
            {...listeners}
          />
        ) : (
          <FaButtonWithBadge
            icon={icon}
            badgeIcon={faSyringe}
            btnSize="size-6"
            iconSize="lg"
            className={cn('text-muted-foreground cursor-grab')}
            badgeClassName="-top-0 -right-0"
            title={title}
            {...listeners}
          />
        )}

        <Button
          variant="link"
          className="px-1 text-secondary-foreground"
          title={prompt.name}
          onClick={() => onInspectPrompt?.(prompt.identifier)}
        >
          {prompt.name}
        </Button>
      </span>

      <span className="flex justify-end items-center">
        {!['dialogueExamples', 'chatHistory'].includes(prompt.identifier) && (
          <FaButton
            icon={faPen}
            btnSize="size-6"
            iconSize="sm"
            className="text-muted-foreground hover:text-foreground"
            title="Edit prompt"
            onClick={() => onEditPrompt?.(prompt.identifier)}
          />
        )}

        <Switch
          checked={prompt.enabled}
          onCheckedChange={(checked: boolean) => {
            void onTogglePrompt?.(prompt, checked)
          }}
          className="data-[state=checked]:bg-yellow-700 scale-60 -mx-2"
        />

        <FaButton
          icon={faTrash}
          btnSize="size-6"
          iconSize="sm"
          className={cn(
            'text-muted-foreground hover:text-destructive ml-1',
            systemPromptIdentifiers.includes(prompt.identifier) && 'invisible',
          )}
          title="Delete prompt"
          onClick={() => onDeletePrompt?.(prompt)}
        />
      </span>

      <span className="inline w-full text-xs font-mono text-muted-foreground text-right">
        {tokens || '-'}
      </span>
    </div>
  )
}
