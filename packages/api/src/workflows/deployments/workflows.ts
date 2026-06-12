import { ParentClosePolicy, proxyActivities, startChild } from '@temporalio/workflow'

import type {
  CreateDeploymentWorkflowInput,
  CreateDeploymentWorkflowResult,
  DeploymentRegionWorkflowInput,
} from '../shared/types'
import type * as activities from './activities'

const deploymentActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 3,
  },
})

export async function createDeploymentWorkflow(
  input: CreateDeploymentWorkflowInput,
): Promise<CreateDeploymentWorkflowResult> {
  const regionIds = [...new Set(input.regionIds)]
  if (!regionIds.includes(input.primaryRegionId)) {
    regionIds.unshift(input.primaryRegionId)
  }

  let deploymentId: string | undefined
  try {
    const primary = await deploymentActivities.createPrimaryDeployment({
      accountId: input.accountId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      primaryRegionId: input.primaryRegionId,
    })
    deploymentId = await deploymentActivities.createDeploymentRecord({
      deploymentId: primary.deploymentId,
      accountId: input.accountId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      primaryRegionId: input.primaryRegionId,
      metadata: input.metadata,
    })

    await deploymentActivities.createDeploymentRegionRecord({
      deploymentId,
      regionId: input.primaryRegionId,
      status: 'pending',
    })

    await deploymentActivities.markDeploymentBuildingPrimary({ deploymentId })
    await deploymentActivities.markPrimaryDeploymentRegionBuilding({
      deploymentId,
      primaryRegionId: input.primaryRegionId,
    })

    await deploymentActivities.markPrimaryDeploymentReady({
      deploymentId,
      primaryRegionId: input.primaryRegionId,
    })

    const secondaryRegionIds = regionIds.filter((regionId) => regionId !== input.primaryRegionId)
    if (!secondaryRegionIds.length) {
      await deploymentActivities.markDeploymentReady({ deploymentId })
      return { deploymentId }
    }

    await deploymentActivities.markDeploymentSyncingRegions({ deploymentId })

    for (const regionId of secondaryRegionIds) {
      const workflowId = `deployment-region:${deploymentId}:${regionId}`
      await deploymentActivities.createDeploymentRegionRecord({
        deploymentId,
        regionId,
        status: 'pending',
        workflowId,
      })

      await startChild(deploymentRegionWorkflow, {
        workflowId,
        args: [
          {
            deploymentId,
            accountId: input.accountId,
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            primaryRegionId: input.primaryRegionId,
            regionId,
          },
        ],
        parentClosePolicy: ParentClosePolicy.ABANDON,
      })
    }

    return { deploymentId }
  } catch (error) {
    if (deploymentId) {
      await deploymentActivities.markDeploymentRegionFailed({
        deploymentId,
        regionId: input.primaryRegionId,
        error: error instanceof Error ? error.message : String(error),
      })
      await deploymentActivities.markDeploymentFailed({
        deploymentId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
    throw error
  }
}

export async function deploymentRegionWorkflow(input: DeploymentRegionWorkflowInput) {
  try {
    await deploymentActivities.markPrimaryDeploymentRegionBuilding({
      deploymentId: input.deploymentId,
      primaryRegionId: input.regionId,
    })
    await deploymentActivities.syncDeploymentRegion(input)
    await deploymentActivities.markDeploymentRegionReady({
      deploymentId: input.deploymentId,
      regionId: input.regionId,
    })
  } catch (error) {
    await deploymentActivities.markDeploymentRegionFailed({
      deploymentId: input.deploymentId,
      regionId: input.regionId,
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    await deploymentActivities.recomputeDeploymentStatus({
      deploymentId: input.deploymentId,
    })
  }
}
