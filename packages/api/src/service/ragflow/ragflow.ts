import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import { Mutex } from 'async-mutex'
import * as cookie from 'cookie-es'

import type {
  AllParentFolders,
  Chunk,
  CreateDatasetOptions,
  Dataset,
  Document,
  FileItem,
  GraphragTrace,
  KnowledgeGraph,
  ListChunksParams,
  ListChunksResponse,
  ListDatasetsParams,
  ListDatasetsResponse,
  ListDocumentsParams,
  ListDocumentsResponse,
  ListFilesParams,
  ListFilesResponse,
  MetadataSummary,
  ParentFolder,
  RagflowResponse,
  RagflowToken,
  RetrieveChunksParams,
  RetrieveChunksResponse,
  RootFolder,
  SnakeCaseAllParentFolders,
  SnakeCaseChunk,
  SnakeCaseDataset,
  SnakeCaseDocument,
  SnakeCaseFileItem,
  SnakeCaseGraphragTrace,
  SnakeCaseKnowledgeGraph,
  SnakeCaseParentFolder,
  SnakeCaseRetrieveChunksResponse,
  SnakeCaseRootFolder,
  SnakeCaseUpdateMetadataResponse,
  UpdateChunkData,
  UpdateDocumentData,
  UpdateMetadataOptions,
  UpdateMetadataResponse,
} from './types'
import { env } from '../../env'
import {
  fromSnakeCaseAllParentFolders,
  fromSnakeCaseChunk,
  fromSnakeCaseDataset,
  fromSnakeCaseDocument,
  fromSnakeCaseFileItem,
  fromSnakeCaseGraphragTrace,
  fromSnakeCaseKnowledgeGraph,
  fromSnakeCaseParentFolder,
  fromSnakeCaseRetrieveChunksResponse,
  fromSnakeCaseRootFolder,
  fromSnakeCaseUpdateMetadataResponse,
  RagflowCode,
  toSnakeCaseCreateDatasetOptions,
  toSnakeCaseListChunksParams,
  toSnakeCaseListDatasetsParams,
  toSnakeCaseListDocumentsParams,
  toSnakeCaseListFilesParams,
  toSnakeCaseRetrieveChunksParams,
  toSnakeCaseUpdateChunkData,
  toSnakeCaseUpdateDocumentData,
  toSnakeCaseUpdateMetadataOptions,
} from './types'

export class RagflowService {
  // internal admin api url, in `admin/server/routes.py` of ragflow repo
  private readonly adminApiUrl = (env.RAGFLOW_ADMIN_API_URL ?? '') + '/api/v1/admin'
  // internal api url, under `api/apps` directory of ragflow repo
  private readonly apiUrl = (env.RAGFLOW_API_URL ?? '') + '/v1'
  // public api url, under `api/apps/sdk` directory of ragflow repo
  private readonly publicApiUrl = (env.RAGFLOW_API_URL ?? '') + '/api/v1'

  private readonly encryptedUserPassword: string

  private adminCookie: string | undefined
  private adminCookieExp = 0
  private mutex = new Mutex()

  constructor() {
    if (!env.RAGFLOW_ADMIN_PASSWORD) {
      throw new Error('RAGFLOW_ADMIN_PASSWORD is not set')
    }
    this.encryptedUserPassword = this.encryptPassword(env.RAGFLOW_ADMIN_PASSWORD)
  }

