import type { VirtualizerHandle } from 'virtua'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Plus, Search, X } from 'lucide-react'
import { Virtualizer } from 'virtua'

import { Avatar, AvatarFallback, AvatarImage } from '@cared/ui/components/avatar'
import { Button } from '@cared/ui/components/button'
import { Checkbox } from '@cared/ui/components/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import { Input } from '@cared/ui/components/input'
import { Label } from '@cared/ui/components/label'
import { Separator } from '@cared/ui/components/separator'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@cared/ui/components/sheet'
import { CircleSpinner } from '@cared/ui/components/spinner'
import { cn } from '@cared/ui/lib/utils'

import type { McpServer } from '@/hooks/use-mcp'
import { SkeletonCard } from '@/components/skeleton'
import { useCreateMcpServer, useMcpServer, useUpdateMcpServer } from '@/hooks/use-mcp'
import { useToolkits, useTools } from '@/hooks/use-tools'

interface McpDetailSheetProps {
  mcpId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (mcpId: string) => void
}

/**
 * McpDetailSheet component
 * Sheet for creating or updating an MCP server
 * Left side: select toolkits
 * Right side: select tools from selected toolkits (initially select tools with 'important' tag)
 */
export function McpDetailSheet({ mcpId, open, onOpenChange, onCreated }: McpDetailSheetProps) {
  const isEditMode = !!mcpId

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[1000px] gap-2">
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Edit MCP Server' : 'Create MCP Server'}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 flex flex-col gap-4 px-4">
          <Suspense fallback={<SkeletonCard />}>
            <McpDetailSheetContent
              mcpId={mcpId}
              onOpenChange={onOpenChange}
              onCreated={onCreated}
            />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * McpDetailSheetContent component wrapper
 * Handles conditional rendering based on edit/create mode to comply with React Hooks rules
 */
function McpDetailSheetContent({
  mcpId,
  onOpenChange,
  onCreated,
}: {
  mcpId?: string
  onOpenChange: (open: boolean) => void
  onCreated?: (mcpId: string) => void
}) {
  if (mcpId) {
    return <McpDetailSheetEditMode mcpId={mcpId} onOpenChange={onOpenChange} />
  } else {
    return <McpDetailSheetCreateMode onOpenChange={onOpenChange} onCreated={onCreated} />
  }
}

/**
 * Custom hook for managing MCP form state and save logic
 * Shared between edit and create modes
 */
function useMcpFormLogic({
  existingMcp,
  onOpenChange,
  onCreated,
}: {
  existingMcp?: McpServer | null
  onOpenChange: (open: boolean) => void
  onCreated?: (mcpId: string) => void
}) {
  const isEditMode = !!existingMcp
  const createMcpServer = useCreateMcpServer()
  const updateMcpServer = useUpdateMcpServer()

  // Form state
  const [name, setName] = useState('')
  const [selectedToolkitSlugs, setSelectedToolkitSlugs] = useState<string[]>([])
  const [toolSelectionsByToolkit, setToolSelectionsByToolkit] = useState<Map<string, Set<string>>>(
    new Map(),
  )
  // Track which toolkits have initialized default tool selection
  const [toolkitInitializedMap, setToolkitInitializedMap] = useState<Map<string, boolean>>(
    new Map(),
  )
  const [isSaving, setIsSaving] = useState(false)

  // Store original values for change detection in edit mode
  const originalValues = useRef<{
    name: string
    toolkits: string[]
    tools: string[]
  } | null>(null)

  // Initialize form with existing MCP data in edit mode
  useEffect(() => {
    if (isEditMode) {
      setName(existingMcp.name)
      const toolkits = existingMcp.configuration.toolkits ?? []
      setSelectedToolkitSlugs(toolkits)

      // Group tools by toolkit
      const toolsByToolkit = new Map<string, Set<string>>()
      const tools = existingMcp.configuration.tools ?? []

      // Initialize empty sets for all toolkits
      for (const toolkit of toolkits) {
        toolsByToolkit.set(toolkit, new Set())
      }

      // Add tools to their respective toolkits (need to parse tool slug to get toolkit)
      for (const toolSlug of tools) {
        // Tool slug format: TOOLKIT_ACTION, find matching toolkit
        const toolkit = toolkits.find((tk) => toolSlug.startsWith(tk.toUpperCase()))
        if (toolkit) {
          const toolSet = toolsByToolkit.get(toolkit)
          if (toolSet) {
            toolSet.add(toolSlug)
          }
        }
      }

      setToolSelectionsByToolkit(toolsByToolkit)

      // Mark all toolkits as initialized in edit mode
      const initializedMap = new Map<string, boolean>()
      for (const toolkit of toolkits) {
        initializedMap.set(toolkit, true)
      }
      setToolkitInitializedMap(initializedMap)

      // Store original values for change detection
      originalValues.current = {
        name: existingMcp.name,
        toolkits: [...toolkits],
        tools: [...tools],
      }
    }
  }, [isEditMode, existingMcp])

  // Handle save - unified logic for both create and update
  const handleSave = async () => {
    if (!name.trim()) {
      return
    }

    setIsSaving(true)
    try {
      // Flatten all tool selections
      const allTools: string[] = []
      for (const toolSet of toolSelectionsByToolkit.values()) {
        allTools.push(...Array.from(toolSet))
      }

      const configuration = {
        toolkits: selectedToolkitSlugs,
        tools: allTools,
      }

      if (isEditMode) {
        await updateMcpServer({
          id: existingMcp.id,
          name: name.trim(),
          configuration,
        })
      } else {
        const result = await createMcpServer({
          name: name.trim(),
          configuration,
        })
        // Call onCreated with the new MCP server ID
        if (result.mcpServer?.id && onCreated) {
          onCreated(result.mcpServer.id)
        }
      }

      onOpenChange(false)
    } catch {
      // Error already handled in mutation
    } finally {
      setIsSaving(false)
    }
  }

  // Handler to select default tools for a toolkit
  const handleSelectInitialTools = useCallback(
    (toolkitSlug: string, toolSlugs: Set<string>) => {
      // Only select if this toolkit hasn't been initialized yet
      if (!toolkitInitializedMap.get(toolkitSlug)) {
        const newSelections = new Map(toolSelectionsByToolkit)
        newSelections.set(toolkitSlug, new Set(toolSlugs))
        setToolSelectionsByToolkit(newSelections)

        // Mark this toolkit as initialized
        const newInitializedMap = new Map(toolkitInitializedMap)
        newInitializedMap.set(toolkitSlug, true)
        setToolkitInitializedMap(newInitializedMap)
      }
    },
    [toolkitInitializedMap, toolSelectionsByToolkit],
  )

  // Handler to reset toolkit initial tools state when a toolkit is removed
  const handleResetInitialTools = useCallback(
    (toolkitSlug: string) => {
      const newInitializedMap = new Map(toolkitInitializedMap)
      newInitializedMap.delete(toolkitSlug)
      setToolkitInitializedMap(newInitializedMap)
    },
    [toolkitInitializedMap],
  )

  // Check if form has changes compared to original values (edit mode only)
  const hasChanges = useMemo(() => {
    if (!isEditMode || !originalValues.current) {
      return true // In create mode, always allow saving
    }

    const original = originalValues.current

    // Check name change
    if (name.trim() !== original.name) {
      return true
    }

    // Check toolkits change
    const currentToolkitsSorted = [...selectedToolkitSlugs].sort()
    const originalToolkitsSorted = [...original.toolkits].sort()
    if (
      currentToolkitsSorted.length !== originalToolkitsSorted.length ||
      !currentToolkitsSorted.every((tk, idx) => tk === originalToolkitsSorted[idx])
    ) {
      return true
    }

    // Check tools change
    const currentTools: string[] = []
    for (const toolSet of toolSelectionsByToolkit.values()) {
      currentTools.push(...Array.from(toolSet))
    }
    const currentToolsSorted = currentTools.sort()
    const originalToolsSorted = [...original.tools].sort()
    if (
      currentToolsSorted.length !== originalToolsSorted.length ||
      !currentToolsSorted.every((tool, idx) => tool === originalToolsSorted[idx])
    ) {
      return true
    }

    return false
  }, [isEditMode, name, selectedToolkitSlugs, toolSelectionsByToolkit])

  return {
    name,
    setName,
    selectedToolkitSlugs,
    setSelectedToolkitSlugs,
    toolSelectionsByToolkit,
    setToolSelectionsByToolkit,
    handleSave,
    isSaving,
    isEditMode,
    hasChanges,
    handleSelectInitialTools,
    handleResetInitialTools,
  }
}

/**
 * McpDetailSheetEditMode component
 * Edit mode with existing MCP server data
 */
function McpDetailSheetEditMode({
  mcpId,
  onOpenChange,
}: {
  mcpId: string
  onOpenChange: (open: boolean) => void
}) {
  const existingMcp = useMcpServer(mcpId)
  const formLogic = useMcpFormLogic({ existingMcp, onOpenChange })

  return <McpDetailSheetForm {...formLogic} />
}

/**
 * McpDetailSheetCreateMode component
 * Create mode for new MCP server
 */
function McpDetailSheetCreateMode({
  onOpenChange,
  onCreated,
}: {
  onOpenChange: (open: boolean) => void
  onCreated?: (mcpId: string) => void
}) {
  const formLogic = useMcpFormLogic({ onOpenChange, onCreated })

  return <McpDetailSheetForm {...formLogic} />
}

/**
 * McpDetailSheetForm component
 * Shared form UI for both create and edit modes
 * New design: Left side shows added toolkits, right side shows tools for selected toolkit
 */
function McpDetailSheetForm({
  name,
  setName,
  selectedToolkitSlugs,
  setSelectedToolkitSlugs,
  toolSelectionsByToolkit,
  setToolSelectionsByToolkit,
  handleSave,
  isSaving,
  isEditMode,
  hasChanges,
  handleSelectInitialTools,
  handleResetInitialTools,
}: {
  name: string
  setName: (name: string) => void
  selectedToolkitSlugs: string[]
  setSelectedToolkitSlugs: (toolkits: string[]) => void
  toolSelectionsByToolkit: Map<string, Set<string>>
  setToolSelectionsByToolkit: (selections: Map<string, Set<string>>) => void
  handleSave: () => void
  isSaving: boolean
  isEditMode: boolean
  hasChanges: boolean
  handleSelectInitialTools: (toolkitSlug: string, toolSlugs: Set<string>) => void
  handleResetInitialTools: (toolkitSlug: string) => void
}) {
  const allToolkits = useToolkits()

  // Current active toolkit in the left panel
  const [activeToolkitSlug, setActiveToolkitSlug] = useState<string | null>(
    selectedToolkitSlugs[0] ?? null,
  )

  // Add toolkit dialog state
  const [showAddToolkitDialog, setShowAddToolkitDialog] = useState(false)

  // Update active toolkit when selectedToolkitSlugs changes
  useEffect(() => {
    if (!activeToolkitSlug && selectedToolkitSlugs.length > 0) {
      setActiveToolkitSlug(selectedToolkitSlugs[0] ?? null)
    } else if (activeToolkitSlug && !selectedToolkitSlugs.includes(activeToolkitSlug)) {
      setActiveToolkitSlug(null)
    }
  }, [selectedToolkitSlugs, activeToolkitSlug])

  // Add toolkit handler
  const handleAddToolkit = useCallback(
    (toolkitSlug: string) => {
      if (!selectedToolkitSlugs.includes(toolkitSlug)) {
        setSelectedToolkitSlugs([...selectedToolkitSlugs, toolkitSlug])
        // Initialize empty tool selection for this toolkit
        const newSelections = new Map(toolSelectionsByToolkit)
        newSelections.set(toolkitSlug, new Set())
        setToolSelectionsByToolkit(newSelections)
        // Set as active
        setActiveToolkitSlug(toolkitSlug)
        // Note: Default tool selection will be handled by ToolsPanel via handleSelectDefaultTools
      }
      setShowAddToolkitDialog(false)
    },
    [
      selectedToolkitSlugs,
      setSelectedToolkitSlugs,
      toolSelectionsByToolkit,
      setToolSelectionsByToolkit,
    ],
  )

  // Remove toolkit handler
  const handleRemoveToolkit = useCallback(
    (toolkitSlug: string) => {
      setSelectedToolkitSlugs(selectedToolkitSlugs.filter((slug) => slug !== toolkitSlug))
      const newSelections = new Map(toolSelectionsByToolkit)
      newSelections.delete(toolkitSlug)
      setToolSelectionsByToolkit(newSelections)
      // Reset toolkit tracking state so it can be reinitialized if added again
      handleResetInitialTools(toolkitSlug)
      // Update active toolkit if the removed one was active
      if (activeToolkitSlug === toolkitSlug) {
        const remainingToolkits = selectedToolkitSlugs.filter((slug) => slug !== toolkitSlug)
        setActiveToolkitSlug(remainingToolkits[0] ?? null)
      }
    },
    [
      selectedToolkitSlugs,
      setSelectedToolkitSlugs,
      toolSelectionsByToolkit,
      setToolSelectionsByToolkit,
      handleResetInitialTools,
      activeToolkitSlug,
    ],
  )

  // Toggle tool selection for active toolkit
  const handleToggleTool = useCallback(
    (toolSlug: string) => {
      if (!activeToolkitSlug) return

      const newSelections = new Map(toolSelectionsByToolkit)
      const currentTools = newSelections.get(activeToolkitSlug) ?? new Set()
      const updatedTools = new Set(currentTools)

      if (updatedTools.has(toolSlug)) {
        updatedTools.delete(toolSlug)
      } else {
        updatedTools.add(toolSlug)
      }

      newSelections.set(activeToolkitSlug, updatedTools)
      setToolSelectionsByToolkit(newSelections)
    },
    [activeToolkitSlug, toolSelectionsByToolkit, setToolSelectionsByToolkit],
  )

  // Batch update tool selection for active toolkit
  const handleSelectTools = useCallback(
    (toolSlugs: Set<string>) => {
      if (!activeToolkitSlug) return

      const newSelections = new Map(toolSelectionsByToolkit)
      newSelections.set(activeToolkitSlug, new Set(toolSlugs))
      setToolSelectionsByToolkit(newSelections)
    },
    [activeToolkitSlug, toolSelectionsByToolkit, setToolSelectionsByToolkit],
  )

  // Get toolkit info by slug
  const getToolkitInfo = useCallback(
    (slug: string) => {
      return allToolkits.find((tk) => tk.slug === slug)
    },
    [allToolkits],
  )

  const activeToolkit = activeToolkitSlug ? getToolkitInfo(activeToolkitSlug) : null

  return (
    <>
      {/* Name input */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter MCP server name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tools">Tools</Label>
        <div id="tools" className="text-sm text-muted-foreground">
          Tools enable servers to expose executable functionality to clients.
        </div>
      </div>

      {/* Two-column layout: Added Toolkits (left) | Active Toolkit Tools (right) */}
      <div className="flex-1 flex border rounded-lg overflow-x-auto">
        {/* Left side: Added toolkits list */}
        <div className="flex flex-col w-[300px] min-w-[180px] border-r">
          {/* Header */}
          <div className="p-3 border-b">
            <div className="h-8 flex items-center">
              <Label className="text-sm font-semibold">Toolkits</Label>
            </div>
          </div>

          {/* Toolkit list */}
          <div className="flex-1 overflow-y-auto">
            <ToolkitList
              selectedToolkitSlugs={selectedToolkitSlugs}
              activeToolkitSlug={activeToolkitSlug}
              toolSelectionsByToolkit={toolSelectionsByToolkit}
              getToolkitInfo={getToolkitInfo}
              onSetActiveToolkit={setActiveToolkitSlug}
              onRemoveToolkit={handleRemoveToolkit}
            />
          </div>

          {/* Add toolkit button */}
          <div className="p-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAddToolkitDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Toolkit
            </Button>
          </div>
        </div>

        {/* Right side: Tools for active toolkit */}
        <div className="flex-1 flex flex-col min-w-[600px]">
          {!activeToolkit || !activeToolkitSlug ? (
            <div className="flex-1 flex items-center justify-center text-center text-sm text-muted-foreground p-4">
              Add a toolkit to start selecting tools
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <ToolsPanel
                toolkitSlug={activeToolkitSlug}
                toolkitName={activeToolkit.name}
                selectedTools={toolSelectionsByToolkit.get(activeToolkitSlug) ?? new Set()}
                onToggleTool={handleToggleTool}
                onSelectTools={handleSelectTools}
                onSelectInitialTools={handleSelectInitialTools}
              />
            </Suspense>
          )}
        </div>
      </div>

      <Separator />

      {/* Footer with actions */}
      <SheetFooter className="items-end pt-0">
        <Button
          className="w-fit"
          onClick={handleSave}
          disabled={!name.trim() || isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <CircleSpinner className="h-4 w-4" />
              {isEditMode ? 'Saving...' : 'Creating...'}
            </>
          ) : isEditMode ? (
            'Save'
          ) : (
            'Create'
          )}
        </Button>
      </SheetFooter>

      {/* Add Toolkit Dialog */}
      <AddToolkitDialog
        open={showAddToolkitDialog}
        onOpenChange={setShowAddToolkitDialog}
        allToolkits={allToolkits}
        selectedToolkitSlugs={selectedToolkitSlugs}
        onAddToolkit={handleAddToolkit}
      />
    </>
  )
}

/**
 * ToolkitList component
 * Virtualized list of added toolkits
 */
function ToolkitList({
  selectedToolkitSlugs,
  activeToolkitSlug,
  toolSelectionsByToolkit,
  getToolkitInfo,
  onSetActiveToolkit,
  onRemoveToolkit,
}: {
  selectedToolkitSlugs: string[]
  activeToolkitSlug: string | null
  toolSelectionsByToolkit: Map<string, Set<string>>
  getToolkitInfo: (
    slug: string,
  ) => { slug: string; name: string; meta: { logo?: string } } | undefined
  onSetActiveToolkit: (slug: string) => void
  onRemoveToolkit: (slug: string) => void
}) {
  const toolkitListRef = useRef<VirtualizerHandle>(null)

  if (selectedToolkitSlugs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4">
        No toolkits added
      </div>
    )
  }

  return (
    <Virtualizer ref={toolkitListRef}>
      {selectedToolkitSlugs.map((toolkitSlug) => {
        const toolkit = getToolkitInfo(toolkitSlug)
        if (!toolkit) return null

        const isActive = activeToolkitSlug === toolkitSlug
        const selectedCount = toolSelectionsByToolkit.get(toolkitSlug)?.size ?? 0

        return (
          <div
            key={toolkitSlug}
            className={cn(
              'flex items-center gap-2 p-2 mx-2 my-1 rounded-md hover:bg-accent transition-colors cursor-pointer',
              isActive && 'bg-accent',
            )}
            onClick={() => onSetActiveToolkit(toolkitSlug)}
          >
            <Avatar className="w-8 h-8 rounded-md">
              {toolkit.meta.logo ? (
                <AvatarImage src={toolkit.meta.logo} alt={toolkit.name} />
              ) : null}
              <AvatarFallback className="rounded-md text-xs">
                {toolkit.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate">{toolkit.name}</div>
              <div className="text-xs text-muted-foreground">{selectedCount} tools</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveToolkit(toolkitSlug)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
      })}
    </Virtualizer>
  )
}

/**
 * AddToolkitDialog component
 * Dialog for selecting and adding toolkits
 */
function AddToolkitDialog({
  open,
  onOpenChange,
  allToolkits,
  selectedToolkitSlugs,
  onAddToolkit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  allToolkits: { slug: string; name: string; meta: { logo?: string } }[]
  selectedToolkitSlugs: string[]
  onAddToolkit: (toolkitSlug: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const dialogToolkitListRef = useRef<VirtualizerHandle>(null)

  // Filter out already selected toolkits and apply search
  const availableToolkits = useMemo(() => {
    const filtered = allToolkits.filter((tk) => !selectedToolkitSlugs.includes(tk.slug))
    if (!searchQuery.trim()) return filtered

    const query = searchQuery.toLowerCase()
    return filtered.filter(
      (toolkit) =>
        toolkit.name.toLowerCase().includes(query) || toolkit.slug.toLowerCase().includes(query),
    )
  }, [allToolkits, selectedToolkitSlugs, searchQuery])

  useEffect(() => {
    setSearchQuery('')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Toolkit</DialogTitle>
          <DialogDescription>Select a toolkit to add to your MCP server</DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search toolkits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Toolkit list */}
        <div className="h-[400px] overflow-y-auto pr-4">
          {availableToolkits.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              {selectedToolkitSlugs.length === allToolkits.length
                ? 'All toolkits have been added'
                : 'No toolkits found'}
            </div>
          ) : (
            <Virtualizer ref={dialogToolkitListRef}>
              {availableToolkits.map((toolkit) => (
                <button
                  key={toolkit.slug}
                  type="button"
                  className="flex items-center gap-3 p-3 my-1 rounded-md hover:bg-accent transition-colors w-full"
                  onClick={() => onAddToolkit(toolkit.slug)}
                >
                  <Avatar className="w-10 h-10 rounded-md">
                    {toolkit.meta.logo ? (
                      <AvatarImage src={toolkit.meta.logo} alt={toolkit.name} />
                    ) : null}
                    <AvatarFallback className="rounded-md">
                      {toolkit.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium">{toolkit.name}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {toolkit.slug}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </Virtualizer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * ToolsPanel component
 * Right panel showing tools for the active toolkit with tri-state checkbox
 */
function ToolsPanel({
  toolkitSlug,
  toolkitName,
  selectedTools,
  onToggleTool,
  onSelectTools,
  onSelectInitialTools,
}: {
  toolkitSlug: string
  toolkitName: string
  selectedTools: Set<string>
  onToggleTool: (toolSlug: string) => void
  onSelectTools: (toolSlugs: Set<string>) => void
  onSelectInitialTools: (toolkitSlug: string, toolSlugs: Set<string>) => void
}) {
  const tools = useTools({ toolkits: [toolkitSlug] })
  const [searchQuery, setSearchQuery] = useState('')
  const toolsListRef = useRef<VirtualizerHandle>(null)
  // Track which tool descriptions are expanded
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())

  // Filter tools by search query
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools
    const query = searchQuery.toLowerCase()
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.slug.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query),
    )
  }, [tools, searchQuery])

  // Auto-select important tools on initial load
  // This will be called once per toolkit when tools are loaded
  useEffect(() => {
    const importantTools = tools.filter((tool) => tool.tags?.includes('important'))
    if (importantTools.length > 0) {
      const importantToolSlugs = new Set(importantTools.map((tool) => tool.slug))
      onSelectInitialTools(toolkitSlug, importantToolSlugs)
    }
  }, [tools, onSelectInitialTools, toolkitSlug])

  // Calculate tri-state checkbox state
  const selectedCount = tools.filter((tool) => selectedTools.has(tool.slug)).length
  const checkboxState =
    selectedCount === 0 ? false : selectedCount === tools.length ? true : 'indeterminate'

  // Handle select all / deselect all
  const handleToggleAll = () => {
    const newSelectedTools = new Set(selectedTools)

    if (checkboxState === true) {
      // Deselect all filtered tools
      for (const tool of filteredTools) {
        newSelectedTools.delete(tool.slug)
      }
    } else {
      // Select all filtered tools
      for (const tool of filteredTools) {
        newSelectedTools.add(tool.slug)
      }
    }

    onSelectTools(newSelectedTools)
  }

  // Toggle description expansion for a tool
  const toggleDescriptionExpansion = (toolSlug: string) => {
    const newExpanded = new Set(expandedDescriptions)
    if (newExpanded.has(toolSlug)) {
      newExpanded.delete(toolSlug)
    } else {
      newExpanded.add(toolSlug)
    }
    setExpandedDescriptions(newExpanded)
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Checkbox
          checked={checkboxState}
          onCheckedChange={handleToggleAll}
          aria-label="Select all tools"
        />
        <div className="flex-1">
          <span className="text-sm font-medium">
            Tools List for {toolkitName} ({selectedCount}/{filteredTools.length})
          </span>
        </div>
        <div className="relative w-48">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 pr-7 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0.5 top-0.5 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Tools list */}
      <div className="flex-1 overflow-y-auto">
        {filteredTools.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            {tools.length === 0 ? 'No tools available' : 'No tools match your search'}
          </div>
        ) : (
          <Virtualizer ref={toolsListRef}>
            {filteredTools.map((tool) => {
              const isSelected = selectedTools.has(tool.slug)
              const isExpanded = expandedDescriptions.has(tool.slug)
              return (
                <div
                  key={tool.slug}
                  className={cn(
                    'flex items-start gap-2 p-2 mx-2 my-1 rounded-md transition-colors',
                    isSelected && 'bg-accent',
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleTool(tool.slug)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      className="cursor-pointer hover:opacity-80 w-full text-left"
                      onClick={() => onToggleTool(tool.slug)}
                    >
                      <span className="text-sm font-medium truncate">{tool.name}</span>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {tool.slug}
                      </div>
                    </button>
                    {tool.description && (
                      <div className="mt-1">
                        <div
                          className={cn(
                            'text-xs text-muted-foreground',
                            !isExpanded && 'line-clamp-2',
                          )}
                        >
                          {tool.description}
                        </div>
                        {/* Show more/less button */}
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:underline mt-0.5"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleDescriptionExpansion(tool.slug)
                          }}
                        >
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </Virtualizer>
        )}
      </div>
    </>
  )
}
