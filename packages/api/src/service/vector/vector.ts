import type { z } from 'zod'
import { ORPCError } from '@orpc/server'

import type {
  attributeSchemaConfigSchema,
  attributeSchemaSchema,
  Bm25ClauseParamsInput,
  ContainsAllTokensConfigInput,
  FilterInput,
  genericFilterSchema,
  genericRankBySchema,
  NamespaceMultiQueryPayload,
  NamespaceQueryPayload,
  NamespaceWritePayload,
  RankByTextInput,
} from './types'
import type {
  AttributeSchema,
  AttributeSchemaConfig,
  Bm25ClauseParams,
  ContainsAllTokensFilterParams,
  Filter,
  FullTextSearch,
  NamespaceMultiQueryParams,
  NamespaceMultiQueryResponse,
  NamespaceQueryParams,
  NamespaceQueryResponse,
  NamespaceWriteParams,
  RankBy,
  RankByText,
} from '@turbopuffer/turbopuffer/resources'
import { getTurbopuffer } from '../../client/turbopuffer'
import { stripIdPrefix } from '../../utils'
import { filterSchema, rankBySchema, VectorType } from './types'

export class VectorService {
  constructor(
    private accountId: string,
    private type: VectorType = VectorType.PUBLIC,
  ) {}

  /**
   * Make Turbopuffer namespace from account ID and optional namespace
   */
  makeTpufNamespace(namespace?: string): string {
    const accId = stripIdPrefix(this.accountId)
    if (accId.length !== 32) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Invalid account ID',
      })
    }
    return `${accId}${this.type}_${namespace ?? ''}`
  }

  /**
   * Extract namespace from Turbopuffer namespace
   */
  private extractNamespace(tpufNamespace: string): string {
    return tpufNamespace.slice(32 + 1 + 1)
  }

  /**
   * Normalize ContainsAllTokens filter parameters
   */
  private normalizeContainsAllTokensParams(
    params?: ContainsAllTokensConfigInput,
  ): ContainsAllTokensFilterParams | undefined {
    if (!params) {
      return undefined
    }
    return params.lastAsPrefix === undefined
      ? undefined
      : {
          last_as_prefix: params.lastAsPrefix,
        }
  }

  /**
   * Transform filter inner (recursive)
   */
  private transformFilterInner(filter: z.infer<typeof filterSchema>): Filter {
    const firstElement = filter[0]
    if (firstElement === 'Not') {
      const nestedFilter = this.transformFilterInner(filter[1] as FilterInput)
      return ['Not', nestedFilter]
    }

    if (firstElement === 'And' || firstElement === 'Or') {
      const nestedFilters = (filter[1] as FilterInput[]).map((child) =>
        this.transformFilterInner(child),
      )
      return [firstElement, nestedFilters]
    }

    const operator = filter[1]
    if (operator === 'ContainsAllTokens') {
      const attributeName = filter[0]
      const tokens = filter[2]
      let normalizedConfig: ContainsAllTokensFilterParams | undefined
      if (filter.length === 4) {
        normalizedConfig = this.normalizeContainsAllTokensParams(filter[3])
      }

      if (Array.isArray(tokens)) {
        return normalizedConfig
          ? [attributeName, operator, tokens, normalizedConfig]
          : [attributeName, operator, tokens]
      }

      return normalizedConfig
        ? [attributeName, operator, tokens, normalizedConfig]
        : [attributeName, operator, tokens]
    }

    return filter as Filter
  }

  /**
   * Transform filter from generic format to Turbopuffer format
   */
  transformFilter(genericFilter?: z.infer<typeof genericFilterSchema>): Filter | undefined {
    if (!genericFilter) {
      return undefined
    }

    const filter = filterSchema.parse(genericFilter)

    return this.transformFilterInner(filter)
  }

  /**
   * Transform ANN config from camelCase to snake_case
   */
  private transformAnnConfig(
    ann: z.infer<typeof attributeSchemaConfigSchema>['ann'],
  ): boolean | AttributeSchemaConfig.AnnConfig | undefined {
    if (!ann || typeof ann === 'boolean') {
      return ann
    }

    return {
      distance_metric: ann.distanceMetric,
    }
  }

  /**
   * Transform full-text search config from camelCase to snake_case
   */
  private transformFullTextSearchConfig(
    fullTextSearch: z.infer<typeof attributeSchemaConfigSchema>['fullTextSearch'],
  ): FullTextSearch | undefined {
    if (fullTextSearch === undefined || typeof fullTextSearch === 'boolean') {
      return fullTextSearch
    }

    return {
      b: fullTextSearch.b,
      case_sensitive: fullTextSearch.caseSensitive,
      k1: fullTextSearch.k1,
      language: fullTextSearch.language,
      max_token_length: fullTextSearch.maxTokenLength,
      remove_stopwords: fullTextSearch.removeStopwords,
      stemming: fullTextSearch.stemming,
      tokenizer: fullTextSearch.tokenizer,
    }
  }

  /**
   * Transform attribute schema from camelCase to snake_case
   */
  private transformAttributeSchema(
    attribute: z.infer<typeof attributeSchemaSchema>,
  ): AttributeSchema {
    if (typeof attribute === 'string') {
      return attribute
    }

    return {
      type: attribute.type,
      ann: this.transformAnnConfig(attribute.ann),
      filterable: attribute.filterable,
      full_text_search: this.transformFullTextSearchConfig(attribute.fullTextSearch),
      regex: attribute.regex,
    }
  }

  /**
   * Transform schema from camelCase to snake_case
   */
  private transformSchema(schema: NamespaceWritePayload['schema']): NamespaceWriteParams['schema'] {
    if (!schema) {
      return undefined
    }

    const transformed: Record<string, AttributeSchema> = {}
    for (const key of Object.keys(schema)) {
      const value = schema[key]
      if (value === undefined) {
        continue
      }
      transformed[key] = this.transformAttributeSchema(value)
    }

    return transformed
  }

  /**
   * Transform patch-by-filter from camelCase to snake_case
   */
  private transformPatchByFilter(
    value: NamespaceWritePayload['patchByFilter'],
  ): NamespaceWriteParams.PatchByFilter | undefined {
    if (!value) {
      return undefined
    }

    const filters = this.transformFilter(value.filters)
    if (!filters) {
      return undefined
    }

    return {
      filters,
      patch: value.patch,
    }
  }

  /**
   * Build write params from payload
   */
  buildWriteParams(payload: NamespaceWritePayload): NamespaceWriteParams {
    const params: NamespaceWriteParams = {}

    if (payload.copyFromNamespace) {
      params.copy_from_namespace = payload.copyFromNamespace
    }

    const deleteByFilter = this.transformFilter(payload.deleteByFilter)
    if (deleteByFilter) {
      params.delete_by_filter = deleteByFilter
    }

    const deleteCondition = this.transformFilter(payload.deleteCondition)
    if (deleteCondition) {
      params.delete_condition = deleteCondition
    }

    if (payload.deletes) {
      params.deletes = payload.deletes
    }

    if (payload.disableBackpressure !== undefined) {
      params.disable_backpressure = payload.disableBackpressure
    }

    if (payload.distanceMetric) {
      params.distance_metric = payload.distanceMetric
    }

    const patchByFilter = this.transformPatchByFilter(payload.patchByFilter)
    if (patchByFilter) {
      params.patch_by_filter = patchByFilter
    }

    if (payload.patchColumns) {
      params.patch_columns = payload.patchColumns
    }

    const patchCondition = this.transformFilter(payload.patchCondition)
    if (patchCondition) {
      params.patch_condition = patchCondition
    }

    if (payload.patchRows) {
      params.patch_rows = payload.patchRows
    }

    const schema = this.transformSchema(payload.schema)
    if (schema) {
      params.schema = schema
    }

    if (payload.upsertColumns) {
      params.upsert_columns = payload.upsertColumns
    }

    const upsertCondition = this.transformFilter(payload.upsertCondition)
    if (upsertCondition) {
      params.upsert_condition = upsertCondition
    }

    if (payload.upsertRows) {
      params.upsert_rows = payload.upsertRows
    }

    return params
  }

  /**
   * Normalize BM25 clause parameters
   */
  private normalizeBm25ClauseParams(params?: Bm25ClauseParamsInput): Bm25ClauseParams | undefined {
    if (!params) {
      return undefined
    }

    return params.lastAsPrefix === undefined
      ? undefined
      : {
          last_as_prefix: params.lastAsPrefix,
        }
  }

  /**
   * Transform rank-by inner (recursive)
   */
  private transformRankByInner(rankBy: z.infer<typeof rankBySchema>): RankBy {
    const [first, second] = rankBy

    if ((first === 'Sum' || first === 'Max') && Array.isArray(second)) {
      return [first, second.map((child) => this.transformRankByInner(child) as RankByText)]
    }

    if (first === 'Product') {
      if (typeof second === 'number') {
        return ['Product', second, this.transformRankByInner(rankBy[2]) as RankByText]
      } else {
        return [
          'Product',
          this.transformRankByInner(second as RankByTextInput) as RankByText,
          rankBy[2] as number,
        ]
      }
    }

    if (second === 'BM25') {
      const params = this.normalizeBm25ClauseParams(rankBy[3])
      if (params) {
        return typeof rankBy[2] === 'string'
          ? [rankBy[0], 'BM25', rankBy[2], params]
          : [rankBy[0], 'BM25', rankBy[2], params]
      } else {
        return typeof rankBy[2] === 'string'
          ? [rankBy[0], 'BM25', rankBy[2]]
          : [rankBy[0], 'BM25', rankBy[2]]
      }
    }

    return rankBy as RankBy
  }

  /**
   * Transform rank-by from generic format to Turbopuffer format
   */
  transformRankBy(genericRankBy?: z.infer<typeof genericRankBySchema>): RankBy | undefined {
    if (!genericRankBy) {
      return undefined
    }

    // Validate with strict schema
    const rankBy = rankBySchema.parse(genericRankBy)

    return this.transformRankByInner(rankBy)
  }

  /**
   * Build query params from payload
   */
  buildQueryParams(payload: NamespaceQueryPayload): NamespaceQueryParams {
    const params: NamespaceQueryParams = {}

    if (payload.aggregateBy) {
      params.aggregate_by = payload.aggregateBy
    }

    if (payload.consistency) {
      params.consistency = payload.consistency
    }

    if (payload.distanceMetric) {
      params.distance_metric = payload.distanceMetric
    }

    if (payload.excludeAttributes) {
      params.exclude_attributes = payload.excludeAttributes
    }

    const filters = this.transformFilter(payload.filters)
    if (filters) {
      params.filters = filters
    }

    if (payload.groupBy) {
      params.group_by = payload.groupBy
    }

    if (payload.includeAttributes) {
      params.include_attributes = payload.includeAttributes
    }

    const rankBy = this.transformRankBy(payload.rankBy)
    if (rankBy) {
      params.rank_by = rankBy
    }

    if (payload.topK !== undefined) {
      params.top_k = payload.topK
    }

    if (payload.vectorEncoding) {
      params.vector_encoding = payload.vectorEncoding
    }

    return params
  }

  /**
   * Build multi-query params from payload
   */
  buildMultiQueryParams(payload: NamespaceMultiQueryPayload): NamespaceMultiQueryParams {
    const params: NamespaceMultiQueryParams = {
      queries: payload.queries.map((query) => this.buildQueryParams(query)),
    }

    if (payload.consistency) {
      params.consistency = payload.consistency
    }

    if (payload.vectorEncoding) {
      params.vector_encoding = payload.vectorEncoding
    }

    return params
  }

  /**
   * Transform performance metrics from snake_case to camelCase
   */
  private transformPerformance(performance: NamespaceQueryResponse['performance']) {
    return {
      approxNamespaceSize: performance.approx_namespace_size,
      cacheHitRatio: performance.cache_hit_ratio,
      cacheTemperature: performance.cache_temperature,
      exhaustiveSearchCount: performance.exhaustive_search_count,
      queryExecutionMs: performance.query_execution_ms,
      serverTotalMs: performance.server_total_ms,
      clientTotalMs: performance.client_total_ms,
      clientCompressMs: performance.client_compress_ms,
      clientResponseMs: performance.client_response_ms,
      clientBodyReadMs: performance.client_body_read_ms,
      clientDecompressMs: performance.client_decompress_ms,
      clientDeserializeMs: performance.client_deserialize_ms,
    }
  }

  /**
   * Transform multi-query performance metrics from snake_case to camelCase
   */
  private transformMultiQueryPerformance(performance: NamespaceMultiQueryResponse['performance']) {
    return {
      approxNamespaceSize: performance.approx_namespace_size,
      cacheHitRatio: performance.cache_hit_ratio,
      cacheTemperature: performance.cache_temperature,
      exhaustiveSearchCount: performance.exhaustive_search_count,
      queryExecutionMs: performance.query_execution_ms,
      serverTotalMs: performance.server_total_ms,
    }
  }

  /**
   * Build query response from Turbopuffer result
   */
  buildQueryResponse(result: NamespaceQueryResponse) {
    return {
      billing: {
        billableLogicalBytesQueried: result.billing.billable_logical_bytes_queried,
        billableLogicalBytesReturned: result.billing.billable_logical_bytes_returned,
      },
      performance: this.transformPerformance(result.performance),
      aggregationGroups: result.aggregation_groups,
      aggregations: result.aggregations,
      rows: result.rows,
    }
  }

  /**
   * Build multi-query response from Turbopuffer result
   */
  buildMultiQueryResponse(result: NamespaceMultiQueryResponse) {
    return {
      billing: {
        billableLogicalBytesQueried: result.billing.billable_logical_bytes_queried,
        billableLogicalBytesReturned: result.billing.billable_logical_bytes_returned,
      },
      performance: this.transformMultiQueryPerformance(result.performance),
      results: result.results.map((entry) => ({
        aggregationGroups: entry.aggregation_groups,
        aggregations: entry.aggregations,
        rows: entry.rows,
      })),
    }
  }

  /**
   * List all namespaces
   */
  async listNamespaces(input: { prefix?: string; limit?: number; cursor?: string }) {
    const tpuf = getTurbopuffer()
    const result = await tpuf.namespaces({
      prefix: this.makeTpufNamespace(input.prefix),
      page_size: input.limit ?? 100,
      cursor: input.cursor,
    })

    return {
      namespaces: result.namespaces.map((n) => this.extractNamespace(n.id)),
      hasMore: !!result.next_cursor,
      cursor: result.next_cursor || undefined,
    }
  }

  /**
   * Get namespace metadata
   */
  async getNamespace(namespace: string) {
    const tpuf = getTurbopuffer()
    const tpufNamespace = tpuf.namespace(this.makeTpufNamespace(namespace))
    const metadata = await tpufNamespace.metadata()

    const schema: Record<string, z.infer<typeof attributeSchemaConfigSchema>> = {}
    for (const [key, value] of Object.entries(metadata.schema)) {
      schema[key] = {
        type: value.type as z.infer<typeof attributeSchemaConfigSchema>['type'],
        ann:
          value.ann && typeof value.ann === 'object'
            ? {
                distanceMetric: value.ann.distance_metric,
              }
            : value.ann,
        filterable: value.filterable,
        fullTextSearch:
          value.full_text_search && typeof value.full_text_search === 'object'
            ? {
                b: value.full_text_search.b,
                caseSensitive: value.full_text_search.case_sensitive,
                k1: value.full_text_search.k1,
                language: value.full_text_search.language,
                maxTokenLength: value.full_text_search.max_token_length,
                removeStopwords: value.full_text_search.remove_stopwords,
                stemming: value.full_text_search.stemming,
                tokenizer: value.full_text_search.tokenizer,
              }
            : value.full_text_search,
        regex: value.regex,
      }
    }

    return {
      namespace: {
        schema,
        approxLogicalBytes: metadata.approx_logical_bytes,
        approxRowCount: metadata.approx_row_count,
        index: metadata.index,
        createdAt: new Date(metadata.created_at),
        updatedAt: new Date(metadata.updated_at),
      },
    }
  }

  /**
   * Delete a namespace
   */
  async deleteNamespace(namespace: string) {
    const tpuf = getTurbopuffer()
    const tpufNamespace = tpuf.namespace(this.makeTpufNamespace(namespace))
    await tpufNamespace.deleteAll()
  }

  /**
   * Query documents within a namespace
   */
  async query(namespace: string, payload: NamespaceQueryPayload) {
    const tpuf = getTurbopuffer()
    const tpufNamespace = tpuf.namespace(this.makeTpufNamespace(namespace))
    const result = await tpufNamespace.query(this.buildQueryParams(payload))

    return this.buildQueryResponse(result)
  }

  /**
   * Issue multiple concurrent queries within a namespace
   */
  async multiQuery(namespace: string, payload: NamespaceMultiQueryPayload) {
    const tpuf = getTurbopuffer()
    const tpufNamespace = tpuf.namespace(this.makeTpufNamespace(namespace))
    const result = await tpufNamespace.multiQuery(this.buildMultiQueryParams(payload))

    return this.buildMultiQueryResponse(result)
  }

  /**
   * Create, update, patch, or delete documents within a namespace
   */
  async write(namespace: string, payload: NamespaceWritePayload) {
    const tpuf = getTurbopuffer()
    const tpufNamespace = tpuf.namespace(this.makeTpufNamespace(namespace))
    const result = await tpufNamespace.write(this.buildWriteParams(payload))

    return {
      message: result.message,
      rowsAffected: result.rows_affected,
      rowsDeleted: result.rows_deleted,
      rowsPatched: result.rows_patched,
      rowsUpserted: result.rows_upserted,
      billing: {
        billableLogicalBytesWritten: result.billing.billable_logical_bytes_written,
        query: result.billing.query
          ? {
              billableLogicalBytesQueried: result.billing.query.billable_logical_bytes_queried,
              billableLogicalBytesReturned: result.billing.query.billable_logical_bytes_returned,
            }
          : undefined,
      },
    }
  }
}