  private encryptPassword(password: string) {
    const pub =
      '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArq9XTUSeYr2+N1h3Afl/z8Dse/2yD0ZGrKwx+EEEcdsBLca9Ynmx3nIB5obmLlSfmskLpBo0UACBmB5rEjBp2Q2f3AG3Hjd4B+gNCG6BDaawuDlgANIhGnaTLrIqWrrcm4EMzJOnAOI1fgzJRsOOUEfaS318Eq9OVO3apEyCCt0lOQK6PuksduOjVxtltDav+guVAA068NrPYmRNabVKRNLJpL8w4D44sfth5RvZ3q9t+6RTArpEtc5sh5ChzvqPOzKGMXW83C95TxmXqpbK6olN4RevSfVjEAgCydH6HN6OhtOQEcnrU97r9H0iZOWwbw3pVrZiUkuRD1R56Wzs2wIDAQAB-----END PUBLIC KEY-----'
    const encrypted = crypto.publicEncrypt(
      {
        key: pub,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(Buffer.from(password).toString('base64')),
    )
    return encrypted.toString('base64')
  }

  private async loginAsAdmin() {
    return this.mutex.runExclusive(async () => {
      // 10s jitter
      if (this.adminCookie && this.adminCookieExp > Date.now() + 10000) {
        return this.adminCookie
      }

      const res = await fetch(`${this.adminApiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: env.RAGFLOW_ADMIN_USERNAME,
          password: this.encryptedUserPassword,
        }),
      })

      if (!res.ok) {
        throw new Error(`Failed to login as admin: ${res.statusText}`)
      }

      const cookies = []
      let maxAge = 3600 * 1000 // fallback to 1 hour
      for (const setCookie of res.headers.getSetCookie()) {
        const c = cookie.parseSetCookie(setCookie)
        cookies.push(c)
        const ma = c.expires ? Number(c.expires) - Date.now() : (c.maxAge ?? 0) * 1000
        if (ma && ma > 0 && ma < maxAge) {
          maxAge = ma
        }
      }

      this.adminCookie = cookies.map((c) => cookie.serialize(c.name, c.value)).join('; ')
      this.adminCookieExp = Date.now() + maxAge

      return this.adminCookie
    })
  }

  private async loginAsUser(username: string) {
    const res = await fetch(`${this.apiUrl}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: username,
        password: this.encryptedUserPassword,
      }),
    })

    if (!res.ok) {
      throw new Error(`Failed to login as user ${username}: ${res.statusText}`)
    }

    const cookies = []
    for (const setCookie of res.headers.getSetCookie()) {
      const c = cookie.parseSetCookie(setCookie)
      cookies.push(c)
    }

    return cookies.map((c) => cookie.serialize(c.name, c.value)).join('; ')
  }

