'use client'

import type { JSONValue } from 'ai'
import { useMemo, useState } from 'react'
import { formatDistance } from 'date-fns'
import { Check, Copy } from 'lucide-react'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { Tabs, TabsList, TabsTrigger } from '@cared/ui/components/tabs'
import { cn } from '@cared/ui/lib/utils'

import type { ObservationsView, TraceWithDetails } from '@langfuse/core'
import {
  Tabs as TabsBar,
  TabsContent as TabsBarContent,
  TabsList as TabsBarList,
  TabsTrigger as TabsBarTrigger,
} from '@/components/tabs'
import { IOPreview } from './IOPreview'
import { ItemBadge } from './ItemBadge'
import { PrettyJsonView } from './PrettyJsonView'

interface ObservationPreviewProps {
  observationId: string
  observations: ObservationsView[]
  trace: TraceWithDetails
}

export function ObservationPreview({
  observationId,
  observations,
  trace: _trace,
}: ObservationPreviewProps) {
  const [copied, setCopied] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'preview' | 'scores'>('preview')
  const [currentView, setCurrentView] = useState<'pretty' | 'json'>('pretty')

  const observation = useMemo(() => {
    return observations.find((obs) => obs.id === observationId)
  }, [observations, observationId])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const copyObservationId = () => {
    void copyToClipboard(observationId)
  }

  if (!observation) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Observation not found
      </div>
    )
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const formatTokenUsage = (input?: number, output?: number, total?: number) => {
    const inputTokens = input ?? 0
    const outputTokens = output ?? 0
    const totalTokens = total ?? 0
    return `${inputTokens} prompt → ${outputTokens} completion (∑ ${totalTokens})`
  }

  // Format duration for display
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Observation Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <ItemBadge type={observation.type as any} showLabel={true} />
            {observation.level !== 'DEFAULT' && (
              <Badge variant="outline" className={cn('text-xs', getLevelColor(observation.level))}>
                {observation.level}
              </Badge>
            )}
            <span className="font-medium">{observation.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyObservationId}
              className="h-6 px-2 gap-1 text-xs"
            >
              <>
                {copied ? <Check className="h-3! w-3!" /> : <Copy className="h-3! w-3!" />}
                ID
              </>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            {formatDistance(new Date(observation.startTime), new Date(), { addSuffix: true })}
            <span className="mx-1">•</span>
            {new Date(observation.startTime).toLocaleString()}
          </div>

          <div className="flex flex-wrap gap-2">
            {typeof observation.latency === 'number' && (
              <Badge variant="outline">Latency: {formatDuration(observation.latency)}</Badge>
            )}

            {/* Time to first token */}
            {typeof observation.timeToFirstToken === 'number' && (
              <Badge variant="outline">
                Time to first token: {formatDuration(observation.timeToFirstToken)}
              </Badge>
            )}

            {observation.type === 'GENERATION' && (
              <>
                {observation.costDetails?.total && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span>Cost: ${observation.costDetails.total.toFixed(6)}</span>
                  </Badge>
                )}
                {typeof observation.usageDetails?.total === 'number' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span>
                      {formatTokenUsage(
                        observation.usageDetails.input,
                        observation.usageDetails.output,
                        observation.usageDetails.total,
                      )}
                    </span>
                  </Badge>
                )}
              </>
            )}

            {/* Model information */}
            {observation.model && <Badge>{observation.model}</Badge>}

            {/* Model parameters */}
            {observation.modelParameters && typeof observation.modelParameters === 'object' && (
              <>
                {Object.entries(observation.modelParameters)
                  .filter(([_, value]) => value != null)
                  .map(([key, value]) => {
                    const valueString =
                      typeof value === 'object' ? JSON.stringify(value) : String(value)
                    return (
                      <Badge
                        variant="outline"
                        key={key}
                        className="h-6 max-w-md"
                        title={`${key}: ${valueString}`}
                      >
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                          {key}: {valueString}
                        </span>
                      </Badge>
                    )
                  })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <TabsBar
        value={selectedTab}
        onValueChange={(value) => setSelectedTab(value as 'preview' | 'scores')}
        className="min-h-0 flex-1 flex flex-col"
      >
        <TabsBarList>
          <TabsBarTrigger value="preview">Preview</TabsBarTrigger>
          <TabsBarTrigger value="scores">Scores</TabsBarTrigger>

          {selectedTab.includes('preview') && (
            <Tabs
              className="ml-auto h-fit"
              value={currentView}
              onValueChange={(value) => {
                setCurrentView(value as 'pretty' | 'json')
              }}
            >
              <TabsList className="h-fit py-0.5">
                <TabsTrigger value="pretty" className="h-fit px-1 text-xs">
                  Formatted
                </TabsTrigger>
                <TabsTrigger value="json" className="h-fit px-1 text-xs">
                  JSON
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </TabsBarList>

        <TabsBarContent value="preview" className="min-h-0 flex-1 flex flex-col">
          <div className="mb-2 flex max-h-full min-h-0 w-full flex-col gap-2 overflow-y-auto">
            {/* Input/Output */}
            <div className="space-y-2">
              <IOPreview
                input={observation.input as JSONValue}
                output={observation.output as JSONValue}
                currentView={currentView}
              />
            </div>

            {/* Status Message */}
            {observation.statusMessage ? (
              <PrettyJsonView
                title="Status Message"
                json={observation.statusMessage}
                currentView={currentView}
              />
            ) : null}

            {/* Metadata */}
            {observation.metadata ? (
              <PrettyJsonView
                title="Metadata"
                json={observation.metadata}
                currentView={currentView}
              />
            ) : null}
          </div>
        </TabsBarContent>

        <TabsBarContent value="scores" className="flex-1 mt-4">
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Coming Soon</div>
              <div className="text-sm">This feature is under development</div>
            </div>
          </div>
        </TabsBarContent>
      </TabsBar>
    </div>
  )
}
