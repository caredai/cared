import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { RegexScript } from '@tavern/core'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { faFileExport, faFileImport, faSquarePlus } from '@fortawesome/free-solid-svg-icons'
import {
  extractExtensions,
  formatExtensions,
  regexScriptSchema,
  RegexSubstituteMode,
} from '@tavern/core'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { v7 as uuid } from 'uuid'
import { VList } from 'virtua'
import { z } from 'zod'

import { Input } from '@ownxai/ui/components/input'

import { FaButton } from '@/components/fa-button'
import { useUpdateCharacter } from '@/hooks/use-character'
import { isCharacter, useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useRegexSettings, useUpdateRegexSettings } from '@/hooks/use-settings'
import { useDebugRegex } from './hooks'
import { RegexScriptItem } from './regex-script-item'

const createNewScript = (): RegexScript => ({
  id: uuid(),
  name: 'New Script',
  regex: '',
  replaceString: '',
  trimStrings: [],
  placement: [],
  disabled: false,
  displayOnly: false,
  promptOnly: false,
  runOnEdit: false,
  substituteMode: RegexSubstituteMode.NONE,
})

const exportScripts = (scripts: RegexScript[], filename: string) => {
  if (scripts.length === 0) {
    toast.error('No scripts to export')
    return
  }

  const dataStr = JSON.stringify(scripts, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const validateAndParseScript = async (file: File): Promise<RegexScript[]> => {
  if (!file.name.endsWith('.json')) {
    throw new Error('Please select a JSON file')
  }

  const text = await file.text()
  const data = JSON.parse(text)

  if (Array.isArray(data)) {
    return z.array(regexScriptSchema).parse(data)
  } else {
    return [regexScriptSchema.parse(data)]
  }
}

const useScriptManager = (
  scripts: RegexScript[],
  onUpdateScripts: (scripts: RegexScript[]) => void,
  onImportSuccess?: () => void,
) => {
  const [openStates, setOpenStates] = useState<Record<number, boolean>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id as string)
      // Collapse all items when dragging starts
      const newOpenStates: Record<number, boolean> = {}
      scripts.forEach((_, index) => {
        newOpenStates[index] = false
      })
      setOpenStates(newOpenStates)
    },
    [scripts],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      const { active, over } = event
      if (over && active.id !== over.id) {
        const oldIndex = scripts.findIndex((script) => script.id === active.id)
        const newIndex = scripts.findIndex((script) => script.id === over.id)
        const newScripts = arrayMove(scripts, oldIndex, newIndex)
        onUpdateScripts(newScripts)
      }
    },
    [scripts, onUpdateScripts],
  )

  const handleAdd = useCallback(() => {
    onUpdateScripts([...scripts, createNewScript()])
  }, [scripts, onUpdateScripts])

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleExport = useCallback(
    (filename: string) => {
      exportScripts(scripts, filename)
    },
    [scripts],
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      try {
        const validatedScripts = await validateAndParseScript(file)
        onUpdateScripts([...scripts, ...validatedScripts])
        onImportSuccess?.()
      } catch (error) {
        console.error(error)
        toast.error(`Failed to import regex script(s): invalid file format`)
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [scripts, onUpdateScripts, onImportSuccess],
  )

  const handleScriptUpdate = useCallback(
    (index: number, script: RegexScript) => {
      const updatedScripts = [...scripts]
      updatedScripts[index] = script
      onUpdateScripts(updatedScripts)
    },
    [scripts, onUpdateScripts],
  )

  const handleScriptDelete = useCallback(
    (index: number) => {
      const updatedScripts = scripts.filter((_, i) => i !== index)
      onUpdateScripts(updatedScripts)
    },
    [scripts, onUpdateScripts],
  )

  const handleScriptMove = useCallback(
    (index: number) => {
      const scriptToMove = scripts[index]
      const updatedScripts = scripts.filter((_, i) => i !== index)
      onUpdateScripts(updatedScripts)
      return scriptToMove
    },
    [scripts, onUpdateScripts],
  )

  const handleOpenChange = useCallback((index: number, open: boolean) => {
    setOpenStates((prev) => ({ ...prev, [index]: open }))
  }, [])

  return {
    openStates,
    activeId,
    sensors,
    fileInputRef,
    handleDragStart,
    handleDragEnd,
    handleAdd,
    handleImport,
    handleExport,
    handleFileChange,
    handleScriptUpdate,
    handleScriptDelete,
    handleScriptMove,
    handleOpenChange,
  }
}

