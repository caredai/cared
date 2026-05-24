import { z } from 'zod'

export const MAX_NAMESPACE_NAME_LENGTH = 128 - 32 /* accountId */ - 1 /* type */ - 1 /* _ */

export enum VectorType {
  PUBLIC = 'P',
  INTERNAL_UNCONTROLLED = 'U',
  INTERNAL_MANAGED = 'M',
}

/**
 * Distance metric for vector similarity calculation
 */
export const distanceMetricSchema = z
  .enum(['cosine_distance', 'euclidean_squared'])
  .describe('Distance metric for vector similarity calculation')

/**
 * Language for full-text search
 */
export const languageSchema = z.enum([
  'arabic',
  'danish',
  'dutch',
  'english',
  'finnish',
  'french',
  'german',
  'greek',
  'hungarian',
  'italian',
  'norwegian',
  'portuguese',
  'romanian',
  'russian',
  'spanish',
  'swedish',
  'tamil',
  'turkish',
])

/**
 * Tokenizer for full-text search
 */
export const tokenizerSchema = z.enum([
  'pre_tokenized_array',
  'word_v0',
  'word_v1',
  'word_v2',
  'word_v3',
])

/**
 * Full-text search configuration
 */
export const fullTextSearchConfigSchema = z.object({
  b: z
    .number()
    .optional()
    .describe('Document length normalization parameter for BM25. Defaults to `0.75`'),
  caseSensitive: z
    .boolean()
    .optional()
    .describe('Whether searching is case-sensitive. Defaults to `false`'),
  k1: z.number().optional().describe('Term saturation parameter for BM25. Defaults to `1.2`'),
  language: languageSchema
    .optional()
    .describe('Language of the text attribute. Defaults to `english`'),
  maxTokenLength: z
    .int()
    .min(1)
    .max(254)
    .optional()
    .describe('Maximum length of a token in bytes. Defaults to `39`'),
  removeStopwords: z
    .boolean()
    .optional()
    .describe('Remove common words from text. Defaults to `true`'),
  stemming: z
    .boolean()
    .optional()
    .describe('Language-specific stemming for the text. Defaults to `false`'),
  tokenizer: tokenizerSchema.optional().describe('Tokenizer to use. Defaults to `word_v2`'),
})

/**
 * Full-text search - can be boolean or detailed configuration
 */
export const fullTextSearchSchema = z.union([z.boolean(), fullTextSearchConfigSchema])

/**
 * ANN (Approximate Nearest Neighbor) configuration
 */
export const annConfigSchema = z.object({
  distanceMetric: distanceMetricSchema.optional(),
})

/**
 * Attribute type schema
 */
export const attributeTypeSchema = z
  .union([
    z.enum([
      'string',
      'int',
      'uint',
      'float',
      'uuid',
      'datetime',
      'bool',
      '[]string',
      '[]int',
      '[]uint',
      '[]float',
      '[]uuid',
      '[]datetime',
      '[]bool',
    ]),
    // For `vector` attribute
    z.templateLiteral(['[', z.uint32(), ']', z.enum(['f16', 'f32'])]),
  ])
  .describe('The data type of the attribute')

/**
 * Attribute schema configuration
 */
export const attributeSchemaConfigSchema = z.object({
  type: attributeTypeSchema,
  ann: z
    .union([z.boolean(), annConfigSchema])
    .optional()
    .describe('Whether to create ANN index for the attribute'),
  filterable: z.boolean().optional().describe('Whether the attribute can be used in filters'),
  fullTextSearch: fullTextSearchSchema
    .optional()
    .describe('Whether to enable BM25 full-text search. Requires string or []string type'),
  regex: z.boolean().optional().describe('Whether to enable Regex filters on this attribute'),
})

/**
 * Index status - up-to-date
 */
export const indexUpToDateSchema = z.object({
  status: z.literal('up-to-date'),
})

/**
 * Index status - updating
 */
