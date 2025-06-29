import { useCallback, useMemo, useRef, useState } from 'react'
import { faFileExport, faFileImport, faSquarePlus } from '@fortawesome/free-solid-svg-icons'
import {
  extractExtensions,
  formatExtensions,
  RegexScript,
  regexScriptSchema,
  RegexSubstituteMode,
} from '@tavern/core'
import { toast } from 'sonner'
import { VList } from 'virtua'

import { Input } from '@ownxai/ui/components/input'
import { Separator } from '@ownxai/ui/components/separator'

import { FaButton } from '@/components/fa-button'
import { useUpdateCharacter } from '@/hooks/use-character'
import { isCharacter, useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useRegexSettings, useUpdateRegexSettings } from '@/hooks/use-settings'
import { RegexScriptItem } from './regex-script-item'

// Common script creation function
const createNewScript = (): RegexScript => ({
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

// Common export function
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

// Common import validation function
const validateAndParseScript = async (file: File): Promise<RegexScript> => {
  if (!file.name.endsWith('.json')) {
    throw new Error('Please select a JSON file')
  }

  const text = await file.text()
  const script = JSON.parse(text)
  return regexScriptSchema.parse(script)
}

// Scripts section component
interface ScriptsSectionProps {
  title: string
  scripts: RegexScript[]
  openStates: Record<number, boolean>
  onOpenChange: (index: number, open: boolean) => void
  onUpdate: (index: number, script: RegexScript) => void
  onDelete: (index: number) => void
  onAdd: () => void
  onImport: () => void
  onExport: () => void
  disabled?: boolean
}

export function RegexExtension() {
  const regexSettings = useRegexSettings()
  const updateRegexSettings = useUpdateRegexSettings()
  const character = useActiveCharacterOrGroup()
  const updateCharacter = useUpdateCharacter()

  const [globalOpenStates, setGlobalOpenStates] = useState<Record<number, boolean>>({})
  const [characterOpenStates, setCharacterOpenStates] = useState<Record<number, boolean>>({})

  const globalFileInputRef = useRef<HTMLInputElement>(null)
  const characterFileInputRef = useRef<HTMLInputElement>(null)

  // Get character regex scripts from extensions
  const characterRegexScripts = useMemo(() => {
    if (!isCharacter(character)) return []
    const extensions = extractExtensions(character.content)
    return extensions.regex_scripts || []
  }, [character])

  // Global scripts handlers
  const handleAddGlobalScript = useCallback(() => {
    void updateRegexSettings({
      scripts: [...regexSettings.scripts, createNewScript()],
    })
  }, [regexSettings.scripts, updateRegexSettings])

  const handleImportGlobalScript = useCallback(() => {
    globalFileInputRef.current?.click()
  }, [])

  const handleExportGlobalScripts = useCallback(() => {
    exportScripts(regexSettings.scripts, 'global-regex-scripts.json')
  }, [regexSettings.scripts])

  const handleGlobalFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      try {
        const validatedScript = await validateAndParseScript(file)
        void updateRegexSettings({
          scripts: [...regexSettings.scripts, validatedScript],
        })
        toast.success('Script imported successfully')
      } catch (error) {
        console.error(error)
        toast.error('Failed to import script: invalid file format')
      } finally {
        if (globalFileInputRef.current) {
          globalFileInputRef.current.value = ''
        }
      }
    },
    [regexSettings.scripts, updateRegexSettings],
  )

  const handleGlobalScriptUpdate = useCallback(
    (index: number, script: RegexScript) => {
      const scripts = [...regexSettings.scripts]
      scripts[index] = script
      void updateRegexSettings({ scripts })
    },
    [regexSettings.scripts, updateRegexSettings],
  )

  const handleGlobalScriptDelete = useCallback(
    (index: number) => {
      const scripts = regexSettings.scripts.filter((_, i) => i !== index)
      void updateRegexSettings({ scripts })
    },
    [regexSettings.scripts, updateRegexSettings],
  )

  const handleGlobalOpenChange = useCallback((index: number, open: boolean) => {
    setGlobalOpenStates((prev) => ({ ...prev, [index]: open }))
  }, [])

  // Character scripts handlers
  const handleAddCharacterScript = useCallback(() => {
    if (!isCharacter(character)) return

    const extensions = extractExtensions(character.content)
    const updatedExtensions = formatExtensions({
      ...extensions,
      regex_scripts: [...(extensions.regex_scripts || []), createNewScript()],
    })

    void updateCharacter(character, {
      ...character.content,
      data: {
        ...character.content.data,
        extensions: updatedExtensions,
      },
    })
  }, [character, updateCharacter])

  const handleImportCharacterScript = useCallback(() => {
    characterFileInputRef.current?.click()
  }, [])

  const handleExportCharacterScripts = useCallback(() => {
    if (!isCharacter(character)) return
    exportScripts(characterRegexScripts, `${character.content.data.name}-regex-scripts.json`)
  }, [character, characterRegexScripts])

  const handleCharacterFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !isCharacter(character)) return

      try {
        const validatedScript = await validateAndParseScript(file)
        const extensions = extractExtensions(character.content)
        const updatedExtensions = formatExtensions({
          ...extensions,
          regex_scripts: [...(extensions.regex_scripts || []), validatedScript],
        })

        void updateCharacter(character, {
          ...character.content,
          data: {
            ...character.content.data,
            extensions: updatedExtensions,
          },
        })

        toast.success('Script imported successfully')
      } catch (error) {
        console.error(error)
        toast.error('Failed to import script: invalid file format')
      } finally {
        if (characterFileInputRef.current) {
          characterFileInputRef.current.value = ''
        }
      }
    },
    [character, updateCharacter],
  )

  const handleCharacterScriptUpdate = useCallback(
    (index: number, script: RegexScript) => {
      if (!isCharacter(character)) return

      const extensions = extractExtensions(character.content)
      const scripts = [...(extensions.regex_scripts || [])]
      scripts[index] = script

      const updatedExtensions = formatExtensions({
        ...extensions,
        regex_scripts: scripts,
      })

      void updateCharacter(character, {
        ...character.content,
        data: {
          ...character.content.data,
          extensions: updatedExtensions,
        },
      })
    },
    [character, updateCharacter],
  )

  const handleCharacterScriptDelete = useCallback(
    (index: number) => {
      if (!isCharacter(character)) return

      const extensions = extractExtensions(character.content)
      const scripts = (extensions.regex_scripts || []).filter((_, i) => i !== index)

      const updatedExtensions = formatExtensions({
        ...extensions,
        regex_scripts: scripts,
      })

      void updateCharacter(character, {
        ...character.content,
        data: {
          ...character.content.data,
          extensions: updatedExtensions,
        },
      })
    },
    [character, updateCharacter],
  )

  const handleCharacterOpenChange = useCallback((index: number, open: boolean) => {
    setCharacterOpenStates((prev) => ({ ...prev, [index]: open }))
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {/* Global Scripts Section */}
      <RegexScriptsSection
        title="Global Scripts"
        scripts={regexSettings.scripts}
        openStates={globalOpenStates}
        onOpenChange={handleGlobalOpenChange}
        onUpdate={handleGlobalScriptUpdate}
        onDelete={handleGlobalScriptDelete}
        onAdd={handleAddGlobalScript}
        onImport={handleImportGlobalScript}
        onExport={handleExportGlobalScripts}
      />

      <Separator className="bg-gradient-to-r from-transparent via-ring/50 to-transparent" />

      {/* Character Scripts Section */}
      <RegexScriptsSection
        title="Character Scripts"
        scripts={characterRegexScripts}
        openStates={characterOpenStates}
        onOpenChange={handleCharacterOpenChange}
        onUpdate={handleCharacterScriptUpdate}
        onDelete={handleCharacterScriptDelete}
        onAdd={handleAddCharacterScript}
        onImport={handleImportCharacterScript}
        onExport={handleExportCharacterScripts}
        disabled={!isCharacter(character)}
      />

      {/* Hidden file inputs */}
      <Input
        ref={globalFileInputRef}
        type="file"
        accept=".json"
        onChange={handleGlobalFileChange}
        className="hidden"
      />
      <Input
        ref={characterFileInputRef}
        type="file"
        accept=".json"
        onChange={handleCharacterFileChange}
        className="hidden"
      />
    </div>
  )
}

