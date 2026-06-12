import { and, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { AppwriteDeployment, AppwriteDeploymentRegion } from '@cared/db/schema'

import type { DeploymentRegionWorkflowInput, ResourceType } from '../shared/types'

export async function createDeploymentRecord(input: {
  deploymentId: string
  accountId: string
  resourceType: ResourceType
  resourceId: string
  primaryRegionId: string
  metadata?: Record<string, unknown>
}) {
  const [deployment] = await db
    .insert(AppwriteDeployment)
    .values({
      id: input.deploymentId,
      accountId: input.accountId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      primaryRegionId: input.primaryRegionId,
      status: 'pending',
      metadata: input.metadata ?? {},
    })
    .returning()

  if (!deployment) throw new Error('Failed to create deployment record')
  return deployment.id
}

export async function createDeploymentRegionRecord(input: {
  deploymentId: string
  regionId: string
  status?: 'pending' | 'building' | 'ready' | 'failed' | 'canceled' | 'skipped'
  workflowId?: string
}) {
  await db.insert(AppwriteDeploymentRegion).values({
    deploymentId: input.deploymentId,
    regionId: input.regionId,
    workflowId: input.workflowId,
    status: input.status ?? 'pending',
    startedAt: input.status === 'building' ? new Date() : null,
  })
}

export async function markDeploymentBuildingPrimary(input: { deploymentId: string }) {
  await db
    .update(AppwriteDeployment)
    .set({
      status: 'building_primary',
      updatedAt: new Date(),
    })
    .where(eq(AppwriteDeployment.id, input.deploymentId))
}

export async function markPrimaryDeploymentRegionBuilding(input: {
  deploymentId: string
  primaryRegionId: string
}) {
  await db
    .update(AppwriteDeploymentRegion)
    .set({
      status: 'building',
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(AppwriteDeploymentRegion.deploymentId, input.deploymentId),
        eq(AppwriteDeploymentRegion.regionId, input.primaryRegionId),
      ),
    )
}

export async function createPrimaryDeployment(input: {
  accountId: string
  resourceType: ResourceType
  resourceId: string
  primaryRegionId: string
}): Promise<{ deploymentId: string }> {
  throw new Error(
    `Primary ${input.resourceType} deployment creation is not wired for resource ${input.resourceId}`,
  )
}

export async function markPrimaryDeploymentReady(input: {
  deploymentId: string
  primaryRegionId: string
}) {
  const now = new Date()
  await db.transaction(async (tx) => {
    await tx
      .update(AppwriteDeploymentRegion)
      .set({
        status: 'ready',
        finishedAt: now,
        lastSyncedAt: now,
        error: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(AppwriteDeploymentRegion.deploymentId, input.deploymentId),
          eq(AppwriteDeploymentRegion.regionId, input.primaryRegionId),
        ),
      )

    await tx
      .update(AppwriteDeployment)
      .set({
        status: 'primary_ready',
        error: null,
        updatedAt: now,
      })
      .where(eq(AppwriteDeployment.id, input.deploymentId))
  })
}

export async function markDeploymentSyncingRegions(input: { deploymentId: string }) {
  await db
    .update(AppwriteDeployment)
    .set({
      status: 'syncing_regions',
      updatedAt: new Date(),
    })
    .where(eq(AppwriteDeployment.id, input.deploymentId))
}

export async function markDeploymentReady(input: { deploymentId: string }) {
  await db
    .update(AppwriteDeployment)
    .set({
      status: 'ready',
      error: null,
      updatedAt: new Date(),
    })
    .where(eq(AppwriteDeployment.id, input.deploymentId))
}

export async function markDeploymentFailed(input: { deploymentId: string; error: string }) {
  await db
    .update(AppwriteDeployment)
    .set({
      status: 'failed',
      error: input.error,
      updatedAt: new Date(),
    })
    .where(eq(AppwriteDeployment.id, input.deploymentId))
}

export async function markDeploymentRegionFailed(input: {
  deploymentId: string
  regionId: string
  error: string
}) {
  await db
    .update(AppwriteDeploymentRegion)
    .set({
      status: 'failed',
      error: input.error,
      finishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(AppwriteDeploymentRegion.deploymentId, input.deploymentId),
        eq(AppwriteDeploymentRegion.regionId, input.regionId),
      ),
    )
}

export async function syncDeploymentRegion(input: DeploymentRegionWorkflowInput): Promise<void> {
  throw new Error(
    `Secondary ${input.resourceType} deployment sync is not wired for region ${input.regionId}`,
  )
}

export async function markDeploymentRegionReady(input: { deploymentId: string; regionId: string }) {
  const now = new Date()
  await db
    .update(AppwriteDeploymentRegion)
    .set({
      status: 'ready',
      error: null,
      finishedAt: now,
      lastSyncedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(AppwriteDeploymentRegion.deploymentId, input.deploymentId),
        eq(AppwriteDeploymentRegion.regionId, input.regionId),
      ),
    )
}

export async function recomputeDeploymentStatus(input: { deploymentId: string }) {
  const regions = await db.query.AppwriteDeploymentRegion.findMany({
    where: eq(AppwriteDeploymentRegion.deploymentId, input.deploymentId),
  })

  const status = regions.some(
    (region) => region.status === 'building' || region.status === 'pending',
  )
    ? 'syncing_regions'
    : regions.some((region) => region.status === 'failed')
      ? 'partial_failed'
      : 'ready'

  await db
    .update(AppwriteDeployment)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(AppwriteDeployment.id, input.deploymentId))
}
