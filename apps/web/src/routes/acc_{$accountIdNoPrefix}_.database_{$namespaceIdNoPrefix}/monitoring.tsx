import { createFileRoute } from '@tanstack/react-router'

import { BranchMonitoring, PlaceholderPage } from '@/components/databases'
import { branchSearchSchema } from '@/components/databases/branch-search'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/monitoring',
)({
  validateSearch: branchSearchSchema,
  component: DatabaseMonitoringPage,
})

function DatabaseMonitoringPage() {
  const { namespaceId } = Route.useRouteContext()
  const { branch: branchId } = Route.useSearch()

  if (!branchId) {
    return <PlaceholderPage title="Monitoring" description="Select a branch to view metrics." />
  }

  return <BranchMonitoring namespaceId={namespaceId} branchId={branchId} />
}
