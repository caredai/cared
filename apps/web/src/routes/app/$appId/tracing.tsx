import { createFileRoute } from '@tanstack/react-router'

import { Tracing } from '@/components/tracing'
import { addIdPrefix } from '@/lib/utils'

export const Route = createFileRoute('/app/$appId/tracing')({
  component: TracingPage,
})

function TracingPage() {
  const { appIdNoPrefix } = Route.useRouteContext()
  const appId = addIdPrefix(appIdNoPrefix, 'app')

  return <Tracing scope="app" appId={appId} />
}
