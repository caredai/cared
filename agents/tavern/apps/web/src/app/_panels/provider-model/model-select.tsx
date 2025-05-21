import { useEffect, useMemo, useState } from 'react'
import { Check, Star } from 'lucide-react'
import { VList } from 'virtua'

import { Button } from '@ownxai/ui/components/button'
import { Input } from '@ownxai/ui/components/input'
import { Popover, PopoverContent, PopoverTrigger } from '@ownxai/ui/components/popover'
import { Separator } from '@ownxai/ui/components/separator'

import { useModels } from '@/hooks/use-models'
import { useModelSettings, useUpdateModelSettings } from '@/lib/settings'
import { cn } from '@ownxai/ui/lib/utils'

interface Group {
  label: string
  items: Item[]
  isFavorites?: boolean
}

interface Item {
  label: string
  value: string
}

function useModelGroups() {
  const { models } = useModels()
  const modelSettings = useModelSettings()

  return useMemo(() => {
    // Transform model data structure to match the required group[] type
    const processModelsToGroups = (models: any[] | undefined): Group[] => {
      if (!models) return []

      // Convert each provider into a group object
      return models.map((provider) => ({
        label: provider.name,
        items: provider.models.map((model: { name: string; id: string }) => ({
          label: model.name,
          value: model.id
        }))
      }))
    }

    // Process different types of model data
    const languageModelItems = processModelsToGroups(models.language)
    const embeddingModelItems = processModelsToGroups(models['text-embedding'])
    const imageModelItems = processModelsToGroups(models.image)

    // Add a favorites group if there are any favorite models
    const favoriteLanguageModelItems: Item[] = []
    if (modelSettings.favoriteLanguageModels.length > 0) {
      // Find all favorite models from all providers
      for (const group of languageModelItems) {
        for (const item of group.items) {
          if (modelSettings.favoriteLanguageModels.includes(item.value)) {
            favoriteLanguageModelItems.push(item)
          }
        }
      }
    }

    if (favoriteLanguageModelItems.length > 0) {
      languageModelItems.unshift({
        label: 'Favorites',
        items: favoriteLanguageModelItems,
        isFavorites: true
      })
    }

    return {
      languageModelItems,
      embeddingModelItems,
      imageModelItems
    }
  }, [models, modelSettings])
}

/**
 * A reusable model selection component
 * Displays a button that opens a popover with a virtualized list of model options
 * Includes search functionality to filter models by label or value
 */
export function ModelSelect({
                              label,
                              description,
                              type = 'language'
                            }: {
  label: string
  description: string
  type?: 'language' | 'text-embedding' | 'image'
}) {
  const { languageModelItems, embeddingModelItems, imageModelItems } = useModelGroups()
  const modelSettings = useModelSettings()
  const updateModelSettings = useUpdateModelSettings()

  // Get the appropriate model groups based on type
  const groups = useMemo(() => {
    switch (type) {
      case 'language':
        return languageModelItems
      case 'text-embedding':
        return embeddingModelItems
      case 'image':
        return imageModelItems
    }
  }, [type, languageModelItems, embeddingModelItems, imageModelItems])

  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setInputValue('')
  }, [open])

  const [selectedModel, setSelectedModel] = useState(modelSettings.languageModel)

  useEffect(() => {
    setSelectedModel(modelSettings.languageModel)
  }, [modelSettings])

  const selectedModelLabel = useMemo(() => {
    for (const group of groups) {
      const item = group.items.find((item) => item.value === selectedModel)
      if (item) {
        return {
          provider: group.label,
          model: item.label
        }
      }
    }
    return 'Select a model'
  }, [groups, selectedModel])

  const filtered = useMemo(() => {
    if (!inputValue) {
      return groups
    }

    const lowerSearchTerm = inputValue.toLowerCase()

    const filteredGroup: Group[] = []
    for (const group of groups) {
      if (group.label.toLowerCase().includes(lowerSearchTerm)) {
        filteredGroup.push(group)
      } else {
        const filteredItems: Item[] = []
        for (const item of group.items) {
          if (item.label.toLowerCase().includes(lowerSearchTerm)) {
            filteredItems.push(item)
          }
        }
        if (filteredItems.length) {
          filteredGroup.push({ ...group, items: filteredItems })
        }
      }
    }
    return filteredGroup
  }, [groups, inputValue])

  const handleModelChange = (value: string) => {
    setSelectedModel(value)
    void updateModelSettings({ languageModel: value })
  }

  const toggleFavorite = async (modelId: string) => {
    const isFavorite = modelSettings.favoriteLanguageModels.includes(modelId)
    const newFavorites = isFavorite
      ? modelSettings.favoriteLanguageModels.filter((id) => id !== modelId)
      : [...modelSettings.favoriteLanguageModels, modelId]

    await updateModelSettings({
      favoriteLanguageModels: newFavorites
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {typeof selectedModelLabel === 'string' ? (
              selectedModelLabel
            ) : (
              <span className="flex gap-2">
                <span className="text-muted-foreground">{selectedModelLabel.provider}</span>
                <span className="text-muted-foreground">&gt;</span>
                <span>{selectedModelLabel.model}</span>
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-6000 w-(--radix-popover-trigger-width) h-[40dvh] p-4 flex flex-col gap-4">
          <Input
            placeholder={`Search ${label.toLowerCase()}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          {filtered.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground">No models found</div>
          )}
          <VList count={filtered.length}>
            {filtered.flatMap((group, index) => [
              index > 0 && <Separator key={`separator-${group.label}`} className="bg-ring/50 my-2" />,
              <div
                key={group.label}
                className="px-1.5 py-1.5 text-sm font-semibold text-muted-foreground"
              >
                {group.label}
              </div>,
              ...group.items.map((item) => (
                <div
                  key={`${group.label}-${item.value}`}
                  className="w-full flex items-center justify-between px-1.5 py-1.5 h-auto group cursor-pointer hover:bg-background hover:text-foreground text-sm"
                  onClick={() => {
                    handleModelChange(item.value)
                    setOpen(false)
                  }}
                >
                  <span>{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.value === selectedModel && <Check className="h-4 w-4 text-green-500" />}
                    <Star
                      className={cn('h-4 w-4 invisible group-hover:visible',
                        modelSettings.favoriteLanguageModels.includes(item.value)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-muted-foreground',
                        !group.isFavorites && modelSettings.favoriteLanguageModels.includes(item.value) && 'visible'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        void toggleFavorite(item.value)
                      }}
                    />
                  </div>
                </div>
              ))
            ])}
          </VList>
        </PopoverContent>
      </Popover>
    </div>
  )
}
