export * from '@cared/shared'

export interface AppMetadata {
  description?: string
  imageUrl?: string

  clientId?: string

  languageModel: string
  embeddingModel: string // used for embedding memories
  rerankModel: string // used for reranking memories
  imageModel: string

  languageModelSettings?: {
    systemPrompt?: string
  }

  datasetBindings?: string[]

  [key: string]: unknown
}

export type Invitation = InferSelectModel<typeof Invitation>

export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'vertex'
  | 'azure'
  | 'bedrock'
  | 'deepseek'
  | 'mistral'
  | 'xai'
  | 'togetherai'
  | 'cohere'
  | 'fireworks'
  | 'deepinfra'
  | 'cerebras'
  | 'groq'
  | 'replicate'
  | 'perplexity'
  | 'luma'
  | 'vercel'
  | 'fal'
  | 'elevenlabs'
  | 'lmnt'

export type ModelFullId = `${ProviderId}:${string}`

export interface BaseModelInfo {
  id: string
  name: string
  description: string
  deprecated?: boolean
  retired?: boolean
  chargeable?: boolean // whether usage is chargeable by Cared credits
}

export type Modality = 'text' | 'image' | 'audio' | 'video' | 'pdf'

export interface LanguageModelInfo extends BaseModelInfo {
  contextWindow?: number // max tokens including input and output tokens
  maxOutputTokens?: number // max output tokens
  inputTokenPrice?: string // decimal string, in $USD/M input token
  cachedInputTokenPrice?: string // read; decimal string, in $USD/M cached input token
  cacheInputTokenPrice?: string | [string, string][] // write; ttl => price; decimal string, in $USD/M cached input token
  outputTokenPrice?: string // decimal string, in $USD/M input token

  modality?: {
    input?: Modality[] // 'text' if not specified
    output?: Modality[] // 'text' if not specified
  }
}

export interface ImageModelInfo extends BaseModelInfo {
  imageInputTokenPrice?: string
  imageCachedInputTokenPrice?: string
  imageOutputTokenPrice?: string
  textInputTokenPrice?: string
  textCachedInputTokenPrice?: string
  pricePerImage?:
    | string
    | [string, string][] // quality => price
    | [string, [string, string][]][] // quality => size (or aspect ratio) => price
}

export interface SpeechModelInfo extends BaseModelInfo {
  maxInputTokens?: number // max input tokens
  textTokenPrice?: string // input token price
  audioTokenPrice?: string // output token price
}

export interface TranscriptionModelInfo extends BaseModelInfo {
  audioTokenPrice?: string // audio input token price
  textInputTokenPrice?: string // text input token price
  textOutputTokenPrice?: string // text output token price
}

export interface EmbeddingModelInfo extends BaseModelInfo {
  tokenPrice?: string
  dimensions?: number | number[]
}

export interface AgentMetadata {
  description?: string
  imageUrl?: string

  languageModel?: string
  embeddingModel?: string // used for embedding memories
  rerankModel?: string // used for reranking memories
  imageModel?: string

  languageModelSettings?: {
    systemPrompt?: string
  }

  datasetBindings?: string[]

  [key: string]: unknown
}

export interface DatasetMetadata {
  description: string

  languageModel: string // used for splitting a document into segments and chunks
  embeddingModel: string
  rerankModel: string
  retrievalMode: 'vector-search' | 'full-text-search' | 'hybrid-search'
  topK?: number
  scoreThreshold?: number

  stats?: {
    /**
     * Total size of all documents in bytes
     */
    totalSizeBytes?: number
  }

  [key: string]: unknown
}

export interface DocumentMetadata {
  url?: string
  processed?: boolean
  taskId?: string

  [key: string]: unknown
}

export interface ChatMetadata {
  title: string
  visibility: 'public' | 'private'

  languageModel?: string
  embeddingModel?: string // used for embedding memories
  rerankModel?: string // used for reranking memories
  imageModel?: string

  custom?: unknown
}

