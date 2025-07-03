import type { VListHandle } from 'virtua'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { faClone, faCrown, faLock, faSkull, faUnlock } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { zodResolver } from '@hookform/resolvers/zod'
import { PersonaPosition } from '@tavern/core'
import { useForm } from 'react-hook-form'
import { VList } from 'virtua'
import { z } from 'zod/v4'

import { Button } from '@ownxai/ui/components/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@ownxai/ui/components/form'
import { Input } from '@ownxai/ui/components/input'
import { Label } from '@ownxai/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'
import { Textarea } from '@ownxai/ui/components/textarea'
import { cn } from '@ownxai/ui/lib/utils'

import { useClearAllFlags } from '@/app/_panels/character-management/hooks'
import { CharacterAvatar, CharacterGroupAvatar } from '@/components/avatar'
import { FaButton } from '@/components/fa-button'
import { NumberInput } from '@/components/number-input'
import {
  isCharacter,
  useActiveCharacterOrGroup,
  useCharactersAndGroups,
  useSetActiveCharacterOrGroup,
} from '@/hooks/use-character-or-group'
import { useActiveChat } from '@/hooks/use-chat'
import { useLinkPersona, usePersona, useUnlinkPersona, useUpdatePersona } from '@/hooks/use-persona'
import { usePersonaSettings, useUpdatePersonaSettings } from '@/hooks/use-settings'
import { DeletePersonaDialog } from './delete-persona-dialog'
import { DuplicatePersonaDialog } from './duplicate-persona-dialog'

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
  const linkPersona = useLinkPersona()
  const unlinkPersona = useUnlinkPersona()

  // Get current active character/group and chat
  const activeCharacterOrGroup = useActiveCharacterOrGroup()
  const { activeChat } = useActiveChat()

  // Get persona settings
  const personaSettings = usePersonaSettings()
  const updatePersonaSettings = useUpdatePersonaSettings()

  const charsAndGroups = useCharactersAndGroups()

  // Get linked characters and groups
  const linkedCharsOrGroups = useMemo(() => {
    if (!persona) return []

    return charsAndGroups.filter(
      (item) => persona.characters.includes(item.id) || persona.groups.includes(item.id),
    )
  }, [persona, charsAndGroups])

  const vlistRef = useRef<VListHandle>(null)

  // Handle mouse wheel horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    vlistRef.current?.scrollBy(e.deltaY)
  }

  const setActiveCharacterOrGroup = useSetActiveCharacterOrGroup()
  const clearAllFlags = useClearAllFlags()

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

    if (!(await form.trigger())) {
      return
    }

    const { name, ...metadata } = form.getValues()

    await updatePersona(persona.id, {
      name,
      metadata,
    })
  }, [form, persona, updatePersona])

  // Handle Default button click
  const handleDefaultClick = useCallback(async () => {
    if (!persona) return

    const isDefault = personaSettings.default === persona.id
    if (isDefault) {
      await updatePersonaSettings({
        default: undefined,
      })
    } else {
      await updatePersonaSettings({
        default: persona.id,
      })
    }
  }, [persona, personaSettings.default, updatePersonaSettings])

  // Handle Character button click
  const handleCharacterClick = useCallback(async () => {
    if (!persona || !activeCharacterOrGroup) return

    const isLinked =
      persona.characters.includes(activeCharacterOrGroup.id) ||
      persona.groups.includes(activeCharacterOrGroup.id)

    if (isLinked) {
      // Unlink from character/group
      if (persona.characters.includes(activeCharacterOrGroup.id)) {
        await unlinkPersona(persona.id, { characterId: activeCharacterOrGroup.id })
      } else {
        await unlinkPersona(persona.id, { groupId: activeCharacterOrGroup.id })
      }
    } else {
      // Link to character/group
      if (isCharacter(activeCharacterOrGroup)) {
        await linkPersona(persona.id, { characterId: activeCharacterOrGroup.id })
      } else {
        await linkPersona(persona.id, { groupId: activeCharacterOrGroup.id })
      }
    }
  }, [persona, activeCharacterOrGroup, linkPersona, unlinkPersona])

  // Handle Chat button click
  const handleChatClick = useCallback(async () => {
    if (!persona || !activeChat) return

    const isLinked = persona.chats.includes(activeChat.id)

    if (isLinked) {
      // Unlink from chat
      await unlinkPersona(persona.id, { chatId: activeChat.id })
    } else {
      // Link to chat
      await linkPersona(persona.id, { chatId: activeChat.id })
    }
  }, [persona, activeChat, linkPersona, unlinkPersona])

  // Check button states
  const isDefault = personaSettings.default === personaId
  const isCharacterLinked =
    activeCharacterOrGroup &&
    (persona?.characters.includes(activeCharacterOrGroup.id) ||
      persona?.groups.includes(activeCharacterOrGroup.id))
  const isChatLinked = activeChat && persona?.chats.includes(activeChat.id)

  const operateActions = [
    {
      icon: faClone,
      tooltip: 'Duplicate Persona',
      wrapper: DuplicatePersonaDialog,
    },
    {
      icon: faSkull,
      tooltip: 'Delete Persona',
      className: 'bg-destructive/50 hover:bg-destructive',
      wrapper: DeletePersonaDialog,
    },
  ]

  if (!persona) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-[1px]">
      {/* Header with action buttons */}
      <div className="flex flex-row justify-between items-center gap-4">
        <h2 className="font-semibold text-xl text-muted-foreground truncate">{persona.name}</h2>

        <div className="flex flex-row flex-wrap justify-end gap-1">
          {operateActions.map(({ icon, tooltip, className, wrapper: Wrapper }, index) => {
            const btn = (
              <FaButton
                key={index}
                icon={icon}
                btnSize="size-7"
                iconSize="1x"
                title={tooltip}
                className={cn(
                  'text-foreground border-1 hover:bg-muted-foreground rounded-sm',
                  className,
                )}
              />
            )

            return <Wrapper key={index} trigger={btn} persona={persona} />
          })}
        </div>
      </div>

      {/* Form */}
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
                  <Textarea
                    {...field}
                    className="min-h-[100px]"
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
                    if (
                      selectedOption.position === PersonaPosition.AtDepth &&
                      selectedOption.role
                    ) {
                      form.setValue('role', selectedOption.role)
                    } else {
                      form.setValue('role', undefined)
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="mb-0">
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

      {/* Action Buttons */}
      <div className="flex flex-col gap-1">
        <Label>Connections</Label>
        <div className="flex flex-row flex-wrap gap-2">
          {/* Default Button */}
          <Button
            variant="outline"
            size="sm"
            title="Click to select this as default persona for the new chats. Click again to remove it."
            className={cn(
              'transition-colors',
              isDefault &&
                'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-600 hover:text-yellow-400 border-yellow-500/30',
            )}
            onClick={handleDefaultClick}
          >
            <FontAwesomeIcon icon={faCrown} size="lg" className="fa-fw" />
            Default
          </Button>

          {/* Character Button */}
          <Button
            variant="outline"
            size="sm"
            title="Click to lock your selected persona to the current character. Click again to remove the lock."
            className={cn(
              'transition-colors',
              isCharacterLinked &&
                'bg-green-500/20 hover:bg-green-500/30 text-green-600 hover:text-green-400 border-green-500/30',
            )}
            onClick={handleCharacterClick}
            disabled={!activeCharacterOrGroup}
          >
            <FontAwesomeIcon
              icon={isCharacterLinked ? faLock : faUnlock}
              size="lg"
              className="fa-fw"
            />
            Character
          </Button>

          {/* Chat Button */}
          <Button
            variant="outline"
            size="sm"
            title="Click to lock your selected persona to the current chat. Click again to remove the lock."
            className={cn(
              'transition-colors',
              isChatLinked &&
                'bg-amber-700/20 hover:bg-amber-700/30 text-amber-700 hover:text-amber-600 border-amber-700/30',
            )}
            onClick={handleChatClick}
            disabled={!activeChat}
          >
            <FontAwesomeIcon icon={isChatLinked ? faLock : faUnlock} size="lg" className="fa-fw" />
            Chat
          </Button>
        </div>
      </div>

      {/* Linked Characters and Groups */}
      {linkedCharsOrGroups.length > 0 && (
        <VList
          horizontal
          count={linkedCharsOrGroups.length}
          className="h-15 no-scrollbar"
          style={{
            height: '60px',
          }}
          ref={vlistRef}
          onWheel={handleWheel}
        >
          {linkedCharsOrGroups.map((item) => {
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-center',
                )}
                onClick={() => {
                  setActiveCharacterOrGroup(item.id)
                  clearAllFlags()
                }}
              >
                {isCharacter(item) ? (
                  <CharacterAvatar src={item.metadata.url} alt={item.content.data.name} />
                ) : (
                  <CharacterGroupAvatar
                    src={item.metadata.imageUrl}
                    characterAvatars={item.characters.map((c) => c.metadata.url)}
                    alt={item.metadata.name}
                  />
                )}
              </div>
            )
          })}
        </VList>
      )}
    </div>
  )
}
