import { useCallback, useMemo, useRef, useState } from 'react'
import { FoldVertical, UnfoldVertical } from 'lucide-react'

import { languageModelV2PromptSchema } from '@cared/api/types'
import { Button } from '@cared/ui/components/button'
import { Skeleton } from '@cared/ui/components/skeleton'
import { cn } from '@cared/ui/lib/utils'

import type { JsonTableRow } from './PrettyJsonTable'
import type { ExpandedState } from '@tanstack/react-table'
import { copyTextToClipboard } from '@/lib/clipboard'
import { deepParseJson } from '@/lib/json'
import { containsAnyMarkdown, StringOrMarkdownSchema } from '@/lib/MarkdownSchema'
import { JSONView, stringifyJsonNode } from './JsonView'
import { MarkdownJsonViewHeader } from './MarkdownJsonView'
import { MarkdownView } from './MarkdownView'
import {
  convertRowIdToKeyPath,
  generateChildRows,
  getRowChildren,
  getValueType,
  hasChildren,
  PrettyJsonTable,
  transformJsonToTableData,
} from './PrettyJsonTable'

type CustomExpandedState = ExpandedState | false

// Constants for smart expansion logic
const DEFAULT_MAX_ROWS = 20
const DEEPEST_DEFAULT_EXPANSION_LEVEL = 10

const ASSISTANT_TITLES = ['assistant', 'Output', 'model']
const SYSTEM_TITLES = ['system', 'Input']

const PREVIEW_TEXT_CLASSES = 'italic text-gray-500 dark:text-gray-400'

function getEmptyValueDisplay(value: unknown): string | null {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (value === '') return 'empty string'
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
    return 'empty object'
  }
  return null
}

function getContainerClasses(
  title: string | undefined,
  scrollable: boolean | undefined,
  codeClassName: string | undefined,
  baseClasses = 'whitespace-pre-wrap break-words p-3 text-xs',
) {
  return cn(
    baseClasses,
    ASSISTANT_TITLES.includes(title || '')
      ? 'bg-green-50 dark:bg-green-50/5 dark:border-green-600'
      : '',
    SYSTEM_TITLES.includes(title || '') ? 'bg-primary-foreground' : '',
    scrollable ? '' : 'rounded-sm border',
    codeClassName,
  )
}

function isMarkdownContent(json: unknown): {
  isMarkdown: boolean
  content?: string
} {
  if (typeof json === 'string') {
    const markdownResult = StringOrMarkdownSchema.safeParse(json)
    if (markdownResult.success) {
      return { isMarkdown: true, content: json }
    }
  }

  // also render as MD if object has one key and the value is a markdown like string
  if (
    typeof json === 'object' &&
    json !== null &&
    !Array.isArray(json) &&
    json.constructor === Object
  ) {
    const entries = Object.entries(json)
    if (entries.length === 1) {
      const [, value] = entries[0]!
      if (typeof value === 'string') {
        if (containsAnyMarkdown(value)) {
          return { isMarkdown: true, content: value }
        }
      }
    }
  }

  return { isMarkdown: false }
}

function isModelPromptFormat(json: unknown): boolean {
  if (!json || typeof json !== 'object') return false

  if (Array.isArray(json)) {
    const directArray = languageModelV2PromptSchema.safeParse(json)
    if (directArray.success) {
      // had some false positives, so we really check for role/content to validate ChatML
      const hasRoleOrContent = json.some(
        (item) =>
          typeof item === 'object' && item !== null && ('role' in item || 'content' in item),
      )
      return hasRoleOrContent
    }
  }

  if ('messages' in json && Array.isArray((json as any).messages)) {
    const messagesArray = languageModelV2PromptSchema.safeParse((json as any).messages)
    if (messagesArray.success) return true
  }

  if (Array.isArray(json) && json.length === 1 && Array.isArray(json[0])) {
    const nestedArray = languageModelV2PromptSchema.safeParse(json[0])
    if (nestedArray.success) return true
  }

  return false
}

function findOptimalExpansionLevel(data: JsonTableRow[], maxRows: number): number {
  if (data.length > maxRows) {
    return 0
  }

  function findOptimalRecursively(
    rows: JsonTableRow[],
    currentLevel: number,
    cumulativeCount: number,
    visitedData = new WeakSet(),
  ): number {
    const rowsAtThisLevel = rows.length
    const newCumulativeCount = cumulativeCount + rowsAtThisLevel

    // If expanding to this level exceeds maxRows, return previous level
    if (newCumulativeCount > maxRows) {
      return currentLevel - 1
    }

    if (currentLevel >= DEEPEST_DEFAULT_EXPANSION_LEVEL) {
      return currentLevel
    }

    // Get all children for next level
    const childRows: JsonTableRow[] = []

    for (const row of rows) {
      if (row.hasChildren && row.rawChildData) {
        if (typeof row.rawChildData !== 'object') {
          continue // Skip non-objects
        }

        // Skip if we've already processed this exact data to prevent cycles
        if (visitedData.has(row.rawChildData)) {
          continue
        }

        // Mark data as visited
        visitedData.add(row.rawChildData)

        const children = getRowChildren(row)
        childRows.push(...children)
      }
    }

    if (childRows.length === 0) {
      return currentLevel
    }

    return findOptimalRecursively(childRows, currentLevel + 1, newCumulativeCount, visitedData)
  }

  return Math.max(0, findOptimalRecursively(data, 0, 0))
}

