import type { UseControllerProps } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
} from '@cared/ui/components/combobox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cared/ui/components/form'
import { Virtualized, VirtualizedVirtualizer } from '@cared/ui/components/virtualized'

interface ModelSelectProps<
  TFieldValues extends {
    languageModel: string
    embeddingModel: string
    imageModel: string
  },
> {
  name: 'languageModel' | 'embeddingModel' | 'imageModel'
  label: string
  description: string
  groups: Group[]
  control: UseControllerProps<TFieldValues>['control']
  defaultValue?: string
}

interface Group {
  label: string
  items: Item[]
}

interface Item {
  label: string
  value: string
}

/**
 * A reusable model selection component for forms
 * Displays a combobox dropdown with a virtualized list of model options
 * Includes search functionality to filter models by label or value
 */
export function ModelSelect<
  TFieldValues extends {
    languageModel: string
    embeddingModel: string
    imageModel: string
  },
>({ name, label, description, groups, control, defaultValue }: ModelSelectProps<TFieldValues>) {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    for (const group of groups) {
      const item = group.items.find((item) => item.value === defaultValue)
      if (item) {
        setInputValue(item.label)
      }
    }
  }, [groups, defaultValue])

  const filtered = useMemo(() => {
    if (!inputValue) {
      return groups
    }

    const lowerSearchTerm = inputValue.toLowerCase()

    const filteredGroup: Group[] = []
    for (const group of groups) {
      if (group.label.toLowerCase().includes(lowerSearchTerm)) {
        filteredGroup.push(group)
      } else {
        const filteredItems: Item[] = []
        for (const item of group.items) {
          if (item.label.toLowerCase().includes(lowerSearchTerm)) {
            filteredItems.push(item)
          }
        }
        if (filteredItems.length) {
          filteredGroup.push({ ...group, items: filteredItems })
        }
      }
    }
    return filteredGroup
  }, [groups, inputValue])

  return (
    <FormField
      control={control as any}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Combobox
            type="single"
            open={open}
            onOpenChange={setOpen}
            value={field.value}
            onValueChange={field.onChange}
            inputValue={inputValue}
            onInputValueChange={setInputValue}
            shouldFilter={false}
            modal={true}
          >
            <FormControl>
              <ComboboxInput placeholder={`Search ${label.toLowerCase()}...`} />
            </FormControl>
            <Virtualized asChild>
              <ComboboxContent>
                {filtered.length === 0 && <ComboboxEmpty>No models found.</ComboboxEmpty>}
                {filtered.length > 0 && (
                  <ComboboxGroup>
                    <VirtualizedVirtualizer startMargin={32}>
                      {filtered.flatMap((group) => [
                        <div
                          key={group.label}
                          className="px-2 py-1.5 text-sm font-semibold text-muted-foreground"
                        >
                          {group.label}
                        </div>,
                        ...group.items.map((item) => (
                          <ComboboxItem
                            key={item.value}
                            value={item.value}
                            className="cursor-pointer"
                          >
                            {item.label}
                          </ComboboxItem>
                        )),
                      ])}
                    </VirtualizedVirtualizer>
                  </ComboboxGroup>
                )}
              </ComboboxContent>
            </Virtualized>
          </Combobox>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
