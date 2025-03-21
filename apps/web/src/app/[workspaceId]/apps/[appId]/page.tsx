import { prefetch, trpc } from '@/trpc/server'
import { App } from './app'

export default async function Page({
  params,
}: {
  params: Promise<{
    appId: string
  }>
}) {
  const { appId } = await params

  prefetch(
    trpc.app.byId.queryOptions({
      id: appId,
    }),
  )

  return <App appId={appId} />
}
