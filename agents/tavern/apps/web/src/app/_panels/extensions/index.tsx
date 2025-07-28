import { useState } from 'react'
import { ChevronRightIcon } from 'lucide-react'

import { cn } from '@cared/ui/lib/utils'

import { RegexExtension } from './regex'
import { SummaryExtension } from './summary'

const extensions = [
  {
    id: 'summary',
    title: 'Summary',
    component: SummaryExtension,
  },
  {
    id: 'regex',
    title: 'Regex',
    component: RegexExtension,
  },
] as const

export function ExtensionsPanel() {
  const [selectedExtension, setSelectedExtension] = useState<string>('summary')

  const Component = extensions.find((ext) => ext.id === selectedExtension)?.component

  return (
    <div className="flex flex-col gap-4 mb-2">
      {/* Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold">Extensions</h1>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
        {/* Left side: Extension list */}
        <div className="flex flex-col gap-2 pr-2">
          {extensions.map(({ id, title }) => (
            <div
              key={id}
              className={cn(
                'flex items-center p-2 pr-1 rounded-md border border-border cursor-pointer hover:bg-muted relative',
                selectedExtension === id && 'justify-between border-ring',
              )}
              onClick={() => setSelectedExtension(id)}
            >
              <span className="font-medium text-sm truncate">{title}</span>
              {selectedExtension === id && <ChevronRightIcon className="w-3 h-3" />}
            </div>
          ))}
        </div>

        {/* Right side: Extension view */}
        {Component && <Component />}
      </div>
    </div>
  )
}
