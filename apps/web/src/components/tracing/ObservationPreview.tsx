'use client'

import type { JSONValue } from 'ai'
import { useMemo, useState } from 'react'
import { formatDistance } from 'date-fns'
import { Check, Copy, InfoIcon } from 'lucide-react'

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

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'GENERATION':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'SPAN':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EVENT':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'TOOL':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'RETRIEVER':
        return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'EMBEDDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Observation Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={cn('text-xs', getNodeTypeColor(observation.type))}>
              {observation.type}
            </Badge>
            <Badge variant="outline" className={cn('text-xs', getLevelColor(observation.level))}>
              {observation.level}
            </Badge>
            <span className="font-medium">{observation.name}</span>
            <Button variant="ghost" size="sm" onClick={copyObservationId} className="h-6 px-2">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mb-2">
            {formatDistance(new Date(observation.startTime), new Date(), { addSuffix: true })}
            <span className="mx-2">•</span>
            {new Date(observation.startTime).toLocaleString()}
          </div>

          <div className="flex flex-wrap gap-2">
            {observation.latency && (
              <Badge variant="outline">Latency: {observation.latency.toFixed(2)}s</Badge>
            )}
            {observation.costDetails?.total && (
              <Badge variant="outline" className="flex items-center gap-1">
                <span>Cost: ${observation.costDetails.total.toFixed(4)}</span>
                <InfoIcon className="h-3 w-3" />
              </Badge>
            )}
            {observation.usageDetails &&
              (observation.usageDetails.input ?? observation.usageDetails.output) && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <span>
                    Tokens: {observation.usageDetails.input ?? 0}i/
                    {observation.usageDetails.output ?? 0}o
                  </span>
                  <InfoIcon className="h-3 w-3" />
                </Badge>
              )}
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <TabsBar
        value={selectedTab}
        onValueChange={(value) => setSelectedTab(value as any)}
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
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Status Message</h4>
                <PrettyJsonView
                  title="Status Message"
                  json={observation.statusMessage}
                  currentView={currentView}
                />
              </div>
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Basic Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{observation.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{observation.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level:</span>
                    <span>{observation.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Time:</span>
                    <span className="text-xs">
                      {new Date(observation.startTime).toLocaleString()}
                    </span>
                  </div>
                  {observation.endTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Time:</span>
                      <span className="text-xs">
                        {new Date(observation.endTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Metrics</h4>
                <div className="space-y-2 text-sm">
                  {observation.latency && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latency:</span>
                      <span>{observation.latency.toFixed(2)}s</span>
                    </div>
                  )}
                  {observation.costDetails?.total && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost:</span>
                      <span>${observation.costDetails.total.toFixed(4)}</span>
                    </div>
                  )}
                  {observation.usageDetails?.input && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Input Tokens:</span>
                      <span>{observation.usageDetails.input}</span>
                    </div>
                  )}
                  {observation.usageDetails?.output && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Output Tokens:</span>
                      <span>{observation.usageDetails.output}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsBarContent>
      </TabsBar>
    </div>
  )
}
