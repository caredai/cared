export interface RagflowToken {
  token: string
  name?: string
  createTime?: string
}

export interface RagflowResponse<Data = unknown> {
  code: RagflowCode
  message?: string
  data?: Data
}

export enum RagflowCode {
  ERROR = -1,
  SUCCESS = 0,
  NOT_EFFECTIVE = 10,
  EXCEPTION_ERROR = 100,
  ARGUMENT_ERROR = 101,
  DATA_ERROR = 102,
  OPERATING_ERROR = 103,
  CONNECTION_ERROR = 105,
  RUNNING = 106,
  PERMISSION_ERROR = 108,
  AUTHENTICATION_ERROR = 109,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  SERVER_ERROR = 500,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
}

// #region ParserConfig
export interface SnakeCaseParserConfig {
  auto_keywords?: number
  auto_questions?: number
  chunk_token_num?: number
  delimiter?: string
  html4excel?: boolean
  layout_recognize?: string
  tag_kb_ids?: string[]
  task_page_size?: number
  raptor?: {
    use_raptor: boolean
  }
  graphrag?: {
    use_graphrag: boolean
  }
}

export interface ParserConfig {
  autoKeywords?: number
  autoQuestions?: number
  chunkTokenNum?: number
  delimiter?: string
  html4excel?: boolean
  layoutRecognize?: string
  tagKbIds?: string[]
  taskPageSize?: number
  raptor?: {
    useRaptor: boolean
  }
  graphrag?: {
    useGraphrag: boolean
  }
}

export function fromSnakeCaseParserConfig(snake: SnakeCaseParserConfig): ParserConfig {
  return {
    autoKeywords: snake.auto_keywords,
    autoQuestions: snake.auto_questions,
    chunkTokenNum: snake.chunk_token_num,
    delimiter: snake.delimiter,
    html4excel: snake.html4excel,
    layoutRecognize: snake.layout_recognize,
    tagKbIds: snake.tag_kb_ids,
    taskPageSize: snake.task_page_size,
    raptor: snake.raptor ? { useRaptor: snake.raptor.use_raptor } : undefined,
    graphrag: snake.graphrag ? { useGraphrag: snake.graphrag.use_graphrag } : undefined,
  }
}

export function toSnakeCaseParserConfig(camel: ParserConfig): SnakeCaseParserConfig {
  return {
    auto_keywords: camel.autoKeywords,
    auto_questions: camel.autoQuestions,
    chunk_token_num: camel.chunkTokenNum,
    delimiter: camel.delimiter,
    html4excel: camel.html4excel,
    layout_recognize: camel.layoutRecognize,
    tag_kb_ids: camel.tagKbIds,
    task_page_size: camel.taskPageSize,
    raptor: camel.raptor ? { use_raptor: camel.raptor.useRaptor } : undefined,
    graphrag: camel.graphrag ? { use_graphrag: camel.graphrag.useGraphrag } : undefined,
  }
}
// #endregion

// #region Dataset
export interface SnakeCaseDataset {
  id: string
  name: string
  avatar: string | null
  description: string | null
  language: string
  embedding_model: string
  chunk_method: string
  parser_config: SnakeCaseParserConfig
  permission: 'me' | 'team'
  chunk_count: number
  document_count: number
  token_num: number
  status: string
  create_date: string
  create_time: number
  created_by: string
  update_date: string
  update_time: number
  tenant_id: string
  pagerank: number
  similarity_threshold: number
  vector_similarity_weight: number
}

export interface Dataset {
  id: string
  name: string
  avatar: string | null
  description: string | null
  language: string
  embeddingModel: string
  chunkMethod: string
  parserConfig: ParserConfig
  permission: 'me' | 'team'
  chunkCount: number
  documentCount: number
  tokenNum: number
  status: string
  createDate: string
  createTime: number
  createdBy: string
  updateDate: string
  updateTime: number
  tenantId: string
  pagerank: number
  similarityThreshold: number
  vectorSimilarityWeight: number
}