export const indexUpdatingSchema = z.object({
  status: z.literal('updating'),
  unindexed_bytes: z.number().describe('Number of bytes in write-ahead log not yet indexed'),
})

/**
 * Index status - up-to-date or updating
 */
export const indexStatusSchema = z.discriminatedUnion('status', [
  indexUpToDateSchema,
  indexUpdatingSchema,
])

/**
 * Namespace metadata schema
 */
export const namespaceMetadataSchema = z.object({
  schema: z
    .record(z.string(), attributeSchemaConfigSchema)
    .describe('Schema of the namespace attributes'),
  approxLogicalBytes: z.number().describe('Approximate number of logical bytes in the namespace'),
  approxRowCount: z.number().describe('Approximate number of rows in the namespace'),
  index: indexStatusSchema.describe('Index status (up-to-date or updating)'),
  createdAt: z.date().describe('Timestamp when the namespace was created'),
  updatedAt: z.date().describe('Timestamp when the namespace was last modified'),
})

/**
 * Identifier schema for documents
 */
export const idSchema = z.union([z.string(), z.number()]).describe('Document identifier')

/**
 * Vector schema allowing float arrays or base64 strings
 */
export const vectorSchema = z.union([z.array(z.number()), z.string()]).describe('Vector embedding')

/**
 * Columns schema for columnar document writes
 */
export const columnsSchema = z
  .object({
    id: z.array(idSchema).describe('Document identifiers column'),
    vector: z
      .union([z.array(vectorSchema), z.array(z.number()), z.string()])
      .optional()
      .describe('Vector column'),
  })
  .catchall(
    z
      .union([
        z.array(z.unknown()),
        z.array(idSchema),
        z.array(vectorSchema),
        z.array(z.number()),
        z.string(),
      ])
      .optional(),
  )
  .describe('Columnar representation of documents')

/**
 * Row schema for row-based document writes
 */
export const rowSchema = z
  .object({
    id: idSchema,
    vector: vectorSchema.optional(),
    $dist: z.number().optional(),
  })
  .catchall(z.unknown())
  .describe('Row representation of a document')

/**
 * BM25 clause parameters schema
 */
export const bm25ClauseParamsSchema = z
  .object({
    lastAsPrefix: z
      .boolean()
      .optional()
      .describe('Treat the final token in the query as a literal prefix'),
  })
  .describe('Additional configuration for BM25 clauses')

/**
 * Type-safe representation of Turbopuffer rank-by clauses with camelCase params
 */
export type Bm25ClauseParamsInput = z.infer<typeof bm25ClauseParamsSchema>
export type RankByTextInput =
  | [string, 'BM25', string]
  | [string, 'BM25', string[]]
  | [string, 'BM25', string, Bm25ClauseParamsInput]
  | [string, 'BM25', string[], Bm25ClauseParamsInput]
  | ['Sum', RankByTextInput[]]
  | ['Max', RankByTextInput[]]
  | ['Product', number, RankByTextInput]
  | ['Product', RankByTextInput, number]

export type RankByInput =
  | [string, 'ANN', number[]] // RankByVector
  | RankByTextInput
  | [string, 'asc' | 'desc'] // RankByAttribute

/**
 * Recursive rank-by text schema for BM25 and text operations
 */
export const rankByTextSchema: z.ZodType<RankByTextInput> = z.lazy(() =>
  z.union([
    // BM25 clauses
    z.tuple([z.string(), z.literal('BM25'), z.string()]),
    z.tuple([z.string(), z.literal('BM25'), z.array(z.string())]),
    z.tuple([z.string(), z.literal('BM25'), z.string(), bm25ClauseParamsSchema]),
    z.tuple([z.string(), z.literal('BM25'), z.array(z.string()), bm25ClauseParamsSchema]),
    // Aggregation clauses
    z.tuple([z.literal('Sum'), z.array(rankByTextSchema)]),
    z.tuple([z.literal('Max'), z.array(rankByTextSchema)]),
    z.tuple([z.literal('Product'), z.number(), rankByTextSchema]),
    z.tuple([z.literal('Product'), rankByTextSchema, z.number()]),
  ]),
)

