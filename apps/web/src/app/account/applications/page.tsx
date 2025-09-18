
import { Applications } from './applications'
import { orpc, prefetch } from '@/orpc/client'

export default function Page() {
  prefetch(orpc.user.oauthApps.queryOptions())

  return <Applications />
}
