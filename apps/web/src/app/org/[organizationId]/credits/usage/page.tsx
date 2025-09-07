import { Expenses } from '@/components/expenses'
import { addIdPrefix } from '@/lib/utils'
import { HydrateClient } from '@/trpc/server'

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId: organizationIdNoPrefix } = await params
  const organizationId = addIdPrefix(organizationIdNoPrefix, 'org')

  return (
    <HydrateClient>
      <Expenses organizationId={organizationId} />
    </HydrateClient>
  )
}