export function PrettyJsonView(props: {
  json?: unknown
  title?: string
  className?: string
  isLoading?: boolean
  codeClassName?: string
  collapseStringsAfterLength?: number | null
  scrollable?: boolean
  controlButtons?: React.ReactNode
  currentView?: 'pretty' | 'json'
  externalExpansionState?: Record<string, boolean> | boolean
  onExternalExpansionChange?: (expansion: Record<string, boolean> | boolean) => void
}) {
  const jsonDependency = useMemo(
    () => (typeof props.json === 'string' ? props.json : JSON.stringify(props.json)),
    [props.json],
  )

  const parsedJson = useMemo(() => {
    return deepParseJson(props.json)
    // We want to use jsonDependency as dep because it's more stable than props.json
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonDependency])

  const actualCurrentView = props.currentView ?? 'pretty'
  const expandAllRef = useRef<(() => void) | null>(null)
  const [allRowsExpanded, setAllRowsExpanded] = useState(false)
  const [jsonIsCollapsed, setJsonIsCollapsed] = useState(false)
  const [expandedRowsWithChildren, setExpandedRowsWithChildren] = useState<Set<string>>(new Set())
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set())
  const [, setForceUpdate] = useState(0)

  // View's own state, lower precedence than optionally supplied external expansion state
  const [internalExpansionState, setInternalExpansionState] = useState<CustomExpandedState>({})

  const isModelPrompt = useMemo(() => isModelPromptFormat(parsedJson), [parsedJson])
  const { isMarkdown, content: markdownContent } = useMemo(
    () => isMarkdownContent(parsedJson),
    [parsedJson],
  )

  const baseTableData = useMemo(() => {
    try {
      if (
        actualCurrentView === 'pretty' &&
        parsedJson !== null &&
        parsedJson !== undefined &&
        !isModelPrompt &&
        !isMarkdown
      ) {
        // early abort check for smart expansion
        if (parsedJson.constructor === Object) {
          const topLevelKeys = Object.keys(parsedJson as Record<string, unknown>)
          if (topLevelKeys.length > DEFAULT_MAX_ROWS) {
            // return empty array to skip expansion directly
            return []
          }
        }

        // lazy load JSON data, generate only top-level rows initially; children on expand
        const createTopLevelRows = (obj: Record<string, unknown>): JsonTableRow[] => {
          const entries = Object.entries(obj)
          const rows: JsonTableRow[] = []

          entries.forEach(([key, value]) => {
            const valueType = getValueType(value)
            const childrenExist = hasChildren(value, valueType)

            const row: JsonTableRow = {
              id: key,
              key,
              value,
              type: valueType,
              hasChildren: childrenExist,
              level: 0,
              childrenGenerated: false,
            }

            if (childrenExist) {
              row.rawChildData = value
              row.subRows = [] // empty initially for lazy loading
            }
            rows.push(row)
          })
          return rows
        }

        // top-level is an object, start with its properties directly
        if (parsedJson.constructor === Object) {
          return createTopLevelRows(parsedJson as Record<string, unknown>)
        }

        return transformJsonToTableData(parsedJson, '', 0, '', true)
      }
      return []
    } catch (error) {
      console.error('Error transforming JSON to table data:', error)
      return []
    }
  }, [parsedJson, isModelPrompt, isMarkdown, actualCurrentView])

  // state precedence: external state before smart expansion
  const finalExpansionState: ExpandedState = useMemo(() => {
    if (baseTableData.length === 0) return {}

    if (props.externalExpansionState === false) {
      // user collapsed all
      return {}
    }
    if (props.externalExpansionState === true) {
      // user expanded all
      return true
    }
    if (
      typeof props.externalExpansionState === 'object' &&
      Object.keys(props.externalExpansionState).length > 0
    ) {
      // user set specific expansions
      return props.externalExpansionState
    }

    // No external state -> use smart expansion
    const optimalLevel = findOptimalExpansionLevel(baseTableData, DEFAULT_MAX_ROWS)

    if (optimalLevel > 0) {
      const smartExpanded: ExpandedState = {}
      const expandRowsToLevel = (rows: JsonTableRow[], currentLevel: number) => {
        rows.forEach((row) => {
          if (row.hasChildren && currentLevel < optimalLevel) {
            const keyPath = convertRowIdToKeyPath(row.id)
            smartExpanded[keyPath] = true

            const children = getRowChildren(row)
            if (children.length > 0) {
              expandRowsToLevel(children, currentLevel + 1)
            }
          }
        })
      }
      expandRowsToLevel(baseTableData, 0)
      return smartExpanded
    }

    return {}
  }, [baseTableData, props.externalExpansionState])

  // actual expansion state used by the table (combines initial + user changes)
  const actualExpansionState = useMemo(() => {
    if (finalExpansionState === true) return true

    // Ensure both states are objects with fallback
    const finalState = finalExpansionState
    const internalState = internalExpansionState || {}

    // Smart expansion only applies on initial load (when no user interactions yet)
    if (Object.keys(internalState).length > 0) {
      // user made changes, use them
      return internalState
    } else if (internalExpansionState === false) {
      // user collapsed all
      return false
    } else {
      return finalState
    }
  }, [finalExpansionState, internalExpansionState])

  // table data with lazy-loaded children
  const tableData = useMemo(() => {
    const updateRowWithChildren = (rows: JsonTableRow[]): JsonTableRow[] => {
      return rows.map((row) => {
        let updatedRow = row

        // Generate children if:
        // 1. Row is in expandedRowsWithChildren (user clicked lazy loading), OR
        // 2. Row should be expanded according to actualExpansionState (smart expansion)
        const keyPath = convertRowIdToKeyPath(row.id)
        const shouldHaveChildren =
          expandedRowsWithChildren.has(row.id) ||
          (actualExpansionState !== true && actualExpansionState && actualExpansionState[keyPath])

        if (shouldHaveChildren && row.rawChildData && !row.childrenGenerated) {
          const children = generateChildRows(row)
          updatedRow = {
            ...row,
            subRows: children,
            childrenGenerated: true,
          }
        }

        if (updatedRow.subRows && updatedRow.subRows.length > 0) {
          updatedRow = {
            ...updatedRow,
            subRows: updateRowWithChildren(updatedRow.subRows),
          }
        }

        return updatedRow
      })
    }

    return updateRowWithChildren(baseTableData)
  }, [baseTableData, expandedRowsWithChildren, actualExpansionState])

  const handleLazyLoadChildren = useCallback((rowId: string) => {
    setExpandedRowsWithChildren((prev) => {
      const newSet = new Set(prev)
      // we track the IDs for batch updates when lazy loading children
      if (rowId.includes(',')) {
        rowId.split(',').forEach((id) => newSet.add(id))
      } else {
        newSet.add(rowId)
      }

      return newSet
    })
  }, [])

  const handleForceUpdate = useCallback(() => {
    setForceUpdate((prev) => prev + 1)
  }, [])

  const toggleCellExpansion = useCallback((cellId: string) => {
    setExpandedCells((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(cellId)) {
        newSet.delete(cellId)
      } else {
        newSet.add(cellId)
      }
      return newSet
    })
  }, [])

  const { onExternalExpansionChange } = props
  const handleTableExpandedChange = useCallback(
    (updater: ExpandedState | ((prev: ExpandedState) => ExpandedState) | boolean) => {
      // always update internal state of the table
      let newState: ExpandedState
      if (typeof updater === 'function') {
        newState = updater(actualExpansionState === false ? {} : actualExpansionState)
        const finalState: CustomExpandedState =
          typeof newState === 'object' && Object.keys(newState).length === 0 ? false : newState
        setInternalExpansionState(finalState)

        // update external state if state changed by user (callback provided)
        if (onExternalExpansionChange) {
          if (typeof newState === 'boolean') {
            onExternalExpansionChange(newState)
            return
          }

          const keyBasedState = Object.fromEntries(
            Object.entries(newState).filter(([, expanded]) => expanded),
          )

          // user collapsed all items -> set state to false (instead of empty object)
          const finalExternalState = Object.keys(keyBasedState).length === 0 ? false : keyBasedState
          onExternalExpansionChange(finalExternalState)
        }
      } else if (typeof updater !== 'boolean') {
        newState = updater
        const finalState: CustomExpandedState =
          typeof newState === 'object' && Object.keys(newState).length === 0 ? false : newState
        setInternalExpansionState(finalState)

        // Handle external state updates for expand/collapse all button
        if (onExternalExpansionChange && typeof newState === 'object') {
          if (Object.keys(newState).length === 0) {
            // user collapsed all
            onExternalExpansionChange(false)
          } else {
            onExternalExpansionChange(newState)
          }
        }
      }
    },
    [onExternalExpansionChange, actualExpansionState],
  )

  const handleOnCopy = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault()
    }
    const textToCopy = stringifyJsonNode(parsedJson)
    void copyTextToClipboard(textToCopy)

    if (event) {
      event.currentTarget.focus()
    }
  }

  const handleJsonToggleCollapse = () => {
    setJsonIsCollapsed(!jsonIsCollapsed)
  }

  const emptyValueDisplay = getEmptyValueDisplay(parsedJson)
  const isPrettyView = actualCurrentView === 'pretty'
  const isMarkdownMode = isMarkdown && isPrettyView
  const shouldUseTableView = isPrettyView && !isModelPrompt && !isMarkdown && !emptyValueDisplay

  const getBackgroundColorClass = () =>
    cn(
      ASSISTANT_TITLES.includes(props.title || '') ? 'bg-green-50' : '',
      SYSTEM_TITLES.includes(props.title || '') ? 'bg-primary-foreground' : '',
    )

  const body = (
    <>
      {emptyValueDisplay && isPrettyView ? (
        <div
          className={cn(
            'flex items-center',
            getContainerClasses(props.title, props.scrollable, props.codeClassName),
          )}
        >
          {props.isLoading ? (
            <Skeleton className="h-3 w-3/4" />
          ) : (
            <span className={`font-mono ${PREVIEW_TEXT_CLASSES}`}>{emptyValueDisplay}</span>
          )}
        </div>
      ) : isMarkdownMode ? (
        props.isLoading ? (
          <Skeleton className="h-3 w-3/4" />
        ) : (
          <MarkdownView markdown={markdownContent || ''} />
        )
      ) : (
        <>
          {/* Always render JsonPrettyTable to preserve internal React Table state */}
          <div
            className={getContainerClasses(
              props.title,
              props.scrollable,
              props.codeClassName,
              'flex whitespace-pre-wrap break-words text-xs',
            )}
            style={{ display: shouldUseTableView ? 'flex' : 'none' }}
          >
            {props.isLoading ? (
              <Skeleton className="m-3 h-3 w-3/4" />
            ) : (
              <PrettyJsonTable
                data={tableData}
                expandAllRef={expandAllRef}
                onExpandStateChange={setAllRowsExpanded}
                noBorder={true}
                expanded={actualExpansionState === false ? {} : actualExpansionState}
                onExpandedChange={handleTableExpandedChange}
                onLazyLoadChildren={handleLazyLoadChildren}
                onForceUpdate={handleForceUpdate}
                smartDefaultsLevel={null}
                expandedCells={expandedCells}
                toggleCellExpansion={toggleCellExpansion}
              />
            )}
          </div>

          {/* Always render JSONView to preserve its state too */}
          <div style={{ display: shouldUseTableView ? 'none' : 'block' }}>
            <JSONView
              json={props.json}
              title={props.title} // Title value used for background styling
              hideTitle={true} // But hide the title, we display it
              className=""
              isLoading={props.isLoading}
              codeClassName={props.codeClassName}
              collapseStringsAfterLength={props.collapseStringsAfterLength}
              scrollable={props.scrollable}
              externalJsonCollapsed={jsonIsCollapsed}
              onToggleCollapse={handleJsonToggleCollapse}
            />
          </div>
        </>
      )}
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
      {props.title ? (
        <MarkdownJsonViewHeader
          title={props.title}
          canEnableMarkdown={false}
          handleOnCopy={handleOnCopy}
          controlButtons={
            <>
              {props.controlButtons}
              {shouldUseTableView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => expandAllRef.current?.()}
                  className="-mr-2 hover:bg-border h-6 w-6"
                  title={allRowsExpanded ? 'Collapse all rows' : 'Expand all rows'}
                >
                  {allRowsExpanded ? (
                    <FoldVertical className="h-3! w-3!" />
                  ) : (
                    <UnfoldVertical className="h-3! w-3!" />
                  )}
                </Button>
              )}
              {!isPrettyView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleJsonToggleCollapse}
                  className="-mr-2 hover:bg-border h-6 w-6"
                  title={jsonIsCollapsed ? 'Expand all' : 'Collapse all'}
                >
                  {jsonIsCollapsed ? (
                    <UnfoldVertical className="h-3! w-3!" />
                  ) : (
                    <FoldVertical className="h-3! w-3!" />
                  )}
                </Button>
              )}
            </>
          }
        />
      ) : null}
      {props.scrollable ? (
        <div
          className={cn(
            'flex h-full min-h-0 overflow-hidden',
            isMarkdownMode ? getBackgroundColorClass() : 'rounded-sm border',
          )}
        >
          <div className="max-h-full min-h-0 w-full overflow-y-auto">{body}</div>
        </div>
      ) : isMarkdownMode ? (
        <div className={getBackgroundColorClass()}>{body}</div>
      ) : (
        body
      )}
    </div>
  )
}