  // TODO: cache
  async ensureUser(accountId: string) {
    const adminCookie = await this.loginAsAdmin()
    const username = `${accountId}@cared.dev`

    const res = await fetch(`${this.adminApiUrl}/users/${username}`, {
      headers: {
        Cookie: adminCookie,
      },
    })

    if (!res.ok) {
      throw new Error(`Failed to get user: ${res.statusText}`)
    }

    const user = (await res.json()) as RagflowResponse<unknown[]>
    if (!user.data?.length) {
      // User does not exist, create it
      const createRes = await fetch(`${this.adminApiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          username,
          password: this.encryptedUserPassword, // just use admin password as regular user password
        }),
      })

      if (!createRes.ok) {
        throw new Error(`Failed to create user: ${createRes.statusText}`)
      }
    }

    const userCookie = await this.loginAsUser(username)
    const tokenListRes = await fetch(`${this.apiUrl}/system/token_list`, {
      headers: {
        Cookie: userCookie,
      },
    })
    if (!tokenListRes.ok) {
      throw new Error(`Failed to get user token list: ${tokenListRes.statusText}`)
    }

    const tokens = (await tokenListRes.json()) as RagflowResponse<RagflowToken[]>
    if (!tokens.data?.length) {
      // No token, create one
      const createTokenRes = await fetch(`${this.apiUrl}/system/new_token`, {
        method: 'POST',
        headers: {
          Cookie: userCookie,
        },
      })
      if (!createTokenRes.ok) {
        throw new Error(`Failed to create api token: ${createTokenRes.statusText}`)
      }
    }
  }

  private async request(
    accountId: string,
    path: string,
    options: RequestInit,
    isJson = false,
  ): Promise<Response> {
    await this.ensureUser(accountId)

    const url = new URL(`${this.publicApiUrl}${path}`)
    const headers = new Headers(options.headers)

    if (isJson) {
      headers.set('Content-Type', 'application/json')
    }
    const apiToken = `${accountId}:${env.RAGFLOW_API_TOKEN!}`
    headers.set('Authorization', `Bearer ${apiToken}`)

    const res = await fetch(url.toString(), {
      ...options,
      headers,
    })

    if (!res.ok) {
      throw new Error(
        `Ragflow API error on ${options.method || 'GET'} ${path}: ${
          res.statusText
        } ${await res.text()}`,
      )
    }

    return res
  }

  private async fetchJson<T>(
    accountId: string,
    path: string,
    options: RequestInit,
    isJson = true,
  ): Promise<T> {
    const res = await this.request(accountId, path, options, isJson)

    const body = (await res.json()) as RagflowResponse<T>

    if (body.code !== RagflowCode.SUCCESS) {
      throw new Error(
        `Ragflow API error on ${options.method || 'GET'} ${path}: ${body.code} ${body.message}`,
      )
    }

    return body.data as T
  }

  async createDataset(
    accountId: string,
    options: { name: string } & Partial<Omit<CreateDatasetOptions, 'name'>>,
  ): Promise<Dataset> {
    const snakeOptions = toSnakeCaseCreateDatasetOptions(options)
    const snakeDataset = await this.fetchJson<SnakeCaseDataset>(accountId, '/datasets', {
      method: 'POST',
      body: JSON.stringify(snakeOptions),
    })
    return fromSnakeCaseDataset(snakeDataset)
  }

  async listDatasets(
    accountId: string,
    params?: ListDatasetsParams,
  ): Promise<ListDatasetsResponse> {
    const snakeParams = params ? toSnakeCaseListDatasetsParams(params) : undefined
    const path =
      '/datasets' +
      (snakeParams
        ? `?${new URLSearchParams(snakeParams as Record<string, string>).toString()}`
        : '')
    const response = await this.fetchJson<{ data: SnakeCaseDataset[]; total: number }>(
      accountId,
      path,
      {
        method: 'GET',
      },
    )
    return {
      data: response.data.map(fromSnakeCaseDataset),
      total: response.total,
    }
  }

  async updateDataset(
    accountId: string,
    datasetId: string,
    data: Partial<CreateDatasetOptions>,
  ): Promise<void> {
    const snakeData = toSnakeCaseCreateDatasetOptions(data)
    return this.fetchJson<void>(accountId, `/datasets/${datasetId}`, {
      method: 'PUT',
      body: JSON.stringify(snakeData),
    })
  }

  async deleteDatasets(accountId: string, ids: string[]): Promise<void> {
    return this.fetchJson<void>(accountId, '/datasets', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    })
  }

  async getKnowledgeGraph(accountId: string, datasetId: string): Promise<KnowledgeGraph> {
    const snakeKg = await this.fetchJson<SnakeCaseKnowledgeGraph>(
      accountId,
      `/datasets/${datasetId}/knowledge_graph`,
      {
        method: 'GET',
      },
    )
    return fromSnakeCaseKnowledgeGraph(snakeKg)
  }

  async deleteKnowledgeGraph(accountId: string, datasetId: string): Promise<void> {
    return this.fetchJson<void>(accountId, `/datasets/${datasetId}/knowledge_graph`, {
      method: 'DELETE',
    })
  }

  async runGraphrag(accountId: string, datasetId: string): Promise<{ graphragTaskId: string }> {
    const response = await this.fetchJson<{ graphrag_task_id: string }>(
      accountId,
      `/datasets/${datasetId}/run_graphrag`,
      {
        method: 'POST',
      },
    )
    return { graphragTaskId: response.graphrag_task_id }
  }

  async traceGraphrag(accountId: string, datasetId: string): Promise<GraphragTrace> {
    const snakeTrace = await this.fetchJson<SnakeCaseGraphragTrace>(
      accountId,
      `/datasets/${datasetId}/trace_graphrag`,
      {
        method: 'GET',
      },
    )
    return fromSnakeCaseGraphragTrace(snakeTrace)
  }

  async runRaptor(accountId: string, datasetId: string): Promise<{ raptorTaskId: string }> {
    const response = await this.fetchJson<{ raptor_task_id: string }>(
      accountId,
      `/datasets/${datasetId}/run_raptor`,
      {
        method: 'POST',
      },
    )
    return { raptorTaskId: response.raptor_task_id }
  }

  async traceRaptor(accountId: string, datasetId: string): Promise<GraphragTrace> {
    const snakeTrace = await this.fetchJson<SnakeCaseGraphragTrace>(
      accountId,
      `/datasets/${datasetId}/trace_raptor`,
      {
        method: 'GET',
      },
    )
    return fromSnakeCaseGraphragTrace(snakeTrace)
  }

  async uploadDocument(
    accountId: string,
    datasetId: string,
    file: Blob,
    fileName: string,
  ): Promise<Document> {
    const formData = new FormData()
    formData.append('file', file, fileName)

    const res = await this.request(
      accountId,
      `/datasets/${datasetId}/documents`,
      {
        method: 'POST',
        body: formData,
      },
      false,
    )

    const body = (await res.json()) as RagflowResponse<SnakeCaseDocument>
    if (body.code !== RagflowCode.SUCCESS) {
      throw new Error(`Failed to upload document: ${body.message}`)
    }
    return fromSnakeCaseDocument(body.data!)
  }

  async listDocuments(
    accountId: string,
    datasetId: string,
    params?: ListDocumentsParams,
  ): Promise<ListDocumentsResponse> {
    const snakeParams = params ? toSnakeCaseListDocumentsParams(params) : undefined
    const path =
      `/datasets/${datasetId}/documents` +
      (snakeParams
        ? `?${new URLSearchParams(snakeParams as Record<string, string>).toString()}`
        : '')
    const response = await this.fetchJson<{
      docs: SnakeCaseDocument[]
      total_datasets: number
    }>(accountId, path, {
      method: 'GET',
    })
    return {
      docs: response.docs.map(fromSnakeCaseDocument),
      totalDatasets: response.total_datasets,
    }
  }

  async updateDocument(
    accountId: string,
    datasetId: string,
    documentId: string,
    data: Partial<UpdateDocumentData>,
  ): Promise<Document> {
    const snakeData = toSnakeCaseUpdateDocumentData(data)
    const snakeDocument = await this.fetchJson<SnakeCaseDocument>(
      accountId,
      `/datasets/${datasetId}/documents/${documentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(snakeData),
      },
    )
    return fromSnakeCaseDocument(snakeDocument)
  }

  async downloadDocument(
    accountId: string,
    datasetId: string,
    documentId: string,
  ): Promise<Response> {
    return this.request(accountId, `/datasets/${datasetId}/documents/${documentId}`, {
      method: 'GET',
    })
  }

  async deleteDocuments(accountId: string, datasetId: string, ids: string[]): Promise<void> {
    return this.fetchJson<void>(accountId, `/datasets/${datasetId}/documents`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    })
  }

