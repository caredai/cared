'use client'

import { useCallback, useRef, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { CheckIcon, ChevronDown, ChevronUp, CopyIcon, Server } from 'lucide-react'
import NextImage from 'next-image-export-optimizer'
import { useCopyToClipboard } from 'react-use'

import { splitModelFullId } from '@mindworld/providers'
import { Button } from '@mindworld/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@mindworld/ui/components/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@mindworld/ui/components/collapsible'

import { useTRPC } from '@/trpc/client'

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

  // Safely check if models of a specific type exist for a provider
  const hasModelsForProvider = (
    providerId: string,
    modelType: 'language' | 'text-embedding' | 'image',
  ) => {
    return (
      modelsData.models[modelType]?.some((model) => model.id.startsWith(`${providerId}:`)) ?? false
    )
  }

  // Get models of a specific type for a provider
  const getModelsForProvider = (
    providerId: string,
    modelType: 'language' | 'text-embedding' | 'image',
  ) => {
    return (
      modelsData.models[modelType]?.filter((model) => model.id.startsWith(`${providerId}:`)) ?? []
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight truncate">Model Management</h1>
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
                <CardTitle className="flex items-center gap-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-sm">
                    <NextImage
                      src={`/images/providers/${provider.icon}`}
                      alt={`${provider.name} logo`}
                      unoptimized={true}
                      width={40}
                      height={40}
                      className="object-contain"
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
                <CardDescription>Provider ID: {provider.id}</CardDescription>
              </CardHeader>
              <CardContent className="min-h-10">
                <p className="text-sm text-muted-foreground">{provider.description}</p>
              </CardContent>
              <CardFooter>
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
                        {getModelsForProvider(provider.id, 'language').length +
                          getModelsForProvider(provider.id, 'text-embedding').length +
                          getModelsForProvider(provider.id, 'image').length}{' '}
                        Models
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </CardFooter>
              <CollapsibleContent>
                <div className="px-6 pb-6 pt-2">
                  {/* Language Models */}
                  {hasModelsForProvider(provider.id, 'language') && (
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Language Models</h3>
                      <ul className="space-y-2">
                        {getModelsForProvider(provider.id, 'language').map((model) => {
                          const { modelId } = splitModelFullId(model.id)
                          return (
                            <li key={model.id} className="text-sm p-2 bg-muted rounded-md">
                              <div className="font-medium">{model.name}</div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <span>{modelId}</span>
                                <CopyModelId modelId={model.id} copyToClipboard={copyToClipboard} />
                              </div>
                              {model.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {model.description}
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Text Embedding Models */}
                  {hasModelsForProvider(provider.id, 'text-embedding') && (
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Text Embedding Models</h3>
                      <ul className="space-y-2">
                        {getModelsForProvider(provider.id, 'text-embedding').map((model) => {
                          const { modelId } = splitModelFullId(model.id)
                          return (
                            <li key={model.id} className="text-sm p-2 bg-muted rounded-md">
                              <div className="font-medium">{model.name}</div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <span>{modelId}</span>
                                <CopyModelId modelId={model.id} copyToClipboard={copyToClipboard} />
                              </div>
                              {model.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {model.description}
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Image Models */}
                  {hasModelsForProvider(provider.id, 'image') && (
                    <div>
                      <h3 className="font-medium mb-2">Image Models</h3>
                      <ul className="space-y-2">
                        {getModelsForProvider(provider.id, 'image').map((model) => {
                          const { modelId } = splitModelFullId(model.id)
                          return (
                            <li key={model.id} className="text-sm p-2 bg-muted rounded-md">
                              <div className="font-medium">{model.name}</div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <span>{modelId}</span>
                                <CopyModelId modelId={model.id} copyToClipboard={copyToClipboard} />
                              </div>
                              {model.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {model.description}
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* No models available */}
                  {!hasModelsForProvider(provider.id, 'language') &&
                    !hasModelsForProvider(provider.id, 'text-embedding') &&
                    !hasModelsForProvider(provider.id, 'image') && (
                      <p className="text-sm text-muted-foreground">
                        No models available for this provider
                      </p>
                    )}
                </div>
              </CollapsibleContent>
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
