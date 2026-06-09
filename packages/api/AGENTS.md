# AGENTS.md

## Scope

This file applies to `packages/api`.

## Commands

- Run `pnpm --filter @cared/api build` when source changes affect exported types.

## Code Structure

- `src/orpc/**`: typed oRPC routers. Add account/user/admin endpoints here.
- `src/operation/**`: reusable business logic, DB access helpers, cache invalidation, formatters.
- `src/rest/**`: Plain REST endpoints and provider-compatible APIs.
- `src/client/**`: external service clients only.
- `src/auth/**`: authentication and authorization primitives.
- `src/types/**`: exported shared API types.

## Patterns

- Use `zod/v4` schemas for endpoint inputs.
- For both oRPC and plain REST APIs, prefer `undefined` over `null` for optional input/output fields.
- Use Zod `nullish` only when `undefined` and `null` have distinct meanings, such as "do not update this field" vs "set this field to null".
- Do not expose raw table row types as API contracts. Use explicit DTOs/formatters; DB nullable fields should become optional API fields unless `null` has explicit API semantics.
- Use the procedure matching the auth boundary from `src/orpc.ts`: `publicProcedure`, `userProtectedProcedure`, `userPlainProtectedProcedure`, `accountProtectedProcedure`, or `adminProcedure`.
- Check permissions inside handlers with `context.auth.requirePermissions(...)`; choose the correct resource and action for the operation.
- If the needed resource/action does not exist or is incorrect, update `packages/auth/src/permission/statement.ts` and related permission files.
- Throw `ORPCError` for API errors; keep messages short and client-safe.
- Put reusable DB/query/cache logic in `src/operation`, not directly in routers, unless it is truly endpoint-local.
- Invalidate related caches after mutations.
- Add or update exports from local `index.ts` files when new modules must be consumed elsewhere.
- If the public oRPC contract changes, regenerate `src/orpc/contract.json`.

## Environment

- Declare API env vars in `src/env.ts`; use optional vars for optional integrations.
- Never read secrets directly outside env/client setup code when an existing helper exists.
