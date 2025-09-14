'use client'

import type { VirtualizerHandle } from 'virtua'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PlusIcon, ServerIcon } from 'lucide-react'
import { useCopyToClipboard } from 'react-use'
import { Virtualizer } from 'virtua'

import type { UpdateModelArgs } from '@cared/api'
import type { BaseProviderInfo, ModelType, ProviderId } from '@cared/providers'
import { Avatar, AvatarFallback, AvatarImage } from '@cared/ui/components/avatar'
import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@cared/ui/components/sheet'

import type { EditableModel } from './model-item-edit'
import { SearchInput } from '@/components/search-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { TextTooltip } from '@/components/tooltip'
import { useDeleteModel, useModels, useSortModels, useUpdateModel } from '@/hooks/use-model'
import { getDefaultValuesForModelType, ModelItemEdit } from './model-item-edit'
import { ModelItemView } from './model-item-view'

// Temporary ID prefix for new items that haven't been submitted yet
const TEMP_ID_PREFIX = 'temp'

// Model types configuration
const MODEL_TYPES: { value: ModelType; label: string }[] = [
  { value: 'language', label: 'Language Models' },
  { value: 'image', label: 'Image Models' },
  { value: 'speech', label: 'Speech Models' },
  { value: 'transcription', label: 'Transcription Models' },
  { value: 'textEmbedding', label: 'Text Embedding Models' },
]

