import { proxyActivities } from '@temporalio/workflow'

import type { CreateSiteWorkflowInput, CreateSiteWorkflowResult } from '../shared/types'
import type * as activities from './activities'

const siteActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
  },
})

export async function createSiteWorkflow(
  input: CreateSiteWorkflowInput,
): Promise<CreateSiteWorkflowResult> {
  const configuredRegions = await siteActivities.ensureSiteRegions()
  if (!configuredRegions.length) {
    throw new Error('No regions are configured')
  }

  const primaryRegionId =
    input.deploymentMode === 'single_region' ? input.regionId : configuredRegions[0]!.id
  validateRegion(configuredRegions, primaryRegionId)

  const regionIds =
    input.deploymentMode === 'single_region'
      ? [primaryRegionId]
      : configuredRegions.map((region) => region.id)
  const secondaryRegionIds = regionIds.filter((regionId) => regionId !== primaryRegionId)

  let providerSiteId: string | undefined
  try {
    const primarySite = await siteActivities.createPrimarySite({
      ...input,
      primaryRegionId,
    })
    providerSiteId = primarySite.id

    const siteId = await siteActivities.createSiteRecord({
      accountId: input.accountId,
      name: primarySite.name,
      primaryRegionId,
      regionIds,
      providerSiteId: primarySite.id,
      activeDeploymentId: primarySite.deploymentId || null,
      framework: primarySite.framework,
      deploymentMode: input.deploymentMode,
      enabled: primarySite.enabled,
    })

    await siteActivities.queueSiteRegionSync({
      siteId,
      secondaryRegionIds,
    })

    return { siteId }
  } catch (error) {
    if (providerSiteId) {
      await siteActivities.deletePrimarySite({
        accountId: input.accountId,
        primaryRegionId,
        siteId: providerSiteId,
      })
    }
    throw error
  }
}

function validateRegion(configuredRegions: { id: string; name: string }[], regionId: string) {
  if (!configuredRegions.some((region) => region.id === regionId)) {
    throw new Error(`Invalid region: ${regionId}`)
  }
}