export function fromSnakeCaseDataset(snake: SnakeCaseDataset): Dataset {
  return {
    id: snake.id,
    name: snake.name,
    avatar: snake.avatar,
    description: snake.description,
    language: snake.language,
    embeddingModel: snake.embedding_model,
    chunkMethod: snake.chunk_method,
    parserConfig: fromSnakeCaseParserConfig(snake.parser_config),
    permission: snake.permission,
    chunkCount: snake.chunk_count,
    documentCount: snake.document_count,
    tokenNum: snake.token_num,
    status: snake.status,
    createDate: snake.create_date,
    createTime: snake.create_time,
    createdBy: snake.created_by,
    updateDate: snake.update_date,
    updateTime: snake.update_time,
    tenantId: snake.tenant_id,
    pagerank: snake.pagerank,
    similarityThreshold: snake.similarity_threshold,
    vectorSimilarityWeight: snake.vector_similarity_weight,
  }
}

export interface CreateDatasetOptions {
  name: string
  avatar: string
  description: string
  embeddingModel: string
  permission: 'me' | 'team'
  chunkMethod:
    | 'naive'
    | 'book'
    | 'email'
    | 'laws'
    | 'manual'
    | 'one'
    | 'paper'
    | 'picture'
    | 'presentation'
    | 'qa'
    | 'table'
    | 'tag'
  parserConfig: ParserConfig
  parseType: number
  pipelineId: string
}

export interface SnakeCaseCreateDatasetOptions {
  name: string
  avatar: string
  description: string
  embedding_model: string
  permission: 'me' | 'team'
  chunk_method:
    | 'naive'
    | 'book'
    | 'email'
    | 'laws'
    | 'manual'
    | 'one'
    | 'paper'
    | 'picture'
    | 'presentation'
    | 'qa'
    | 'table'
    | 'tag'
  parser_config: SnakeCaseParserConfig
  parse_type: number
  pipeline_id: string
}

export function toSnakeCaseCreateDatasetOptions(
  camel: Partial<CreateDatasetOptions>,
): Partial<SnakeCaseCreateDatasetOptions> {
  return {
    name: camel.name,
    avatar: camel.avatar,
    description: camel.description,
    embedding_model: camel.embeddingModel,
    permission: camel.permission,
    chunk_method: camel.chunkMethod,
    parser_config: camel.parserConfig ? toSnakeCaseParserConfig(camel.parserConfig) : undefined,
    parse_type: camel.parseType,
    pipeline_id: camel.pipelineId,
  }
}

export interface ListDatasetsParams {
  page?: number
  pageSize?: number
  orderby?: 'create_time' | 'update_time'
  desc?: boolean
  name?: string
  id?: string
}

export interface SnakeCaseListDatasetsParams {
  page?: number
  page_size?: number
  orderby?: 'create_time' | 'update_time'
  desc?: boolean
  name?: string
  id?: string
}

export function toSnakeCaseListDatasetsParams(
  camel: ListDatasetsParams,
): SnakeCaseListDatasetsParams {
  return {
    page: camel.page,
    page_size: camel.pageSize,
    orderby: camel.orderby,
    desc: camel.desc,
    name: camel.name,
    id: camel.id,
  }
}

export interface ListDatasetsResponse {
  data: Dataset[]
  total: number
}

export interface KnowledgeGraph {
  graph: {
    directed: boolean
    edges: {
      description: string
      keywords: string[]
      source: string
      sourceId: string[]
      srcId: string
      target: string
      tgtId: string
      weight: number
    }[]
    graph: {
      sourceId: string[]
    }
    multigraph: boolean
    nodes: {
      description: string
      entityName: string
      entityType: string
      id: string
      pagerank: number
      rank: number
      sourceId: string[]
    }[]
  }
  mindMap: object
}

export interface SnakeCaseKnowledgeGraph {
  graph: {
    directed: boolean
    edges: {
      description: string
      keywords: string[]
      source: string
      source_id: string[]
      src_id: string
      target: string
      tgt_id: string
      weight: number
    }[]
    graph: {
      source_id: string[]
    }
    multigraph: boolean
    nodes: {
      description: string
      entity_name: string
      entity_type: string
      id: string
      pagerank: number
      rank: number
      source_id: string[]
    }[]
  }
  mind_map: object
}

