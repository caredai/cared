'use client'

import type { ReactNode } from 'react'
import { memo, useEffect, useRef, useState } from 'react'
import { faFileExport, faFileImport, faPlus } from '@fortawesome/free-solid-svg-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { personaMetadataSchema, personaSettingsSchema } from '@tavern/core'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Form } from '@ownxai/ui/components/form'
import { Separator } from '@ownxai/ui/components/separator'
import { cn } from '@ownxai/ui/lib/utils'

import { CheckboxField } from '@/components/checkbox-field'
import { FaButton } from '@/components/fa-button'
import { useImportPersonas, usePersonas } from '@/hooks/use-persona'
import { usePersonaSettings, useUpdatePersonaSettings } from '@/hooks/use-settings'
import { CreatePersonaDialog } from './create-persona-dialog'
import { PersonaList } from './persona-list'
import { PersonaView } from './persona-view'

export function PersonaManagementPanel() {
  const { personas } = usePersonas()
  const { active: activePersonaId } = usePersonaSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importPersonas = useImportPersonas()
  const [isImporting, setIsImporting] = useState(false)

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
    <div className="flex flex-col gap-6">
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
        {/* Left side: Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap justify-start items-center gap-1">
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
          </div>
        </div>

        {/* Right side: Settings */}
        <PersonaSettings />
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-ring/50 to-transparent" />

      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side: Persona list */}
        <PersonaList personas={personas} />

        {/* Right side: Persona view */}
        {activePersonaId && <PersonaView personaId={activePersonaId} />}
      </div>
    </div>
  )
}

const personaSettingsFormSchema = personaSettingsSchema.pick({
  showNotification: true,
  allowMultiConnectionsPerCharacter: true,
  autoLockToChat: true,
})

export const PersonaSettings = memo(function PersonaSettings() {
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
    <div className="flex flex-col gap-4">
      <span className="text-sm font-medium">Global Settings</span>
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
    </div>
  )
})
