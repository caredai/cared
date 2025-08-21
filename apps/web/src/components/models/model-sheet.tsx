'use client'

import type { VirtualizerHandle } from 'virtua'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PlusIcon, ServerIcon } from 'lucide-react'
import { Virtualizer } from 'virtua'

import type { UpdateModelArgs } from '@cared/api'
import type { BaseProviderInfo, ModelType, ProviderId } from '@cared/providers'
import { Avatar, AvatarFallback, AvatarImage } from '@cared/ui/components/avatar'
import { Button } from '@cared/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@cared/ui/components/sheet'

import type { EditableModel } from './model-item-edit'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { useDeleteModel, useModels, useUpdateModel } from '@/hooks/use-model'
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
  provider?: BaseProviderInfo
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const providerId = provider?.id

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

  const vListRef = useRef<VirtualizerHandle>(null)

  const [newModels, setNewModels] = useState<EditableModel[]>([])
  const [existingModels, setExistingModels] = useState<EditableModel[]>([])
  const [allModels, setAllModels] = useState<EditableModel[]>([])
  const [activeTab, setActiveTab] = useState<ModelType>('language')

  useEffect(() => {
    setNewModels([])
    setActiveTab('language')
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
  const handleAddNew = useCallback(() => {
    if (!providerId) {
      return
    }

    const id = `${TEMP_ID_PREFIX as ProviderId}:${Date.now()}` as const

    const newModel: EditableModel = {
      id,
      isEditing: true,
      isNew: true,
      ...getDefaultValuesForModelType(providerId, activeTab),
    }

    setNewModels((prev) => [...prev, newModel])

    // Scroll to the last item (new item)
    setTimeout(() => {
      const lastIndex = allModels.length + 1
      vListRef.current?.scrollToIndex(lastIndex, { align: 'end', smooth: true })
    }, 100)
  }, [providerId, activeTab, allModels.length])

  // Handle editing existing model
  const handleEdit = useCallback((id: string) => {
    setNewModels((prev) =>
      prev.map((model) => (model.id === id ? { ...model, isEditing: true } : model)),
    )
    setExistingModels((prev) =>
      prev.map((model) => (model.id === id ? { ...model, isEditing: true } : model)),
    )
  }, [])

  // Handle canceling edits
  const handleCancel = useCallback((id: string) => {
    setNewModels((prev) =>
      prev.map((model) => (model.id === id ? { ...model, isEditing: false } : model)),
    )
    setExistingModels((prev) =>
      prev.map((model) => (model.id === id ? { ...model, isEditing: false } : model)),
    )
  }, [])

  // Handle saving changes
  const handleSave = useCallback(
    async (id: string, args: UpdateModelArgs) => {
      if (!providerId) {
        return
      }

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
    },
    [updateModel, providerId, refetchModels],
  )

  // Handle removing temporary items or deleting existing ones
  const handleRemove = useCallback(
    async (id: string) => {
      if (id.startsWith(TEMP_ID_PREFIX)) {
        // This is a temporary item, just remove from local state
        setNewModels((prev) => prev.filter((model) => model.id !== id))
        return
      }

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
    },
    [deleteModel, allModels],
  )

  // Get models for current tab
  const getModelsForCurrentTab = useCallback(() => {
    return allModels.filter((model) => model.type === activeTab)
  }, [allModels, activeTab])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px]">
        <SheetHeader className="flex flex-row items-center gap-4">
          <Avatar className="size-10 rounded-lg">
            <AvatarImage
              src={provider?.icon ? `/images/providers/${provider.icon}` : undefined}
              alt={provider?.name}
            />
            <AvatarFallback>
              <ServerIcon />
            </AvatarFallback>
          </Avatar>
          <div>
            <SheetTitle>{provider?.name}</SheetTitle>
            <SheetDescription>Manage Models</SheetDescription>
          </div>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ModelType)}
          className="h-[calc(100%-92px)]"
        >
          <div className="relative w-full">
            <div
              className="w-full overflow-x-auto no-scrollbar"
              onWheel={(e) => {
                // e.preventDefault()
                e.currentTarget.scrollLeft += e.deltaY
              }}
            >
              <TabsList className="w-auto">
                {MODEL_TYPES.map(({ value, label }) => (
                  <TabsTrigger key={value} value={value}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {/* Left fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
            {/* Right fade effect */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
          </div>

          {MODEL_TYPES.map(({ value: type }) => {
            const models = getModelsForCurrentTab()

            return (
              <TabsContent
                key={type}
                value={type}
                className="flex-1 flex flex-col px-4 pb-4 overflow-y-auto [overflow-anchor:none]"
              >
                {models.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-muted-foreground mb-4">
                      <p className="text-lg font-medium">
                        No models found for {MODEL_TYPES.find((t) => t.value === type)?.label}
                      </p>
                      <p className="text-sm">You can add a new model</p>
                    </div>
                    <Button onClick={handleAddNew} size="sm">
                      <PlusIcon />
                      Add Model
                    </Button>
                  </div>
                ) : (
                  <Virtualizer ref={vListRef} count={models.length + 1}>
                    {(index) => {
                      if (index === models.length) {
                        return (
                          <div className="flex justify-end my-4">
                            <Button onClick={handleAddNew} size="sm">
                              <PlusIcon />
                              Add
                            </Button>
                          </div>
                        )
                      }

                      const model = models[index]!

                      return (
                        <ModelItem
                          key={model.id}
                          index={index}
                          providerId={providerId}
                          model={model}
                          onEdit={() => handleEdit(model.id)}
                          onCancel={() => handleCancel(model.id)}
                          onSave={(formData) => handleSave(model.id, formData)}
                          onRemove={() => handleRemove(model.id)}
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
  onEdit,
  onCancel,
  onSave,
  onRemove,
}: {
  index: number
  providerId: ProviderId
  model: EditableModel
  onEdit: () => void
  onCancel: () => void
  onSave: (formData: UpdateModelArgs) => Promise<void>
  onRemove: () => Promise<void>
}) {
  // Track loading states for specific actions separately
  const [isSaving, setIsSaving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

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

  if (model.isEditing) {
    return (
      <ModelItemEdit
        index={index}
        providerId={providerId}
        model={model}
        isSaving={isSaving}
        isRemoving={isRemoving}
        onCancel={onCancel}
        onSave={handleSave}
        onRemove={handleRemove}
      />
    )
  } else {
    return (
      <ModelItemView
        index={index}
        providerId={providerId}
        model={model}
        isSaving={isSaving}
        isRemoving={isRemoving}
        onEdit={onEdit}
        onRemove={handleRemove}
      />
    )
  }
}
