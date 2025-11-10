import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}_/app_{$appIdNoPrefix}/configure/api-tokens')({
  component: ApiKeysPage,
})

function ApiKeysPage() {
  return <></>
}