/**
 * Recursive rank-by schema mirroring Turbopuffer rank-by clauses
 */
export const rankBySchema: z.ZodType<RankByInput> = z.union([
  // Vector similarity search (ANN)
  z.tuple([z.string(), z.literal('ANN'), z.array(z.number())]),
  // Text search and aggregations (recursive)
  rankByTextSchema,
  // Attribute ordering
  z.tuple([z.string(), z.enum(['asc', 'desc'])]),
])

/**
 * Generic rank-by schema for flexible input validation
 */
export const genericRankBySchema = z.array(z.unknown())

/**
 * Include attributes flag or explicit attribute list
 */
export const includeAttributesSchema = z.union([z.boolean(), z.array(z.string())])

/**
 * Aggregation clause schema
 */
export const aggregateBySchema = z.record(
  z.string(),
  z.union([
    z.tuple([z.literal('Count')]),
    z.tuple([z.literal('Count'), z.string()]),
  ]),
)

/**
 * Consistency level schema
 */
export const consistencySchema = z.object({
  level: z.enum(['strong', 'eventual']).optional().describe('Consistency level for the query'),
})

/**
 * Vector encoding option schema
 */
export const vectorEncodingSchema = z.enum(['float', 'base64'])

/**
 * ContainsAllTokens filter configuration
 */
export const containsAllTokensFilterParamsSchema = z
  .object({
    lastAsPrefix: z
      .boolean()
      .optional()
      .describe('Treat the final token in the query as a literal prefix'),
  })
  .describe('Additional configuration for ContainsAllTokens filters')

/**
 * Type-safe representation of Turbopuffer filters with camelCase params
 */
export type ContainsAllTokensConfigInput = z.infer<typeof containsAllTokensFilterParamsSchema>
export type FilterInput =
  | [string, 'Eq', unknown]
  | [string, 'NotEq', unknown]
  | [string, 'In', unknown[]]
  | [string, 'NotIn', unknown[]]
  | [string, 'Contains', unknown]
  | [string, 'NotContains', unknown]
  | [string, 'ContainsAny', unknown[]]
  | [string, 'NotContainsAny', unknown[]]
  | [string, 'Lt', unknown]
  | [string, 'Lte', unknown]
  | [string, 'Gt', unknown]
  | [string, 'Gte', unknown]
  | [string, 'AnyLt', unknown]
  | [string, 'AnyLte', unknown]
  | [string, 'AnyGt', unknown]
  | [string, 'AnyGte', unknown]
  | [string, 'Glob', string]
  | [string, 'NotGlob', string]
  | [string, 'IGlob', string]
  | [string, 'NotIGlob', string]
  | [string, 'Regex', string]
  | [string, 'ContainsAllTokens', string | string[]]
  | [string, 'ContainsAllTokens', string | string[], ContainsAllTokensConfigInput]
  | ['Not', FilterInput]
  | ['And', FilterInput[]]
  | ['Or', FilterInput[]]

/**
 * Recursive filter schema mirroring Turbopuffer filters
 */
