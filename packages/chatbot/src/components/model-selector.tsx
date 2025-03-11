'use client'

import { startTransition, useMemo, useOptimistic, useState } from 'react'
import { useAsync } from 'react-use'

import { getLanguageModelInfos } from '@mindworld/providers'
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

  const { value: languageModels } = useAsync(getLanguageModelInfos, [])

  const selectedChatModel = useMemo(
    () => languageModels?.find((model) => model.id === optimisticModelId),
    [optimisticModelId, languageModels],
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
          {selectedChatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {languageModels?.map((chatModel) => {
          const { id } = chatModel

          return (
            <DropdownMenuItem
              key={id}
              onSelect={() => {
                setOpen(false)

                startTransition(() => {
                  setOptimisticModelId(id)
                  setModelId(id)
                })
              }}
              className="gap-4 group/item flex flex-row justify-between items-center"
              data-active={id === optimisticModelId}
            >
              <div className="flex flex-col gap-1 items-start">
                <div>{chatModel.name}</div>
                <div className="text-xs text-muted-foreground">{chatModel.description}</div>
              </div>

              <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                <CheckCircleFillIcon />
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
