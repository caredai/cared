# Cared and Appwrite Integration Architecture

This document describes how Cared integrates with a customized self-hosted Appwrite deployment to provide Functions and Sites without exposing Appwrite's organization or project model to Cared users.

## Goals

- Hide Appwrite terminology and concepts from the Cared web experience.
- Scope every Function or Site to one Cared account and one or more Appwrite regions.
- Keep Appwrite resource IDs stable across regions where the resource is logically the same.
- Let the primary region remain the source of truth for resource metadata and build artifacts.
- Use durable workflow orchestration for multi-step, multi-region operations.
- Keep Appwrite region-local internal consistency by using Appwrite's own APIs and internal side effects where possible.

## Concepts

Cared maps each account and Appwrite region to a dedicated Appwrite user, team, project, and API key. These are created when the account enables the region.

Cared users see only Cared-level Functions, Sites, Deployments, Rules, and Regions. They should not see Appwrite, team, organization, or project wording in the web UI.

The primary region of a Function or Site is the region where its canonical Appwrite resource is created. For multi-region resources, secondary regions mirror the primary resource using the same public IDs while retaining local Appwrite internal sequence IDs.

## Cared Data Model

Cared stores integration metadata in DB tables defined in `packages/db/src/schema/appwrite.ts`.

Core tables:

- `AppwriteRegion`: region configuration loaded from environment and persisted in DB. The row ID is the region ID.
- `AppwriteFunction`: Cared's account-scoped Function record. Its primary key matches the Appwrite function ID.
- `AppwriteSite`: Cared's account-scoped Site record. Its primary key matches the Appwrite site ID.
- `AppwriteDeployment`: deployment metadata. Its primary key matches the Appwrite deployment ID.
- `AppwriteRule`: proxy rule metadata. Its primary key matches the Appwrite rule ID.

Association tables map Functions, Sites, Deployments, and Rules to the regions where they exist. A Function may select one or more regions. A Site may select either one region or all regions; partial multi-region Site deployment is intentionally not supported because Cloudflare Load Balancing cannot represent arbitrary regional subsets for this use case.

When a resource is created with multiple regions, the first selected region is the primary region.

## API Layer

The Cared API service owns all Appwrite client access. Web clients call Cared oRPC routes, not Appwrite directly.

Implementation shape:

- Shared Appwrite client and region/account credential handling live in `packages/api/src/service/appwrite/base.ts`.
- Function-specific behavior lives in `packages/api/src/service/appwrite/functions.ts`.
- Site-specific behavior lives in `packages/api/src/service/appwrite/sites.ts`.
- Temporal client, worker, workflows, and activities live under `packages/api/src/workflows`.

Public oRPC and service-layer DTO fields should use lower camel case for both inputs and outputs.

## Workflow Orchestration

Operations involving more than one durable side effect should use Temporal workflows.

Recommended workflow shape:

- One workflow per region-level deployment operation.
- Primary-region deployment workflow runs first.
- Secondary-region deployment workflows are started only after the primary deployment is ready, because only then is the build artifact available.
- Secondary deployment sync copies the primary region's S3 objects to the same object paths in the secondary region before calling the Appwrite sync deployment API.
- Workflow activities should be idempotent where possible.
- Cared DB writes should record enough state to safely retry or compensate.

For create/update/delete of Functions, Sites, Deployments, and Rules, Cared should coordinate:

1. Cared DB state.
2. Primary Appwrite region state.
3. Secondary Appwrite region state.
4. Cloudflare state where custom Site domains are involved.

An operation table is not required if the relevant resource, region association rows, workflow IDs, and status fields provide enough retry and reconciliation state.

## Deployment Sync Semantics

Primary deployment:

- Created through normal Appwrite deployment APIs.
- Performs upload and build.
- Produces source and build artifacts in object storage.
- Updates Appwrite deployment status, `buildPath`, `buildSize`, `totalSize`, and resource latest/active pointers.

Secondary deployment:

- Must not rebuild.
- Cared copies the primary region's S3 objects to the secondary region using the same `sourcePath` and `buildPath`.
- Cared calls Appwrite's deployment sync API with the primary deployment metadata.
- The secondary Appwrite region creates or updates a local deployment document using the same deployment ID but local `resourceInternalId` and deployment sequence.
- If requested, the secondary region updates local latest and active deployment pointers.

