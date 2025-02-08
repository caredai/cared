'use client'

import { startTransition, useMemo, useOptimistic, useState } from 'react'

import { languageModelInfos } from '@mindworld/providers'
import { Button } from '@mindworld/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@mindworld/ui/components/dropdown-menu'

import { cn } from '@/lib/utils'
import { CheckCircleFillIcon, ChevronDownIcon } from './icons'

export function ModelSelector({
  modelId,
  setModelId,
  className,
}: {
  modelId: string
  setModelId: (modelId: string) => void
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false)
  const [optimisticModelId, setOptimisticModelId] = useOptimistic(modelId)

  const selectedModel = useMemo(
    () => languageModelInfos.find((model) => model.id === optimisticModelId),
    [optimisticModelId],
  )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button variant="outline" className="md:px-2 md:h-[34px]">
          {selectedModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {languageModelInfos.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onSelect={() => {
              setOpen(false)

              startTransition(() => {
                setOptimisticModelId(model.id)
                setModelId(model.id)
              })
            }}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={model.id === optimisticModelId}
          >
            <div className="flex flex-col gap-1 items-start">
              {model.name}
              {model.description && (
                <div className="text-xs text-muted-foreground">{model.description}</div>
              )}
            </div>
            <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
