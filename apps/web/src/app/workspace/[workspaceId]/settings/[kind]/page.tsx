import { HydrateClient } from '@/trpc/server'
import { Settings } from './settings'

export default async function Page({
  params,
}: {
  params: Promise<{
    kind: string
  }>
}) {
  const { kind } = await params

  return (
    <HydrateClient>
      <Settings kind={kind} />
    </HydrateClient>
  )
}
