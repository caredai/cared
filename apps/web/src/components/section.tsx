import type { ReactElement, ReactNode } from 'react'
import { Suspense } from 'react'

import type { BreadcrumbProps } from '@cared/ui/components/breadcrumb'
import { Separator } from '@cared/ui/components/separator'
import { SidebarTrigger } from '@cared/ui/components/sidebar'

import { SkeletonCard } from '@/components/skeleton'

export function Section({ children }: { children: ReactNode }) {
  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-14 space-y-8">
      <Suspense fallback={<SkeletonCard />}>{children}</Suspense>
    </div>
  )
}

export function SectionTitle({
  title,
  description,
  breadcrumb,
}: {
  title?: ReactNode
  description?: ReactNode
  breadcrumb?: ReactElement<BreadcrumbProps>
}) {
  return (
    <div className="flex flex-col md:grid md:grid-cols-[min-content_min-content_1fr] md:items-center gap-x-4 gap-y-1 md:-ml-11">
      <SidebarTrigger className="hidden md:flex" />

      <Separator orientation="vertical" className="hidden md:flex max-h-4" />

      <div className="col-start-3 min-w-0 space-y-1">
        {breadcrumb}
        {title && (
          <h1 className="text-2xl font-bold flex items-center gap-2 min-w-0">{title}</h1>
        )}
        {description && <div className="text-muted-foreground line-clamp-3">{description}</div>}
      </div>
    </div>
  )
}
