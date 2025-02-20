export interface UserInfo {
  [key: string]: unknown
}

export interface AppMetadata {
  description?: string
  imageUrl?: string

  languageModel: string
  embeddingModel: string // used for embedding memories
  rerankModel: string // used for reranking memories

  [key: string]: unknown
}

export interface AgentMetadata {
  description?: string
  imageUrl?: string

  languageModel?: string
  embeddingModel?: string // used for embedding memories
  rerankModel?: string // used for reranking memories

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
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                apps: {
                    app: {
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        type: "single-agent" | "multiple-agents";
                        workspaceId: string;
                        metadata: AppMetadata;
                    };
                    categories: string[];
                    tags: string[];
                }[];
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        listByCategory: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                categoryId: string;
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                apps: {
                    app: {
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        type: "single-agent" | "multiple-agents";
                        workspaceId: string;
                        metadata: AppMetadata;
                    };
                    categories: string[];
                    tags: string[];
                }[];
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        listByTags: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                tags: string[];
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                apps: {
                    app: {
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        type: "single-agent" | "multiple-agents";
                        workspaceId: string;
                        metadata: AppMetadata;
                    };
                    categories: string[];
                    tags: string[];
                }[];
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        listVersions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                versions: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: "single-agent" | "multiple-agents";
                    metadata: AppMetadata;
                    appId: string;
                    version: number;
                }[];
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                app: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: "single-agent" | "multiple-agents";
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
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                workspaces: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                offset: number;
                limit: number;
                total: number;
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
                offset?: number | undefined;
                limit?: number | undefined;
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
                offset: number;
                limit: number;
                total: number;
            };
        }>;
        getMember: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: string;
                workspaceId: string;
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
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                users: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    info: UserInfo;
                }[];
                offset: number;
                limit: number;
                total: number;
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
                offset?: number | undefined;
                limit?: number | undefined;
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
                offset: number;
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
                offset?: number | undefined;
                limit?: number | undefined;
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
                offset: number;
                limit: number;
            };
        }>;
        getMember: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                userId: string;
                workspaceId: string;
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
                userId: string;
                workspaceId: string;
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
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                apps: {
                    app: {
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        type: "single-agent" | "multiple-agents";
                        workspaceId: string;
                        metadata: AppMetadata;
                    };
                    categories: string[];
                    tags: string[];
                }[];
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        listByCategory: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                categoryId: string;
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                apps: {
                    app: {
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        type: "single-agent" | "multiple-agents";
                        workspaceId: string;
                        metadata: AppMetadata;
                    };
                    categories: string[];
                    tags: string[];
                }[];
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        listByTags: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                workspaceId: string;
                tags: string[];
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                apps: {
                    app: {
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        type: "single-agent" | "multiple-agents";
                        workspaceId: string;
                        metadata: AppMetadata;
                    };
                    categories: string[];
                    tags: string[];
                }[];
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        listVersions: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                workspaceId: string;
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                versions: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: "single-agent" | "multiple-agents";
                    metadata: AppMetadata;
                    appId: string;
                    version: number;
                }[];
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
                workspaceId: string;
            };
            output: {
                app: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: "single-agent" | "multiple-agents";
                    workspaceId: string;
                    metadata: AppMetadata;
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
                } & {
                    [k: string]: unknown;
                };
                type?: "single-agent" | "multiple-agents" | undefined;
            };
            output: {
                app: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: "single-agent" | "multiple-agents";
                    workspaceId: string;
                    metadata: AppMetadata;
                };
                draft: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: "single-agent" | "multiple-agents";
                    metadata: AppMetadata;
                    appId: string;
                    version: number;
                };
            };
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                workspaceId: string;
                name?: string | undefined;
                metadata?: import("zod").objectInputType<{
                    description: import("zod").ZodOptional<import("zod").ZodString>;
                    imageUrl: import("zod").ZodOptional<import("zod").ZodString>;
                    languageModel: import("zod").ZodOptional<import("zod").ZodString>;
                    embeddingModel: import("zod").ZodOptional<import("zod").ZodString>;
                    rerankModel: import("zod").ZodOptional<import("zod").ZodString>;
                }, import("zod").ZodUnknown, "strip"> | undefined;
            };
            output: {
                app: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: "single-agent" | "multiple-agents";
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
            input: {
                id: string;
                workspaceId: string;
            };
            output: {
                success: boolean;
            };
        }>;
        publish: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                workspaceId: string;
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
        updateTags: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                workspaceId: string;
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
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                categories: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        updateCategories: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                workspaceId: string;
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
                offset?: number | undefined;
                limit?: number | undefined;
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
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        listVersionsByApp: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                agentId: string;
                offset?: number | undefined;
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
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
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
                offset?: number | undefined;
                limit?: number | undefined;
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
                total: number;
                offset: number;
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
                offset?: number | undefined;
                limit?: number | undefined;
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
                total: number;
                offset: number;
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
                content: string;
                workspaceId: string;
                index: number;
                datasetId: string;
                documentId: string;
                metadata?: Record<string, unknown> | undefined;
            };
            output: {
                segment: {
                    id: string;
                    content: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: unknown;
                    index: number;
                    datasetId: string;
                    documentId: string;
                };
            };
        }>;
        updateSegment: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                content?: string | undefined;
                metadata?: Record<string, unknown> | undefined;
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
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                segments: {
                    id: string;
                    content: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: unknown;
                    index: number;
                    datasetId: string;
                    documentId: string;
                }[];
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        createChunk: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                content: string;
                workspaceId: string;
                index: number;
                datasetId: string;
                documentId: string;
                segmentId: string;
                metadata?: Record<string, unknown> | undefined;
            };
            output: {
                chunk: {
                    id: string;
                    content: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: unknown;
                    index: number;
                    datasetId: string;
                    documentId: string;
                    segmentId: string;
                };
            };
        }>;
        updateChunk: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                content?: string | undefined;
                metadata?: Record<string, unknown> | undefined;
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
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                chunks: {
                    id: string;
                    content: string;
                    createdAt: Date;
                    updatedAt: Date;
                    workspaceId: string;
                    metadata: unknown;
                    index: number;
                    datasetId: string;
                    documentId: string;
                    segmentId: string;
                }[];
                total: number;
                offset: number;
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
                id: string;
                type: "image" | "language" | "text-embedding";
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
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                chats: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: "chat" | "room";
                    metadata: ChatMetadata;
                    appId: string;
                    version: number;
                    owner: string;
                }[];
                total: number;
                offset: number;
                limit: number;
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
                    type: "chat" | "room";
                    metadata: ChatMetadata;
                    appId: string;
                    version: number;
                    owner: string;
                };
            };
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                type: "chat" | "room";
                metadata: {
                    title: string;
                    visibility: "public" | "private";
                    languageModel?: string | undefined;
                    embeddingModel?: string | undefined;
                    rerankModel?: string | undefined;
                } & {
                    [k: string]: unknown;
                };
                appId: string;
                version: number;
                owner: string;
            };
            output: {
                chat: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    type: "chat" | "room";
                    metadata: ChatMetadata;
                    appId: string;
                    version: number;
                    owner: string;
                };
            };
        }>;
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                metadata?: import("zod").objectInputType<{
                    title: import("zod").ZodString;
                    visibility: import("zod").ZodEnum<["public", "private"]>;
                    languageModel: import("zod").ZodOptional<import("zod").ZodString>;
                    embeddingModel: import("zod").ZodOptional<import("zod").ZodString>;
                    rerankModel: import("zod").ZodOptional<import("zod").ZodString>;
                }, import("zod").ZodUnknown, "strip"> | undefined;
                owner?: string | undefined;
            };
            output: {
                chat: {
                    createdAt: Date;
                    updatedAt: Date;
                    id: string;
                    appId: string;
                    version: number;
                    owner: string;
                    type: "chat" | "room";
                    metadata: ChatMetadata;
                };
            };
        }>;
        listMessages: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                chatId: string;
                offset?: number | undefined;
                limit?: number | undefined;
            };
            output: {
                messages: {
                    id: string;
                    content: string | (import("ai").TextPart | import("ai").ImagePart | import("ai").FilePart)[] | (import("ai").TextPart | import("ai").ToolCallPart)[] | import("ai").ToolContent;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string | null;
                    agentId: string | null;
                    role: "user" | "system" | "assistant" | "tool";
                    chatId: string;
                    index: number;
                }[];
                total: number;
                offset: number;
                limit: number;
            };
        }>;
        getMessage: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                message: {
                    id: string;
                    content: string | (import("ai").TextPart | import("ai").ImagePart | import("ai").FilePart)[] | (import("ai").TextPart | import("ai").ToolCallPart)[] | import("ai").ToolContent;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string | null;
                    agentId: string | null;
                    role: "user" | "system" | "assistant" | "tool";
                    chatId: string;
                    index: number;
                };
            };
        }>;
        createMessage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                content: Record<string, unknown>;
                role: "user" | "system" | "assistant" | "tool";
                chatId: string;
                index: number;
                userId?: string | undefined;
                agentId?: string | undefined;
            };
            output: {
                message: {
                    id: string;
                    content: string | (import("ai").TextPart | import("ai").ImagePart | import("ai").FilePart)[] | (import("ai").TextPart | import("ai").ToolCallPart)[] | import("ai").ToolContent;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string | null;
                    agentId: string | null;
                    role: "user" | "system" | "assistant" | "tool";
                    chatId: string;
                    index: number;
                };
            };
        }>;
        deleteTrailingMessages: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                messageId: string;
            };
            output: {
                success: boolean;
            };
        }>;
        voteMessage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                chatId: string;
                messageId: string;
                isUpvoted: boolean;
            };
            output: {
                vote: {
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    chatId: string;
                    messageId: string;
                    isUpvoted: boolean;
                };
            };
        }>;
    };
    post: {
        all: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                title: string;
                content: string;
                createdAt: Date;
                updatedAt: Date | null;
            }[];
        }>;
        byId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                id: string;
                title: string;
                content: string;
                createdAt: Date;
                updatedAt: Date | null;
            } | undefined;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                title: string;
                content: string;
            };
            output: import("pg").QueryResult<never>;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: string;
            output: import("pg").QueryResult<never>;
        }>;
    };
}>>;
export type API = typeof appRouter;