export function RegexExtension() {
  const regexSettings = useRegexSettings()
  const updateRegexSettings = useUpdateRegexSettings()
  const charOrGroup = useActiveCharacterOrGroup()
  const updateCharacter = useUpdateCharacter()
  const debugRegex = useDebugRegex()

  // Get character regex scripts from extensions
  const characterRegexScripts = useMemo(() => {
    if (!isCharacter(charOrGroup)) return []
    const extensions = extractExtensions(charOrGroup.content)
    return extensions.regex_scripts ?? []
  }, [charOrGroup])

  const [globalScripts, setGlobalScripts] = useState(regexSettings.scripts)
  const [characterScripts, setCharacterScripts] = useState(characterRegexScripts)

  // Update state when props change
  useEffect(() => {
    setGlobalScripts(regexSettings.scripts)
  }, [regexSettings.scripts])

  useEffect(() => {
    setCharacterScripts(characterRegexScripts)
  }, [characterRegexScripts])

  // Global scripts manager
  const globalScriptManager = useScriptManager(globalScripts, (scripts) => {
    setGlobalScripts(scripts)
    void updateRegexSettings({ scripts })
  })

  // Character scripts manager
  const characterScriptManager = useScriptManager(characterScripts, (scripts) => {
    if (!isCharacter(charOrGroup)) return

    setCharacterScripts(scripts)

    const extensions = extractExtensions(charOrGroup.content)
    const updatedExtensions = formatExtensions({
      ...extensions,
      regex_scripts: scripts,
    })

    void updateCharacter(charOrGroup, {
      ...charOrGroup.content,
      data: {
        ...charOrGroup.content.data,
        extensions: updatedExtensions,
      },
    })
  })

  // Handle moving scripts between categories
  const handleMoveToGlobal = useCallback(
    (index: number) => {
      const scriptToMove = characterScriptManager.handleScriptMove(index)
      if (scriptToMove) {
        const newGlobalScripts = [...globalScripts, scriptToMove]
        setGlobalScripts(newGlobalScripts)
        void updateRegexSettings({ scripts: newGlobalScripts })
      }
    },
    [characterScriptManager, globalScripts, updateRegexSettings],
  )

  const handleMoveToCharacter = useCallback(
    (index: number) => {
      const scriptToMove = globalScriptManager.handleScriptMove(index)
      if (scriptToMove && isCharacter(charOrGroup)) {
        const newCharacterScripts = [...characterScripts, scriptToMove]
        setCharacterScripts(newCharacterScripts)
        const extensions = extractExtensions(charOrGroup.content)
        const updatedExtensions = formatExtensions({
          ...extensions,
          regex_scripts: newCharacterScripts,
        })

        void updateCharacter(charOrGroup, {
          ...charOrGroup.content,
          data: {
            ...charOrGroup.content.data,
            extensions: updatedExtensions,
          },
        })
      }
    },
    [globalScriptManager, characterScripts, charOrGroup, updateCharacter],
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Global Scripts Section */}
      <RegexScriptsSection
        title="Global Scripts"
        scripts={globalScripts}
        manager={globalScriptManager}
        exportFilename="global-regex-scripts.json"
        onMove={handleMoveToCharacter}
        moveType="moveToCharacter"
        debugRegex={debugRegex}
      />

      {/* Character Scripts Section */}
      <RegexScriptsSection
        title="Character Scripts"
        scripts={characterScripts}
        manager={characterScriptManager}
        exportFilename={`${isCharacter(charOrGroup) ? charOrGroup.content.data.name : 'character'}-regex-scripts.json`}
        disabled={!isCharacter(charOrGroup)}
        onMove={handleMoveToGlobal}
        moveType="moveToGlobal"
        debugRegex={debugRegex}
      />

      {/* Hidden file inputs */}
      <Input
        ref={globalScriptManager.fileInputRef}
        type="file"
        accept=".json"
        onChange={globalScriptManager.handleFileChange}
        className="hidden"
      />
      <Input
        ref={characterScriptManager.fileInputRef}
        type="file"
        accept=".json"
        onChange={characterScriptManager.handleFileChange}
        className="hidden"
      />
    </div>
  )
}