function RegexScriptsSection({
  title,
  scripts,
  openStates,
  onOpenChange,
  onUpdate,
  onDelete,
  onAdd,
  onImport,
  onExport,
  disabled = false,
}: ScriptsSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <h2 className="text-md font-semibold">{title}</h2>
        <div className="flex items-center gap-1">
          <FaButton
            icon={faSquarePlus}
            btnSize="size-6"
            iconSize="1x"
            title="Add script"
            className="text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm"
            onClick={onAdd}
            disabled={disabled}
          />
          <FaButton
            icon={faFileImport}
            btnSize="size-6"
            iconSize="1x"
            title="Import script"
            className="text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm"
            onClick={onImport}
            disabled={disabled}
          />
          <FaButton
            icon={faFileExport}
            btnSize="size-6"
            iconSize="1x"
            title="Export all scripts"
            className="text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm"
            onClick={onExport}
            disabled={disabled}
          />
        </div>
      </div>

      {scripts.length > 0 && (
        <VList
          style={{
            height: `${scripts.map((_, i) => openStates[i]).reduce((height, open) => height + (open ? 600 : 36), 0)}px`,
          }}
        >
          {scripts.map((script, i) => (
            <RegexScriptItem
              key={i}
              index={i}
              defaultValues={script}
              open={openStates[i]}
              onOpenChange={onOpenChange}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </VList>
      )}

      {scripts.length === 0 && (
        <p className="flex justify-center text-muted-foreground text-sm">No scripts found</p>
      )}
    </div>
  )
}