For Sites, deployment-trigger proxy rules must also be synced with the same rule ID and domain across regions.

## Rule Semantics

Deployment-trigger rules:

- Generated automatically for deployment access domains.
- The generated ID/domain prefix should be consistent across regions for the same logical deployment.
- For Sites, Appwrite sync APIs accept the deployment rule ID and deployment domain so secondary regions do not generate divergent rules.

Manual Function custom-domain rules:

- Region-specific.
- Appwrite's native domain verification and certificate generation flow is used.
- Rule IDs can be explicit in Cared and passed through to Appwrite.

Manual Site custom-domain rules:

- Global across all selected Site regions.
- Cared bypasses Appwrite's verification and certificate flow.
- Cloudflare for SaaS validates the user's custom hostname and terminates TLS.
- Cloudflare Load Balancing selects a healthy Appwrite region endpoint, such as `hil.sites.cared.work`.
- Appwrite receives the request with `Host: <user custom domain>` and can still resolve the correct Site through the proxy rule.

## Cloudflare Responsibilities

For Site custom domains in multi-region mode, Cared owns:

- Cloudflare for SaaS custom hostname creation and verification.
- Certificate lifecycle through Cloudflare.
- Origin configuration pointing to region-specific Appwrite Site domains.
- Load balancer and pool configuration.
- Health checks and failover policy.

Appwrite should not issue certificates for these Site custom domains.

## Required Appwrite Self-Hosted Modifications

Cared requires a customized self-hosted Appwrite build. The open-source Appwrite deployment must be extended with internal sync APIs that preserve Appwrite's local invariants while allowing Cared to orchestrate cross-region state.

Required API additions:

- Function sync resource APIs:
  - `POST /v1/functions/sync`
  - `PUT /v1/functions/:functionId/sync`
  - `DELETE /v1/functions/:functionId/sync`
- Site sync resource APIs:
  - `POST /v1/sites/sync`
  - `PUT /v1/sites/:siteId/sync`
  - `DELETE /v1/sites/:siteId/sync`
- Function deployment sync APIs:
  - `POST /v1/functions/:functionId/deployments/:deploymentId/sync`
  - `DELETE /v1/functions/:functionId/deployments/:deploymentId/sync`
- Site deployment sync APIs:
  - `POST /v1/sites/:siteId/deployments/:deploymentId/sync`
  - `DELETE /v1/sites/:siteId/deployments/:deploymentId/sync`
- Rule sync APIs:
  - `POST /v1/proxy/rules/function/sync`
  - `POST /v1/proxy/rules/site/sync`
  - `DELETE /v1/proxy/rules/:ruleId/sync`

Important Appwrite behavior:

- Sync resource APIs should be separate from public create/update/delete APIs.
- Function/Site sync APIs may reuse existing Appwrite actions so schedules, repositories, delete queues, and other local side effects remain consistent.
- Deployment sync APIs must import metadata only. They must not upload source code, enqueue builds, or regenerate artifacts.
- Deployment sync APIs must accept explicit deployment IDs.
- Site deployment sync APIs must accept explicit deployment-trigger rule IDs and domains.
- Rule sync APIs must accept explicit rule IDs.
- Rule sync APIs must be idempotent: if a matching rule exists for the same project, resource, and domain, update local internal pointers instead of failing.
- Rule sync APIs must support skipping Appwrite verification/certificate generation for Cloudflare-managed Site custom domains.
- Delete sync APIs should be idempotent where safe, returning success when the target resource is already absent.
- Deployment deletes should still enqueue Appwrite's delete worker so object storage cleanup and screenshots/build artifact cleanup use Appwrite's existing path.

## Consistency Notes

Cross-region consistency depends on Cared orchestration, not Appwrite internal replication.

Within each Appwrite region:

- Appwrite local DB sequence IDs are region-local and must not be copied from another region.
- Public IDs for Functions, Sites, Deployments, and shared Rules can be copied.
- Local pointers such as `resourceInternalId`, `deploymentInternalId`, `latestDeploymentInternalId`, and active deployment fields must be recalculated from local Appwrite documents.
- Existing Appwrite workers should continue to handle delete cleanup and other asynchronous local side effects.

Retries should never generate new IDs for synced logical resources. If a sync API is called twice with the same IDs and matching ownership, it should converge on the requested state.

