import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/components/databases'
import { branchSearchSchema } from '@/components/databases/branch-search'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/data-masking',
)({
  validateSearch: branchSearchSchema,
  component: () => (
    <PlaceholderPage title="Data Masking" description="Mask sensitive branch data" />
  ),
})
