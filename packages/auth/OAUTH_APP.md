# OAuth App Scopes

This document describes how Cared registers **OAuth apps** and enforces **OAuth scopes** on access tokens (`croat_`). Third-party apps obtain user consent for a subset of capabilities; each granted scope maps to the same **statements** (resource + action) used by account roles and API tokens.

See also [API_TOKEN.md](./API_TOKEN.md) for API token permission groups (`PERMISSION_GROUPS`). The two models share `statement.ts` but differ in identifiers, storage, and which capabilities are exposed to third-party apps.

## Terminology

| Term | Meaning |
|------|---------|
| **Statement** | Resource + action (e.g. `model` + `invoke`). Defined in `statement.ts`. |
| **OAuth scope** | A string granted on an OAuth access token. API scopes use `resource:action` (e.g. `account:read`). |
| **Standard (OIDC) scope** | `openid`, `profile`, `email`, `offline_access`. Handled by the OAuth provider; not mapped to API statements. |
| **OAuth app scope** | One row in `OAUTH_APP_SCOPES`: `id`, `name`, and one `statements` entry. Listed at `GET /oauth-apps/scopes`. |
| **Provider scope** | Any scope the auth server may register or accept: `OAUTH_PROVIDER_SCOPES` = standard + app scopes. |

## Goals

- **Least privilege**: Each OAuth client is created with an allowed scope list; tokens only carry scopes the user approved.
- **Readable scope IDs**: App scopes use `resource:action` (via `scopeId()`), not MD5 hashes (API tokens use `md5(\`${resource}:${action}\`)` in `PERMISSION_GROUPS`).
- **Same vocabulary as roles**: Scope `statements` align with `accountRoles` in `permission/roles.ts`.
- **Role ceiling**: OAuth access tokens cannot exceed the authorizing user’s membership role on the active account.
- **Separate from API tokens**: OAuth apps do not use `TokenPolicy` or `dev.cared.api.*` resource identifiers.

## Code map

| Location | Responsibility |
|----------|----------------|
| `@cared/shared` — `oauth-app.ts` | `OAuthAppScope` (`id`, `name`) |
| `@cared/auth` — `permission/scope.ts` | `OAUTH_APP_SCOPES`, `OAUTH_PROVIDER_SCOPES`, `oauthProviderScopesSchema`, `checkPermissionsByOAuthAppScopes` |
| `@cared/auth` — `permission/permission.ts` | `PERMISSION_GROUPS` (API tokens only) |
| `@cared/auth` — `server.tsx` | `oauthProvider` plugin: registered scopes, consent, `account:read` for account binding |
| `@cared/db` — `oauth-app.ts`, `auth.ts` | `OAuthApp` row; `oauth_access_token.scopes` |
| `@cared/api` — `orpc/account/oauth-app.ts` | `listScopes`, `create` with optional `scopes` |
| `@cared/api` — `auth/auth.ts` | `authenticate`, `Auth.requirePermissions` for OAuth access tokens |

## Scope layers

### Standard (OIDC) scopes

`OAUTH_STANDARD_SCOPES`: `openid`, `profile`, `email`, `offline_access`.

- Registered on the OAuth provider (`oauthProvider.scopes` in `server.tsx`).
- Not entries in `OAUTH_APP_SCOPES` and not checked via `checkPermissionsByOAuthAppScopes`.
- Used for identity, profile claims, and refresh tokens.

### API scopes (`OAUTH_APP_SCOPES`)

Each catalog row:

```ts
{
  id: string       // scopeId(resource, action) → `${resource}:${action}`
  name: string
  statements: StatementsSubset  // exactly one resource → one action
}
```

`GET /oauth-apps/scopes` returns `{ scopes: Pick<OAuthAppScope, 'id' | 'name'>[] }` (no `statements`).

### Provider scopes (`OAUTH_PROVIDER_SCOPES`)

`[...OAUTH_STANDARD_SCOPES, ...OAUTH_APP_SCOPES.map(s => s.id)]`.

- Valid values for `oauthProviderScopesSchema` on **create OAuth app**.
- Must be a subset of what the provider registers in `server.tsx`.

## Comparison with API token permission groups

| | API token (`PERMISSION_GROUPS`) | OAuth app (`OAUTH_APP_SCOPES`) |
|---|--------------------------------|--------------------------------|
| Catalog field | `id` = MD5 hash | `id` = `resource:action` |
| Policy / grant | `TokenPolicy` + `permissionGroups` + `resources` | Space-separated scopes on client + token |
| Resource binding | `dev.cared.api.account.{id}`, etc. | `referenceId` / `accountId` on token + `account:read` scope |
| Role ceiling | User API tokens on account-scoped groups | All OAuth access tokens |
| `apiToken` / `oauthApp` statements | Included in permission groups | **Excluded** from OAuth app scopes (see below) |

