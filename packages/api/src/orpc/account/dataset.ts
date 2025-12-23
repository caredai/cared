import { z } from 'zod/v4'

import { protectedProcedure } from '../../orpc'
import {
  AddChunkOptionsSchema,
  ConvertFilesToDocumentsSchema,
  CreateDatasetOptionsSchema,
  CreateFileOrFolderSchema,
  ListChunksParamsSchema,
  ListDatasetsParamsSchema,
  ListDocumentsParamsSchema,
  ListFilesParamsSchema,
  MoveFilesSchema,
  ragflowService,
  RenameFileSchema,
  RetrieveChunksParamsSchema,
  UpdateChunkDataSchema,
  UpdateDatasetOptionsSchema,
  UpdateDocumentDataSchema,
  UpdateMetadataOptionsSchema,
} from '../../service/ragflow'

export const datasetRouter = {
  create: protectedProcedure
    .route({
      method: 'POST',
      path: '/datasets',
      tags: ['datasets'],
      summary: 'Create a dataset',
    })
    .input(CreateDatasetOptionsSchema)
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.createDataset(accountId, input)
    }),

  list: protectedProcedure
    .route({
      method: 'GET',
      path: '/datasets',
      tags: ['datasets'],
      summary: 'List datasets',
    })
    .input(ListDatasetsParamsSchema)
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.listDatasets(accountId, input)
    }),

  update: protectedProcedure
    .route({
      method: 'PUT',
      path: '/datasets/{datasetId}',
      tags: ['datasets'],
      summary: 'Update a dataset',
    })
    .input(z.object({ datasetId: z.string(), data: UpdateDatasetOptionsSchema }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.updateDataset(accountId, input.datasetId, input.data)
    }),

  delete: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/datasets',
      tags: ['datasets'],
      summary: 'Delete datasets',
    })
    .input(z.object({ ids: z.array(z.string()) }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.deleteDatasets(accountId, input.ids)
    }),

  getKnowledgeGraph: protectedProcedure
    .route({
      method: 'GET',
      path: '/datasets/{datasetId}/knowledge_graph',
      tags: ['datasets'],
      summary: 'Get knowledge graph',
    })
    .input(z.object({ datasetId: z.string() }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.getKnowledgeGraph(accountId, input.datasetId)
    }),

  deleteKnowledgeGraph: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/datasets/{datasetId}/knowledge_graph',
      tags: ['datasets'],
      summary: 'Delete knowledge graph',
    })
    .input(z.object({ datasetId: z.string() }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.deleteKnowledgeGraph(accountId, input.datasetId)
    }),

  runGraphrag: protectedProcedure
    .route({
      method: 'POST',
      path: '/datasets/{datasetId}/run_graphrag',
      tags: ['datasets'],
      summary: 'Run graphrag',
    })
    .input(z.object({ datasetId: z.string() }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.runGraphrag(accountId, input.datasetId)
    }),

  traceGraphrag: protectedProcedure
    .route({
      method: 'GET',
      path: '/datasets/{datasetId}/trace_graphrag',
      tags: ['datasets'],
      summary: 'Trace graphrag',
    })
    .input(z.object({ datasetId: z.string() }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.traceGraphrag(accountId, input.datasetId)
    }),

  runRaptor: protectedProcedure
    .route({
      method: 'POST',
      path: '/datasets/{datasetId}/run_raptor',
      tags: ['datasets'],
      summary: 'Run raptor',
    })
    .input(z.object({ datasetId: z.string() }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.runRaptor(accountId, input.datasetId)
    }),

  traceRaptor: protectedProcedure
    .route({
      method: 'GET',
      path: '/datasets/{datasetId}/trace_raptor',
      tags: ['datasets'],
      summary: 'Trace raptor',
    })
    .input(z.object({ datasetId: z.string() }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.traceRaptor(accountId, input.datasetId)
    }),

  listDocuments: protectedProcedure
    .route({
      method: 'GET',
      path: '/datasets/{datasetId}/documents',
      tags: ['datasets'],
      summary: 'List documents',
    })
    .input(z.object({ datasetId: z.string(), params: ListDocumentsParamsSchema }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.listDocuments(accountId, input.datasetId, input.params)
    }),

  updateDocument: protectedProcedure
    .route({
      method: 'PUT',
      path: '/datasets/{datasetId}/documents/{documentId}',
      tags: ['datasets'],
      summary: 'Update a document',
    })
    .input(
      z.object({
        datasetId: z.string(),
        documentId: z.string(),
        data: UpdateDocumentDataSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.updateDocument(accountId, input.datasetId, input.documentId, input.data)
    }),

  deleteDocuments: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/datasets/{datasetId}/documents',
      tags: ['datasets'],
      summary: 'Delete documents',
    })
    .input(z.object({ datasetId: z.string(), ids: z.array(z.string()) }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.deleteDocuments(accountId, input.datasetId, input.ids)
    }),

  startChunking: protectedProcedure
    .route({
      method: 'POST',
      path: '/datasets/{datasetId}/chunks',
      tags: ['datasets'],
      summary: 'Start chunking',
    })
    .input(z.object({ datasetId: z.string(), documentIds: z.array(z.string()) }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.startChunking(accountId, input.datasetId, input.documentIds)
    }),

  stopChunking: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/datasets/{datasetId}/chunks',
      tags: ['datasets'],
      summary: 'Stop chunking',
    })
    .input(z.object({ datasetId: z.string(), documentIds: z.array(z.string()) }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.stopChunking(accountId, input.datasetId, input.documentIds)
    }),

  addChunk: protectedProcedure
    .route({
      method: 'POST',
      path: '/datasets/{datasetId}/documents/{documentId}/chunks',
      tags: ['datasets'],
      summary: 'Add a chunk',
    })
    .input(
      z.object({
        datasetId: z.string(),
        documentId: z.string(),
        content: z.string(),
        options: AddChunkOptionsSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.addChunk(
        accountId,
        input.datasetId,
        input.documentId,
        input.content,
        input.options,
      )
    }),

  listChunks: protectedProcedure
    .route({
      method: 'GET',
      path: '/datasets/{datasetId}/documents/{documentId}/chunks',
      tags: ['datasets'],
      summary: 'List chunks',
    })
    .input(
      z.object({ datasetId: z.string(), documentId: z.string(), params: ListChunksParamsSchema }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.listChunks(accountId, input.datasetId, input.documentId, input.params)
    }),

  updateChunk: protectedProcedure
    .route({
      method: 'PUT',
      path: '/datasets/{datasetId}/documents/{documentId}/chunks/{chunkId}',
      tags: ['datasets'],
      summary: 'Update a chunk',
    })
    .input(
      z.object({
        datasetId: z.string(),
        documentId: z.string(),
        chunkId: z.string(),
        data: UpdateChunkDataSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.updateChunk(
        accountId,
        input.datasetId,
        input.documentId,
        input.chunkId,
        input.data,
      )
    }),

  deleteChunks: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/datasets/{datasetId}/documents/{documentId}/chunks',
      tags: ['datasets'],
      summary: 'Delete chunks',
    })
    .input(
      z.object({ datasetId: z.string(), documentId: z.string(), chunkIds: z.array(z.string()) }),
    )
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.deleteChunks(
        accountId,
        input.datasetId,
        input.documentId,
        input.chunkIds,
      )
    }),

  getMetadataSummary: protectedProcedure
    .route({
      method: 'GET',
      path: '/datasets/{datasetId}/metadata/summary',
      tags: ['datasets'],
      summary: 'Get metadata summary',
    })
    .input(z.object({ datasetId: z.string() }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.getMetadataSummary(accountId, input.datasetId)
    }),

  updateMetadata: protectedProcedure
    .route({
      method: 'POST',
      path: '/datasets/{datasetId}/metadata/update',
      tags: ['datasets'],
      summary: 'Update metadata',
    })
    .input(z.object({ datasetId: z.string(), options: UpdateMetadataOptionsSchema }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.updateMetadata(accountId, input.datasetId, input.options)
    }),

  retrieveChunks: protectedProcedure
    .route({
      method: 'POST',
      path: '/retrieval',
      tags: ['datasets'],
      summary: 'Retrieve chunks',
    })
    .input(RetrieveChunksParamsSchema)
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.retrieveChunks(accountId, input)
    }),

  createFileOrFolder: protectedProcedure
    .route({
      method: 'POST',
      path: '/files/create',
      tags: ['datasets'],
      summary: 'Create a file or folder',
    })
    .input(CreateFileOrFolderSchema)
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.createFileOrFolder(accountId, input.name, input.type, input.parentId)
    }),

  listFiles: protectedProcedure
    .route({
      method: 'GET',
      path: '/files',
      tags: ['datasets'],
      summary: 'List files',
    })
    .input(ListFilesParamsSchema)
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.listFiles(accountId, input)
    }),

  getRootFolder: protectedProcedure
    .route({
      method: 'GET',
      path: '/files/root_folder',
      tags: ['datasets'],
      summary: 'Get root folder',
    })
    .input(z.object({}))
    .handler(async ({ context }) => {
      const accountId = context.auth.accountId
      return ragflowService.getRootFolder(accountId)
    }),

  getParentFolder: protectedProcedure
    .route({
      method: 'GET',
      path: '/files/parent_folder',
      tags: ['datasets'],
      summary: 'Get parent folder',
    })
    .input(z.object({ fileId: z.string() }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.getParentFolder(accountId, input.fileId)
    }),

  getAllParentFolders: protectedProcedure
    .route({
      method: 'GET',
      path: '/files/all_parent_folders',
      tags: ['datasets'],
      summary: 'Get all parent folders',
    })
    .input(z.object({ fileId: z.string() }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.getAllParentFolders(accountId, input.fileId)
    }),

  deleteFiles: protectedProcedure
    .route({
      method: 'POST',
      path: '/files/delete',
      tags: ['datasets'],
      summary: 'Delete files',
    })
    .input(z.object({ fileIds: z.array(z.string()) }))
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.deleteFiles(accountId, input.fileIds)
    }),

  renameFile: protectedProcedure
    .route({
      method: 'POST',
      path: '/files/rename',
      tags: ['datasets'],
      summary: 'Rename a file',
    })
    .input(RenameFileSchema)
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.renameFile(accountId, input.fileId, input.name)
    }),

  moveFiles: protectedProcedure
    .route({
      method: 'POST',
      path: '/files/move',
      tags: ['datasets'],
      summary: 'Move files',
    })
    .input(MoveFilesSchema)
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.moveFiles(accountId, input.srcFileIds, input.destFileId)
    }),

  convertFilesToDocuments: protectedProcedure
    .route({
      method: 'POST',
      path: '/files/convert',
      tags: ['datasets'],
      summary: 'Convert files to documents',
    })
    .input(ConvertFilesToDocumentsSchema)
    .handler(async ({ context, input }) => {
      const accountId = context.auth.accountId
      return ragflowService.convertFilesToDocuments(accountId, input.fileIds, input.kbIds)
    }),
}
