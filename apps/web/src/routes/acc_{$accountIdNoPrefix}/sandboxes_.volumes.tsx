import { createFileRoute } from '@tanstack/react-router'

import { VolumesPage } from '@/components/sandboxes'

export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}/sandboxes_/volumes',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <VolumesPage />
}
