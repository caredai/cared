'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronUp, CloudCog, KeyRound, Server } from 'lucide-react'
import { useCopyToClipboard } from 'react-use'

import type { ProviderId } from '@cared/providers'
import { splitModelFullId } from '@cared/providers'
import { Button } from '@cared/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cared/ui/components/collapsible'

import { SectionTitle } from '@/components/section'
import { useModels, useProviders } from '@/hooks/use-model'
import { CopyModelId } from './copy-model-id'
import { ModelSheet } from './model-sheet'
import { ProviderKeysSheet } from './provider-keys-sheet'

// Model type definition
type ModelType = 'language' | 'image' | 'speech' | 'transcription' | 'textEmbedding'

// Model type display configuration
const MODEL_TYPE_CONFIG: Record<ModelType, { title: string }> = {
  language: { title: 'Language Models' },
  image: { title: 'Image Models' },
  speech: { title: 'Speech Models' },
  transcription: { title: 'Transcription Models' },
  textEmbedding: { title: 'Text Embedding Models' },
}

export function Models({
  isSystem,
  organizationId,
}: {
  isSystem?: boolean
  organizationId?: string
}) {
  const [_, copyToClipboard] = useCopyToClipboard()

  // Get all provider information
  const { providers } = useProviders()

  // Get all model information
  const { models } = useModels({
    organizationId,
    source: isSystem ? 'system' : undefined,
  })

  // Track expanded state for each provider
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({})

  // Track provider keys sheet state
  const [providerKeysSheetOpen, setProviderKeysSheetOpen] = useState(false)
  // Track model sheet state
  const [modelSheetOpen, setModelSheetOpen] = useState(false)

  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId>()
  const selectedProvider = selectedProviderId
    ? providers.find((p) => p.id === selectedProviderId)
    : undefined

  // Toggle provider expanded state
  const toggleProvider = (providerId: string) => {
    setExpandedProviders((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }))
  }

  // Handle opening provider keys sheet
  const handleOpenProviderKeys = (providerId: ProviderId) => {
    setSelectedProviderId(providerId)
    setProviderKeysSheetOpen(true)
  }

  // Handle closing provider keys sheet
  const handleCloseProviderKeys = () => {
    setProviderKeysSheetOpen(false)
    setSelectedProviderId(undefined)
  }

  const handleOpenModelSheet = (providerId: ProviderId) => {
    setSelectedProviderId(providerId)
    setModelSheetOpen(true)
  }

  const handleCloseModelSheet = () => {
    setModelSheetOpen(false)
    setSelectedProviderId(undefined)
  }

  // Get models of a specific type for a provider
  const getModelsForProvider = (providerId: string, modelType: ModelType) => {
    return models[modelType]?.filter((model) => model.id.startsWith(`${providerId}:`)) ?? []
  }

  // All model types to display
  const allModelTypes: ModelType[] = [
    'language',
    'image',
    'speech',
    'transcription',
    'textEmbedding',
  ]

  return (
    <>
      <SectionTitle title="Models" description="View and manage available providers and models" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <Collapsible
            key={provider.id}
            open={expandedProviders[provider.id]}
            onOpenChange={() => toggleProvider(provider.id)}
          >
            <Card className="relative">
              {/* Settings button positioned at top-right */}
              <div className="absolute top-4 right-4 flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleOpenProviderKeys(provider.id)}
                  title="Manage Provider Keys"
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleOpenModelSheet(provider.id)}
                  title="Manage Models"
                >
                  <CloudCog className="h-4 w-4" />
                </Button>
              </div>

              <CardHeader>
                <CardTitle className="flex items-center gap-4">
                  <div className="relative h-10 w-10 overflow-hidden rounded-sm flex items-center">
                    <Image
                      src={`/images/providers/${provider.icon}`}
                      alt={`${provider.name} logo`}
                      unoptimized={true}
                      width={40}
                      height={40}
                      className="object-cover"
                      onError={(e) => {
                        // Fallback to Server icon if image fails to load
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('opacity-0')
                        e.currentTarget.nextElementSibling?.classList.add('opacity-100')
                      }}
                    />
                    <Server className="h-10 w-10 absolute top-0 left-0 opacity-0" />
                  </div>
                  {provider.name}
                </CardTitle>
                <CardDescription>
                  <p>
                    Provider ID: <span className="font-mono">{provider.id}</span>
                  </p>
                  <p className="mt-4 lg:min-h-16 xl:min-h-10">{provider.description}</p>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    {expandedProviders[provider.id] ? (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Hide Models
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        {allModelTypes.reduce(
                          (total, type) => total + getModelsForProvider(provider.id, type).length,
                          0,
                        )}{' '}
                        Models
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
                  <div className="pt-6 pb-2">
                    {(() => {
                      const modelsByType = allModelTypes.map((modelType) =>
                        getModelsForProvider(provider.id, modelType),
                      )
                      return (
                        <>
                          {/* Render model sections for each type */}
                          {modelsByType.map((models, index) => {
                            const modelType = allModelTypes[index]!
                            return (
                              <ModelsByType
                                key={modelType}
                                modelType={modelType}
                                models={models}
                                isLast={
                                  !modelsByType.slice(index + 1).some((models) => models.length)
                                }
                                copyToClipboard={copyToClipboard}
                              />
                            )
                          })}
                          {/* No models available */}
                          {modelsByType.every((models) => !models.length) && (
                            <p className="text-sm text-muted-foreground">
                              No models available for this provider
                            </p>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>
        ))}

        {/* No providers available */}
        {!providers.length && (
          <Card>
            <CardHeader>
              <CardTitle>No Model Providers Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No model providers are currently configured
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedProvider && (
        <>
          <ProviderKeysSheet
            isSystem={isSystem}
            organizationId={organizationId}
            provider={selectedProvider}
            open={providerKeysSheetOpen}
            onOpenChange={handleCloseProviderKeys}
          />

          <ModelSheet
            isSystem={isSystem}
            organizationId={organizationId}
            provider={selectedProvider}
            open={modelSheetOpen}
            onOpenChange={handleCloseModelSheet}
          />
        </>
      )}
    </>
  )
}

// Component to render a section of models by type
function ModelsByType({
  modelType,
  models,
  isLast,
  copyToClipboard,
}: {
  modelType: ModelType
  models: { id: string; name: string; description?: string }[]
  isLast: boolean
  copyToClipboard: (value: string) => void
}) {
  if (!models.length) return null

  return (
    <div className={isLast ? '' : 'mb-4'}>
      <h3 className="font-medium mb-2">{MODEL_TYPE_CONFIG[modelType].title}</h3>
      <ul className="space-y-2">
        {models.map((model) => {
          return (
            <li key={model.id} className="text-sm p-2 bg-muted rounded-md">
              <div className="font-medium">{model.name}</div>
              <CopyModelId modelId={model.id} copyToClipboard={copyToClipboard} />
              {model.description && (
                <div className="text-xs text-muted-foreground mt-1">{model.description}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
