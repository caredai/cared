import { Account, AppwriteException, Client, Projects, Scopes, Teams } from '@appwrite.io/console'
import * as cookie from 'cookie-es'

import { stripIdPrefix } from '@cared/shared'

import { env } from '../../env'

/** Parse string/number to Date; return undefined for null/undefined or invalid. */
export function toDate(v: string | number | Date): Date
export function toDate(v: null | undefined): undefined
export function toDate(v: string | number | Date | null | undefined): Date | undefined
export function toDate(v: string | number | Date | null | undefined): Date | undefined {
  if (v == null) return undefined
  if (v instanceof Date) return v
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export interface AppwriteRegion {
  id: string
  name: string
}

export class AppwriteService {
  listRegions(): AppwriteRegion[] {
    return env.APPWRITE_REGIONS!.map(([id, name]) => ({
      id: id!,
      name: name!,
    }))
  }

  #apiEndpoint(regionId: string) {
    return `https://${regionId}.${env.APPWRITE_API_DOMAIN}/v1`
  }

  #consoleClient(regionId: string) {
    const client = new Client()
    // `console` is the meta project on appwrite
    client.setEndpoint(this.#apiEndpoint(regionId)).setProject('console')
    return client
  }

  protected projectClient(regionId: string, accountId: string) {
    const client = this.#consoleClient(regionId)
    client.setProject(this.#projectId(accountId))
    client.setKey(this.#apiKeySecret())
    return client
  }

  /** Ensure one Appwrite user per account in region (user id and email derived from accountId). */
  async #ensureUser(accountId: string, regionId: string) {
    const client = this.#consoleClient(regionId)
    const account = new Account(client)
    try {
      return await this.#createSession(accountId, regionId)
    } catch (error) {
      if (error instanceof AppwriteException) {
        if (error.code === 401 && error.type === 'user_invalid_credentials') {
          await account.create({
            userId: this.#userId(accountId),
            email: this.#userEmail(accountId),
            password: env.APPWRITE_USER_PASSWORD!,
          })
          return await this.#createSession(accountId, regionId)
        }
      }
      throw error
    }
  }

  async #createSession(accountId: string, regionId: string) {
    const client = this.#consoleClient(regionId)
    const account = new Account(client)
    const session = await account.createEmailPasswordSession({
      email: this.#userEmail(accountId),
      password: env.APPWRITE_USER_PASSWORD!,
    })
    return ((session as any).setCookie as string[])
      .map((c) => cookie.parseSetCookie(c))
      .map((c) => cookie.serialize(c.name, c.value))
      .join('; ')
  }

  async #ensureTeam(accountId: string, regionId: string, session: string) {
    const client = this.#consoleClient(regionId)
    client.setCookie(session)
    const teams = new Teams(client)
    try {
      return await teams.get({
        teamId: this.#teamId(accountId),
      })
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return await teams.create({
          teamId: this.#teamId(accountId),
          name: this.#teamId(accountId),
        })
      }
      throw error
    }
  }

  async #ensureProject(accountId: string, regionId: string, session: string) {
    const client = this.#consoleClient(regionId)
    client.setCookie(session)
    const projects = new Projects(client)

    try {
      return await projects.get({
        projectId: this.#projectId(accountId),
      })
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return await projects.create({
          projectId: this.#projectId(accountId),
          name: 'Default',
          teamId: this.#teamId(accountId),
        })
      }
      throw error
    }
  }

  async #ensureApiKey(accountId: string, regionId: string, session: string) {
    if (await this.#checkApiKey(accountId, regionId)) {
      return
    }

    const client = this.#consoleClient(regionId)
    client.setCookie(session)
    const projects = new Projects(client)
    await projects.createKey({
      projectId: this.#projectId(accountId),
      name: 'Default',
      keyId: this.#apiKeyId(accountId),
      scopes: [
        Scopes.SessionsWrite,
        Scopes.UsersRead,
        Scopes.UsersWrite,
        Scopes.TeamsRead,
        Scopes.TeamsWrite,
        Scopes.DatabasesRead,
        Scopes.DatabasesWrite,
        Scopes.CollectionsRead,
        Scopes.CollectionsWrite,
        Scopes.TablesRead,
        Scopes.TablesWrite,
        Scopes.AttributesRead,
        Scopes.AttributesWrite,
        Scopes.ColumnsRead,
        Scopes.ColumnsWrite,
        Scopes.IndexesRead,
        Scopes.IndexesWrite,
        Scopes.DocumentsRead,
        Scopes.DocumentsWrite,
        Scopes.RowsRead,
        Scopes.RowsWrite,
        Scopes.FilesRead,
        Scopes.FilesWrite,
        Scopes.BucketsRead,
        Scopes.BucketsWrite,
        Scopes.FunctionsRead,
        Scopes.FunctionsWrite,
        Scopes.SitesRead,
        Scopes.SitesWrite,
        Scopes.LogRead,
        Scopes.LogWrite,
        Scopes.ExecutionRead,
        Scopes.ExecutionWrite,
        Scopes.LocaleRead,
        Scopes.AvatarsRead,
        Scopes.HealthRead,
        Scopes.ProvidersRead,
        Scopes.ProvidersWrite,
        Scopes.MessagesRead,
        Scopes.MessagesWrite,
        Scopes.TopicsRead,
        Scopes.TopicsWrite,
        Scopes.SubscribersRead,
        Scopes.SubscribersWrite,
        Scopes.TargetsRead,
        Scopes.TargetsWrite,
        Scopes.RulesRead,
        Scopes.RulesWrite,
        Scopes.MigrationsRead,
        Scopes.MigrationsWrite,
        Scopes.VcsRead,
        Scopes.VcsWrite,
        Scopes.AssistantRead,
        Scopes.TokensRead,
        Scopes.TokensWrite,
        Scopes.PoliciesWrite,
        Scopes.PoliciesRead,
        Scopes.ArchivesRead,
        Scopes.ArchivesWrite,
        Scopes.RestorationsRead,
        Scopes.RestorationsWrite,
        Scopes.DomainsRead,
        Scopes.DomainsWrite,
        Scopes.EventsRead,
      ],
      // @ts-ignore
      secret: this.#apiKeySecret(),
    })
  }

  async #checkApiKey(accountId: string, regionId: string) {
    const client = this.projectClient(regionId, accountId)
    const projects = new Projects(client)
    try {
      await projects.getKey({
        projectId: this.#projectId(accountId),
        keyId: this.#apiKeyId(accountId),
      })
      return true
    } catch (error) {
      if (
        error instanceof AppwriteException &&
        ((error.code === 401 && error.type === 'general_unauthorized_scope') ||
          (error.code === 404 && error.type === 'key_not_found'))
      ) {
        return false
      }
      throw error
    }
  }

  #userId(accountId: string) {
    return accountId
  }

  #userEmail(accountId: string) {
    return `${accountId}@cared.dev`
  }

  #teamId(accountId: string) {
    return accountId
  }

  #projectId(accountId: string) {
    return stripIdPrefix(accountId)
  }

  #apiKeyId(accountId: string) {
    return accountId
  }

  #apiKeySecret() {
    return 'standard_' + env.APPWRITE_PROJECT_KEY!
  }

  /** Ensure Appwrite user, team, project and API key for the account in the region (all keyed by accountId). */
  async ensure(accountId: string, regionId: string) {
    if (await this.#checkApiKey(accountId, regionId)) {
      return
    }
    // Ensure one user in a region for a Cared account
    const session = await this.#ensureUser(accountId, regionId)
    // Ensure one team in a region for a Cared account
    await this.#ensureTeam(accountId, regionId, session)
    // Ensure one default project in a region for a Cared account
    await this.#ensureProject(accountId, regionId, session)
    // Ensure one default api key in a region for a Cared account
    await this.#ensureApiKey(accountId, regionId, session)
  }
}
