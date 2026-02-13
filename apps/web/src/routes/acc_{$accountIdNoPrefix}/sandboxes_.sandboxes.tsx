import { createFileRoute } from '@tanstack/react-router'

import { SandboxesPage } from '@/components/sandboxes'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}/sandboxes_/sandboxes',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <SandboxesPage />
}
