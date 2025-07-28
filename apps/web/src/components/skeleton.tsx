import { Skeleton } from '@cared/ui/components/skeleton'
import { cn } from '@cared/ui/lib/utils'

export function SkeletonCard() {
  const color = 'bg-gray-100 dark:bg-stone-800'

  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className={cn('h-[125px] w-full rounded-xl ', color)} />
      <div className="space-y-2">
        <Skeleton className={cn('h-4 w-full', color)} />
        <Skeleton className={cn('h-4 w-2/3', color)} />
      </div>
    </div>
  )
}
