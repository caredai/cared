import { ID } from '@appwrite.io/console'

import type { CreateFunctionWorkflowInput } from '../shared/types'
import type { ProjectKeyScopes, Runtime } from '@appwrite.io/console'
import { appwriteFunctionsService } from '../../service/appwrite'
import { upsertAppwriteRegions } from '../../service/appwrite/base'
import {
  createAppwriteFunctionRecord,
  syncFunctionToRegions,
} from '../../service/appwrite/functions'

export async function ensureFunctionRegions() {
  const regions = appwriteFunctionsService.listRegions()
  await upsertAppwriteRegions(regions)
  return regions
}

export async function createPrimaryFunction(
  input: Omit<CreateFunctionWorkflowInput, 'regionIds'> & { primaryRegionId: string },
) {
  await appwriteFunctionsService.ensure(input.accountId, input.primaryRegionId)

  const { accountId, primaryRegionId, runtime, scopes, ...params } = input

  return appwriteFunctionsService.createFunction(accountId, primaryRegionId, {
    ...params,
    runtime: runtime as Runtime,
    scopes: scopes as ProjectKeyScopes[] | undefined,
    functionId: ID.unique(),
  })
}

export async function deletePrimaryFunction(input: {
  accountId: string
  primaryRegionId: string
  functionId: string
}) {
  try {
    await appwriteFunctionsService.deleteFunction(input.accountId, input.primaryRegionId, {
      functionId: input.functionId,
    })
  } catch {
    // Best-effort rollback. The original workflow failure is more important to preserve.
  }
}

export async function createFunctionRecord(input: {
  accountId: string
  name: string
  primaryRegionId: string
  regionIds: string[]
  providerFunctionId: string
  activeDeploymentId?: string | null
  runtime: string
  enabled: boolean
}) {
  const fn = await createAppwriteFunctionRecord({
    functionId: input.providerFunctionId,
    accountId: input.accountId,
    name: input.name,
    primaryRegionId: input.primaryRegionId,
    regionIds: input.regionIds,
    activeDeploymentId: input.activeDeploymentId,
    runtime: input.runtime,
    enabled: input.enabled,
  })

  return fn.id
}

export async function queueFunctionRegionSync(input: {
  functionId: string
  secondaryRegionIds: string[]
}) {
  await syncFunctionToRegions(input.functionId, input.secondaryRegionIds)
}
