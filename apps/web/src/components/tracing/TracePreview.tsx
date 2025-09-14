'use client'

import { useState } from 'react'
import { formatDistance } from 'date-fns'
import { Check, Copy, InfoIcon } from 'lucide-react'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { Tabs, TabsList, TabsTrigger } from '@cared/ui/components/tabs'

import type { ObservationsView, TraceWithDetails } from '@langfuse/core'
import {
  Tabs as TabsBar,
  TabsContent as TabsBarContent,
  TabsList as TabsBarList,
  TabsTrigger as TabsBarTrigger,
} from '@/components/tabs'
import { IOPreview } from './IOPreview'
import { PrettyJsonView } from './PrettyJsonView'

export function TracePreview({
  trace,
  observations,
}: {
  trace: TraceWithDetails
  observations: ObservationsView[]
}) {
  const [copied, setCopied] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'preview' | 'observations'>('preview')
  const [currentView, setCurrentView] = useState<'pretty' | 'json'>('pretty')

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const copyTraceId = () => {
    void copyToClipboard(trace.id)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Trace Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
              TRACE
            </Badge>
            <span className="font-medium">{trace.name}</span>
            <Button variant="ghost" size="sm" onClick={copyTraceId} className="h-6 px-2">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mb-2">
            {formatDistance(new Date(trace.timestamp), new Date(), { addSuffix: true })}
            <span className="mx-2">•</span>
            {new Date(trace.timestamp).toLocaleString()}
          </div>

          <div className="flex flex-wrap gap-2">
            {trace.sessionId && <Badge variant="outline">Session: {trace.sessionId}</Badge>}
            {trace.userId && <Badge variant="outline">User: {trace.userId}</Badge>}
            {trace.environment && <Badge variant="outline">Env: {trace.environment}</Badge>}
            {trace.latency && <Badge variant="outline">Latency: {trace.latency.toFixed(2)}s</Badge>}
            {trace.totalCost && trace.totalCost > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <span>Cost: ${trace.totalCost.toFixed(4)}</span>
                <InfoIcon className="h-3 w-3" />
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <TabsBar
        value={selectedTab}
        onValueChange={(value) => setSelectedTab(value as 'preview' | 'observations')}
        className="min-h-0 flex-1 flex flex-col"
      >
        <TabsBarList>
          <TabsBarTrigger value="preview">Preview</TabsBarTrigger>
          <TabsBarTrigger value="observations">Observations ({observations.length})</TabsBarTrigger>

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
              {trace.input && trace.output ? (
                <IOPreview
                  input={trace.input as any}
                  output={trace.output as any}
                  currentView={currentView}
                />
              ) : null}
            </div>

            {/* Metadata */}
            {trace.metadata ? (
              <PrettyJsonView title="Metadata" json={trace.metadata} currentView={currentView} />
            ) : null}
          </div>
        </TabsBarContent>

        <TabsBarContent value="observations" className="flex-1 mt-4">
          <div className="space-y-2">
            {observations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No observations found</div>
            ) : (
              observations.map((obs) => (
                <div
                  key={obs.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {obs.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {obs.level}
                      </Badge>
                      <span className="font-medium text-sm">{obs.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistance(new Date(obs.startTime), new Date(), { addSuffix: true })}
                    </div>
                  </div>

                  {obs.latency && (
                    <div className="text-xs text-muted-foreground">
                      Latency: {obs.latency.toFixed(2)}s
                    </div>
                  )}

                  {obs.costDetails?.total && (
                    <div className="text-xs text-muted-foreground">
                      Cost: ${obs.costDetails.total.toFixed(4)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsBarContent>
      </TabsBar>
    </div>
  )
}
