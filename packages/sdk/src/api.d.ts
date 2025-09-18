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

export type GenerationDetails =
  | LanguageGenerationDetails
  | ImageGenerationDetails
  | SpeechGenerationDetails
  | TranscriptionGenerationDetails
  | TextEmbeddingGenerationDetails

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

  onetimeRechargeSessionId?: string

  autoRechargeEnabled?: boolean
  autoRechargeThreshold?: number
  autoRechargeAmount?: number

  autoRechargePaymentIntentId?: string

  subscriptionSessionId?: string
  subscriptionId?: string

  autoRechargeSessionId?: string
  autoRechargeSubscriptionId?: string
  autoRechargeInvoiceId?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const appRouter: {
  admin: {
    mock: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('@orpc/contract').Schema<unknown, unknown>,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    list: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          apps: {
            app: {
              type: 'single-agent' | 'multiple-agents'
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
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
        },
        {
          apps: {
            app: {
              type: 'single-agent' | 'multiple-agents'
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listByCategory: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          categoryId: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          apps: {
            app: {
              type: 'single-agent' | 'multiple-agents'
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
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
        },
        {
          apps: {
            app: {
              type: 'single-agent' | 'multiple-agents'
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listByTags: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          tags: import('better-auth').ZodArray<import('better-auth').ZodString>
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          apps: {
            app: {
              type: 'single-agent' | 'multiple-agents'
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
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
        },
        {
          apps: {
            app: {
              type: 'single-agent' | 'multiple-agents'
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listVersions: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
          before: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          versions: {
            type: 'single-agent' | 'multiple-agents'
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            appId: string
          }[]
          hasMore: boolean
          first: number | undefined
          last: number | undefined
        },
        {
          versions: {
            type: 'single-agent' | 'multiple-agents'
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            appId: string
          }[]
          hasMore: boolean
          first: number | undefined
          last: number | undefined
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    byId: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          app: {
            type: 'single-agent' | 'multiple-agents'
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
            workspaceId: string
          }
        },
        {
          app: {
            type: 'single-agent' | 'multiple-agents'
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
            workspaceId: string
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    createCategory: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          name: import('better-auth').ZodString
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
          category: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
          }[]
        },
        {
          category: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
          }[]
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    updateCategory: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          name: import('better-auth').ZodString
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
          category:
            | {
                createdAt: Date
                updatedAt: Date
                id: string
                name: string
              }
            | undefined
        },
        {
          category:
            | {
                createdAt: Date
                updatedAt: Date
                id: string
                name: string
              }
            | undefined
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    deleteCategory: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    deleteTags: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          tags: import('better-auth').ZodArray<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    listWorkspaces: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    getWorkspace: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodString,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listOrganizations: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          organizations: {
            id: string
            name: string
            createdAt: Date
            slug: string | null
            logo: string | null
            metadata: string | null
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        },
        {
          organizations: {
            id: string
            name: string
            createdAt: Date
            slug: string | null
            logo: string | null
            metadata: string | null
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    getOrganization: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodString,
      import('@orpc/contract').Schema<
        {
          organization: {
            id: string
            name: string
            createdAt: Date
            slug: string | null
            logo: string | null
            metadata: string | null
          }
        },
        {
          organization: {
            id: string
            name: string
            createdAt: Date
            slug: string | null
            logo: string | null
            metadata: string | null
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listMembers: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listUsers: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodObject<
        {
          search: import('better-auth').ZodOptional<import('better-auth').ZodString>
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    getUser: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodString,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    deleteUser: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AdminContext
      >,
      import('better-auth').ZodString,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
  }
  organization: {
    create: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          name: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          organization: {
            id: string
            name: string
            slug: string | null
            createdAt: Date
          }
        },
        {
          organization: {
            id: string
            name: string
            slug: string | null
            createdAt: Date
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    list: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('@orpc/contract').Schema<unknown, unknown>,
      import('@orpc/contract').Schema<
        {
          organizations: {
            role: OrganizationRole
            id: string
            name: string
            slug: string | null
            createdAt: Date
          }[]
        },
        {
          organizations: {
            role: OrganizationRole
            id: string
            name: string
            slug: string | null
            createdAt: Date
          }[]
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    setActive: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodNullable<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    get: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    update: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          name: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          organization: {
            id: string
            name: string
            slug: string | null
            createdAt: Date
          }
        },
        {
          organization: {
            id: string
            name: string
            slug: string | null
            createdAt: Date
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    delete: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    createInvitation: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodString
          email: import('better-auth').ZodEmail
          teamId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          resend: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    acceptInvitation: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          invitationId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    cancelInvitation: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          invitationId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    rejectInvitation: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          invitationId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    getInvitation: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          invitationId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listInvitations: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listUserInvitations: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('@orpc/contract').Schema<unknown, unknown>,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listMembers: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    addMember: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodString
          userId: import('better-auth').ZodString
          role: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              member: 'member'
              admin: 'admin'
            }>
          >
          teamId: import('better-auth').ZodOptional<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          member: {
            id: string
            organizationId: string
            userId: string
            role: string
            createdAt: Date
          }
        },
        {
          member: {
            id: string
            organizationId: string
            userId: string
            role: string
            createdAt: Date
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    removeMember: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodString
          memberId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          member: {
            id: string
            organizationId: string
            userId: string
            role: string
            createdAt: Date
          }
        },
        {
          member: {
            id: string
            organizationId: string
            userId: string
            role: string
            createdAt: Date
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    updateMemberRole: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodString
          memberId: import('better-auth').ZodString
          role: import('better-auth').ZodEnum<{
            member: 'member'
            admin: 'admin'
          }>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    transferOwnership: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodString
          memberId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    leaveOrganization: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  workspace: {
    list: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodOptional<
        import('better-auth').ZodObject<
          {
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    get: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    create: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          name: import('better-auth').ZodString
          organizationId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    update: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          name: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    delete: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    transferOwnership: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          workspaceId: import('better-auth').ZodString
          organizationId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  user: {
    session: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').Context
      >,
      import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>,
      import('better-auth').ZodDefault<
        import('better-auth').ZodObject<
          {
            auth: import('better-auth').ZodBoolean
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<
        {
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
        } | null,
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    accounts: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('@orpc/contract').Schema<unknown, unknown>,
      import('@orpc/contract').Schema<
        {
          accounts: {
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            accountId: string
            providerId: string
            accessToken: string | null
            refreshToken: string | null
            idToken: string | null
            accessTokenExpiresAt: Date | null
            refreshTokenExpiresAt: Date | null
            scope: string | null
            password: string | null
            profile: string | null
          }[]
        },
        {
          accounts: {
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            accountId: string
            providerId: string
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    sessions: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('@orpc/contract').Schema<unknown, unknown>,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    oauthApps: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('@orpc/contract').Schema<unknown, unknown>,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    revokeOauthApp: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          clientId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
  }
  providerKey: {
    list: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserOrAppUserContext
      >,
      import('better-auth').ZodDefault<
        import('better-auth').ZodObject<
          {
            isSystem: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
            providerId: import('better-auth').ZodOptional<
              import('better-auth').ZodEnum<{
                openai: 'openai'
                google: 'google'
                vertex: 'vertex'
                fal: 'fal'
                anthropic: 'anthropic'
                openrouter: 'openrouter'
                azure: 'azure'
                bedrock: 'bedrock'
                deepseek: 'deepseek'
                mistral: 'mistral'
                xai: 'xai'
                togetherai: 'togetherai'
                cohere: 'cohere'
                fireworks: 'fireworks'
                deepinfra: 'deepinfra'
                cerebras: 'cerebras'
                groq: 'groq'
                replicate: 'replicate'
                perplexity: 'perplexity'
                luma: 'luma'
                vercel: 'vercel'
                elevenlabs: 'elevenlabs'
                lmnt: 'lmnt'
              }>
            >
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<
        {
          providerKeys: {
            key: {
              baseUrl?: string | undefined
            } & (
              | {
                  providerId:
                    | 'openai'
                    | 'google'
                    | 'fal'
                    | 'anthropic'
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
            createdAt: Date
            updatedAt: Date
            userId: string | null
            providerId: ProviderId
            organizationId: string | null
            disabled: boolean
            isSystem: boolean | null
          }[]
        },
        {
          providerKeys: {
            key: {
              baseUrl?: string | undefined
            } & (
              | {
                  providerId:
                    | 'openai'
                    | 'google'
                    | 'fal'
                    | 'anthropic'
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
            createdAt: Date
            updatedAt: Date
            userId: string | null
            providerId: ProviderId
            organizationId: string | null
            disabled: boolean
            isSystem: boolean | null
          }[]
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    create: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserOrAppUserContext
      >,
      import('better-auth').ZodObject<
        {
          isSystem: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          key: import('better-auth').ZodIntersection<
            import('better-auth').ZodObject<
              {
                baseUrl: import('better-auth').ZodOptional<import('better-auth').ZodURL>
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodDiscriminatedUnion<
              [
                import('better-auth').ZodObject<
                  {
                    providerId: import('better-auth').ZodEnum<{
                      openai: 'openai'
                      google: 'google'
                      fal: 'fal'
                      anthropic: 'anthropic'
                      openrouter: 'openrouter'
                      deepseek: 'deepseek'
                      mistral: 'mistral'
                      xai: 'xai'
                      togetherai: 'togetherai'
                      cohere: 'cohere'
                      fireworks: 'fireworks'
                      deepinfra: 'deepinfra'
                      cerebras: 'cerebras'
                      groq: 'groq'
                      perplexity: 'perplexity'
                      luma: 'luma'
                      vercel: 'vercel'
                      elevenlabs: 'elevenlabs'
                      lmnt: 'lmnt'
                    }>
                    apiKey: import('better-auth').ZodString
                  },
                  import('better-auth').$strip
                >,
                import('better-auth').ZodObject<
                  {
                    providerId: import('better-auth').ZodLiteral<'azure'>
                    apiKey: import('better-auth').ZodString
                    baseUrl: import('better-auth').ZodURL
                    apiVersion: import('better-auth').ZodOptional<import('better-auth').ZodString>
                  },
                  import('better-auth').$strip
                >,
                import('better-auth').ZodObject<
                  {
                    providerId: import('better-auth').ZodLiteral<'bedrock'>
                    region: import('better-auth').ZodString
                    accessKeyId: import('better-auth').ZodString
                    secretAccessKey: import('better-auth').ZodString
                  },
                  import('better-auth').$strip
                >,
                import('better-auth').ZodObject<
                  {
                    providerId: import('better-auth').ZodLiteral<'vertex'>
                    location: import('better-auth').ZodOptional<import('better-auth').ZodString>
                    serviceAccountJson: import('better-auth').ZodString
                  },
                  import('better-auth').$strip
                >,
                import('better-auth').ZodObject<
                  {
                    providerId: import('better-auth').ZodLiteral<'replicate'>
                    apiToken: import('better-auth').ZodString
                  },
                  import('better-auth').$strip
                >,
              ]
            >
          >
          disabled: import('better-auth').ZodDefault<import('better-auth').ZodBoolean>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          providerKey: {
            key: {
              baseUrl?: string | undefined
            } & (
              | {
                  providerId:
                    | 'openai'
                    | 'google'
                    | 'fal'
                    | 'anthropic'
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
            createdAt: Date
            updatedAt: Date
            userId: string | null
            providerId: ProviderId
            organizationId: string | null
            disabled: boolean
            isSystem: boolean | null
          }
        },
        {
          providerKey: {
            key: {
              baseUrl?: string | undefined
            } & (
              | {
                  providerId:
                    | 'openai'
                    | 'google'
                    | 'fal'
                    | 'anthropic'
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
            createdAt: Date
            updatedAt: Date
            userId: string | null
            providerId: ProviderId
            organizationId: string | null
            disabled: boolean
            isSystem: boolean | null
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    update: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserOrAppUserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          key: import('better-auth').ZodOptional<
            import('better-auth').ZodIntersection<
              import('better-auth').ZodObject<
                {
                  baseUrl: import('better-auth').ZodOptional<import('better-auth').ZodURL>
                },
                import('better-auth').$strip
              >,
              import('better-auth').ZodDiscriminatedUnion<
                [
                  import('better-auth').ZodObject<
                    {
                      providerId: import('better-auth').ZodEnum<{
                        openai: 'openai'
                        google: 'google'
                        fal: 'fal'
                        anthropic: 'anthropic'
                        openrouter: 'openrouter'
                        deepseek: 'deepseek'
                        mistral: 'mistral'
                        xai: 'xai'
                        togetherai: 'togetherai'
                        cohere: 'cohere'
                        fireworks: 'fireworks'
                        deepinfra: 'deepinfra'
                        cerebras: 'cerebras'
                        groq: 'groq'
                        perplexity: 'perplexity'
                        luma: 'luma'
                        vercel: 'vercel'
                        elevenlabs: 'elevenlabs'
                        lmnt: 'lmnt'
                      }>
                      apiKey: import('better-auth').ZodString
                    },
                    import('better-auth').$strip
                  >,
                  import('better-auth').ZodObject<
                    {
                      providerId: import('better-auth').ZodLiteral<'azure'>
                      apiKey: import('better-auth').ZodString
                      baseUrl: import('better-auth').ZodURL
                      apiVersion: import('better-auth').ZodOptional<import('better-auth').ZodString>
                    },
                    import('better-auth').$strip
                  >,
                  import('better-auth').ZodObject<
                    {
                      providerId: import('better-auth').ZodLiteral<'bedrock'>
                      region: import('better-auth').ZodString
                      accessKeyId: import('better-auth').ZodString
                      secretAccessKey: import('better-auth').ZodString
                    },
                    import('better-auth').$strip
                  >,
                  import('better-auth').ZodObject<
                    {
                      providerId: import('better-auth').ZodLiteral<'vertex'>
                      location: import('better-auth').ZodOptional<import('better-auth').ZodString>
                      serviceAccountJson: import('better-auth').ZodString
                    },
                    import('better-auth').$strip
                  >,
                  import('better-auth').ZodObject<
                    {
                      providerId: import('better-auth').ZodLiteral<'replicate'>
                      apiToken: import('better-auth').ZodString
                    },
                    import('better-auth').$strip
                  >,
                ]
              >
            >
          >
          disabled: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          providerKey: {
            key: {
              baseUrl?: string | undefined
            } & (
              | {
                  providerId:
                    | 'openai'
                    | 'google'
                    | 'fal'
                    | 'anthropic'
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
        },
        {
          providerKey: {
            key: {
              baseUrl?: string | undefined
            } & (
              | {
                  providerId:
                    | 'openai'
                    | 'google'
                    | 'fal'
                    | 'anthropic'
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    delete: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserOrAppUserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          providerKey: {
            key: {
              baseUrl?: string | undefined
            } & (
              | {
                  providerId:
                    | 'openai'
                    | 'google'
                    | 'fal'
                    | 'anthropic'
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
            createdAt: Date
            updatedAt: Date
            userId: string | null
            providerId: ProviderId
            organizationId: string | null
            disabled: boolean
            isSystem: boolean | null
          }
        },
        {
          providerKey: {
            key: {
              baseUrl?: string | undefined
            } & (
              | {
                  providerId:
                    | 'openai'
                    | 'google'
                    | 'fal'
                    | 'anthropic'
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
            createdAt: Date
            updatedAt: Date
            userId: string | null
            providerId: ProviderId
            organizationId: string | null
            disabled: boolean
            isSystem: boolean | null
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  app: {
    list: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodDefault<
        import('better-auth').ZodObject<
          {
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
            workspaceId: import('better-auth').ZodOptional<import('better-auth').ZodString>
            order: import('better-auth').ZodDefault<
              import('better-auth').ZodEnum<{
                asc: 'asc'
                desc: 'desc'
              }>
            >
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<
        {
          apps: {
            app: {
              type: 'single-agent' | 'multiple-agents'
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
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
        },
        {
          apps: {
            app: {
              type: 'single-agent' | 'multiple-agents'
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listByCategory: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          workspaceId: import('better-auth').ZodString
          categoryId: import('better-auth').ZodString
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          apps: {
            app: {
              type: 'single-agent' | 'multiple-agents'
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
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
        },
        {
          apps: {
            app: {
              type: 'single-agent' | 'multiple-agents'
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listByTags: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          workspaceId: import('better-auth').ZodString
          tags: import('better-auth').ZodArray<import('better-auth').ZodString>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          apps: {
            app: {
              type: 'single-agent' | 'multiple-agents'
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
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
        },
        {
          apps: {
            app: {
              type: 'single-agent' | 'multiple-agents'
              id: string
              name: string
              createdAt: Date
              updatedAt: Date
              metadata: AppMetadata
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listVersions: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
          before: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          versions: {
            type: 'single-agent' | 'multiple-agents'
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            appId: string
          }[]
          hasMore: boolean
          first: number | undefined
          last: number | undefined
        },
        {
          versions: {
            type: 'single-agent' | 'multiple-agents'
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            appId: string
          }[]
          hasMore: boolean
          first: number | undefined
          last: number | undefined
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    byId: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          app: {
            type: 'single-agent' | 'multiple-agents'
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
            workspaceId: string
          }
        },
        {
          app: {
            type: 'single-agent' | 'multiple-agents'
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
            workspaceId: string
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    getVersion: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          version: import('better-auth').ZodNumber
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          version: {
            type: 'single-agent' | 'multiple-agents'
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            appId: string
          }
        },
        {
          version: {
            type: 'single-agent' | 'multiple-agents'
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            appId: string
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    create: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          type: import('better-auth').ZodOptional<
            import('better-auth').ZodEnum<{
              'single-agent': 'single-agent'
              'multiple-agents': 'multiple-agents'
            }>
          >
          name: import('better-auth').ZodString
          metadata: import('better-auth').ZodObject<
            {
              description: import('better-auth').ZodOptional<import('better-auth').ZodString>
              imageUrl: import('better-auth').ZodOptional<import('better-auth').ZodString>
              clientId: import('better-auth').ZodOptional<import('better-auth').ZodString>
              languageModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
              embeddingModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
              rerankModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
              imageModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
              languageModelSettings: import('better-auth').ZodOptional<
                import('better-auth').ZodObject<
                  {
                    systemPrompt: import('better-auth').ZodOptional<import('better-auth').ZodString>
                  },
                  import('better-auth').$strip
                >
              >
              datasetBindings: import('better-auth').ZodOptional<
                import('better-auth').ZodArray<import('better-auth').ZodString>
              >
            },
            import('better-auth').$catchall<import('better-auth').ZodUnknown>
          >
          archived: import('better-auth').ZodOptional<
            import('better-auth').ZodNullable<import('better-auth').ZodBoolean>
          >
          archivedAt: import('better-auth').ZodOptional<
            import('better-auth').ZodNullable<import('better-auth').ZodDate>
          >
          deleted: import('better-auth').ZodOptional<
            import('better-auth').ZodNullable<import('better-auth').ZodBoolean>
          >
          deletedAt: import('better-auth').ZodOptional<
            import('better-auth').ZodNullable<import('better-auth').ZodDate>
          >
          workspaceId: import('better-auth').ZodString
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
          app: {
            type: 'single-agent' | 'multiple-agents'
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
            workspaceId: string
          }
          draft: {
            type: 'single-agent' | 'multiple-agents'
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            appId: string
          }
        },
        {
          app: {
            type: 'single-agent' | 'multiple-agents'
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            archived: boolean | null
            archivedAt: Date | null
            deleted: boolean | null
            deletedAt: Date | null
            workspaceId: string
          }
          draft: {
            type: 'single-agent' | 'multiple-agents'
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
            appId: string
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    update: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          name: import('better-auth').ZodOptional<import('better-auth').ZodString>
          metadata: import('better-auth').ZodOptional<
            import('better-auth').ZodObject<
              {
                description: import('better-auth').ZodOptional<import('better-auth').ZodString>
                imageUrl: import('better-auth').ZodOptional<import('better-auth').ZodString>
                clientId: import('better-auth').ZodOptional<import('better-auth').ZodString>
                languageModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                embeddingModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                rerankModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                imageModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                languageModelSettings: import('better-auth').ZodOptional<
                  import('better-auth').ZodObject<
                    {
                      systemPrompt: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                    },
                    import('better-auth').$strip
                  >
                >
                datasetBindings: import('better-auth').ZodOptional<
                  import('better-auth').ZodArray<import('better-auth').ZodString>
                >
              },
              import('better-auth').$catchall<import('better-auth').ZodUnknown>
            >
          >
          archived: import('better-auth').ZodOptional<
            import('better-auth').ZodNullable<import('better-auth').ZodBoolean>
          >
          archivedAt: import('better-auth').ZodOptional<
            import('better-auth').ZodNullable<import('better-auth').ZodDate>
          >
          deleted: import('better-auth').ZodOptional<
            import('better-auth').ZodNullable<import('better-auth').ZodBoolean>
          >
          deletedAt: import('better-auth').ZodOptional<
            import('better-auth').ZodNullable<import('better-auth').ZodDate>
          >
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
          app: {
            type: 'single-agent' | 'multiple-agents'
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
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
        },
        {
          app: {
            type: 'single-agent' | 'multiple-agents'
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AppMetadata
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    delete: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    publish: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listTags: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').Context
      >,
      import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>,
      import('better-auth').ZodDefault<
        import('better-auth').ZodObject<
          {
            after: import('better-auth').ZodOptional<import('better-auth').ZodString>
            before: import('better-auth').ZodOptional<import('better-auth').ZodString>
            limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
            order: import('better-auth').ZodDefault<
              import('better-auth').ZodEnum<{
                asc: 'asc'
                desc: 'desc'
              }>
            >
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<
        {
          tags: {
            name: string
            createdAt: Date
            updatedAt: Date
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        },
        {
          tags: {
            name: string
            createdAt: Date
            updatedAt: Date
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    updateTags: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          tags: import('better-auth').ZodArray<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          tags: {
            name: string
            createdAt: Date
            updatedAt: Date
          }[]
        },
        {
          tags: {
            name: string
            createdAt: Date
            updatedAt: Date
          }[]
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listCategories: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').Context
      >,
      import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>,
      import('better-auth').ZodDefault<
        import('better-auth').ZodObject<
          {
            after: import('better-auth').ZodOptional<import('better-auth').ZodString>
            before: import('better-auth').ZodOptional<import('better-auth').ZodString>
            limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
            order: import('better-auth').ZodDefault<
              import('better-auth').ZodEnum<{
                asc: 'asc'
                desc: 'desc'
              }>
            >
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<
        {
          categories: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    updateCategories: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          add: import('better-auth').ZodOptional<
            import('better-auth').ZodArray<import('better-auth').ZodString>
          >
          remove: import('better-auth').ZodOptional<
            import('better-auth').ZodArray<import('better-auth').ZodString>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          categories: {
            id: string
            name: string
          }[]
        },
        {
          categories: {
            id: string
            name: string
          }[]
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  apiKey: {
    list: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('@orpc/server').MergedInitialContext<
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').Context
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        Record<never, never>
      >,
      import('better-auth').ZodOptional<
        import('better-auth').ZodDiscriminatedUnion<
          [
            import('better-auth').ZodObject<
              {
                scope: import('better-auth').ZodLiteral<'user'>
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                scope: import('better-auth').ZodLiteral<'organization'>
                organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                scope: import('better-auth').ZodLiteral<'workspace'>
                workspaceId: import('better-auth').ZodOptional<import('better-auth').ZodString>
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                scope: import('better-auth').ZodLiteral<'app'>
                appId: import('better-auth').ZodOptional<import('better-auth').ZodString>
              },
              import('better-auth').$strip
            >,
          ]
        >
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    has: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('@orpc/server').MergedInitialContext<
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').Context
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        Record<never, never>
      >,
      import('better-auth').ZodOptional<
        import('better-auth').ZodDiscriminatedUnion<
          [
            import('better-auth').ZodObject<
              {
                scope: import('better-auth').ZodLiteral<'user'>
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                scope: import('better-auth').ZodLiteral<'organization'>
                organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                scope: import('better-auth').ZodLiteral<'workspace'>
                workspaceId: import('better-auth').ZodOptional<import('better-auth').ZodString>
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                scope: import('better-auth').ZodLiteral<'app'>
                appId: import('better-auth').ZodOptional<import('better-auth').ZodString>
              },
              import('better-auth').$strip
            >,
          ]
        >
      >,
      import('@orpc/contract').Schema<
        {
          exists: boolean
        },
        {
          exists: boolean
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    get: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('@orpc/server').MergedInitialContext<
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').Context
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    create: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('@orpc/server').MergedInitialContext<
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').Context
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        Record<never, never>
      >,
      import('better-auth').ZodIntersection<
        import('better-auth').ZodObject<
          {
            name: import('better-auth').ZodString
          },
          import('better-auth').$strip
        >,
        import('better-auth').ZodDiscriminatedUnion<
          [
            import('better-auth').ZodObject<
              {
                scope: import('better-auth').ZodLiteral<'user'>
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                scope: import('better-auth').ZodLiteral<'organization'>
                organizationId: import('better-auth').ZodString
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                scope: import('better-auth').ZodLiteral<'workspace'>
                workspaceId: import('better-auth').ZodString
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                scope: import('better-auth').ZodLiteral<'app'>
                appId: import('better-auth').ZodString
              },
              import('better-auth').$strip
            >,
          ]
        >
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    rotate: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('@orpc/server').MergedInitialContext<
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').Context
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    verify: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('@orpc/server').MergedInitialContext<
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').Context
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          key: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          isValid: boolean
        },
        {
          isValid: boolean
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    delete: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('@orpc/server').MergedInitialContext<
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').BaseContext & {
              auth: import('../auth').Auth
            } & Record<never, never>,
            import('../orpc').Context
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('@orpc/server').MergedCurrentContext<
            import('../orpc').Context,
            Record<never, never>
          >,
          import('../orpc').UserContext
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
  }
  oauthApp: {
    list: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          workspaceId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          appId: import('better-auth').ZodOptional<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    has: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          appId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          exists: boolean
        },
        {
          exists: boolean
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    get: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          appId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    info: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').Context
      >,
      import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>,
      import('better-auth').ZodObject<
        {
          clientId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          name: string
          imageUrl: string | undefined
          clientId: string | null
          redirectUris: string[]
          disabled: boolean | null
        },
        {
          name: string
          imageUrl: string | undefined
          clientId: string | null
          redirectUris: string[]
          disabled: boolean | null
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    create: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          appId: import('better-auth').ZodString
          redirectUris: import('better-auth').ZodOptional<
            import('better-auth').ZodArray<import('better-auth').ZodString>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    update: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          appId: import('better-auth').ZodString
          redirectUris: import('better-auth').ZodOptional<
            import('better-auth').ZodArray<import('better-auth').ZodString>
          >
          disabled: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    delete: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          appId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    rotateSecret: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          appId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  agent: {
    listByApp: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          appId: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listByAppVersion: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          appId: import('better-auth').ZodString
          version: import('better-auth').ZodNumber
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          versions: {
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            agentId: string
          }[]
        },
        {
          versions: {
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            agentId: string
          }[]
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listVersions: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          agentId: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
          before: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          versions: {
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            agentId: string
          }[]
          hasMore: boolean
          first: number | undefined
          last: number | undefined
        },
        {
          versions: {
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            agentId: string
          }[]
          hasMore: boolean
          first: number | undefined
          last: number | undefined
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    byId: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          agent: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            appId: string
          }
        },
        {
          agent: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            appId: string
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    create: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          name: import('better-auth').ZodString
          metadata: import('better-auth').ZodOptional<
            import('better-auth').ZodObject<
              {
                description: import('better-auth').ZodOptional<import('better-auth').ZodString>
                imageUrl: import('better-auth').ZodOptional<import('better-auth').ZodString>
                languageModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                embeddingModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                rerankModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                imageModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                languageModelSettings: import('better-auth').ZodOptional<
                  import('better-auth').ZodObject<
                    {
                      systemPrompt: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                    },
                    import('better-auth').$strip
                  >
                >
                datasetBindings: import('better-auth').ZodOptional<
                  import('better-auth').ZodArray<import('better-auth').ZodString>
                >
              },
              import('better-auth').$catchall<import('better-auth').ZodUnknown>
            >
          >
          appId: import('better-auth').ZodString
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
          agent: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            appId: string
          }
          draft: {
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            agentId: string
          }
        },
        {
          agent: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            appId: string
          }
          draft: {
            version: number
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: AgentMetadata
            agentId: string
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    update: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          name: import('better-auth').ZodOptional<import('better-auth').ZodString>
          metadata: import('better-auth').ZodOptional<
            import('better-auth').ZodObject<
              {
                description: import('better-auth').ZodOptional<import('better-auth').ZodString>
                imageUrl: import('better-auth').ZodOptional<import('better-auth').ZodString>
                languageModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                embeddingModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                rerankModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                imageModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                languageModelSettings: import('better-auth').ZodOptional<
                  import('better-auth').ZodObject<
                    {
                      systemPrompt: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                    },
                    import('better-auth').$strip
                  >
                >
                datasetBindings: import('better-auth').ZodOptional<
                  import('better-auth').ZodArray<import('better-auth').ZodString>
                >
              },
              import('better-auth').$catchall<import('better-auth').ZodUnknown>
            >
          >
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  dataset: {
    list: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          workspaceId: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    byId: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodString,
      import('@orpc/contract').Schema<
        {
          dataset: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: DatasetMetadata
            workspaceId: string
          }
        },
        {
          dataset: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: DatasetMetadata
            workspaceId: string
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    create: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          name: import('better-auth').ZodString
          metadata: import('better-auth').ZodObject<
            {
              languageModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
              embeddingModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
              rerankModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
              retrievalMode: import('better-auth').ZodOptional<
                import('better-auth').ZodEnum<{
                  'vector-search': 'vector-search'
                  'full-text-search': 'full-text-search'
                  'hybrid-search': 'hybrid-search'
                }>
              >
              topK: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
              scoreThreshold: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
              stats: import('better-auth').ZodOptional<
                import('better-auth').ZodObject<
                  {
                    totalSizeBytes: import('better-auth').ZodOptional<
                      import('better-auth').ZodNumber
                    >
                  },
                  import('better-auth').$strip
                >
              >
            },
            import('better-auth').$strip
          >
          workspaceId: import('better-auth').ZodString
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
          dataset: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: DatasetMetadata
            workspaceId: string
          }
        },
        {
          dataset: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: DatasetMetadata
            workspaceId: string
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    update: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          name: import('better-auth').ZodOptional<import('better-auth').ZodString>
          metadata: import('better-auth').ZodOptional<
            import('better-auth').ZodObject<
              {
                languageModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                embeddingModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                rerankModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
                retrievalMode: import('better-auth').ZodOptional<
                  import('better-auth').ZodEnum<{
                    'vector-search': 'vector-search'
                    'full-text-search': 'full-text-search'
                    'hybrid-search': 'hybrid-search'
                  }>
                >
                topK: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
                scoreThreshold: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
                stats: import('better-auth').ZodOptional<
                  import('better-auth').ZodObject<
                    {
                      totalSizeBytes: import('better-auth').ZodOptional<
                        import('better-auth').ZodNumber
                      >
                    },
                    import('better-auth').$strip
                  >
                >
              },
              import('better-auth').$strip
            >
          >
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
          dataset: {
            createdAt: Date
            updatedAt: Date
            id: string
            workspaceId: string
            name: string
            metadata: DatasetMetadata
          }
        },
        {
          dataset: {
            createdAt: Date
            updatedAt: Date
            id: string
            workspaceId: string
            name: string
            metadata: DatasetMetadata
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    delete: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodString,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    createDocument: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          name: import('better-auth').ZodString
          metadata: import('better-auth').ZodOptional<
            import('better-auth').ZodObject<
              {
                url: import('better-auth').ZodOptional<import('better-auth').ZodString>
                processed: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                taskId: import('better-auth').ZodOptional<import('better-auth').ZodString>
              },
              import('better-auth').$strip
            >
          >
          workspaceId: import('better-auth').ZodString
          datasetId: import('better-auth').ZodString
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
          document: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: DocumentMetadata
            workspaceId: string
            datasetId: string
          }
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    updateDocument: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          name: import('better-auth').ZodOptional<import('better-auth').ZodString>
          metadata: import('better-auth').ZodOptional<
            import('better-auth').ZodObject<
              {
                url: import('better-auth').ZodOptional<import('better-auth').ZodString>
                processed: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                taskId: import('better-auth').ZodOptional<import('better-auth').ZodString>
              },
              import('better-auth').$strip
            >
          >
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
          document: {
            createdAt: Date
            updatedAt: Date
            id: string
            workspaceId: string
            datasetId: string
            name: string
            metadata: DocumentMetadata
          }
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    deleteDocument: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodString,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    listDocuments: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          datasetId: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    getDocument: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodString,
      import('@orpc/contract').Schema<
        {
          document: {
            id: string
            name: string
            createdAt: Date
            updatedAt: Date
            metadata: DocumentMetadata
            workspaceId: string
            datasetId: string
          }
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    createSegment: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          metadata: import('better-auth').ZodOptional<
            import('better-auth').ZodRecord<
              import('better-auth').ZodString,
              import('better-auth').ZodUnknown
            >
          >
          workspaceId: import('better-auth').ZodString
          content: import('better-auth').ZodString
          datasetId: import('better-auth').ZodString
          documentId: import('better-auth').ZodString
          index: import('better-auth').ZodNumber
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    updateSegment: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          metadata: import('better-auth').ZodOptional<
            import('better-auth').ZodRecord<
              import('better-auth').ZodString,
              import('better-auth').ZodUnknown
            >
          >
          content: import('better-auth').ZodOptional<import('better-auth').ZodString>
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    deleteSegment: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodString,
      import('@orpc/contract').Schema<
        {
          success: boolean
        },
        {
          success: boolean
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listSegments: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          documentId: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    createChunk: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          metadata: import('better-auth').ZodOptional<
            import('better-auth').ZodRecord<
              import('better-auth').ZodString,
              import('better-auth').ZodUnknown
            >
          >
          workspaceId: import('better-auth').ZodString
          content: import('better-auth').ZodString
          datasetId: import('better-auth').ZodString
          documentId: import('better-auth').ZodString
          index: import('better-auth').ZodNumber
          segmentId: import('better-auth').ZodString
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    updateChunk: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          metadata: import('better-auth').ZodOptional<
            import('better-auth').ZodRecord<
              import('better-auth').ZodString,
              import('better-auth').ZodUnknown
            >
          >
          content: import('better-auth').ZodOptional<import('better-auth').ZodString>
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    deleteChunk: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodString,
      import('@orpc/contract').Schema<
        {
          success: boolean
        },
        {
          success: boolean
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listChunks: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          segmentId: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  storage: {
    list: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodOptional<
        import('zod').ZodObject<
          {
            prefix: import('zod').ZodOptional<import('zod').ZodString>
            delimiter: import('zod').ZodOptional<import('zod').ZodString>
            cursor: import('zod').ZodOptional<import('zod').ZodString>
            limit: import('zod').ZodOptional<import('zod').ZodNumber>
            startAfter: import('zod').ZodOptional<import('zod').ZodString>
          },
          'strip',
          import('zod').ZodTypeAny,
          {
            prefix?: string | undefined
            limit?: number | undefined
            cursor?: string | undefined
            delimiter?: string | undefined
            startAfter?: string | undefined
          },
          {
            prefix?: string | undefined
            limit?: number | undefined
            cursor?: string | undefined
            delimiter?: string | undefined
            startAfter?: string | undefined
          }
        >
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    head: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodObject<
        {
          key: import('zod').ZodString
        },
        'strip',
        import('zod').ZodTypeAny,
        {
          key: string
        },
        {
          key: string
        }
      >,
      import('@orpc/contract').Schema<
        {
          size: number
          uploadedAt: Date
          etag: string
          storageClass: string
          checksums: {
            sha1: string | undefined
            sha256: string | undefined
          }
        } | null,
        {
          size: number
          uploadedAt: Date
          etag: string
          storageClass: string
          checksums: {
            sha1: string | undefined
            sha256: string | undefined
          }
        } | null
      >,
      Record<never, never>,
      Record<never, never>
    >
    get: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodObject<
        {
          key: import('zod').ZodString
        },
        'strip',
        import('zod').ZodTypeAny,
        {
          key: string
        },
        {
          key: string
        }
      >,
      import('@orpc/contract').Schema<
        AsyncGenerator<any, void, unknown>,
        AsyncGenerator<any, void, unknown>
      >,
      Record<never, never>,
      Record<never, never>
    >
    createPresignedDownloadUrl: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodObject<
        {
          key: import('zod').ZodString
          expiresIn: import('zod').ZodDefault<import('zod').ZodOptional<import('zod').ZodNumber>>
        },
        'strip',
        import('zod').ZodTypeAny,
        {
          key: string
          expiresIn: number
        },
        {
          key: string
          expiresIn?: number | undefined
        }
      >,
      import('@orpc/contract').Schema<
        {
          url: string
        },
        {
          url: string
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    put: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodEffects<
        import('zod').ZodObject<
          {
            key: import('zod').ZodString
            file: import('zod').ZodEffects<
              import('zod').ZodType<File, import('zod').ZodTypeDef, File>,
              File,
              File
            >
          },
          import('zod').UnknownKeysParam,
          import('zod').ZodTypeAny,
          {
            key: string
            file: File
          },
          {
            key: string
            file: File
          }
        >,
        {
          key: string
          file: File
        },
        | FormData
        | {
            entries(): IterableIterator<[string, FormDataEntryValue]>
            [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>
          }
        | {
            key: string
            file: File
          }
      >,
      import('@orpc/contract').Schema<
        {
          size: number
          etag: string
          checksums: {
            sha1: string | undefined
            sha256: string | undefined
          }
        },
        {
          size: number
          etag: string
          checksums: {
            sha1: string | undefined
            sha256: string | undefined
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    createPresignedUploadUrl: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodObject<
        {
          key: import('zod').ZodString
          expiresIn: import('zod').ZodDefault<import('zod').ZodOptional<import('zod').ZodNumber>>
        },
        'strip',
        import('zod').ZodTypeAny,
        {
          key: string
          expiresIn: number
        },
        {
          key: string
          expiresIn?: number | undefined
        }
      >,
      import('@orpc/contract').Schema<
        {
          url: string
        },
        {
          url: string
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    delete: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodObject<
        {
          keys: import('zod').ZodUnion<
            [import('zod').ZodString, import('zod').ZodArray<import('zod').ZodString, 'many'>]
          >
        },
        'strip',
        import('zod').ZodTypeAny,
        {
          keys: string | string[]
        },
        {
          keys: string | string[]
        }
      >,
      import('@orpc/contract').Schema<
        {
          deleted: number
        },
        {
          deleted: number
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listMultipartUploads: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodOptional<
        import('zod').ZodObject<
          {
            limit: import('zod').ZodOptional<import('zod').ZodNumber>
            prefix: import('zod').ZodOptional<import('zod').ZodString>
            keyMarker: import('zod').ZodOptional<import('zod').ZodString>
            uploadIdMarker: import('zod').ZodOptional<import('zod').ZodString>
            delimiter: import('zod').ZodOptional<import('zod').ZodString>
          },
          'strip',
          import('zod').ZodTypeAny,
          {
            prefix?: string | undefined
            limit?: number | undefined
            delimiter?: string | undefined
            keyMarker?: string | undefined
            uploadIdMarker?: string | undefined
          },
          {
            prefix?: string | undefined
            limit?: number | undefined
            delimiter?: string | undefined
            keyMarker?: string | undefined
            uploadIdMarker?: string | undefined
          }
        >
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    createMultipartUpload: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodObject<
        {
          key: import('zod').ZodString
        },
        'strip',
        import('zod').ZodTypeAny,
        {
          key: string
        },
        {
          key: string
        }
      >,
      import('@orpc/contract').Schema<
        {
          key: string
          uploadId: string
        },
        {
          key: string
          uploadId: string
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    uploadPart: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodEffects<
        import('zod').ZodObject<
          {
            key: import('zod').ZodString
            uploadId: import('zod').ZodString
            partNumber: import('zod').ZodNumber
            expiresIn: import('zod').ZodDefault<import('zod').ZodOptional<import('zod').ZodNumber>>
            file: import('zod').ZodEffects<
              import('zod').ZodType<File, import('zod').ZodTypeDef, File>,
              File,
              File
            >
          },
          import('zod').UnknownKeysParam,
          import('zod').ZodTypeAny,
          {
            key: string
            file: File
            expiresIn: number
            uploadId: string
            partNumber: number
          },
          {
            key: string
            file: File
            uploadId: string
            partNumber: number
            expiresIn?: number | undefined
          }
        >,
        {
          key: string
          file: File
          expiresIn: number
          uploadId: string
          partNumber: number
        },
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
      >,
      import('@orpc/contract').Schema<
        {
          etag: string
          checksums: {
            sha1: string | undefined
            sha256: string | undefined
          }
        },
        {
          etag: string
          checksums: {
            sha1: string | undefined
            sha256: string | undefined
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    createPresignedUploadPartUrl: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodObject<
        {
          key: import('zod').ZodString
          uploadId: import('zod').ZodString
          partNumber: import('zod').ZodNumber
          expiresIn: import('zod').ZodDefault<import('zod').ZodOptional<import('zod').ZodNumber>>
        },
        'strip',
        import('zod').ZodTypeAny,
        {
          key: string
          expiresIn: number
          uploadId: string
          partNumber: number
        },
        {
          key: string
          uploadId: string
          partNumber: number
          expiresIn?: number | undefined
        }
      >,
      import('@orpc/contract').Schema<
        {
          url: string
        },
        {
          url: string
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    completeMultipartUpload: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodObject<
        {
          key: import('zod').ZodString
          uploadId: import('zod').ZodString
          parts: import('zod').ZodArray<
            import('zod').ZodObject<
              {
                PartNumber: import('zod').ZodNumber
                ETag: import('zod').ZodString
              },
              'strip',
              import('zod').ZodTypeAny,
              {
                ETag: string
                PartNumber: number
              },
              {
                ETag: string
                PartNumber: number
              }
            >,
            'many'
          >
        },
        'strip',
        import('zod').ZodTypeAny,
        {
          key: string
          parts: {
            ETag: string
            PartNumber: number
          }[]
          uploadId: string
        },
        {
          key: string
          parts: {
            ETag: string
            PartNumber: number
          }[]
          uploadId: string
        }
      >,
      import('@orpc/contract').Schema<
        {
          key: string
          etag: string
          checksums: {
            sha1: string | undefined
            sha256: string | undefined
          }
        },
        {
          key: string
          etag: string
          checksums: {
            sha1: string | undefined
            sha256: string | undefined
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    abortMultipartUpload: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppContext
      >,
      import('zod').ZodObject<
        {
          key: import('zod').ZodString
          uploadId: import('zod').ZodString
        },
        'strip',
        import('zod').ZodTypeAny,
        {
          key: string
          uploadId: string
        },
        {
          key: string
          uploadId: string
        }
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
  }
  model: {
    listDefaultModels: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').Context
      >,
      import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>,
      import('@orpc/contract').Schema<unknown, unknown>,
      import('@orpc/contract').Schema<
        {
          defaultModels: {
            app: {
              languageModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              embeddingModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              rerankModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              imageModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
            }
            dataset: {
              languageModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              embeddingModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              rerankModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
            }
          }
        },
        {
          defaultModels: {
            app: {
              languageModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              embeddingModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              rerankModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              imageModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
            }
            dataset: {
              languageModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              embeddingModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
              rerankModel:
                | `openai:${string}`
                | `google:${string}`
                | `vertex:${string}`
                | `fal:${string}`
                | `anthropic:${string}`
                | `openrouter:${string}`
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
                | `elevenlabs:${string}`
                | `lmnt:${string}`
            }
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listProviders: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').Context
      >,
      import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>,
      import('@orpc/contract').Schema<unknown, unknown>,
      import('@orpc/contract').Schema<
        {
          providers: {
            enabled: boolean
            id: ProviderId
            name: string
            icon: string
            description: string
            isGateway?: boolean
          }[]
        },
        {
          providers: {
            enabled: boolean
            id: ProviderId
            name: string
            icon: string
            description: string
            isGateway?: boolean
          }[]
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listProvidersModels: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodDefault<
        import('better-auth').ZodObject<
          {
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
            type: import('better-auth').ZodOptional<
              import('better-auth').ZodEnum<{
                image: 'image'
                language: 'language'
                speech: 'speech'
                transcription: 'transcription'
                textEmbedding: 'textEmbedding'
              }>
            >
            source: import('better-auth').ZodOptional<
              import('better-auth').ZodEnum<{
                custom: 'custom'
                system: 'system'
              }>
            >
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<
        {
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
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `elevenlabs:${string}`
                      | `lmnt:${string}`
                  })[]
                }[]
              | undefined
          }
        },
        {
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
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `elevenlabs:${string}`
                      | `lmnt:${string}`
                  })[]
                }[]
              | undefined
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listModels: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodDefault<
        import('better-auth').ZodObject<
          {
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
            type: import('better-auth').ZodOptional<
              import('better-auth').ZodEnum<{
                image: 'image'
                language: 'language'
                speech: 'speech'
                transcription: 'transcription'
                textEmbedding: 'textEmbedding'
              }>
            >
            source: import('better-auth').ZodOptional<
              import('better-auth').ZodEnum<{
                custom: 'custom'
                system: 'system'
              }>
            >
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<
        {
          models: {
            language:
              | (LanguageModelInfo & {
                  isSystem?: boolean
                } & {
                  id:
                    | `openai:${string}`
                    | `google:${string}`
                    | `vertex:${string}`
                    | `fal:${string}`
                    | `anthropic:${string}`
                    | `openrouter:${string}`
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
                    | `google:${string}`
                    | `vertex:${string}`
                    | `fal:${string}`
                    | `anthropic:${string}`
                    | `openrouter:${string}`
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
                    | `google:${string}`
                    | `vertex:${string}`
                    | `fal:${string}`
                    | `anthropic:${string}`
                    | `openrouter:${string}`
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
                    | `google:${string}`
                    | `vertex:${string}`
                    | `fal:${string}`
                    | `anthropic:${string}`
                    | `openrouter:${string}`
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
                    | `google:${string}`
                    | `vertex:${string}`
                    | `fal:${string}`
                    | `anthropic:${string}`
                    | `openrouter:${string}`
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
                    | `elevenlabs:${string}`
                    | `lmnt:${string}`
                })[]
              | undefined
          }
        },
        {
          models: {
            language:
              | (LanguageModelInfo & {
                  isSystem?: boolean
                } & {
                  id:
                    | `openai:${string}`
                    | `google:${string}`
                    | `vertex:${string}`
                    | `fal:${string}`
                    | `anthropic:${string}`
                    | `openrouter:${string}`
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
                    | `google:${string}`
                    | `vertex:${string}`
                    | `fal:${string}`
                    | `anthropic:${string}`
                    | `openrouter:${string}`
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
                    | `google:${string}`
                    | `vertex:${string}`
                    | `fal:${string}`
                    | `anthropic:${string}`
                    | `openrouter:${string}`
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
                    | `google:${string}`
                    | `vertex:${string}`
                    | `fal:${string}`
                    | `anthropic:${string}`
                    | `openrouter:${string}`
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
                    | `google:${string}`
                    | `vertex:${string}`
                    | `fal:${string}`
                    | `anthropic:${string}`
                    | `openrouter:${string}`
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
                    | `elevenlabs:${string}`
                    | `lmnt:${string}`
                })[]
              | undefined
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    getModel: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          id: import('better-auth').ZodTemplateLiteral<
            | `openai:${string}`
            | `google:${string}`
            | `vertex:${string}`
            | `fal:${string}`
            | `anthropic:${string}`
            | `openrouter:${string}`
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
            | `elevenlabs:${string}`
            | `lmnt:${string}`
          >
          type: import('better-auth').ZodEnum<{
            image: 'image'
            language: 'language'
            speech: 'speech'
            transcription: 'transcription'
            textEmbedding: 'textEmbedding'
          }>
          source: import('better-auth').ZodOptional<
            import('better-auth').ZodEnum<{
              custom: 'custom'
              system: 'system'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          model:
            | {
                id:
                  | `openai:${string}`
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
        },
        {
          model:
            | {
                id:
                  | `openai:${string}`
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    updateModel: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodIntersection<
        import('better-auth').ZodObject<
          {
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
            providerId: import('better-auth').ZodEnum<{
              openai: 'openai'
              google: 'google'
              vertex: 'vertex'
              fal: 'fal'
              anthropic: 'anthropic'
              openrouter: 'openrouter'
              azure: 'azure'
              bedrock: 'bedrock'
              deepseek: 'deepseek'
              mistral: 'mistral'
              xai: 'xai'
              togetherai: 'togetherai'
              cohere: 'cohere'
              fireworks: 'fireworks'
              deepinfra: 'deepinfra'
              cerebras: 'cerebras'
              groq: 'groq'
              replicate: 'replicate'
              perplexity: 'perplexity'
              luma: 'luma'
              vercel: 'vercel'
              elevenlabs: 'elevenlabs'
              lmnt: 'lmnt'
            }>
            isSystem: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
          },
          import('better-auth').$strip
        >,
        import('better-auth').ZodDiscriminatedUnion<
          [
            import('better-auth').ZodObject<
              {
                type: import('better-auth').ZodLiteral<'language'>
                model: import('better-auth').ZodObject<
                  {
                    name: import('better-auth').ZodString
                    description: import('better-auth').ZodString
                    deprecated: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    retired: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    chargeable: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    contextWindow: import('better-auth').ZodOptional<import('better-auth').ZodInt>
                    maxOutputTokens: import('better-auth').ZodOptional<import('better-auth').ZodInt>
                    inputTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    cachedInputTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    cacheInputTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodUnion<
                        [
                          import('better-auth').ZodString,
                          import('better-auth').ZodArray<
                            import('better-auth').ZodTuple<
                              [import('better-auth').ZodString, import('better-auth').ZodString],
                              null
                            >
                          >,
                        ]
                      >
                    >
                    outputTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    modality: import('better-auth').ZodOptional<
                      import('better-auth').ZodObject<
                        {
                          input: import('better-auth').ZodOptional<
                            import('better-auth').ZodArray<
                              import('better-auth').ZodEnum<{
                                image: 'image'
                                text: 'text'
                                audio: 'audio'
                                video: 'video'
                                pdf: 'pdf'
                              }>
                            >
                          >
                          output: import('better-auth').ZodOptional<
                            import('better-auth').ZodArray<
                              import('better-auth').ZodEnum<{
                                image: 'image'
                                text: 'text'
                                audio: 'audio'
                                video: 'video'
                                pdf: 'pdf'
                              }>
                            >
                          >
                        },
                        import('better-auth').$strip
                      >
                    >
                    id: import('better-auth').ZodTemplateLiteral<
                      | `openai:${string}`
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `elevenlabs:${string}`
                      | `lmnt:${string}`
                    >
                  },
                  import('better-auth').$strip
                >
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                type: import('better-auth').ZodLiteral<'image'>
                model: import('better-auth').ZodObject<
                  {
                    name: import('better-auth').ZodString
                    description: import('better-auth').ZodString
                    deprecated: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    retired: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    chargeable: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    imageInputTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    imageCachedInputTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    imageOutputTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    textInputTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    textCachedInputTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    pricePerImage: import('better-auth').ZodOptional<
                      import('better-auth').ZodUnion<
                        [
                          import('better-auth').ZodUnion<
                            [
                              import('better-auth').ZodString,
                              import('better-auth').ZodArray<
                                import('better-auth').ZodTuple<
                                  [
                                    import('better-auth').ZodString,
                                    import('better-auth').ZodString,
                                  ],
                                  null
                                >
                              >,
                            ]
                          >,
                          import('better-auth').ZodArray<
                            import('better-auth').ZodTuple<
                              [
                                import('better-auth').ZodString,
                                import('better-auth').ZodArray<
                                  import('better-auth').ZodTuple<
                                    [
                                      import('better-auth').ZodString,
                                      import('better-auth').ZodString,
                                    ],
                                    null
                                  >
                                >,
                              ],
                              null
                            >
                          >,
                        ]
                      >
                    >
                    id: import('better-auth').ZodTemplateLiteral<
                      | `openai:${string}`
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `elevenlabs:${string}`
                      | `lmnt:${string}`
                    >
                  },
                  import('better-auth').$strip
                >
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                type: import('better-auth').ZodLiteral<'speech'>
                model: import('better-auth').ZodObject<
                  {
                    name: import('better-auth').ZodString
                    description: import('better-auth').ZodString
                    deprecated: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    retired: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    chargeable: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    maxInputTokens: import('better-auth').ZodOptional<import('better-auth').ZodInt>
                    textTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    audioTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    id: import('better-auth').ZodTemplateLiteral<
                      | `openai:${string}`
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `elevenlabs:${string}`
                      | `lmnt:${string}`
                    >
                  },
                  import('better-auth').$strip
                >
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                type: import('better-auth').ZodLiteral<'transcription'>
                model: import('better-auth').ZodObject<
                  {
                    name: import('better-auth').ZodString
                    description: import('better-auth').ZodString
                    deprecated: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    retired: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    chargeable: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    audioTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    textInputTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    textOutputTokenPrice: import('better-auth').ZodOptional<
                      import('better-auth').ZodString
                    >
                    id: import('better-auth').ZodTemplateLiteral<
                      | `openai:${string}`
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `elevenlabs:${string}`
                      | `lmnt:${string}`
                    >
                  },
                  import('better-auth').$strip
                >
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                type: import('better-auth').ZodLiteral<'textEmbedding'>
                model: import('better-auth').ZodObject<
                  {
                    name: import('better-auth').ZodString
                    description: import('better-auth').ZodString
                    deprecated: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    retired: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    chargeable: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                    tokenPrice: import('better-auth').ZodOptional<import('better-auth').ZodString>
                    dimensions: import('better-auth').ZodOptional<
                      import('better-auth').ZodUnion<
                        [
                          import('better-auth').ZodInt,
                          import('better-auth').ZodArray<import('better-auth').ZodInt>,
                        ]
                      >
                    >
                    id: import('better-auth').ZodTemplateLiteral<
                      | `openai:${string}`
                      | `google:${string}`
                      | `vertex:${string}`
                      | `fal:${string}`
                      | `anthropic:${string}`
                      | `openrouter:${string}`
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
                      | `elevenlabs:${string}`
                      | `lmnt:${string}`
                    >
                  },
                  import('better-auth').$strip
                >
              },
              import('better-auth').$strip
            >,
          ]
        >
      >,
      import('@orpc/contract').Schema<
        {
          model:
            | {
                isSystem: boolean
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                tokenPrice?: string | undefined
                dimensions?: number | number[] | undefined
              }
        },
        {
          model:
            | {
                isSystem: boolean
                name: string
                description: string
                id:
                  | `openai:${string}`
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `elevenlabs:${string}`
                  | `lmnt:${string}`
                deprecated?: boolean | undefined
                retired?: boolean | undefined
                chargeable?: boolean | undefined
                tokenPrice?: string | undefined
                dimensions?: number | number[] | undefined
              }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    updateModels: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodIntersection<
        import('better-auth').ZodObject<
          {
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
            providerId: import('better-auth').ZodEnum<{
              openai: 'openai'
              google: 'google'
              vertex: 'vertex'
              fal: 'fal'
              anthropic: 'anthropic'
              openrouter: 'openrouter'
              azure: 'azure'
              bedrock: 'bedrock'
              deepseek: 'deepseek'
              mistral: 'mistral'
              xai: 'xai'
              togetherai: 'togetherai'
              cohere: 'cohere'
              fireworks: 'fireworks'
              deepinfra: 'deepinfra'
              cerebras: 'cerebras'
              groq: 'groq'
              replicate: 'replicate'
              perplexity: 'perplexity'
              luma: 'luma'
              vercel: 'vercel'
              elevenlabs: 'elevenlabs'
              lmnt: 'lmnt'
            }>
            isSystem: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
          },
          import('better-auth').$strip
        >,
        import('better-auth').ZodDiscriminatedUnion<
          [
            import('better-auth').ZodObject<
              {
                type: import('better-auth').ZodLiteral<'language'>
                models: import('better-auth').ZodArray<
                  import('better-auth').ZodObject<
                    {
                      name: import('better-auth').ZodString
                      description: import('better-auth').ZodString
                      deprecated: import('better-auth').ZodOptional<
                        import('better-auth').ZodBoolean
                      >
                      retired: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                      chargeable: import('better-auth').ZodOptional<
                        import('better-auth').ZodBoolean
                      >
                      contextWindow: import('better-auth').ZodOptional<import('better-auth').ZodInt>
                      maxOutputTokens: import('better-auth').ZodOptional<
                        import('better-auth').ZodInt
                      >
                      inputTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      cachedInputTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      cacheInputTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodUnion<
                          [
                            import('better-auth').ZodString,
                            import('better-auth').ZodArray<
                              import('better-auth').ZodTuple<
                                [import('better-auth').ZodString, import('better-auth').ZodString],
                                null
                              >
                            >,
                          ]
                        >
                      >
                      outputTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      modality: import('better-auth').ZodOptional<
                        import('better-auth').ZodObject<
                          {
                            input: import('better-auth').ZodOptional<
                              import('better-auth').ZodArray<
                                import('better-auth').ZodEnum<{
                                  image: 'image'
                                  text: 'text'
                                  audio: 'audio'
                                  video: 'video'
                                  pdf: 'pdf'
                                }>
                              >
                            >
                            output: import('better-auth').ZodOptional<
                              import('better-auth').ZodArray<
                                import('better-auth').ZodEnum<{
                                  image: 'image'
                                  text: 'text'
                                  audio: 'audio'
                                  video: 'video'
                                  pdf: 'pdf'
                                }>
                              >
                            >
                          },
                          import('better-auth').$strip
                        >
                      >
                      id: import('better-auth').ZodTemplateLiteral<
                        | `openai:${string}`
                        | `google:${string}`
                        | `vertex:${string}`
                        | `fal:${string}`
                        | `anthropic:${string}`
                        | `openrouter:${string}`
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
                        | `elevenlabs:${string}`
                        | `lmnt:${string}`
                      >
                    },
                    import('better-auth').$strip
                  >
                >
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                type: import('better-auth').ZodLiteral<'image'>
                models: import('better-auth').ZodArray<
                  import('better-auth').ZodObject<
                    {
                      name: import('better-auth').ZodString
                      description: import('better-auth').ZodString
                      deprecated: import('better-auth').ZodOptional<
                        import('better-auth').ZodBoolean
                      >
                      retired: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                      chargeable: import('better-auth').ZodOptional<
                        import('better-auth').ZodBoolean
                      >
                      imageInputTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      imageCachedInputTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      imageOutputTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      textInputTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      textCachedInputTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      pricePerImage: import('better-auth').ZodOptional<
                        import('better-auth').ZodUnion<
                          [
                            import('better-auth').ZodUnion<
                              [
                                import('better-auth').ZodString,
                                import('better-auth').ZodArray<
                                  import('better-auth').ZodTuple<
                                    [
                                      import('better-auth').ZodString,
                                      import('better-auth').ZodString,
                                    ],
                                    null
                                  >
                                >,
                              ]
                            >,
                            import('better-auth').ZodArray<
                              import('better-auth').ZodTuple<
                                [
                                  import('better-auth').ZodString,
                                  import('better-auth').ZodArray<
                                    import('better-auth').ZodTuple<
                                      [
                                        import('better-auth').ZodString,
                                        import('better-auth').ZodString,
                                      ],
                                      null
                                    >
                                  >,
                                ],
                                null
                              >
                            >,
                          ]
                        >
                      >
                      id: import('better-auth').ZodTemplateLiteral<
                        | `openai:${string}`
                        | `google:${string}`
                        | `vertex:${string}`
                        | `fal:${string}`
                        | `anthropic:${string}`
                        | `openrouter:${string}`
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
                        | `elevenlabs:${string}`
                        | `lmnt:${string}`
                      >
                    },
                    import('better-auth').$strip
                  >
                >
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                type: import('better-auth').ZodLiteral<'speech'>
                models: import('better-auth').ZodArray<
                  import('better-auth').ZodObject<
                    {
                      name: import('better-auth').ZodString
                      description: import('better-auth').ZodString
                      deprecated: import('better-auth').ZodOptional<
                        import('better-auth').ZodBoolean
                      >
                      retired: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                      chargeable: import('better-auth').ZodOptional<
                        import('better-auth').ZodBoolean
                      >
                      maxInputTokens: import('better-auth').ZodOptional<
                        import('better-auth').ZodInt
                      >
                      textTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      audioTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      id: import('better-auth').ZodTemplateLiteral<
                        | `openai:${string}`
                        | `google:${string}`
                        | `vertex:${string}`
                        | `fal:${string}`
                        | `anthropic:${string}`
                        | `openrouter:${string}`
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
                        | `elevenlabs:${string}`
                        | `lmnt:${string}`
                      >
                    },
                    import('better-auth').$strip
                  >
                >
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                type: import('better-auth').ZodLiteral<'transcription'>
                models: import('better-auth').ZodArray<
                  import('better-auth').ZodObject<
                    {
                      name: import('better-auth').ZodString
                      description: import('better-auth').ZodString
                      deprecated: import('better-auth').ZodOptional<
                        import('better-auth').ZodBoolean
                      >
                      retired: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                      chargeable: import('better-auth').ZodOptional<
                        import('better-auth').ZodBoolean
                      >
                      audioTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      textInputTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      textOutputTokenPrice: import('better-auth').ZodOptional<
                        import('better-auth').ZodString
                      >
                      id: import('better-auth').ZodTemplateLiteral<
                        | `openai:${string}`
                        | `google:${string}`
                        | `vertex:${string}`
                        | `fal:${string}`
                        | `anthropic:${string}`
                        | `openrouter:${string}`
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
                        | `elevenlabs:${string}`
                        | `lmnt:${string}`
                      >
                    },
                    import('better-auth').$strip
                  >
                >
              },
              import('better-auth').$strip
            >,
            import('better-auth').ZodObject<
              {
                type: import('better-auth').ZodLiteral<'textEmbedding'>
                models: import('better-auth').ZodArray<
                  import('better-auth').ZodObject<
                    {
                      name: import('better-auth').ZodString
                      description: import('better-auth').ZodString
                      deprecated: import('better-auth').ZodOptional<
                        import('better-auth').ZodBoolean
                      >
                      retired: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
                      chargeable: import('better-auth').ZodOptional<
                        import('better-auth').ZodBoolean
                      >
                      tokenPrice: import('better-auth').ZodOptional<import('better-auth').ZodString>
                      dimensions: import('better-auth').ZodOptional<
                        import('better-auth').ZodUnion<
                          [
                            import('better-auth').ZodInt,
                            import('better-auth').ZodArray<import('better-auth').ZodInt>,
                          ]
                        >
                      >
                      id: import('better-auth').ZodTemplateLiteral<
                        | `openai:${string}`
                        | `google:${string}`
                        | `vertex:${string}`
                        | `fal:${string}`
                        | `anthropic:${string}`
                        | `openrouter:${string}`
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
                        | `elevenlabs:${string}`
                        | `lmnt:${string}`
                      >
                    },
                    import('better-auth').$strip
                  >
                >
              },
              import('better-auth').$strip
            >,
          ]
        >
      >,
      import('@orpc/contract').Schema<
        {
          models: (
            | {
                id:
                  | `openai:${string}`
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
        },
        {
          models: (
            | {
                id:
                  | `openai:${string}`
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    sortModels: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          providerId: import('better-auth').ZodEnum<{
            openai: 'openai'
            google: 'google'
            vertex: 'vertex'
            fal: 'fal'
            anthropic: 'anthropic'
            openrouter: 'openrouter'
            azure: 'azure'
            bedrock: 'bedrock'
            deepseek: 'deepseek'
            mistral: 'mistral'
            xai: 'xai'
            togetherai: 'togetherai'
            cohere: 'cohere'
            fireworks: 'fireworks'
            deepinfra: 'deepinfra'
            cerebras: 'cerebras'
            groq: 'groq'
            replicate: 'replicate'
            perplexity: 'perplexity'
            luma: 'luma'
            vercel: 'vercel'
            elevenlabs: 'elevenlabs'
            lmnt: 'lmnt'
          }>
          isSystem: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
          type: import('better-auth').ZodEnum<{
            image: 'image'
            language: 'language'
            speech: 'speech'
            transcription: 'transcription'
            textEmbedding: 'textEmbedding'
          }>
          ids: import('better-auth').ZodArray<
            import('better-auth').ZodTemplateLiteral<
              | `openai:${string}`
              | `google:${string}`
              | `vertex:${string}`
              | `fal:${string}`
              | `anthropic:${string}`
              | `openrouter:${string}`
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
              | `elevenlabs:${string}`
              | `lmnt:${string}`
            >
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          models: (
            | {
                id:
                  | `openai:${string}`
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
        },
        {
          models: (
            | {
                id:
                  | `openai:${string}`
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    deleteModel: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          id: import('better-auth').ZodTemplateLiteral<
            | `openai:${string}`
            | `google:${string}`
            | `vertex:${string}`
            | `fal:${string}`
            | `anthropic:${string}`
            | `openrouter:${string}`
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
            | `elevenlabs:${string}`
            | `lmnt:${string}`
          >
          type: import('better-auth').ZodEnum<{
            image: 'image'
            language: 'language'
            speech: 'speech'
            transcription: 'transcription'
            textEmbedding: 'textEmbedding'
          }>
          isSystem: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          model:
            | {
                id:
                  | `openai:${string}`
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
        },
        {
          model:
            | {
                id:
                  | `openai:${string}`
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    deleteModels: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          providerId: import('better-auth').ZodEnum<{
            openai: 'openai'
            google: 'google'
            vertex: 'vertex'
            fal: 'fal'
            anthropic: 'anthropic'
            openrouter: 'openrouter'
            azure: 'azure'
            bedrock: 'bedrock'
            deepseek: 'deepseek'
            mistral: 'mistral'
            xai: 'xai'
            togetherai: 'togetherai'
            cohere: 'cohere'
            fireworks: 'fireworks'
            deepinfra: 'deepinfra'
            cerebras: 'cerebras'
            groq: 'groq'
            replicate: 'replicate'
            perplexity: 'perplexity'
            luma: 'luma'
            vercel: 'vercel'
            elevenlabs: 'elevenlabs'
            lmnt: 'lmnt'
          }>
          ids: import('better-auth').ZodArray<
            import('better-auth').ZodTemplateLiteral<
              | `openai:${string}`
              | `google:${string}`
              | `vertex:${string}`
              | `fal:${string}`
              | `anthropic:${string}`
              | `openrouter:${string}`
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
              | `elevenlabs:${string}`
              | `lmnt:${string}`
            >
          >
          type: import('better-auth').ZodEnum<{
            image: 'image'
            language: 'language'
            speech: 'speech'
            transcription: 'transcription'
            textEmbedding: 'textEmbedding'
          }>
          isSystem: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          models: (
            | {
                id:
                  | `openai:${string}`
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
        },
        {
          models: (
            | {
                id:
                  | `openai:${string}`
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
                  | `google:${string}`
                  | `vertex:${string}`
                  | `fal:${string}`
                  | `anthropic:${string}`
                  | `openrouter:${string}`
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
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  tokenizer: {
    encode: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').Context
      >,
      import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>,
      import('better-auth').ZodObject<
        {
          text: import('better-auth').ZodString
          modelId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          tokens: number[]
          count: number
          chunks: string[]
        },
        {
          tokens: number[]
          count: number
          chunks: string[]
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    decode: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').Context
      >,
      import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>,
      import('better-auth').ZodObject<
        {
          tokens: import('better-auth').ZodArray<import('better-auth').ZodNumber>
          modelId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<string, string>,
      Record<never, never>,
      Record<never, never>
    >
    count: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').BaseContext & {
          auth: import('../auth').Auth
        } & Record<never, never>,
        import('../orpc').Context
      >,
      import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>,
      import('better-auth').ZodObject<
        {
          messages: import('better-auth').ZodArray<
            import('better-auth').ZodRecord<
              import('better-auth').ZodString,
              import('better-auth').ZodString
            >
          >
          modelId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<number, number>,
      Record<never, never>,
      Record<never, never>
    >
  }
  chat: {
    list: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          orderBy: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
          orderOn: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              createdAt: 'createdAt'
              updatedAt: 'updatedAt'
            }>
          >
          includeLastMessage: import('better-auth').ZodDefault<import('better-auth').ZodBoolean>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listByIds: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          ids: import('better-auth').ZodArray<import('better-auth').ZodString>
          includeLastMessage: import('better-auth').ZodDefault<import('better-auth').ZodBoolean>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    byId: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          includeLastMessage: import('better-auth').ZodDefault<import('better-auth').ZodBoolean>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    create: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodOptional<import('better-auth').ZodString>
          metadata: import('better-auth').ZodObject<
            {
              title: import('better-auth').ZodDefault<import('better-auth').ZodString>
              visibility: import('better-auth').ZodDefault<
                import('better-auth').ZodEnum<{
                  public: 'public'
                  private: 'private'
                }>
              >
              languageModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
              embeddingModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
              rerankModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
              imageModel: import('better-auth').ZodOptional<import('better-auth').ZodString>
              custom: import('better-auth').ZodOptional<import('better-auth').ZodUnknown>
            },
            import('better-auth').$strip
          >
          debug: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
          initialMessages: import('better-auth').ZodOptional<
            import('better-auth').ZodArray<
              import('better-auth').ZodArray<
                import('better-auth').ZodObject<
                  {
                    id: import('better-auth').ZodOptional<import('better-auth').ZodString>
                    role: import('better-auth').ZodEnum<{
                      system: 'system'
                      user: 'user'
                      assistant: 'assistant'
                    }>
                    agentId: import('better-auth').ZodOptional<import('better-auth').ZodString>
                    content: import('better-auth').ZodObject<
                      {
                        parts: import('better-auth').ZodArray<
                          import('better-auth').ZodUnion<
                            readonly [
                              import('better-auth').ZodObject<
                                {
                                  type: import('better-auth').ZodLiteral<'text'>
                                  text: import('better-auth').ZodString
                                  state: import('better-auth').ZodOptional<
                                    import('better-auth').ZodUnion<
                                      readonly [
                                        import('better-auth').ZodLiteral<'streaming'>,
                                        import('better-auth').ZodLiteral<'done'>,
                                      ]
                                    >
                                  >
                                },
                                import('better-auth').$strip
                              >,
                              import('better-auth').ZodObject<
                                {
                                  type: import('better-auth').ZodLiteral<'reasoning'>
                                  text: import('better-auth').ZodString
                                  state: import('better-auth').ZodOptional<
                                    import('better-auth').ZodUnion<
                                      readonly [
                                        import('better-auth').ZodLiteral<'streaming'>,
                                        import('better-auth').ZodLiteral<'done'>,
                                      ]
                                    >
                                  >
                                  providerMetadata: import('better-auth').ZodOptional<
                                    import('better-auth').ZodRecord<
                                      import('better-auth').ZodString,
                                      import('better-auth').ZodRecord<
                                        import('better-auth').ZodString,
                                        import('better-auth').ZodType<
                                          import('@ai-sdk/provider').JSONValue,
                                          unknown,
                                          import('better-auth').$ZodTypeInternals<
                                            import('@ai-sdk/provider').JSONValue,
                                            unknown
                                          >
                                        >
                                      >
                                    >
                                  >
                                },
                                import('better-auth').$strip
                              >,
                              import('better-auth').ZodObject<
                                {
                                  type: import('better-auth').ZodLiteral<'source-url'>
                                  sourceId: import('better-auth').ZodString
                                  url: import('better-auth').ZodString
                                  title: import('better-auth').ZodOptional<
                                    import('better-auth').ZodString
                                  >
                                  providerMetadata: import('better-auth').ZodOptional<
                                    import('better-auth').ZodRecord<
                                      import('better-auth').ZodString,
                                      import('better-auth').ZodRecord<
                                        import('better-auth').ZodString,
                                        import('better-auth').ZodType<
                                          import('@ai-sdk/provider').JSONValue,
                                          unknown,
                                          import('better-auth').$ZodTypeInternals<
                                            import('@ai-sdk/provider').JSONValue,
                                            unknown
                                          >
                                        >
                                      >
                                    >
                                  >
                                },
                                import('better-auth').$strip
                              >,
                              import('better-auth').ZodObject<
                                {
                                  type: import('better-auth').ZodLiteral<'source-document'>
                                  sourceId: import('better-auth').ZodString
                                  mediaType: import('better-auth').ZodString
                                  title: import('better-auth').ZodString
                                  filename: import('better-auth').ZodOptional<
                                    import('better-auth').ZodString
                                  >
                                  providerMetadata: import('better-auth').ZodOptional<
                                    import('better-auth').ZodRecord<
                                      import('better-auth').ZodString,
                                      import('better-auth').ZodRecord<
                                        import('better-auth').ZodString,
                                        import('better-auth').ZodType<
                                          import('@ai-sdk/provider').JSONValue,
                                          unknown,
                                          import('better-auth').$ZodTypeInternals<
                                            import('@ai-sdk/provider').JSONValue,
                                            unknown
                                          >
                                        >
                                      >
                                    >
                                  >
                                },
                                import('better-auth').$strip
                              >,
                              import('better-auth').ZodObject<
                                {
                                  type: import('better-auth').ZodLiteral<'file'>
                                  mediaType: import('better-auth').ZodString
                                  filename: import('better-auth').ZodOptional<
                                    import('better-auth').ZodString
                                  >
                                  url: import('better-auth').ZodString
                                },
                                import('better-auth').$strip
                              >,
                              import('better-auth').ZodObject<
                                {
                                  type: import('better-auth').ZodLiteral<'step-start'>
                                },
                                import('better-auth').$strip
                              >,
                              import('better-auth').ZodObject<
                                {
                                  type: import('better-auth').ZodTemplateLiteral<`data-${string}`>
                                  id: import('better-auth').ZodOptional<
                                    import('better-auth').ZodString
                                  >
                                  data: import('better-auth').ZodAny
                                },
                                import('better-auth').$strip
                              >,
                              import('better-auth').ZodIntersection<
                                import('better-auth').ZodObject<
                                  {
                                    type: import('better-auth').ZodTemplateLiteral<`tool-${string}`>
                                    toolCallId: import('better-auth').ZodString
                                  },
                                  import('better-auth').$strip
                                >,
                                import('better-auth').ZodDiscriminatedUnion<
                                  [
                                    import('better-auth').ZodObject<
                                      {
                                        state: import('better-auth').ZodLiteral<'input-streaming'>
                                        input: import('better-auth').ZodAny
                                        providerExecuted: import('better-auth').ZodOptional<
                                          import('better-auth').ZodBoolean
                                        >
                                      },
                                      import('better-auth').$strip
                                    >,
                                    import('better-auth').ZodObject<
                                      {
                                        state: import('better-auth').ZodLiteral<'input-available'>
                                        input: import('better-auth').ZodAny
                                        providerExecuted: import('better-auth').ZodOptional<
                                          import('better-auth').ZodBoolean
                                        >
                                      },
                                      import('better-auth').$strip
                                    >,
                                    import('better-auth').ZodObject<
                                      {
                                        state: import('better-auth').ZodLiteral<'output-available'>
                                        input: import('better-auth').ZodAny
                                        output: import('better-auth').ZodAny
                                        providerExecuted: import('better-auth').ZodOptional<
                                          import('better-auth').ZodBoolean
                                        >
                                      },
                                      import('better-auth').$strip
                                    >,
                                    import('better-auth').ZodObject<
                                      {
                                        state: import('better-auth').ZodLiteral<'output-error'>
                                        input: import('better-auth').ZodAny
                                        errorText: import('better-auth').ZodString
                                        providerExecuted: import('better-auth').ZodOptional<
                                          import('better-auth').ZodBoolean
                                        >
                                      },
                                      import('better-auth').$strip
                                    >,
                                  ]
                                >
                              >,
                              import('better-auth').ZodIntersection<
                                import('better-auth').ZodObject<
                                  {
                                    type: import('better-auth').ZodLiteral<'dynamic-tool'>
                                    toolName: import('better-auth').ZodString
                                    toolCallId: import('better-auth').ZodString
                                  },
                                  import('better-auth').$strip
                                >,
                                import('better-auth').ZodDiscriminatedUnion<
                                  [
                                    import('better-auth').ZodObject<
                                      {
                                        state: import('better-auth').ZodLiteral<'input-streaming'>
                                        input: import('better-auth').ZodUnion<
                                          [
                                            import('better-auth').ZodUnknown,
                                            import('better-auth').ZodUndefined,
                                          ]
                                        >
                                      },
                                      import('better-auth').$strip
                                    >,
                                    import('better-auth').ZodObject<
                                      {
                                        state: import('better-auth').ZodLiteral<'input-available'>
                                        input: import('better-auth').ZodUnknown
                                        callProviderMetadata: import('better-auth').ZodOptional<
                                          import('better-auth').ZodRecord<
                                            import('better-auth').ZodString,
                                            import('better-auth').ZodRecord<
                                              import('better-auth').ZodString,
                                              import('better-auth').ZodType<
                                                import('@ai-sdk/provider').JSONValue,
                                                unknown,
                                                import('better-auth').$ZodTypeInternals<
                                                  import('@ai-sdk/provider').JSONValue,
                                                  unknown
                                                >
                                              >
                                            >
                                          >
                                        >
                                      },
                                      import('better-auth').$strip
                                    >,
                                    import('better-auth').ZodObject<
                                      {
                                        state: import('better-auth').ZodLiteral<'output-available'>
                                        input: import('better-auth').ZodUnknown
                                        output: import('better-auth').ZodUnknown
                                        callProviderMetadata: import('better-auth').ZodOptional<
                                          import('better-auth').ZodRecord<
                                            import('better-auth').ZodString,
                                            import('better-auth').ZodRecord<
                                              import('better-auth').ZodString,
                                              import('better-auth').ZodType<
                                                import('@ai-sdk/provider').JSONValue,
                                                unknown,
                                                import('better-auth').$ZodTypeInternals<
                                                  import('@ai-sdk/provider').JSONValue,
                                                  unknown
                                                >
                                              >
                                            >
                                          >
                                        >
                                      },
                                      import('better-auth').$strip
                                    >,
                                    import('better-auth').ZodObject<
                                      {
                                        state: import('better-auth').ZodLiteral<'output-error'>
                                        input: import('better-auth').ZodUnknown
                                        errorText: import('better-auth').ZodString
                                        callProviderMetadata: import('better-auth').ZodOptional<
                                          import('better-auth').ZodRecord<
                                            import('better-auth').ZodString,
                                            import('better-auth').ZodRecord<
                                              import('better-auth').ZodString,
                                              import('better-auth').ZodType<
                                                import('@ai-sdk/provider').JSONValue,
                                                unknown,
                                                import('better-auth').$ZodTypeInternals<
                                                  import('@ai-sdk/provider').JSONValue,
                                                  unknown
                                                >
                                              >
                                            >
                                          >
                                        >
                                      },
                                      import('better-auth').$strip
                                    >,
                                  ]
                                >
                              >,
                            ]
                          >
                        >
                        metadata: import('better-auth').ZodOptional<import('better-auth').ZodAny>
                      },
                      import('better-auth').$strip
                    >
                  },
                  import('better-auth').$strip
                >
              >
            >
          >
          includeLastMessage: import('better-auth').ZodDefault<import('better-auth').ZodBoolean>
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    update: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          metadata: import('better-auth').ZodOptional<
            import('better-auth').ZodObject<
              {
                title: import('better-auth').ZodOptional<
                  import('better-auth').ZodDefault<import('better-auth').ZodString>
                >
                visibility: import('better-auth').ZodOptional<
                  import('better-auth').ZodDefault<
                    import('better-auth').ZodEnum<{
                      public: 'public'
                      private: 'private'
                    }>
                  >
                >
                languageModel: import('better-auth').ZodOptional<
                  import('better-auth').ZodOptional<import('better-auth').ZodString>
                >
                embeddingModel: import('better-auth').ZodOptional<
                  import('better-auth').ZodOptional<import('better-auth').ZodString>
                >
                rerankModel: import('better-auth').ZodOptional<
                  import('better-auth').ZodOptional<import('better-auth').ZodString>
                >
                imageModel: import('better-auth').ZodOptional<
                  import('better-auth').ZodOptional<import('better-auth').ZodString>
                >
                custom: import('better-auth').ZodOptional<
                  import('better-auth').ZodOptional<import('better-auth').ZodUnknown>
                >
              },
              import('better-auth').$ZodObjectConfig
            >
          >
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
          chat: {
            createdAt: Date
            updatedAt: Date
            id: string
            appId: string
            userId: string
            debug: boolean
            metadata: ChatMetadata
          }
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    delete: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          chat: {
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            metadata: ChatMetadata
            appId: string
            debug: boolean
          }
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    batchDelete: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          ids: import('better-auth').ZodArray<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          chats: {
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            metadata: ChatMetadata
            appId: string
            debug: boolean
          }[]
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    clone: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          messages: import('better-auth').ZodArray<import('better-auth').ZodString>
          includeLastMessage: import('better-auth').ZodDefault<import('better-auth').ZodBoolean>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  message: {
    list: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          chatId: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    listByIds: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          chatId: import('better-auth').ZodString
          ids: import('better-auth').ZodArray<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    find: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    get: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    create: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodOptional<import('better-auth').ZodString>
          parentId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          chatId: import('better-auth').ZodString
          role: import('better-auth').ZodEnum<{
            system: 'system'
            user: 'user'
            assistant: 'assistant'
          }>
          agentId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          content: import('better-auth').ZodObject<
            {
              parts: import('better-auth').ZodArray<
                import('better-auth').ZodUnion<
                  readonly [
                    import('better-auth').ZodObject<
                      {
                        type: import('better-auth').ZodLiteral<'text'>
                        text: import('better-auth').ZodString
                        state: import('better-auth').ZodOptional<
                          import('better-auth').ZodUnion<
                            readonly [
                              import('better-auth').ZodLiteral<'streaming'>,
                              import('better-auth').ZodLiteral<'done'>,
                            ]
                          >
                        >
                      },
                      import('better-auth').$strip
                    >,
                    import('better-auth').ZodObject<
                      {
                        type: import('better-auth').ZodLiteral<'reasoning'>
                        text: import('better-auth').ZodString
                        state: import('better-auth').ZodOptional<
                          import('better-auth').ZodUnion<
                            readonly [
                              import('better-auth').ZodLiteral<'streaming'>,
                              import('better-auth').ZodLiteral<'done'>,
                            ]
                          >
                        >
                        providerMetadata: import('better-auth').ZodOptional<
                          import('better-auth').ZodRecord<
                            import('better-auth').ZodString,
                            import('better-auth').ZodRecord<
                              import('better-auth').ZodString,
                              import('better-auth').ZodType<
                                import('@ai-sdk/provider').JSONValue,
                                unknown,
                                import('better-auth').$ZodTypeInternals<
                                  import('@ai-sdk/provider').JSONValue,
                                  unknown
                                >
                              >
                            >
                          >
                        >
                      },
                      import('better-auth').$strip
                    >,
                    import('better-auth').ZodObject<
                      {
                        type: import('better-auth').ZodLiteral<'source-url'>
                        sourceId: import('better-auth').ZodString
                        url: import('better-auth').ZodString
                        title: import('better-auth').ZodOptional<import('better-auth').ZodString>
                        providerMetadata: import('better-auth').ZodOptional<
                          import('better-auth').ZodRecord<
                            import('better-auth').ZodString,
                            import('better-auth').ZodRecord<
                              import('better-auth').ZodString,
                              import('better-auth').ZodType<
                                import('@ai-sdk/provider').JSONValue,
                                unknown,
                                import('better-auth').$ZodTypeInternals<
                                  import('@ai-sdk/provider').JSONValue,
                                  unknown
                                >
                              >
                            >
                          >
                        >
                      },
                      import('better-auth').$strip
                    >,
                    import('better-auth').ZodObject<
                      {
                        type: import('better-auth').ZodLiteral<'source-document'>
                        sourceId: import('better-auth').ZodString
                        mediaType: import('better-auth').ZodString
                        title: import('better-auth').ZodString
                        filename: import('better-auth').ZodOptional<import('better-auth').ZodString>
                        providerMetadata: import('better-auth').ZodOptional<
                          import('better-auth').ZodRecord<
                            import('better-auth').ZodString,
                            import('better-auth').ZodRecord<
                              import('better-auth').ZodString,
                              import('better-auth').ZodType<
                                import('@ai-sdk/provider').JSONValue,
                                unknown,
                                import('better-auth').$ZodTypeInternals<
                                  import('@ai-sdk/provider').JSONValue,
                                  unknown
                                >
                              >
                            >
                          >
                        >
                      },
                      import('better-auth').$strip
                    >,
                    import('better-auth').ZodObject<
                      {
                        type: import('better-auth').ZodLiteral<'file'>
                        mediaType: import('better-auth').ZodString
                        filename: import('better-auth').ZodOptional<import('better-auth').ZodString>
                        url: import('better-auth').ZodString
                      },
                      import('better-auth').$strip
                    >,
                    import('better-auth').ZodObject<
                      {
                        type: import('better-auth').ZodLiteral<'step-start'>
                      },
                      import('better-auth').$strip
                    >,
                    import('better-auth').ZodObject<
                      {
                        type: import('better-auth').ZodTemplateLiteral<`data-${string}`>
                        id: import('better-auth').ZodOptional<import('better-auth').ZodString>
                        data: import('better-auth').ZodAny
                      },
                      import('better-auth').$strip
                    >,
                    import('better-auth').ZodIntersection<
                      import('better-auth').ZodObject<
                        {
                          type: import('better-auth').ZodTemplateLiteral<`tool-${string}`>
                          toolCallId: import('better-auth').ZodString
                        },
                        import('better-auth').$strip
                      >,
                      import('better-auth').ZodDiscriminatedUnion<
                        [
                          import('better-auth').ZodObject<
                            {
                              state: import('better-auth').ZodLiteral<'input-streaming'>
                              input: import('better-auth').ZodAny
                              providerExecuted: import('better-auth').ZodOptional<
                                import('better-auth').ZodBoolean
                              >
                            },
                            import('better-auth').$strip
                          >,
                          import('better-auth').ZodObject<
                            {
                              state: import('better-auth').ZodLiteral<'input-available'>
                              input: import('better-auth').ZodAny
                              providerExecuted: import('better-auth').ZodOptional<
                                import('better-auth').ZodBoolean
                              >
                            },
                            import('better-auth').$strip
                          >,
                          import('better-auth').ZodObject<
                            {
                              state: import('better-auth').ZodLiteral<'output-available'>
                              input: import('better-auth').ZodAny
                              output: import('better-auth').ZodAny
                              providerExecuted: import('better-auth').ZodOptional<
                                import('better-auth').ZodBoolean
                              >
                            },
                            import('better-auth').$strip
                          >,
                          import('better-auth').ZodObject<
                            {
                              state: import('better-auth').ZodLiteral<'output-error'>
                              input: import('better-auth').ZodAny
                              errorText: import('better-auth').ZodString
                              providerExecuted: import('better-auth').ZodOptional<
                                import('better-auth').ZodBoolean
                              >
                            },
                            import('better-auth').$strip
                          >,
                        ]
                      >
                    >,
                    import('better-auth').ZodIntersection<
                      import('better-auth').ZodObject<
                        {
                          type: import('better-auth').ZodLiteral<'dynamic-tool'>
                          toolName: import('better-auth').ZodString
                          toolCallId: import('better-auth').ZodString
                        },
                        import('better-auth').$strip
                      >,
                      import('better-auth').ZodDiscriminatedUnion<
                        [
                          import('better-auth').ZodObject<
                            {
                              state: import('better-auth').ZodLiteral<'input-streaming'>
                              input: import('better-auth').ZodUnion<
                                [
                                  import('better-auth').ZodUnknown,
                                  import('better-auth').ZodUndefined,
                                ]
                              >
                            },
                            import('better-auth').$strip
                          >,
                          import('better-auth').ZodObject<
                            {
                              state: import('better-auth').ZodLiteral<'input-available'>
                              input: import('better-auth').ZodUnknown
                              callProviderMetadata: import('better-auth').ZodOptional<
                                import('better-auth').ZodRecord<
                                  import('better-auth').ZodString,
                                  import('better-auth').ZodRecord<
                                    import('better-auth').ZodString,
                                    import('better-auth').ZodType<
                                      import('@ai-sdk/provider').JSONValue,
                                      unknown,
                                      import('better-auth').$ZodTypeInternals<
                                        import('@ai-sdk/provider').JSONValue,
                                        unknown
                                      >
                                    >
                                  >
                                >
                              >
                            },
                            import('better-auth').$strip
                          >,
                          import('better-auth').ZodObject<
                            {
                              state: import('better-auth').ZodLiteral<'output-available'>
                              input: import('better-auth').ZodUnknown
                              output: import('better-auth').ZodUnknown
                              callProviderMetadata: import('better-auth').ZodOptional<
                                import('better-auth').ZodRecord<
                                  import('better-auth').ZodString,
                                  import('better-auth').ZodRecord<
                                    import('better-auth').ZodString,
                                    import('better-auth').ZodType<
                                      import('@ai-sdk/provider').JSONValue,
                                      unknown,
                                      import('better-auth').$ZodTypeInternals<
                                        import('@ai-sdk/provider').JSONValue,
                                        unknown
                                      >
                                    >
                                  >
                                >
                              >
                            },
                            import('better-auth').$strip
                          >,
                          import('better-auth').ZodObject<
                            {
                              state: import('better-auth').ZodLiteral<'output-error'>
                              input: import('better-auth').ZodUnknown
                              errorText: import('better-auth').ZodString
                              callProviderMetadata: import('better-auth').ZodOptional<
                                import('better-auth').ZodRecord<
                                  import('better-auth').ZodString,
                                  import('better-auth').ZodRecord<
                                    import('better-auth').ZodString,
                                    import('better-auth').ZodType<
                                      import('@ai-sdk/provider').JSONValue,
                                      unknown,
                                      import('better-auth').$ZodTypeInternals<
                                        import('@ai-sdk/provider').JSONValue,
                                        unknown
                                      >
                                    >
                                  >
                                >
                              >
                            },
                            import('better-auth').$strip
                          >,
                        ]
                      >
                    >,
                  ]
                >
              >
              metadata: import('better-auth').ZodOptional<import('better-auth').ZodAny>
            },
            import('better-auth').$strip
          >
          isRoot: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    update: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          content: import('better-auth').ZodOptional<
            import('better-auth').ZodObject<
              {
                parts: import('better-auth').ZodArray<
                  import('better-auth').ZodUnion<
                    readonly [
                      import('better-auth').ZodObject<
                        {
                          type: import('better-auth').ZodLiteral<'text'>
                          text: import('better-auth').ZodString
                          state: import('better-auth').ZodOptional<
                            import('better-auth').ZodUnion<
                              readonly [
                                import('better-auth').ZodLiteral<'streaming'>,
                                import('better-auth').ZodLiteral<'done'>,
                              ]
                            >
                          >
                        },
                        import('better-auth').$strip
                      >,
                      import('better-auth').ZodObject<
                        {
                          type: import('better-auth').ZodLiteral<'reasoning'>
                          text: import('better-auth').ZodString
                          state: import('better-auth').ZodOptional<
                            import('better-auth').ZodUnion<
                              readonly [
                                import('better-auth').ZodLiteral<'streaming'>,
                                import('better-auth').ZodLiteral<'done'>,
                              ]
                            >
                          >
                          providerMetadata: import('better-auth').ZodOptional<
                            import('better-auth').ZodRecord<
                              import('better-auth').ZodString,
                              import('better-auth').ZodRecord<
                                import('better-auth').ZodString,
                                import('better-auth').ZodType<
                                  import('@ai-sdk/provider').JSONValue,
                                  unknown,
                                  import('better-auth').$ZodTypeInternals<
                                    import('@ai-sdk/provider').JSONValue,
                                    unknown
                                  >
                                >
                              >
                            >
                          >
                        },
                        import('better-auth').$strip
                      >,
                      import('better-auth').ZodObject<
                        {
                          type: import('better-auth').ZodLiteral<'source-url'>
                          sourceId: import('better-auth').ZodString
                          url: import('better-auth').ZodString
                          title: import('better-auth').ZodOptional<import('better-auth').ZodString>
                          providerMetadata: import('better-auth').ZodOptional<
                            import('better-auth').ZodRecord<
                              import('better-auth').ZodString,
                              import('better-auth').ZodRecord<
                                import('better-auth').ZodString,
                                import('better-auth').ZodType<
                                  import('@ai-sdk/provider').JSONValue,
                                  unknown,
                                  import('better-auth').$ZodTypeInternals<
                                    import('@ai-sdk/provider').JSONValue,
                                    unknown
                                  >
                                >
                              >
                            >
                          >
                        },
                        import('better-auth').$strip
                      >,
                      import('better-auth').ZodObject<
                        {
                          type: import('better-auth').ZodLiteral<'source-document'>
                          sourceId: import('better-auth').ZodString
                          mediaType: import('better-auth').ZodString
                          title: import('better-auth').ZodString
                          filename: import('better-auth').ZodOptional<
                            import('better-auth').ZodString
                          >
                          providerMetadata: import('better-auth').ZodOptional<
                            import('better-auth').ZodRecord<
                              import('better-auth').ZodString,
                              import('better-auth').ZodRecord<
                                import('better-auth').ZodString,
                                import('better-auth').ZodType<
                                  import('@ai-sdk/provider').JSONValue,
                                  unknown,
                                  import('better-auth').$ZodTypeInternals<
                                    import('@ai-sdk/provider').JSONValue,
                                    unknown
                                  >
                                >
                              >
                            >
                          >
                        },
                        import('better-auth').$strip
                      >,
                      import('better-auth').ZodObject<
                        {
                          type: import('better-auth').ZodLiteral<'file'>
                          mediaType: import('better-auth').ZodString
                          filename: import('better-auth').ZodOptional<
                            import('better-auth').ZodString
                          >
                          url: import('better-auth').ZodString
                        },
                        import('better-auth').$strip
                      >,
                      import('better-auth').ZodObject<
                        {
                          type: import('better-auth').ZodLiteral<'step-start'>
                        },
                        import('better-auth').$strip
                      >,
                      import('better-auth').ZodObject<
                        {
                          type: import('better-auth').ZodTemplateLiteral<`data-${string}`>
                          id: import('better-auth').ZodOptional<import('better-auth').ZodString>
                          data: import('better-auth').ZodAny
                        },
                        import('better-auth').$strip
                      >,
                      import('better-auth').ZodIntersection<
                        import('better-auth').ZodObject<
                          {
                            type: import('better-auth').ZodTemplateLiteral<`tool-${string}`>
                            toolCallId: import('better-auth').ZodString
                          },
                          import('better-auth').$strip
                        >,
                        import('better-auth').ZodDiscriminatedUnion<
                          [
                            import('better-auth').ZodObject<
                              {
                                state: import('better-auth').ZodLiteral<'input-streaming'>
                                input: import('better-auth').ZodAny
                                providerExecuted: import('better-auth').ZodOptional<
                                  import('better-auth').ZodBoolean
                                >
                              },
                              import('better-auth').$strip
                            >,
                            import('better-auth').ZodObject<
                              {
                                state: import('better-auth').ZodLiteral<'input-available'>
                                input: import('better-auth').ZodAny
                                providerExecuted: import('better-auth').ZodOptional<
                                  import('better-auth').ZodBoolean
                                >
                              },
                              import('better-auth').$strip
                            >,
                            import('better-auth').ZodObject<
                              {
                                state: import('better-auth').ZodLiteral<'output-available'>
                                input: import('better-auth').ZodAny
                                output: import('better-auth').ZodAny
                                providerExecuted: import('better-auth').ZodOptional<
                                  import('better-auth').ZodBoolean
                                >
                              },
                              import('better-auth').$strip
                            >,
                            import('better-auth').ZodObject<
                              {
                                state: import('better-auth').ZodLiteral<'output-error'>
                                input: import('better-auth').ZodAny
                                errorText: import('better-auth').ZodString
                                providerExecuted: import('better-auth').ZodOptional<
                                  import('better-auth').ZodBoolean
                                >
                              },
                              import('better-auth').$strip
                            >,
                          ]
                        >
                      >,
                      import('better-auth').ZodIntersection<
                        import('better-auth').ZodObject<
                          {
                            type: import('better-auth').ZodLiteral<'dynamic-tool'>
                            toolName: import('better-auth').ZodString
                            toolCallId: import('better-auth').ZodString
                          },
                          import('better-auth').$strip
                        >,
                        import('better-auth').ZodDiscriminatedUnion<
                          [
                            import('better-auth').ZodObject<
                              {
                                state: import('better-auth').ZodLiteral<'input-streaming'>
                                input: import('better-auth').ZodUnion<
                                  [
                                    import('better-auth').ZodUnknown,
                                    import('better-auth').ZodUndefined,
                                  ]
                                >
                              },
                              import('better-auth').$strip
                            >,
                            import('better-auth').ZodObject<
                              {
                                state: import('better-auth').ZodLiteral<'input-available'>
                                input: import('better-auth').ZodUnknown
                                callProviderMetadata: import('better-auth').ZodOptional<
                                  import('better-auth').ZodRecord<
                                    import('better-auth').ZodString,
                                    import('better-auth').ZodRecord<
                                      import('better-auth').ZodString,
                                      import('better-auth').ZodType<
                                        import('@ai-sdk/provider').JSONValue,
                                        unknown,
                                        import('better-auth').$ZodTypeInternals<
                                          import('@ai-sdk/provider').JSONValue,
                                          unknown
                                        >
                                      >
                                    >
                                  >
                                >
                              },
                              import('better-auth').$strip
                            >,
                            import('better-auth').ZodObject<
                              {
                                state: import('better-auth').ZodLiteral<'output-available'>
                                input: import('better-auth').ZodUnknown
                                output: import('better-auth').ZodUnknown
                                callProviderMetadata: import('better-auth').ZodOptional<
                                  import('better-auth').ZodRecord<
                                    import('better-auth').ZodString,
                                    import('better-auth').ZodRecord<
                                      import('better-auth').ZodString,
                                      import('better-auth').ZodType<
                                        import('@ai-sdk/provider').JSONValue,
                                        unknown,
                                        import('better-auth').$ZodTypeInternals<
                                          import('@ai-sdk/provider').JSONValue,
                                          unknown
                                        >
                                      >
                                    >
                                  >
                                >
                              },
                              import('better-auth').$strip
                            >,
                            import('better-auth').ZodObject<
                              {
                                state: import('better-auth').ZodLiteral<'output-error'>
                                input: import('better-auth').ZodUnknown
                                errorText: import('better-auth').ZodString
                                callProviderMetadata: import('better-auth').ZodOptional<
                                  import('better-auth').ZodRecord<
                                    import('better-auth').ZodString,
                                    import('better-auth').ZodRecord<
                                      import('better-auth').ZodString,
                                      import('better-auth').ZodType<
                                        import('@ai-sdk/provider').JSONValue,
                                        unknown,
                                        import('better-auth').$ZodTypeInternals<
                                          import('@ai-sdk/provider').JSONValue,
                                          unknown
                                        >
                                      >
                                    >
                                  >
                                >
                              },
                              import('better-auth').$strip
                            >,
                          ]
                        >
                      >,
                    ]
                  >
                >
                metadata: import('better-auth').ZodOptional<import('better-auth').ZodAny>
              },
              import('better-auth').$strip
            >
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    delete: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          deleteTrailing: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
          excludeSelf: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
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
        },
        {
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
      >,
      Record<never, never>,
      Record<never, never>
    >
    vote: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').AppUserContext
      >,
      import('better-auth').ZodObject<
        {
          chatId: import('better-auth').ZodString
          messageId: import('better-auth').ZodString
          isUpvoted: import('better-auth').ZodBoolean
        },
        {
          out: {}
          in: {}
        }
      >,
      import('@orpc/contract').Schema<
        {
          vote: {
            createdAt: Date
            updatedAt: Date
            chatId: string
            messageId: string
            isUpvoted: boolean
          }
        },
        {
          vote: {
            createdAt: Date
            updatedAt: Date
            chatId: string
            messageId: string
            isUpvoted: boolean
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  artifact: {
    listByChat: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          chatId: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          artifacts: {
            version: number
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            title: string
            chatId: string
            content: unknown
            kind: 'image' | 'code' | 'text' | 'sheet'
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        },
        {
          artifacts: {
            version: number
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            title: string
            chatId: string
            content: unknown
            kind: 'image' | 'code' | 'text' | 'sheet'
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listVersionsById: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          after: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
          before: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          versions: {
            version: number
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            title: string
            chatId: string
            content: unknown
            kind: 'image' | 'code' | 'text' | 'sheet'
          }[]
          hasMore: boolean
          first: number | undefined
          last: number | undefined
        },
        {
          versions: {
            version: number
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string
            title: string
            chatId: string
            content: unknown
            kind: 'image' | 'code' | 'text' | 'sheet'
          }[]
          hasMore: boolean
          first: number | undefined
          last: number | undefined
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    deleteVersionsByIdAfterVersion: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          id: import('better-auth').ZodString
          after: import('better-auth').ZodNumber
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    listSuggestions: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          artifactId: import('better-auth').ZodString
          artifactVersion: import('better-auth').ZodOptional<import('better-auth').ZodNumber>
          after: import('better-auth').ZodOptional<import('better-auth').ZodString>
          before: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          order: import('better-auth').ZodDefault<
            import('better-auth').ZodEnum<{
              asc: 'asc'
              desc: 'desc'
            }>
          >
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          suggestions: {
            id: string
            createdAt: Date
            updatedAt: Date
            description: string | null
            artifactId: string
            artifactVersion: number
            originalText: string
            suggestedText: string
            isResolved: boolean
          }[]
          hasMore: boolean
          first: string | undefined
          last: string | undefined
        },
        {
          suggestions: {
            id: string
            createdAt: Date
            updatedAt: Date
            description: string | null
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
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  credits: {
    getCredits: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodOptional<
        import('better-auth').ZodObject<
          {
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<
        {
          credits: {
            type: 'user' | 'organization'
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string | null
            metadata: CreditsMetadata
            organizationId: string | null
            credits: string
          }
        },
        {
          credits: {
            type: 'user' | 'organization'
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string | null
            metadata: CreditsMetadata
            organizationId: string | null
            credits: string
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listOrders: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          orderKinds: import('better-auth').ZodOptional<
            import('better-auth').ZodArray<
              import('better-auth').ZodEnum<{
                'stripe-payment': 'stripe-payment'
                'stripe-payment-intent': 'stripe-payment-intent'
                'stripe-subscription': 'stripe-subscription'
                'stripe-invoice': 'stripe-invoice'
              }>
            >
          >
          statuses: import('better-auth').ZodOptional<
            import('better-auth').ZodArray<import('better-auth').ZodString>
          >
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          cursor: import('better-auth').ZodOptional<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          orders: {
            status:
              | import('stripe').Stripe.Checkout.Session.Status
              | import('stripe').Stripe.Invoice.Status
            object:
              | import('stripe').Stripe.Checkout.Session
              | import('stripe').Stripe.PaymentIntent
              | import('stripe').Stripe.Invoice
            type: 'user' | 'organization'
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string | null
            organizationId: string | null
            kind:
              | 'stripe-payment'
              | 'stripe-payment-intent'
              | 'stripe-subscription'
              | 'stripe-invoice'
            objectId: string
          }[]
          hasMore: boolean
          cursor: string | undefined
        },
        {
          orders: {
            status:
              | import('stripe').Stripe.Checkout.Session.Status
              | import('stripe').Stripe.Invoice.Status
            object:
              | import('stripe').Stripe.Checkout.Session
              | import('stripe').Stripe.PaymentIntent
              | import('stripe').Stripe.Invoice
            type: 'user' | 'organization'
            id: string
            createdAt: Date
            updatedAt: Date
            userId: string | null
            organizationId: string | null
            kind:
              | 'stripe-payment'
              | 'stripe-payment-intent'
              | 'stripe-subscription'
              | 'stripe-invoice'
            objectId: string
          }[]
          hasMore: boolean
          cursor: string | undefined
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    cancelOrder: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          orderId: import('better-auth').ZodString
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    createOnetimeCheckout: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          credits: import('better-auth').ZodInt
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          sessionClientSecret: string
          sessionId: string
        },
        {
          sessionClientSecret: string
          sessionId: string
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listSubscriptions: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodOptional<
        import('better-auth').ZodObject<
          {
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<
        {
          subscriptions: import('stripe').Stripe.Subscription[]
        },
        {
          subscriptions: import('stripe').Stripe.Subscription[]
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    createAutoRechargeInvoice: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodOptional<
        import('better-auth').ZodObject<
          {
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    createAutoRechargePayment: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodOptional<
        import('better-auth').ZodObject<
          {
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    updateAutoRechargeSettings: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          enabled: import('better-auth').ZodOptional<import('better-auth').ZodBoolean>
          threshold: import('better-auth').ZodOptional<import('better-auth').ZodInt>
          amount: import('better-auth').ZodOptional<import('better-auth').ZodInt>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
  }
  expense: {
    list: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          expenseKinds: import('better-auth').ZodOptional<
            import('better-auth').ZodArray<
              import('better-auth').ZodEnum<{
                generation: 'generation'
              }>
            >
          >
          appId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          cursor: import('better-auth').ZodOptional<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          expenses: {
            type: 'user' | 'organization'
            id: string
            createdAt: Date
            userId: string
            organizationId: string | null
            appId: string | null
            kind: 'generation'
            cost: string | null
            details: GenerationDetails
          }[]
          hasMore: boolean
          cursor: string | undefined
        },
        {
          expenses: {
            type: 'user' | 'organization'
            id: string
            createdAt: Date
            userId: string
            organizationId: string | null
            appId: string | null
            kind: 'generation'
            cost: string | null
            details: GenerationDetails
          }[]
          hasMore: boolean
          cursor: string | undefined
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  stripe: {
    getCustomer: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodOptional<
        import('better-auth').ZodObject<
          {
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<
        {
          customer: import('stripe').Stripe.Customer & {
            lastResponse: {
              headers: {
                [key: string]: string
              }
              requestId: string
              statusCode: number
              apiVersion?: string
              idempotencyKey?: string
              stripeAccount?: string
            }
          }
        },
        {
          customer: import('stripe').Stripe.Customer & {
            lastResponse: {
              headers: {
                [key: string]: string
              }
              requestId: string
              statusCode: number
              apiVersion?: string
              idempotencyKey?: string
              stripeAccount?: string
            }
          }
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listPaymentMethods: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodOptional<
        import('better-auth').ZodObject<
          {
            organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          },
          import('better-auth').$strip
        >
      >,
      import('@orpc/contract').Schema<
        {
          paymentMethods: import('stripe').Stripe.PaymentMethod[]
        },
        {
          paymentMethods: import('stripe').Stripe.PaymentMethod[]
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    addPaymentMethod: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          setupIntentClientSecret: string
          setupIntentId: string
        },
        {
          setupIntentClientSecret: string
          setupIntentId: string
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    removePaymentMethod: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          paymentMethodId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    updateDefaultPaymentMethod: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          paymentMethodId: import('better-auth').ZodString
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
    createCustomerSession: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('../orpc').UserContext
      >,
      import('better-auth').ZodObject<
        {
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          customerSession: import('stripe').Stripe.Response<import('stripe').Stripe.CustomerSession>
        },
        {
          customerSession: import('stripe').Stripe.Response<import('stripe').Stripe.CustomerSession>
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
  }
  telemetry: {
    listTraces: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          userId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          workspaceId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          appId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          sessionId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          fromTimestamp: import('better-auth').ZodOptional<import('better-auth').ZodISODateTime>
          toTimestamp: import('better-auth').ZodOptional<import('better-auth').ZodISODateTime>
          cursor: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          traces: import('@langfuse/core').TraceWithDetails[]
          hasMore: boolean
          cursor: number
          total: number
        },
        {
          traces: import('@langfuse/core').TraceWithDetails[]
          hasMore: boolean
          cursor: number
          total: number
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    listObservations: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          userId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          workspaceId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          appId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          traceId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          type: import('better-auth').ZodOptional<import('better-auth').ZodString>
          level: import('better-auth').ZodOptional<
            import('better-auth').ZodEnum<{
              DEBUG: 'DEBUG'
              DEFAULT: 'DEFAULT'
              WARNING: 'WARNING'
              ERROR: 'ERROR'
            }>
          >
          parentObservationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          fromStartTime: import('better-auth').ZodOptional<import('better-auth').ZodISODateTime>
          toStartTime: import('better-auth').ZodOptional<import('better-auth').ZodISODateTime>
          cursor: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
          limit: import('better-auth').ZodDefault<import('better-auth').ZodNumber>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<
        {
          observations: import('@langfuse/core').ObservationsView[]
          hasMore: boolean
          cursor: number
          total: number
        },
        {
          observations: import('@langfuse/core').ObservationsView[]
          hasMore: boolean
          cursor: number
          total: number
        }
      >,
      Record<never, never>,
      Record<never, never>
    >
    deleteTraces: import('@orpc/server').DecoratedProcedure<
      import('@orpc/server').MergedInitialContext<
        import('@orpc/server').MergedInitialContext<
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').BaseContext & {
            auth: import('../auth').Auth
          } & Record<never, never>,
          import('../orpc').Context
        >,
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        import('@orpc/server').MergedCurrentContext<import('../orpc').Context, Record<never, never>>
      >,
      import('@orpc/server').MergedCurrentContext<
        import('@orpc/server').MergedCurrentContext<
          import('../orpc').Context,
          Record<never, never>
        >,
        Record<never, never>
      >,
      import('better-auth').ZodObject<
        {
          userId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          organizationId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          workspaceId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          appId: import('better-auth').ZodOptional<import('better-auth').ZodString>
          traceIds: import('better-auth').ZodArray<import('better-auth').ZodString>
        },
        import('better-auth').$strip
      >,
      import('@orpc/contract').Schema<void, void>,
      Record<never, never>,
      Record<never, never>
    >
  }
}
export type CaredOrpcRouter = typeof appRouter
