import { Workspaces } from './workspaces'
import { HydrateClient } from '@/orpc/client'

export default function Page() {
  return (
    <HydrateClient>
      <Workspaces />
    </HydrateClient>
  )
}