export const filterSchema: z.ZodType<FilterInput> = z.lazy(() =>
  z.union([
    z.tuple([z.string(), z.literal('Eq'), z.unknown()]),
    z.tuple([z.string(), z.literal('NotEq'), z.unknown()]),
    z.tuple([z.string(), z.literal('In'), z.array(z.unknown())]),
    z.tuple([z.string(), z.literal('NotIn'), z.array(z.unknown())]),
    z.tuple([z.string(), z.literal('Contains'), z.unknown()]),
    z.tuple([z.string(), z.literal('NotContains'), z.unknown()]),
    z.tuple([z.string(), z.literal('ContainsAny'), z.array(z.unknown())]),
    z.tuple([z.string(), z.literal('NotContainsAny'), z.array(z.unknown())]),
    z.tuple([z.string(), z.literal('Lt'), z.unknown()]),
    z.tuple([z.string(), z.literal('Lte'), z.unknown()]),
    z.tuple([z.string(), z.literal('Gt'), z.unknown()]),
    z.tuple([z.string(), z.literal('Gte'), z.unknown()]),
    z.tuple([z.string(), z.literal('AnyLt'), z.unknown()]),
    z.tuple([z.string(), z.literal('AnyLte'), z.unknown()]),
    z.tuple([z.string(), z.literal('AnyGt'), z.unknown()]),
    z.tuple([z.string(), z.literal('AnyGte'), z.unknown()]),
    z.tuple([z.string(), z.literal('Glob'), z.string()]),
    z.tuple([z.string(), z.literal('NotGlob'), z.string()]),
    z.tuple([z.string(), z.literal('IGlob'), z.string()]),
    z.tuple([z.string(), z.literal('NotIGlob'), z.string()]),
    z.tuple([z.string(), z.literal('Regex'), z.string()]),
    z.tuple([
      z.string(),
      z.literal('ContainsAllTokens'),
      z.union([z.string(), z.array(z.string())]),
    ]),
    z.tuple([
      z.string(),
      z.literal('ContainsAllTokens'),
      z.union([z.string(), z.array(z.string())]),
      containsAllTokensFilterParamsSchema,
    ]),
    z.tuple([z.literal('Not'), filterSchema]),
    z.tuple([z.literal('And'), z.array(filterSchema)]),
    z.tuple([z.literal('Or'), z.array(filterSchema)]),
  ]),
)

export const genericFilterSchema = z.array(z.unknown())

/**
 * Patch-by-filter schema
 */
export const patchByFilterSchema = z.object({
  filters: genericFilterSchema.describe('Filter to select documents to patch'),
  patch: z.record(z.string(), z.unknown()).describe('Patch payload applied to matched documents'),
})

/**
 * Copy namespace schema
 */
export const copyFromNamespaceSchema = z
  .string()
  .min(1)
  .describe('Namespace identifier to copy documents from')

/**
 * Attribute schema union for namespace definitions
 */
export const attributeSchemaSchema = z
  .union([attributeTypeSchema, attributeSchemaConfigSchema])
  .describe('Attribute schema definition')

/**
 * Input schema for namespace write operations
 */
export const writeInputSchema = z.object({
  namespace: z.string().max(MAX_NAMESPACE_NAME_LENGTH).describe('Namespace to mutate'),
  copyFromNamespace: copyFromNamespaceSchema.optional(),
  deleteByFilter: genericFilterSchema.optional(),
  deleteCondition: genericFilterSchema.optional(),
  deletes: z.array(idSchema).optional(),
  disableBackpressure: z
    .boolean()
    .optional()
    .describe('Disable write throttling during high-volume ingestion'),
  distanceMetric: distanceMetricSchema.optional(),
  patchByFilter: patchByFilterSchema.optional(),
  patchColumns: columnsSchema.optional(),
  patchCondition: genericFilterSchema.optional(),
  patchRows: z.array(rowSchema).optional(),
  schema: z.record(z.string(), attributeSchemaSchema).optional(),
  upsertColumns: columnsSchema.optional(),
  upsertCondition: genericFilterSchema.optional(),
  upsertRows: z.array(rowSchema).optional(),
})

/**
 * Query billing schema converted to camelCase
 */
export const queryBillingSchema = z.object({
  billableLogicalBytesQueried: z.number(),
  billableLogicalBytesReturned: z.number(),
})

/**
 * Write billing schema converted to camelCase
 */
export const writeBillingSchema = z.object({
  billableLogicalBytesWritten: z.number(),
  query: queryBillingSchema.optional(),
})

/**
 * Output schema for namespace write responses
 */
export const writeOutputSchema = z.object({
  message: z.string(),
  rowsAffected: z.number(),
  rowsDeleted: z.number().optional(),
  rowsPatched: z.number().optional(),
  rowsUpserted: z.number().optional(),
  billing: writeBillingSchema,
})

