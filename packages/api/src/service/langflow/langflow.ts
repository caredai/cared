import { LangflowClient } from '@datastax/langflow-client'
import { LangflowError } from '@datastax/langflow-client/errors'

import { getUuid, stripIdPrefix } from '@cared/shared'

import { env } from '../../env'

export class LangflowService {
  static #langflow: LangflowClient | undefined

  get adminClient(): LangflowClient {
    LangflowService.#langflow ??= new LangflowClient({
      baseUrl: env.LANGFLOW_API_URL,
      apiKey: env.LANGFLOW_ADMIN_API_KEY,
    })
    return LangflowService.#langflow
  }

  client(apiKey?: string): LangflowClient {
    return new LangflowClient({
      baseUrl: env.LANGFLOW_API_URL,
      apiKey,
    })
  }

  userApiKey(accountId: string) {
    return `sk-${stripIdPrefix(accountId)}-${env.LANGFLOW_USER_API_KEY!}`
  }

  projectId(appId: string) {
    return getUuid(appId)
  }

  // TODO: cache
  async ensureUser(accountId: string) {
    try {
      const _user = await this.adminClient.request({
        path: `/v1/users/${accountId}`,
        method: 'GET',
        headers: new Headers({
          Accept: 'application/json',
        }),
      })
    } catch (error) {
      if (error instanceof LangflowError && error.cause.status === 404) {
        const _user = await this.adminClient.request({
          path: `/v1/users`,
          method: 'POST',
          body: JSON.stringify({
            username: accountId,
            password: env.LANGFLOW_USER_API_KEY!,
            optins: {
              github_starred: true,
              dialog_dismissed: true,
              discord_clicked: true,
            },
          }),
          headers: new Headers({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        })
      } else {
        throw error
      }
    }

    const authClient = this.client(this.userApiKey(accountId))

    let apiKeysRes = (await authClient.request({
      path: `/v1/api_key`,
      method: 'GET',
      headers: new Headers({
        Accept: 'application/json',
      }),
    })) as ApiKeysResponse
    if (
      apiKeysRes.api_keys.find(
        (apiKey) =>
          apiKey.name === 'Cared' &&
          this.userApiKey(accountId).startsWith(apiKey.api_key.slice(0, 8)),
      )
    ) {
      return
    }

    const client = this.client()

    const loginRes = (await client.request({
      path: `/v1/login`,
      method: 'POST',
      body: JSON.stringify({
        username: accountId,
        password: env.LANGFLOW_USER_API_KEY!,
      }),
      headers: new Headers({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
    })) as {
      access_token: string
      refresh_token: string
      token_type: string
    }

    apiKeysRes = (await client.request({
      path: `/v1/api_key`,
      method: 'GET',
      headers: new Headers({
        Accept: 'application/json',
        Authorization: `Bearer ${loginRes.access_token}`,
      }),
    })) as ApiKeysResponse
    if (
      !apiKeysRes.api_keys.find(
        (apiKey) =>
          apiKey.name === 'Cared' &&
          this.userApiKey(accountId).startsWith(apiKey.api_key.slice(0, 8)),
      )
    ) {
      const _apiKey = await client.request({
        path: `/v1/api_key`,
        method: 'POST',
        body: JSON.stringify({
          api_key: this.userApiKey(accountId),
        }),
        headers: new Headers({
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${loginRes.access_token}`,
        }),
      })
    }

    // TODO: cache
  }

  async ensureProject(accountId: string, appId: string, appName: string) {
    await this.ensureUser(accountId)

    const client = this.client(this.userApiKey(accountId))

    const projectsRes = (await client.request({
      path: `/v1/projects`,
      method: 'GET',
      headers: new Headers({
        Accept: 'application/json',
      }),
    })) as {
      name: string
      description: string
      id: string
      parent_id: string
    }[]
    if (!projectsRes.find((project) => project.id === this.projectId(appId))) {
      const _project = await client.request({
        path: `/v1/projects`,
        method: 'POST',
        body: JSON.stringify({
          id: this.projectId(appId),
          name: appName,
        }),
        headers: new Headers({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      })
    }
  }
}

export const langflowService = new LangflowService()

interface ApiKeysResponse {
  total_count: number
  user_id: string
  api_keys: {
    name: string
    last_used_at: string
    total_uses: number
    is_active: boolean
    id: string
    api_key: string
    user_id: string
    created_at: string
  }[]
}
