import { useMemo, useState } from 'react'
import { FoldVertical, UnfoldVertical } from 'lucide-react'
import { useTheme } from 'next-themes'
import { default as React18JsonView } from 'react18-json-view'

import { Button } from '@cared/ui/components/button'
import { Skeleton } from '@cared/ui/components/skeleton'
import { cn } from '@cared/ui/lib/utils'

import { copyTextToClipboard } from '@/lib/clipboard'
import { deepParseJson } from '@/lib/json'
import { MarkdownJsonViewHeader } from './MarkdownJsonView'

import 'react18-json-view/src/style.css'
import 'react18-json-view/src/dark.css'

export function JSONView(props: {
  canEnableMarkdown?: boolean
  json?: unknown
  title?: string
  hideTitle?: boolean
  className?: string
  isLoading?: boolean
  codeClassName?: string
  collapseStringsAfterLength?: number | null
  scrollable?: boolean
  controlButtons?: React.ReactNode
  externalJsonCollapsed?: boolean
  onToggleCollapse?: () => void
}) {
  // some users ingest stringified json nested in json, parse it
  const parsedJson = useMemo(() => deepParseJson(props.json), [props.json])
  const { resolvedTheme } = useTheme()
  const [internalCollapsed, setInternalCollapsed] = useState(false)

  const collapseStringsAfterLength =
    props.collapseStringsAfterLength === null
      ? 100_000_000 // if null, show all (100M chars)
      : (props.collapseStringsAfterLength ?? 500)

  const isCollapsed = props.externalJsonCollapsed ?? internalCollapsed

  const handleOnCopy = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault()
    }
    const textToCopy = stringifyJsonNode(parsedJson)
    void copyTextToClipboard(textToCopy)

    // Keep focus on the copy button to prevent focus shifting
    if (event) {
      event.currentTarget.focus()
    }
  }

  const handleToggleCollapse = () => {
    if (props.onToggleCollapse) {
      props.onToggleCollapse()
    } else {
      setInternalCollapsed(!internalCollapsed)
    }
  }

  const body = (
    <>
      <div
        className={cn(
          'flex gap-2 whitespace-pre-wrap break-words p-3 text-xs',
          props.title === 'assistant' || props.title === 'Output'
            ? 'bg-green-50 dark:bg-green-50/5 dark:border-green-600'
            : '',
          props.title === 'system' || props.title === 'Input' ? 'bg-primary-foreground' : '',
          props.scrollable ? '' : 'rounded-sm border',
          props.codeClassName,
        )}
      >
        {props.isLoading ? (
          <Skeleton className="h-3 w-3/4" />
        ) : (
          <React18JsonView
            src={parsedJson}
            theme="github"
            dark={resolvedTheme === 'dark'}
            collapseObjectsAfterLength={isCollapsed ? 0 : 20}
            collapseStringsAfterLength={collapseStringsAfterLength}
            collapseStringMode="word"
            customizeCollapseStringUI={(fullSTring, truncated) =>
              truncated ? (
                <div className="opacity-50">{`\n...expand (${Math.max(fullSTring.length - collapseStringsAfterLength, 0)} more characters)`}</div>
              ) : (
                ''
              )
            }
            displaySize={isCollapsed ? 'collapsed' : 'expanded'}
            matchesURL={true}
            customizeCopy={(node) => stringifyJsonNode(node)}
            className="w-full"
          />
        )}
      </div>
    </>
  )

  return (
    <div
      className={cn(
        'flex max-h-full min-h-0 flex-col',
        props.className,
        props.scrollable ? 'overflow-hidden' : '',
      )}
    >
      {props.title && !props.hideTitle ? (
        <MarkdownJsonViewHeader
          title={props.title}
          canEnableMarkdown={props.canEnableMarkdown ?? false}
          handleOnCopy={handleOnCopy}
          controlButtons={
            <>
              {props.controlButtons}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCollapse}
                className="-mr-2 hover:bg-border w-6 h-6"
                title={isCollapsed ? 'Expand all' : 'Collapse all'}
              >
                {isCollapsed ? (
                  <UnfoldVertical className="h-3 w-3" />
                ) : (
                  <FoldVertical className="h-3 w-3" />
                )}
              </Button>
            </>
          }
        />
      ) : null}
      {props.scrollable ? (
        <div className="flex h-full min-h-0 overflow-hidden rounded-sm border">
          <div className="max-h-full min-h-0 w-full overflow-y-auto">{body}</div>
        </div>
      ) : (
        body
      )}
    </div>
  )
}

// TODO: deduplicate with PrettyJsonView.tsx
export function stringifyJsonNode(node: unknown) {
  // return single string nodes without quotes
  if (typeof node === 'string') {
    return node
  }

  try {
    return JSON.stringify(
      node,
      (_key, value) => {
        switch (typeof value) {
          case 'bigint':
            return String(value) + 'n'
          case 'number':
          case 'boolean':
          case 'object':
          case 'string':
            return value as string
          default:
            return String(value)
        }
      },
      4,
    )
  } catch (error) {
    console.error('JSON stringify error', error)
    return 'Error: JSON.stringify failed'
  }
}
