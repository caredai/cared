import { prefetch, trpc } from '@/trpc/server'
import { Applications } from './applications'

export default function Page() {
  prefetch(trpc.user.oauthApps.queryOptions())

  return <Applications />
}
