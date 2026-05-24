import { createFileRoute } from '@tanstack/react-router'

import { BranchAuth, PlaceholderPage } from '@/components/databases'
import { branchSearchSchema } from '@/components/databases/branch-search'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/auth',
)({
  validateSearch: branchSearchSchema,
  component: DatabaseAuthPage,
})

function DatabaseAuthPage() {
  const { namespaceId } = Route.useRouteContext()
  const { branch: branchId } = Route.useSearch()

  if (!branchId) {
    return <PlaceholderPage title="Auth" description="Select a branch to manage access." />
  }

  return <BranchAuth namespaceId={namespaceId} branchId={branchId} />
}
