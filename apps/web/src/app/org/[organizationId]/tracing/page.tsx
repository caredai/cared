import { TracingWithSelector } from '@/components/tracing'
import { addIdPrefix } from '@/lib/utils'
import { HydrateClient } from '@/trpc/server'

export default async function OrganizationTracingPage({
  params,
}: {
  params: Promise<{ organizationId: string }>
}) {
  const { organizationId: organizationIdNoPrefix } = await params
  const organizationId = addIdPrefix(organizationIdNoPrefix, 'org')

  return (
    <HydrateClient>
      <TracingWithSelector scope="organization" organizationId={organizationId} />
    </HydrateClient>
  )
}