export function ModelSheet({
  isSystem,
  organizationId,
  provider,
  open,
  onOpenChange,
}: {
  isSystem?: boolean
  organizationId?: string
  provider: BaseProviderInfo
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const providerId = provider.id

  const { models, refetchModels } = useModels({
    organizationId,
    source: isSystem ? 'system' : undefined,
  })
  const updateModel = useUpdateModel({
    isSystem,
    organizationId,
  })
  const deleteModel = useDeleteModel({
    isSystem,
    organizationId,
  })
  const sortModels = useSortModels({
    isSystem,
    organizationId,
  })

  const vListRef = useRef<VirtualizerHandle>(null)

  const [newModels, setNewModels] = useState<EditableModel[]>([])
  const [existingModels, setExistingModels] = useState<EditableModel[]>([])
  const [allModels, setAllModels] = useState<EditableModel[]>([])
  const [activeTab, setActiveTab] = useState<ModelType>('language')
  const [searchQuery, setSearchQuery] = useState('')
  const [cache, setCache] = useState<Record<string, any>>({})

  useEffect(() => {
    setNewModels([])
    setActiveTab('language')
    setSearchQuery('')
    setCache({})
  }, [open])

  // Transform models to editable format
  useEffect(() => {
    const existingModels: EditableModel[] = []

    // Process each model type
    MODEL_TYPES.forEach(({ value: type }) => {
      const typeModels = models[type] || []
      typeModels.forEach((model) => {
        if (model.id.startsWith(`${providerId}:`)) {
          existingModels.push({
            id: model.id,
            type,
            model,
            isSystem: model.isSystem,
            isEditing: false,
            isNew: false,
          })
        }
      })
    })

    setExistingModels(existingModels)
  }, [models, providerId])

  useEffect(() => {
    setAllModels([...existingModels, ...newModels])
  }, [newModels, existingModels])

  // Handle adding new model
  const handleAddNew = useCallback(
    (scrollIndex: number) => {
      const id = `${TEMP_ID_PREFIX as ProviderId}:${Date.now()}` as const

      const newModel: EditableModel = {
        id,
        isSystem,
        isEditing: true,
        isNew: true,
        ...getDefaultValuesForModelType(providerId, activeTab),
      }

      setNewModels((prev) => [...prev, newModel])

      // Scroll to the new item
      setTimeout(() => {
        vListRef.current?.scrollToIndex(scrollIndex, { align: 'start', smooth: true })
      }, 100)
    },
    [providerId, activeTab],
  )

  // Handle editing existing model
  const handleEdit = useCallback((id: string) => {
    setNewModels((prev) =>
      prev.map((model) => (model.id === id ? { ...model, isEditing: true } : model)),
    )
    setExistingModels((prev) =>
      prev.map((model) => (model.id === id ? { ...model, isEditing: true } : model)),
    )

    setCache((cache) => ({
      ...cache,
      [id]: undefined,
    }))
  }, [])

  // Handle canceling edits
  const handleCancel = useCallback((id: string) => {
    setNewModels((prev) =>
      prev.map((model) => (model.id === id ? { ...model, isEditing: false } : model)),
    )
    setExistingModels((prev) =>
      prev.map((model) => (model.id === id ? { ...model, isEditing: false } : model)),
    )
    setCache((cache) => ({
      ...cache,
      [id]: undefined,
    }))
  }, [])

  // Handle saving changes
  const handleSave = useCallback(
    async (id: string, args: UpdateModelArgs) => {
      if (id.startsWith(TEMP_ID_PREFIX)) {
        // This is a new model, create it via API
        await updateModel({
          providerId,
          ...args,
        })

        await refetchModels()

        // Remove the temporary item from local state
        setNewModels((prev) => prev.filter((model) => model.id !== id))
      } else {
        // This is an existing model, update it via API
        await updateModel({
          providerId,
          ...args,
        })

        // Update local state
        setExistingModels((prev) =>
          prev.map((model) => (model.id === id ? { ...model, isEditing: false } : model)),
        )
      }

      setCache((cache) => ({
        ...cache,
        [id]: undefined,
      }))
    },
    [updateModel, providerId, refetchModels],
  )

  // Handle removing temporary items or deleting existing ones
  const handleRemove = useCallback(
    async (id: string) => {
      if (id.startsWith(TEMP_ID_PREFIX)) {
        // This is a temporary item, just remove from local state
        setNewModels((prev) => prev.filter((model) => model.id !== id))
      } else {
        // This is an existing model, delete it via API
        const model = allModels.find((m) => m.id === id)
        if (model) {
          await deleteModel({
            id: model.id,
            type: model.type,
          })

          // Remove from local state
          setExistingModels((prev) => prev.filter((model) => model.id !== id))
        }
      }

      setCache((cache) => ({
        ...cache,
        [id]: undefined,
      }))
    },
    [deleteModel, allModels],
  )
  const getModelsForType = useCallback(
    (type: ModelType) => {
      return allModels.filter((model) => model.type === type)
    },
    [allModels],
  )

  // Get models for current tab with search filtering
  const getModelsForCurrentTab = useCallback(
    (filter = true) => {
      const tabModels = allModels.filter((model) => model.type === activeTab)

      if (!filter || !searchQuery.trim()) {
        return tabModels
      }

      const query = searchQuery.toLowerCase()
      return tabModels.filter((model) => {
        const name = model.model.name.toLowerCase() || ''
        const id = model.model.id.toLowerCase() || ''
        const description = model.model.description.toLowerCase() || ''

        return name.includes(query) || id.includes(query) || description.includes(query)
      })
    },
    [allModels, activeTab, searchQuery],
  )

  // Handle moving model up or down
  const handleMoveModel = useCallback(
    async (modelId: string, direction: 'up' | 'down') => {
      const currentModels = getModelsForCurrentTab(false).filter((m) => isSystem || !m.isSystem)

      const currentIndex = currentModels.findIndex((m) => m.id === modelId)

      // Check if move is possible
      if (direction === 'up' && currentIndex <= 0) return // Already at the top
      if (direction === 'down' && currentIndex >= currentModels.length - 1) return // Already at the bottom

      const newModels = [...currentModels]
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

      // Swap models
      const temp = newModels[currentIndex]!
      newModels[currentIndex] = newModels[targetIndex]!
      newModels[targetIndex] = temp

      await sortModels({
        providerId,
        type: currentModels[currentIndex]!.type,
        ids: newModels.map((m) => m.id),
      })

      await refetchModels()
    },
    [getModelsForCurrentTab, sortModels, providerId, refetchModels, isSystem],
  )

  const [_, copyToClipboard] = useCopyToClipboard()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[800px]">
        <SheetHeader className="flex flex-row items-center gap-4">
          <Avatar className="size-10 rounded-lg">
            <AvatarImage src={`/images/providers/${provider.icon}`} alt={provider.name} />
            <AvatarFallback>
              <ServerIcon />
            </AvatarFallback>
          </Avatar>
          <div>
            <SheetTitle>{provider.name}</SheetTitle>
            <SheetDescription>Access models from the provider</SheetDescription>
          </div>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ModelType)}
          className="min-h-0 flex-1"
        >
          <div className="relative w-full">
            <div
              className="w-full px-4 overflow-x-auto no-scrollbar"
              onWheel={(e) => {
                // e.preventDefault()
                e.currentTarget.scrollLeft += e.deltaY
              }}
            >
              <TabsList className="w-auto">
                {MODEL_TYPES.map(({ value, label }) => {
                  const models = getModelsForType(value)
                  const systemCount = models.filter((m) => m.isSystem).length
                  const customizedCount = models.length - systemCount
                  return (
                    <TabsTrigger key={value} value={value} disabled={false}>
                      {label}
                      {systemCount > 0 && (
                        <TextTooltip content="The number of models provided by the platform">
                          <Badge
                            variant="secondary"
                            className="h-4 min-w-4 rounded-full px-1 font-mono tabular-nums"
                          >
                            {systemCount}
                          </Badge>
                        </TextTooltip>
                      )}
                      {customizedCount > 0 && (
                        <TextTooltip content="The number of models added by you">
                          <Badge className="h-4 min-w-4 rounded-full px-1 font-mono tabular-nums">
                            {customizedCount}
                          </Badge>
                        </TextTooltip>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
            {/* Left fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
            {/* Right fade effect */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
          </div>

          {MODEL_TYPES.map(({ value: type }) => {
            const models = getModelsForCurrentTab()

            const customizationTipIndex: number | undefined = models.findIndex((m) => !m.isSystem)
            const customizationTipIncr = customizationTipIndex >= 0 ? 1 : 0

            return (
              <TabsContent
                key={type}
                value={type}
                className="flex-1 flex flex-col px-4 pb-4 overflow-y-auto [overflow-anchor:none]"
              >
                <div className="my-4 flex justify-between items-center gap-2">
                  {/* Search input */}
                  <SearchInput
                    placeholder="Search models by ID, name, or description..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className="w-full"
                    disabled={false}
                  />
                  <Button onClick={() => handleAddNew(models.length)} size="sm" disabled={false}>
                    <PlusIcon />
                    Add
                  </Button>
                </div>

                {models.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-muted-foreground mb-4">
                      <p className="text-lg font-medium">
                        {searchQuery.trim()
                          ? 'No models found matching your search'
                          : `No models found for ${MODEL_TYPES.find((t) => t.value === type)?.label}`}
                      </p>
                      <p className="text-sm">
                        {searchQuery.trim()
                          ? 'Try adjusting your search terms'
                          : 'You can add a new model'}
                      </p>
                    </div>
                    {!searchQuery.trim() && (
                      <Button
                        onClick={() => handleAddNew(models.length)}
                        size="sm"
                        disabled={false}
                      >
                        <PlusIcon />
                        Add Model
                      </Button>
                    )}
                  </div>
                ) : (
                  <Virtualizer ref={vListRef} count={models.length + 1 + customizationTipIncr}>
                    {(itemIndex) => {
                      if (itemIndex === models.length + customizationTipIncr) {
                        return (
                          <div key="add" className="flex justify-end my-4">
                            <Button
                              onClick={() => handleAddNew(models.length)}
                              size="sm"
                              disabled={false}
                            >
                              <PlusIcon />
                              Add
                            </Button>
                          </div>
                        )
                      } else if (itemIndex === customizationTipIndex) {
                        return (
                          <div
                            key="tip"
                            className="text-sm text-muted-foreground italic my-2 border border-dashed rounded-lg p-2"
                          >
                            The following models are added by you and can be edited or removed at
                            any time.
                          </div>
                        )
                      }

                      const index =
                        customizationTipIndex >= 0 && itemIndex > customizationTipIndex
                          ? itemIndex - 1
                          : itemIndex
                      const model = models[index]

                      if (!model) {
                        return <></>
                      }

                      return (
                        <ModelItem
                          key={model.id}
                          index={index}
                          providerId={providerId}
                          model={model}
                          isSearching={!!searchQuery.trim()}
                          onEdit={() => handleEdit(model.id)}
                          onCancel={() => handleCancel(model.id)}
                          onSave={(formData) => handleSave(model.id, formData)}
                          onRemove={() => handleRemove(model.id)}
                          onMoveUp={() => handleMoveModel(model.id, 'up')}
                          onMoveDown={() => handleMoveModel(model.id, 'down')}
                          copyToClipboard={copyToClipboard}
                          canMoveUp={index > 0 && (isSystem || !models[index - 1]?.isSystem)}
                          canMoveDown={index < models.length - 1}
                          cache={cache[model.id]}
                          setCache={(cacheFn: (prevCache?: any) => any) =>
                            setCache((cache) => {
                              const prevCache = cache[model.id]
                              const newCache = cacheFn(prevCache)
                              return newCache !== prevCache
                                ? { ...cache, [model.id]: newCache }
                                : cache
                            })
                          }
                          isSystem={isSystem}
                        />
                      )
                    }}
                  </Virtualizer>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function ModelItem({
  index,
  providerId,
  model,
  isSearching,
  onEdit,
  onCancel,
  onSave,
  onRemove,
  onMoveUp,
  onMoveDown,
  copyToClipboard,
  canMoveUp,
  canMoveDown,
  cache,
  setCache,
  isSystem,
}: {
  index: number
  providerId: ProviderId
  model: EditableModel
  isSearching: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (formData: UpdateModelArgs) => Promise<void>
  onRemove: () => Promise<void>
  onMoveUp: () => Promise<void>
  onMoveDown: () => Promise<void>
  copyToClipboard: (value: string) => void
  canMoveUp: boolean
  canMoveDown: boolean
  cache?: any
  setCache: (cacheFn: (prevCache?: any) => any) => void
  isSystem?: boolean
}) {
  // Track loading states for specific actions separately
  const [isSaving, setIsSaving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isMovingUp, setIsMovingUp] = useState(false)
  const [isMovingDown, setIsMovingDown] = useState(false)

  // Handle save with loading state
  const handleSave = async (formData: UpdateModelArgs) => {
    setIsSaving(true)
    try {
      await onSave(formData)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle remove with loading state
  const handleRemove = async () => {
    setIsRemoving(true)
    try {
      await onRemove()
    } finally {
      setIsRemoving(false)
    }
  }

  // Handle move up with loading state
  const handleMoveUp = async () => {
    setIsMovingUp(true)
    try {
      await onMoveUp()
    } finally {
      setIsMovingUp(false)
    }
  }

  // Handle move down with loading state
  const handleMoveDown = async () => {
    setIsMovingDown(true)
    try {
      await onMoveDown()
    } finally {
      setIsMovingDown(false)
    }
  }

  if (model.isEditing) {
    return (
      <ModelItemEdit
        index={index}
        providerId={providerId}
        model={model}
        isSystem={isSystem}
        isSaving={isSaving}
        isRemoving={isRemoving}
        isSorting={isMovingUp || isMovingDown}
        onCancel={onCancel}
        onSave={handleSave}
        onRemove={handleRemove}
        cache={cache}
        setCache={setCache}
      />
    )
  } else {
    return (
      <ModelItemView
        index={index}
        providerId={providerId}
        model={model}
        isSystem={isSystem}
        isSearching={isSearching}
        isSaving={isSaving}
        isRemoving={isRemoving}
        isMovingUp={isMovingUp}
        isMovingDown={isMovingDown}
        onEdit={onEdit}
        onRemove={handleRemove}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        copyToClipboard={copyToClipboard}
      />
    )
  }
}
