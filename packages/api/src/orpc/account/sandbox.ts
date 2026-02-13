import { z } from 'zod/v4'

import { userOrAppUserProtectedProcedure } from '../../orpc'
import { daytonaService } from '../../service/daytona/daytona'

const buildInfoSchema = z.object({
  dockerfileContent: z.string().optional(),
  contextHashes: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  snapshotRef: z.string(),
})

const sandboxVolumeSchema = z.object({
  volumeId: z.string(),
  mountPath: z.string(),
  subpath: z.string().optional(),
})

const volumeSchema = z.object({
  id: z.string().meta({ description: 'Volume ID' }),
  name: z.string().meta({ description: 'Volume name' }),
  state: z
    .enum([
      'creating',
      'ready',
      'pending_create',
      'pending_delete',
      'deleting',
      'deleted',
      'error',
    ])
    .meta({ description: 'Volume state' }),
  errorReason: z.string().optional().meta({ description: 'The error reason of the volume' }),
  createdAt: z.date().meta({ description: 'Creation timestamp' }),
  updatedAt: z.date().meta({ description: 'Last update timestamp' }),
  lastUsedAt: z.date().optional().meta({ description: 'Last used timestamp' }),
})

const sandboxStateSchema = z.enum([
  'creating',
  'restoring',
  'destroyed',
  'destroying',
  'started',
  'stopped',
  'starting',
  'stopping',
  'error',
  'build_failed',
  'pending_build',
  'building_snapshot',
  'unknown',
  'pulling_snapshot',
  'archived',
  'archiving',
  // 'resizing',
])

const sandboxSchema = z.object({
  id: z.string(),
  name: z.string(),
  snapshot: z.string().optional(),
  user: z.string(),
  env: z.record(z.string(), z.string()),
  labels: z.record(z.string(), z.string()),
  public: z.boolean(),
  networkBlockAll: z.boolean(),
  networkAllowList: z.string().optional(),
  regionId: z.string(),
  cpu: z.number(),
  memory: z.number(),
  disk: z.number(),
  gpu: z.number(),
  state: sandboxStateSchema.optional(),
  desiredState: z.string().optional(),
  errorReason: z.string().optional(),
  recoverable: z.boolean().optional(),
  backupState: z.string().optional(),
  backupCreatedAt: z.date().optional(),
  autoStopInterval: z.number().optional(),
  autoArchiveInterval: z.number().optional(),
  autoDeleteInterval: z.number().optional(),
  volumes: z.array(sandboxVolumeSchema).optional(),
  buildInfo: buildInfoSchema.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  daemonVersion: z.string().optional(),
})

const portPreviewUrlSchema = z.object({
  sandboxId: z.string(),
  port: z.number(),
  token: z.string(),
  url: z.string(),
})

const snapshotStateSchema = z.enum([
  'building',
  'pending',
  'pulling',
  'active',
  'inactive',
  'error',
  'build_failed',
  'removing',
])

const snapshotSchema = z.object({
  id: z.string(),
  general: z.boolean(),
  name: z.string(),
  imageName: z.string().optional(),
  entrypoint: z.array(z.string()).optional(),
  buildInfo: buildInfoSchema.optional(),
  state: snapshotStateSchema,
  cpu: z.number(),
  mem: z.number(),
  disk: z.number(),
  gpu: z.number(),
  size: z.number().optional(),
  errorReason: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastUsedAt: z.date().optional(),
  regionIds: z.array(z.string()).optional(),
})

const containerRegistrySchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  username: z.string(),
  project: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

const containerRegistryPushAccessSchema = z.object({
  username: z.string(),
  secret: z.string(),
  registryUrl: z.string(),
  registryId: z.string(),
  project: z.string(),
  expiresAt: z.date(),
})

