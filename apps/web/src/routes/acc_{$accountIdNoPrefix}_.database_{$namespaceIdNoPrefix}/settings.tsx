import { createFileRoute } from '@tanstack/react-router'

import { NamespaceSettings } from '@/components/databases'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/settings',
)({
  component: DatabaseSettingsPage,
})

function DatabaseSettingsPage() {
  const { accountIdNoPrefix, namespaceId } = Route.useRouteContext()

  return <NamespaceSettings namespaceId={namespaceId} accountIdNoPrefix={accountIdNoPrefix} />
}
