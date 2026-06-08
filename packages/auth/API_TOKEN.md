# API Token

This document describes how Cared issues and enforces **API tokens** (`crat_` / `crut_`). The model is similar to [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/reference/permissions/): **permission groups** attach to **resource identifiers** inside **API token policies** (`TokenPolicy`) with an explicit `allow` or `deny` **effect**.

Each permission group carries a `statements` entry that maps API token policy grants to **account membership role permissions**: the same resource/action pairs assigned to `owner`, `admin`, and `member` via `accountRoles` (`permission/account.ts`, vocabulary in `statement.ts`).

## Terminology

| Term | Meaning |
|------|---------|
| **Statement** | Resource + action (e.g. `model` + `invoke`). Shared with account role permissions; defined in `statement.ts`. |
| **Permission group** | One entry in `PERMISSION_GROUPS`: metadata, `scopes`, and one statement. Referenced by id in API token policies. |
| **Permission group scope** | Where a group may appear in policy `resources`: `dev.cared.api.account`, `dev.cared.api.user`, or `dev.cared.api.account.user`. |
| **Resource identifier** | Policy key under `dev.cared.api.` (e.g. `dev.cared.api.account.{accountId}`). |
| **API token policy** | One `TokenPolicy`: `effect`, `resources`, `permissionGroups`. |
| **API token credential type** | `account` (`crat_`) or `user` (`crut_`) on `ApiToken.credentialType`. |

## Goals

- **Least privilege**: Each API token only includes selected permission groups and resource identifiers.
- **Stable IDs**: Permission group `id` values are `md5(\`${resource}:${action}\`)` so stored policies survive deploys.
- **Two credential types**: Account API tokens for one account; user API tokens for one user and optional multiple accounts.
- **Role ceiling**: On account-scoped permission groups, user API tokens cannot grant capabilities beyond the holder’s membership role on the active account.

## Code map

| Location | Responsibility |
|----------|----------------|
| `@cared/shared` — `policy.ts` | `TokenPolicy`, `PermissionGroup`, `tokenPolicySchema`, `resourcesSchema` |
| `@cared/auth` — `permission/statement.ts` | Permission vocabulary (`statements`) |
| `@cared/auth` — `permission/account.ts` | `accountRoles` (membership role permissions) |
| `@cared/auth` — `permission/permission.ts` | `PERMISSION_GROUPS`, `validateTokenPolicies`, `checkPermissionsByTokenPolicies` |
| `@cared/db` — `api-token.ts` | `policies: TokenPolicy[]` per API token |
| `@cared/api` — `auth/auth.ts` | `authenticate`, `Auth.requirePermissions` |

## `PERMISSION_GROUPS`

Catalog exposed at `GET /api-tokens/permission-groups`. Each entry:

```ts
{
  id: string              // md5(`${resource}:${action}`)
  name: string
  description: string
  scopes: PermissionGroupScope[]
  statements: StatementsSubset  // exactly one resource → one action
}
```

The `statements` on each permission group is the bridge from **API token policy + permission group** to **account role permissions**: one resource/action per catalog row, using the same pairs as membership roles. Policies reference groups by `id` only.

**Runtime** (`checkPermissionsByTokenPolicies`): a handler requirement such as `{ model: ['invoke'] }` matches when a policy’s permission group includes that statement, `resources` match the request context, and `effect` allows it.

**Role ceiling** (user API token, account-related scopes only): the same statement must be allowed for the user’s membership role on the active account (`checkPermissionsByRole` in `permission/account.ts`).

**Create** (`validateTokenPolicies`): normalizes policies to `formattedPolicies` (canonical `resources`, permission group `id` + `name`) for persistence. For user API tokens, each referenced account requires membership `apiToken:write`; `dev.cared.api.account.*` expands to all such accounts on the user.

### Permission group `id`

```ts
function generateId(resource: string, action: string) {
  return md5(`${resource}:${action}`)
}
```

Use the statement **resource** and **action** from that group (e.g. `generateId('model', 'read')`).

### Permission group scopes

| Scope | Required `resources` shape |
|-------|---------------------------|
| `dev.cared.api.account` | `dev.cared.api.account.{accountId}` or `dev.cared.api.account.*` with `'*'` |
| `dev.cared.api.user` | `dev.cared.api.user.{userId}` with `'*'` |
| `dev.cared.api.account.user` | `dev.cared.api.account.{accountId}` with nested `dev.cared.api.account.user.{userId}: '*'` |

When creating an API token, **each policy object** must use resources of **one scope kind only** (`dev.cared.api.account`, `dev.cared.api.user`, or `dev.cared.api.account.user`). Permission groups on that policy must list that scope in their `scopes` array. User-scoped and account-scoped grants are expressed as **separate** policy objects in the same `policies` array.

At runtime, every entry in `permissionGroup.scopes` is evaluated; **any** matching scope (plus role ceiling when applicable) allows the group to match.

A group may list multiple scopes (e.g. `apiToken` on both `dev.cared.api.account` and `dev.cared.api.user`; member `model` groups include `dev.cared.api.account.user`).

## API token policies

Each API token stores `policies: TokenPolicy[]` (after `validateTokenPolicies` normalization on create):

```ts
interface TokenPolicy {
  effect: 'allow' | 'deny'
  resources: Resources
  permissionGroups: { id: string; name?: string }[]
}
```

**Evaluation** per required statement:

1. `deny` policies — any match → deny.
2. `allow` policies — any match → allow.
3. Otherwise implicit deny.

## Resource identifiers

Prefix `dev.cared.api.` is the stable contract.

