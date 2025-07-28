import { ChevronDownIcon, HelpCircle } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cared/ui/components/collapsible'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@cared/ui/components/form'
import { RadioGroup, RadioGroupItem } from '@cared/ui/components/radio-group'

import { Tooltip } from '@/components/tooltip'

export function RadioGroupField({
  label,
  tooltip,
  name,
  control,
  options,
  description,
}: {
  label: string
  tooltip?: string
  name: string
  control: any
  options: { value: string; label: string; description?: string }[]
  description?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col space-y-2">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="flex justify-between items-center cursor-pointer [&[data-state=open]>button>svg]:rotate-180">
                <FormLabel className="cursor-pointer">
                  <div className="flex items-center gap-1">
                    {label}
                    {tooltip && <Tooltip content={tooltip} icon={HelpCircle} />}
                  </div>
                </FormLabel>
                <Button type="button" variant="outline" size="icon" className="size-6">
                  <ChevronDownIcon className="transition-transform duration-200" />
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden flex flex-col gap-2 pt-2">
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-col gap-1.5"
                >
                  {options.map((option) => (
                    <FormItem key={option.value} className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem className="border-ring" value={option.value} />
                      </FormControl>
                      <div className="flex flex-col gap-1 leading-none">
                        <FormLabel className="font-normal">{option.label}</FormLabel>
                        {option.description && (
                          <FormDescription>{option.description}</FormDescription>
                        )}
                      </div>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              {description && <FormDescription>{description}</FormDescription>}
            </CollapsibleContent>
          </Collapsible>
        </FormItem>
      )}
    />
  )
}