export const sandboxRouter = {
  enable: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/enable',
      tags: ['sandboxes'],
      summary: 'Enable sandbox API for the account',
    })
    .input(z.undefined())
    .output(z.undefined())
    .handler(async ({ context }) => {
      await daytonaService.ensure(context.auth.userId, context.auth.accountId)
    }),

  listRegions: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/regions',
      tags: ['sandboxes'],
      summary: 'List all available regions',
    })
    .input(z.object({}).optional())
    .output(
      z.object({
        regions: z.array(
          z.object({
            id: z.string().meta({ description: 'Region ID' }),
            name: z.string().meta({ description: 'Region name' }),
            regionType: z.enum(['shared', 'custom']).meta({ description: 'Region type' }),
            proxyUrl: z.string().optional().meta({ description: 'Proxy URL for the region' }),
            sshGatewayUrl: z.string().optional().meta({ description: 'SSH Gateway URL' }),
            snapshotManagerUrl: z.string().optional().meta({ description: 'Snapshot Manager URL' }),
            createdAt: z.date().meta({ description: 'Creation timestamp' }),
            updatedAt: z.date().meta({ description: 'Last update timestamp' }),
          }),
        ),
      }),
    )
    .handler(async ({ context }) => {
      const regions = await daytonaService.listRegions(context.auth.accountId)
      return {
        regions: regions.map((r) => ({
          id: r.id,
          name: r.name,
          regionType: r.regionType,
          proxyUrl: r.proxyUrl ?? undefined,
          sshGatewayUrl: r.sshGatewayUrl ?? undefined,
          snapshotManagerUrl: r.snapshotManagerUrl ?? undefined,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      }
    }),

  listSandboxes: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/sandboxes',
      tags: ['sandboxes'],
      summary: 'List sandboxes with pagination and filters',
    })
    .input(
      z
        .object({
          cursor: z
            .string()
            .optional()
            .meta({ description: 'Pagination cursor from previous response' }),
          limit: z
            .int()
            .positive()
            .max(100)
            .default(20)
            .meta({ description: 'Number of results per page' }),
          id: z.string().optional().meta({ description: 'Filter by partial ID match' }),
          name: z.string().optional().meta({ description: 'Filter by partial name match' }),
          labels: z.string().optional().meta({ description: 'JSON-encoded labels filter' }),
          includeErroredDeleted: z
            .boolean()
            .optional()
            .meta({ description: 'Include errored/deleted' }),
          states: z
            .array(
              z.enum([
                'creating',
                'restoring',
                // 'destroyed',
                'destroying',
                'started',
                'stopped',
                'starting',
                'stopping',
                'error',
                'build_failed',
                'pending_build',
                'building_snapshot',
                'unknown',
                'pulling_snapshot',
                'archived',
                'archiving',
                // 'resizing',
              ]),
            )
            .optional()
            .meta({ description: 'Filter by states' }),
          snapshots: z
            .array(z.string())
            .optional()
            .meta({ description: 'Filter by snapshot names' }),
          regionIds: z.array(z.string()).optional().meta({ description: 'Filter by regions' }),
          minCpu: z.number().optional().meta({ description: 'Filter by minimum CPU cores' }),
          maxCpu: z.number().optional().meta({ description: 'Filter by maximum CPU cores' }),
          minMemory: z.number().optional().meta({ description: 'Filter by minimum memory (GB)' }),
          maxMemory: z.number().optional().meta({ description: 'Filter by maximum memory (GB)' }),
          minDisk: z.number().optional().meta({ description: 'Filter by minimum disk (GB)' }),
          maxDisk: z.number().optional().meta({ description: 'Filter by maximum disk (GB)' }),
          lastEventAfter: z.coerce
            .date()
            .optional()
            .meta({ description: 'Filter by last event after date' }),
          lastEventBefore: z.coerce
            .date()
            .optional()
            .meta({ description: 'Filter by last event before date' }),
          sort: z
            .enum([
              'id',
              'name',
              'state',
              'snapshot',
              'region',
              'updatedAt',
              'createdAt',
            ])
            .optional()
            .meta({ description: 'Sort field' }),
          order: z.enum(['asc', 'desc']).optional().meta({ description: 'Sort order' }),
        })
        .optional(),
    )
    .output(
      z.object({
        sandboxes: z.array(sandboxSchema),
        hasMore: z.boolean(),
        cursor: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await daytonaService.listSandboxes(context.auth.accountId, input)
    }),

  getSandbox: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/sandboxes/{idOrName}',
      tags: ['sandboxes'],
      summary: 'Get sandbox by ID or name',
    })
    .input(
      z.object({
        idOrName: z.string().meta({ description: 'Sandbox ID or name' }),
      }),
    )
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.getSandbox(context.auth.accountId, input.idOrName)
      return { sandbox }
    }),

  createSandbox: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/sandboxes',
      tags: ['sandboxes'],
      summary: 'Create a new sandbox',
    })
    .input(
      z.object({
        name: z.string().optional().meta({ description: 'Sandbox name' }),
        snapshot: z.string().optional().meta({ description: 'Snapshot ID or name' }),
        user: z.string().optional().meta({ description: 'User for the sandbox' }),
        env: z
          .record(z.string(), z.string())
          .optional()
          .meta({ description: 'Environment variables' }),
        labels: z.record(z.string(), z.string()).optional().meta({ description: 'Labels' }),
        public: z.boolean().optional().meta({ description: 'Public http preview' }),
        networkBlockAll: z.boolean().optional().meta({ description: 'Block all network' }),
        networkAllowList: z.string().optional().meta({ description: 'Allowed CIDR list' }),
        regionId: z.string().optional().meta({ description: 'Target region' }),
        cpu: z.number().optional().meta({ description: 'CPU cores' }),
        gpu: z.number().optional().meta({ description: 'GPU units' }),
        memory: z.number().optional().meta({ description: 'Memory in GB' }),
        disk: z.number().optional().meta({ description: 'Disk in GB' }),
        autoStopInterval: z
          .number()
          .optional()
          .meta({ description: 'Auto-stop interval (minutes)' }),
        autoArchiveInterval: z
          .number()
          .optional()
          .meta({ description: 'Auto-archive interval (minutes)' }),
        autoDeleteInterval: z
          .number()
          .optional()
          .meta({ description: 'Auto-delete interval (minutes)' }),
        volumes: z
          .array(
            z.object({
              volumeId: z.string().meta({ description: 'Volume ID' }),
              mountPath: z.string().meta({ description: 'Mount path' }),
              subpath: z.string().optional().meta({ description: 'Subpath within the volume' }),
            }),
          )
          .optional()
          .meta({ description: 'Volumes to attach' }),
        buildInfo: z
          .object({
            dockerfileContent: z
              .string()
              .meta({ description: 'The Dockerfile content used for the build' }),
            contextHashes: z
              .array(z.string())
              .optional()
              .meta({ description: 'The context hashes used for the build' }),
          })
          .optional()
          .meta({ description: 'Build info' }),
      }),
    )
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.createSandbox(context.auth.accountId, input)
      return { sandbox }
    }),

  deleteSandbox: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/sandboxes/sandboxes/{idOrName}',
      tags: ['sandboxes'],
      summary: 'Delete a sandbox',
    })
    .input(z.object({ idOrName: z.string().meta({ description: 'Sandbox ID or name' }) }))
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.deleteSandbox(context.auth.accountId, input.idOrName)
      return { sandbox }
    }),

  startSandbox: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/sandboxes/{idOrName}/start',
      tags: ['sandboxes'],
      summary: 'Start a sandbox',
    })
    .input(z.object({ idOrName: z.string().meta({ description: 'Sandbox ID or name' }) }))
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.startSandbox(context.auth.accountId, input.idOrName)
      return { sandbox }
    }),

  stopSandbox: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/sandboxes/{idOrName}/stop',
      tags: ['sandboxes'],
      summary: 'Stop a sandbox',
    })
    .input(z.object({ idOrName: z.string().meta({ description: 'Sandbox ID or name' }) }))
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.stopSandbox(context.auth.accountId, input.idOrName)
      return { sandbox }
    }),

  archiveSandbox: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/sandboxes/{idOrName}/archive',
      tags: ['sandboxes'],
      summary: 'Archive a sandbox',
    })
    .input(z.object({ idOrName: z.string().meta({ description: 'Sandbox ID or name' }) }))
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.archiveSandbox(context.auth.accountId, input.idOrName)
      return { sandbox }
    }),

  createSandboxBackup: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/sandboxes/{idOrName}/backup',
      tags: ['sandboxes'],
      summary: 'Create a backup for a sandbox',
    })
    .input(z.object({ idOrName: z.string().meta({ description: 'Sandbox ID or name' }) }))
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.createBackup(context.auth.accountId, input.idOrName)
      return { sandbox }
    }),

  recoverSandbox: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/sandboxes/{idOrName}/recover',
      tags: ['sandboxes'],
      summary: 'Recover a sandbox from error state',
    })
    .input(z.object({ idOrName: z.string().meta({ description: 'Sandbox ID or name' }) }))
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.recoverSandbox(context.auth.accountId, input.idOrName)
      return { sandbox }
    }),

  setSandboxAutostopInterval: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/sandboxes/{idOrName}/autostop',
      tags: ['sandboxes'],
      summary: 'Set sandbox auto-stop interval (minutes, 0 = disabled)',
    })
    .input(
      z.object({
        idOrName: z.string().meta({ description: 'Sandbox ID or name' }),
        interval: z
          .int()
          .nonnegative()
          .meta({ description: 'Auto-stop interval in minutes (0 = disabled)' }),
      }),
    )
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.setAutostopInterval(
        context.auth.accountId,
        input.idOrName,
        input.interval,
      )
      return { sandbox }
    }),

  setSandboxAutoArchiveInterval: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/sandboxes/{idOrName}/autoarchive',
      tags: ['sandboxes'],
      summary: 'Set sandbox auto-archive interval (minutes, 0 = 30 days)',
    })
    .input(
      z.object({
        idOrName: z.string().meta({ description: 'Sandbox ID or name' }),
        interval: z
          .int()
          .nonnegative()
          .meta({ description: 'Auto-archive interval in minutes (0 = 30 days)' }),
      }),
    )
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.setAutoArchiveInterval(
        context.auth.accountId,
        input.idOrName,
        input.interval,
      )
      return { sandbox }
    }),

  setSandboxAutoDeleteInterval: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/sandboxes/{idOrName}/autodelete',
      tags: ['sandboxes'],
      summary: 'Set sandbox auto-delete interval (minutes; -1 = disabled, 0 = delete on stop)',
    })
    .input(
      z.object({
        idOrName: z.string().meta({ description: 'Sandbox ID or name' }),
        interval: z.union([z.literal(-1), z.int().nonnegative()]).meta({
          description: 'Auto-delete interval in minutes (-1 = disabled, 0 = delete on stop)',
        }),
      }),
    )
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.setAutoDeleteInterval(
        context.auth.accountId,
        input.idOrName,
        input.interval,
      )
      return { sandbox }
    }),

  getSandboxPortPreviewUrl: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/sandboxes/{idOrName}/ports/{port}/preview-url',
      tags: ['sandboxes'],
      summary: 'Get (unsigned) preview URL for a sandbox port',
    })
    .input(
      z.object({
        idOrName: z.string().meta({ description: 'Sandbox ID or name' }),
        port: z.number().meta({ description: 'Port number' }),
      }),
    )
    .output(portPreviewUrlSchema)
    .handler(async ({ context, input }) => {
      return await daytonaService.getPortPreviewUrl(
        context.auth.accountId,
        input.idOrName,
        input.port,
      )
    }),

  getSandboxSignedPortPreviewUrl: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/sandboxes/{idOrName}/ports/{port}/signed-preview-url',
      tags: ['sandboxes'],
      summary: 'Get signed preview URL for a sandbox port',
    })
    .input(
      z.object({
        idOrName: z.string().meta({ description: 'Sandbox ID or name' }),
        port: z.number().meta({ description: 'Port number' }),
        expiresInSeconds: z
          .number()
          .optional()
          .meta({ description: 'Expiration in seconds (default 60)' }),
      }),
    )
    .output(portPreviewUrlSchema)
    .handler(async ({ context, input }) => {
      return await daytonaService.getSignedPortPreviewUrl(
        context.auth.accountId,
        input.idOrName,
        input.port,
        input.expiresInSeconds,
      )
    }),

  expireSandboxSignedPortPreviewUrl: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/sandboxes/{idOrName}/ports/{port}/signed-preview-url/expire',
      tags: ['sandboxes'],
      summary: 'Expire a signed port preview URL',
    })
    .input(
      z.object({
        idOrName: z.string().meta({ description: 'Sandbox ID or name' }),
        port: z.number().meta({ description: 'Port number' }),
        token: z.string().meta({ description: 'Signed preview URL token to expire' }),
      }),
    )
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await daytonaService.expireSignedPortPreviewUrl(
        context.auth.accountId,
        input.idOrName,
        input.port,
        input.token,
      )
      return undefined
    }),

  getSandboxBuildLogsUrl: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/sandboxes/{idOrName}/build-logs-url',
      tags: ['sandboxes'],
      summary: 'Get build logs URL for a sandbox',
    })
    .input(z.object({ idOrName: z.string().meta({ description: 'Sandbox ID or name' }) }))
    .output(z.object({ url: z.string().meta({ description: 'URL' }) }))
    .handler(async ({ context, input }) => {
      return await daytonaService.getBuildLogsUrl(context.auth.accountId, input.idOrName)
    }),

  getSandboxToolboxProxyUrl: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/sandboxes/{id}/toolbox-proxy-url',
      tags: ['sandboxes'],
      summary: 'Get toolbox proxy URL for a sandbox',
    })
    .input(z.object({ id: z.string().meta({ description: 'Sandbox ID' }) }))
    .output(
      z.object({
        url: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await daytonaService.getToolboxProxyUrl(context.auth.accountId, input.id)
    }),

  createSandboxSshAccess: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/sandboxes/{idOrName}/ssh-access',
      tags: ['sandboxes'],
      summary: 'Create SSH access for a sandbox',
    })
    .input(
      z.object({
        idOrName: z.string().meta({ description: 'Sandbox ID or name' }),
        expiresInMinutes: z
          .number()
          .optional()
          .meta({ description: 'Expiration in minutes (default 60)' }),
      }),
    )
    .output(
      z.object({
        sshAccess: z.object({
          id: z.string(),
          sandboxId: z.string(),
          token: z.string(),
          expiresAt: z.date(),
          createdAt: z.date(),
          updatedAt: z.date(),
          sshCommand: z.string(),
        }),
      }),
    )
    .handler(async ({ context, input }) => {
      const sshAccess = await daytonaService.createSshAccess(
        context.auth.accountId,
        input.idOrName,
        input.expiresInMinutes,
      )
      return { sshAccess }
    }),

  revokeSandboxSshAccess: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/sandboxes/sandboxes/{idOrName}/ssh-access',
      tags: ['sandboxes'],
      summary: 'Revoke SSH access for a sandbox (optionally by token)',
    })
    .input(
      z.object({
        idOrName: z.string().meta({ description: 'Sandbox ID or name' }),
        token: z
          .string()
          .optional()
          .meta({ description: 'SSH access token to revoke; omit to revoke all' }),
      }),
    )
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.revokeSshAccess(
        context.auth.accountId,
        input.idOrName,
        input.token,
      )
      return { sandbox }
    }),

  validateSandboxSshAccess: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/ssh-access/validate',
      tags: ['sandboxes'],
      summary: 'Validate an SSH access token',
    })
    .input(z.object({ token: z.string().meta({ description: 'SSH access token' }) }))
    .output(
      z.object({
        valid: z.boolean().meta({ description: 'Whether the token is valid' }),
        sandboxId: z.string().optional().meta({ description: 'Sandbox ID if valid' }),
      }),
    )
    .handler(async ({ context, input }) => {
      return await daytonaService.validateSshAccess(context.auth.accountId, input.token)
    }),

  replaceSandboxLabels: userOrAppUserProtectedProcedure
    .route({
      method: 'PUT',
      path: '/sandboxes/sandboxes/{idOrName}/labels',
      tags: ['sandboxes'],
      summary: 'Replace all labels on a sandbox',
    })
    .input(
      z.object({
        idOrName: z.string().meta({ description: 'Sandbox ID or name' }),
        labels: z
          .record(z.string(), z.string())
          .meta({ description: 'New labels (replaces existing)' }),
      }),
    )
    .output(z.object({ labels: z.record(z.string(), z.string()) }))
    .handler(async ({ context, input }) => {
      const { labels } = await daytonaService.replaceLabels(
        context.auth.accountId,
        input.idOrName,
        { labels: input.labels },
      )
      return { labels }
    }),

  updateSandboxPublicStatus: userOrAppUserProtectedProcedure
    .route({
      method: 'PUT',
      path: '/sandboxes/sandboxes/{idOrName}/public/{isPublic}',
      tags: ['sandboxes'],
      summary: 'Update sandbox public HTTP preview status',
    })
    .input(
      z.object({
        idOrName: z.string().meta({ description: 'Sandbox ID or name' }),
        isPublic: z.boolean().meta({ description: 'Whether HTTP preview is public' }),
      }),
    )
    .output(z.object({ sandbox: sandboxSchema }))
    .handler(async ({ context, input }) => {
      const sandbox = await daytonaService.updatePublicStatus(
        context.auth.accountId,
        input.idOrName,
        input.isPublic,
      )
      return { sandbox }
    }),

  updateSandboxLastActivity: userOrAppUserProtectedProcedure
    .route({
      method: 'PUT',
      path: '/sandboxes/sandboxes/{id}/last-activity',
      tags: ['sandboxes'],
      summary: 'Update sandbox last activity timestamp (e.g. for runner heartbeat)',
    })
    .input(z.object({ id: z.string().meta({ description: 'Sandbox ID' }) }))
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await daytonaService.updateLastActivity(context.auth.accountId, input.id)
      return undefined
    }),

  updateSandboxState: userOrAppUserProtectedProcedure
    .route({
      method: 'PUT',
      path: '/sandboxes/sandboxes/{id}/state',
      tags: ['sandboxes'],
      summary: 'Update sandbox state (e.g. for runner to report state)',
    })
    .input(
      z.object({
        id: z.string().meta({ description: 'Sandbox ID' }),
        state: z
          .enum([
            'creating',
            'restoring',
            'destroyed',
            'destroying',
            'started',
            'stopped',
            'starting',
            'stopping',
            'error',
            'build_failed',
            'pending_build',
            'building_snapshot',
            'unknown',
            'pulling_snapshot',
            'archived',
            'archiving',
          ])
          .meta({ description: 'New sandbox state' }),
        errorReason: z
          .string()
          .optional()
          .meta({ description: 'Error message when reporting error state' }),
        recoverable: z
          .boolean()
          .optional()
          .meta({ description: 'Whether the sandbox is recoverable' }),
      }),
    )
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      const { id, state, errorReason, recoverable } = input
      await daytonaService.updateSandboxState(context.auth.accountId, id, {
        state,
        errorReason,
        recoverable,
      })
      return undefined
    }),

  listSnapshots: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/snapshots',
      tags: ['sandboxes'],
      summary: 'List all snapshots (paginated)',
    })
    .input(
      z
        .object({
          cursor: z
            .string()
            .optional()
            .meta({ description: 'Pagination cursor from previous response' }),
          limit: z
            .int()
            .positive()
            .max(100)
            .default(20)
            .meta({ description: 'Number of results per page' }),
          name: z.string().optional().meta({ description: 'Filter by partial name match' }),
          sort: z
            .enum(['name', 'state', 'lastUsedAt', 'createdAt'])
            .optional()
            .meta({ description: 'Sort field' }),
          order: z.enum(['asc', 'desc']).optional().meta({ description: 'Sort order' }),
        })
        .optional(),
    )
    .output(
      z.object({
        snapshots: z.array(snapshotSchema),
        hasMore: z.boolean(),
        cursor: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await daytonaService.getSnapshots(context.auth.accountId, {
        cursor: input?.cursor,
        limit: input?.limit,
        name: input?.name,
        sort: input?.sort,
        order: input?.order,
      })
    }),

  getSnapshot: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/snapshots/{idOrName}',
      tags: ['sandboxes'],
      summary: 'Get snapshot by ID or name',
    })
    .input(z.object({ idOrName: z.string().meta({ description: 'Snapshot ID or name' }) }))
    .output(z.object({ snapshot: snapshotSchema }))
    .handler(async ({ context, input }) => {
      const snapshot = await daytonaService.getSnapshot(context.auth.accountId, input.idOrName)
      return { snapshot }
    }),

  createSnapshot: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/snapshots',
      tags: ['sandboxes'],
      summary: 'Create a new snapshot',
    })
    .input(
      z.object({
        name: z.string().meta({ description: 'Snapshot name' }),
        imageName: z.string().optional().meta({ description: 'Image name' }),
        entrypoint: z.array(z.string()).optional().meta({ description: 'Entrypoint command' }),
        buildInfo: z
          .object({
            dockerfileContent: z
              .string()
              .meta({ description: 'The Dockerfile content used for the build' }),
            contextHashes: z
              .array(z.string())
              .optional()
              .meta({ description: 'The context hashes used for the build' }),
          })
          .optional()
          .meta({ description: 'Build info' }),
        cpu: z.number().optional().meta({ description: 'CPU cores' }),
        memory: z.number().optional().meta({ description: 'Memory in GB' }),
        disk: z.number().optional().meta({ description: 'Disk in GB' }),
        gpu: z.number().optional().meta({ description: 'GPU units' }),
        regionIds: z.string().optional().meta({ description: 'Region ID for the snapshot' }),
      }),
    )
    .output(z.object({ snapshot: snapshotSchema }))
    .handler(async ({ context, input }) => {
      const snapshot = await daytonaService.createSnapshot(context.auth.accountId, input)
      return { snapshot }
    }),

  removeSnapshot: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/sandboxes/snapshots/{id}',
      tags: ['sandboxes'],
      summary: 'Delete a snapshot',
    })
    .input(z.object({ id: z.string().meta({ description: 'Snapshot ID' }) }))
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await daytonaService.removeSnapshot(context.auth.accountId, input.id)
      return undefined
    }),

  activateSnapshot: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/snapshots/{id}/activate',
      tags: ['sandboxes'],
      summary: 'Activate a snapshot',
    })
    .input(z.object({ id: z.string().meta({ description: 'Snapshot ID' }) }))
    .output(z.object({ snapshot: snapshotSchema }))
    .handler(async ({ context, input }) => {
      const snapshot = await daytonaService.activateSnapshot(context.auth.accountId, input.id)
      return { snapshot }
    }),

  deactivateSnapshot: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/snapshots/{id}/deactivate',
      tags: ['sandboxes'],
      summary: 'Deactivate a snapshot',
    })
    .input(z.object({ id: z.string().meta({ description: 'Snapshot ID' }) }))
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await daytonaService.deactivateSnapshot(context.auth.accountId, input.id)
      return undefined
    }),

  getSnapshotBuildLogsUrl: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/snapshots/{id}/build-logs-url',
      tags: ['sandboxes'],
      summary: 'Get snapshot build logs URL',
    })
    .input(z.object({ id: z.string().meta({ description: 'Snapshot ID' }) }))
    .output(z.object({ url: z.object({ url: z.string().meta({ description: 'URL' }) }) }))
    .handler(async ({ context, input }) => {
      const url = await daytonaService.getSnapshotBuildLogsUrl(context.auth.accountId, input.id)
      return { url }
    }),

  listVolumes: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/volumes',
      tags: ['sandboxes'],
      summary: 'List all volumes',
    })
    .input(
      z
        .object({
          includeDeleted: z.boolean().optional().meta({ description: 'Include deleted volumes' }),
        })
        .optional(),
    )
    .output(z.object({ volumes: z.array(volumeSchema) }))
    .handler(async ({ context, input }) => {
      const volumes = await daytonaService.listVolumes(
        context.auth.accountId,
        input?.includeDeleted,
      )
      return { volumes }
    }),

  getVolume: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/volumes/{id}',
      tags: ['sandboxes'],
      summary: 'Get volume by ID',
    })
    .input(z.object({ id: z.string().meta({ description: 'Volume ID' }) }))
    .output(z.object({ volume: volumeSchema }))
    .handler(async ({ context, input }) => {
      const volume = await daytonaService.getVolume(context.auth.accountId, input.id)
      return { volume }
    }),

  getVolumeByName: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/volumes/by-name/{name}',
      tags: ['sandboxes'],
      summary: 'Get volume by name',
    })
    .input(z.object({ name: z.string().meta({ description: 'Volume name' }) }))
    .output(z.object({ volume: volumeSchema }))
    .handler(async ({ context, input }) => {
      const volume = await daytonaService.getVolumeByName(context.auth.accountId, input.name)
      return { volume }
    }),

  createVolume: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/volumes',
      tags: ['sandboxes'],
      summary: 'Create a new volume',
    })
    .input(z.object({ name: z.string().meta({ description: 'Volume name' }) }))
    .output(z.object({ volume: volumeSchema }))
    .handler(async ({ context, input }) => {
      const volume = await daytonaService.createVolume(context.auth.accountId, { name: input.name })
      return { volume }
    }),

  deleteVolume: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/sandboxes/volumes/{id}',
      tags: ['sandboxes'],
      summary: 'Delete a volume',
    })
    .input(z.object({ id: z.string().meta({ description: 'Volume ID' }) }))
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await daytonaService.deleteVolume(context.auth.accountId, input.id)
      return undefined
    }),

  getS3PushAccess: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/object-storage/push-access',
      tags: ['sandboxes'],
      summary: 'Get temporary S3 credentials for pushing objects',
    })
    .input(z.object({}).optional())
    .output(
      z.object({
        access: z.object({
          url: z.string().meta({ description: 'S3 endpoint URL' }),
          accessKeyId: z.string().meta({ description: 'S3 access key id' }),
          secretAccessKey: z.string().meta({ description: 'S3 secret access key' }),
          sessionToken: z.string().meta({ description: 'S3 session token' }),
          bucket: z.string().meta({ description: 'S3 bucket name' }),
        }),
      }),
    )
    .handler(async ({ context }) => {
      const access = await daytonaService.getS3PushAccess(context.auth.accountId)
      return { access }
    }),

  listRegistries: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/registries',
      tags: ['sandboxes'],
      summary: 'List container registries',
    })
    .input(z.object({}).optional())
    .output(
      z.object({
        registries: z.array(
          z.object({
            id: z.string().meta({ description: 'Registry ID' }),
            name: z.string().meta({ description: 'Registry name' }),
            url: z.string().meta({ description: 'Registry URL' }),
            username: z.string().meta({ description: 'Registry username' }),
            project: z.string().meta({ description: 'Registry project' }),
            createdAt: z.date().meta({ description: 'Creation timestamp' }),
            updatedAt: z.date().meta({ description: 'Last update timestamp' }),
          }),
        ),
      }),
    )
    .handler(async ({ context }) => {
      const registries = await daytonaService.listRegistries(context.auth.accountId)
      return {
        registries: registries.map((r) => ({
          id: r.id,
          name: r.name,
          url: r.url,
          username: r.username,
          project: r.project,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      }
    }),

  getRegistry: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/registries/{id}',
      tags: ['sandboxes'],
      summary: 'Get a container registry by ID',
    })
    .input(z.object({ id: z.string().meta({ description: 'Registry ID' }) }))
    .output(
      z.object({
        registry: z.object({
          id: z.string().meta({ description: 'Registry ID' }),
          name: z.string().meta({ description: 'Registry name' }),
          url: z.string().meta({ description: 'Registry URL' }),
          username: z.string().meta({ description: 'Registry username' }),
          project: z.string().meta({ description: 'Registry project' }),
          createdAt: z.date().meta({ description: 'Creation timestamp' }),
          updatedAt: z.date().meta({ description: 'Last update timestamp' }),
        }),
      }),
    )
    .handler(async ({ context, input }) => {
      const registry = await daytonaService.getRegistry(context.auth.accountId, input.id)
      return {
        registry: {
          id: registry.id,
          name: registry.name,
          url: registry.url,
          username: registry.username,
          project: registry.project,
          createdAt: registry.createdAt,
          updatedAt: registry.updatedAt,
        },
      }
    }),

  createRegistry: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sandboxes/registries',
      tags: ['sandboxes'],
      summary: 'Create a container registry',
    })
    .input(
      z.object({
        name: z.string().meta({ description: 'Registry name' }),
        url: z.string().meta({ description: 'Registry URL' }),
        username: z.string().meta({ description: 'Registry username' }),
        password: z.string().meta({ description: 'Registry password' }),
        project: z.string().optional().meta({ description: 'Registry project' }),
      }),
    )
    .output(z.object({ registry: containerRegistrySchema }))
    .handler(async ({ context, input }) => {
      const registry = await daytonaService.createRegistry(context.auth.accountId, input)
      return { registry }
    }),

  updateRegistry: userOrAppUserProtectedProcedure
    .route({
      method: 'PATCH',
      path: '/sandboxes/registries/{id}',
      tags: ['sandboxes'],
      summary: 'Update a container registry',
    })
    .input(
      z.object({
        id: z.string().meta({ description: 'Registry ID' }),
        name: z.string().meta({ description: 'Registry name' }),
        url: z.string().meta({ description: 'Registry URL' }),
        username: z.string().meta({ description: 'Registry username' }),
        password: z.string().meta({ description: 'Registry password' }),
        project: z.string().optional().meta({ description: 'Registry project' }),
      }),
    )
    .output(z.object({ registry: containerRegistrySchema }))
    .handler(async ({ context, input }) => {
      const { id, ...body } = input
      const registry = await daytonaService.updateRegistry(context.auth.accountId, id, body)
      return { registry }
    }),

  deleteRegistry: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/sandboxes/registries/{id}',
      tags: ['sandboxes'],
      summary: 'Delete a container registry',
    })
    .input(z.object({ id: z.string().meta({ description: 'Registry ID' }) }))
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await daytonaService.deleteRegistry(context.auth.accountId, input.id)
      return undefined
    }),

  getRegistryTransientPushAccess: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sandboxes/registries/transient-push-access',
      tags: ['sandboxes'],
      summary: 'Get temporary registry push access for snapshots',
    })
    .input(
      z
        .object({
          regionId: z.string().optional().meta({
            description:
              'ID of the region where the snapshot will be available (defaults to account default region)',
          }),
        })
        .optional(),
    )
    .output(z.object({ access: containerRegistryPushAccessSchema }))
    .handler(async ({ context, input }) => {
      const access = await daytonaService.getRegistryTransientPushAccess(
        context.auth.accountId,
        input?.regionId,
      )
      return { access }
    }),
}