| Resource identifier | Value | Permission group scope | Policy usage |
|---------------------|-------|------------------------|--------------|
| `dev.cared.api.account.*` | `'*'` | `dev.cared.api.account` | **User API token** only. Active `accountId` from `X-ACCOUNT-ID` or `defaultAccountId`. |
| `dev.cared.api.account.{accountId}` | `'*'` | `dev.cared.api.account` | **User API token**: zero or more ids. **Account API token**: exactly one id = `ApiToken.accountId`. |
| `dev.cared.api.account.{accountId}` | `{ 'dev.cared.api.account.user.{userId}': '*' }` | `dev.cared.api.account.user` | **Account API token** only. Nested `{userId}` on `ApiToken.userId` when member-scoped. |
| `dev.cared.api.user.{userId}` | `'*'` | `dev.cared.api.user` | **User API token** only; `{userId}` = `ApiToken.userId`. |

Validated by `@cared/shared` Zod schemas on write.

## API token credential types

| `credentialType` | Prefix | `ApiToken` row | Allowed policy `resources` |
|------------------|--------|----------------|----------------------------|
| `account` | `crat_` | `accountId`; optional `userId` for nested `account.user` | One `dev.cared.api.account.{accountId}`: `'*'` or nested `dev.cared.api.account.user.{userId}: '*'` |
| `user` | `crut_` | `userId`; `defaultAccountId` | Multiple policy objects allowed: one with `dev.cared.api.user.{userId}: '*'`; optional separate objects for `dev.cared.api.account.{accountId}: '*'` and/or `dev.cared.api.account.*: '*'` (one scope kind per object) |

### `validateTokenPolicies`

Runs on API token create/update. Returns `{ credentialType, formattedPolicies, userId, accountId? | accountIds? }`.

**Per policy object**

- `resources` must imply **exactly one** scope kind (not mixed `user` + `account` keys in the same object). Multiple keys of the same kind are allowed (e.g. several `dev.cared.api.account.{accountId}` entries in one object).
- Each `permissionGroups[].id` must exist in `PERMISSION_GROUPS`, and that group’s `scopes` must include the policy object’s scope kind (e.g. `dev.cared.api.account`).
- Output `formattedPolicies` rewrites `resources` (canonical keys/values per scope) and fills permission group `id` + `name` from the catalog.

**User API token (`crut_`)**

- Exactly one `userId` across all policies (from `dev.cared.api.user.{userId}` entries).
- May include separate policy objects for `dev.cared.api.account.{accountId}` and/or `dev.cared.api.account.*` (not nested `account.user`).
- `dev.cared.api.account.*`: expands to every account the user belongs to where the creator has `apiToken:write`; normalized `resources` use `account.*` or explicit `account.{id}` keys.
- Explicit `account.{id}`: each id must be a membership account with `apiToken:write`.
- Return value includes `accountIds` (resolved id list after expansion and checks), not a single `accountId`.

**Account API token (`crat_`)**

- May use `dev.cared.api.account.{accountId}` with `'*'` or nested `dev.cared.api.account.user.{userId}` (not `account.*`, not `dev.cared.api.user.*`).
- Exactly one `accountId` and at most one nested `userId` across all policies.

## Runtime flow

### Authentication

| Principal | `AuthContext` |
|-----------|---------------|
| API token | `type: 'user'` or `type: 'account'` with `policies` |
| OAuth access token / session | `type: 'user'`, no `policies` |

User API tokens: `accountId` from `X-ACCOUNT-ID` or `defaultAccountId`. Respect `enabled`, `notBefore`, `expiresAt`.

### `Auth.requirePermissions`

```
Authenticated? ─no→ UNAUTHORIZED
checkFields match? ─no→ FORBIDDEN
type === 'account'?
  yes → checkPermissionsByTokenPolicies
  no  → policies present?
          yes → checkPermissionsByTokenPolicies (+ role ceiling on account scopes)
          no  → checkPermissionsByRole (session / OAuth only)
```

## Examples

**Account API token** — `model:read`:

```json
{
  "effect": "allow",
  "resources": { "dev.cared.api.account.acc_abc": "*" },
  "permissionGroups": [{ "id": "<md5('model:read')>" }]
}
```

**User API token** — `dataset:write` on two accounts + `apiToken:read`:

```json
[
  {
    "effect": "allow",
    "resources": {
      "dev.cared.api.account.acc_a": "*",
      "dev.cared.api.account.acc_b": "*"
    },
    "permissionGroups": [{ "id": "<md5('dataset:write')>" }]
  },
  {
    "effect": "allow",
    "resources": { "dev.cared.api.user.usr_xyz": "*" },
    "permissionGroups": [{ "id": "<md5('apiToken:read')>" }]
  }
]
```

**Account API token (member-scoped)**:

```json
{
  "effect": "allow",
  "resources": {
    "dev.cared.api.account.acc_abc": {
      "dev.cared.api.account.user.usr_xyz": "*"
    }
  },
  "permissionGroups": [{ "id": "<md5('model:invoke')>" }]
}
```

## Extending API token capabilities

1. Add resource/actions in `statement.ts` if not already present.
2. Add a `PERMISSION_GROUPS` row with matching `statements`, `scopes`, and `generateId`.
3. Guard handlers with `auth.requirePermissions`.
4. New groups appear in `listPermissionGroups`.

Do not change existing `generateId` inputs.

## Security

- Raw API token secret shown once; SHA-256 hash stored.
- Unknown permission group `id` → no match → implicit deny.
- Prefer `dev.cared.api.account.{accountId}` over `account.*`.
- Rotate via `enabled`, `notBefore`, `expiresAt`.

## Source files

- `packages/auth/src/permission/permission.ts`
- `packages/shared/src/policy.ts`
- `packages/api/src/auth/auth.ts`
- `apps/web/src/components/api-tokens/`
