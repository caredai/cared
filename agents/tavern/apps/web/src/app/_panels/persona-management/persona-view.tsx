import type { PersonaMetadata } from '@tavern/core'
import { useCallback, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { PersonaPosition } from '@tavern/core'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Label } from '@ownxai/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'
import { Textarea } from '@ownxai/ui/components/textarea'

import { usePersona, useUpdatePersona } from '@/hooks/use-persona'

const personaFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  injectionPosition: z.nativeEnum(PersonaPosition),
  depth: z.number().int().min(0).optional(),
  role: z.enum(['system', 'user', 'assistant']).optional(),
})

type PersonaFormValues = z.infer<typeof personaFormSchema>

export function PersonaView({ personaId }: { personaId: string }) {
  const persona = usePersona(personaId)
  const updatePersona = useUpdatePersona()

  // Initialize form with persona data
  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaFormSchema),
    defaultValues: {
      name: persona?.name ?? '',
      description: persona?.metadata.description ?? '',
      injectionPosition: persona?.metadata.injectionPosition ?? PersonaPosition.None,
      depth: persona?.metadata.depth,
      role: persona?.metadata.role,
    },
  })

  // Update form when persona changes
  useEffect(() => {
    if (persona) {
      form.reset({
        name: persona.name,
        description: persona.metadata.description,
        injectionPosition: persona.metadata.injectionPosition,
        depth: persona.metadata.depth,
        role: persona.metadata.role,
      })
    }
  }, [persona, form])

  // Handle form submission
  const onSubmit = useCallback(
    async (values: PersonaFormValues) => {
      if (!persona) return

      const metadata: Partial<PersonaMetadata> = {
        description: values.description,
        injectionPosition: values.injectionPosition,
        depth: values.depth,
        role: values.role,
      }

      await updatePersona(persona.id, {
        name: values.name,
        metadata,
      })
    },
    [persona, updatePersona],
  )

  if (!persona) {
    return null
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <input
          id="name"
          {...form.register('name')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...form.register('description')} className="min-h-[100px]" />
      </div>

      {/* Injection Position */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="injectionPosition">Injection Position</Label>
        <Select
          value={form.watch('injectionPosition').toString()}
          onValueChange={(value) => form.setValue('injectionPosition', parseInt(value))}
        >
          <SelectTrigger id="injectionPosition">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PersonaPosition.None.toString()}>None</SelectItem>
            <SelectItem value={PersonaPosition.InPrompt.toString()}>In Prompt</SelectItem>
            <SelectItem value={PersonaPosition.ANTop.toString()}>AN Top</SelectItem>
            <SelectItem value={PersonaPosition.ANBottom.toString()}>AN Bottom</SelectItem>
            <SelectItem value={PersonaPosition.AtDepth.toString()}>At Depth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Depth (only show when position is AtDepth) */}
      {form.watch('injectionPosition') === PersonaPosition.AtDepth && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="depth">Depth</Label>
          <input
            id="depth"
            type="number"
            min={0}
            {...form.register('depth', { valueAsNumber: true })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      )}

      {/* Role */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="role">Role</Label>
        <Select
          value={form.watch('role') ?? ''}
          onValueChange={(value) => form.setValue('role', value as 'system' | 'user' | 'assistant')}
        >
          <SelectTrigger id="role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="assistant">Assistant</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  )
}
