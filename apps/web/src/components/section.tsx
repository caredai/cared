import type { ReactNode } from 'react'

import { Separator } from '@cared/ui/components/separator'
import { SidebarTrigger } from '@cared/ui/components/sidebar'

export function Section({ children }: { children: ReactNode }) {
  return <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-14 space-y-8">{children}</div>
}

export function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col md:grid md:grid-cols-[min-content_min-content_max-content] md:items-center gap-x-4 md:-ml-11">
      <SidebarTrigger className="hidden md:flex" />

      <Separator orientation="vertical" className="hidden md:flex max-h-4" />

      <h1 className="text-2xl font-bold">{title}</h1>

      {description && <p className="col-start-3 text-muted-foreground">{description}</p>}
    </div>
  )
}
