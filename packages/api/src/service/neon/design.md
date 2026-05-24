# Neon Postgres Integration — Design

This document describes how Cared integrates [Neon](https://neon.tech) serverless Postgres. It covers object semantics, metadata ownership, tiering, and API design choices reflected in `neon.ts` and the account-scoped `database` oRPC router.

## Goals

- Offer **account-scoped, managed Postgres** as a first-class platform capability (similar in scope to sandboxes and datasets).
- Expose Neon’s branching, PITR, and role/database model without re-implementing Postgres operations in Cared.
- Keep a **thin, authoritative mapping** in Cared’s database while delegating runtime state to Neon’s API.
- Support **two commercial tiers** (low-cost vs normal) via separate Neon organizations and API keys.

## Cared platform context

Cared’s resource hierarchy is centered on the **Account**:

| Cared object | Scope                                         | Role relative to databases                                       |
| ------------ | --------------------------------------------- | ---------------------------------------------------------------- |
| **User**     | Global identity                               | Authenticates; acts within an account via membership             |
| **Account**  | Billing, team, and primary isolation boundary | Owns database namespaces, datasets, sandboxes, API tokens, files |

Database namespaces are **account-scoped**. Authentication for all database routes uses `protectedProcedure`; every operation resolves `context.auth.accountId` and never trusts client-supplied account IDs for authorization.

## Terminology mapping

Cared uses product language that aligns with Neon’s API but does not mirror it one-to-one:

| Cared term             | API / path                           | Neon equivalent                      | Notes                                                |
| ---------------------- | ------------------------------------ | ------------------------------------ | ---------------------------------------------------- |
| **Database namespace** | `/database-namespaces`, table `neon` | **Project**                          | One namespace ↔ one Neon project                     |
| **Branch**             | `.../branches/{branchId}`            | **Branch**                           | Direct passthrough; includes PITR parent options     |
| **Database**           | `.../databases/{databaseName}`       | **Database** (within a branch)       | Logical DB inside a branch, not the namespace itself |
| **Role**               | `.../roles/{roleName}`               | **Role** (Postgres role on a branch) | Includes password fetch and reset                    |

The word **namespace** avoids overloading “database” (which in Postgres/Neon means a single DB on a branch).

### Default bootstrap on create

When a namespace is created, Neon receives an initial branch:

- Branch name: `production`
- Database name: `cared`
- Role name: `cared`

This gives every new namespace a consistent, opinionated starting point. Additional databases and roles are created through the branch-scoped APIs.

## Architecture: split metadata model

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cared API (oRPC)                         │
│  databaseRouter → NeonService                                    │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│ Cared Postgres (`neon`)    │   │ Neon Control Plane API           │
│ - id (neon_*)              │   │ - projects, branches, databases  │
│ - accountId                │   │ - roles, quotas, endpoints       │
│ - name (display)           │   │ - live status, usage, PITR       │
│ - isLowCost → tier routing │   │                                  │
│ - orgId, projectId, region │   │                                  │
└───────────────────────────┘   └─────────────────────────────────┘
```

**Stored in Cared (durable mapping):**

- `id` — Cared primary key (`generateId('neon')`)
- `accountId` — owner; enforced on every query
- `name` — user-facing display name (Cared-only)
- `isLowCost` — selects Neon org + API client for API calls
- `orgId`, `projectId`, `regionId` — routing and uniqueness (`unique(orgId, projectId)`)

**Not stored in Cared (fetched from Neon on demand):**

- Branches, databases, roles, passwords
- Project quotas, autoscaling, suspend timeout, logical replication, history retention
- Compute endpoints and connection strings (not yet wrapped in `NeonService`)

**Rationale:** Branch-level objects change frequently and are already authoritative in Neon. Duplicating them in Cared would require sync jobs, conflict handling, and stale reads. Namespace-level metadata is stable and required for authz and tier routing before any Neon call.

Responses for namespace APIs merge Cared rows with Neon `project` payloads. Internal fields `accountId`, `orgId`, and `projectId` are stripped from API responses via `formatNamespace`.

## Neon project name vs Namespace name

A deliberate split keeps org-level operations efficient:

| Field             | Where it lives    | Value                    |
| ----------------- | ----------------- | ------------------------ |
| Neon project name | Neon              | Cared account id         |
| Namespace name    | Cared `neon.name` | User-chosen display name |

**Why:** `listProjects({ org_id, search: accountId })` can find all projects for an account in bulk when listing namespaces, avoiding N `getProject` calls. Display names can change without touching the Neon project name.

`updateNamespace` only updates Namespace name in Cared for renames; the Neon project name remains the account id.

## Dual-organization tiering

Two Neon organizations, each with its own API key and org id (from env):

| Tier     | `DatabaseTier` | Env               | Typical use                                                  |
| -------- | -------------- | ----------------- | ------------------------------------------------------------ |
| Low-cost | `low-cost`     | `NEON_FREE_ORG_*` | Constrained quotas, smaller autoscale ceiling                |
| Normal   | `normal`       | `NEON_PAID_ORG_*` | Higher default quotas; settings overridable at create/update |

`isLowCost` on the `neon` row is set at creation and drives `getClient(tier)` for Neon API calls.

**Tier migration (planned):** A namespace may move from low-cost to normal by calling Neon’s project transfer APIs (free org → paid org), then updating `isLowCost` and `orgId` in Cared. This path is not implemented yet; until it is, new namespaces pick a tier at create time only.

### Low-cost defaults (fixed)

- Quota: 360000 s active time, 512 MiB logical size, 5 GiB transfer
- Autoscale: 0.25–2 CU
- Suspend timeout: 300 s

### Normal defaults (configurable via `NeonSettings`)

- Quota defaults: 750 h active time/month, 10 GiB storage, 50 GiB transfer (overridable)
- Autoscale: 0.25–16 CU (defaults)
- Suspend timeout: 300 s default; `-1` = never suspend

Settings map to Neon project fields:

| `NeonSettings`                                                            | Neon field                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `activeTimeSeconds`, `logicalSizeBytes`, `dataTransferBytes`              | `project.settings.quota`                                           |
| `autoscalingLimitMinCu`, `autoscalingLimitMaxCu`, `suspendTimeoutSeconds` | `project.default_endpoint_settings`                                |
| `enableLogicalReplication`                                                | `project.settings.enable_logical_replication` (irreversible)       |
| `historyRetentionSeconds`                                                 | `project.history_retention_seconds` (shared PITR for all branches) |

## API surface and request flow

All routes live under the account router (`/database-namespaces/...`). Typical flow:

1. Resolve namespace: `SELECT FROM neon WHERE id = ? AND accountId = ?`
2. If missing → `NOT_FOUND`
3. Select Neon client from `isLowCost`
4. Call Neon API with `projectId` (and branch/database/role identifiers as needed)

### Namespace CRUD

- **List** — DB query by `accountId`, then batch `listProjects` per tier with `search: accountId`; fallback `getProject` if a project id is missing from list results
- **Get** — DB + `getProject`
- **Create** — `createProject` then `INSERT` into `neon`
- **Update** — patch Neon project settings + update Cared `name` only
- **Delete** — `deleteProject` then `DELETE` from `neon` (no soft delete)

### Branch / database / role

Thin wrappers around Neon SDK methods. Pagination on `listBranches` is forwarded (`search`, `limit`, `cursor`). Sort: `created_at` ascending.

**Sensitive operations:** `getRolePassword` and `resetRolePassword` expose credentials; callers must treat responses as secrets and rely on account-scoped auth.

**Create database:** `ownerName` is optional; when omitted, Cared sends `owner_name` equal to the database `name`.

### Regions and Postgres version

The oRPC layer restricts `regionId` to `ALLOWED_DATABASE_REGIONS` (AWS regions supported by Neon). `pgVersion` is constrained to 17–18 (default 17).

## Authorization and multi-tenancy

- Every method takes `accountId` as the first argument from auth context.
- Namespace rows are the **capability object**: possession of `namespaceId` is insufficient without matching `accountId`.
- Neon API keys are platform-level (Cared backend only); tenants never receive org API keys.
- Cross-account access is prevented at the DB lookup layer before any Neon call.

## Operational and consistency considerations

**List performance:** Listing namespaces uses org-level project search rather than per-namespace `getProject` when possible. Mixed-tier accounts trigger parallel list ingestion for free and paid orgs only when needed.

**Delete ordering:** Namespace delete removes the Neon project first, then the Cared row. A failure after Neon delete but before DB delete leaves an orphan mapping (rare); operations should be idempotent or reconciled manually.

**Account delete:** `neon.accountId` references `account` without `onDelete: 'cascade'`. Deleting an account with active namespaces may fail at the DB layer unless namespaces are deleted first—an explicit lifecycle choice to avoid silent mass deletion of production databases.

**Logical replication:** Once enabled via settings, Neon does not allow disabling; the API documents this constraint.

## Out of scope (current implementation)

The following Neon capabilities are not exposed in `NeonService` today but may be added later:

- Compute **endpoints** (create/read connection URIs)
- **Operations** (start/stop/suspend endpoints)
- **Migrations** / schema diff tools
- **Consumption** / billing metrics aggregation into Lago
- **Tier migration** (low-cost → normal via Neon transfer APIs + Cared metadata update)

## Environment variables

| Variable                | Purpose                             |
| ----------------------- | ----------------------------------- |
| `NEON_FREE_ORG_API_KEY` | API key for low-cost org            |
| `NEON_FREE_ORG_ID`      | Organization id for low-cost tier   |
| `NEON_PAID_ORG_API_KEY` | API key for normal tier             |
| `NEON_PAID_ORG_ID`      | Organization id for normal tier     |
| `NEON_PERSONAL_API_KEY` | Optional; not used by `NeonService` |

`NeonService` constructor fails fast if free/paid API keys are missing.

## Summary

Cared treats a **database namespace** as an account-owned handle to a Neon **project**, with display metadata and tier routing in Postgres and everything else delegated to Neon’s API. The Neon project name is the account id for efficient discovery; Namespace name is the user-facing label in Cared. Branch/database/role APIs preserve Neon’s data model for dev/prod workflows, PITR branches, and credential management—while keeping Cared’s control plane small, auditable, and aligned with account-level isolation.