export interface CreditsMetadata {
  customerId?: string
  isRechargeInProgress?: boolean
  autoRechargeSubscriptionId?: string
  autoRechargeThreshold?: number
  autoRechargeAmount?: number
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const appRouter: import('@trpc/server/unstable-core-do-not-import').BuiltRouter<
  {
    ctx: any
    meta: import('trpc-to-openapi').OpenApiMeta
    errorShape: import('@trpc/server/unstable-core-do-not-import').DefaultErrorShape
    transformer: true
  },
  import('@trpc/server/unstable-core-do-not-import').DecorateCreateRouterOptions<{
    admin: {
      mock: import('@trpc/server').TRPCMutationProcedure<{
        input: void
        output: void
      }>
      list: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          apps: {
            app: {
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
              type: 'single-agent' | 'multiple-agents'
              archived: boolean | null
              archivedAt: Date | null
              deleted: boolean | null
              deletedAt: Date | null
              workspaceId: string
            }
            categories: {
              id: string
              name: string
            }[]
            tags: string[]
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      listByCategory: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          categoryId: string
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          apps: {
            app: {
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
              type: 'single-agent' | 'multiple-agents'
              archived: boolean | null
              archivedAt: Date | null
              deleted: boolean | null
              deletedAt: Date | null
              workspaceId: string
            }
            categories: {
              id: string
              name: string
            }[]
            tags: string[]
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      listByTags: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          tags: string[]
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          apps: {
            app: {
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
              type: 'single-agent' | 'multiple-agents'
              archived: boolean | null
              archivedAt: Date | null
              deleted: boolean | null
              deletedAt: Date | null
              workspaceId: string
            }
            categories: {
              id: string
              name: string
            }[]
            tags: string[]
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      listVersions: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
          after?: number | undefined
          before?: number | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          versions: {
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            type: 'single-agent' | 'multiple-agents'
            appId: string
            version: number
          }[]
          hasMore: boolean
          first: number | undefined
          last: number | undefined
        }
      }>
      byId: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
        }
        output: {
          app: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            type: 'single-agent' | 'multiple-agents'
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
            workspaceId: string
          }
        }
      }>
      createCategory: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          name: string
        }
        output: {
          category: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
          }[]
        }
      }>
      updateCategory: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          name: string
        }
        output: {
          category:
            | {
                createdAt: Date
                updatedAt: Date
                id: string
                name: string
              }
            | undefined
        }
      }>
      deleteCategory: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
        }
        output: void
      }>
      deleteTags: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          tags: string[]
        }
        output: void
      }>
      listWorkspaces: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          workspaces: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            organizationId: string
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      getWorkspace: import('@trpc/server').TRPCQueryProcedure<{
        input: string
        output: {
          workspace: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            organizationId: string
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
          }
        }
      }>
      listOrganizations: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          organizations: {
            id: string
            name: string
            createdAt: Date
            metadata: string | null
            slug: string | null
            logo: string | null
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      getOrganization: import('@trpc/server').TRPCQueryProcedure<{
        input: string
        output: {
          organization: {
            id: string
            name: string
            createdAt: Date
            metadata: string | null
            slug: string | null
            logo: string | null
          }
        }
      }>
      listMembers: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          organizationId: string
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          members: {
            id: string
            role: string
            createdAt: Date
            user: {
              id: string
              name: string
              email: string
              emailVerified: boolean
              image: string | null
              createdAt: Date
              updatedAt: Date
              twoFactorEnabled: boolean | null
              role: string | null
              banned: boolean | null
              banReason: string | null
              banExpires: Date | null
              normalizedEmail: string | null
            }
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      listUsers: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          search?: string | undefined
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          users: {
            id: string
            name: string
            email: string
            emailVerified: boolean
            image: string | null
            createdAt: Date
            updatedAt: Date
            twoFactorEnabled: boolean | null
            role: string | null
            banned: boolean | null
            banReason: string | null
            banExpires: Date | null
            normalizedEmail: string | null
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      getUser: import('@trpc/server').TRPCQueryProcedure<{
        input: string
        output: {
          user: {
            id: string
            name: string
            email: string
            emailVerified: boolean
            image: string | null
            createdAt: Date
            updatedAt: Date
            twoFactorEnabled: boolean | null
            role: string | null
            banned: boolean | null
            banReason: string | null
            banExpires: Date | null
            normalizedEmail: string | null
          }
        }
      }>
      deleteUser: import('@trpc/server').TRPCMutationProcedure<{
        input: string
        output: void
      }>
    }
    organization: {
      create: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          name: string
        }
        output: {
          organization: {
            id: string
            name: string
            slug: string | null
            createdAt: Date
          }
        }
      }>
      list: import('@trpc/server').TRPCQueryProcedure<{
        input: void
        output: {
          organizations: {
            role: OrganizationRole
            id: string
            name: string
            slug: string | null
            createdAt: Date
          }[]
        }
      }>
      setActive: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          organizationId: string | null
        }
        output: void
      }>
      get: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
        }
        output: {
          organization: {
            members: {
              id: string
              organizationId: string
              role: 'member' | 'owner' | 'admin'
              createdAt: Date
              userId: string
              teamId?: string
              user: {
                email: string
                name: string
                image?: string
              }
            }[]
            invitations: {
              teamId: string | undefined
              id: string
              email: string
              expiresAt: Date
              organizationId: string
              inviterId: string
              status: 'pending' | 'canceled' | 'accepted' | 'rejected'
              role: OrganizationRole
            }[]
            teams: {
              id: string
              name: string
              organizationId: string
              createdAt: Date
              updatedAt?: Date | undefined
            }[]
            id: string
            name: string
            slug: string | null
            createdAt: Date
          }
        }
      }>
      update: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          name: string
        }
        output: {
          organization: {
            id: string
            name: string
            slug: string | null
            createdAt: Date
          }
        }
      }>
      delete: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
        }
        output: void
      }>
      createInvitation: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          organizationId: string
          email: string
          teamId?: string | undefined
          resend?: boolean | undefined
        }
        output: {
          invitation: {
            teamId: string | undefined
            id: string
            email: string
            expiresAt: Date
            organizationId: string
            inviterId: string
            status: 'pending' | 'canceled' | 'accepted' | 'rejected'
            role: OrganizationRole
          }
        }
      }>
      acceptInvitation: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          invitationId: string
        }
        output: {
          invitation: {
            teamId: string | undefined
            id: string
            email: string
            expiresAt: Date
            organizationId: string
            inviterId: string
            status: 'pending' | 'canceled' | 'accepted' | 'rejected'
            role: OrganizationRole
          }
        }
      }>
      cancelInvitation: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          invitationId: string
        }
        output: {
          invitation: {
            teamId: string | undefined
            id: string
            email: string
            expiresAt: Date
            organizationId: string
            inviterId: string
            status: 'pending' | 'canceled' | 'accepted' | 'rejected'
            role: OrganizationRole
          }
        }
      }>
      rejectInvitation: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          invitationId: string
        }
        output: {
          invitation: {
            teamId: string | undefined
            id: string
            email: string
            expiresAt: Date
            organizationId: string
            inviterId: string
            status: 'pending' | 'canceled' | 'accepted' | 'rejected'
            role: OrganizationRole
          }
        }
      }>
      getInvitation: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          invitationId: string
        }
        output: {
          invitation: ReturnType<
            (
              invitation: Omit<Invitation, 'status' | 'role' | 'teamId'> & {
                status: 'pending' | 'canceled' | 'accepted' | 'rejected'
                role: OrganizationRole
                teamId?: string | null
              },
            ) => {
              teamId: string | undefined
              id: string
              email: string
              expiresAt: Date
              organizationId: string
              inviterId: string
              status: 'pending' | 'canceled' | 'accepted' | 'rejected'
              role: OrganizationRole
            }
          > & {
            organizationName: string
            inviterEmail: string
            inviterName: string
          }
        }
      }>
      listInvitations: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          organizationId: string
        }
        output: {
          invitations: {
            teamId: string | undefined
            id: string
            email: string
            expiresAt: Date
            organizationId: string
            inviterId: string
            status: 'pending' | 'canceled' | 'accepted' | 'rejected'
            role: OrganizationRole
          }[]
        }
      }>
      listUserInvitations: import('@trpc/server').TRPCQueryProcedure<{
        input: void
        output: {
          invitations: {
            teamId: string | undefined
            id: string
            email: string
            expiresAt: Date
            organizationId: string
            inviterId: string
            status: 'pending' | 'canceled' | 'accepted' | 'rejected'
            role: OrganizationRole
          }[]
        }
      }>
      listMembers: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          organizationId: string
        }
        output: {
          members: {
            user: {
              id: string
              name: string
              email: string
              image: string | null | undefined
            }
            id: string
            organizationId: string
            userId: string
            role: string
            createdAt: Date
          }[]
        }
      }>
      addMember: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          organizationId: string
          userId: string
          role?: 'member' | 'admin' | undefined
          teamId?: string | undefined
        }
        output: {
          member: {
            id: string
            organizationId: string
            userId: string
            role: string
            createdAt: Date
          }
        }
      }>
      removeMember: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          organizationId: string
          memberId: string
        }
        output: {
          member: {
            id: string
            organizationId: string
            userId: string
            role: string
            createdAt: Date
          }
        }
      }>
      updateMemberRole: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          organizationId: string
          memberId: string
          role: 'member' | 'admin'
        }
        output: {
          member: {
            id: string
            organizationId: string
            role: 'owner' | 'member' | 'admin'
            createdAt: Date
            userId: string
            user: {
              email: string
              name: string
              image?: string
            }
          }
        }
      }>
      transferOwnership: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          organizationId: string
          memberId: string
        }
        output: {
          newOwner: {
            id: string
            organizationId: string
            role: 'owner' | 'member' | 'admin'
            createdAt: Date
            userId: string
            user: {
              email: string
              name: string
              image?: string
            }
          }
          previousOwner: {
            id: string
            organizationId: string
            role: 'owner' | 'member' | 'admin'
            createdAt: Date
            userId: string
            user: {
              email: string
              name: string
              image?: string
            }
          }
        }
      }>
      leaveOrganization: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          organizationId: string
        }
        output: {
          member: {
            user: {
              id: string
              name: string
              email: string
              image: string | null | undefined
            }
            id: string
            organizationId: string
            userId: string
            role: string
            createdAt: Date
          }
        }
      }>
    }
    workspace: {
      list: import('@trpc/server').TRPCQueryProcedure<{
        input:
          | {
              organizationId?: string | undefined
            }
          | undefined
        output: {
          workspaces: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            organizationId: string
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
          }[]
        }
      }>
      get: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
        }
        output: {
          workspace: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            organizationId: string
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
          }
        }
      }>
      create: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          name: string
          organizationId: string
        }
        output: {
          workspace: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            organizationId: string
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
          }
        }
      }>
      update: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          name: string
        }
        output: {
          workspace: {
            createdAt: Date
            updatedAt: Date
            id: string
            name: string
            organizationId: string
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
          }
        }
      }>
      delete: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
        }
        output: void
      }>
      transferOwnership: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          workspaceId: string
          organizationId: string
        }
        output: {
          workspace: {
            createdAt: Date
            updatedAt: Date
            id: string
            name: string
            organizationId: string
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
          }
        }
      }>
    }
    user: {
      session: import('@trpc/server').TRPCQueryProcedure<{
        input:
          | {
              auth: boolean
            }
          | undefined
        output: {
          user: {
            id: string
            email: string
            emailVerified: boolean
            name: string
            createdAt: Date
            updatedAt: Date
            image?: string | null | undefined
            twoFactorEnabled: boolean | null | undefined
            banned: boolean | null | undefined
            role?: string | null | undefined
            banReason?: string | null | undefined
            banExpires?: Date | null | undefined
          }
          session: {
            id: string
            userId: string
            expiresAt: Date
            createdAt: Date
            updatedAt: Date
            token: string
            ipAddress?: string | null | undefined
            userAgent?: string | null | undefined
            activeOrganizationId?: string | null | undefined
            activeTeamId?: string | null | undefined
            geolocation?: string | null | undefined
            impersonatedBy?: string | null | undefined
          }
        } | null
      }>
      accounts: import('@trpc/server').TRPCQueryProcedure<{
        input: void
        output: {
          accounts: {
            id: string
            accountId: string
            providerId: string
            createdAt: Date
            updatedAt: Date
            userId: string
            accessToken: string | null
            refreshToken: string | null
            idToken: string | null
            accessTokenExpiresAt: Date | null
            refreshTokenExpiresAt: Date | null
            scope: string | null
            password: string | null
            profile: string | null
          }[]
        }
      }>
      sessions: import('@trpc/server').TRPCQueryProcedure<{
        input: void
        output: {
          sessions: {
            geolocation:
              | {
                  city?: string
                  region?: string
                  country?: string
                }
              | undefined
            id: string
            userId: string
            expiresAt: Date
            createdAt: Date
            updatedAt: Date
            token: string
            ipAddress?: string | null | undefined
            userAgent?: string | null | undefined
            activeOrganizationId?: string | null | undefined
            activeTeamId?: string | null | undefined
            impersonatedBy?: string | null | undefined
          }[]
        }
      }>
      oauthApps: import('@trpc/server').TRPCQueryProcedure<{
        input: void
        output: {
          apps: {
            clientId: string
            access: {
              createdAt: Date | null | undefined
              updatedAt: Date | null | undefined
            }
            appId: string
            name: string
            imageUrl: string | undefined
            workspace: {
              id: string
              name: string
            }
            organization: {
              id: string
              name: string
            }
            owner: {
              id: string
              name: string
            }
          }[]
        }
      }>
      revokeOauthApp: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          clientId: string
        }
        output: void
      }>
    }
    providerKey: {
      list: import('@trpc/server').TRPCQueryProcedure<{
        input:
          | {
              isSystem?: boolean | undefined
              organizationId?: string | undefined
              providerId?:
                | 'openai'
                | 'anthropic'
                | 'google'
                | 'openrouter'
                | 'vertex'
                | 'azure'
                | 'bedrock'
                | 'deepseek'
                | 'mistral'
                | 'xai'
                | 'togetherai'
                | 'cohere'
                | 'fireworks'
                | 'deepinfra'
                | 'cerebras'
                | 'groq'
                | 'replicate'
                | 'perplexity'
                | 'luma'
                | 'vercel'
                | 'fal'
                | 'elevenlabs'
                | 'lmnt'
                | undefined
            }
          | undefined
        output: {
          providerKeys: {
            key: {
              baseUrl?: string | undefined
            } & (
              | {
                  providerId:
                    | 'openai'
                    | 'anthropic'
                    | 'google'
                    | 'openrouter'
                    | 'deepseek'
                    | 'mistral'
                    | 'xai'
                    | 'togetherai'
                    | 'cohere'
                    | 'fireworks'
                    | 'deepinfra'
                    | 'cerebras'
                    | 'groq'
                    | 'perplexity'
                    | 'luma'
                    | 'vercel'
                    | 'fal'
                    | 'elevenlabs'
                    | 'lmnt'
                  apiKey: string
                }
              | {
                  providerId: 'azure'
                  apiKey: string
                  baseUrl: string
                  apiVersion?: string | undefined
                }
              | {
                  providerId: 'bedrock'
                  region: string
                  accessKeyId: string
                  secretAccessKey: string
                }
              | {
                  providerId: 'vertex'
                  serviceAccountJson: string
                  location?: string | undefined
                }
              | {
                  providerId: 'replicate'
                  apiToken: string
                }
            )
            id: string
            providerId: ProviderId
            createdAt: Date
            updatedAt: Date
            userId: string | null
            organizationId: string | null
            disabled: boolean
            isSystem: boolean | null
          }[]
        }
      }>
      create: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          key: {
            baseUrl?: string | undefined
          } & (
            | {
                providerId:
                  | 'openai'
                  | 'anthropic'
                  | 'google'
                  | 'openrouter'
                  | 'deepseek'
                  | 'mistral'
                  | 'xai'
                  | 'togetherai'
                  | 'cohere'
                  | 'fireworks'
                  | 'deepinfra'
                  | 'cerebras'
                  | 'groq'
                  | 'perplexity'
                  | 'luma'
                  | 'vercel'
                  | 'fal'
                  | 'elevenlabs'
                  | 'lmnt'
                apiKey: string
              }
            | {
                providerId: 'azure'
                apiKey: string
                baseUrl: string
                apiVersion?: string | undefined
              }
            | {
                providerId: 'bedrock'
                region: string
                accessKeyId: string
                secretAccessKey: string
              }
            | {
                providerId: 'vertex'
                serviceAccountJson: string
                location?: string | undefined
              }
            | {
                providerId: 'replicate'
                apiToken: string
              }
          )
          isSystem?: boolean | undefined
          organizationId?: string | undefined
          disabled?: boolean | undefined
        }
        output: {
          providerKey: {
            key: {
              baseUrl?: string | undefined
            } & (
              | {
                  providerId:
                    | 'openai'
                    | 'anthropic'
                    | 'google'
                    | 'openrouter'
                    | 'deepseek'
                    | 'mistral'
                    | 'xai'
                    | 'togetherai'
                    | 'cohere'
                    | 'fireworks'
                    | 'deepinfra'
                    | 'cerebras'
                    | 'groq'
                    | 'perplexity'
                    | 'luma'
                    | 'vercel'
                    | 'fal'
                    | 'elevenlabs'
                    | 'lmnt'
                  apiKey: string
                }
              | {
                  providerId: 'azure'
                  apiKey: string
                  baseUrl: string
                  apiVersion?: string | undefined
                }
              | {
                  providerId: 'bedrock'
                  region: string
                  accessKeyId: string
                  secretAccessKey: string
                }
              | {
                  providerId: 'vertex'
                  serviceAccountJson: string
                  location?: string | undefined
                }
              | {
                  providerId: 'replicate'
                  apiToken: string
                }
            )
            id: string
            providerId: ProviderId
            createdAt: Date
            updatedAt: Date
            userId: string | null
            organizationId: string | null
            disabled: boolean
            isSystem: boolean | null
          }
        }
      }>
      update: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          key?:
            | ({
                baseUrl?: string | undefined
              } & (
                | {
                    providerId:
                      | 'openai'
                      | 'anthropic'
                      | 'google'
                      | 'openrouter'
                      | 'deepseek'
                      | 'mistral'
                      | 'xai'
                      | 'togetherai'
                      | 'cohere'
                      | 'fireworks'
                      | 'deepinfra'
                      | 'cerebras'
                      | 'groq'
                      | 'perplexity'
                      | 'luma'
                      | 'vercel'
                      | 'fal'
                      | 'elevenlabs'
                      | 'lmnt'
                    apiKey: string
                  }
                | {
                    providerId: 'azure'
                    apiKey: string
                    baseUrl: string
                    apiVersion?: string | undefined
                  }
                | {
                    providerId: 'bedrock'
                    region: string
                    accessKeyId: string
                    secretAccessKey: string
                  }
                | {
                    providerId: 'vertex'
                    serviceAccountJson: string
                    location?: string | undefined
                  }
                | {
                    providerId: 'replicate'
                    apiToken: string
                  }
              ))
            | undefined
          disabled?: boolean | undefined
        }
        output: {
          providerKey: {
            key: {
              baseUrl?: string | undefined
            } & (
              | {
                  providerId:
                    | 'openai'
                    | 'anthropic'
                    | 'google'
                    | 'openrouter'
                    | 'deepseek'
                    | 'mistral'
                    | 'xai'
                    | 'togetherai'
                    | 'cohere'
                    | 'fireworks'
                    | 'deepinfra'
                    | 'cerebras'
                    | 'groq'
                    | 'perplexity'
                    | 'luma'
                    | 'vercel'
                    | 'fal'
                    | 'elevenlabs'
                    | 'lmnt'
                  apiKey: string
                }
              | {
                  providerId: 'azure'
                  apiKey: string
                  baseUrl: string
                  apiVersion?: string | undefined
                }
              | {
                  providerId: 'bedrock'
                  region: string
                  accessKeyId: string
                  secretAccessKey: string
                }
              | {
                  providerId: 'vertex'
                  serviceAccountJson: string
                  location?: string | undefined
                }
              | {
                  providerId: 'replicate'
                  apiToken: string
                }
            )
            createdAt: Date
            updatedAt: Date
            id: string
            isSystem: boolean | null
            userId: string | null
            organizationId: string | null
            providerId: ProviderId
            disabled: boolean
          }
        }
      }>
      delete: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
        }
        output: {
          providerKey: {
            key: {
              baseUrl?: string | undefined
            } & (
              | {
                  providerId:
                    | 'openai'
                    | 'anthropic'
                    | 'google'
                    | 'openrouter'
                    | 'deepseek'
                    | 'mistral'
                    | 'xai'
                    | 'togetherai'
                    | 'cohere'
                    | 'fireworks'
                    | 'deepinfra'
                    | 'cerebras'
                    | 'groq'
                    | 'perplexity'
                    | 'luma'
                    | 'vercel'
                    | 'fal'
                    | 'elevenlabs'
                    | 'lmnt'
                  apiKey: string
                }
              | {
                  providerId: 'azure'
                  apiKey: string
                  baseUrl: string
                  apiVersion?: string | undefined
                }
              | {
                  providerId: 'bedrock'
                  region: string
                  accessKeyId: string
                  secretAccessKey: string
                }
              | {
                  providerId: 'vertex'
                  serviceAccountJson: string
                  location?: string | undefined
                }
              | {
                  providerId: 'replicate'
                  apiToken: string
                }
            )
            id: string
            providerId: ProviderId
            createdAt: Date
            updatedAt: Date
            userId: string | null
            organizationId: string | null
            disabled: boolean
            isSystem: boolean | null
          }
        }
      }>
    }
    app: {
      list: import('@trpc/server').TRPCQueryProcedure<{
        input:
          | {
              organizationId?: string | undefined
              workspaceId?: string | undefined
              order?: 'asc' | 'desc' | undefined
            }
          | undefined
        output: {
          apps: {
            app: {
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
              type: 'single-agent' | 'multiple-agents'
              archived: boolean | null
              archivedAt: Date | null
              deleted: boolean | null
              deletedAt: Date | null
              workspaceId: string
            }
            categories: {
              id: string
              name: string
            }[]
            tags: string[]
          }[]
        }
      }>
      listByCategory: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          workspaceId: string
          categoryId: string
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          apps: {
            app: {
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
              type: 'single-agent' | 'multiple-agents'
              archived: boolean | null
              archivedAt: Date | null
              deleted: boolean | null
              deletedAt: Date | null
              workspaceId: string
            }
            categories: {
              id: string
              name: string
            }[]
            tags: string[]
          }[]
        }
      }>
      listByTags: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          workspaceId: string
          tags: string[]
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          apps: {
            app: {
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
              type: 'single-agent' | 'multiple-agents'
              archived: boolean | null
              archivedAt: Date | null
              deleted: boolean | null
              deletedAt: Date | null
              workspaceId: string
            }
            categories: {
              id: string
              name: string
            }[]
            tags: string[]
          }[]
        }
      }>
      listVersions: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
          after?: number | undefined
          before?: number | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          versions: {
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            type: 'single-agent' | 'multiple-agents'
            appId: string
            version: number
          }[]
          hasMore: boolean
          first: number | undefined
          last: number | undefined
        }
      }>
      byId: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
        }
        output: {
          app: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            type: 'single-agent' | 'multiple-agents'
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
            workspaceId: string
          }
        }
      }>
      getVersion: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
          version: number
        }
        output: {
          version: {
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            type: 'single-agent' | 'multiple-agents'
            appId: string
            version: number
          }
        }
      }>
      create: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          name: string
          metadata: {
            [x: string]: unknown
            description?: string | undefined
            imageUrl?: string | undefined
            clientId?: string | undefined
            languageModel?: string | undefined
            embeddingModel?: string | undefined
            rerankModel?: string | undefined
            imageModel?: string | undefined
            languageModelSettings?:
              | {
                  systemPrompt?: string | undefined
                }
              | undefined
            datasetBindings?: string[] | undefined
          }
          workspaceId: string
          type?: 'single-agent' | 'multiple-agents' | undefined
          archived?: boolean | null | undefined
          archivedAt?: Date | null | undefined
          deleted?: boolean | null | undefined
          deletedAt?: Date | null | undefined
        }
        output: {
          app: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            type: 'single-agent' | 'multiple-agents'
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
            workspaceId: string
          }
          draft: {
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            type: 'single-agent' | 'multiple-agents'
            appId: string
            version: number
          }
        }
      }>
      update: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          name?: string | undefined
          metadata?:
            | {
                [x: string]: unknown
                description?: string | undefined
                imageUrl?: string | undefined
                clientId?: string | undefined
                languageModel?: string | undefined
                embeddingModel?: string | undefined
                rerankModel?: string | undefined
                imageModel?: string | undefined
                languageModelSettings?:
                  | {
                      systemPrompt?: string | undefined
                    }
                  | undefined
                datasetBindings?: string[] | undefined
              }
            | undefined
          archived?: boolean | null | undefined
          archivedAt?: Date | null | undefined
          deleted?: boolean | null | undefined
          deletedAt?: Date | null | undefined
        }
        output: {
          app: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            type: 'single-agent' | 'multiple-agents'
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
            workspaceId: string
          }
          draft: {
            createdAt: Date
            updatedAt: Date
            appId: string
            version: number
            type: 'single-agent' | 'multiple-agents'
            name: string
            metadata: AppMetadata
          }
        }
      }>
      delete: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
        }
        output: void
      }>
      publish: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
        }
        output: {
          app:
            | {
                createdAt: Date
                updatedAt: Date
                id: string
                workspaceId: string
                type: 'single-agent' | 'multiple-agents'
                name: string
                metadata: AppMetadata
                archived: boolean | null
                archivedAt: Date | null
                deleted: boolean | null
                deletedAt: Date | null
              }
            | undefined
          version: number
        }
      }>
      listTags: import('@trpc/server').TRPCQueryProcedure<{
        input:
          | {
              after?: string | undefined
              before?: string | undefined
              limit?: number | undefined
              order?: 'asc' | 'desc' | undefined
            }
          | undefined
        output: {
          tags: {
            name: string
            createdAt: Date
            updatedAt: Date
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      updateTags: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          tags: string[]
        }
        output: {
          tags: {
            name: string
            createdAt: Date
            updatedAt: Date
          }[]
        }
      }>
      listCategories: import('@trpc/server').TRPCQueryProcedure<{
        input:
          | {
              after?: string | undefined
              before?: string | undefined
              limit?: number | undefined
              order?: 'asc' | 'desc' | undefined
            }
          | undefined
        output: {
          categories: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      updateCategories: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          add?: string[] | undefined
          remove?: string[] | undefined
        }
        output: {
          categories: {
            id: string
            name: string
          }[]
        }
      }>
    }
    apiKey: {
      list: import('@trpc/server').TRPCQueryProcedure<{
        input:
          | {
              scope: 'user'
            }
          | {
              scope: 'organization'
              organizationId?: string | undefined
            }
          | {
              scope: 'workspace'
              workspaceId?: string | undefined
            }
          | {
              scope: 'app'
              appId?: string | undefined
            }
          | undefined
        output: {
          keys: (
            | {
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'user'
                id: string
                name: string
              }
            | {
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'organization'
                organizationId: string
                id: string
                name: string
              }
            | {
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'workspace'
                workspaceId: string
                organizationId: string
                id: string
                name: string
              }
            | {
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'app'
                appId: string
                workspaceId: string
                organizationId: string
                id: string
                name: string
              }
          )[]
        }
      }>
      has: import('@trpc/server').TRPCQueryProcedure<{
        input:
          | {
              scope: 'user'
            }
          | {
              scope: 'organization'
              organizationId?: string | undefined
            }
          | {
              scope: 'workspace'
              workspaceId?: string | undefined
            }
          | {
              scope: 'app'
              appId?: string | undefined
            }
          | undefined
        output: {
          exists: boolean
        }
      }>
      get: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
        }
        output: {
          key:
            | {
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'user'
                id: string
                name: string
              }
            | {
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'organization'
                organizationId: string
                id: string
                name: string
              }
            | {
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'workspace'
                workspaceId: string
                organizationId: string
                id: string
                name: string
              }
            | {
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'app'
                appId: string
                workspaceId: string
                organizationId: string
                id: string
                name: string
              }
        }
      }>
      create: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          name: string
        } & (
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
        )
        output: {
          key:
            | {
                key: string
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'user'
                id: string
                name: string
              }
            | {
                key: string
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'organization'
                organizationId: string
                id: string
                name: string
              }
            | {
                key: string
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'workspace'
                workspaceId: string
                organizationId: string
                id: string
                name: string
              }
            | {
                key: string
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'app'
                appId: string
                workspaceId: string
                organizationId: string
                id: string
                name: string
              }
        }
      }>
      rotate: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
        }
        output: {
          key:
            | {
                key: string
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'user'
                id: string
                name: string
              }
            | {
                key: string
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'organization'
                organizationId: string
                id: string
                name: string
              }
            | {
                key: string
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'workspace'
                workspaceId: string
                organizationId: string
                id: string
                name: string
              }
            | {
                key: string
                start: string
                createdAt: Date
                updatedAt: Date
                scope: 'app'
                appId: string
                workspaceId: string
                organizationId: string
                id: string
                name: string
              }
        }
      }>
      verify: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          key: string
        }
        output: {
          isValid: boolean
        }
      }>
      delete: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
        }
        output: void
      }>
    }
    oauthApp: {
      list: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          workspaceId?: string | undefined
          appId?: string | undefined
        }
        output: {
          oauthApps: {
            appId: string
            oauthApp: {
              redirectUris: string[]
              disabled: boolean | null
              metadata: any
              createdAt: Date | null
              updatedAt: Date | null
              clientSecretStart?: string | undefined
              clientSecret?: string | null | undefined
              clientId: string | null
            }
          }[]
        }
      }>
      has: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          appId: string
        }
        output: {
          exists: boolean
        }
      }>
      get: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          appId: string
        }
        output: {
          oauthApp: {
            redirectUris: string[]
            disabled: boolean | null
            metadata: any
            createdAt: Date | null
            updatedAt: Date | null
            clientSecretStart?: string | undefined
            clientSecret?: string | null | undefined
            clientId: string | null
          }
        }
      }>
      info: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          clientId: string
        }
        output: {
          name: string
          imageUrl: string | undefined
          clientId: string | null
          redirectUris: string[]
          disabled: boolean | null
        }
      }>
      create: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          appId: string
          redirectUris?: string[] | undefined
        }
        output: {
          oauthApp: {
            redirectUris: string[]
            disabled: boolean | null
            metadata: any
            createdAt: Date | null
            updatedAt: Date | null
            clientSecretStart?: string | undefined
            clientSecret?: string | null | undefined
            clientId: string | null
          }
        }
      }>
      update: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          appId: string
          redirectUris?: string[] | undefined
          disabled?: boolean | undefined
        }
        output: {
          oauthApp: {
            redirectUris: string[]
            disabled: boolean | null
            metadata: any
            createdAt: Date | null
            updatedAt: Date | null
            clientSecretStart?: string | undefined
            clientSecret?: string | null | undefined
            clientId: string | null
          }
        }
      }>
      delete: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          appId: string
        }
        output: void
      }>
      rotateSecret: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          appId: string
        }
        output: {
          oauthApp: {
            redirectUris: string[]
            disabled: boolean | null
            metadata: any
            createdAt: Date | null
            updatedAt: Date | null
            clientSecretStart?: string | undefined
            clientSecret?: string | null | undefined
            clientId: string | null
          }
        }
      }>
    }
    agent: {
      listByApp: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          appId: string
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          agents: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            appId: string
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      listByAppVersion: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          appId: string
          version: number
        }
        output: {
          versions: {
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            version: number
            agentId: string
          }[]
        }
      }>
      listVersions: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          agentId: string
          after?: number | undefined
          before?: number | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          versions: {
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            version: number
            agentId: string
          }[]
          hasMore: boolean
          first: number | undefined
          last: number | undefined
        }
      }>
      byId: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
        }
        output: {
          agent: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            appId: string
          }
        }
      }>
      create: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          name: string
          appId: string
          metadata?:
            | {
                [x: string]: unknown
                description?: string | undefined
                imageUrl?: string | undefined
                languageModel?: string | undefined
                embeddingModel?: string | undefined
                rerankModel?: string | undefined
                imageModel?: string | undefined
                languageModelSettings?:
                  | {
                      systemPrompt?: string | undefined
                    }
                  | undefined
                datasetBindings?: string[] | undefined
              }
            | undefined
        }
        output: {
          agent: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            appId: string
          }
          draft: {
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            version: number
            agentId: string
          }
        }
      }>
      update: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          name?: string | undefined
          metadata?:
            | {
                [x: string]: unknown
                description?: string | undefined
                imageUrl?: string | undefined
                languageModel?: string | undefined
                embeddingModel?: string | undefined
                rerankModel?: string | undefined
                imageModel?: string | undefined
                languageModelSettings?:
                  | {
                      systemPrompt?: string | undefined
                    }
                  | undefined
                datasetBindings?: string[] | undefined
              }
            | undefined
        }
        output: {
          agent: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            appId: string
          }
          draft: {
            createdAt: Date
            updatedAt: Date
            agentId: string
            version: number
            name: string
            metadata: AgentMetadata
          }
        }
      }>
    }
    dataset: {
      list: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          workspaceId: string
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          datasets: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: DatasetMetadata
            workspaceId: string
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      byId: import('@trpc/server').TRPCQueryProcedure<{
        input: string
        output: {
          dataset: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: DatasetMetadata
            workspaceId: string
          }
        }
      }>
      create: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          name: string
          metadata: {
            languageModel?: string | undefined
            embeddingModel?: string | undefined
            rerankModel?: string | undefined
            retrievalMode?: 'vector-search' | 'full-text-search' | 'hybrid-search' | undefined
            topK?: number | undefined
            scoreThreshold?: number | undefined
            stats?:
              | {
                  totalSizeBytes?: number | undefined
                }
              | undefined
          }
          workspaceId: string
        }
        output: {
          dataset: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: DatasetMetadata
            workspaceId: string
          }
        }
      }>
      update: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          name?: string | undefined
          metadata?:
            | {
                languageModel?: string | undefined
                embeddingModel?: string | undefined
                rerankModel?: string | undefined
                retrievalMode?: 'vector-search' | 'full-text-search' | 'hybrid-search' | undefined
                topK?: number | undefined
                scoreThreshold?: number | undefined
                stats?:
                  | {
                      totalSizeBytes?: number | undefined
                    }
                  | undefined
              }
            | undefined
        }
        output: {
          dataset: {
            createdAt: Date
            updatedAt: Date
            id: string
            workspaceId: string
            name: string
            metadata: DatasetMetadata
          }
        }
      }>
      delete: import('@trpc/server').TRPCMutationProcedure<{
        input: string
        output: void
      }>
      createDocument: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          name: string
          workspaceId: string
          datasetId: string
          metadata?:
            | {
                url?: string | undefined
                processed?: boolean | undefined
                taskId?: string | undefined
              }
            | undefined
        }
        output: {
          document: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: DocumentMetadata
            workspaceId: string
            datasetId: string
          }
        }
      }>
      updateDocument: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          name?: string | undefined
          metadata?:
            | {
                url?: string | undefined
                processed?: boolean | undefined
                taskId?: string | undefined
              }
            | undefined
        }
        output: {
          document: {
            createdAt: Date
            updatedAt: Date
            id: string
            workspaceId: string
            datasetId: string
            name: string
            metadata: DocumentMetadata
          }
        }
      }>
      deleteDocument: import('@trpc/server').TRPCMutationProcedure<{
        input: string
        output: void
      }>
      listDocuments: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          datasetId: string
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          documents: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: DocumentMetadata
            workspaceId: string
            datasetId: string
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      getDocument: import('@trpc/server').TRPCQueryProcedure<{
        input: string
        output: {
          document: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: DocumentMetadata
            workspaceId: string
            datasetId: string
          }
        }
      }>
      createSegment: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          workspaceId: string
          content: string
          datasetId: string
          documentId: string
          index: number
          metadata?: Record<string, unknown> | undefined
        }
        output: {
          segment: {
            id: string
            createdAt: Date
            updatedAt: Date
            metadata: unknown
            workspaceId: string
            content: string
            datasetId: string
            documentId: string
            index: number
          }
        }
      }>
      updateSegment: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          metadata?: Record<string, unknown> | undefined
          content?: string | undefined
        }
        output: {
          segment: {
            createdAt: Date
            updatedAt: Date
            id: string
            workspaceId: string
            datasetId: string
            documentId: string
            index: number
            content: string
            metadata: unknown
          }
        }
      }>
      deleteSegment: import('@trpc/server').TRPCMutationProcedure<{
        input: string
        output: {
          success: boolean
        }
      }>
      listSegments: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          documentId: string
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          segments: {
            id: string
            createdAt: Date
            updatedAt: Date
            metadata: unknown
            workspaceId: string
            content: string
            datasetId: string
            documentId: string
            index: number
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      createChunk: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          workspaceId: string
          content: string
          datasetId: string
          documentId: string
          index: number
          segmentId: string
          metadata?: Record<string, unknown> | undefined
        }
        output: {
          chunk: {
            id: string
            createdAt: Date
            updatedAt: Date
            metadata: unknown
            workspaceId: string
            content: string
            datasetId: string
            documentId: string
            index: number
            segmentId: string
          }
        }
      }>
      updateChunk: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          metadata?: Record<string, unknown> | undefined
          content?: string | undefined
        }
        output: {
          chunk: {
            createdAt: Date
            updatedAt: Date
            id: string
            workspaceId: string
            datasetId: string
            documentId: string
            segmentId: string
            index: number
            content: string
            metadata: unknown
          }
        }
      }>
      deleteChunk: import('@trpc/server').TRPCMutationProcedure<{
        input: string
        output: {
          success: boolean
        }
      }>
      listChunks: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          segmentId: string
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          chunks: {
            id: string
            createdAt: Date
            updatedAt: Date
            metadata: unknown
            workspaceId: string
            content: string
            datasetId: string
            documentId: string
            index: number
            segmentId: string
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
    }
    storage: {
      list: import('@trpc/server').TRPCQueryProcedure<{
        input:
          | {
              prefix?: string | undefined
              limit?: number | undefined
              delimiter?: string | undefined
              cursor?: string | undefined
              startAfter?: string | undefined
            }
          | undefined
        output: {
          truncated: boolean
          cursor: string | undefined
          objects: {
            key: string
            size: number
            uploadedAt: Date
            etag: string
            storageClass: string
          }[]
          prefix: string | undefined
          delimiter: string | undefined
          delimitedPrefixes: string[] | undefined
          count: number | undefined
          limit: number | undefined
          startAfter: string | undefined
        }
      }>
      head: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          key: string
        }
        output: {
          size: number
          uploadedAt: Date
          etag: string
          storageClass: string
          checksums: {
            sha1: string | undefined
            sha256: string | undefined
          }
        } | null
      }>
      get: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          key: string
        }
        output: AsyncGenerator<any, void, unknown>
      }>
      createPresignedDownloadUrl: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          key: string
          expiresIn?: number | undefined
        }
        output: {
          url: string
        }
      }>
      put: import('@trpc/server').TRPCMutationProcedure<{
        input:
          | FormData
          | {
              entries(): IterableIterator<[string, FormDataEntryValue]>
              [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>
            }
          | {
              key: string
              file: File
            }
        output: {
          size: number
          etag: string
          checksums: {
            sha1: string | undefined
            sha256: string | undefined
          }
        }
      }>
      createPresignedUploadUrl: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          key: string
          expiresIn?: number | undefined
        }
        output: {
          url: string
        }
      }>
      delete: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          keys: string | string[]
        }
        output: {
          deleted: number
        }
      }>
      listMultipartUploads: import('@trpc/server').TRPCQueryProcedure<{
        input:
          | {
              prefix?: string | undefined
              limit?: number | undefined
              delimiter?: string | undefined
              keyMarker?: string | undefined
              uploadIdMarker?: string | undefined
            }
          | undefined
        output: {
          prefix: string | undefined
          delimiter: string | undefined
          limit: number | undefined
          keyMarker: string | undefined
          uploadIdMarker: string | undefined
          nextKeyMarker: string | undefined
          nextUploadIdMarker: string | undefined
          truncated: boolean | undefined
          delimitedPrefixes: string[] | undefined
          uploads:
            | {
                uploadId: string | undefined
                key: string | undefined
                initiated: Date | undefined
                storageClass: string
              }[]
            | undefined
        }
      }>
      createMultipartUpload: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          key: string
        }
        output: {
          key: string
          uploadId: string
        }
      }>
      uploadPart: import('@trpc/server').TRPCMutationProcedure<{
        input:
          | FormData
          | {
              entries(): IterableIterator<[string, FormDataEntryValue]>
              [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>
            }
          | {
              key: string
              file: File
              uploadId: string
              partNumber: number
              expiresIn?: number | undefined
            }
        output: {
          etag: string
          checksums: {
            sha1: string | undefined
            sha256: string | undefined
          }
        }
      }>
      createPresignedUploadPartUrl: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          key: string
          uploadId: string
          partNumber: number
          expiresIn?: number | undefined
        }
        output: {
          url: string
        }
      }>
      completeMultipartUpload: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          key: string
          parts: {
            ETag: string
            PartNumber: number
          }[]
          uploadId: string
        }
        output: {
          key: string
          etag: string
          checksums: {
            sha1: string | undefined
            sha256: string | undefined
          }
        }
      }>
      abortMultipartUpload: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          key: string
          uploadId: string
        }
        output: void
      }>
    }
    model: {
      listDefaultModels: import('@trpc/server').TRPCQueryProcedure<{
        input: void
        output: {
          defaultModels: {
            app: {
              languageModel:
                | `openai:${string}`
                | `anthropic:${string}`
                | `google:${string}`
                | `openrouter:${string}`
                | `vertex:${string}`
                | `azure:${string}`
                | `bedrock:${string}`
                | `deepseek:${string}`
                | `mistral:${string}`
                | `xai:${string}`
                | `togetherai:${string}`
                | `cohere:${string}`
                | `fireworks:${string}`
                | `deepinfra:${string}`
                | `cerebras:${string}`
                | `groq:${string}`
                | `replicate:${string}`
                | `perplexity:${string}`
                | `luma:${string}`
                | `vercel:${string}`
                | `fal:${string}`
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              embeddingModel:
                | `openai:${string}`
                | `anthropic:${string}`
                | `google:${string}`
                | `openrouter:${string}`
                | `vertex:${string}`
                | `azure:${string}`
                | `bedrock:${string}`
                | `deepseek:${string}`
                | `mistral:${string}`
                | `xai:${string}`
                | `togetherai:${string}`
                | `cohere:${string}`
                | `fireworks:${string}`
                | `deepinfra:${string}`
                | `cerebras:${string}`
                | `groq:${string}`
                | `replicate:${string}`
                | `perplexity:${string}`
                | `luma:${string}`
                | `vercel:${string}`
                | `fal:${string}`
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              rerankModel:
                | `openai:${string}`
                | `anthropic:${string}`
                | `google:${string}`
                | `openrouter:${string}`
                | `vertex:${string}`
                | `azure:${string}`
                | `bedrock:${string}`
                | `deepseek:${string}`
                | `mistral:${string}`
                | `xai:${string}`
                | `togetherai:${string}`
                | `cohere:${string}`
                | `fireworks:${string}`
                | `deepinfra:${string}`
                | `cerebras:${string}`
                | `groq:${string}`
                | `replicate:${string}`
                | `perplexity:${string}`
                | `luma:${string}`
                | `vercel:${string}`
                | `fal:${string}`
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              imageModel:
                | `openai:${string}`
                | `anthropic:${string}`
                | `google:${string}`
                | `openrouter:${string}`
                | `vertex:${string}`
                | `azure:${string}`
                | `bedrock:${string}`
                | `deepseek:${string}`
                | `mistral:${string}`
                | `xai:${string}`
                | `togetherai:${string}`
                | `cohere:${string}`
                | `fireworks:${string}`
                | `deepinfra:${string}`
                | `cerebras:${string}`
                | `groq:${string}`
                | `replicate:${string}`
                | `perplexity:${string}`
                | `luma:${string}`
                | `vercel:${string}`
                | `fal:${string}`
                | `elevenlabs:${string}`
                | `lmnt:${string}`
            }
            dataset: {
              languageModel:
                | `openai:${string}`
                | `anthropic:${string}`
                | `google:${string}`
                | `openrouter:${string}`
                | `vertex:${string}`
                | `azure:${string}`
                | `bedrock:${string}`
                | `deepseek:${string}`
                | `mistral:${string}`
                | `xai:${string}`
                | `togetherai:${string}`
                | `cohere:${string}`
                | `fireworks:${string}`
                | `deepinfra:${string}`
                | `cerebras:${string}`
                | `groq:${string}`
                | `replicate:${string}`
                | `perplexity:${string}`
                | `luma:${string}`
                | `vercel:${string}`
                | `fal:${string}`
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              embeddingModel:
                | `openai:${string}`
                | `anthropic:${string}`
                | `google:${string}`
                | `openrouter:${string}`
                | `vertex:${string}`
                | `azure:${string}`
                | `bedrock:${string}`
                | `deepseek:${string}`
                | `mistral:${string}`
                | `xai:${string}`
                | `togetherai:${string}`
                | `cohere:${string}`
                | `fireworks:${string}`
                | `deepinfra:${string}`
                | `cerebras:${string}`
                | `groq:${string}`
                | `replicate:${string}`
                | `perplexity:${string}`
                | `luma:${string}`
                | `vercel:${string}`
                | `fal:${string}`
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              rerankModel:
                | `openai:${string}`
                | `anthropic:${string}`
                | `google:${string}`
                | `openrouter:${string}`
                | `vertex:${string}`
                | `azure:${string}`
                | `bedrock:${string}`
                | `deepseek:${string}`
                | `mistral:${string}`
                | `xai:${string}`
                | `togetherai:${string}`
                | `cohere:${string}`
                | `fireworks:${string}`
                | `deepinfra:${string}`
                | `cerebras:${string}`
                | `groq:${string}`
                | `replicate:${string}`
                | `perplexity:${string}`
                | `luma:${string}`
                | `vercel:${string}`
                | `fal:${string}`
                | `elevenlabs:${string}`
                | `lmnt:${string}`
            }
          }
        }
      }>
      listProviders: import('@trpc/server').TRPCQueryProcedure<{
        input: void
        output: {
          providers: {
            enabled: boolean
            id: ProviderId
            name: string
            icon: string
            description: string
            isGateway?: boolean
          }[]
        }
      }>
      listProvidersModels: import('@trpc/server').TRPCQueryProcedure<{
        input:
          | {
              organizationId?: string | undefined
              type?: 'image' | 'language' | 'speech' | 'transcription' | 'textEmbedding' | undefined
              source?: 'custom' | 'system' | undefined
            }
          | undefined
        output: {
          models: {
            language:
              | {
                  id: ProviderId
                  name: string
                  description: string
                  icon: string
                  isGateway: boolean | undefined
                  models: (LanguageModelInfo & {
                    isSystem?: boolean
                  } & {
                    id:
                      | `openai:${string}`
                      | `anthropic:${string}`
                      | `google:${string}`
                      | `openrouter:${string}`
                      | `vertex:${string}`
                      | `azure:${string}`
                      | `bedrock:${string}`
                      | `deepseek:${string}`
                      | `mistral:${string}`
                      | `xai:${string}`
                      | `togetherai:${string}`
                      | `cohere:${string}`
                      | `fireworks:${string}`
                      | `deepinfra:${string}`
                      | `cerebras:${string}`
                      | `groq:${string}`
                      | `replicate:${string}`
                      | `perplexity:${string}`
                      | `luma:${string}`
                      | `vercel:${string}`
                      | `fal:${string}`
                      | `elevenlabs:${string}`
                      | `lmnt:${string}`
                  })[]
                }[]
              | undefined
            image:
              | {
                  id: ProviderId
                  name: string
                  description: string
                  icon: string
                  isGateway: boolean | undefined
                  models: (ImageModelInfo & {
                    isSystem?: boolean
                  } & {
                    id:
                      | `openai:${string}`
                      | `anthropic:${string}`
                      | `google:${string}`
                      | `openrouter:${string}`
                      | `vertex:${string}`
                      | `azure:${string}`
                      | `bedrock:${string}`
                      | `deepseek:${string}`
                      | `mistral:${string}`
                      | `xai:${string}`
                      | `togetherai:${string}`
                      | `cohere:${string}`
                      | `fireworks:${string}`
                      | `deepinfra:${string}`
                      | `cerebras:${string}`
                      | `groq:${string}`
                      | `replicate:${string}`
                      | `perplexity:${string}`
                      | `luma:${string}`
                      | `vercel:${string}`
                      | `fal:${string}`
                      | `elevenlabs:${string}`
                      | `lmnt:${string}`
                  })[]
                }[]
              | undefined
            speech:
              | {
                  id: ProviderId
                  name: string
                  description: string
                  icon: string
                  isGateway: boolean | undefined
                  models: (SpeechModelInfo & {
                    isSystem?: boolean
                  } & {
                    id:
                      | `openai:${string}`
                      | `anthropic:${string}`
                      | `google:${string}`
                      | `openrouter:${string}`
                      | `vertex:${string}`
                      | `azure:${string}`
                      | `bedrock:${string}`
                      | `deepseek:${string}`
                      | `mistral:${string}`
                      | `xai:${string}`
                      | `togetherai:${string}`
                      | `cohere:${string}`
                      | `fireworks:${string}`
                      | `deepinfra:${string}`
                      | `cerebras:${string}`
                      | `groq:${string}`
                      | `replicate:${string}`
                      | `perplexity:${string}`
                      | `luma:${string}`
                      | `vercel:${string}`
                      | `fal:${string}`
                      | `elevenlabs:${string}`
                      | `lmnt:${string}`
                  })[]
                }[]
              | undefined
            transcription:
              | {
                  id: ProviderId
                  name: string
                  description: string
                  icon: string
                  isGateway: boolean | undefined
                  models: (TranscriptionModelInfo & {
                    isSystem?: boolean
                  } & {
                    id:
                      | `openai:${string}`
                      | `anthropic:${string}`
                      | `google:${string}`
                      | `openrouter:${string}`
                      | `vertex:${string}`
                      | `azure:${string}`
                      | `bedrock:${string}`
                      | `deepseek:${string}`
                      | `mistral:${string}`
                      | `xai:${string}`
                      | `togetherai:${string}`
                      | `cohere:${string}`
                      | `fireworks:${string}`
                      | `deepinfra:${string}`
                      | `cerebras:${string}`
                      | `groq:${string}`
                      | `replicate:${string}`
                      | `perplexity:${string}`
                      | `luma:${string}`
                      | `vercel:${string}`
                      | `fal:${string}`
                      | `elevenlabs:${string}`
                      | `lmnt:${string}`
                  })[]
                }[]
              | undefined
            textEmbedding:
              | {
                  id: ProviderId
                  name: string
                  description: string
                  icon: string
                  isGateway: boolean | undefined
                  models: (EmbeddingModelInfo & {
                    isSystem?: boolean
                  } & {
                    id:
                      | `openai:${string}`
                      | `anthropic:${string}`
                      | `google:${string}`
                      | `openrouter:${string}`
                      | `vertex:${string}`
                      | `azure:${string}`
                      | `bedrock:${string}`
                      | `deepseek:${string}`
                      | `mistral:${string}`
                      | `xai:${string}`
                      | `togetherai:${string}`
                      | `cohere:${string}`
                      | `fireworks:${string}`
                      | `deepinfra:${string}`
                      | `cerebras:${string}`
                      | `groq:${string}`
                      | `replicate:${string}`
                      | `perplexity:${string}`
                      | `luma:${string}`
                      | `vercel:${string}`
                      | `fal:${string}`
                      | `elevenlabs:${string}`
                      | `lmnt:${string}`
                  })[]
                }[]
              | undefined
          }
        }
      }>
      listModels: import('@trpc/server').TRPCQueryProcedure<{
        input:
          | {
              organizationId?: string | undefined
              type?: 'image' | 'language' | 'speech' | 'transcription' | 'textEmbedding' | undefined
              source?: 'custom' | 'system' | undefined
            }
          | undefined
        output: {
          models: {
            language:
              | (LanguageModelInfo & {
                  isSystem?: boolean
                } & {
                  id:
                    | `openai:${string}`
                    | `anthropic:${string}`
                    | `google:${string}`
                    | `openrouter:${string}`
                    | `vertex:${string}`
                    | `azure:${string}`
                    | `bedrock:${string}`
                    | `deepseek:${string}`
                    | `mistral:${string}`
                    | `xai:${string}`
                    | `togetherai:${string}`
                    | `cohere:${string}`
                    | `fireworks:${string}`
                    | `deepinfra:${string}`
                    | `cerebras:${string}`
                    | `groq:${string}`
                    | `replicate:${string}`
                    | `perplexity:${string}`
                    | `luma:${string}`
                    | `vercel:${string}`
                    | `fal:${string}`
                    | `elevenlabs:${string}`
                    | `lmnt:${string}`
                })[]
              | undefined
            image:
              | (ImageModelInfo & {
                  isSystem?: boolean
                } & {
                  id:
                    | `openai:${string}`
                    | `anthropic:${string}`
                    | `google:${string}`
                    | `openrouter:${string}`
                    | `vertex:${string}`
                    | `azure:${string}`
                    | `bedrock:${string}`
                    | `deepseek:${string}`
                    | `mistral:${string}`
                    | `xai:${string}`
                    | `togetherai:${string}`
                    | `cohere:${string}`
                    | `fireworks:${string}`
                    | `deepinfra:${string}`
                    | `cerebras:${string}`
                    | `groq:${string}`
                    | `replicate:${string}`
                    | `perplexity:${string}`
                    | `luma:${string}`
                    | `vercel:${string}`
                    | `fal:${string}`
                    | `elevenlabs:${string}`
                    | `lmnt:${string}`
                })[]
              | undefined
            speech:
              | (SpeechModelInfo & {
                  isSystem?: boolean
                } & {
                  id:
                    | `openai:${string}`
                    | `anthropic:${string}`
                    | `google:${string}`
                    | `openrouter:${string}`
                    | `vertex:${string}`
                    | `azure:${string}`
                    | `bedrock:${string}`
                    | `deepseek:${string}`
                    | `mistral:${string}`
                    | `xai:${string}`
                    | `togetherai:${string}`
                    | `cohere:${string}`
                    | `fireworks:${string}`
                    | `deepinfra:${string}`
                    | `cerebras:${string}`
                    | `groq:${string}`
                    | `replicate:${string}`
                    | `perplexity:${string}`
                    | `luma:${string}`
                    | `vercel:${string}`
                    | `fal:${string}`
                    | `elevenlabs:${string}`
                    | `lmnt:${string}`
                })[]
              | undefined
            transcription:
              | (TranscriptionModelInfo & {
                  isSystem?: boolean
                } & {
                  id:
                    | `openai:${string}`
                    | `anthropic:${string}`
                    | `google:${string}`
                    | `openrouter:${string}`
                    | `vertex:${string}`
                    | `azure:${string}`
                    | `bedrock:${string}`
                    | `deepseek:${string}`
                    | `mistral:${string}`
                    | `xai:${string}`
                    | `togetherai:${string}`
                    | `cohere:${string}`
                    | `fireworks:${string}`
                    | `deepinfra:${string}`
                    | `cerebras:${string}`
                    | `groq:${string}`
                    | `replicate:${string}`
                    | `perplexity:${string}`
                    | `luma:${string}`
                    | `vercel:${string}`
                    | `fal:${string}`
                    | `elevenlabs:${string}`
                    | `lmnt:${string}`
                })[]
              | undefined
            textEmbedding:
              | (EmbeddingModelInfo & {
                  isSystem?: boolean
                } & {
                  id:
                    | `openai:${string}`
                    | `anthropic:${string}`
                    | `google:${string}`
                    | `openrouter:${string}`
                    | `vertex:${string}`
                    | `azure:${string}`
                    | `bedrock:${string}`
                    | `deepseek:${string}`
                    | `mistral:${string}`
                    | `xai:${string}`
                    | `togetherai:${string}`
                    | `cohere:${string}`
                    | `fireworks:${string}`
                    | `deepinfra:${string}`
                    | `cerebras:${string}`
                    | `groq:${string}`
                    | `replicate:${string}`
                    | `perplexity:${string}`
                    | `luma:${string}`
                    | `vercel:${string}`
                    | `fal:${string}`
                    | `elevenlabs:${string}`
                    | `lmnt:${string}`
                })[]
              | undefined
          }
        }
      }>
      getModel: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id:
            | `openai:${string}`
            | `anthropic:${string}`
            | `google:${string}`
            | `openrouter:${string}`
            | `vertex:${string}`
            | `azure:${string}`
            | `bedrock:${string}`
            | `deepseek:${string}`
            | `mistral:${string}`
            | `xai:${string}`
            | `togetherai:${string}`
            | `cohere:${string}`
            | `fireworks:${string}`
            | `deepinfra:${string}`
            | `cerebras:${string}`
            | `groq:${string}`
            | `replicate:${string}`
            | `perplexity:${string}`
            | `luma:${string}`
            | `vercel:${string}`
            | `fal:${string}`
            | `elevenlabs:${string}`
            | `lmnt:${string}`
          type: 'image' | 'language' | 'speech' | 'transcription' | 'textEmbedding'
          organizationId?: string | undefined
          source?: 'custom' | 'system' | undefined
        }
        output: {
          model:
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                contextWindow?: number
                maxOutputTokens?: number
                inputTokenPrice?: string
                cachedInputTokenPrice?: string
                cacheInputTokenPrice?: string | [string, string][]
                outputTokenPrice?: string
                modality?: {
                  input?: Modality[]
                  output?: Modality[]
                }
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                imageInputTokenPrice?: string
                imageCachedInputTokenPrice?: string
                imageOutputTokenPrice?: string
                textInputTokenPrice?: string
                textCachedInputTokenPrice?: string
                pricePerImage?: string | [string, string][] | [string, [string, string][]][]
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                maxInputTokens?: number
                textTokenPrice?: string
                audioTokenPrice?: string
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                audioTokenPrice?: string
                textInputTokenPrice?: string
                textOutputTokenPrice?: string
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                tokenPrice?: string
                dimensions?: number | number[]
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
        }
      }>
      updateModel: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          providerId:
            | 'openai'
            | 'anthropic'
            | 'google'
            | 'openrouter'
            | 'vertex'
            | 'azure'
            | 'bedrock'
            | 'deepseek'
            | 'mistral'
            | 'xai'
            | 'togetherai'
            | 'cohere'
            | 'fireworks'
            | 'deepinfra'
            | 'cerebras'
            | 'groq'
            | 'replicate'
            | 'perplexity'
            | 'luma'
            | 'vercel'
            | 'fal'
            | 'elevenlabs'
            | 'lmnt'
          organizationId?: string | undefined
          isSystem?: boolean | undefined
        } & (
          | {
              type: 'language'
              model: {
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                contextWindow?: number | undefined
                maxOutputTokens?: number | undefined
                inputTokenPrice?: string | undefined
                cachedInputTokenPrice?: string | undefined
                cacheInputTokenPrice?: string | [string, string][] | undefined
                outputTokenPrice?: string | undefined
                modality?:
                  | {
                      input?: ('image' | 'text' | 'audio' | 'video' | 'pdf')[] | undefined
                      output?: ('image' | 'text' | 'audio' | 'video' | 'pdf')[] | undefined
                    }
                  | undefined
              }
            }
          | {
              type: 'image'
              model: {
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                imageInputTokenPrice?: string | undefined
                imageCachedInputTokenPrice?: string | undefined
                imageOutputTokenPrice?: string | undefined
                textInputTokenPrice?: string | undefined
                textCachedInputTokenPrice?: string | undefined
                pricePerImage?:
                  | string
                  | [string, string][]
                  | [string, [string, string][]][]
                  | undefined
              }
            }
          | {
              type: 'speech'
              model: {
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                maxInputTokens?: number | undefined
                textTokenPrice?: string | undefined
                audioTokenPrice?: string | undefined
              }
            }
          | {
              type: 'transcription'
              model: {
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                audioTokenPrice?: string | undefined
                textInputTokenPrice?: string | undefined
                textOutputTokenPrice?: string | undefined
              }
            }
          | {
              type: 'textEmbedding'
              model: {
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                tokenPrice?: string | undefined
                dimensions?: number | number[] | undefined
              }
            }
        )
        output: {
          model:
            | {
                isSystem: boolean
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                contextWindow?: number | undefined
                maxOutputTokens?: number | undefined
                inputTokenPrice?: string | undefined
                cachedInputTokenPrice?: string | undefined
                cacheInputTokenPrice?: string | [string, string][] | undefined
                outputTokenPrice?: string | undefined
                modality?:
                  | {
                      input?: ('image' | 'text' | 'audio' | 'video' | 'pdf')[] | undefined
                      output?: ('image' | 'text' | 'audio' | 'video' | 'pdf')[] | undefined
                    }
                  | undefined
              }
            | {
                isSystem: boolean
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                imageInputTokenPrice?: string | undefined
                imageCachedInputTokenPrice?: string | undefined
                imageOutputTokenPrice?: string | undefined
                textInputTokenPrice?: string | undefined
                textCachedInputTokenPrice?: string | undefined
                pricePerImage?:
                  | string
                  | [string, string][]
                  | [string, [string, string][]][]
                  | undefined
              }
            | {
                isSystem: boolean
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                maxInputTokens?: number | undefined
                textTokenPrice?: string | undefined
                audioTokenPrice?: string | undefined
              }
            | {
                isSystem: boolean
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                audioTokenPrice?: string | undefined
                textInputTokenPrice?: string | undefined
                textOutputTokenPrice?: string | undefined
              }
            | {
                isSystem: boolean
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                tokenPrice?: string | undefined
                dimensions?: number | number[] | undefined
              }
        }
      }>
      updateModels: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          providerId:
            | 'openai'
            | 'anthropic'
            | 'google'
            | 'openrouter'
            | 'vertex'
            | 'azure'
            | 'bedrock'
            | 'deepseek'
            | 'mistral'
            | 'xai'
            | 'togetherai'
            | 'cohere'
            | 'fireworks'
            | 'deepinfra'
            | 'cerebras'
            | 'groq'
            | 'replicate'
            | 'perplexity'
            | 'luma'
            | 'vercel'
            | 'fal'
            | 'elevenlabs'
            | 'lmnt'
          organizationId?: string | undefined
          isSystem?: boolean | undefined
        } & (
          | {
              type: 'language'
              models: {
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                contextWindow?: number | undefined
                maxOutputTokens?: number | undefined
                inputTokenPrice?: string | undefined
                cachedInputTokenPrice?: string | undefined
                cacheInputTokenPrice?: string | [string, string][] | undefined
                outputTokenPrice?: string | undefined
                modality?:
                  | {
                      input?: ('image' | 'text' | 'audio' | 'video' | 'pdf')[] | undefined
                      output?: ('image' | 'text' | 'audio' | 'video' | 'pdf')[] | undefined
                    }
                  | undefined
              }[]
            }
          | {
              type: 'image'
              models: {
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                imageInputTokenPrice?: string | undefined
                imageCachedInputTokenPrice?: string | undefined
                imageOutputTokenPrice?: string | undefined
                textInputTokenPrice?: string | undefined
                textCachedInputTokenPrice?: string | undefined
                pricePerImage?:
                  | string
                  | [string, string][]
                  | [string, [string, string][]][]
                  | undefined
              }[]
            }
          | {
              type: 'speech'
              models: {
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                maxInputTokens?: number | undefined
                textTokenPrice?: string | undefined
                audioTokenPrice?: string | undefined
              }[]
            }
          | {
              type: 'transcription'
              models: {
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                audioTokenPrice?: string | undefined
                textInputTokenPrice?: string | undefined
                textOutputTokenPrice?: string | undefined
              }[]
            }
          | {
              type: 'textEmbedding'
              models: {
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                tokenPrice?: string | undefined
                dimensions?: number | number[] | undefined
              }[]
            }
        )
        output: {
          models: (
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                name: string
                description: string
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                contextWindow?: number | undefined
                maxOutputTokens?: number | undefined
                inputTokenPrice?: string | undefined
                cachedInputTokenPrice?: string | undefined
                cacheInputTokenPrice?: string | [string, string][] | undefined
                outputTokenPrice?: string | undefined
                modality?:
                  | {
                      input?: ('image' | 'text' | 'audio' | 'video' | 'pdf')[] | undefined
                      output?: ('image' | 'text' | 'audio' | 'video' | 'pdf')[] | undefined
                    }
                  | undefined
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                name: string
                description: string
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                imageInputTokenPrice?: string | undefined
                imageCachedInputTokenPrice?: string | undefined
                imageOutputTokenPrice?: string | undefined
                textInputTokenPrice?: string | undefined
                textCachedInputTokenPrice?: string | undefined
                pricePerImage?:
                  | string
                  | [string, string][]
                  | [string, [string, string][]][]
                  | undefined
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                name: string
                description: string
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                maxInputTokens?: number | undefined
                textTokenPrice?: string | undefined
                audioTokenPrice?: string | undefined
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                name: string
                description: string
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                audioTokenPrice?: string | undefined
                textInputTokenPrice?: string | undefined
                textOutputTokenPrice?: string | undefined
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                name: string
                description: string
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                tokenPrice?: string | undefined
                dimensions?: number | number[] | undefined
              }
          )[]
        }
      }>
      sortModels: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          providerId:
            | 'openai'
            | 'anthropic'
            | 'google'
            | 'openrouter'
            | 'vertex'
            | 'azure'
            | 'bedrock'
            | 'deepseek'
            | 'mistral'
            | 'xai'
            | 'togetherai'
            | 'cohere'
            | 'fireworks'
            | 'deepinfra'
            | 'cerebras'
            | 'groq'
            | 'replicate'
            | 'perplexity'
            | 'luma'
            | 'vercel'
            | 'fal'
            | 'elevenlabs'
            | 'lmnt'
          type: 'image' | 'language' | 'speech' | 'transcription' | 'textEmbedding'
          ids: (
            | `openai:${string}`
            | `anthropic:${string}`
            | `google:${string}`
            | `openrouter:${string}`
            | `vertex:${string}`
            | `azure:${string}`
            | `bedrock:${string}`
            | `deepseek:${string}`
            | `mistral:${string}`
            | `xai:${string}`
            | `togetherai:${string}`
            | `cohere:${string}`
            | `fireworks:${string}`
            | `deepinfra:${string}`
            | `cerebras:${string}`
            | `groq:${string}`
            | `replicate:${string}`
            | `perplexity:${string}`
            | `luma:${string}`
            | `vercel:${string}`
            | `fal:${string}`
            | `elevenlabs:${string}`
            | `lmnt:${string}`
          )[]
          organizationId?: string | undefined
          isSystem?: boolean | undefined
        }
        output: {
          models: (
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                contextWindow?: number
                maxOutputTokens?: number
                inputTokenPrice?: string
                cachedInputTokenPrice?: string
                cacheInputTokenPrice?: string | [string, string][]
                outputTokenPrice?: string
                modality?: {
                  input?: Modality[]
                  output?: Modality[]
                }
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                imageInputTokenPrice?: string
                imageCachedInputTokenPrice?: string
                imageOutputTokenPrice?: string
                textInputTokenPrice?: string
                textCachedInputTokenPrice?: string
                pricePerImage?: string | [string, string][] | [string, [string, string][]][]
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                maxInputTokens?: number
                textTokenPrice?: string
                audioTokenPrice?: string
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                audioTokenPrice?: string
                textInputTokenPrice?: string
                textOutputTokenPrice?: string
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                tokenPrice?: string
                dimensions?: number | number[]
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
          )[]
        }
      }>
      deleteModel: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id:
            | `openai:${string}`
            | `anthropic:${string}`
            | `google:${string}`
            | `openrouter:${string}`
            | `vertex:${string}`
            | `azure:${string}`
            | `bedrock:${string}`
            | `deepseek:${string}`
            | `mistral:${string}`
            | `xai:${string}`
            | `togetherai:${string}`
            | `cohere:${string}`
            | `fireworks:${string}`
            | `deepinfra:${string}`
            | `cerebras:${string}`
            | `groq:${string}`
            | `replicate:${string}`
            | `perplexity:${string}`
            | `luma:${string}`
            | `vercel:${string}`
            | `fal:${string}`
            | `elevenlabs:${string}`
            | `lmnt:${string}`
          type: 'image' | 'language' | 'speech' | 'transcription' | 'textEmbedding'
          organizationId?: string | undefined
          isSystem?: boolean | undefined
        }
        output: {
          model:
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                contextWindow?: number
                maxOutputTokens?: number
                inputTokenPrice?: string
                cachedInputTokenPrice?: string
                cacheInputTokenPrice?: string | [string, string][]
                outputTokenPrice?: string
                modality?: {
                  input?: Modality[]
                  output?: Modality[]
                }
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                imageInputTokenPrice?: string
                imageCachedInputTokenPrice?: string
                imageOutputTokenPrice?: string
                textInputTokenPrice?: string
                textCachedInputTokenPrice?: string
                pricePerImage?: string | [string, string][] | [string, [string, string][]][]
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                maxInputTokens?: number
                textTokenPrice?: string
                audioTokenPrice?: string
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                audioTokenPrice?: string
                textInputTokenPrice?: string
                textOutputTokenPrice?: string
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                tokenPrice?: string
                dimensions?: number | number[]
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
        }
      }>
      deleteModels: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          providerId:
            | 'openai'
            | 'anthropic'
            | 'google'
            | 'openrouter'
            | 'vertex'
            | 'azure'
            | 'bedrock'
            | 'deepseek'
            | 'mistral'
            | 'xai'
            | 'togetherai'
            | 'cohere'
            | 'fireworks'
            | 'deepinfra'
            | 'cerebras'
            | 'groq'
            | 'replicate'
            | 'perplexity'
            | 'luma'
            | 'vercel'
            | 'fal'
            | 'elevenlabs'
            | 'lmnt'
          ids: (
            | `openai:${string}`
            | `anthropic:${string}`
            | `google:${string}`
            | `openrouter:${string}`
            | `vertex:${string}`
            | `azure:${string}`
            | `bedrock:${string}`
            | `deepseek:${string}`
            | `mistral:${string}`
            | `xai:${string}`
            | `togetherai:${string}`
            | `cohere:${string}`
            | `fireworks:${string}`
            | `deepinfra:${string}`
            | `cerebras:${string}`
            | `groq:${string}`
            | `replicate:${string}`
            | `perplexity:${string}`
            | `luma:${string}`
            | `vercel:${string}`
            | `fal:${string}`
            | `elevenlabs:${string}`
            | `lmnt:${string}`
          )[]
          type: 'image' | 'language' | 'speech' | 'transcription' | 'textEmbedding'
          organizationId?: string | undefined
          isSystem?: boolean | undefined
        }
        output: {
          models: (
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                contextWindow?: number
                maxOutputTokens?: number
                inputTokenPrice?: string
                cachedInputTokenPrice?: string
                cacheInputTokenPrice?: string | [string, string][]
                outputTokenPrice?: string
                modality?: {
                  input?: Modality[]
                  output?: Modality[]
                }
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                imageInputTokenPrice?: string
                imageCachedInputTokenPrice?: string
                imageOutputTokenPrice?: string
                textInputTokenPrice?: string
                textCachedInputTokenPrice?: string
                pricePerImage?: string | [string, string][] | [string, [string, string][]][]
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                maxInputTokens?: number
                textTokenPrice?: string
                audioTokenPrice?: string
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                audioTokenPrice?: string
                textInputTokenPrice?: string
                textOutputTokenPrice?: string
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
            | {
                id:
                  | `openai:${string}`
                  | `anthropic:${string}`
                  | `google:${string}`
                  | `openrouter:${string}`
                  | `vertex:${string}`
                  | `azure:${string}`
                  | `bedrock:${string}`
                  | `deepseek:${string}`
                  | `mistral:${string}`
                  | `xai:${string}`
                  | `togetherai:${string}`
                  | `cohere:${string}`
                  | `fireworks:${string}`
                  | `deepinfra:${string}`
                  | `cerebras:${string}`
                  | `groq:${string}`
                  | `replicate:${string}`
                  | `perplexity:${string}`
                  | `luma:${string}`
                  | `vercel:${string}`
                  | `fal:${string}`
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                isSystem: boolean
                tokenPrice?: string
                dimensions?: number | number[]
                name: string
                description: string
                deprecated?: boolean
                retired?: boolean
                chargeable?: boolean
              }
          )[]
        }
      }>
    }
    tokenizer: {
      encode: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          text: string
          modelId: string
        }
        output: {
          tokens: number[]
          count: number
          chunks: string[]
        }
      }>
      decode: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          tokens: number[]
          modelId: string
        }
        output: string
      }>
      count: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          messages: Record<string, string>[]
          modelId: string
        }
        output: number
      }>
    }
    chat: {
      list: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          orderBy?: 'asc' | 'desc' | undefined
          orderOn?: 'createdAt' | 'updatedAt' | undefined
          includeLastMessage?: boolean | undefined
        }
        output: {
          chats: {
            lastMessage:
              | {
                  id: string
                  createdAt: Date
                  updatedAt: Date
                  role: 'user' | 'system' | 'assistant'
                  agentId: string | null
                  parentId: string | null
                  chatId: string
                  content: import('@cared/shared').MessageContent
                }
              | undefined
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            metadata: ChatMetadata
            appId: string
            debug: boolean
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      listByIds: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          ids: string[]
          includeLastMessage?: boolean | undefined
        }
        output: {
          chats: {
            lastMessage:
              | {
                  id: string
                  createdAt: Date
                  updatedAt: Date
                  role: 'user' | 'system' | 'assistant'
                  agentId: string | null
                  parentId: string | null
                  chatId: string
                  content: import('@cared/shared').MessageContent
                }
              | undefined
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            metadata: ChatMetadata
            appId: string
            debug: boolean
          }[]
        }
      }>
      byId: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
          includeLastMessage?: boolean | undefined
        }
        output: {
          chat: {
            lastMessage:
              | {
                  id: string
                  createdAt: Date
                  updatedAt: Date
                  role: 'user' | 'system' | 'assistant'
                  agentId: string | null
                  parentId: string | null
                  chatId: string
                  content: import('@cared/shared').MessageContent
                }
              | undefined
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            metadata: ChatMetadata
            appId: string
            debug: boolean
          }
        }
      }>
      create: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          metadata: {
            title?: string | undefined
            visibility?: 'public' | 'private' | undefined
            languageModel?: string | undefined
            embeddingModel?: string | undefined
            rerankModel?: string | undefined
            imageModel?: string | undefined
            custom?: unknown
          }
          id?: string | undefined
          debug?: boolean | undefined
          initialMessages?:
            | {
                role: 'user' | 'system' | 'assistant'
                content: {
                  parts: (
                    | ({
                        type: `tool-${string}`
                        toolCallId: string
                      } & (
                        | {
                            state: 'input-streaming'
                            input: any
                            providerExecuted?: boolean | undefined
                          }
                        | {
                            state: 'input-available'
                            input: any
                            providerExecuted?: boolean | undefined
                          }
                        | {
                            state: 'output-available'
                            input: any
                            output: any
                            providerExecuted?: boolean | undefined
                          }
                        | {
                            state: 'output-error'
                            input: any
                            errorText: string
                            providerExecuted?: boolean | undefined
                          }
                      ))
                    | ({
                        type: 'dynamic-tool'
                        toolName: string
                        toolCallId: string
                      } & (
                        | {
                            state: 'input-streaming'
                            input: unknown
                          }
                        | {
                            state: 'input-available'
                            input: unknown
                            callProviderMetadata?:
                              | Record<string, Record<string, unknown>>
                              | undefined
                          }
                        | {
                            state: 'output-available'
                            input: unknown
                            output: unknown
                            callProviderMetadata?:
                              | Record<string, Record<string, unknown>>
                              | undefined
                          }
                        | {
                            state: 'output-error'
                            input: unknown
                            errorText: string
                            callProviderMetadata?:
                              | Record<string, Record<string, unknown>>
                              | undefined
                          }
                      ))
                    | {
                        type: 'text'
                        text: string
                        state?: 'done' | 'streaming' | undefined
                      }
                    | {
                        type: 'reasoning'
                        text: string
                        state?: 'done' | 'streaming' | undefined
                        providerMetadata?: Record<string, Record<string, unknown>> | undefined
                      }
                    | {
                        type: 'source-url'
                        sourceId: string
                        url: string
                        title?: string | undefined
                        providerMetadata?: Record<string, Record<string, unknown>> | undefined
                      }
                    | {
                        type: 'source-document'
                        sourceId: string
                        mediaType: string
                        title: string
                        filename?: string | undefined
                        providerMetadata?: Record<string, Record<string, unknown>> | undefined
                      }
                    | {
                        type: 'file'
                        mediaType: string
                        url: string
                        filename?: string | undefined
                      }
                    | {
                        type: 'step-start'
                      }
                    | {
                        type: `data-${string}`
                        data: any
                        id?: string | undefined
                      }
                  )[]
                  metadata?: any
                }
                id?: string | undefined
                agentId?: string | undefined
              }[][]
            | undefined
          includeLastMessage?: boolean | undefined
        }
        output: {
          chat: {
            lastMessage:
              | {
                  id: string
                  createdAt: Date
                  updatedAt: Date
                  role: 'user' | 'system' | 'assistant'
                  agentId: string | null
                  parentId: string | null
                  chatId: string
                  content: import('@cared/shared').MessageContent
                }
              | undefined
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            metadata: ChatMetadata
            appId: string
            debug: boolean
          }
        }
      }>
      update: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          metadata?:
            | {
                [x: string]: unknown
                title?: string | undefined
                visibility?: 'public' | 'private' | undefined
                languageModel?: string | undefined
                embeddingModel?: string | undefined
                rerankModel?: string | undefined
                imageModel?: string | undefined
                custom?: unknown
              }
            | undefined
        }
        output: {
          chat: {
            createdAt: Date
            updatedAt: Date
            id: string
            appId: string
            userId: string
            debug: boolean
            metadata: ChatMetadata
          }
        }
      }>
      delete: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
        }
        output: {
          chat: {
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            metadata: ChatMetadata
            appId: string
            debug: boolean
          }
        }
      }>
      batchDelete: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          ids: string[]
        }
        output: {
          chats: {
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            metadata: ChatMetadata
            appId: string
            debug: boolean
          }[]
        }
      }>
      clone: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          messages: string[]
          includeLastMessage?: boolean | undefined
        }
        output: {
          chat: {
            lastMessage:
              | {
                  id: string
                  createdAt: Date
                  updatedAt: Date
                  role: 'user' | 'system' | 'assistant'
                  agentId: string | null
                  parentId: string | null
                  chatId: string
                  content: import('@cared/shared').MessageContent
                }
              | undefined
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            metadata: ChatMetadata
            appId: string
            debug: boolean
          }
        }
      }>
    }
    message: {
      list: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          chatId: string
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          messages: {
            id: string
            createdAt: Date
            updatedAt: Date
            role: 'user' | 'system' | 'assistant'
            agentId: string | null
            parentId: string | null
            chatId: string
            content: import('@cared/shared').MessageContent
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      listByIds: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          chatId: string
          ids: string[]
        }
        output: {
          messages: {
            id: string
            createdAt: Date
            updatedAt: Date
            role: 'user' | 'system' | 'assistant'
            agentId: string | null
            parentId: string | null
            chatId: string
            content: import('@cared/shared').MessageContent
          }[]
        }
      }>
      find: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
        }
        output: {
          message:
            | {
                id: string
                createdAt: Date
                updatedAt: Date
                role: 'user' | 'system' | 'assistant'
                agentId: string | null
                parentId: string | null
                chatId: string
                content: import('@cared/shared').MessageContent
              }
            | undefined
        }
      }>
      get: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
        }
        output: {
          message: {
            id: string
            createdAt: Date
            updatedAt: Date
            role: 'user' | 'system' | 'assistant'
            agentId: string | null
            parentId: string | null
            chatId: string
            content: import('@cared/shared').MessageContent
          }
        }
      }>
      create: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          chatId: string
          role: 'user' | 'system' | 'assistant'
          content: {
            parts: (
              | ({
                  type: `tool-${string}`
                  toolCallId: string
                } & (
                  | {
                      state: 'input-streaming'
                      input: any
                      providerExecuted?: boolean | undefined
                    }
                  | {
                      state: 'input-available'
                      input: any
                      providerExecuted?: boolean | undefined
                    }
                  | {
                      state: 'output-available'
                      input: any
                      output: any
                      providerExecuted?: boolean | undefined
                    }
                  | {
                      state: 'output-error'
                      input: any
                      errorText: string
                      providerExecuted?: boolean | undefined
                    }
                ))
              | ({
                  type: 'dynamic-tool'
                  toolName: string
                  toolCallId: string
                } & (
                  | {
                      state: 'input-streaming'
                      input: unknown
                    }
                  | {
                      state: 'input-available'
                      input: unknown
                      callProviderMetadata?: Record<string, Record<string, unknown>> | undefined
                    }
                  | {
                      state: 'output-available'
                      input: unknown
                      output: unknown
                      callProviderMetadata?: Record<string, Record<string, unknown>> | undefined
                    }
                  | {
                      state: 'output-error'
                      input: unknown
                      errorText: string
                      callProviderMetadata?: Record<string, Record<string, unknown>> | undefined
                    }
                ))
              | {
                  type: 'text'
                  text: string
                  state?: 'done' | 'streaming' | undefined
                }
              | {
                  type: 'reasoning'
                  text: string
                  state?: 'done' | 'streaming' | undefined
                  providerMetadata?: Record<string, Record<string, unknown>> | undefined
                }
              | {
                  type: 'source-url'
                  sourceId: string
                  url: string
                  title?: string | undefined
                  providerMetadata?: Record<string, Record<string, unknown>> | undefined
                }
              | {
                  type: 'source-document'
                  sourceId: string
                  mediaType: string
                  title: string
                  filename?: string | undefined
                  providerMetadata?: Record<string, Record<string, unknown>> | undefined
                }
              | {
                  type: 'file'
                  mediaType: string
                  url: string
                  filename?: string | undefined
                }
              | {
                  type: 'step-start'
                }
              | {
                  type: `data-${string}`
                  data: any
                  id?: string | undefined
                }
            )[]
            metadata?: any
          }
          id?: string | undefined
          parentId?: string | undefined
          agentId?: string | undefined
          isRoot?: boolean | undefined
        }
        output: {
          message: {
            id: string
            createdAt: Date
            updatedAt: Date
            role: 'user' | 'system' | 'assistant'
            agentId: string | null
            parentId: string | null
            chatId: string
            content: import('@cared/shared').MessageContent
          }
        }
      }>
      update: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          content?:
            | {
                parts: (
                  | ({
                      type: `tool-${string}`
                      toolCallId: string
                    } & (
                      | {
                          state: 'input-streaming'
                          input: any
                          providerExecuted?: boolean | undefined
                        }
                      | {
                          state: 'input-available'
                          input: any
                          providerExecuted?: boolean | undefined
                        }
                      | {
                          state: 'output-available'
                          input: any
                          output: any
                          providerExecuted?: boolean | undefined
                        }
                      | {
                          state: 'output-error'
                          input: any
                          errorText: string
                          providerExecuted?: boolean | undefined
                        }
                    ))
                  | ({
                      type: 'dynamic-tool'
                      toolName: string
                      toolCallId: string
                    } & (
                      | {
                          state: 'input-streaming'
                          input: unknown
                        }
                      | {
                          state: 'input-available'
                          input: unknown
                          callProviderMetadata?: Record<string, Record<string, unknown>> | undefined
                        }
                      | {
                          state: 'output-available'
                          input: unknown
                          output: unknown
                          callProviderMetadata?: Record<string, Record<string, unknown>> | undefined
                        }
                      | {
                          state: 'output-error'
                          input: unknown
                          errorText: string
                          callProviderMetadata?: Record<string, Record<string, unknown>> | undefined
                        }
                    ))
                  | {
                      type: 'text'
                      text: string
                      state?: 'done' | 'streaming' | undefined
                    }
                  | {
                      type: 'reasoning'
                      text: string
                      state?: 'done' | 'streaming' | undefined
                      providerMetadata?: Record<string, Record<string, unknown>> | undefined
                    }
                  | {
                      type: 'source-url'
                      sourceId: string
                      url: string
                      title?: string | undefined
                      providerMetadata?: Record<string, Record<string, unknown>> | undefined
                    }
                  | {
                      type: 'source-document'
                      sourceId: string
                      mediaType: string
                      title: string
                      filename?: string | undefined
                      providerMetadata?: Record<string, Record<string, unknown>> | undefined
                    }
                  | {
                      type: 'file'
                      mediaType: string
                      url: string
                      filename?: string | undefined
                    }
                  | {
                      type: 'step-start'
                    }
                  | {
                      type: `data-${string}`
                      data: any
                      id?: string | undefined
                    }
                )[]
                metadata?: any
              }
            | undefined
        }
        output: {
          message: {
            createdAt: Date
            updatedAt: Date
            id: string
            parentId: string | null
            chatId: string
            role: 'user' | 'system' | 'assistant'
            agentId: string | null
            content: import('@cared/shared').MessageContent
          }
        }
      }>
      delete: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          deleteTrailing?: boolean | undefined
          excludeSelf?: boolean | undefined
        }
        output: {
          messages: (
            | {
                id: string
                createdAt: Date
                updatedAt: Date
                role: 'user' | 'system' | 'assistant'
                agentId: string | null
                parentId: string | null
                chatId: string
                content: import('@cared/shared').MessageContent
              }
            | undefined
          )[]
        }
      }>
      vote: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          chatId: string
          messageId: string
          isUpvoted: boolean
        }
        output: {
          vote: {
            createdAt: Date
            updatedAt: Date
            chatId: string
            messageId: string
            isUpvoted: boolean
          }
        }
      }>
    }
    artifact: {
      listByChat: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          chatId: string
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          artifacts: {
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            version: number
            title: string
            chatId: string
            content: unknown
            kind: 'image' | 'code' | 'text' | 'sheet'
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
      listVersionsById: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          id: string
          after?: number | undefined
          before?: number | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          versions: {
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            version: number
            title: string
            chatId: string
            content: unknown
            kind: 'image' | 'code' | 'text' | 'sheet'
          }[]
          hasMore: boolean
          first: number | undefined
          last: number | undefined
        }
      }>
      deleteVersionsByIdAfterVersion: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          id: string
          after: number
        }
        output: void
      }>
      listSuggestions: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          artifactId: string
          artifactVersion?: number | undefined
          after?: string | undefined
          before?: string | undefined
          limit?: number | undefined
          order?: 'asc' | 'desc' | undefined
        }
        output: {
          suggestions: {
            description: string | null
            id: string
            createdAt: Date
            updatedAt: Date
            artifactId: string
            artifactVersion: number
            originalText: string
            suggestedText: string
            isResolved: boolean
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      }>
    }
    credits: {
      getCredits: import('@trpc/server').TRPCQueryProcedure<{
        input: void
        output: {
          credits: {
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            metadata: CreditsMetadata
            credits: number
          }
        }
      }>
      listOrders: import('@trpc/server').TRPCQueryProcedure<{
        input: {
          orderKinds?: ('stripe-payment' | 'stripe-subscription' | 'stripe-invoice')[] | undefined
          statuses?: string[] | undefined
          limit?: number | undefined
          cursor?: string | undefined
        }
        output: {
          orders: {
            status:
              | import('stripe').Stripe.Checkout.Session.Status
              | import('stripe').Stripe.Invoice.Status
            object: import('stripe').Stripe.Checkout.Session | import('stripe').Stripe.Invoice
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            kind: 'stripe-payment' | 'stripe-subscription' | 'stripe-invoice'
            objectId: string
          }[]
          hasMore: boolean
          cursor: string | undefined
        }
      }>
      createOnetimeCheckout: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          credits: number
        }
        output: {
          sessionClientSecret: string
        }
      }>
      listSubscriptions: import('@trpc/server').TRPCQueryProcedure<{
        input: void
        output: {
          subscriptions: import('stripe').Stripe.Subscription[]
        }
      }>
      createAutoRechargeSubscriptionCheckout: import('@trpc/server').TRPCMutationProcedure<{
        input: {
          autoRechargeThreshold: number
          autoRechargeAmount: number
        }
        output: {
          sessionClientSecret: string
        }
      }>
      cancelAutoRechargeSubscription: import('@trpc/server').TRPCMutationProcedure<{
        input: void
        output: void
      }>
      createAutoRechargeInvoice: import('@trpc/server').TRPCMutationProcedure<{
        input: void
        output: void
      }>
    }
  }>
>
export type CaredTrpcRouter = typeof appRouter
