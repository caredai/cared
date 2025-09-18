import { Settings } from './settings'
import { HydrateClient } from '@/orpc/client'

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
      <Settings />
    </HydrateClient>
  )
}
