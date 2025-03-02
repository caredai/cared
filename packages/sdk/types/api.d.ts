export type UserInfo = Record<string, unknown>;

export interface AppMetadata {
  description?: string
  imageUrl?: string

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

  [key: string]: unknown
}

export interface DocumentMetadata {
  url?: string
  processed?: boolean
  taskId?: string

  [key: string]: unknown
}

export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  | 'azure'
  | 'bedrock'
  | 'google'
  | 'vertex'
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
    meta: object;
    errorShape: import("@trpc/server/unstable-core-do-not-import").DefaultErrorShape;
    transformer: true;
}, import("@trpc/server/unstable-core-do-not-import").DecorateCreateRouterOptions<{
    admin: {
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                apps: {
                    app: {
                        type: "single-agent" | "multiple-agents";
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        workspaceId: string;
                        metadata: AppMetadata;
                    };
                    categories: string[];
                    tags: string[];
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        listByCategory: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                categoryId: string;
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                apps: {
                    app: {
                        type: "single-agent" | "multiple-agents";
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        workspaceId: string;
                        metadata: AppMetadata;
                    };
                    categories: string[];
                    tags: string[];
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        listByTags: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                tags: string[];
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                apps: {
                    app: {
                        type: "single-agent" | "multiple-agents";
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        workspaceId: string;
                        metadata: AppMetadata;
                    };
                    categories: string[];
                    tags: string[];
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        listVersions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                limit?: number | undefined;
                after?: number | undefined;
                before?: number | undefined;
            };
            output: {
                versions: {
                    type: "single-agent" | "multiple-agents";
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AppMetadata;
                    appId: string;
                    version: number;
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                app: {
                    type: "single-agent" | "multiple-agents";
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: AppMetadata;
                };
            };
        }>;
        createCategory: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
            };
            output: {
                category: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
            };
        }>;
        listWorkspaces: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                workspaces: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        getWorkspace: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                workspace: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            };
        }>;
        listMembers: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                members: {
                    user: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        info: UserInfo;
                    };
                    role: "owner" | "member";
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        getMember: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                userId: string;
            };
            output: {
                user: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    info: UserInfo;
                };
                role: "owner" | "member";
            };
        }>;
        listUsers: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                search?: string | undefined;
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                users: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    info: UserInfo;
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        getUser: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                user: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    info: UserInfo;
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
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                workspaces: {
                    workspace: {
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                    role: "owner" | "member";
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                workspace: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
                role: "owner" | "member";
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
            };
            output: {
                workspace: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
                role: string;
            };
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                id: string;
            };
            output: {
                workspace: {
                    createdAt: Date;
                    updatedAt: Date;
                    id: string;
                    name: string;
                };
                role: string;
            };
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: string;
            output: void;
        }>;
        listMembers: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                members: {
                    user: {
                        info: {
                            username: string;
                            firstName: string | null;
                            lastName: string | null;
                            imageUrl: string;
                            hasImage: boolean;
                        };
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                    role: "owner" | "member";
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        getMember: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                userId: string;
            };
            output: {
                user: {
                    info: {
                        username: string;
                        firstName: string | null;
                        lastName: string | null;
                        imageUrl: string;
                        hasImage: boolean;
                    };
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
                role: "owner" | "member";
            };
        }>;
        addMember: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                workspaceId: string;
                userId: string;
                role?: "owner" | "member" | undefined;
            };
            output: {
                user: {
                    info: {
                        username: string;
                        firstName: string | null;
                        lastName: string | null;
                        imageUrl: string;
                        hasImage: boolean;
                    };
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
                role: "owner" | "member";
            };
        }>;
        deleteMember: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                workspaceId: string;
                userId: string;
            };
            output: void;
        }>;
        transferOwner: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                workspaceId: string;
                userId: string;
            };
            output: void;
        }>;
    };
    user: {
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                info: UserInfo;
            };
        }>;
    };
    app: {
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                apps: {
                    app: {
                        type: "single-agent" | "multiple-agents";
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        workspaceId: string;
                        metadata: AppMetadata;
                    };
                    categories: string[];
                    tags: string[];
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        listByCategory: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                categoryId: string;
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                apps: {
                    app: {
                        type: "single-agent" | "multiple-agents";
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        workspaceId: string;
                        metadata: AppMetadata;
                    };
                    categories: string[];
                    tags: string[];
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        listByTags: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                tags: string[];
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                apps: {
                    app: {
                        type: "single-agent" | "multiple-agents";
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        workspaceId: string;
                        metadata: AppMetadata;
                    };
                    categories: string[];
                    tags: string[];
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        listVersions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                limit?: number | undefined;
                after?: number | undefined;
                before?: number | undefined;
            };
            output: {
                versions: {
                    type: "single-agent" | "multiple-agents";
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AppMetadata;
                    appId: string;
                    version: number;
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                app: {
                    type: "single-agent" | "multiple-agents";
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: AppMetadata;
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
                    type: "single-agent" | "multiple-agents";
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AppMetadata;
                    appId: string;
                    version: number;
                };
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                workspaceId: string;
                metadata: {
                    description?: string | undefined;
                    imageUrl?: string | undefined;
                    languageModel?: string | undefined;
                    embeddingModel?: string | undefined;
                    rerankModel?: string | undefined;
                    imageModel?: string | undefined;
                    languageModelSettings?: {
                        systemPrompt?: string | undefined;
                    } | undefined;
                } & Record<string, unknown>;
                type?: "single-agent" | "multiple-agents" | undefined;
            };
            output: {
                app: {
                    type: "single-agent" | "multiple-agents";
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: AppMetadata;
                };
                draft: {
                    type: "single-agent" | "multiple-agents";
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AppMetadata;
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
                }, import("zod").ZodUnknown, "strip"> | undefined;
            };
            output: {
                app: {
                    type: "single-agent" | "multiple-agents";
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: AppMetadata;
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
            input: string;
            output: {
                success: boolean;
            };
        }>;
        publish: import("@trpc/server").TRPCMutationProcedure<{
            input: string;
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
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                categories: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        updateCategories: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                add?: string[] | undefined;
                remove?: string[] | undefined;
            };
            output: void;
        }>;
    };
    apiKey: {
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                appId: string;
            };
            output: {
                keys: {
                    id: string;
                    prefix: string;
                    key: string | undefined;
                    createdAt: number;
                }[];
            };
        }>;
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                appId: string;
            };
            output: {
                key: {
                    id: string;
                    prefix: string;
                    key: string | undefined;
                    createdAt: number;
                };
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                appId: string;
            };
            output: {
                key: {
                    id: string;
                    prefix: string;
                    key: string | undefined;
                    createdAt: number;
                };
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
        has: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: boolean;
        }>;
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                oauthApp: {
                    discoveryUrl: string;
                    clientSecret?: string | undefined;
                    redirectUris: string[];
                    clientId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    appId: string;
                    oauthAppId: string;
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
                    discoveryUrl: string;
                    clientSecret?: string | undefined;
                    redirectUris: string[];
                    clientId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    appId: string;
                    oauthAppId: string;
                };
            };
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                appId: string;
                redirectUris?: string[] | undefined;
            };
            output: {
                oauthApp: {
                    discoveryUrl: string;
                    clientSecret?: string | undefined;
                    redirectUris: string[];
                    clientId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    appId: string;
                    oauthAppId: string;
                };
            };
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: string;
            output: void;
        }>;
        rotateSecret: import("@trpc/server").TRPCMutationProcedure<{
            input: string;
            output: {
                oauthApp: {
                    discoveryUrl: string;
                    clientSecret?: string | undefined;
                    redirectUris: string[];
                    clientId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    appId: string;
                    oauthAppId: string;
                };
            };
        }>;
    };
    agent: {
        listByApp: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                appId: string;
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                agents: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AgentMetadata;
                    appId: string;
                }[];
                hasMore: boolean;
                limit: number;
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
                    version: number;
                    agentId: string;
                }[];
            };
        }>;
        listVersions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                agentId: string;
                limit?: number | undefined;
                after?: number | undefined;
                before?: number | undefined;
            };
            output: {
                versions: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    metadata: AgentMetadata;
                    version: number;
                    agentId: string;
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                agent: {
                    name: string;
                    id: string;
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
                }, import("zod").ZodUnknown, "strip"> | undefined;
            };
            output: {
                agent: {
                    name: string;
                    id: string;
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
                    version: number;
                    agentId: string;
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
                }, import("zod").ZodUnknown, "strip"> | undefined;
            };
            output: {
                agent: {
                    name: string;
                    id: string;
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
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                datasets: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: DatasetMetadata;
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                dataset: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: DatasetMetadata;
                };
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                workspaceId: string;
                metadata: {
                    languageModel?: string | undefined;
                    embeddingModel?: string | undefined;
                    rerankModel?: string | undefined;
                    retrievalMode?: "vector-search" | "full-text-search" | "hybrid-search" | undefined;
                    topK?: number | undefined;
                    scoreThreshold?: number | undefined;
                };
            };
            output: {
                dataset: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: DatasetMetadata;
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
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: DocumentMetadata;
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
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                documents: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: DocumentMetadata;
                    datasetId: string;
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        getDocument: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                document: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: DocumentMetadata;
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
                    workspaceId: string;
                    metadata: unknown;
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
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                segments: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: unknown;
                    content: string;
                    datasetId: string;
                    documentId: string;
                    index: number;
                }[];
                hasMore: boolean;
                limit: number;
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
                    workspaceId: string;
                    metadata: unknown;
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
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                chunks: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: unknown;
                    content: string;
                    datasetId: string;
                    documentId: string;
                    index: number;
                    segmentId: string;
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
    };
    model: {
        listProviders: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                providers: {
                    id: ProviderId;
                    name: string;
                }[];
            };
        }>;
        listModels: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                type?: "image" | "language" | "text-embedding" | undefined;
            };
            output: {
                models: {
                    image?: {
                        id: string;
                        name: string;
                        description: string;
                        dimensions?: number;
                    }[] | undefined;
                    'text-embedding'?: {
                        id: string;
                        name: string;
                        description: string;
                        dimensions?: number;
                    }[] | undefined;
                    language?: {
                        id: string;
                        name: string;
                        description: string;
                        dimensions?: number;
                    }[] | undefined;
                };
            };
        }>;
        listModelsByProvider: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                providerId: string;
                type?: "image" | "language" | "text-embedding" | undefined;
            };
            output: {
                models: {
                    image?: {
                        id: string;
                        name: string;
                        description: string;
                        dimensions?: number;
                    }[] | undefined;
                    'text-embedding'?: {
                        id: string;
                        name: string;
                        description: string;
                        dimensions?: number;
                    }[] | undefined;
                    language?: {
                        id: string;
                        name: string;
                        description: string;
                        dimensions?: number;
                    }[] | undefined;
                };
            };
        }>;
        getModel: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                type: "image" | "language" | "text-embedding";
                id: string;
            };
            output: {
                model: {
                    id: string;
                    name: string;
                    description: string;
                    dimensions?: number;
                };
            };
        }>;
    };
    chat: {
        listByApp: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                appId: string;
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                chats: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    metadata: ChatMetadata;
                    appId: string;
                    debug: boolean;
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                chat: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    metadata: ChatMetadata;
                    appId: string;
                    debug: boolean;
                };
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                metadata: {
                    visibility: "public" | "private";
                    title: string;
                    languageModel?: string | undefined;
                    embeddingModel?: string | undefined;
                    rerankModel?: string | undefined;
                    imageModel?: string | undefined;
                } & Record<string, unknown>;
                appId: string;
                id?: string | undefined;
                debug?: boolean | undefined;
            };
            output: {
                chat: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    metadata: ChatMetadata;
                    appId: string;
                    debug: boolean;
                };
            };
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                metadata?: {
                    visibility?: "public" | "private" | undefined;
                    languageModel?: string | undefined;
                    embeddingModel?: string | undefined;
                    rerankModel?: string | undefined;
                    imageModel?: string | undefined;
                    title?: string | undefined;
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
            input: string;
            output: {
                chat: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    metadata: ChatMetadata;
                    appId: string;
                    debug: boolean;
                };
            };
        }>;
        listMessages: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                chatId: string;
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                messages: {
                    role: "user" | "system" | "assistant" | "tool";
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    agentId: string | null;
                    content: unknown;
                    chatId: string;
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        getMessage: import("@trpc/server").TRPCQueryProcedure<{
            input: string;
            output: {
                message: {
                    role: "user" | "system" | "assistant" | "tool";
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    agentId: string | null;
                    content: unknown;
                    chatId: string;
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
                    role: "user" | "system" | "assistant" | "tool";
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    agentId: string | null;
                    content: unknown;
                    chatId: string;
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
                    role: "user" | "system" | "assistant" | "tool";
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    agentId: string | null;
                    content: unknown;
                    chatId: string;
                }[];
            };
        }>;
        deleteTrailingMessages: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                messageId: string;
            };
            output: {
                messages: {
                    role: "user" | "system" | "assistant" | "tool";
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    agentId: string | null;
                    content: unknown;
                    chatId: string;
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
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
            };
            output: {
                artifacts: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    version: number;
                    title: string;
                    content: unknown;
                    chatId: string;
                    kind: "code" | "text" | "image" | "sheet";
                }[];
                hasMore: boolean;
                limit: number;
            };
        }>;
        listVersionsById: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                limit?: number | undefined;
                after?: number | undefined;
                before?: number | undefined;
            };
            output: {
                versions: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    version: number;
                    title: string;
                    content: unknown;
                    chatId: string;
                    kind: "code" | "text" | "image" | "sheet";
                }[];
                hasMore: boolean;
                limit: number;
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
                artifactVersion?: number | undefined;
                limit?: number | undefined;
                after?: string | undefined;
                before?: string | undefined;
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
                limit: number;
            };
        }>;
    };
}>>;
export type API = typeof appRouter;
