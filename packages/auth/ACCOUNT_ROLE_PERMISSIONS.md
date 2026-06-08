# Account Role Permissions

Cared uses the [Better Auth organization plugin](https://www.better-auth.com/docs/plugins/organization) for interactive authorization. Custom **roles** and **statements** are defined with `createAccessControl` from `better-auth/plugins/access` (access control APIs used by the organization plugin, not a separate plugin). In product terms, a Better Auth **organization** is a Cared **account**; membership **roles** grant **statements** on that account.

## Account

An **account** is the tenant boundary for Cared resources (models, datasets, billing, and so on).

- Better Auth model: `organization`, mapped to DB table `Account` (`packages/auth/src/server.tsx`).
- A user may belong to multiple accounts via **membership** (`Member`, `accountId` = `organizationId`).
- API requests from a session or OAuth access token use an active `accountId` (header `X-ACCOUNT-ID`, session `activeAccountId`, or `user.defaultAccountId`).

## Role

A **role** is the member’s capacity on one account: `owner`, `admin`, or `member`.

Roles are defined with `createAccessControl` / `newRole` in `packages/auth/src/permission/account.ts` and passed into the organization plugin as `ac` and `roles`:

```ts
organization({
  ac: accountAc,
  roles: accountRoles,
  schema: { organization: { modelName: 'Account' }, /* ... */ },
})
```

| Role | Purpose |
|------|---------|
| `owner` | Full administration for the current statement set |
| `admin` | Same statements as `owner` today |
| `member` | Read-heavy access; limited writes (e.g. `model:invoke`) |

Runtime check for session and OAuth access tokens:

```ts
checkPermissionsByRole(membershipRole, { model: ['invoke'] })
```

This delegates to Better Auth `clientSideHasPermission` with the organization plugin options.

## Statements

**Statements** are the shared permission vocabulary: a map of **resource** keys to allowed **actions**.

Defined once in `packages/auth/src/permission/statement.ts`:

```ts
export const statements = {
  account: ['read', 'write'],
  member: ['read', 'write'],
  model: ['read', 'write', 'invoke'],
  dataset: ['read', 'write'],
  // ...
}
```

- Each **role** in `accountRoles` selects a subset (`ownerAc`, `adminAc`, `memberAc`).
- Route handlers pass a required subset to `Auth.requirePermissions({ model: ['invoke'] })` as `StatementsSubset`.
- `pseudo` is an empty placeholder when only authentication / `checkFields` are needed.

Handlers and roles must use the same resource/action names. Adding a capability: extend `statements`, then update `accountRoles` in `account.ts`.

## Source files

- `packages/auth/src/permission/statement.ts` — `statements`
- `packages/auth/src/permission/account.ts` — `accountAc`, `accountRoles`, `checkPermissionsByRole`
- `packages/auth/src/server.tsx` — organization plugin wiring
