import { createFileRoute } from '@tanstack/react-router'

import { SnapshotsPage } from '@/components/sandboxes'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/sandboxes_/snapshots')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SnapshotsPage />
}