export function fromSnakeCaseKnowledgeGraph(snake: SnakeCaseKnowledgeGraph): KnowledgeGraph {
  return {
    graph: {
      directed: snake.graph.directed,
      edges: snake.graph.edges.map((edge) => ({
        description: edge.description,
        keywords: edge.keywords,
        source: edge.source,
        sourceId: edge.source_id,
        srcId: edge.src_id,
        target: edge.target,
        tgtId: edge.tgt_id,
        weight: edge.weight,
      })),
      graph: {
        sourceId: snake.graph.graph.source_id,
      },
      multigraph: snake.graph.multigraph,
      nodes: snake.graph.nodes.map((node) => ({
        description: node.description,
        entityName: node.entity_name,
        entityType: node.entity_type,
        id: node.id,
        pagerank: node.pagerank,
        rank: node.rank,
        sourceId: node.source_id,
      })),
    },
    mindMap: snake.mind_map,
  }
}

export interface GraphragTrace {
  beginAt: string
  chunkIds: string
  createDate: string
  createTime: number
  digest: string
  docId: string
  fromPage: number
  id: string
  priority: number
  processDuration: number
  progress: number
  progressMsg: string
  retryCount: number
  taskType: string
  toPage: number
  updateDate: string
  updateTime: number
}

export interface SnakeCaseGraphragTrace {
  begin_at: string
  chunk_ids: string
  create_date: string
  create_time: number
  digest: string
  doc_id: string
  from_page: number
  id: string
  priority: number
  process_duration: number
  progress: number
  progress_msg: string
  retry_count: number
  task_type: string
  to_page: number
  update_date: string
  update_time: number
}

export function fromSnakeCaseGraphragTrace(snake: SnakeCaseGraphragTrace): GraphragTrace {
  return {
    beginAt: snake.begin_at,
    chunkIds: snake.chunk_ids,
    createDate: snake.create_date,
    createTime: snake.create_time,
    digest: snake.digest,
    docId: snake.doc_id,
    fromPage: snake.from_page,
    id: snake.id,
    priority: snake.priority,
    processDuration: snake.process_duration,
    progress: snake.progress,
    progressMsg: snake.progress_msg,
    retryCount: snake.retry_count,
    taskType: snake.task_type,
    toPage: snake.to_page,
    updateDate: snake.update_date,
    updateTime: snake.update_time,
  }
}
// #endregion

// #region Document
export type RunStatus = 'UNSTART' | 'RUNNING' | 'CANCEL' | 'DONE' | 'FAIL'

export interface SnakeCaseDocument {
  id: string
  name: string
  type: string
  chunk_count: number
  token_count: number
  size: number
  location: string
  source_type: string
  status: string
  run: RunStatus
  dataset_id: string
  created_by: string
  create_date: string
  create_time: number
  update_date: string
  update_time: number
  process_begin_at: string | null
  process_duration: number
  progress: number
  progress_msg: string
  parser_config: SnakeCaseParserConfig
  chunk_method: string
  meta_fields: object
  pipeline_id: string
  thumbnail: string | null
}

export interface Document {
  id: string
  name: string
  type: string
  chunkCount: number
  tokenCount: number
  size: number
  location: string
  sourceType: string
  status: string
  run: RunStatus
  datasetId: string
  createdBy: string
  createDate: string
  createTime: number
  updateDate: string
  updateTime: number
  processBeginAt: string | null
  processDuration: number
  progress: number
  progressMsg: string
  parserConfig: ParserConfig
  chunkMethod: string
  metaFields: object
  pipelineId: string
  thumbnail: string | null
}

export function fromSnakeCaseDocument(snake: SnakeCaseDocument): Document {
  return {
    id: snake.id,
    name: snake.name,
    type: snake.type,
    chunkCount: snake.chunk_count,
    tokenCount: snake.token_count,
    size: snake.size,
    location: snake.location,
    sourceType: snake.source_type,
    status: snake.status,
    run: snake.run,
    datasetId: snake.dataset_id,
    createdBy: snake.created_by,
    createDate: snake.create_date,
    createTime: snake.create_time,
    updateDate: snake.update_date,
    updateTime: snake.update_time,
    processBeginAt: snake.process_begin_at,
    processDuration: snake.process_duration,
    progress: snake.progress,
    progressMsg: snake.progress_msg,
    parserConfig: fromSnakeCaseParserConfig(snake.parser_config),
    chunkMethod: snake.chunk_method,
    metaFields: snake.meta_fields,
    pipelineId: snake.pipeline_id,
    thumbnail: snake.thumbnail,
  }
}

