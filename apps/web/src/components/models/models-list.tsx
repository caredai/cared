import type { VirtualizerHandle } from 'virtua'
import { useCallback, useRef, useState } from 'react'
import { Virtualizer } from 'virtua'

import type { ModelType, ProviderId } from '@cared/providers'
import { Badge } from '@cared/ui/components/badge'

import { SearchInput } from '@/components/search-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { TextTooltip } from '@/components/tooltip'
import { useModels, useProviders } from '@/hooks/use-model'
import { ModelItemView } from './model-item-view'

// Model types configuration
const MODEL_TYPES: { value: ModelType; label: string }[] = [
  { value: 'language', label: 'Language Models' },
  { value: 'image', label: 'Image Models' },
  { value: 'speech', label: 'Speech Models' },
  { value: 'transcription', label: 'Transcription Models' },
  { value: 'textEmbedding', label: 'Text Embedding Models' },
]

export function ModelsList({ scope }: { scope: 'system' | 'effective' }) {
  const { models } = useModels({ source: scope })
  const { providers } = useProviders()

  const vListRef = useRef<VirtualizerHandle>(null)

  const [activeTab, setActiveTab] = useState<ModelType>('language')
  const [searchQuery, setSearchQuery] = useState('')

  // Transform models to a flat list format
  const allModels = MODEL_TYPES.flatMap(({ value: type }) => {
    const typeModels = models[type] || []
    return typeModels.map((model) => ({
      id: model.id,
      type,
      model,
      isSystem: model.isSystem,
      isEditing: false,
      isNew: false,
    }))
  })

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

  // Get models for a specific type
  const getModelsForType = useCallback(
    (type: ModelType) => {
      return allModels.filter((model) => model.type === type)
    },
    [allModels],
  )

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as ModelType)}
      className="flex-1 h-full"
    >
      <div className="relative w-full">
        <div
          className="w-full px-4 overflow-x-auto no-scrollbar"
          onWheel={(e) => {
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

        return (
          <TabsContent
            key={type}
            value={type}
            className="flex-1 flex flex-col px-4 pb-4 overflow-y-auto [overflow-anchor:none]"
          >
            <div className="my-4">
              {/* Search input */}
              <SearchInput
                placeholder="Search models by ID, name, or description..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="w-full"
                disabled={false}
              />
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
                    {searchQuery.trim() ? 'Try adjusting your search terms' : ''}
                  </p>
                </div>
              </div>
            ) : (
              <Virtualizer ref={vListRef} count={models.length}>
                {(itemIndex) => {
                  const model = models[itemIndex]

                  if (!model) {
                    return <></>
                  }

                  // Extract provider ID from model ID (format: providerId:modelId)
                  const providerId = model.id.split(':')[0] as ProviderId
                  const provider = providers.find((p) => p.id === providerId)

                  return (
                    <ModelItemView
                      key={model.id}
                      index={itemIndex}
                      provider={provider}
                      model={model}
                      isSystem={scope === 'system'}
                      isSearching={!!searchQuery.trim()}
                      isSaving={false}
                      isRemoving={false}
                      isMovingUp={false}
                      isMovingDown={false}
                      onEdit={() => {
                        /* empty */
                      }}
                      onRemove={async () => {
                        /* empty */
                      }}
                      onMoveUp={async () => {
                        /* empty */
                      }}
                      onMoveDown={async () => {
                        /* empty */
                      }}
                      canMoveUp={false}
                      canMoveDown={false}
                      readOnly={true}
                    />
                  )
                }}
              </Virtualizer>
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
