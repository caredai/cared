import { createFileRoute } from '@tanstack/react-router'

import { SitesPage } from '@/components/sites'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/sites')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.account.site.listCaredSites.queryOptions())
    void context.queryClient.prefetchQuery(orpc.account.site.listRegions.queryOptions())
  },
  component: SitesPage,
})
