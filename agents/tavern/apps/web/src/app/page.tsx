import { Content } from '@/app/content'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

export default function Page() {
  prefetch(trpc.user.session.queryOptions())

  return (
    <HydrateClient>
      <Content />
    </HydrateClient>
  )
}
