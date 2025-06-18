'use client'

import type { ReactNode } from 'react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { faFileExport, faFileImport, faPlus } from '@fortawesome/free-solid-svg-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { personaMetadataSchema, personaSettingsSchema } from '@tavern/core'
import { Document } from 'flexsearch'
import { ChevronDownIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@ownxai/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ownxai/ui/components/collapsible'
import { Form } from '@ownxai/ui/components/form'
import { Input } from '@ownxai/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'
import { Separator } from '@ownxai/ui/components/separator'
import { cn } from '@ownxai/ui/lib/utils'

import { CheckboxField } from '@/components/checkbox-field'
import { FaButton } from '@/components/fa-button'
import { useImportPersonas, usePersonas } from '@/hooks/use-persona'
import { usePersonaSettings, useUpdatePersonaSettings } from '@/hooks/use-settings'
import { CreatePersonaDialog } from './create-persona-dialog'
import { PersonaList } from './persona-list'
import { PersonaView } from './persona-view'
import { SelectPersonaDialog } from './select-persona-dialog'

export function PersonaManagementPanel() {
  const { personas } = usePersonas()
  const { active: activePersonaId } = usePersonaSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importPersonas = useImportPersonas()
  const [isImporting, setIsImporting] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState<Document>()
  const [searchResults, setSearchResults] = useState<Set<string>>(new Set())

  const [sortBy, setSortBy] = useState<'a-z' | 'z-a' | 'newest' | 'oldest'>('a-z')

  // Initialize search index
  useEffect(() => {
    const index = new Document({
      document: {
        id: 'id',
        index: [
          'name',
          'metadata:description',
        ],
        store: ['id'],
      },
      tokenize: 'bidirectional',
    })

    // Add all personas to the index
    void Promise.all(
      personas.map((persona) => {
        // @ts-ignore
        return index.add(persona)
      }),
    )

    // @ts-ignore
    setSearchIndex(index)
  }, [personas])

  // Handle search
  useEffect(() => {
    if (!searchIndex || !searchQuery.trim()) {
      setSearchResults(new Set())
      return
    }

    const results = searchIndex.search(searchQuery)
    const matchedIds = new Set(results.flatMap((result) => result.result as string[]))
    setSearchResults(matchedIds)
  }, [searchQuery, searchIndex])

  // Filter and sort personas
  const filteredAndSortedPersonas = useMemo(
    () =>
      personas
        .filter((persona) => {
          return !searchQuery.trim() || searchResults.has(persona.id)
        })
        .sort((a, b) => {
          const aName = a.name
          const bName = b.name
          const aDate = new Date(a.createdAt).getTime()
          const bDate = new Date(b.createdAt).getTime()

          switch (sortBy) {
            case 'a-z':
              return aName.localeCompare(bName)
            case 'z-a':
              return bName.localeCompare(aName)
            case 'newest':
              return bDate - aDate
            case 'oldest':
              return aDate - bDate
            default:
              return 0
          }
        }),
    [personas, searchQuery, searchResults, sortBy],
  )

  const handleExport = () => {
    // Create a blob with the personas data
    const blob = new Blob(
      [
        JSON.stringify(
          personas.map(({ name, metadata: { description, injectionPosition, depth, role } }) => ({
            name,
            description,
            injectionPosition,
            depth,
            role,
          })),
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)

    // Create a temporary link element to trigger the download
    const link = document.createElement('a')
    link.href = url
    link.download = 'personas.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file')
      return
    }

    const personasSchema = z.array(
      z
        .object({
          name: z.string().min(1),
        })
        .merge(
          personaMetadataSchema.pick({
            description: true,
            injectionPosition: true,
            depth: true,
            role: true,
          }),
        ),
    )

    try {
      const text = await file.text()
      const importedPersonas = personasSchema.parse(JSON.parse(text))

      setIsImporting(true)

      await importPersonas(
        importedPersonas.map((persona) => ({
          name: persona.name,
          metadata: {
            description: persona.description,
            injectionPosition: persona.injectionPosition,
            depth: persona.depth,
            role: persona.role,
          },
        })),
      )

      toast.success(`Successfully imported ${importedPersonas.length} personas`)
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const operateActions = [
    {
      icon: faPlus,
      tooltip: 'Create Persona',
      wrapper: ({ trigger }: { trigger: ReactNode }) => <CreatePersonaDialog trigger={trigger} />,
    },
    {
      action: handleExport,
      icon: faFileExport,
      tooltip: 'Export Personas',
      disabled: !personas.length,
      className: !personas.length ? 'disabled:pointer-events-none disabled:opacity-50' : '',
    },
    {
      action: () => fileInputRef.current?.click(),
      icon: faFileImport,
      tooltip: 'Import Personas',
      disabled: isImporting,
      className: isImporting ? 'disabled:pointer-events-none disabled:opacity-50' : '',
    },
  ]

  return (
    <div className="flex flex-col gap-6 mb-2">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleImport}
        disabled={isImporting}
        className="hidden"
      />

      {/* Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold">Persona</h1>
      </div>

      {/* Upper part with actions and settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-fit flex flex-wrap justify-between items-center gap-1">
          {/* Left side: Actions */}
          {operateActions.map(
            ({ action, icon, tooltip, disabled, wrapper: Wrapper, className }) => {
              const btn = (
                <FaButton
                  key={tooltip}
                  icon={icon}
                  btnSize="size-6"
                  iconSize="1x"
                  title={tooltip}
                  className={cn(
                    'text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm',
                    className,
                  )}
                  disabled={disabled}
                  onClick={action}
                />
              )
              return Wrapper ? <Wrapper key={tooltip} trigger={btn} /> : btn
            },
          )}

          {/* Search and sort controls */}
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />

          <Select
            value={sortBy}
            onValueChange={(value: 'a-z' | 'z-a' | 'newest' | 'oldest') => setSortBy(value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="z-6000">
              <SelectItem value="a-z">A-Z</SelectItem>
              <SelectItem value="z-a">Z-A</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right side: Settings */}
        <PersonaSettings />
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-ring/50 to-transparent" />

      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side: Persona list */}
        <PersonaList personas={filteredAndSortedPersonas} />

        {/* Right side: Persona view */}
        {activePersonaId && <PersonaView personaId={activePersonaId} />}
      </div>

      <SelectPersonaDialog />
    </div>
  )
}

const personaSettingsFormSchema = personaSettingsSchema.pick({
  showNotification: true,
  allowMultiConnectionsPerCharacter: true,
  autoLockToChat: true,
})

const PersonaSettings = memo(function PersonaSettings() {
  const personaSettings = usePersonaSettings()
  const updatePersonaSettings = useUpdatePersonaSettings()

  const form = useForm({
    resolver: zodResolver(personaSettingsFormSchema),
    defaultValues: personaSettings,
  })

  useEffect(() => {
    form.reset(personaSettings)
  }, [personaSettings, form])

  return (
    <Collapsible className="my-1.5">
      <CollapsibleTrigger asChild>
        <div className="flex justify-between items-center cursor-pointer [&[data-state=open]>button>svg]:rotate-180">
          <span className="text-sm font-medium">Global Settings</span>
          <Button type="button" variant="outline" size="icon" className="size-6">
            <ChevronDownIcon className="transition-transform duration-200" />
          </Button>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden pt-2">
        <Form {...form}>
          <form
            onBlur={() => {
              void updatePersonaSettings(form.getValues())
            }}
            className="space-y-2"
          >
            <CheckboxField
              label="Show notification when switching persona"
              name="showNotification"
              control={form.control}
            />

            <CheckboxField
              label="Allow multiple persona connections per character"
              name="allowMultiConnectionsPerCharacter"
              control={form.control}
            />

            <CheckboxField
              label="Auto-lock a chosen persona to the chat"
              name="autoLockToChat"
              control={form.control}
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
})
