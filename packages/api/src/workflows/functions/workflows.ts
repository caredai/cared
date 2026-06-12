import { proxyActivities } from '@temporalio/workflow'

import type { CreateFunctionWorkflowInput, CreateFunctionWorkflowResult } from '../shared/types'
import type * as activities from './activities'

const functionActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
  },
})

export async function createFunctionWorkflow(
  input: CreateFunctionWorkflowInput,
): Promise<CreateFunctionWorkflowResult> {
  const configuredRegions = await functionActivities.ensureFunctionRegions()
  const regionIds = validateSelectedRegions(configuredRegions, input.regionIds)
  const [primaryRegionId, ...secondaryRegionIds] = regionIds

  if (!primaryRegionId) {
    throw new Error('Primary region is required')
  }

  let providerFunctionId: string | undefined
  try {
    const primaryFunction = await functionActivities.createPrimaryFunction({
      ...input,
      primaryRegionId,
    })
    providerFunctionId = primaryFunction.id

    const functionId = await functionActivities.createFunctionRecord({
      accountId: input.accountId,
      name: primaryFunction.name,
      primaryRegionId,
      regionIds,
      providerFunctionId: primaryFunction.id,
      activeDeploymentId: primaryFunction.deploymentId || null,
      runtime: primaryFunction.runtime,
      enabled: primaryFunction.enabled,
    })

    await functionActivities.queueFunctionRegionSync({
      functionId,
      secondaryRegionIds,
    })

    return { functionId }
  } catch (error) {
    if (providerFunctionId) {
      await functionActivities.deletePrimaryFunction({
        accountId: input.accountId,
        primaryRegionId,
        functionId: providerFunctionId,
      })
    }
    throw error
  }
}

function validateSelectedRegions(
  configuredRegions: { id: string; name: string }[],
  regionIds: string[],
) {
  const uniqueRegionIds = [...new Set(regionIds)]
  if (!uniqueRegionIds.length) {
    throw new Error('At least one region is required')
  }

  const configuredRegionIds = new Set(configuredRegions.map((region) => region.id))
  const invalidRegionId = uniqueRegionIds.find((regionId) => !configuredRegionIds.has(regionId))
  if (invalidRegionId) {
    throw new Error(`Invalid region: ${invalidRegionId}`)
  }

  return uniqueRegionIds
}
