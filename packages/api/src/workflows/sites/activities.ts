import { ID } from '@appwrite.io/console'

import type { CreateSiteWorkflowInput } from '../shared/types'
import type { Adapter, BuildRuntime, Framework } from '@appwrite.io/console'
import { appwriteSitesService } from '../../service/appwrite'
import { upsertAppwriteRegions } from '../../service/appwrite/base'
import { createAppwriteSiteRecord, syncSiteToRegions } from '../../service/appwrite/sites'

export async function ensureSiteRegions() {
  const regions = appwriteSitesService.listRegions()
  await upsertAppwriteRegions(regions)
  return regions
}

export async function createPrimarySite(
  input: Omit<CreateSiteWorkflowInput, 'deploymentMode' | 'regionId'> & {
    deploymentMode: 'single_region' | 'global'
    primaryRegionId: string
  },
) {
  await appwriteSitesService.ensure(input.accountId, input.primaryRegionId)

  const {
    accountId,
    primaryRegionId,
    deploymentMode: _deploymentMode,
    framework,
    buildRuntime,
    adapter,
    ...params
  } = input

  return appwriteSitesService.create(accountId, primaryRegionId, {
    ...params,
    framework: framework as Framework,
    buildRuntime: buildRuntime as BuildRuntime,
    adapter: adapter as Adapter | undefined,
    siteId: ID.unique(),
  })
}

export async function deletePrimarySite(input: {
  accountId: string
  primaryRegionId: string
  siteId: string
}) {
  try {
    await appwriteSitesService.delete(input.accountId, input.primaryRegionId, {
      siteId: input.siteId,
    })
  } catch {
    // Best-effort rollback. The original workflow failure is more important to preserve.
  }
}

export async function createSiteRecord(input: {
  accountId: string
  name: string
  primaryRegionId: string
  regionIds: string[]
  providerSiteId: string
  activeDeploymentId?: string | null
  framework: string
  deploymentMode: 'single_region' | 'global'
  enabled: boolean
}) {
  const site = await createAppwriteSiteRecord({
    siteId: input.providerSiteId,
    accountId: input.accountId,
    name: input.name,
    primaryRegionId: input.primaryRegionId,
    regionIds: input.regionIds,
    activeDeploymentId: input.activeDeploymentId,
    framework: input.framework,
    deploymentMode: input.deploymentMode,
    enabled: input.enabled,
  })

  return site.id
}

export async function queueSiteRegionSync(input: { siteId: string; secondaryRegionIds: string[] }) {
  await syncSiteToRegions(input.siteId, input.secondaryRegionIds)
}
