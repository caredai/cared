import { Credits } from '@/components/credits'
import { addIdPrefix } from '@/lib/utils'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId: organizationIdNoPrefix } = await params
  const organizationId = addIdPrefix(organizationIdNoPrefix, 'org')

  prefetch(
    orpc.credits.getCredits.queryOptions({
      organizationId,
    }),
  )

  return (
    <HydrateClient>
      <Credits organizationId={organizationId} />
    </HydrateClient>
  )
}
