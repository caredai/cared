import { createFileRoute } from '@tanstack/react-router'

import { NamespaceDashboard } from '@/components/databases'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/dashboard',
)({
  component: DatabaseDashboardPage,
})

function DatabaseDashboardPage() {
  const { accountIdNoPrefix, namespaceIdNoPrefix, namespaceId } = Route.useRouteContext()

  return (
    <NamespaceDashboard
      namespaceId={namespaceId}
      accountIdNoPrefix={accountIdNoPrefix}
      namespaceIdNoPrefix={namespaceIdNoPrefix}
    />
  )
}
