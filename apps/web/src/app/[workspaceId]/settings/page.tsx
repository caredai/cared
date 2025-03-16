import { HydrateClient } from '@/trpc/server'
import { Settings } from './settings'

/**
 * Settings page for workspace management
 * Contains tabs for General settings and Members management
 */
export default function Page() {
  return (
    <HydrateClient>
      <Settings />
    </HydrateClient>
  )
}
