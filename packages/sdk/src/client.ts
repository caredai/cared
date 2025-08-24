import { env } from './env'
import {
  createEmbeddingModel,
  createImageModel,
  createLanguageModel,
  createSpeechModel,
  createTranscriptionModel,
} from './model'
import { createCaredTrpcClient } from './trpc'

export type CaredClientOptions = {
  apiUrl?: string
} & (
  | {
      apiKey: string
    }
  | {
      accessToken: string | (() => string | Promise<string>) // user access token retrieved from the oauth app auth
    }
  | {
      sessionToken: string | (() => string | Promise<string>) // user session token retrieved from the login flow
      appId: string
    }
)

export class CaredClient {
  constructor(opts: CaredClientOptions) {
    this.opts = {
      ...opts,
      apiUrl: new URL(opts.apiUrl || env.CARED_API_URL || 'https://cared.dev').origin,
    }

    this.trpc = createCaredTrpcClient(this.opts)
  }

  private readonly opts: CaredClientOptions & Required<Pick<CaredClientOptions, 'apiUrl'>>

  trpc: CaredTrpcClient

  createLanguageModel(modelId: string) {
    return createLanguageModel(modelId, this.opts)
  }

  createImageModel(modelId: string) {
    return createImageModel(modelId, this.opts)
  }

  createSpeechModel(modelId: string) {
    return createSpeechModel(modelId, this.opts)
  }

  createTranscriptionModel(modelId: string) {
    return createTranscriptionModel(modelId, this.opts)
  }

  createEmbeddingModel(modelId: string) {
    return createEmbeddingModel(modelId, this.opts)
  }
}

export type CaredTrpcClient = ReturnType<typeof createCaredTrpcClient>

export async function makeHeaders(opts: CaredClientOptions) {
  const headers = new Headers()

  const { apiKey } = opts as {
    apiKey?: string
  }
  if (apiKey) {
    headers.set('X-API-KEY', apiKey)
    return headers
  }

  const { accessToken } = opts as {
    accessToken?: string | (() => string | Promise<string>)
  }
  if (accessToken) {
    const token = typeof accessToken === 'string' ? accessToken : await accessToken()
    headers.set('Authorization', 'Bearer ' + token)
    return headers
  }

  const { sessionToken, appId } = opts as {
    sessionToken: string | (() => string | Promise<string>)
    appId: string
  }
  const token = typeof sessionToken === 'string' ? sessionToken : await sessionToken()
  headers.set('Authorization', 'Bearer ' + token)
  headers.set('X-APP-ID', appId)
  return headers
}
