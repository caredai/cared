import { createLangfuseTrpcClient, LangfuseLangfuseOrganizationsClient } from '@cared/langfuse-api'
import { LangfuseClient } from '@langfuse/client'

import type { LangfuseTrpcClient } from '@cared/langfuse-api'
import { env } from '../../env'

export class LangfuseProxyService {
  private _trpc: LangfuseTrpcClient | undefined = undefined
  private _orgClient: LangfuseLangfuseOrganizationsClient | undefined = undefined
  private _publicClient: LangfuseClient | undefined = undefined

  get trpc() {
    this._trpc ??= createLangfuseTrpcClient({
      url: env.LANGFUSE_BASEURL! + '/api/trpc',
      headers: {
        Authorization: 'Bearer ' + env.LANGFUSE_ADMIN_API_KEY!,
      },
    })
    return this._trpc
  }

  get orgClient() {
    this._orgClient ??= new LangfuseLangfuseOrganizationsClient({
      environment: '',
      baseUrl: env.LANGFUSE_BASEURL!,
      token: env.LANGFUSE_ADMIN_API_KEY!,
    })
    return this._orgClient
  }

  get publicClient() {
    this._publicClient ??= new LangfuseClient()
    return this._publicClient
  }
}
