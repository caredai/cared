import { createFileRoute } from '@tanstack/react-router'

import { BranchBackupRestore, PlaceholderPage } from '@/components/databases'
import { branchSearchSchema } from '@/components/databases/branch-search'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/backup-restore',
)({
  validateSearch: branchSearchSchema,
  component: DatabaseBackupRestorePage,
})

function DatabaseBackupRestorePage() {
  const { namespaceId } = Route.useRouteContext()
  const { branch: branchId } = Route.useSearch()

  if (!branchId) {
    return (
      <PlaceholderPage
        title="Backup & Restore"
        description="Select a branch to restore from history."
      />
    )
  }

  return <BranchBackupRestore namespaceId={namespaceId} branchId={branchId} />
}
