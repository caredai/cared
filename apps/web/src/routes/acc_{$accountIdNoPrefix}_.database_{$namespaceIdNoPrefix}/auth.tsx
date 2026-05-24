import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/components/databases'
import { branchSearchSchema } from '@/components/databases/branch-search'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/auth',
)({
  validateSearch: branchSearchSchema,
  component: () => <PlaceholderPage title="Auth" description="Branch roles and authentication" />,
})
