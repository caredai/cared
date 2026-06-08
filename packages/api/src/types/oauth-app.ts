import type { OAuthApp as OAuthAppRow } from '@cared/db/schema'

export interface OAuthApp {
  id: string
  /** Confidential OAuth client_id. */
  clientId: string
  /** Public OAuth client_id (PKCE). */
  publicClientId: string
  clientSecret?: string
  clientSecretStart: string
  clientSecretEnd: string
  redirectUris: string[]
  name: string
  description?: string
  homeUrl?: string
  logo?: string
  scopes?: string[]
  createdAt: Date
  updatedAt: Date
}

export function formatOAuthApp(
  app: OAuthAppRow,
  options?: {
    clientSecret?: string
  },
): OAuthApp {
  return {
    id: app.id,
    clientId: app.clientId,
    publicClientId: app.publicClientId,
    clientSecret: options?.clientSecret,
    clientSecretStart: app.clientSecretStart,
    clientSecretEnd: app.clientSecretEnd,
    redirectUris: app.redirectUris,
    name: app.name,
    description: app.description ?? undefined,
    homeUrl: app.homeUrl ?? undefined,
    logo: app.logo ?? undefined,
    scopes: app.scopes ?? undefined,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  }
}
