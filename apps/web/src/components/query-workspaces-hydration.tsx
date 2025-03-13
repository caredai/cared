import { HydrateClient } from '@/trpc/server'
import { QueryWorkspaces } from './query-workspaces'

export function QueryWorkspacesHydration() {
  return (
    <HydrateClient>
      <QueryWorkspaces />
    </HydrateClient>
  )
}
