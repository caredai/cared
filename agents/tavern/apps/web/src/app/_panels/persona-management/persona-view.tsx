import { useCallback, useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { PersonaPosition } from '@tavern/core'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@ownxai/ui/components/form'
import { Input } from '@ownxai/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'
import { Textarea } from '@ownxai/ui/components/textarea'

import { NumberInput } from '@/components/number-input'
import { usePersona, useUpdatePersona } from '@/hooks/use-persona'

const personaFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  injectionPosition: z.nativeEnum(PersonaPosition),
  depth: z.number().int().min(0).step(1).optional(),
  role: z.enum(['system', 'user', 'assistant']).optional(),
})

type PersonaFormValues = z.infer<typeof personaFormSchema>

const positionOptions = [
  { value: 'none', label: 'None', position: PersonaPosition.None },
  {
    value: 'in-prompt',
    label: 'In Story String / Prompt Manager',
    position: PersonaPosition.InPrompt,
  },
  { value: 'an-top', label: "Top of Author's Note", position: PersonaPosition.ANTop },
  { value: 'an-bottom', label: "Bottom of Author's Note", position: PersonaPosition.ANBottom },
  {
    value: 'at-depth-system',
    label: 'At Depth (⚙️ System)',
    position: PersonaPosition.AtDepth,
    role: 'system' as const,
  },
  {
    value: 'at-depth-user',
    label: 'At Depth (👤 User)',
    position: PersonaPosition.AtDepth,
    role: 'user' as const,
  },
  {
    value: 'at-depth-assistant',
    label: 'At Depth (🤖 Assistant)',
    position: PersonaPosition.AtDepth,
    role: 'assistant' as const,
  },
]

export function PersonaView({ personaId }: { personaId: string }) {
  const persona = usePersona(personaId)
  const updatePersona = useUpdatePersona()

  const defaultValues = useMemo(
    () => ({
      name: persona?.name ?? '',
      description: persona?.metadata.description ?? '',
      injectionPosition: persona?.metadata.injectionPosition ?? PersonaPosition.InPrompt,
      depth: persona?.metadata.depth,
      role: persona?.metadata.role,
    }),
    [persona],
  )

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [form, defaultValues])

  // Handle depth and role when injectionPosition is AtDepth
  const isPositionAtDepth = form.watch('injectionPosition') === PersonaPosition.AtDepth
  useEffect(() => {
    form.setValue('depth', isPositionAtDepth ? 2 : undefined)
  }, [isPositionAtDepth, form])

  // Handle form submission
  const onBlur = useCallback(async () => {
    if (!persona) return

    const { name, ...metadata } = form.getValues()

    await updatePersona(persona.id, {
      name,
      metadata,
    })
  }, [form, persona, updatePersona])

  if (!persona) {
    return null
  }

  return (
    <Form {...form}>
      <form onBlur={onBlur} className="flex flex-col gap-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-[100px]"
                          placeholder="{{user}} is a 28-year-old Romanian cat girl."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Injection Position */}
        <FormField
          control={form.control}
          name="injectionPosition"
          render={() => (
            <FormItem>
              <FormLabel>Injection Position</FormLabel>
              <Select
                value={(() => {
                  const pos = form.watch('injectionPosition')
                  const role = form.watch('role')
                  const found = positionOptions.find(
                    (opt) =>
                      opt.position === pos &&
                      (opt.position === PersonaPosition.AtDepth ? opt.role === role : true),
                  )
                  return found?.value ?? ''
                })()}
                onValueChange={(value) => {
                  const selectedOption = positionOptions.find((opt) => opt.value === value)
                  if (!selectedOption) return
                  form.setValue('injectionPosition', selectedOption.position)
                  if (selectedOption.position === PersonaPosition.AtDepth && selectedOption.role) {
                    form.setValue('role', selectedOption.role)
                  } else {
                    form.setValue('role', undefined)
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent side="top" className="z-6000">
                  {positionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Depth (only show when position is AtDepth) */}
        {isPositionAtDepth && (
          <FormField
            control={form.control}
            name="depth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Depth</FormLabel>
                <FormControl>
                  <NumberInput
                    min={0}
                    step={1}
                    value={field.value ?? 2}
                    onChange={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>
  )
}
