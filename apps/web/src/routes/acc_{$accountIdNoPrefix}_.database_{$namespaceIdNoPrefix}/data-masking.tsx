import { createFileRoute } from '@tanstack/react-router'

import { BranchDataMasking, PlaceholderPage } from '@/components/databases'
import { branchSearchSchema } from '@/components/databases/branch-search'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/data-masking',
)({
  validateSearch: branchSearchSchema,
  component: DatabaseDataMaskingPage,
})

function DatabaseDataMaskingPage() {
  const { namespaceIdNoPrefix } = Route.useParams()
  const { branch: branchId } = Route.useSearch()
  const namespaceId = `neon_${namespaceIdNoPrefix}`

  if (!branchId) {
    return <PlaceholderPage title="Data Masking" description="Select a branch to manage masking." />
  }

  return <BranchDataMasking namespaceId={namespaceId} branchId={branchId} />
}