  async startChunking(accountId: string, datasetId: string, documentIds: string[]): Promise<void> {
    return this.fetchJson<void>(accountId, `/datasets/${datasetId}/chunks`, {
      method: 'POST',
      body: JSON.stringify({ document_ids: documentIds }),
    })
  }

  async stopChunking(accountId: string, datasetId: string, documentIds: string[]): Promise<void> {
    return this.fetchJson<void>(accountId, `/datasets/${datasetId}/chunks`, {
      method: 'DELETE',
      body: JSON.stringify({ document_ids: documentIds }),
    })
  }

  async addChunk(
    accountId: string,
    datasetId: string,
    documentId: string,
    content: string,
    options?: { importantKeywords?: string[]; questions?: string[] },
  ): Promise<{ chunk: Chunk }> {
    const snakeOptions = options
      ? {
          important_keywords: options.importantKeywords,
          questions: options.questions,
        }
      : {}
    const response = await this.fetchJson<{ chunk: SnakeCaseChunk }>(
      accountId,
      `/datasets/${datasetId}/documents/${documentId}/chunks`,
      {
        method: 'POST',
        body: JSON.stringify({ content, ...snakeOptions }),
      },
    )
    return {
      chunk: fromSnakeCaseChunk(response.chunk),
    }
  }

