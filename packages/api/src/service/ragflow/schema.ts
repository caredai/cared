import { z } from 'zod/v4'

const ChunkMethodEnum = z.enum([
  'naive',
  'book',
  'email',
  'laws',
  'manual',
  'one',
  'paper',
  'picture',
  'presentation',
  'qa',
  'table',
  'tag',
])

const ParserConfigSchema = z.object({
  autoKeywords: z.number().optional(),
  autoQuestions: z.number().optional(),
  chunkTokenNum: z.number().optional(),
  delimiter: z.string().optional(),
  html4excel: z.boolean().optional(),
  layoutRecognize: z.string().optional(),
  tagKbIds: z.array(z.string()).optional(),
  taskPageSize: z.number().optional(),
  raptor: z.object({ useRaptor: z.boolean() }).optional(),
  graphrag: z.object({ useGraphrag: z.boolean() }).optional(),
})

export const CreateDatasetOptionsSchema = z.object({
  name: z.string(),
  avatar: z.string().optional(),
  description: z.string().optional(),
  embeddingModel: z.string().optional(),
  permission: z.enum(['me', 'team']).optional(),
  chunkMethod: ChunkMethodEnum.optional(),
  parserConfig: ParserConfigSchema.optional(),
  parseType: z.number().optional(),
  pipelineId: z.string().optional(),
})

export const UpdateDatasetOptionsSchema = CreateDatasetOptionsSchema.omit({ name: true })

export const ListDatasetsParamsSchema = z
  .object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    orderby: z.enum(['create_time', 'update_time']).optional(),
    desc: z.boolean().optional(),
    name: z.string().optional(),
    id: z.string().optional(),
  })
  .optional()

export const UpdateMetadataOptionsSchema = z.object({
  selector: z
    .object({
      documentIds: z.array(z.string()).optional(),
      metadataCondition: z
        .object({
          logic: z.enum(['and', 'or']),
          conditions: z.array(
            z.object({
              name: z.string(),
              comparisonOperator: z.string(),
              value: z.string(),
            }),
          ),
        })
        .optional(),
    })
    .optional(),
  updates: z
    .array(
      z.object({
        key: z.string(),
        match: z.string().optional(),
        value: z.string(),
      }),
    )
    .optional(),
  deletes: z
    .array(
      z.object({
        key: z.string(),
        value: z.string().optional(),
      }),
    )
    .optional(),
})

export const RetrieveChunksParamsSchema = z.object({
  question: z.string(),
  datasetIds: z.array(z.string()).optional(),
  documentIds: z.array(z.string()).optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
  similarityThreshold: z.number().optional(),
  vectorSimilarityWeight: z.number().optional(),
  topK: z.number().optional(),
  rerankId: z.string().optional(),
  keyword: z.boolean().optional(),
  highlight: z.boolean().optional(),
  crossLanguages: z.array(z.string()).optional(),
  metadataCondition: z.object({}).passthrough().optional(),
  useKg: z.boolean().optional(),
  tocEnhance: z.boolean().optional(),
})

export const ListDocumentsParamsSchema = z
  .object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    orderby: z.enum(['create_time', 'update_time']).optional(),
    desc: z.boolean().optional(),
    keywords: z.string().optional(),
    id: z.string().optional(),
    name: z.string().optional(),
    createTimeFrom: z.number().optional(),
    createTimeTo: z.number().optional(),
    suffix: z.array(z.string()).optional(),
    run: z.array(z.enum(['UNSTART', 'RUNNING', 'CANCEL', 'DONE', 'FAIL'])).optional(),
    metadataCondition: z.object({}).passthrough().optional(),
  })
  .optional()

export const UpdateDocumentDataSchema = z.object({
  name: z.string().optional(),
  metaFields: z.object({}).passthrough().optional(),
  chunkMethod: z.string().optional(),
  parserConfig: ParserConfigSchema.optional(),
  enabled: z.boolean().optional(),
})

export const AddChunkOptionsSchema = z.object({
  importantKeywords: z.array(z.string()).optional(),
  questions: z.array(z.string()).optional(),
})

export const ListChunksParamsSchema = z
  .object({
    keywords: z.string().optional(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
    id: z.string().optional(),
  })
  .optional()

export const UpdateChunkDataSchema = z.object({
  content: z.string().optional(),
  importantKeywords: z.array(z.string()).optional(),
  available: z.boolean().optional(),
})

export const CreateFileOrFolderSchema = z.object({
  name: z.string(),
  type: z.enum(['FOLDER', 'VIRTUAL']),
  parentId: z.string().optional(),
})

export const ListFilesParamsSchema = z
  .object({
    parentId: z.string().optional(),
    keywords: z.string().optional(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
    orderby: z.enum(['create_time']).optional(),
    desc: z.boolean().optional(),
  })
  .optional()

export const RenameFileSchema = z.object({
  fileId: z.string(),
  name: z.string(),
})

export const MoveFilesSchema = z.object({
  srcFileIds: z.array(z.string()),
  destFileId: z.string(),
})

export const ConvertFilesToDocumentsSchema = z.object({
  fileIds: z.array(z.string()),
  kbIds: z.array(z.string()),
})
