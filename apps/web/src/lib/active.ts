import { addIdPrefix } from '@/lib/utils'

export async function getActiveOrganizationId(params: Promise<{ organizationId: string }>) {
  const { organizationId: activeOrganizationIdNoPrefix } = await params
  const activeOrganizationId = addIdPrefix(activeOrganizationIdNoPrefix, 'org')
  return {
    activeOrganizationId,
    activeOrganizationIdNoPrefix,
  }
}

export async function getActiveWorkspaceId(params: Promise<{ workspaceId: string }>) {
  const { workspaceId: activeWorkspaceIdNoPrefix } = await params
  const activeWorkspaceId = addIdPrefix(activeWorkspaceIdNoPrefix, 'workspace')
  return {
    activeWorkspaceId,
    activeWorkspaceIdNoPrefix,
  }
}
