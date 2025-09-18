import { addIdPrefix } from '@/lib/utils'
import { App } from './app'
import { HydrateClient } from '@/orpc/client'

export default async function Page({
  params,
}: {
  params: Promise<{
    appId: string
  }>
}) {
  const { appId: appIdNoPrefix } = await params
  const appId = addIdPrefix(appIdNoPrefix, 'app')

  return (
    <HydrateClient>
      <App appId={appId} />
    </HydrateClient>
  )
}
