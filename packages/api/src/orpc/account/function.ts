import {
  ExecutionMethod,
  Runtime,
  Runtimes,
  Scopes,
  TemplateReferenceType,
  UsageRange,
  UseCases,
  VCSReferenceType,
} from '@appwrite.io/console'
import { z } from 'zod/v4'

import { userOrAppUserProtectedProcedure } from '../../orpc'
import { appwriteFunctionsService } from '../../service/appwrite'

// Base input: every procedure requires regionId for Appwrite region-scoped API
const regionInput = z.object({
  regionId: z.string().meta({ description: 'Region ID' }),
})

// Zod enums matching Appwrite console enums (for input validation)
const usageRangeSchema = z.enum(UsageRange)
const runtimeSchema = z.enum(Runtime)
const templateReferenceTypeSchema = z.enum(TemplateReferenceType)
const vcsReferenceTypeSchema = z.enum(VCSReferenceType)
const executionMethodSchema = z.enum(ExecutionMethod)

// --- Output schemas (normalized API responses: id not $id, dates as Date where converted); field descriptions from SDK types ---
const functionVariableOutputSchema = z.object({
  id: z.string().meta({ description: 'Variable ID.' }),
  key: z.string().meta({ description: 'Variable key.' }),
  value: z.string().meta({ description: 'Variable value.' }),
  secret: z
    .boolean()
    .meta({ description: 'Secret variables can only be updated or deleted; never read.' }),
  resourceType: z
    .string()
    .meta({ description: 'Service to which the variable belongs (e.g. project, function).' }),
  resourceId: z.string().meta({ description: 'ID of resource to which the variable belongs.' }),
  createdAt: z.date().meta({ description: 'Variable creation date.' }),
  updatedAt: z.date().meta({ description: 'Variable update date.' }),
})

const functionOutputSchema = z.object({
  id: z.string().meta({ description: 'Function ID.' }),
  execute: z.array(z.string()).meta({ description: 'Execution permissions.' }),
  name: z.string().meta({ description: 'Function name.' }),
  enabled: z.boolean().meta({ description: 'Function enabled.' }),
  live: z.boolean().meta({
    description:
      'Is the function deployed with the latest configuration? Set to false when env vars, entrypoint, commands or other settings need redeploy.',
  }),
  logging: z.boolean().meta({
    description: 'When disabled, executions exclude logs and errors and will be slightly faster.',
  }),
  runtime: z.string().meta({ description: 'Function execution and build runtime.' }),
  deploymentId: z.string().meta({ description: "Function's active deployment ID." }),
  deploymentCreatedAt: z
    .date()
    .optional()
    .meta({ description: 'Active deployment creation date.' }),
  latestDeploymentId: z.string().meta({ description: "Function's latest deployment ID." }),
  latestDeploymentCreatedAt: z
    .date()
    .optional()
    .meta({ description: 'Latest deployment creation date.' }),
  latestDeploymentStatus: z.string().meta({
    description:
      'Status of latest deployment. Possible values: waiting, processing, building, ready, failed.',
  }),
  scopes: z.array(z.string()).meta({ description: 'Allowed permission scopes.' }),
  vars: z.array(functionVariableOutputSchema).meta({ description: 'Function variables.' }),
  events: z.array(z.string()).meta({ description: 'Function trigger events.' }),
  schedule: z.string().meta({ description: 'Function execution schedule in CRON format.' }),
  timeout: z.number().meta({ description: 'Function execution timeout in seconds.' }),
  entrypoint: z
    .string()
    .meta({ description: 'The entrypoint file used to execute the deployment.' }),
  commands: z.string().meta({ description: 'The build command used to build the deployment.' }),
  version: z.string().meta({ description: 'Version of Open Runtimes used for the function.' }),
  installationId: z.string().meta({ description: 'Function VCS installation id.' }),
  providerRepositoryId: z.string().meta({ description: 'VCS Repository ID.' }),
  providerBranch: z.string().meta({ description: 'VCS branch name.' }),
  providerRootDirectory: z.string().meta({ description: 'Path to function in VCS repository.' }),
  providerSilentMode: z.boolean().meta({
    description:
      'Is VCS connection in silent mode? In silent mode no comments are posted on pull or merge requests.',
  }),
  specification: z
    .string()
    .meta({ description: 'Machine specification for builds and executions.' }),
  createdAt: z.date().meta({ description: 'Function creation date.' }),
  updatedAt: z.date().meta({ description: 'Function update date.' }),
})

