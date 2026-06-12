import { and, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { AppwriteRule, AppwriteRuleRegion } from '@cared/db/schema'

import type { ResourceType, RuleRegionWorkflowInput, RuleTriggerType } from '../shared/types'

export async function createRuleRecord(input: {
  ruleId: string
  accountId: string
  resourceType: ResourceType
  resourceId: string
  triggerType: RuleTriggerType
  domain: string
  metadata?: Record<string, unknown>
}) {
  const [rule] = await db
    .insert(AppwriteRule)
    .values({
      id: input.ruleId,
      accountId: input.accountId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      triggerType: input.triggerType,
      domain: input.domain,
      status: 'pending',
      metadata: input.metadata ?? {},
    })
    .returning()

  if (!rule) throw new Error('Failed to create rule record')
  return rule.id
}

export async function createRuleRegionRecord(input: {
  ruleId: string
  regionId: string
  workflowId?: string
}) {
  await db.insert(AppwriteRuleRegion).values({
    ruleId: input.ruleId,
    regionId: input.regionId,
    workflowId: input.workflowId,
    status: 'pending',
  })
}

export async function markRuleApplying(input: { ruleId: string }) {
  await db
    .update(AppwriteRule)
    .set({
      status: 'applying',
      updatedAt: new Date(),
    })
    .where(eq(AppwriteRule.id, input.ruleId))
}

export async function markRuleRegionApplying(input: { ruleId: string; regionId: string }) {
  await db
    .update(AppwriteRuleRegion)
    .set({
      status: 'applying',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(AppwriteRuleRegion.ruleId, input.ruleId),
        eq(AppwriteRuleRegion.regionId, input.regionId),
      ),
    )
}

export async function applyRuleRegion(input: RuleRegionWorkflowInput): Promise<{
  verificationStatus?: string
  certificateStatus?: string
}> {
  throw new Error(
    `${input.resourceType} ${input.triggerType} rule application is not wired for region ${input.regionId}`,
  )
}

export async function markRuleRegionReady(input: {
  ruleId: string
  regionId: string
  verificationStatus?: string
  certificateStatus?: string
}) {
  await db
    .update(AppwriteRuleRegion)
    .set({
      verificationStatus: input.verificationStatus,
      certificateStatus: input.certificateStatus,
      status: 'ready',
      error: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(AppwriteRuleRegion.ruleId, input.ruleId),
        eq(AppwriteRuleRegion.regionId, input.regionId),
      ),
    )
}

export async function markRuleRegionFailed(input: {
  ruleId: string
  regionId: string
  error: string
}) {
  await db
    .update(AppwriteRuleRegion)
    .set({
      status: 'failed',
      error: input.error,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(AppwriteRuleRegion.ruleId, input.ruleId),
        eq(AppwriteRuleRegion.regionId, input.regionId),
      ),
    )
}

export async function recomputeRuleStatus(input: { ruleId: string }) {
  const regions = await db.query.AppwriteRuleRegion.findMany({
    where: eq(AppwriteRuleRegion.ruleId, input.ruleId),
  })

  const status = regions.some(
    (region) => region.status === 'pending' || region.status === 'applying',
  )
    ? 'applying'
    : regions.some((region) => region.status === 'failed')
      ? 'failed'
      : 'ready'

  await db
    .update(AppwriteRule)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(AppwriteRule.id, input.ruleId))
}
