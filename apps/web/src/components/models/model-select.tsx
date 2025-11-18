import type { ComponentPropsWithoutRef } from 'react'
import type { VirtualizerHandle } from 'virtua'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import { Check, ChevronsUpDown, Info, ServerIcon } from 'lucide-react'
import { Virtualizer } from 'virtua'

import type {
  EmbeddingModelInfo,
  EmbeddingProviderModelsInfo,
  ImageModelInfo,
  ImageProviderModelsInfo,
  LanguageModelInfo,
  LanguageProviderModelsInfo,
  SpeechModelInfo,
  SpeechProviderModelsInfo,
  TranscriptionModelInfo,
  TranscriptionProviderModelsInfo,
} from '@cared/api'
import type { BaseProviderInfo, ModelFullId, ModelType } from '@cared/providers'
import { Avatar, AvatarFallback, AvatarImage } from '@cared/ui/components/avatar'
import { Button } from '@cared/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@cared/ui/components/command'
import { HoverCard, HoverCardTrigger } from '@cared/ui/components/hover-card'
import { Popover, PopoverContent, PopoverTrigger } from '@cared/ui/components/popover'
import { Separator } from '@cared/ui/components/separator'
import { useIsMobile } from '@cared/ui/hooks/use-mobile'
import { cn } from '@cared/ui/lib/utils'

import {
  EmbeddingModelItemView,
  ImageModelItemView,
  LanguageModelItemView,
  SpeechModelItemView,
  TranscriptionModelItemView,
} from './model-item-view'

type ProviderModelsInfo =
  | LanguageProviderModelsInfo[]
  | ImageProviderModelsInfo[]
  | SpeechProviderModelsInfo[]
  | TranscriptionProviderModelsInfo[]
  | EmbeddingProviderModelsInfo[]

type ModelInfo =
  | LanguageModelInfo
  | ImageModelInfo
  | SpeechModelInfo
  | TranscriptionModelInfo
  | EmbeddingModelInfo