Handlers still call `requirePermissions({ oauthApp: ['read'] })` etc. Membership roles and API tokens use the `oauthApp` / `apiToken` resources; third-party OAuth clients do not receive those as grantable scopes.

## Excluded scopes (`apiToken`, `oauthApp`)

In `permission/scope.ts`, `apiToken:*` and `oauthApp:*` rows are **commented out** of `OAUTH_APP_SCOPES`. They remain in `PERMISSION_GROUPS` for API tokens.

### `apiToken:read` / `apiToken:write`

Not offered to OAuth clients because:

- API tokens are account- or user-scoped credentials created and rotated by the member in the console, with explicit `TokenPolicy` and resource identifiers.
- Letting a third-party OAuth app request `apiToken` scopes would allow creating or reading API tokens on the user’s behalf—high risk of persistence and privilege escalation beyond the OAuth session.

### `oauthApp:read` / `oauthApp:write`

Not offered to OAuth clients because:

- OAuth app registration (create client, rotate secret, set redirect URIs) is an **account administration** action tied to the developer console and membership role `oauthApp:*`.
- A third-party app granted `oauthApp:write` could register or modify other OAuth clients in the same account (confused deputy / meta-privilege).

To expose more capabilities to OAuth apps, add rows to `OAUTH_APP_SCOPES` in `scope.ts` and register them via `OAUTH_PROVIDER_SCOPES` in `server.tsx`. Do not uncomment `apiToken` or `oauthApp` without an explicit security review.

## Runtime authorization

### OAuth access token path

1. `authenticate` loads the token via `getAccessToken` and sets `AuthContext.scopes` from `resolveOAuthAppScopes(token.scopes)`.
2. `Auth.requirePermissions` calls `checkPermissionsByOAuthAppScopes` when `auth.scopes` is set (and not an API token policy).

**Evaluation** for each required statement (e.g. `{ model: ['invoke'] }`):

1. Find a granted scope whose `statements` include that resource/action.
2. If `role` is set, the same statement must be allowed on the user’s membership role (`accountRoles`) on the active account.
3. If no scope matches, deny.

Implicit deny; no separate `allow`/`deny` policies on OAuth tokens.

### Session vs OAuth app

| Credential | `requirePermissions` path |
|------------|---------------------------|
| Session cookie | `checkPermissionsByRole` |
| User/account API token | `checkPermissionsByTokenPolicies` |
| OAuth access token (`croat_`) | `checkPermissionsByOAuthAppScopes` |

## OAuth provider behavior (`server.tsx`)

- **Registered scopes**: `OAUTH_PROVIDER_SCOPES` (all standard + app scopes).
- **Account context**: `account:read` (replaces legacy `read:account`) binds `referenceId` / `accountId` on the access token when present in the grant.
- **Account picker**: `hasNonStandardOAuthScopes` — if the grant includes any non-OIDC scope, the user may need to select an active account.

## HTTP API

### `GET /oauth-apps/scopes`

Returns the OAuth app scope catalog (`id`, `name`) for UI when creating an app.

### `POST /oauth-apps` — optional `scopes`

```ts
scopes?: string[]  // oauthProviderScopesSchema — each value ∈ OAUTH_PROVIDER_SCOPES, unique
```

- Passed to `createOAuthClient` as a space-separated `scope` string on both confidential and public clients.
- Omit `scopes` to leave client scope unset at creation (configure via your client defaults or a follow-up update if supported).

Example body fragment:

```json
{
  "name": "My integration",
  "redirectUris": ["https://example.com/callback"],
  "scopes": ["openid", "profile", "email", "offline_access", "account:read", "model:read"]
}
```

Include standard OIDC scopes in `scopes` when the app needs them; they are not auto-merged on create.

## Adding or changing scopes

1. Extend `statements` in `statement.ts` if needed.
2. Add a row to `OAUTH_APP_SCOPES` with `scopeId(resource, action)`.
3. Ensure `OAUTH_PROVIDER_SCOPES` in `scope.ts` and `oauthProvider.scopes` in `server.tsx` include the new `id`.
4. Update tests in `permission/scope.test.ts`.
5. Document exclusions here if a `PERMISSION_GROUPS` entry should not appear in `OAUTH_APP_SCOPES`.

## Related documents

- [API_TOKEN.md](./API_TOKEN.md) — permission groups and `TokenPolicy`
- [ACCOUNT_ROLE_PERMISSIONS.md](./ACCOUNT_ROLE_PERMISSIONS.md) — membership roles
