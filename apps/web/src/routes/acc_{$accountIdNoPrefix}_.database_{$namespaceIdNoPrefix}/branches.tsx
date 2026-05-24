import { createFileRoute } from '@tanstack/react-router'

import { NamespaceBranches } from '@/components/databases'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/branches',
)({
  component: DatabaseBranchesPage,
})

function DatabaseBranchesPage() {
  const { namespaceId } = Route.useRouteContext()

  return <NamespaceBranches namespaceId={namespaceId} />
}