const deploymentOutputSchema = z.object({
  id: z.string().meta({ description: 'Deployment ID.' }),
  type: z.string().meta({ description: 'Type of deployment.' }),
  resourceId: z.string().meta({ description: 'Resource ID.' }),
  resourceType: z.string().meta({ description: 'Resource type.' }),
  entrypoint: z
    .string()
    .meta({ description: 'The entrypoint file to use to execute the deployment code.' }),
  sourceSize: z.number().meta({ description: 'The code size in bytes.' }),
  buildSize: z.number().meta({ description: 'The build output size in bytes.' }),
  totalSize: z.number().meta({ description: 'The total size in bytes (source and build output).' }),
  buildId: z.string().meta({ description: 'The current build ID.' }),
  activate: z
    .boolean()
    .meta({ description: 'Whether the deployment should be automatically activated.' }),
  screenshotLight: z
    .string()
    .meta({ description: 'Screenshot with light theme preference file ID.' }),
  screenshotDark: z
    .string()
    .meta({ description: 'Screenshot with dark theme preference file ID.' }),
  status: z.string().meta({
    description:
      'The deployment status. Possible values: waiting, processing, building, ready, canceled, failed.',
  }),
  buildLogs: z.string().meta({ description: 'The build logs.' }),
  buildDuration: z.number().meta({ description: 'The current build time in seconds.' }),
  providerRepositoryName: z
    .string()
    .meta({ description: 'The name of the vcs provider repository.' }),
  providerRepositoryOwner: z
    .string()
    .meta({ description: 'The name of the vcs provider repository owner.' }),
  providerRepositoryUrl: z
    .string()
    .meta({ description: 'The url of the vcs provider repository.' }),
  providerCommitHash: z.string().meta({ description: 'The commit hash of the vcs commit.' }),
  providerCommitAuthorUrl: z.string().meta({ description: 'The url of vcs commit author.' }),
  providerCommitAuthor: z.string().meta({ description: 'The name of vcs commit author.' }),
  providerCommitMessage: z.string().meta({ description: 'The commit message.' }),
  providerCommitUrl: z.string().meta({ description: 'The url of the vcs commit.' }),
  providerBranch: z.string().meta({ description: 'The branch of the vcs repository.' }),
  providerBranchUrl: z.string().meta({ description: 'The branch url of the vcs repository.' }),
  createdAt: z.date().meta({ description: 'Deployment creation date.' }),
  updatedAt: z.date().meta({ description: 'Deployment update date.' }),
})

const executionOutputSchema = z.object({
  id: z.string().meta({ description: 'Execution ID.' }),
  functionId: z.string().meta({ description: 'Function ID.' }),
  deploymentId: z
    .string()
    .meta({ description: "Function's deployment ID used to create the execution." }),
  trigger: z.string().meta({
    description:
      'The trigger that caused the function to execute. Possible values: http, schedule, event.',
  }),
  status: z.string().meta({
    description:
      'The status of the function execution. Possible values: waiting, processing, completed, failed, scheduled.',
  }),
  requestMethod: z.string().meta({ description: 'HTTP request method type.' }),
  requestPath: z.string().meta({ description: 'HTTP request path and query.' }),
  requestHeaders: z
    .array(
      z.object({
        name: z.string().meta({ description: 'Header name.' }),
        value: z.string().meta({ description: 'Header value.' }),
      }),
    )
    .meta({ description: 'HTTP request headers as name-value pairs.' }),
  responseStatusCode: z.number().meta({ description: 'HTTP response status code.' }),
  responseBody: z.string().meta({ description: 'HTTP response body.' }),
  responseHeaders: z
    .array(
      z.object({
        name: z.string().meta({ description: 'Header name.' }),
        value: z.string().meta({ description: 'Header value.' }),
      }),
    )
    .meta({ description: 'HTTP response headers as name-value pairs.' }),
  logs: z.string().meta({ description: 'Function logs.' }),
  errors: z.string().meta({ description: 'Function errors.' }),
  duration: z.number().meta({ description: 'Resource execution duration in seconds.' }),
  scheduledAt: z.date().optional().meta({
    description:
      'The scheduled time for execution. If left empty, execution is queued immediately.',
  }),
  permissions: z.array(z.string()).meta({ description: 'Execution roles.' }),
  createdAt: z.date().meta({ description: 'Execution creation date.' }),
  updatedAt: z.date().meta({ description: 'Execution update date.' }),
})

const templateFunctionOutputSchema = z.object({
  icon: z.string().meta({ description: 'Function template icon.' }),
  id: z.string().meta({ description: 'Function template ID.' }),
  name: z.string().meta({ description: 'Function template name.' }),
  tagline: z.string().meta({ description: 'Function template tagline.' }),
  permissions: z.array(z.string()).meta({ description: 'Execution permissions.' }),
  events: z.array(z.string()).meta({ description: 'Function trigger events.' }),
  cron: z.string().meta({ description: 'Function execution schedule in CRON format.' }),
  timeout: z.number().meta({ description: 'Function execution timeout in seconds.' }),
  useCases: z.array(z.string()).meta({ description: 'Function use cases.' }),
  runtimes: z
    .array(
      z.object({
        name: z.string().meta({ description: 'Runtime name.' }),
        commands: z
          .string()
          .meta({ description: 'The build command used to build the deployment.' }),
        entrypoint: z
          .string()
          .meta({ description: 'The entrypoint file used to execute the deployment.' }),
        providerRootDirectory: z
          .string()
          .meta({ description: 'Path to function in VCS repository.' }),
      }),
    )
    .meta({ description: 'List of runtimes that can be used with this template.' }),
  instructions: z.string().meta({ description: 'Function template instructions.' }),
  vcsProvider: z.string().meta({ description: 'VCS Provider.' }),
  providerRepositoryId: z.string().meta({ description: 'VCS Repository ID.' }),
  providerOwner: z.string().meta({ description: 'VCS Owner.' }),
  providerVersion: z.string().meta({ description: 'VCS branch version (tag).' }),
  variables: z
    .array(
      z.object({
        name: z.string().meta({ description: 'Variable name.' }),
        description: z.string().meta({ description: 'Variable description.' }),
        value: z.string().meta({ description: 'Variable value.' }),
        secret: z.boolean().meta({
          description: 'Variable secret flag. Secret variables can only be updated or deleted.',
        }),
        placeholder: z.string().meta({ description: 'Variable placeholder.' }),
        required: z.boolean().meta({ description: 'Is the variable required?' }),
        type: z.string().meta({ description: 'Variable type.' }),
      }),
    )
    .meta({ description: 'Function variables.' }),
  scopes: z.array(z.string()).meta({ description: 'Function scopes.' }),
})

