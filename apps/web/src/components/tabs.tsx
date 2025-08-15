import * as React from 'react'

import {
  Tabs as Tabs_,
  TabsList as TabsList_,
  TabsTrigger as TabsTrigger_,
} from '@cared/ui/components/tabs'
import { cn } from '@cared/ui/lib/utils'

export function Tabs({ className, ...props }: React.ComponentProps<typeof Tabs_>) {
  return (
    <Tabs_ defaultValue="preview" className={cn('relative mr-auto w-full', className)} {...props} />
  )
}

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsList_>) {
  return (
    <TabsList_
      className={cn('w-full justify-start rounded-none border-b bg-transparent p-0', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsTrigger_>) {
  return (
    <TabsTrigger_
      className={cn(
        'flex-none relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none',
        className,
      )}
      {...props}
    />
  )
}

export { TabsContent } from '@cared/ui/components/tabs'
