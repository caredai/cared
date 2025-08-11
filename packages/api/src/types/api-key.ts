export const apiKeyScopes = ['user', 'organization', 'workspace', 'app'] as const
export type ApiKeyScope = (typeof apiKeyScopes)[number]

export type ApiKeyMetadata =
  | {
      scope: 'user'
    }
  | {
      scope: 'organization'
      organizationId: string
    }
  | {
      scope: 'workspace'
      workspaceId: string
    }
  | {
      scope: 'app'
      appId: string
    }

export type ApiKeyAuth =
  | {
      scope: 'user'
      userId: string
      isAdmin?: boolean
    }
  | {
      scope: 'organization'
      organizationId: string
    }
  | {
      scope: 'workspace'
      workspaceId: string
    }
  | {
      scope: 'app'
      appId: string
    }
