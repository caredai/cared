import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/components/databases'
import { branchSearchSchema } from '@/components/databases/branch-search'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/data-api',
)({
  validateSearch: branchSearchSchema,
  component: () => (
    <PlaceholderPage title="Data API" description="REST and GraphQL access for the branch" />
  ),
})