/**
 * Input schema for namespace query operations
 */
export const queryInputSchema = z.object({
  namespace: z.string().max(MAX_NAMESPACE_NAME_LENGTH).describe('Namespace to query'),
  aggregateBy: aggregateBySchema.optional(),
  consistency: consistencySchema.optional(),
  distanceMetric: distanceMetricSchema.optional(),
  excludeAttributes: z.array(z.string()).optional(),
  filters: genericFilterSchema.optional(),
  groupBy: z.array(z.string()).optional(),
  includeAttributes: includeAttributesSchema.optional(),
  rankBy: genericRankBySchema.optional(),
  topK: z.int().positive().optional().describe('Number of results to return'),
  vectorEncoding: vectorEncodingSchema.optional(),
})

/**
 * Query payload schema shared between single-query and multi-query operations
 */
export const queryPayloadSchema = queryInputSchema.omit({ namespace: true })

/**
 * Client-side performance metrics schema
 */
export const clientPerformanceSchema = z.object({
  clientTotalMs: z.number(),
  clientCompressMs: z.number().optional(),
  clientResponseMs: z.number().optional(),
  clientBodyReadMs: z.number().optional(),
  clientDecompressMs: z.number().optional(),
  clientDeserializeMs: z.number().optional(),
})

/**
 * Combined server and client performance schema
 */
export const queryPerformanceSchema = z
  .object({
    approxNamespaceSize: z.number(),
    cacheHitRatio: z.number(),
    cacheTemperature: z.string(),
    exhaustiveSearchCount: z.number(),
    queryExecutionMs: z.number(),
    serverTotalMs: z.number(),
  })
  .merge(clientPerformanceSchema)

/**
 * Output schema for namespace query responses
 */
export const queryOutputSchema = z.object({
  billing: queryBillingSchema,
  performance: queryPerformanceSchema,
  aggregationGroups: z.array(z.record(z.string(), z.unknown())).optional(),
  aggregations: z.record(z.string(), z.unknown()).optional(),
  rows: z.array(rowSchema).optional(),
})

/**
 * Performance schema for multi-query responses
 */
export const multiQueryPerformanceSchema = z.object({
  approxNamespaceSize: z.number(),
  cacheHitRatio: z.number(),
  cacheTemperature: z.string(),
  exhaustiveSearchCount: z.number(),
  queryExecutionMs: z.number(),
  serverTotalMs: z.number(),
})

/**
 * Result schema for an individual multi-query response entry
 */
export const multiQueryResultSchema = z.object({
  aggregationGroups: z.array(z.record(z.string(), z.unknown())).optional(),
  aggregations: z.record(z.string(), z.unknown()).optional(),
  rows: z.array(rowSchema).optional(),
})

/**
 * Input schema for namespace multi-query operations
 */
export const multiQueryInputSchema = z.object({
  namespace: z.string().max(MAX_NAMESPACE_NAME_LENGTH).describe('Namespace to query'),
  queries: z
    .array(
      queryPayloadSchema.omit({
        consistency: true,
        vectorEncoding: true,
      }),
    )
    .min(1),
  consistency: consistencySchema.optional(),
  vectorEncoding: vectorEncodingSchema.optional(),
})

/**
 * Output schema for namespace multi-query responses
 */
export const multiQueryOutputSchema = z.object({
  billing: queryBillingSchema,
  performance: multiQueryPerformanceSchema,
  results: z.array(multiQueryResultSchema),
})

export type NamespaceQueryInput = z.infer<typeof queryInputSchema>
export type NamespaceQueryPayload = Omit<NamespaceQueryInput, 'namespace'>
export type NamespaceMultiQueryInput = z.infer<typeof multiQueryInputSchema>
export type NamespaceMultiQueryPayload = Omit<NamespaceMultiQueryInput, 'namespace'>
export type NamespaceWriteInput = z.infer<typeof writeInputSchema>
export type NamespaceWritePayload = Omit<NamespaceWriteInput, 'namespace'>