export interface ListDocumentsParams {
  page?: number
  pageSize?: number
  orderby?: 'create_time' | 'update_time'
  desc?: boolean
  keywords?: string
  id?: string
  name?: string
  createTimeFrom?: number
  createTimeTo?: number
  suffix?: string[]
  run?: RunStatus[]
  metadataCondition?: object
}

export interface SnakeCaseListDocumentsParams {
  page?: number
  page_size?: number
  orderby?: 'create_time' | 'update_time'
  desc?: boolean
  keywords?: string
  id?: string
  name?: string
  create_time_from?: number
  create_time_to?: number
  suffix?: string[]
  run?: RunStatus[]
  metadata_condition?: object
}

export function toSnakeCaseListDocumentsParams(
  camel: ListDocumentsParams,
): SnakeCaseListDocumentsParams {
  return {
    page: camel.page,
    page_size: camel.pageSize,
    orderby: camel.orderby,
    desc: camel.desc,
    keywords: camel.keywords,
    id: camel.id,
    name: camel.name,
    create_time_from: camel.createTimeFrom,
    create_time_to: camel.createTimeTo,
    suffix: camel.suffix,
    run: camel.run,
    metadata_condition: camel.metadataCondition,
  }
}

export interface ListDocumentsResponse {
  docs: Document[]
  totalDatasets: number
}

export interface UpdateDocumentData {
  name: string
  metaFields: object
  chunkMethod: string
  parserConfig: ParserConfig
  enabled: boolean
}

export interface SnakeCaseUpdateDocumentData {
  name: string
  meta_fields: object
  chunk_method: string
  parser_config: SnakeCaseParserConfig
  enabled: 0 | 1
}

export function toSnakeCaseUpdateDocumentData(
  camel: Partial<UpdateDocumentData>,
): Partial<SnakeCaseUpdateDocumentData> {
  return {
    name: camel.name,
    meta_fields: camel.metaFields,
    chunk_method: camel.chunkMethod,
    parser_config: camel.parserConfig ? toSnakeCaseParserConfig(camel.parserConfig) : undefined,
    enabled: camel.enabled ? 1 : 0,
  }
}
// #endregion

// #region Chunk
export interface SnakeCaseChunk {
  id: string
  document_id: string
  content: string
  important_keywords: string[]
  positions: string[]
  available: boolean
  image_id: string
  docnm_kwd: string
}

export interface Chunk {
  id: string
  documentId: string
  content: string
  importantKeywords: string[]
  positions: string[]
  available: boolean
  imageId: string
  docnmKwd: string
}

export function fromSnakeCaseChunk(snake: SnakeCaseChunk): Chunk {
  return {
    id: snake.id,
    documentId: snake.document_id,
    content: snake.content,
    importantKeywords: snake.important_keywords,
    positions: snake.positions,
    available: snake.available,
    imageId: snake.image_id,
    docnmKwd: snake.docnm_kwd,
  }
}

export interface ListChunksParams {
  keywords?: string
  page?: number
  pageSize?: number
  id?: string
}

export interface SnakeCaseListChunksParams {
  keywords?: string
  page?: number
  page_size?: number
  id?: string
}

export function toSnakeCaseListChunksParams(camel: ListChunksParams): SnakeCaseListChunksParams {
  return {
    keywords: camel.keywords,
    page: camel.page,
    page_size: camel.pageSize,
    id: camel.id,
  }
}

export interface ListChunksResponse {
  chunks: Chunk[]
  doc: Document
  total: number
}

export interface UpdateChunkData {
  content: string
  importantKeywords: string[]
  available: boolean
}

export interface SnakeCaseUpdateChunkData {
  content: string
  important_keywords: string[]
  available: boolean
}

export function toSnakeCaseUpdateChunkData(
  camel: Partial<UpdateChunkData>,
): Partial<SnakeCaseUpdateChunkData> {
  return {
    content: camel.content,
    important_keywords: camel.importantKeywords,
    available: camel.available,
  }
}

export interface MetadataSummary {
  summary: Record<string, [string, number][]>
}

