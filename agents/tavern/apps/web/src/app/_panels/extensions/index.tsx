import { ChevronDownIcon } from 'lucide-react'

import { Button } from '@ownxai/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ownxai/ui/components/collapsible'
import { Label } from '@ownxai/ui/components/Label'

import { RegexExtension } from './regex'
import { SummaryExtension } from './summary'

const extensions = [
  {
    title: 'Summary',
    component: SummaryExtension,
  },
  {
    title: 'Regex',
    component: RegexExtension,
  },
] as const

export function ExtensionsPanel() {
  return (
    <>
      {extensions.map(({ title, component: Component }, index) => (
        <Collapsible key={index}>
          <CollapsibleTrigger asChild>
            <div className="flex justify-between items-center cursor-pointer [&[data-state=open]>button>svg]:rotate-180">
              <Label className="cursor-pointer text-lg">{title}</Label>
              <Button type="button" variant="outline" size="icon" className="size-6">
                <ChevronDownIcon className="transition-transform duration-200" />
              </Button>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden mt-2 p-2 rounded-sm border border-input">
            <Component />
          </CollapsibleContent>
        </Collapsible>
      ))}
    </>
  )
}
