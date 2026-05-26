import { createFileRoute } from '@tanstack/react-router'

import { BranchDataApi, PlaceholderPage } from '@/components/databases'
import { branchSearchSchema } from '@/components/databases/branch-search'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/data-api',
)({
  validateSearch: branchSearchSchema,
  component: DatabaseDataApiPage,
})

function DatabaseDataApiPage() {
  const { namespaceId } = Route.useRouteContext()
  const { accountIdNoPrefix, namespaceIdNoPrefix } = Route.useParams()
  const { branch: branchId } = Route.useSearch()

  if (!branchId) {
    return (
      <PlaceholderPage title="Data API" description="Select a branch to manage the Data API." />
    )
  }

  return (
    <BranchDataApi
      namespaceId={namespaceId}
      branchId={branchId}
      accountIdNoPrefix={accountIdNoPrefix}
      namespaceIdNoPrefix={namespaceIdNoPrefix}
    />
  )
}