export interface UpdateMetadataOptions {
  selector?: {
    documentIds?: string[]
    metadataCondition?: {
      logic: 'and' | 'or'
      conditions: {
        name: string
        comparisonOperator: string
        value: string
      }[]
    }
  }
  updates?: {
    key: string
    match?: string
    value: string
  }[]
  deletes?: {
    key: string
    value?: string
  }[]
}

export interface SnakeCaseUpdateMetadataOptions {
  selector?: {
    document_ids?: string[]
    metadata_condition?: {
      logic: 'and' | 'or'
      conditions: {
        name: string
        comparison_operator: string
        value: string
      }[]
    }
  }
  updates?: {
    key: string
    match?: string
    value: string
  }[]
  deletes?: {
    key: string
    value?: string
  }[]
}

export function toSnakeCaseUpdateMetadataOptions(
  camel: UpdateMetadataOptions,
): SnakeCaseUpdateMetadataOptions {
  return {
    selector: camel.selector
      ? {
          document_ids: camel.selector.documentIds,
          metadata_condition: camel.selector.metadataCondition
            ? {
                logic: camel.selector.metadataCondition.logic,
                conditions: camel.selector.metadataCondition.conditions.map((c) => ({
                  name: c.name,
                  comparison_operator: c.comparisonOperator,
                  value: c.value,
                })),
              }
            : undefined,
        }
      : undefined,
    updates: camel.updates,
    deletes: camel.deletes,
  }
}

export interface UpdateMetadataResponse {
  updated: number
  matchedDocs: number
}

export interface SnakeCaseUpdateMetadataResponse {
  updated: number
  matched_docs: number
}

export function fromSnakeCaseUpdateMetadataResponse(
  snake: SnakeCaseUpdateMetadataResponse,
): UpdateMetadataResponse {
  return {
    updated: snake.updated,
    matchedDocs: snake.matched_docs,
  }
}

export interface RetrieveChunksParams {
  question: string
  datasetIds?: string[]
  documentIds?: string[]
  page?: number
  pageSize?: number
  similarityThreshold?: number
  vectorSimilarityWeight?: number
  topK?: number
  rerankId?: string
  keyword?: boolean
  highlight?: boolean
  crossLanguages?: string[]
  metadataCondition?: object
  useKg?: boolean
  tocEnhance?: boolean
}

export interface SnakeCaseRetrieveChunksParams {
  question: string
  dataset_ids?: string[]
  document_ids?: string[]
  page?: number
  page_size?: number
  similarity_threshold?: number
  vector_similarity_weight?: number
  top_k?: number
  rerank_id?: string
  keyword?: boolean
  highlight?: boolean
  cross_languages?: string[]
  metadata_condition?: object
  use_kg?: boolean
  toc_enhance?: boolean
}

export function toSnakeCaseRetrieveChunksParams(
  camel: RetrieveChunksParams,
): SnakeCaseRetrieveChunksParams {
  return {
    question: camel.question,
    dataset_ids: camel.datasetIds,
    document_ids: camel.documentIds,
    page: camel.page,
    page_size: camel.pageSize,
    similarity_threshold: camel.similarityThreshold,
    vector_similarity_weight: camel.vectorSimilarityWeight,
    top_k: camel.topK,
    rerank_id: camel.rerankId,
    keyword: camel.keyword,
    highlight: camel.highlight,
    cross_languages: camel.crossLanguages,
    metadata_condition: camel.metadataCondition,
    use_kg: camel.useKg,
    toc_enhance: camel.tocEnhance,
  }
}

export interface RetrievedChunk {
  content: string
  contentLtks: string
  documentId: string
  documentKeyword: string
  highlight: string
  id: string
  imageId: string
  importantKeywords: string[]
  kbId: string
  positions: string[]
  similarity: number
  termSimilarity: number
  vectorSimilarity: number
}

export interface SnakeCaseRetrievedChunk {
  content: string
  content_ltks: string
  document_id: string
  document_keyword: string
  highlight: string
  id: string
  image_id: string
  important_keywords: string[]
  kb_id: string
  positions: string[]
  similarity: number
  term_similarity: number
  vector_similarity: number
}

