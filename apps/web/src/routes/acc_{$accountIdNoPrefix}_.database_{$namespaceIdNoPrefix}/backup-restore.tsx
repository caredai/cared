import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/components/databases'
import { branchSearchSchema } from '@/components/databases/branch-search'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/backup-restore',
)({
  validateSearch: branchSearchSchema,
  component: () => (
    <PlaceholderPage
      title="Backup & Restore"
      description="Branch backups and point-in-time recovery"
    />
  ),
})
