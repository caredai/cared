import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceId/datasets')({
  component: DatasetsPage,
})

function DatasetsPage() {
  return <div></div>
}