function RegexScriptsSection({
  title,
  scripts,
  manager,
  exportFilename,
  disabled = false,
  onMove,
  moveType,
  debugRegex,
}: {
  title: string
  scripts: RegexScript[]
  manager: ReturnType<typeof useScriptManager>
  exportFilename: string
  disabled?: boolean
  onMove?: (index: number) => void
  moveType: 'moveToGlobal' | 'moveToCharacter'
  debugRegex?: (script: RegexScript, rawString: string) => string
}) {
  const height = useMemo(() => {
    const openList = scripts.map((_, i) => manager.openStates[i])
    if (openList.some(Boolean)) {
      return 626
    }
    return Math.min(openList.length * 36, 360)
  }, [scripts, manager.openStates])

  const activeScript = manager.activeId
    ? scripts.find((script) => script.id === manager.activeId)
    : null

  const id = useId()

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <h2 className="text-md font-semibold">{title}</h2>
        <div className="flex items-center gap-2 mr-3">
          <FaButton
            icon={faSquarePlus}
            btnSize="size-6"
            iconSize="1x"
            title="Add script"
            className="text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm"
            onClick={manager.handleAdd}
            disabled={disabled}
          />
          <FaButton
            icon={faFileImport}
            btnSize="size-6"
            iconSize="1x"
            title="Import script(s)"
            className="text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm"
            onClick={manager.handleImport}
            disabled={disabled}
          />
          <FaButton
            icon={faFileExport}
            btnSize="size-6"
            iconSize="1x"
            title="Export all scripts"
            className="text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm"
            onClick={() => manager.handleExport(exportFilename)}
            disabled={disabled}
          />
        </div>
      </div>

      {scripts.length > 0 && (
        <DndContext
          id={id}
          sensors={manager.sensors}
          collisionDetection={closestCenter}
          onDragStart={manager.handleDragStart}
          onDragEnd={manager.handleDragEnd}
        >
          <SortableContext
            items={scripts.map((script) => script.id)}
            strategy={verticalListSortingStrategy}
          >
            <VList
              className="scrollbar-stable"
              style={{
                height: `${height}px`,
              }}
            >
              {scripts.map((script, i) => (
                <RegexScriptItem
                  key={script.id}
                  index={i}
                  defaultValues={script}
                  open={manager.openStates[i]}
                  onOpenChange={manager.handleOpenChange}
                  onUpdate={manager.handleScriptUpdate}
                  onDelete={manager.handleScriptDelete}
                  onMove={onMove}
                  moveType={moveType}
                  debugRegex={debugRegex}
                />
              ))}
            </VList>
          </SortableContext>
          {(globalThis as any).document &&
            createPortal(
              <DragOverlay zIndex={7000}>
                {activeScript ? (
                  <RegexScriptItem index={0} defaultValues={activeScript} moveType={moveType} />
                ) : null}
              </DragOverlay>,
              globalThis.document.body,
            )}
        </DndContext>
      )}

      {scripts.length === 0 && (
        <p className="flex justify-center text-muted-foreground text-sm">
          {disabled ? 'No active character' : 'No scripts found'}
        </p>
      )}
    </div>
  )
}
