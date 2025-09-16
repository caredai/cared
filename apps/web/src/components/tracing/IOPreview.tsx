import type { JSONValue } from 'ai'
import { Fragment, useMemo, useState } from 'react'
import { atom, useAtom } from 'jotai'

import { languageModelV2MessageSchema } from '@cared/api/types'
import { Button } from '@cared/ui/components/button'
import { Tabs, TabsList, TabsTrigger } from '@cared/ui/components/tabs'
import { cn } from '@cared/ui/lib/utils'

import type { LanguageModelV2Message } from '@ai-sdk/provider'
import { SubHeaderLabel } from '@/components/layout/header'
import { deepParseJson } from '@/lib/json'
import { MarkdownJsonView } from './MarkdownJsonView'
import { PrettyJsonView } from './PrettyJsonView'

const localCurrentViewAtom = atom<'pretty' | 'json'>('pretty')

type LanguageModelV2MessageExtra = LanguageModelV2Message & {
  json?: unknown
}

export const IOPreview: React.FC<{
  input?: JSONValue
  output?: JSONValue
  isLoading?: boolean
  hideIfNull?: boolean
  hideOutput?: boolean
  hideInput?: boolean
  currentView?: 'pretty' | 'json'
  inputExpansionState?: Record<string, boolean> | boolean
  outputExpansionState?: Record<string, boolean> | boolean
  onInputExpansionChange?: (expansion: Record<string, boolean> | boolean) => void
  onOutputExpansionChange?: (expansion: Record<string, boolean> | boolean) => void
}> = ({
  isLoading = false,
  hideIfNull = false,
  hideOutput = false,
  hideInput = false,
  currentView,
  inputExpansionState,
  outputExpansionState,
  onInputExpansionChange,
  onOutputExpansionChange,
  ...props
}) => {
  const [localCurrentView, setLocalCurrentView] = useAtom(localCurrentViewAtom)
  const selectedView = currentView ?? localCurrentView
  const input = deepParseJson(props.input)
  const output = deepParseJson(props.output)
  const outputClean = props.output

  // ChatML format
  const inChatMlArray = safeParseModelMessages(input)
  const outChatMlArray = safeParseModelMessages(Array.isArray(output) ? output : [output])

  // If there are additional input fields beyond the messages, render them
  const additionalInput =
    typeof input === 'object' && input !== null && !Array.isArray(input)
      ? Object.fromEntries(Object.entries(input).filter(([key]) => key !== 'messages'))
      : undefined

  // default I/O
  return (
    <>
      {!currentView ? (
        <div className="flex w-full flex-row justify-start">
          <Tabs
            className="h-fit py-0.5"
            value={selectedView}
            onValueChange={(value) => {
              setLocalCurrentView(value as 'pretty' | 'json')
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
        </div>
      ) : null}
      {/* Always render components to preserve state, just hide via CSS*/}
      {/* Pretty view content */}
      <div style={{ display: selectedView === 'pretty' ? 'block' : 'none' }}>
        {inChatMlArray.success ? (
          <ModelMessageView
            messages={[
              ...inChatMlArray.data,
              ...(outChatMlArray.success
                ? outChatMlArray.data
                : [
                    {
                      role: 'assistant' as const,
                      ...(typeof outputClean === 'string'
                        ? { content: [{ type: 'text' as const, text: outputClean }] }
                        : { content: [], json: outputClean }),
                    },
                  ]),
            ]}
            shouldRenderMarkdown
            additionalInput={
              Object.keys(additionalInput ?? {}).length > 0 ? additionalInput : undefined
            }
            currentView={selectedView}
          />
        ) : (
          <>
            {!(hideIfNull && !input) && !hideInput ? (
              <PrettyJsonView
                title="Input"
                json={input ?? null}
                isLoading={isLoading}
                currentView={selectedView}
                externalExpansionState={inputExpansionState}
                onExternalExpansionChange={onInputExpansionChange}
              />
            ) : null}
            {!(hideIfNull && !output) && !hideOutput ? (
              <PrettyJsonView
                title="Output"
                json={outputClean}
                isLoading={isLoading}
                currentView={selectedView}
                externalExpansionState={outputExpansionState}
                onExternalExpansionChange={onOutputExpansionChange}
              />
            ) : null}
          </>
        )}
      </div>

      {/* JSON view content */}
      <div style={{ display: selectedView === 'json' ? 'block' : 'none' }}>
        {!(hideIfNull && !input) && !hideInput ? (
          <PrettyJsonView
            title="Input"
            json={input ?? null}
            isLoading={isLoading}
            currentView={selectedView}
            externalExpansionState={inputExpansionState}
            onExternalExpansionChange={onInputExpansionChange}
          />
        ) : null}
        {!(hideIfNull && !output) && !hideOutput ? (
          <PrettyJsonView
            title="Output"
            json={outputClean}
            isLoading={isLoading}
            currentView={selectedView}
            externalExpansionState={outputExpansionState}
            onExternalExpansionChange={onOutputExpansionChange}
          />
        ) : null}
      </div>
    </>
  )
}

export const ModelMessageView: React.FC<{
  messages: LanguageModelV2MessageExtra[]
  title?: string
  shouldRenderMarkdown?: boolean
  collapseLongHistory?: boolean
  additionalInput?: Record<string, unknown>
  projectIdForPromptButtons?: string
  currentView?: 'pretty' | 'json'
}> = ({
  title,
  messages,
  shouldRenderMarkdown = false,
  collapseLongHistory = true,
  additionalInput,
  currentView = 'json',
}) => {
  const COLLAPSE_THRESHOLD = 3
  const [isCollapsed, setCollapsed] = useState(
    collapseLongHistory && messages.length > COLLAPSE_THRESHOLD ? true : null,
  )

  const shouldRenderContent = (message: LanguageModelV2MessageExtra) => {
    return typeof message.content === 'string' ? !!message.content : !!message.content.length
  }

  const shouldRenderJson = (message: LanguageModelV2MessageExtra) => {
    return !!message.json
  }

  const messagesToRender = useMemo(
    () => messages.filter((message) => shouldRenderContent(message) || shouldRenderJson(message)),
    [messages],
  )

  return (
    <div className="flex max-h-full min-h-0 flex-col gap-2">
      {title && <SubHeaderLabel title={title} className="mt-1" />}
      <div className="flex max-h-full min-h-0 flex-col gap-2">
        <div className="flex flex-col gap-2">
          {messagesToRender
            .filter(
              (_, i) =>
                // show all if not collapsed or null; show first and last n if collapsed
                !isCollapsed || i == 0 || i > messagesToRender.length - COLLAPSE_THRESHOLD,
            )
            .map((message, index) => (
              <Fragment key={index}>
                {shouldRenderContent(message) && (
                  <>
                    <div
                      style={{
                        display: shouldRenderMarkdown ? 'block' : 'none',
                      }}
                    >
                      <MarkdownJsonView
                        message={message}
                        className={cn(!!message.json && 'rounded-b-none')}
                        customCodeHeaderClassName={cn(
                          message.role === 'assistant' && 'bg-secondary',
                          message.role === 'system' && 'bg-primary-foreground',
                        )}
                      />
                    </div>
                    <div
                      style={{
                        display: shouldRenderMarkdown ? 'none' : 'block',
                      }}
                    >
                      <PrettyJsonView
                        title={message.role}
                        json={message.content}
                        className={cn(!!message.json && 'rounded-b-none')}
                        currentView={currentView}
                      />
                    </div>
                  </>
                )}
                {shouldRenderJson(message) && (
                  <PrettyJsonView
                    title={shouldRenderContent(message) ? undefined : message.role}
                    json={message.json}
                    className={cn(!!message.content && 'rounded-t-none border-t-0')}
                    currentView={shouldRenderMarkdown ? 'pretty' : 'json'}
                  />
                )}
                {isCollapsed !== null &&
                index === 0 &&
                messagesToRender.length - COLLAPSE_THRESHOLD > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 px-1 rounded-sm"
                    onClick={() => setCollapsed((v) => !v)}
                  >
                    {isCollapsed
                      ? `Show ${messagesToRender.length - COLLAPSE_THRESHOLD} more ...`
                      : 'Hide history'}
                  </Button>
                ) : null}
              </Fragment>
            ))}
        </div>
        {additionalInput && (
          <PrettyJsonView
            title="Additional Input"
            json={additionalInput}
            currentView={shouldRenderMarkdown ? 'pretty' : 'json'}
          />
        )}
      </div>
    </div>
  )
}

function safeParseModelMessage(message: unknown):
  | {
      success: true
      data: LanguageModelV2MessageExtra
    }
  | {
      success: false
      data?: never
    } {
  const result = languageModelV2MessageSchema.safeParse(message)
  if (!result.success) {
    return {
      success: false,
    }
  }
  const { providerOptions: _, ...data } = result.data
  const { role: __, content: ___, ...json } = message as any
  return {
    success: true,
    data: {
      ...data,
      ...(Object.keys(json).length > 0 && { json }),
    },
  }
}

function safeParseModelMessages(message: unknown):
  | {
      success: true
      data: LanguageModelV2MessageExtra[]
    }
  | {
      success: false
      data?: never
    } {
  if (!Array.isArray(message)) {
    return {
      success: false,
    }
  }
  const parsed = []
  for (const m of message) {
    const { success, data } = safeParseModelMessage(m)
    if (!success) {
      return {
        success: false,
      }
    }
    parsed.push(data)
  }
  return {
    success: true,
    data: parsed,
  }
}
