import { QueryWorkspacesHydration } from '@/components/query-workspaces-hydration'
import { prefetch, trpc } from '@/trpc/server'

export default function Page() {
  prefetch(trpc.user.me.queryOptions())
  prefetch(trpc.workspace.list.queryOptions())

  return (
    <>
      <QueryWorkspacesHydration />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {Array.from({ length: 24 }).map((_, index) => (
          <div key={index} className="aspect-video h-12 w-full rounded-lg bg-muted/50" />
        ))}
      </div>
    </>
  )
}
