import { Credits } from '@/components/credits'
import { addIdPrefix } from '@/lib/utils'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId: organizationIdNoPrefix } = await params
  const organizationId = addIdPrefix(organizationIdNoPrefix, 'org')

  prefetch(
    trpc.credits.getCredits.queryOptions({
      organizationId,
    }),
  )

  return (
    <HydrateClient>
      <Credits organizationId={organizationId} />
    </HydrateClient>
  )
}