  async listChunks(
    accountId: string,
    datasetId: string,
    documentId: string,
    params?: ListChunksParams,
  ): Promise<ListChunksResponse> {
    const snakeParams = params ? toSnakeCaseListChunksParams(params) : undefined
    const path =
      `/datasets/${datasetId}/documents/${documentId}/chunks` +
      (snakeParams
        ? `?${new URLSearchParams(snakeParams as Record<string, string>).toString()}`
        : '')
    const response = await this.fetchJson<{
      chunks: SnakeCaseChunk[]
      doc: SnakeCaseDocument
      total: number
    }>(accountId, path, {
      method: 'GET',
    })
    return {
      chunks: response.chunks.map(fromSnakeCaseChunk),
      doc: fromSnakeCaseDocument(response.doc),
      total: response.total,
    }
  }

  async updateChunk(
    accountId: string,
    datasetId: string,
    documentId: string,
    chunkId: string,
    data: Partial<UpdateChunkData>,
  ): Promise<void> {
    const snakeData = toSnakeCaseUpdateChunkData(data)
    return this.fetchJson<void>(
      accountId,
      `/datasets/${datasetId}/documents/${documentId}/chunks/${chunkId}`,
      {
        method: 'PUT',
        body: JSON.stringify(snakeData),
      },
    )
  }

  async deleteChunks(
    accountId: string,
    datasetId: string,
    documentId: string,
    chunkIds: string[],
  ): Promise<void> {
    return this.fetchJson<void>(
      accountId,
      `/datasets/${datasetId}/documents/${documentId}/chunks`,
      {
        method: 'DELETE',
        body: JSON.stringify({ chunk_ids: chunkIds }),
      },
    )
  }

  async getMetadataSummary(accountId: string, datasetId: string): Promise<MetadataSummary> {
    return this.fetchJson<MetadataSummary>(accountId, `/datasets/${datasetId}/metadata/summary`, {
      method: 'GET',
    })
  }

  async updateMetadata(
    accountId: string,
    datasetId: string,
    options: UpdateMetadataOptions,
  ): Promise<UpdateMetadataResponse> {
    const snakeOptions = toSnakeCaseUpdateMetadataOptions(options)
    const snakeResponse = await this.fetchJson<SnakeCaseUpdateMetadataResponse>(
      accountId,
      `/datasets/${datasetId}/metadata/update`,
      {
        method: 'POST',
        body: JSON.stringify(snakeOptions),
      },
    )
    return fromSnakeCaseUpdateMetadataResponse(snakeResponse)
  }

  async retrieveChunks(
    accountId: string,
    params: RetrieveChunksParams,
  ): Promise<RetrieveChunksResponse> {
    const snakeParams = toSnakeCaseRetrieveChunksParams(params)
    const snakeResponse = await this.fetchJson<SnakeCaseRetrieveChunksResponse>(
      accountId,
      '/retrieval',
      {
        method: 'POST',
        body: JSON.stringify(snakeParams),
      },
    )
    return fromSnakeCaseRetrieveChunksResponse(snakeResponse)
  }

  async uploadFile(
    accountId: string,
    file: Blob,
    fileName: string,
    parentId?: string,
  ): Promise<FileItem[]> {
    const formData = new FormData()
    formData.append('file', file, fileName)
    if (parentId) {
      formData.append('parent_id', parentId)
    }

    const res = await this.request(
      accountId,
      '/file/upload',
      {
        method: 'POST',
        body: formData,
      },
      false,
    )
    const body = (await res.json()) as RagflowResponse<SnakeCaseFileItem[]>
    if (body.code !== RagflowCode.SUCCESS) {
      throw new Error(`Failed to upload file: ${body.message}`)
    }
    return body.data!.map(fromSnakeCaseFileItem)
  }

