import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}_/app_{$appIdNoPrefix}/flows')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/acc_$accountIdNoPrefix_/app_$appIdNoPrefix/flows"!</div>
}
