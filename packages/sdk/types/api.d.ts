export interface UserInfo {
  [key: string]: unknown
}

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

export type Category = InferSelectModel<typeof Category>

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

  [key: string]: unknown
}

export declare const appRouter: import("@trpc/server/unstable-core-do-not-import").BuiltRouter<{
    ctx: any;
    meta: import("trpc-to-openapi").OpenApiMeta;
    errorShape: import("@trpc/server/unstable-core-do-not-import").DefaultErrorShape;
    transformer: true;
}, import("@trpc/server/unstable-core-do-not-import").DecorateCreateRouterOptions<{
    admin: {
        mock: import("@trpc/server").TRPCMutationProcedure<{
            input: void;
            output: void;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                apps: {
                    app: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        metadata: AppMetadata;
                        type: "single-agent" | "multiple-agents";
                        workspaceId: string;
                    };
                    categories: Omit<Category, "createdAt" | "updatedAt">[];
                    tags: string[];
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        listByCategory: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                categoryId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                apps: {
                    app: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        metadata: AppMetadata;
                        type: "single-agent" | "multiple-agents";
                        workspaceId: string;
                    };
                    categories: Omit<Category, "createdAt" | "updatedAt">[];
                    tags: string[];
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        listByTags: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                tags: string[];
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                apps: {
                    app: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        metadata: AppMetadata;
                        type: "single-agent" | "multiple-agents";
                        workspaceId: string;
                    };
                    categories: Omit<Category, "createdAt" | "updatedAt">[];
                    tags: string[];
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        listVersions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                after?: number | undefined;
                before?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                versions: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AppMetadata;
                    type: "single-agent" | "multiple-agents";
                    appId: string;
                    version: number;
                }[];
                hasMore: boolean;
                first: number | undefined;
                last: number | undefined;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                app: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AppMetadata;
                    type: "single-agent" | "multiple-agents";
                    workspaceId: string;
                };
            };
        }>;
        createCategory: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
            };
            output: {
                category: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
            };
        }>;
        updateCategory: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                name: string;
            };
            output: {
                category: {
                    createdAt: Date;
                    updatedAt: Date;
                    id: string;
                    name: string;
                } | undefined;
            };
        }>;
        deleteCategory: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: void;
        }>;
        deleteTags: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                tags: string[];
            };
            output: void;
        }>;
        listWorkspaces: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                workspaces: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        getWorkspace: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                workspace: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            };
        }>;
        listMembers: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                members: {
                    user: {
                        email: string;
                        id: string;
                        name: string;
                        image: string | null;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        twoFactorEnabled: boolean | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        normalizedEmail: string | null;
                    };
                    role: "member" | "owner";
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        getMember: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: string;
                workspaceId: string;
            };
            output: {
                user: {
                    email: string;
                    id: string;
                    name: string;
                    image: string | null;
                    emailVerified: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    twoFactorEnabled: boolean | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    normalizedEmail: string | null;
                };
                role: "member" | "owner";
            };
        }>;
        listUsers: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                after?: string | undefined;
                search?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                users: {
                    email: string;
                    id: string;
                    name: string;
                    image: string | null;
                    emailVerified: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    twoFactorEnabled: boolean | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    normalizedEmail: string | null;
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        getUser: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                user: {
                    email: string;
                    id: string;
                    name: string;
                    image: string | null;
                    emailVerified: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    twoFactorEnabled: boolean | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    normalizedEmail: string | null;
                };
            };
        }>;
        deleteUser: import("@trpc/server").TRPCMutationProcedure<{
            input: string;
            output: void;
        }>;
    };
    workspace: {
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            } | undefined;
            output: {
                workspaces: {
                    workspace: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                    role: "member" | "owner";
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                workspace: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
                role: "member" | "owner";
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
            };
            output: {
                workspace: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
                role: "owner";
            };
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                name: string;
            };
            output: {
                workspace: {
                    createdAt: Date;
                    updatedAt: Date;
                    id: string;
                    name: string;
                };
                role: "owner";
            };
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: void;
        }>;
        listMembers: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                members: {
                    user: {
                        email: string;
                        id: string;
                        name: string;
                        image: string | null;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        twoFactorEnabled: boolean | null;
                        role: string | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                        normalizedEmail: string | null;
                    };
                    role: "member" | "owner";
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        getMember: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: string;
                workspaceId: string;
            };
            output: {
                user: {
                    email: string;
                    id: string;
                    name: string;
                    image: string | null;
                    emailVerified: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    twoFactorEnabled: boolean | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    normalizedEmail: string | null;
                };
                role: "member" | "owner";
            };
        }>;
        addMember: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                workspaceId: string;
                role?: "member" | "owner" | undefined;
            };
            output: {
                user: {
                    email: string;
                    id: string;
                    name: string;
                    image: string | null;
                    emailVerified: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    twoFactorEnabled: boolean | null;
                    role: string | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                    normalizedEmail: string | null;
                };
                role: "member" | "owner";
            };
        }>;
        deleteMember: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                workspaceId: string;
            };
            output: void;
        }>;
        transferOwner: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                workspaceId: string;
            };
            output: void;
        }>;
    };
    user: {
        me: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    emailVerified: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    image?: string | null | undefined | undefined;
                    twoFactorEnabled: boolean | null | undefined;
                    banned: boolean | null | undefined;
                    role?: string | null | undefined;
                    banReason?: string | null | undefined;
                    banExpires?: Date | null | undefined;
                };
            };
        }>;
        accounts: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                accounts: {
                    scope: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    password: string | null;
                    userId: string;
                    providerId: string;
                    accessToken: string | null;
                    refreshToken: string | null;
                    accessTokenExpiresAt: Date | null;
                    refreshTokenExpiresAt: Date | null;
                    accountId: string;
                    idToken: string | null;
                    profile: string | null;
                }[];
            };
        }>;
        session: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                    emailVerified: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    image?: string | null | undefined | undefined;
                    twoFactorEnabled: boolean | null | undefined;
                    banned: boolean | null | undefined;
                    role?: string | null | undefined;
                    banReason?: string | null | undefined;
                    banExpires?: Date | null | undefined;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined | undefined;
                    userAgent?: string | null | undefined | undefined;
                    geolocation: string;
                    impersonatedBy?: string | null | undefined;
                    activeOrganizationId?: string | null | undefined;
                };
            };
        }>;
        sessions: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                sessions: {
                    geolocation: {
                        city?: string;
                        region?: string;
                        country?: string;
                    } | undefined;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined | undefined;
                    userAgent?: string | null | undefined | undefined;
                    impersonatedBy?: string | null | undefined;
                    activeOrganizationId?: string | null | undefined;
                }[];
            };
        }>;
    };
    secret: {
        hasProviderKey: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                providerId: ProviderId;
                workspaceId?: string | undefined;
            };
            output: {
                exists: boolean;
            };
        }>;
        getProviderKey: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                providerId: ProviderId;
                workspaceId?: string | undefined;
            };
            output: {
                apiKeyStart: string;
            };
        }>;
        setProviderKey: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                providerId: ProviderId;
                apiKey: string;
                workspaceId?: string | undefined;
            };
            output: void;
        }>;
        deleteProviderKey: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                providerId: ProviderId;
                workspaceId?: string | undefined;
            };
            output: void;
        }>;
    };
    app: {
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                apps: {
                    app: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        metadata: AppMetadata;
                        type: "single-agent" | "multiple-agents";
                        workspaceId: string;
                    };
                    categories: Omit<Category, "createdAt" | "updatedAt">[];
                    tags: string[];
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        listByCategory: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                categoryId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                apps: {
                    app: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        metadata: AppMetadata;
                        type: "single-agent" | "multiple-agents";
                        workspaceId: string;
                    };
                    categories: Omit<Category, "createdAt" | "updatedAt">[];
                    tags: string[];
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        listByTags: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                tags: string[];
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                apps: {
                    app: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        metadata: AppMetadata;
                        type: "single-agent" | "multiple-agents";
                        workspaceId: string;
                    };
                    categories: Omit<Category, "createdAt" | "updatedAt">[];
                    tags: string[];
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        listVersions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                after?: number | undefined;
                before?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                versions: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AppMetadata;
                    type: "single-agent" | "multiple-agents";
                    appId: string;
                    version: number;
                }[];
                hasMore: boolean;
                first: number | undefined;
                last: number | undefined;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                app: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AppMetadata;
                    type: "single-agent" | "multiple-agents";
                    workspaceId: string;
                };
            };
        }>;
        getVersion: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                version: number;
            };
            output: {
                version: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AppMetadata;
                    type: "single-agent" | "multiple-agents";
                    appId: string;
                    version: number;
                };
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                metadata: {
                    clientId?: string | undefined;
                    description?: string | undefined;
                    imageUrl?: string | undefined;
                    languageModel?: string | undefined;
                    embeddingModel?: string | undefined;
                    rerankModel?: string | undefined;
                    imageModel?: string | undefined;
                    languageModelSettings?: {
                        systemPrompt?: string | undefined;
                    } | undefined;
                    datasetBindings?: string[] | undefined;
                } & {
                    [k: string]: unknown;
                };
                workspaceId: string;
                type?: "single-agent" | "multiple-agents" | undefined;
            };
            output: {
                app: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AppMetadata;
                    type: "single-agent" | "multiple-agents";
                    workspaceId: string;
                };
                draft: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AppMetadata;
                    type: "single-agent" | "multiple-agents";
                    appId: string;
                    version: number;
                };
            };
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                name?: string | undefined;
                metadata?: import("zod").objectInputType<{
                    description: import("zod").ZodOptional<import("zod").ZodString>;
                    imageUrl: import("zod").ZodOptional<import("zod").ZodString>;
                    clientId: import("zod").ZodOptional<import("zod").ZodString>;
                    languageModel: import("zod").ZodOptional<import("zod").ZodString>;
                    embeddingModel: import("zod").ZodOptional<import("zod").ZodString>;
                    rerankModel: import("zod").ZodOptional<import("zod").ZodString>;
                    imageModel: import("zod").ZodOptional<import("zod").ZodString>;
                    languageModelSettings: import("zod").ZodOptional<import("zod").ZodObject<{
                        systemPrompt: import("zod").ZodOptional<import("zod").ZodString>;
                    }, "strip", import("zod").ZodTypeAny, {
                        systemPrompt?: string | undefined;
                    }, {
                        systemPrompt?: string | undefined;
                    }>>;
                    datasetBindings: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
                }, import("zod").ZodUnknown, "strip"> | undefined;
            };
            output: {
                app: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AppMetadata;
                    type: "single-agent" | "multiple-agents";
                    workspaceId: string;
                };
                draft: {
                    createdAt: Date;
                    updatedAt: Date;
                    appId: string;
                    version: number;
                    type: "single-agent" | "multiple-agents";
                    name: string;
                    metadata: AppMetadata;
                };
            };
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: boolean;
            };
        }>;
        publish: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                app: {
                    createdAt: Date;
                    updatedAt: Date;
                    id: string;
                    workspaceId: string;
                    type: "single-agent" | "multiple-agents";
                    name: string;
                    metadata: AppMetadata;
                } | undefined;
                version: number;
            };
        }>;
        listTags: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            } | undefined;
            output: {
                tags: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        updateTags: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                tags: string[];
            };
            output: {
                tags: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
            };
        }>;
        listCategories: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            } | undefined;
            output: {
                categories: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        updateCategories: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                add?: string[] | undefined;
                remove?: string[] | undefined;
            };
            output: {
                categories: {
                    id: string;
                    name: string;
                }[];
            };
        }>;
    };
    apiKey: {
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId?: string | undefined;
            };
            output: {
                keys: {
                    appId: any;
                    start: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
            };
        }>;
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                appId: string;
            };
            output: {
                key: {
                    appId: string;
                    start: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                appId: string;
            };
            output: {
                key: {
                    appId: string;
                    key: string;
                    start: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            };
        }>;
        rotate: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                appId: string;
            };
            output: {
                key: {
                    appId: string;
                    key: string;
                    start: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            };
        }>;
        verify: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                key: string;
                appId: string;
            };
            output: {
                isValid: boolean;
            };
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                appId: string;
            };
            output: void;
        }>;
    };
    oauthApp: {
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId?: string | undefined;
                appId?: string | undefined;
            };
            output: {
                oauthApps: {
                    appId: string;
                    oauthApp: {
                        redirectUris: string[];
                        disabled: boolean | null;
                        metadata: any;
                        createdAt: Date | null;
                        updatedAt: Date | null;
                        clientSecretStart?: string | undefined;
                        clientSecret?: string | null | undefined;
                        clientId: string | null;
                    };
                }[];
            };
        }>;
        has: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                appId: string;
            };
            output: {
                exists: boolean;
            };
        }>;
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                appId: string;
            };
            output: {
                oauthApp: {
                    redirectUris: string[];
                    disabled: boolean | null;
                    metadata: any;
                    createdAt: Date | null;
                    updatedAt: Date | null;
                    clientSecretStart?: string | undefined;
                    clientSecret?: string | null | undefined;
                    clientId: string | null;
                };
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                appId: string;
                redirectUris?: string[] | undefined;
            };
            output: {
                oauthApp: {
                    redirectUris: string[];
                    disabled: boolean | null;
                    metadata: any;
                    createdAt: Date | null;
                    updatedAt: Date | null;
                    clientSecretStart?: string | undefined;
                    clientSecret?: string | null | undefined;
                    clientId: string | null;
                };
            };
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                appId: string;
                disabled?: boolean | undefined;
                redirectUris?: string[] | undefined;
            };
            output: {
                oauthApp: {
                    redirectUris: string[];
                    disabled: boolean | null;
                    metadata: any;
                    createdAt: Date | null;
                    updatedAt: Date | null;
                    clientSecretStart?: string | undefined;
                    clientSecret?: string | null | undefined;
                    clientId: string | null;
                };
            };
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                appId: string;
            };
            output: void;
        }>;
        rotateSecret: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                appId: string;
            };
            output: {
                oauthApp: {
                    redirectUris: string[];
                    disabled: boolean | null;
                    metadata: any;
                    createdAt: Date | null;
                    updatedAt: Date | null;
                    clientSecretStart?: string | undefined;
                    clientSecret?: string | null | undefined;
                    clientId: string | null;
                };
            };
        }>;
    };
    agent: {
        listByApp: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                appId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                agents: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AgentMetadata;
                    appId: string;
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        listByAppVersion: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                appId: string;
                version: number;
            };
            output: {
                versions: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AgentMetadata;
                    agentId: string;
                    version: number;
                }[];
            };
        }>;
        listVersions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                agentId: string;
                after?: number | undefined;
                before?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                versions: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AgentMetadata;
                    agentId: string;
                    version: number;
                }[];
                hasMore: boolean;
                first: number | undefined;
                last: number | undefined;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                agent: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AgentMetadata;
                    appId: string;
                };
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                appId: string;
                metadata?: import("zod").objectInputType<{
                    description: import("zod").ZodOptional<import("zod").ZodString>;
                    imageUrl: import("zod").ZodOptional<import("zod").ZodString>;
                    languageModel: import("zod").ZodOptional<import("zod").ZodString>;
                    embeddingModel: import("zod").ZodOptional<import("zod").ZodString>;
                    rerankModel: import("zod").ZodOptional<import("zod").ZodString>;
                    imageModel: import("zod").ZodOptional<import("zod").ZodString>;
                    languageModelSettings: import("zod").ZodOptional<import("zod").ZodObject<{
                        systemPrompt: import("zod").ZodOptional<import("zod").ZodString>;
                    }, "strip", import("zod").ZodTypeAny, {
                        systemPrompt?: string | undefined;
                    }, {
                        systemPrompt?: string | undefined;
                    }>>;
                    datasetBindings: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
                }, import("zod").ZodUnknown, "strip"> | undefined;
            };
            output: {
                agent: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AgentMetadata;
                    appId: string;
                };
                draft: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AgentMetadata;
                    agentId: string;
                    version: number;
                };
            };
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                name?: string | undefined;
                metadata?: import("zod").objectInputType<{
                    description: import("zod").ZodOptional<import("zod").ZodString>;
                    imageUrl: import("zod").ZodOptional<import("zod").ZodString>;
                    languageModel: import("zod").ZodOptional<import("zod").ZodString>;
                    embeddingModel: import("zod").ZodOptional<import("zod").ZodString>;
                    rerankModel: import("zod").ZodOptional<import("zod").ZodString>;
                    imageModel: import("zod").ZodOptional<import("zod").ZodString>;
                    languageModelSettings: import("zod").ZodOptional<import("zod").ZodObject<{
                        systemPrompt: import("zod").ZodOptional<import("zod").ZodString>;
                    }, "strip", import("zod").ZodTypeAny, {
                        systemPrompt?: string | undefined;
                    }, {
                        systemPrompt?: string | undefined;
                    }>>;
                    datasetBindings: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
                }, import("zod").ZodUnknown, "strip"> | undefined;
            };
            output: {
                agent: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AgentMetadata;
                    appId: string;
                };
                draft: {
                    createdAt: Date;
                    updatedAt: Date;
                    agentId: string;
                    version: number;
                    name: string;
                    metadata: AgentMetadata;
                };
            };
        }>;
    };
    dataset: {
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                datasets: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: DatasetMetadata;
                    workspaceId: string;
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                dataset: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: DatasetMetadata;
                    workspaceId: string;
                };
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                metadata: {
                    languageModel?: string | undefined;
                    embeddingModel?: string | undefined;
                    rerankModel?: string | undefined;
                    retrievalMode?: "vector-search" | "full-text-search" | "hybrid-search" | undefined;
                    topK?: number | undefined;
                    scoreThreshold?: number | undefined;
                    stats?: {
                        totalSizeBytes?: number | undefined;
                    } | undefined;
                };
                workspaceId: string;
            };
            output: {
                dataset: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: DatasetMetadata;
                    workspaceId: string;
                };
            };
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                name?: string | undefined;
                metadata?: {
                    languageModel?: string | undefined;
                    embeddingModel?: string | undefined;
                    rerankModel?: string | undefined;
                    retrievalMode?: "vector-search" | "full-text-search" | "hybrid-search" | undefined;
                    topK?: number | undefined;
                    scoreThreshold?: number | undefined;
                    stats?: {
                        totalSizeBytes?: number | undefined;
                    } | undefined;
                } | undefined;
            };
            output: {
                dataset: {
                    createdAt: Date;
                    updatedAt: Date;
                    id: string;
                    workspaceId: string;
                    name: string;
                    metadata: DatasetMetadata;
                };
            };
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: string;
            output: void;
        }>;
        createDocument: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                workspaceId: string;
                datasetId: string;
                metadata?: {
                    url?: string | undefined;
                    processed?: boolean | undefined;
                    taskId?: string | undefined;
                } | undefined;
            };
            output: {
                document: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: DocumentMetadata;
                    workspaceId: string;
                    datasetId: string;
                };
            };
        }>;
        updateDocument: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                name?: string | undefined;
                metadata?: {
                    url?: string | undefined;
                    processed?: boolean | undefined;
                    taskId?: string | undefined;
                } | undefined;
            };
            output: {
                document: {
                    createdAt: Date;
                    updatedAt: Date;
                    id: string;
                    workspaceId: string;
                    datasetId: string;
                    name: string;
                    metadata: DocumentMetadata;
                };
            };
        }>;
        deleteDocument: import("@trpc/server").TRPCMutationProcedure<{
            input: string;
            output: void;
        }>;
        listDocuments: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                datasetId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                documents: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: DocumentMetadata;
                    workspaceId: string;
                    datasetId: string;
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        getDocument: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                document: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: DocumentMetadata;
                    workspaceId: string;
                    datasetId: string;
                };
            };
        }>;
        createSegment: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                workspaceId: string;
                content: string;
                datasetId: string;
                documentId: string;
                index: number;
                metadata?: Record<string, unknown> | undefined;
            };
            output: {
                segment: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: unknown;
                    workspaceId: string;
                    content: string;
                    datasetId: string;
                    documentId: string;
                    index: number;
                };
            };
        }>;
        updateSegment: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                metadata?: Record<string, unknown> | undefined;
                content?: string | undefined;
            };
            output: {
                segment: {
                    createdAt: Date;
                    updatedAt: Date;
                    id: string;
                    workspaceId: string;
                    datasetId: string;
                    documentId: string;
                    index: number;
                    content: string;
                    metadata: unknown;
                };
            };
        }>;
        deleteSegment: import("@trpc/server").TRPCMutationProcedure<{
            input: string;
            output: {
                success: boolean;
            };
        }>;
        listSegments: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                documentId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                segments: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: unknown;
                    workspaceId: string;
                    content: string;
                    datasetId: string;
                    documentId: string;
                    index: number;
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        createChunk: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                workspaceId: string;
                content: string;
                datasetId: string;
                documentId: string;
                index: number;
                segmentId: string;
                metadata?: Record<string, unknown> | undefined;
            };
            output: {
                chunk: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: unknown;
                    workspaceId: string;
                    content: string;
                    datasetId: string;
                    documentId: string;
                    index: number;
                    segmentId: string;
                };
            };
        }>;
        updateChunk: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                metadata?: Record<string, unknown> | undefined;
                content?: string | undefined;
            };
            output: {
                chunk: {
                    createdAt: Date;
                    updatedAt: Date;
                    id: string;
                    workspaceId: string;
                    datasetId: string;
                    documentId: string;
                    segmentId: string;
                    index: number;
                    content: string;
                    metadata: unknown;
                };
            };
        }>;
        deleteChunk: import("@trpc/server").TRPCMutationProcedure<{
            input: string;
            output: {
                success: boolean;
            };
        }>;
        listChunks: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                segmentId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                chunks: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: unknown;
                    workspaceId: string;
                    content: string;
                    datasetId: string;
                    documentId: string;
                    index: number;
                    segmentId: string;
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
    };
    model: {
        listDefaultModels: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                defaultModels: {
                    app: {
                        languageModel: string;
                        embeddingModel: string;
                        rerankModel: string;
                        imageModel: string;
                    };
                    dataset: {
                        languageModel: string;
                        embeddingModel: string;
                        rerankModel: string;
                    };
                };
            };
        }>;
        listProviders: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                providers: {
                    id: ProviderId;
                    name: string;
                    description: string;
                    icon: string;
                }[];
            };
        }>;
        listProvidersModels: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                type?: "image" | "language" | "text-embedding" | undefined;
            } | undefined;
            output: {
                models: Record<string, {
                    id: string;
                    name: string;
                    description?: string;
                    icon?: string;
                    models: any[];
                }[]>;
            };
        }>;
        listModels: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                type?: "image" | "language" | "text-embedding" | undefined;
            } | undefined;
            output: {
                models: {
                    image?: {
                        id: string;
                        name: string;
                        description: string;
                        maxInputTokens?: number;
                        maxOutputTokens?: number;
                        inputTokenPrice?: string;
                        outputTokenPrice?: string;
                        dimensions?: number;
                    }[] | undefined;
                    'text-embedding'?: {
                        id: string;
                        name: string;
                        description: string;
                        maxInputTokens?: number;
                        maxOutputTokens?: number;
                        inputTokenPrice?: string;
                        outputTokenPrice?: string;
                        dimensions?: number;
                    }[] | undefined;
                    language?: {
                        id: string;
                        name: string;
                        description: string;
                        maxInputTokens?: number;
                        maxOutputTokens?: number;
                        inputTokenPrice?: string;
                        outputTokenPrice?: string;
                        dimensions?: number;
                    }[] | undefined;
                };
            };
        }>;
        getModel: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                type: "image" | "language" | "text-embedding";
            };
            output: {
                model: {
                    id: string;
                    name: string;
                    description: string;
                    maxInputTokens?: number;
                    maxOutputTokens?: number;
                    inputTokenPrice?: string;
                    outputTokenPrice?: string;
                    dimensions?: number;
                };
            };
        }>;
    };
    chat: {
        listByApp: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                appId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                chats: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: ChatMetadata;
                    userId: string;
                    debug: boolean;
                    appId: string;
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                chat: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: ChatMetadata;
                    userId: string;
                    debug: boolean;
                    appId: string;
                };
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                metadata: {
                    title: string;
                    visibility: "public" | "private";
                    languageModel?: string | undefined;
                    embeddingModel?: string | undefined;
                    rerankModel?: string | undefined;
                    imageModel?: string | undefined;
                } & {
                    [k: string]: unknown;
                };
                userId: string;
                appId: string;
                id?: string | undefined;
                debug?: boolean | undefined;
            };
            output: {
                chat: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: ChatMetadata;
                    userId: string;
                    debug: boolean;
                    appId: string;
                };
            };
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                metadata?: {
                    languageModel?: string | undefined;
                    embeddingModel?: string | undefined;
                    rerankModel?: string | undefined;
                    imageModel?: string | undefined;
                    title?: string | undefined;
                    visibility?: "public" | "private" | undefined;
                } | undefined;
                debug?: boolean | undefined;
            };
            output: {
                chat: {
                    createdAt: Date;
                    updatedAt: Date;
                    id: string;
                    appId: string;
                    userId: string;
                    debug: boolean;
                    metadata: ChatMetadata;
                };
            };
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                chat: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: ChatMetadata;
                    userId: string;
                    debug: boolean;
                    appId: string;
                };
            };
        }>;
        listMessages: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                chatId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                messages: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    role: "user" | "system" | "assistant" | "tool";
                    agentId: string | null;
                    chatId: string;
                    content: unknown;
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        getMessage: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                message: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    role: "user" | "system" | "assistant" | "tool";
                    agentId: string | null;
                    chatId: string;
                    content: unknown;
                };
            };
        }>;
        createMessage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                chatId: string;
                id?: string | undefined;
                agentId?: string | undefined;
            } & import("ai").CoreMessage;
            output: {
                message: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    role: "user" | "system" | "assistant" | "tool";
                    agentId: string | null;
                    chatId: string;
                    content: unknown;
                };
            };
        }>;
        createMessages: import("@trpc/server").TRPCMutationProcedure<{
            input: ({
                chatId: string;
                id?: string | undefined;
                agentId?: string | undefined;
            } & import("ai").CoreMessage)[];
            output: {
                messages: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    role: "user" | "system" | "assistant" | "tool";
                    agentId: string | null;
                    chatId: string;
                    content: unknown;
                }[];
            };
        }>;
        deleteTrailingMessages: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                messageId: string;
            };
            output: {
                messages: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    role: "user" | "system" | "assistant" | "tool";
                    agentId: string | null;
                    chatId: string;
                    content: unknown;
                }[];
            };
        }>;
        voteMessage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                chatId: string;
                messageId: string;
                isUpvoted: boolean;
            };
            output: {
                vote: {
                    createdAt: Date;
                    updatedAt: Date;
                    chatId: string;
                    messageId: string;
                    isUpvoted: boolean;
                };
            };
        }>;
    };
    artifact: {
        listByChat: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                chatId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
            };
            output: {
                artifacts: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    version: number;
                    title: string;
                    chatId: string;
                    content: unknown;
                    kind: "image" | "code" | "text" | "sheet";
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
        listVersionsById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                after?: number | undefined;
                before?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                versions: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    version: number;
                    title: string;
                    chatId: string;
                    content: unknown;
                    kind: "image" | "code" | "text" | "sheet";
                }[];
                hasMore: boolean;
                first: number | undefined;
                last: number | undefined;
            };
        }>;
        deleteVersionsByIdAfterVersion: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                after: number;
            };
            output: void;
        }>;
        listSuggestions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                artifactId: string;
                after?: string | undefined;
                before?: string | undefined;
                limit?: number | undefined;
                artifactVersion?: number | undefined;
            };
            output: {
                suggestions: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    artifactId: string;
                    artifactVersion: number;
                    originalText: string;
                    suggestedText: string;
                    isResolved: boolean;
                }[];
                hasMore: boolean;
                first: string | undefined;
                last: string | undefined;
            };
        }>;
    };
}>>;
export type API = typeof appRouter;
