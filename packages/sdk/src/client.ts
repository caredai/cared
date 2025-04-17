import { env } from './env'
import { createLanguageModel } from './model'
import { createOwnxTrpcClient } from './trpc'

export type OwnxClientOptions = {
  apiUrl?: string
} & (
  | {
      apiKey: string
      userId: string
    }
  | {
      accessToken: string | (() => string | Promise<string>) // user access token retrieved from the oauth app auth
    }
  | {
      sessionToken: string | (() => string | Promise<string>) // user session token retrieved from the login flow
      appId: string
    }
)

export class OwnxClient {
  constructor(opts: OwnxClientOptions) {
    this.opts = {
      ...opts,
      apiUrl: new URL(opts.apiUrl || env.OWNX_API_URL || 'https://ownx.ai').origin,
    }

    this.trpc = createOwnxTrpcClient(this.opts)
  }

  private readonly opts: OwnxClientOptions & Required<Pick<OwnxClientOptions, 'apiUrl'>>

  trpc: ReturnType<typeof createOwnxTrpcClient>

  createLanguageModel(modelId: string) {
    return createLanguageModel(modelId, this.opts)
  }
}

export async function makeHeaders(opts: OwnxClientOptions) {
  const headers = new Headers()

  const { apiKey, userId } = opts as {
    apiKey?: string
    userId: string
  }
  if (apiKey) {
    headers.set('X-API-KEY', apiKey)
    headers.set('X-USER-ID', userId)
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
