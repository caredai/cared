import type { Character } from '@/hooks/use-character'
import type { CharacterGroup } from '@/hooks/use-character-group'
import type { CharGroupMetadata } from '@tavern/core'
import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { charGroupMetadataSchema, GroupActivationStrategy, GroupGenerationMode } from '@tavern/core'
import { ChevronDownIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Virtualizer } from 'virtua'

import { Button } from '@ownxai/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ownxai/ui/components/collapsible'
import { Form, FormLabel } from '@ownxai/ui/components/form'

import { useCharacters } from '@/hooks/use-character'
import { CharacterGroupItem } from './character-group-item'

export function CharacterGroupView({ group }: { group?: CharacterGroup }) {
  const isCreate = !!group

  const defaultMetadata: CharGroupMetadata = useMemo(() => {
    return (
      group?.metadata ?? {
        name: '',
        activationStrategy: GroupActivationStrategy.Natural,
        generationMode: GroupGenerationMode.Swap,
        allowSelfResponses: false,
        hideMutedSprites: false,
        chatMetadata: {},
        disabledCharacters: [],
      }
    )
  }, [group])

  const metadataForm = useForm({
    resolver: zodResolver(charGroupMetadataSchema),
    defaultValues: defaultMetadata,
  })

  const { characters } = useCharacters()

  const [currentMembers, setCurrentMembers] = useState<Character[]>([])

  useEffect(() => {
    setCurrentMembers(group?.characters ?? [])
  }, [group])

  const addableChars = useMemo(() => {
    const members = new Set(currentMembers.map((c) => c.id))
    return characters.filter((c) => !members.has(c.id))
  }, [characters, currentMembers])

  // Handle character selection
  const handleSelect = (char: Character) => {
    // TODO: Implement character selection logic
  }

  // Handle character trigger
  const handleTrigger = (char: Character) => {
    // TODO: Implement character trigger logic
  }

  // Handle character add
  const handleAdd = (char: Character) => {
    setCurrentMembers((prev) => [...prev, char])
  }

  // Handle character removal
  const handleRemove = (char: Character) => {
    setCurrentMembers((prev) => prev.filter((c) => c.id !== char.id))
  }

  // Handle toggle disabled
  const handleToggleDisabled = (char: Character) => {
    const disabledChars = metadataForm.getValues('disabledCharacters') ?? []
    const isDisabled = disabledChars.includes(char.id)

    if (isDisabled) {
      metadataForm.setValue(
        'disabledCharacters',
        disabledChars.filter((id) => id !== char.id),
      )
    } else {
      metadataForm.setValue('disabledCharacters', [...disabledChars, char.id])
    }
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-[1px]">
      <Virtualizer>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <div className="flex justify-between items-center cursor-pointer [&[data-state=open]>button>svg]:rotate-180">
              <FormLabel className="cursor-pointer">Group Controls</FormLabel>
              <Button type="button" variant="outline" size="icon" className="size-6">
                <ChevronDownIcon className="transition-transform duration-200" />
              </Button>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden flex flex-col gap-2 pt-2">
            <Form {...metadataForm}>
              <form onBlur={() => {}}></form>
            </Form>
          </CollapsibleContent>
        </Collapsible>

        <CollapsibleHeader title="Current Members" />

        {currentMembers.map((char) => (
          <CharacterGroupItem
            key={char.id}
            character={char}
            disabled={metadataForm.watch('disabledCharacters')?.includes(char.id)}
            onToggleDisabled={() => handleToggleDisabled(char)}
            onTrigger={() => handleTrigger(char)}
            onSelect={() => handleSelect(char)}
            onRemove={() => handleRemove(char)}
          />
        ))}

        <CollapsibleHeader title="Add Members" />

        {addableChars.map((char) => (
          <CharacterGroupItem
            key={char.id}
            character={char}
            onSelect={() => handleSelect(char)}
            onAdd={() => handleAdd(char)}
          />
        ))}
      </Virtualizer>
    </div>
  )
}

function CollapsibleHeader({ title }: { title: string }) {
  return (
    <div className="flex justify-between items-center cursor-pointer [&[data-state=open]>button>svg]:rotate-180">
      <span className="text-sm">{title}</span>
      <Button type="button" variant="outline" size="icon" className="size-6">
        <ChevronDownIcon className="transition-transform duration-200" />
      </Button>
    </div>
  )
}