export function fromSnakeCaseRetrievedChunk(snake: SnakeCaseRetrievedChunk): RetrievedChunk {
  return {
    content: snake.content,
    contentLtks: snake.content_ltks,
    documentId: snake.document_id,
    documentKeyword: snake.document_keyword,
    highlight: snake.highlight,
    id: snake.id,
    imageId: snake.image_id,
    importantKeywords: snake.important_keywords,
    kbId: snake.kb_id,
    positions: snake.positions,
    similarity: snake.similarity,
    termSimilarity: snake.term_similarity,
    vectorSimilarity: snake.vector_similarity,
  }
}

export interface DocAgg {
  count: number
  docId: string
  docName: string
}

export interface SnakeCaseDocAgg {
  count: number
  doc_id: string
  doc_name: string
}

export function fromSnakeCaseDocAgg(snake: SnakeCaseDocAgg): DocAgg {
  return {
    count: snake.count,
    docId: snake.doc_id,
    docName: snake.doc_name,
  }
}

export interface RetrieveChunksResponse {
  chunks: RetrievedChunk[]
  docAggs: DocAgg[]
  total: number
}

export interface SnakeCaseRetrieveChunksResponse {
  chunks: SnakeCaseRetrievedChunk[]
  doc_aggs: SnakeCaseDocAgg[]
  total: number
}

export function fromSnakeCaseRetrieveChunksResponse(
  snake: SnakeCaseRetrieveChunksResponse,
): RetrieveChunksResponse {
  return {
    chunks: snake.chunks.map(fromSnakeCaseRetrievedChunk),
    docAggs: snake.doc_aggs.map(fromSnakeCaseDocAgg), // Use the new mapper
    total: snake.total,
  }
}

// #region File
export interface SnakeCaseFileItem {
  id: string
  name: string
  type: 'doc' | 'FOLDER' | 'VIRTUAL'
  size: number
  parent_id: string
  location: string
  create_time: number
}

export interface FileItem {
  id: string
  name: string
  type: 'doc' | 'FOLDER' | 'VIRTUAL'
  size: number
  parentId: string
  location: string
  createTime: number
}

export function fromSnakeCaseFileItem(snake: SnakeCaseFileItem): FileItem {
  return {
    id: snake.id,
    name: snake.name,
    type: snake.type,
    size: snake.size,
    parentId: snake.parent_id,
    location: snake.location,
    createTime: snake.create_time,
  }
}

export interface ListFilesParams {
  parentId?: string
  keywords?: string
  page?: number
  pageSize?: number
  orderby?: 'create_time'
  desc?: boolean
}

export interface SnakeCaseListFilesParams {
  parent_id?: string
  keywords?: string
  page?: number
  page_size?: number
  orderby?: 'create_time'
  desc?: boolean
}

export function toSnakeCaseListFilesParams(camel: ListFilesParams): SnakeCaseListFilesParams {
  return {
    parent_id: camel.parentId,
    keywords: camel.keywords,
    page: camel.page,
    page_size: camel.pageSize,
    orderby: camel.orderby,
    desc: camel.desc,
  }
}

export interface ListFilesResponse {
  total: number
  files: FileItem[]
  parentFolder: {
    id: string
    name: string
  }
}

export interface RootFolder {
  rootFolder: {
    id: string
    name: string
    type: 'FOLDER'
  }
}

export interface SnakeCaseRootFolder {
  root_folder: {
    id: string
    name: string
    type: 'FOLDER'
  }
}

export function fromSnakeCaseRootFolder(snake: SnakeCaseRootFolder): RootFolder {
  return {
    rootFolder: snake.root_folder,
  }
}

export interface ParentFolder {
  parentFolder: {
    id: string
    name: string
  }
}

export interface SnakeCaseParentFolder {
  parent_folder: {
    id: string
    name: string
  }
}

export function fromSnakeCaseParentFolder(snake: SnakeCaseParentFolder): ParentFolder {
  return {
    parentFolder: snake.parent_folder,
  }
}

export interface AllParentFolders {
  parentFolders: {
    id: string
    name: string
  }[]
}

export interface SnakeCaseAllParentFolders {
  parent_folders: {
    id: string
    name: string
  }[]
}

export function fromSnakeCaseAllParentFolders(
  snake: SnakeCaseAllParentFolders,
): AllParentFolders {
  return {
    parentFolders: snake.parent_folders,
  }
}
// #endregion
