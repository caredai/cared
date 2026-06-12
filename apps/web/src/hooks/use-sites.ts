import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { RouterInputs, RouterOutputs } from '@cared/api'

import { orpc } from '@/lib/orpc'

export type CaredSite = RouterOutputs['account']['site']['listCaredSites']['sites'][number]
export type SiteRegion = RouterOutputs['account']['site']['listRegions']['regions'][number]

export function useSiteRegions() {
  return useQuery(orpc.account.site.listRegions.queryOptions())
}

export function useCaredSites() {
  return useQuery({
    ...orpc.account.site.listCaredSites.queryOptions(),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const sites = query.state.data?.sites ?? []
      return sites.some((site) =>
        ['waiting', 'processing', 'building'].includes(
          site.primarySite?.latestDeploymentStatus ?? '',
        ),
      )
        ? 5000
        : false
    },
  })
}

export function useCaredSite(id: string | undefined) {
  return useQuery({
    ...orpc.account.site.getCaredSite.queryOptions({
      input: { id: id ?? '' },
    }),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.site.primarySite?.latestDeploymentStatus
      return status && ['waiting', 'processing', 'building'].includes(status) ? 5000 : false
    },
  })
}

export function useSiteDeployments(site: CaredSite | null) {
  const primarySiteId = site?.primarySite?.id

  return useQuery({
    ...orpc.account.site.listDeployments.queryOptions({
      input: {
        regionId: site?.primaryRegionId ?? '',
        siteId: primarySiteId ?? '',
        limit: 20,
      },
    }),
    enabled: !!site && !!primarySiteId,
    refetchInterval: (query) => {
      const deployments = query.state.data?.deployments ?? []
      return deployments.some((deployment) =>
        ['waiting', 'processing', 'building'].includes(deployment.status),
      )
        ? 5000
        : false
    },
  })
}

export function useCreateCaredSite() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.site.createCaredSite.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.account.site.listCaredSites.key(),
        })
      },
    }),
  })
}

export function useSiteFrameworks(regionId: string | undefined) {
  return useQuery({
    ...orpc.account.site.listFrameworks.queryOptions({
      input: { regionId: regionId ?? '' },
    }),
    enabled: !!regionId,
  })
}

export type CreateCaredSiteInput = RouterInputs['account']['site']['createCaredSite']
export type SiteDeployment =
  RouterOutputs['account']['site']['listDeployments']['deployments'][number]
