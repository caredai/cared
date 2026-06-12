import { ParentClosePolicy, proxyActivities, startChild } from '@temporalio/workflow'

import type {
  CreateRuleWorkflowInput,
  CreateRuleWorkflowResult,
  RuleRegionWorkflowInput,
} from '../shared/types'
import type * as activities from './activities'

const ruleActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
  },
})

export async function createRuleWorkflow(
  input: CreateRuleWorkflowInput,
): Promise<CreateRuleWorkflowResult> {
  const regionIds = [...new Set(input.regionIds)]
  if (!regionIds.length) {
    throw new Error('At least one region is required')
  }

  const ruleId = await ruleActivities.createRuleRecord({
    ruleId: input.ruleId,
    accountId: input.accountId,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    triggerType: input.triggerType,
    domain: input.domain,
    metadata: input.metadata,
  })

  await ruleActivities.markRuleApplying({ ruleId })

  for (const regionId of regionIds) {
    const workflowId = `rule-region:${ruleId}:${regionId}`
    await ruleActivities.createRuleRegionRecord({
      ruleId,
      regionId,
      workflowId,
    })

    await startChild(ruleRegionWorkflow, {
      workflowId,
      args: [
        {
          ruleId,
          accountId: input.accountId,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          triggerType: input.triggerType,
          domain: input.domain,
          regionId,
        },
      ],
      parentClosePolicy: ParentClosePolicy.ABANDON,
    })
  }

  return { ruleId }
}

export async function ruleRegionWorkflow(input: RuleRegionWorkflowInput) {
  try {
    await ruleActivities.markRuleRegionApplying({
      ruleId: input.ruleId,
      regionId: input.regionId,
    })
    const result = await ruleActivities.applyRuleRegion(input)
    await ruleActivities.markRuleRegionReady({
      ruleId: input.ruleId,
      regionId: input.regionId,
      verificationStatus: result.verificationStatus,
      certificateStatus: result.certificateStatus,
    })
  } catch (error) {
    await ruleActivities.markRuleRegionFailed({
      ruleId: input.ruleId,
      regionId: input.regionId,
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    await ruleActivities.recomputeRuleStatus({
      ruleId: input.ruleId,
    })
  }
}
