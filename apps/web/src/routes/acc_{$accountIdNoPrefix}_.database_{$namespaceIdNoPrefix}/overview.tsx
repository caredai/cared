import { createFileRoute } from '@tanstack/react-router'

import { BranchOverview, BranchOverviewEmpty } from '@/components/databases/branch-overview'
import { branchSearchSchema } from '@/components/databases/branch-search'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/overview',
)({
  validateSearch: branchSearchSchema,
  loaderDeps: ({ search }) => ({ branchId: search.branch }),
  loader: async ({ context, deps }) => {
    const { namespaceId } = context
    const branchId = deps.branchId
    if (!branchId) return

    await Promise.all([
      context.queryClient.ensureQueryData(
        orpc.account.database.getBranch.queryOptions({
          input: { namespaceId, branchId },
        }),
      ),
      context.queryClient.ensureQueryData(
        orpc.account.database.listBranchEndpoints.queryOptions({
          input: { namespaceId, branchId },
        }),
      ),
      context.queryClient.ensureQueryData(
        orpc.account.database.listRoles.queryOptions({
          input: { namespaceId, branchId },
        }),
      ),
      context.queryClient.ensureQueryData(
        orpc.account.database.listDatabases.queryOptions({
          input: { namespaceId, branchId },
        }),
      ),
    ])
  },
  component: BranchOverviewPage,
})

function BranchOverviewPage() {
  const { accountIdNoPrefix, namespaceIdNoPrefix, namespaceId } = Route.useRouteContext()
  const { branch: branchId } = Route.useSearch()

  if (!branchId) {
    return <BranchOverviewEmpty />
  }

  return (
    <BranchOverview
      namespaceId={namespaceId}
      accountIdNoPrefix={accountIdNoPrefix}
      namespaceIdNoPrefix={namespaceIdNoPrefix}
      branchId={branchId}
    />
  )
}
