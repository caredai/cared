'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { useSuspenseQuery } from '@tanstack/react-query'
import { CheckIcon, ChevronDown, ChevronUp, CopyIcon, Server } from 'lucide-react'
import { useCopyToClipboard } from 'react-use'

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

import { useTRPC } from '@/trpc/client'

// Model type definition
type ModelType = 'language' | 'text-embedding' | 'image'

// Model type display configuration
const MODEL_TYPE_CONFIG: Record<ModelType, { title: string }> = {
  language: { title: 'Language Models' },
  'text-embedding': { title: 'Text Embedding Models' },
  image: { title: 'Image Models' },
}

export function Models() {
  const trpc = useTRPC()
  const [_, copyToClipboard] = useCopyToClipboard()

  // Get all provider information
  const { data: providersData } = useSuspenseQuery(trpc.model.listProviders.queryOptions())

  // Get all model information
  const { data: modelsData } = useSuspenseQuery(trpc.model.listModels.queryOptions())

  // Track expanded state for each provider
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({})

  // Toggle provider expanded state
  const toggleProvider = (providerId: string) => {
    setExpandedProviders((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }))
  }

  // Get models of a specific type for a provider
  const getModelsForProvider = (providerId: string, modelType: ModelType) => {
    return (
      modelsData.models[modelType]?.filter((model) => model.id.startsWith(`${providerId}:`)) ?? []
    )
  }

  // All model types to display
  const allModelTypes: ModelType[] = ['language', 'text-embedding', 'image']

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight truncate">Models</h1>
        <p className="text-muted-foreground mt-2">View and manage available providers and models</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providersData.providers.map((provider) => (
          <Collapsible
            key={provider.id}
            open={expandedProviders[provider.id]}
            onOpenChange={() => toggleProvider(provider.id)}
          >
            <Card>
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
        {!providersData.providers.length && (
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
    </div>
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
          const { modelId } = splitModelFullId(model.id)
          return (
            <li key={model.id} className="text-sm p-2 bg-muted rounded-md">
              <div className="font-medium">{model.name}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="font-mono">{modelId}</span>
                <CopyModelId modelId={model.id} copyToClipboard={copyToClipboard} />
              </div>
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

function CopyModelId({
  modelId,
  copyToClipboard,
}: {
  modelId: string
  copyToClipboard: (value: string) => void
}) {
  const timeoutHandle = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    copyToClipboard(modelId)
    clearTimeout(timeoutHandle.current)
    timeoutHandle.current = setTimeout(() => {
      setCopied(false)
    }, 1000)
    setCopied(true)
  }, [modelId, copyToClipboard, setCopied])

  return (
    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={copy}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span className="sr-only">Copy Model ID</span>
    </Button>
  )
}