const metricOutputSchema = z.object({
  value: z.number().meta({ description: 'Metric value.' }),
  date: z.string().meta({ description: 'Date string for the period.' }),
})

export const functionRouter = {
  /** Enable Functions API for the account in the given region (ensure project/user/key). */
  enableFunctions: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/functions/enable',
      tags: ['functions'],
      summary: 'Enable Functions API for the account in the region',
    })
    .input(regionInput)
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await appwriteFunctionsService.ensure(context.auth.accountId, input.regionId)
    }),

  /** List all available Appwrite regions. */
  listRegions: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/regions',
      tags: ['functions'],
      summary: 'List all available regions',
    })
    .input(z.object({}).optional())
    .output(
      z.object({
        regions: z.array(
          z.object({
            id: z.string().meta({ description: 'Region ID' }),
            name: z.string().meta({ description: 'Region name' }),
          }),
        ),
      }),
    )
    .handler(() => {
      const regions = appwriteFunctionsService.listRegions()
      return { regions }
    }),

  /**
   * Get a list of all the project's functions. Cursor-based pagination with Query.limit, Query.orderDesc($createdAt), Query.cursorBefore.
   */
  listFunctions: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions',
      tags: ['functions'],
      summary: 'List all project functions with cursor pagination',
    })
    .input(
      regionInput.extend({
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
        search: z
          .string()
          .max(256)
          .optional()
          .meta({ description: 'Search term to filter list results' }),
      }),
    )
    .output(
      z.object({
        functions: z.array(functionOutputSchema).meta({ description: 'List of functions.' }),
        hasMore: z.boolean().meta({ description: 'Whether there are more results.' }),
        cursor: z.string().optional().meta({ description: 'Pagination cursor for next page.' }),
      }),
    )
    .handler(async ({ context, input }) => {
      const { regionId, cursor, limit, search } = input
      return await appwriteFunctionsService.listFunctions(context.auth.accountId, regionId, {
        cursor,
        limit,
        search,
      })
    }),

  /**
   * Create a new function. You can pass a list of permissions to allow different project users or team to execute the function using the client API.
   */
  createFunction: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/functions',
      tags: ['functions'],
      summary: 'Create a new function',
    })
    .input(
      regionInput.extend({
        functionId: z.string().max(36).meta({
          description: 'Function ID. Valid chars: a-z, A-Z, 0-9, period, hyphen, underscore',
        }),
        name: z.string().max(128).meta({ description: 'Function name' }),
        runtime: runtimeSchema.meta({ description: 'Execution runtime' }),
        execute: z
          .array(z.string().max(64))
          .max(100)
          .optional()
          .meta({ description: 'Role strings with execution permissions' }),
        events: z.array(z.string()).max(100).optional().meta({ description: 'Events list' }),
        schedule: z.string().optional().meta({ description: 'Schedule CRON syntax' }),
        timeout: z
          .number()
          .optional()
          .meta({ description: 'Function maximum execution time in seconds' }),
        enabled: z.boolean().optional().meta({
          description:
            "Is function enabled? When 'disabled', users cannot access but Server SDKs with API key can. No data is lost when toggled.",
        }),
        logging: z.boolean().optional().meta({
          description:
            'When disabled, executions exclude logs and errors and will be slightly faster',
        }),
        entrypoint: z
          .string()
          .optional()
          .meta({ description: 'Entrypoint file path relative to providerRootDirectory' }),
        commands: z.string().optional().meta({ description: 'Build commands' }),
        scopes: z.array(z.enum(Scopes)).max(100).optional().meta({
          description: 'Scopes allowed for API key auto-generated for every execution',
        }),
        installationId: z
          .string()
          .optional()
          .meta({ description: 'Installation ID for VCS deployment' }),
        providerRepositoryId: z
          .string()
          .optional()
          .meta({ description: 'Repository ID of the repo linked to the function' }),
        providerBranch: z
          .string()
          .optional()
          .meta({ description: 'Production branch for the repo linked to the function' }),
        providerSilentMode: z.boolean().optional().meta({
          description:
            'Is VCS connection in silent mode? In silent mode, no comments on commits and pull requests',
        }),
        providerRootDirectory: z
          .string()
          .optional()
          .meta({ description: 'Path to function code in the linked repo' }),
        specification: z
          .string()
          .optional()
          .meta({ description: 'Runtime specification for the function and builds' }),
      }),
    )
    .output(z.object({ function: functionOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, ...params } = input
      const fn = await appwriteFunctionsService.createFunction(
        context.auth.accountId,
        regionId,
        params,
      )
      return { function: fn }
    }),

  /** Get a list of all runtimes that are currently active on your instance. */
  listRuntimes: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/runtimes',
      tags: ['functions'],
      summary: 'List all active runtimes',
    })
    .input(regionInput)
    .output(
      z.object({
        total: z
          .number()
          .meta({ description: 'Total number of runtimes that matched your query.' }),
        runtimes: z
          .array(
            z.object({
              $id: z.string().meta({ description: 'Runtime ID.' }),
              key: z.string().meta({ description: 'Parent runtime key.' }),
              name: z.string().meta({ description: 'Runtime name.' }),
              version: z.string().meta({ description: 'Runtime version.' }),
              base: z
                .string()
                .meta({ description: 'Base Docker image used to build the runtime.' }),
              image: z.string().meta({ description: 'Image name of Docker Hub.' }),
              logo: z.string().meta({ description: 'Name of the logo image.' }),
              supports: z
                .array(z.string())
                .meta({ description: 'List of supported architectures.' }),
            }),
          )
          .meta({ description: 'List of runtimes.' }),
      }),
    )
    .handler(async ({ context, input }) => {
      return appwriteFunctionsService.listRuntimes(context.auth.accountId, input.regionId)
    }),

  /** List allowed function specifications for this instance. */
  listSpecifications: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/specifications',
      tags: ['functions'],
      summary: 'List allowed function specifications',
    })
    .input(regionInput)
    .output(
      z.object({
        total: z
          .number()
          .meta({ description: 'Total number of specifications that matched your query.' }),
        specifications: z
          .array(
            z.object({
              memory: z.number().meta({ description: 'Memory size in MB.' }),
              cpus: z.number().meta({ description: 'Number of CPUs.' }),
              enabled: z.boolean().meta({ description: 'Is size enabled.' }),
              slug: z.string().meta({ description: 'Size slug.' }),
            }),
          )
          .meta({ description: 'List of specifications.' }),
      }),
    )
    .handler(async ({ context, input }) => {
      return appwriteFunctionsService.listSpecifications(context.auth.accountId, input.regionId)
    }),

  /**
   * List available function templates. Cursor-based pagination (cursor is offset as string for templates API).
   */
  listTemplates: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/templates',
      tags: ['functions'],
      summary: 'List available function templates',
    })
    .input(
      regionInput.extend({
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
        runtimes: z
          .array(z.enum(Runtimes))
          .max(100)
          .optional()
          .meta({ description: 'Runtimes for filtering templates' }),
        useCases: z
          .array(z.enum(UseCases))
          .max(100)
          .optional()
          .meta({ description: 'Use cases for filtering templates' }),
      }),
    )
    .output(
      z.object({
        templates: z
          .array(templateFunctionOutputSchema)
          .meta({ description: 'List of function templates.' }),
        hasMore: z.boolean().meta({ description: 'Whether there are more results.' }),
        cursor: z.string().optional().meta({ description: 'Pagination cursor for next page.' }),
      }),
    )
    .handler(async ({ context, input }) => {
      const { regionId, cursor, limit, runtimes, useCases } = input
      return appwriteFunctionsService.listTemplates(context.auth.accountId, regionId, {
        cursor,
        limit,
        runtimes,
        useCases,
      })
    }),

  /** Get a function template using ID. You can use template details in create function method. */
  getTemplate: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/templates/{templateId}',
      tags: ['functions'],
      summary: 'Get a function template by ID',
    })
    .input(regionInput.extend({ templateId: z.string().meta({ description: 'Template ID' }) }))
    .output(z.object({ template: templateFunctionOutputSchema }))
    .handler(async ({ context, input }) => {
      const template = await appwriteFunctionsService.getTemplate(
        context.auth.accountId,
        input.regionId,
        {
          templateId: input.templateId,
        },
      )
      return { template }
    }),

  /**
   * Get usage metrics and statistics for all functions in the project. Not a list endpoint.
   * Use optional range: 24h, 30d, or 90d. Defaults to 30 days.
   */
  getAllFunctionsUsage: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/usage',
      tags: ['functions'],
      summary: 'Get usage metrics for all project functions',
    })
    .input(
      regionInput.extend({
        range: usageRangeSchema.optional().meta({ description: 'Date range for historical data' }),
      }),
    )
    .output(
      z.object({
        usage: z.object({
          range: z.string().meta({ description: 'Time range of the usage stats.' }),
          functionsTotal: z.number().meta({ description: 'Total aggregated number of functions.' }),
          deploymentsTotal: z
            .number()
            .meta({ description: 'Total aggregated number of function deployments.' }),
          deploymentsStorageTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of function deployments storage.' }),
          buildsTotal: z
            .number()
            .meta({ description: 'Total aggregated number of function builds.' }),
          buildsStorageTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of function builds storage.' }),
          buildsTimeTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of function builds compute time.' }),
          buildsMbSecondsTotal: z
            .number()
            .optional()
            .meta({ description: 'Total aggregated sum of function builds mbSeconds.' }),
          executionsTotal: z
            .number()
            .meta({ description: 'Total aggregated number of function executions.' }),
          executionsTimeTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of function executions compute time.' }),
          executionsMbSecondsTotal: z
            .number()
            .optional()
            .meta({ description: 'Total aggregated sum of function executions mbSeconds.' }),
          buildsSuccessTotal: z
            .number()
            .optional()
            .meta({ description: 'Total aggregated number of successful function builds.' }),
          buildsFailedTotal: z
            .number()
            .optional()
            .meta({ description: 'Total aggregated number of failed function builds.' }),
          functions: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of functions per period.' }),
          deployments: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of function deployments per period.' }),
          deploymentsStorage: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of function deployments storage per period.' }),
          builds: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of function builds per period.' }),
          buildsStorage: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated sum of function builds storage per period.' }),
          buildsTime: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated sum of function builds compute time per period.' }),
          buildsMbSeconds: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of function builds mbSeconds per period.' }),
          executions: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of function executions per period.' }),
          executionsTime: z.array(metricOutputSchema).optional().meta({
            description: 'Aggregated number of function executions compute time per period.',
          }),
          executionsMbSeconds: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of function mbSeconds per period.' }),
          buildsSuccess: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of successful builds per period.' }),
          buildsFailed: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of failed builds per period.' }),
        }),
      }),
    )
    .handler(async ({ context, input }) => {
      const { regionId, range } = input
      const usage = await appwriteFunctionsService.getAllFunctionsUsage(
        context.auth.accountId,
        regionId,
        range ? { range } : undefined,
      )
      return { usage }
    }),

  /** Get a function by its unique ID. */
  getFunction: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/{functionId}',
      tags: ['functions'],
      summary: 'Get a function by ID',
    })
    .input(regionInput.extend({ functionId: z.string().meta({ description: 'Function ID' }) }))
    .output(z.object({ function: functionOutputSchema }))
    .handler(async ({ context, input }) => {
      const fn = await appwriteFunctionsService.getFunction(
        context.auth.accountId,
        input.regionId,
        {
          functionId: input.functionId,
        },
      )
      return { function: fn }
    }),

  /** Update function by its unique ID. */
  updateFunction: userOrAppUserProtectedProcedure
    .route({
      method: 'PATCH',
      path: '/functions/{functionId}',
      tags: ['functions'],
      summary: 'Update a function',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        name: z.string().max(128).meta({ description: 'Function name' }),
        runtime: runtimeSchema.optional().meta({ description: 'Execution runtime' }),
        execute: z
          .array(z.string().max(64))
          .max(100)
          .optional()
          .meta({ description: 'Role strings with execution permissions' }),
        events: z.array(z.string()).max(100).optional().meta({ description: 'Events list' }),
        schedule: z.string().optional().meta({ description: 'Schedule CRON syntax' }),
        timeout: z.number().optional().meta({ description: 'Maximum execution time in seconds' }),
        enabled: z.boolean().optional().meta({
          description:
            "Is function enabled? When 'disabled', Server SDKs with API key can still access. No data lost when toggled.",
        }),
        logging: z
          .boolean()
          .optional()
          .meta({ description: 'When disabled, executions exclude logs and errors' }),
        entrypoint: z.string().optional().meta({ description: 'Entrypoint file path' }),
        commands: z.string().optional().meta({ description: 'Build commands' }),
        scopes: z
          .array(z.string())
          .max(100)
          .optional()
          .meta({ description: 'Scopes for API key per execution' }),
        installationId: z.string().optional().meta({ description: 'Installation ID for VCS' }),
        providerRepositoryId: z
          .string()
          .optional()
          .meta({ description: 'Repository ID linked to the function' }),
        providerBranch: z
          .string()
          .optional()
          .meta({ description: 'Production branch for the repo' }),
        providerSilentMode: z.boolean().optional().meta({ description: 'VCS silent mode' }),
        providerRootDirectory: z
          .string()
          .optional()
          .meta({ description: 'Path to function code in repo' }),
        specification: z.string().optional().meta({ description: 'Runtime specification' }),
      }),
    )
    .output(z.object({ function: functionOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, ...params } = input
      type UpdateParams = Parameters<typeof appwriteFunctionsService.updateFunction>[2]
      const fn = await appwriteFunctionsService.updateFunction(
        context.auth.accountId,
        regionId,
        params as UpdateParams,
      )
      return { function: fn }
    }),

  /** Delete a function by its unique ID. */
  deleteFunction: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/functions/{functionId}',
      tags: ['functions'],
      summary: 'Delete a function',
    })
    .input(regionInput.extend({ functionId: z.string().meta({ description: 'Function ID' }) }))
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await appwriteFunctionsService.deleteFunction(context.auth.accountId, input.regionId, {
        functionId: input.functionId,
      })
    }),

  /** Update the function active deployment. Use this endpoint to switch the code deployment used when the function is executed. */
  updateFunctionDeployment: userOrAppUserProtectedProcedure
    .route({
      method: 'PUT',
      path: '/functions/{functionId}/deployment',
      tags: ['functions'],
      summary: 'Update the function active deployment',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        deploymentId: z.string().meta({ description: 'Deployment ID to activate' }),
      }),
    )
    .output(z.object({ function: functionOutputSchema }))
    .handler(async ({ context, input }) => {
      const fn = await appwriteFunctionsService.updateFunctionDeployment(
        context.auth.accountId,
        input.regionId,
        {
          functionId: input.functionId,
          deploymentId: input.deploymentId,
        },
      )
      return { function: fn }
    }),

  /**
   * Get a list of all the function's code deployments. Cursor-based pagination.
   */
  listDeployments: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/{functionId}/deployments',
      tags: ['functions'],
      summary: 'List function code deployments',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
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
        search: z.string().max(256).optional().meta({ description: 'Search term' }),
      }),
    )
    .output(
      z.object({
        deployments: z.array(deploymentOutputSchema).meta({ description: 'List of deployments.' }),
        hasMore: z.boolean().meta({ description: 'Whether there are more results.' }),
        cursor: z.string().optional().meta({ description: 'Pagination cursor for next page.' }),
      }),
    )
    .handler(async ({ context, input }) => {
      const { regionId, functionId, cursor, limit, search } = input
      return appwriteFunctionsService.listDeployments(context.auth.accountId, regionId, {
        functionId,
        cursor,
        limit,
        search,
      })
    }),

  /**
   * Create a new build for an existing function deployment. Rebuilds with updated function configuration (entrypoint, build commands). Build is queued and executed asynchronously.
   */
  createDuplicateDeployment: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/functions/{functionId}/deployments/{deploymentId}/duplicate',
      tags: ['functions'],
      summary: 'Create a new build for an existing deployment',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        deploymentId: z.string().meta({ description: 'Deployment ID' }),
        buildId: z.string().optional().meta({ description: 'Build unique ID' }),
      }),
    )
    .output(z.object({ deployment: deploymentOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, functionId, deploymentId, buildId } = input
      const deployment = await appwriteFunctionsService.createDuplicateDeployment(
        context.auth.accountId,
        regionId,
        {
          functionId,
          deploymentId,
          buildId,
        },
      )
      return { deployment }
    }),

  /**
   * Create a deployment based on a template. Use with listTemplates to find template details.
   */
  createTemplateDeployment: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/functions/{functionId}/deployments/template',
      tags: ['functions'],
      summary: 'Create a deployment from a template',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        repository: z.string().meta({ description: 'Repository name of the template' }),
        owner: z.string().meta({ description: 'Owner of the template' }),
        rootDirectory: z
          .string()
          .meta({ description: 'Path to function code in the template repo' }),
        type: templateReferenceTypeSchema.meta({
          description: 'Reference type: commit, branch, or tag',
        }),
        reference: z
          .string()
          .meta({ description: 'Reference value: commit hash, branch name, or release tag' }),
        activate: z
          .boolean()
          .optional()
          .meta({ description: 'Activate deployment when build finishes' }),
      }),
    )
    .output(z.object({ deployment: deploymentOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, ...params } = input
      const deployment = await appwriteFunctionsService.createTemplateDeployment(
        context.auth.accountId,
        regionId,
        params,
      )
      return { deployment }
    }),

  /**
   * Create a deployment when a function is connected to VCS. Create from branch, commit, or tag.
   */
  createVcsDeployment: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/functions/{functionId}/deployments/vcs',
      tags: ['functions'],
      summary: 'Create a deployment from VCS',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        type: vcsReferenceTypeSchema.meta({ description: 'Reference type: branch or commit' }),
        reference: z.string().meta({ description: 'Branch name or commit hash' }),
        activate: z.boolean().optional().meta({ description: 'Activate when build finishes' }),
      }),
    )
    .output(z.object({ deployment: deploymentOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, functionId, type, reference, activate } = input
      const deployment = await appwriteFunctionsService.createVcsDeployment(
        context.auth.accountId,
        regionId,
        {
          functionId,
          type,
          reference,
          activate,
        },
      )
      return { deployment }
    }),

  /** Get a function deployment by its unique ID. */
  getDeployment: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/{functionId}/deployments/{deploymentId}',
      tags: ['functions'],
      summary: 'Get a deployment by ID',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        deploymentId: z.string().meta({ description: 'Deployment ID' }),
      }),
    )
    .output(z.object({ deployment: deploymentOutputSchema }))
    .handler(async ({ context, input }) => {
      const deployment = await appwriteFunctionsService.getDeployment(
        context.auth.accountId,
        input.regionId,
        {
          functionId: input.functionId,
          deploymentId: input.deploymentId,
        },
      )
      return { deployment }
    }),

  /** Delete a code deployment by its unique ID. */
  deleteDeployment: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/functions/{functionId}/deployments/{deploymentId}',
      tags: ['functions'],
      summary: 'Delete a deployment',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        deploymentId: z.string().meta({ description: 'Deployment ID' }),
      }),
    )
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await appwriteFunctionsService.deleteDeployment(context.auth.accountId, input.regionId, {
        functionId: input.functionId,
        deploymentId: input.deploymentId,
      })
    }),

  /**
   * Cancel an ongoing function deployment build. If build is in progress it is stopped and marked canceled. If not started, marked canceled without executing.
   * Cannot cancel builds that already completed (status 'ready') or failed.
   */
  updateDeploymentStatus: userOrAppUserProtectedProcedure
    .route({
      method: 'PATCH',
      path: '/functions/{functionId}/deployments/{deploymentId}/status',
      tags: ['functions'],
      summary: 'Cancel an ongoing deployment build',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        deploymentId: z.string().meta({ description: 'Deployment ID' }),
      }),
    )
    .output(z.object({ deployment: deploymentOutputSchema }))
    .handler(async ({ context, input }) => {
      const deployment = await appwriteFunctionsService.updateDeploymentStatus(
        context.auth.accountId,
        input.regionId,
        {
          functionId: input.functionId,
          deploymentId: input.deploymentId,
        },
      )
      return { deployment }
    }),

  /**
   * Get a list of all the current user function execution logs. Cursor-based pagination.
   */
  listExecutions: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/{functionId}/executions',
      tags: ['functions'],
      summary: 'List function execution logs',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
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
      }),
    )
    .output(
      z.object({
        executions: z
          .array(executionOutputSchema)
          .meta({ description: 'List of function execution logs.' }),
        hasMore: z.boolean().meta({ description: 'Whether there are more results.' }),
        cursor: z.string().optional().meta({ description: 'Pagination cursor for next page.' }),
      }),
    )
    .handler(async ({ context, input }) => {
      const { regionId, functionId, cursor, limit } = input
      return appwriteFunctionsService.listExecutions(context.auth.accountId, regionId, {
        functionId,
        cursor,
        limit,
      })
    }),

  /**
   * Trigger a function execution. Returns current execution status. Call Get Execution to poll for updates. Execution runs asynchronously.
   */
  createExecution: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/functions/{functionId}/executions',
      tags: ['functions'],
      summary: 'Trigger a function execution',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        body: z
          .string()
          .optional()
          .meta({ description: 'HTTP body of execution. Default empty string' }),
        async: z.boolean().optional().meta({ description: 'Execute in background. Default false' }),
        xpath: z.string().optional().meta({
          description: 'HTTP path of execution. Path can include query params. Default /',
        }),
        method: executionMethodSchema.optional().meta({ description: 'HTTP method. Default POST' }),
        headers: z
          .record(z.string(), z.string())
          .optional()
          .meta({ description: 'HTTP headers. Defaults empty' }),
        scheduledAt: z.string().optional().meta({
          description:
            'Scheduled execution time in ISO 8601 format. Must be in future with precision in minutes',
        }),
      }),
    )
    .output(z.object({ execution: executionOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, ...params } = input
      const execution = await appwriteFunctionsService.createExecution(
        context.auth.accountId,
        regionId,
        params,
      )
      return { execution }
    }),

  /** Get a function execution log by its unique ID. */
  getExecution: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/{functionId}/executions/{executionId}',
      tags: ['functions'],
      summary: 'Get an execution by ID',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        executionId: z.string().meta({ description: 'Execution ID' }),
      }),
    )
    .output(z.object({ execution: executionOutputSchema }))
    .handler(async ({ context, input }) => {
      const execution = await appwriteFunctionsService.getExecution(
        context.auth.accountId,
        input.regionId,
        {
          functionId: input.functionId,
          executionId: input.executionId,
        },
      )
      return { execution }
    }),

  /** Delete a function execution by its unique ID. */
  deleteExecution: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/functions/{functionId}/executions/{executionId}',
      tags: ['functions'],
      summary: 'Delete an execution',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        executionId: z.string().meta({ description: 'Execution ID' }),
      }),
    )
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await appwriteFunctionsService.deleteExecution(context.auth.accountId, input.regionId, {
        functionId: input.functionId,
        executionId: input.executionId,
      })
    }),

  /**
   * Get usage metrics and statistics for a specific function. View deployments, builds, executions, storage, compute time. Use range: 24h, 30d, or 90d. Default 30 days.
   */
  getUsage: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/{functionId}/usage',
      tags: ['functions'],
      summary: 'Get usage metrics for a function',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        range: usageRangeSchema.optional().meta({ description: 'Date range' }),
      }),
    )
    .output(
      z.object({
        usage: z.object({
          range: z.string().meta({ description: 'The time range of the usage stats.' }),
          deploymentsTotal: z
            .number()
            .meta({ description: 'Total aggregated number of function deployments.' }),
          deploymentsStorageTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of function deployments storage.' }),
          buildsTotal: z
            .number()
            .meta({ description: 'Total aggregated number of function builds.' }),
          buildsSuccessTotal: z
            .number()
            .meta({ description: 'Total aggregated number of successful function builds.' }),
          buildsFailedTotal: z
            .number()
            .meta({ description: 'Total aggregated number of failed function builds.' }),
          buildsStorageTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of function builds storage.' }),
          buildsTimeTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of function builds compute time.' }),
          buildsTimeAverage: z.number().meta({ description: 'Average builds compute time.' }),
          buildsMbSecondsTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of function builds mbSeconds.' }),
          executionsTotal: z
            .number()
            .meta({ description: 'Total aggregated number of function executions.' }),
          executionsTimeTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of function executions compute time.' }),
          executionsMbSecondsTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of function executions mbSeconds.' }),
          deployments: z
            .array(metricOutputSchema)
            .meta({ description: 'Aggregated number of function deployments per period.' }),
          deploymentsStorage: z
            .array(metricOutputSchema)
            .meta({ description: 'Aggregated number of function deployments storage per period.' }),
          builds: z
            .array(metricOutputSchema)
            .meta({ description: 'Aggregated number of function builds per period.' }),
          buildsStorage: z
            .array(metricOutputSchema)
            .meta({ description: 'Aggregated sum of function builds storage per period.' }),
          buildsTime: z
            .array(metricOutputSchema)
            .meta({ description: 'Aggregated sum of function builds compute time per period.' }),
          buildsMbSeconds: z
            .array(metricOutputSchema)
            .meta({ description: 'Aggregated number of function builds mbSeconds per period.' }),
          executions: z
            .array(metricOutputSchema)
            .meta({ description: 'Aggregated number of function executions per period.' }),
          executionsTime: z.array(metricOutputSchema).meta({
            description: 'Aggregated number of function executions compute time per period.',
          }),
          executionsMbSeconds: z
            .array(metricOutputSchema)
            .meta({ description: 'Aggregated number of function mbSeconds per period.' }),
          buildsSuccess: z
            .array(metricOutputSchema)
            .meta({ description: 'Aggregated number of successful builds per period.' }),
          buildsFailed: z
            .array(metricOutputSchema)
            .meta({ description: 'Aggregated number of failed builds per period.' }),
        }),
      }),
    )
    .handler(async ({ context, input }) => {
      const { regionId, functionId, range } = input
      const usage = await appwriteFunctionsService.getFunctionUsage(
        context.auth.accountId,
        regionId,
        {
          functionId,
          ...(range && { range }),
        },
      )
      return { usage }
    }),

  /** Get a list of all variables of a specific function. */
  listVariables: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/{functionId}/variables',
      tags: ['functions'],
      summary: 'List function variables',
    })
    .input(regionInput.extend({ functionId: z.string().meta({ description: 'Function ID' }) }))
    .output(
      z.object({
        total: z
          .number()
          .meta({ description: 'Total number of variables that matched your query.' }),
        variables: z
          .array(functionVariableOutputSchema)
          .meta({ description: 'List of variables.' }),
      }),
    )
    .handler(async ({ context, input }) => {
      return appwriteFunctionsService.listVariables(context.auth.accountId, input.regionId, {
        functionId: input.functionId,
      })
    }),

  /**
   * Create a new function environment variable. Accessible at runtime as environment variables.
   */
  createVariable: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/functions/{functionId}/variables',
      tags: ['functions'],
      summary: 'Create a function variable',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        key: z.string().max(255).meta({ description: 'Variable key' }),
        value: z.string().max(8192).meta({ description: 'Variable value' }),
        secret: z.boolean().optional().meta({
          description:
            'Secret variables can be updated or deleted; only functions can read them at build and runtime',
        }),
      }),
    )
    .output(z.object({ variable: functionVariableOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, functionId, key, value, secret } = input
      const variable = await appwriteFunctionsService.createVariable(
        context.auth.accountId,
        regionId,
        {
          functionId,
          key,
          value,
          secret,
        },
      )
      return { variable }
    }),

  /** Get a variable by its unique ID. */
  getVariable: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/functions/{functionId}/variables/{variableId}',
      tags: ['functions'],
      summary: 'Get a variable by ID',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        variableId: z.string().meta({ description: 'Variable ID' }),
      }),
    )
    .output(z.object({ variable: functionVariableOutputSchema }))
    .handler(async ({ context, input }) => {
      const variable = await appwriteFunctionsService.getVariable(
        context.auth.accountId,
        input.regionId,
        {
          functionId: input.functionId,
          variableId: input.variableId,
        },
      )
      return { variable }
    }),

  /** Update variable by its unique ID. */
  updateVariable: userOrAppUserProtectedProcedure
    .route({
      method: 'PATCH',
      path: '/functions/{functionId}/variables/{variableId}',
      tags: ['functions'],
      summary: 'Update a variable',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        variableId: z.string().meta({ description: 'Variable ID' }),
        key: z.string().max(255).meta({ description: 'Variable key' }),
        value: z.string().max(8192).optional().meta({ description: 'Variable value' }),
        secret: z.boolean().optional().meta({
          description: 'Secret variables can be updated or deleted; only functions can read them',
        }),
      }),
    )
    .output(z.object({ variable: functionVariableOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, ...params } = input
      const variable = await appwriteFunctionsService.updateVariable(
        context.auth.accountId,
        regionId,
        params,
      )
      return { variable }
    }),

  /** Delete a variable by its unique ID. */
  deleteVariable: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/functions/{functionId}/variables/{variableId}',
      tags: ['functions'],
      summary: 'Delete a variable',
    })
    .input(
      regionInput.extend({
        functionId: z.string().meta({ description: 'Function ID' }),
        variableId: z.string().meta({ description: 'Variable ID' }),
      }),
    )
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await appwriteFunctionsService.deleteVariable(context.auth.accountId, input.regionId, {
        functionId: input.functionId,
        variableId: input.variableId,
      })
    }),
}