  async createFileOrFolder(
    accountId: string,
    name: string,
    type: 'FOLDER' | 'VIRTUAL',
    parentId?: string,
  ): Promise<FileItem> {
    const snakeFileItem = await this.fetchJson<SnakeCaseFileItem>(accountId, '/file/create', {
      method: 'POST',
      body: JSON.stringify({ name, type, parent_id: parentId }),
    })
    return fromSnakeCaseFileItem(snakeFileItem)
  }

  async listFiles(accountId: string, params?: ListFilesParams): Promise<ListFilesResponse> {
    const snakeParams = params ? toSnakeCaseListFilesParams(params) : undefined
    const path =
      '/file/list' +
      (snakeParams
        ? `?${new URLSearchParams(snakeParams as Record<string, string>).toString()}`
        : '')
    const response = await this.fetchJson<{
      total: number
      files: SnakeCaseFileItem[]
      parent_folder: { id: string; name: string }
    }>(accountId, path, {
      method: 'GET',
    })
    return {
      total: response.total,
      files: response.files.map(fromSnakeCaseFileItem),
      parentFolder: response.parent_folder,
    }
  }

  async getRootFolder(accountId: string): Promise<RootFolder> {
    const snakeFolder = await this.fetchJson<SnakeCaseRootFolder>(accountId, '/file/root_folder', {
      method: 'GET',
    })
    return fromSnakeCaseRootFolder(snakeFolder)
  }

  async getParentFolder(accountId: string, fileId: string): Promise<ParentFolder> {
    const snakeFolder = await this.fetchJson<SnakeCaseParentFolder>(
      accountId,
      `/file/parent_folder?file_id=${fileId}`,
      {
        method: 'GET',
      },
    )
    return fromSnakeCaseParentFolder(snakeFolder)
  }

  async getAllParentFolders(accountId: string, fileId: string): Promise<AllParentFolders> {
    const snakeFolders = await this.fetchJson<SnakeCaseAllParentFolders>(
      accountId,
      `/file/all_parent_folder?file_id=${fileId}`,
      {
        method: 'GET',
      },
    )
    return fromSnakeCaseAllParentFolders(snakeFolders)
  }

  async deleteFiles(accountId: string, fileIds: string[]): Promise<void> {
    return this.fetchJson<void>(accountId, '/file/rm', {
      method: 'POST',
      body: JSON.stringify({ file_ids: fileIds }),
    })
  }

  async renameFile(accountId: string, fileId: string, name: string): Promise<void> {
    return this.fetchJson<void>(accountId, '/file/rename', {
      method: 'POST',
      body: JSON.stringify({ file_id: fileId, name }),
    })
  }

  async downloadFile(accountId: string, fileId: string): Promise<Response> {
    return this.request(accountId, `/file/get/${fileId}`, {
      method: 'GET',
    })
  }

  async moveFiles(accountId: string, srcFileIds: string[], destFileId: string): Promise<void> {
    return this.fetchJson<void>(accountId, '/file/mv', {
      method: 'POST',
      body: JSON.stringify({ src_file_ids: srcFileIds, dest_file_id: destFileId }),
    })
  }

  async convertFilesToDocuments(
    accountId: string,
    fileIds: string[],
    kbIds: string[],
  ): Promise<{ id: string; fileId: string; documentId: string }[]> {
    const response = await this.fetchJson<{ id: string; file_id: string; document_id: string }[]>(
      accountId,
      '/file/convert',
      {
        method: 'POST',
        body: JSON.stringify({ file_ids: fileIds, kb_ids: kbIds }),
      },
    )
    return response.map((item) => ({
      id: item.id,
      fileId: item.file_id,
      documentId: item.document_id,
    }))
  }
}

export const ragflowService = new RagflowService()
