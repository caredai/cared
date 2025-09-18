import { Expenses } from '@/components/expenses'
import { addIdPrefix } from '@/lib/utils'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId: organizationIdNoPrefix } = await params
  const organizationId = addIdPrefix(organizationIdNoPrefix, 'org')

  prefetch(orpc.model.listProviders.queryOptions())
  prefetch(orpc.model.listModels.queryOptions({
    organizationId
  }))

  return (
    <HydrateClient>
      <Expenses organizationId={organizationId} />
    </HydrateClient>
  )
}