export function ModelSelect({
  open,
  onOpenChange,
  value,
  onValueChange,
  modelType,
  providerModels,
  className,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  value?: ModelFullId
  onValueChange?: (value: ModelFullId) => void
  modelType: ModelType
  providerModels: ProviderModelsInfo
  className?: string
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const handleOpenChange = isControlled ? onOpenChange : setInternalOpen

  // Find the selected model
  const selectedModel = useMemo(() => {
    const modelId = value
    if (!modelId) {
      return
    }

    for (const provider of providerModels) {
      const { models, ...info } = provider
      const model = models.find((m) => m.id === modelId)
      if (model) {
        return {
          ...model,
          provider: info,
        }
      }
    }
    return
  }, [providerModels, value])

  const [search, setSearch] = useState('')

  useEffect(() => {
    setSearch('')
  }, [isOpen])

  const filteredProviderModels = useMemo(() => {
    if (!search) {
      return providerModels.filter((provider) => provider.models.length)
    }
    const searchTerm = search.trim().toLowerCase()
    const filtered: ProviderModelsInfo = []
    for (const provider of providerModels) {
      if (!provider.models.length) {
        continue
      }
      if (provider.name.toLowerCase().includes(searchTerm) || provider.id.includes(searchTerm)) {
        filtered.push(provider)
      } else {
        const models: ProviderModelsInfo[number]['models'][number][] = []
        for (const model of provider.models) {
          if (model.name.toLowerCase().includes(searchTerm) || model.id.includes(searchTerm)) {
            models.push(model)
          }
        }
        if (models.length) {
          filtered.push({ ...provider, models })
        }
      }
    }
    return filtered
  }, [providerModels, search])

  return (
    <Popover onOpenChange={handleOpenChange} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={isOpen}
          className={cn('w-full justify-between gap-2', className)}
          variant="outline"
        >
          {selectedModel ? (
            <span className="flex gap-1 truncate">
              <span className="text-muted-foreground">{selectedModel.provider.name}</span>
              <span className="text-muted-foreground">&gt;</span>
              <span className="truncate">{selectedModel.name}</span>
            </span>
          ) : (
            <span className="truncate">'Select model...'</span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[calc(var(--radix-popover-content-available-height)-16px)] w-(--radix-popover-trigger-width)! p-0"
        // https://github.com/radix-ui/primitives/issues/1159#issuecomment-3018464158
        onTouchMove={(e) => {
          e.stopPropagation()
        }}
        onWheel={(e) => {
          e.stopPropagation()
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            className="h-9"
            onValueChange={setSearch}
            placeholder="Search models..."
            value={search}
          />
          <CommandList className="max-h-full overflow-y-hidden">
            <CommandEmpty>No models found</CommandEmpty>
            {filteredProviderModels.length > 0 && (
              <CommandGroup className="p-2">
                <div className="max-h-[calc(var(--radix-popover-content-available-height)-71px)] overflow-y-auto">
                  <ModelList
                    handleOpenChange={handleOpenChange}
                    isOpen={isOpen}
                    modelType={modelType}
                    onValueChange={onValueChange}
                    providerModels={filteredProviderModels}
                    selectedModel={selectedModel}
                    value={value}
                  />
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ModelList({
  isOpen,
  handleOpenChange,
  value,
  onValueChange,
  modelType,
  providerModels,
  selectedModel,
}: {
  isOpen?: boolean
  handleOpenChange?: (open: boolean) => void
  value?: ModelFullId
  onValueChange?: (value: ModelFullId) => void
  modelType: ModelType
  providerModels: ProviderModelsInfo
  selectedModel?: ProviderModelsInfo[number]['models'][number] & {
    provider: BaseProviderInfo
  }
}) {
  const ref = useRef<VirtualizerHandle>(null)

  useLayoutEffect(() => {
    const handle = ref.current
    if (!isOpen || !handle || !selectedModel) {
      return
    }
    const filtered = providerModels.filter((provider) => provider.models.length)
    const providerIndex = filtered.findIndex((p) => p.id === selectedModel.provider.id)
    if (providerIndex < 0) {
      return
    }
    let index = 0
    for (let i = 0; i < providerIndex + 1; ++i) {
      index += 1 + (i > 0 ? 1 : 0)
      index +=
        (i < providerIndex
          ? filtered[i]?.models.length
          : filtered[i]?.models.findIndex((m) => m.id === selectedModel.id)) ?? 0
    }
    handle.scrollToIndex(index)
  }, [isOpen, providerModels, selectedModel])

  const isMobile = useIsMobile()

  return (
    <Virtualizer ref={ref}>
      {providerModels.flatMap((provider, index) => [
        ...(index > 0 ? [<Separator className="my-2" key={`${provider.id}-sep`} />] : []),
        <CommandItem
          className="flex w-full items-center gap-2 font-semibold data-[disabled=true]:opacity-100"
          disabled
          key={provider.id}
          value={provider.id}
        >
          <Avatar className="size-4 rounded-lg">
            <AvatarImage alt={provider.name} src={`/images/providers/${provider.icon}`} />
            <AvatarFallback>
              <ServerIcon className="h-3! w-3!" />
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{provider.name}</span>
        </CommandItem>,
        ...provider.models.map((model) => (
          <ModelItem
            isMobile={isMobile}
            isSelected={value === model.id}
            key={model.id}
            model={model}
            modelType={modelType}
            onSelect={() => {
              onValueChange?.(model.id)
              handleOpenChange?.(false)
            }}
          />
        )),
      ])}
    </Virtualizer>
  )
}

function ModelItem({
  model,
  isSelected,
  onSelect,
  modelType,
  isMobile,
}: {
  model: ModelInfo
  isSelected: boolean
  onSelect: () => void
  modelType: string
  isMobile: boolean
}) {
  const content = (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="font-medium">{model.name}</h4>

        <span className="font-mono text-muted-foreground text-xs">{model.id}</span>

        {model.description && (
          <blockquote className="my-2 border-l-1 pl-4 text-muted-foreground text-sm break-all">
            {model.description}
          </blockquote>
        )}
      </div>

      {/* Render model-specific details */}
      {modelType === 'language' && <LanguageModelItemView model={model as LanguageModelInfo} />}
      {modelType === 'image' && <ImageModelItemView model={model as ImageModelInfo} />}
      {modelType === 'speech' && <SpeechModelItemView model={model as SpeechModelInfo} />}
      {modelType === 'transcription' && (
        <TranscriptionModelItemView model={model as TranscriptionModelInfo} />
      )}
      {modelType === 'textEmbedding' && (
        <EmbeddingModelItemView model={model as EmbeddingModelInfo} />
      )}
    </div>
  )

  if (!isMobile) {
    return (
      <HoverCard closeDelay={0} openDelay={0}>
        <HoverCardTrigger asChild>
          <ModelItemTrigger isSelected={isSelected} model={model} onSelect={onSelect} />
        </HoverCardTrigger>
        <HoverCardPrimitive.Portal>
          <HoverCardPrimitive.Content
            align="start"
            className="z-50 w-[600px] max-w-(--radix-hover-card-content-available-width) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden"
            data-slot="hover-card-content"
            side="right"
            sideOffset={16}
          >
            {content}
          </HoverCardPrimitive.Content>
        </HoverCardPrimitive.Portal>
      </HoverCard>
    )
  } else {
    return (
      <Popover>
        <ModelItemTrigger isSelected={isSelected} model={model} onSelect={onSelect}>
          <PopoverTrigger asChild>
            <Button
              className="size-4"
              onClick={(e) => {
                e.stopPropagation()
              }}
              size="icon"
              variant="ghost"
            >
              <Info className="text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        </ModelItemTrigger>
        <PopoverContent
          align="start"
          className="max-h-(--radix-popover-content-available-height) w-[300px] max-w-(--radix-popover-content-available-width) p-4"
          side="left"
        >
          {content}
        </PopoverContent>
      </Popover>
    )
  }
}

const ModelItemTrigger = ({
  model,
  isSelected,
  onSelect,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof CommandItem> & {
  model: ModelInfo
  isSelected: boolean
  onSelect: () => void
}) => (
  <CommandItem
    className="flex w-full items-center justify-between gap-2"
    onSelect={onSelect}
    value={model.id}
    {...props}
  >
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="truncate">{model.name}</span>
    </div>
    <Check className={cn('h-4 w-4 text-green-500', isSelected ? 'opacity-100' : 'opacity-0')} />
    {children}
  </CommandItem>
)
