import {
  Adapter,
  BuildRuntime,
  Framework,
  Frameworks,
  TemplateReferenceType,
  UsageRange,
  UseCases,
  VCSReferenceType,
} from '@appwrite.io/console'
import { z } from 'zod/v4'

import { userOrAppUserProtectedProcedure } from '../../orpc'
import { appwriteSitesService } from '../../service/appwrite'

// Base input: every procedure requires regionId for Appwrite region-scoped API
const regionInput = z.object({
  regionId: z.string().meta({ description: 'Region ID' }),
})

const frameworkSchema = z.enum(Framework)
const buildRuntimeSchema = z.enum(BuildRuntime)
const adapterSchema = z.enum(Adapter)
const usageRangeSchema = z.enum(UsageRange)
const templateReferenceTypeSchema = z.enum(TemplateReferenceType)
const vcsReferenceTypeSchema = z.enum(VCSReferenceType)
const frameworksSchema = z.array(z.enum(Frameworks)).max(100).optional()
const useCasesSchema = z.array(z.enum(UseCases)).max(100).optional()

// --- Output schemas (normalized API responses: id not $id, dates as Date); field descriptions from SDK types ---
const siteVariableOutputSchema = z.object({
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

const siteOutputSchema = z.object({
  id: z.string().meta({ description: 'Site ID.' }),
  name: z.string().meta({ description: 'Site name.' }),
  enabled: z.boolean().meta({ description: 'Site enabled.' }),
  live: z.boolean().meta({
    description:
      'Is the site deployed with the latest configuration? Set to false when env vars, entrypoint, commands or other settings need redeploy.',
  }),
  logging: z.boolean().meta({
    description:
      'When disabled, request logs exclude logs and errors and site responses are slightly faster.',
  }),
  framework: z.string().meta({ description: 'Site framework.' }),
  deploymentId: z.string().meta({ description: "Site's active deployment ID." }),
  deploymentCreatedAt: z
    .date()
    .optional()
    .meta({ description: 'Active deployment creation date.' }),
  deploymentScreenshotLight: z
    .string()
    .meta({ description: 'Screenshot of active deployment with light theme file ID.' }),
  deploymentScreenshotDark: z
    .string()
    .meta({ description: 'Screenshot of active deployment with dark theme file ID.' }),
  latestDeploymentId: z.string().meta({ description: "Site's latest deployment ID." }),
  latestDeploymentCreatedAt: z
    .date()
    .optional()
    .meta({ description: 'Latest deployment creation date.' }),
  latestDeploymentStatus: z.string().meta({
    description:
      'Status of latest deployment. Possible values: waiting, processing, building, ready, failed.',
  }),
  vars: z.array(siteVariableOutputSchema).meta({ description: 'Site variables.' }),
  timeout: z.number().meta({ description: 'Site request timeout in seconds.' }),
  installCommand: z
    .string()
    .meta({ description: 'The install command used to install the site dependencies.' }),
  buildCommand: z.string().meta({ description: 'The build command used to build the site.' }),
  outputDirectory: z
    .string()
    .meta({ description: 'The directory where the site build output is located.' }),
  installationId: z.string().meta({ description: 'Site VCS installation id.' }),
  providerRepositoryId: z.string().meta({ description: 'VCS Repository ID.' }),
  providerBranch: z.string().meta({ description: 'VCS branch name.' }),
  providerRootDirectory: z.string().meta({ description: 'Path to site in VCS repository.' }),
  providerSilentMode: z.boolean().meta({
    description:
      'Is VCS connection in silent mode? In silent mode no comments are posted on pull or merge requests.',
  }),
  specification: z
    .string()
    .meta({ description: 'Machine specification for builds and executions.' }),
  buildRuntime: z.string().meta({ description: 'Site build runtime.' }),
  adapter: z.string().meta({ description: 'Site framework adapter.' }),
  fallbackFile: z.string().meta({
    description:
      'Name of fallback file to use instead of 404 page. If null, the default 404 page is displayed.',
  }),
  createdAt: z.date().meta({ description: 'Site creation date.' }),
  updatedAt: z.date().meta({ description: 'Site update date.' }),
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

const templateSiteOutputSchema = z.object({
  key: z.string().meta({ description: 'Site template ID.' }),
  name: z.string().meta({ description: 'Site template name.' }),
  tagline: z.string().meta({ description: 'Short description of template.' }),
  demoUrl: z.string().meta({ description: 'URL hosting a template demo.' }),
  screenshotDark: z
    .string()
    .meta({ description: 'File URL with preview screenshot in dark theme preference.' }),
  screenshotLight: z
    .string()
    .meta({ description: 'File URL with preview screenshot in light theme preference.' }),
  useCases: z.array(z.string()).meta({ description: 'Site use cases.' }),
  frameworks: z
    .array(
      z.object({
        key: z.string().meta({ description: 'Parent framework key.' }),
        name: z.string().meta({ description: 'Framework name.' }),
        installCommand: z
          .string()
          .meta({ description: 'The install command used to install the dependencies.' }),
        buildCommand: z
          .string()
          .meta({ description: 'The build command used to build the deployment.' }),
        outputDirectory: z
          .string()
          .meta({ description: 'The output directory to store the build output.' }),
        providerRootDirectory: z.string().meta({ description: 'Path to site in VCS repository.' }),
        buildRuntime: z
          .string()
          .meta({ description: 'Runtime used during build step of template.' }),
        adapter: z.string().meta({ description: 'Site framework runtime.' }),
        fallbackFile: z
          .string()
          .meta({ description: 'Fallback file for SPA. Only relevant for static serve runtime.' }),
      }),
    )
    .meta({ description: 'List of frameworks that can be used with this template.' }),
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
    .meta({ description: 'Site variables.' }),
})

const metricOutputSchema = z.object({
  value: z.number().meta({ description: 'Metric value.' }),
  date: z.string().meta({ description: 'Date string for the period.' }),
})

export const siteRouter = {
  /** Enable Sites API for the account in the given region (ensure project/user/key). */
  enableSites: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sites/enable',
      tags: ['sites'],
      summary: 'Enable Sites API for the account in the region',
    })
    .input(regionInput)
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await appwriteSitesService.ensure(context.auth.accountId, input.regionId)
    }),

  /** List all available Appwrite regions. */
  listRegions: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/regions',
      tags: ['sites'],
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
      const regions = appwriteSitesService.listRegions()
      return { regions }
    }),

  /**
   * Get a list of all the project's sites. Cursor-based pagination with Query.limit, Query.orderDesc($createdAt), Query.cursorBefore.
   */
  listSites: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites',
      tags: ['sites'],
      summary: 'List all project sites with cursor pagination',
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
        sites: z.array(siteOutputSchema).meta({ description: 'List of sites.' }),
        hasMore: z.boolean().meta({ description: 'Whether there are more results.' }),
        cursor: z.string().optional().meta({ description: 'Pagination cursor for next page.' }),
      }),
    )
    .handler(async ({ context, input }) => {
      const { regionId, cursor, limit, search } = input
      return appwriteSitesService.list(context.auth.accountId, regionId, { cursor, limit, search })
    }),

  /**
   * Create a new site.
   */
  createSite: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sites',
      tags: ['sites'],
      summary: 'Create a new site',
    })
    .input(
      regionInput.extend({
        siteId: z
          .string()
          .max(36)
          .meta({ description: 'Site ID. Valid chars: a-z, A-Z, 0-9, period, hyphen, underscore' }),
        name: z.string().max(128).meta({ description: 'Site name' }),
        framework: frameworkSchema.meta({ description: 'Sites framework' }),
        buildRuntime: buildRuntimeSchema.meta({ description: 'Runtime to use during build step' }),
        enabled: z.boolean().optional().meta({
          description:
            "Is site enabled? When 'disabled', Server SDKs with API key can still access. No data lost when toggled.",
        }),
        logging: z
          .boolean()
          .optional()
          .meta({ description: 'When disabled, request logs exclude logs and errors' }),
        timeout: z.number().optional().meta({ description: 'Maximum request time in seconds' }),
        installCommand: z.string().optional().meta({ description: 'Install command' }),
        buildCommand: z.string().optional().meta({ description: 'Build command' }),
        outputDirectory: z.string().optional().meta({ description: 'Output directory for site' }),
        adapter: adapterSchema.optional().meta({ description: 'Framework adapter: static or ssr' }),
        installationId: z
          .string()
          .optional()
          .meta({ description: 'Installation ID for VCS deployment' }),
        fallbackFile: z.string().optional().meta({ description: 'Fallback file for SPA sites' }),
        providerRepositoryId: z
          .string()
          .optional()
          .meta({ description: 'Repository ID linked to the site' }),
        providerBranch: z
          .string()
          .optional()
          .meta({ description: 'Production branch for the repo' }),
        providerSilentMode: z.boolean().optional().meta({ description: 'VCS silent mode' }),
        providerRootDirectory: z
          .string()
          .optional()
          .meta({ description: 'Path to site code in repo' }),
        specification: z
          .string()
          .optional()
          .meta({ description: 'Framework specification for site and builds' }),
      }),
    )
    .output(z.object({ site: siteOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, ...params } = input
      const site = await appwriteSitesService.create(context.auth.accountId, regionId, params)
      return { site }
    }),

  /** Get a list of all frameworks that are currently available on the server instance. */
  listFrameworks: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/frameworks',
      tags: ['sites'],
      summary: 'List all available frameworks',
    })
    .input(regionInput)
    .output(
      z.object({
        total: z
          .number()
          .meta({ description: 'Total number of frameworks that matched your query.' }),
        frameworks: z
          .array(
            z.object({
              key: z.string().meta({ description: 'Framework key.' }),
              name: z.string().meta({ description: 'Framework name.' }),
              buildRuntime: z.string().meta({ description: 'Default runtime version.' }),
              runtimes: z
                .array(z.string())
                .meta({ description: 'List of supported runtime versions.' }),
              adapters: z
                .array(
                  z.object({
                    key: z.string().meta({ description: 'Adapter key.' }),
                    installCommand: z
                      .string()
                      .meta({ description: 'Default command to download dependencies.' }),
                    buildCommand: z.string().meta({
                      description: 'Default command to build site into output directory.',
                    }),
                    outputDirectory: z
                      .string()
                      .meta({ description: 'Default output directory of build.' }),
                    fallbackFile: z.string().meta({
                      description:
                        'Name of fallback file to use instead of 404 page. If null, the default 404 page is displayed.',
                    }),
                  }),
                )
                .meta({ description: 'List of supported adapters.' }),
            }),
          )
          .meta({ description: 'List of frameworks.' }),
      }),
    )
    .handler(async ({ context, input }) => {
      return appwriteSitesService.listFrameworks(context.auth.accountId, input.regionId)
    }),

  /** List allowed site specifications for this instance. */
  listSpecifications: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/specifications',
      tags: ['sites'],
      summary: 'List allowed site specifications',
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
      return appwriteSitesService.listSpecifications(context.auth.accountId, input.regionId)
    }),

  /** List available site templates. Cursor-based pagination (cursor is offset as string for templates API). */
  listTemplates: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/templates',
      tags: ['sites'],
      summary: 'List available site templates',
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
        frameworks: frameworksSchema.meta({ description: 'Frameworks for filtering templates' }),
        useCases: useCasesSchema.meta({ description: 'Use cases for filtering templates' }),
      }),
    )
    .output(
      z.object({
        templates: z
          .array(templateSiteOutputSchema)
          .meta({ description: 'List of site templates.' }),
        hasMore: z.boolean().meta({ description: 'Whether there are more results.' }),
        cursor: z.string().optional().meta({ description: 'Pagination cursor for next page.' }),
      }),
    )
    .handler(async ({ context, input }) => {
      const { regionId, cursor, limit, frameworks, useCases } = input
      return appwriteSitesService.listTemplates(context.auth.accountId, regionId, {
        cursor,
        limit,
        frameworks,
        useCases,
      })
    }),

  /** Get a site template using ID. */
  getTemplate: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/templates/{templateId}',
      tags: ['sites'],
      summary: 'Get a site template by ID',
    })
    .input(regionInput.extend({ templateId: z.string().meta({ description: 'Template ID' }) }))
    .output(z.object({ template: templateSiteOutputSchema }))
    .handler(async ({ context, input }) => {
      const template = await appwriteSitesService.getTemplate(
        context.auth.accountId,
        input.regionId,
        {
          templateId: input.templateId,
        },
      )
      return { template }
    }),

  /**
   * Get usage metrics and statistics for all sites in the project. Not a list endpoint.
   * Use optional range: 24h, 30d, or 90d. Defaults to 30 days.
   */
  getAllSitesUsage: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/usage',
      tags: ['sites'],
      summary: 'Get usage metrics for all project sites',
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
          sitesTotal: z.number().meta({ description: 'Total aggregated number of sites.' }),
          sites: z
            .array(metricOutputSchema)
            .meta({ description: 'Aggregated number of sites per period.' }),
          deploymentsTotal: z
            .number()
            .meta({ description: 'Total aggregated number of sites deployments.' }),
          deploymentsStorageTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of sites deployment storage.' }),
          buildsTotal: z.number().meta({ description: 'Total aggregated number of sites build.' }),
          buildsStorageTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of sites build storage.' }),
          buildsTimeTotal: z
            .number()
            .meta({ description: 'Total aggregated sum of sites build compute time.' }),
          buildsMbSecondsTotal: z
            .number()
            .optional()
            .meta({ description: 'Total aggregated sum of sites build mbSeconds.' }),
          buildsSuccessTotal: z
            .number()
            .optional()
            .meta({ description: 'Total aggregated number of successful site builds.' }),
          buildsFailedTotal: z
            .number()
            .optional()
            .meta({ description: 'Total aggregated number of failed site builds.' }),
          deployments: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of sites deployment per period.' }),
          deploymentsStorage: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of sites deployment storage per period.' }),
          builds: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of sites build per period.' }),
          buildsStorage: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated sum of sites build storage per period.' }),
          buildsTime: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated sum of sites build compute time per period.' }),
          buildsMbSeconds: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated sum of sites build mbSeconds per period.' }),
          buildsSuccess: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of successful site builds per period.' }),
          buildsFailed: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of failed site builds per period.' }),
        }),
      }),
    )
    .handler(async ({ context, input }) => {
      const { regionId, range } = input
      const usage = await appwriteSitesService.getAllSitesUsage(
        context.auth.accountId,
        regionId,
        range ? { range } : undefined,
      )
      return { usage }
    }),

  /** Get a site by its unique ID. */
  getSite: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/{siteId}',
      tags: ['sites'],
      summary: 'Get a site by ID',
    })
    .input(regionInput.extend({ siteId: z.string().meta({ description: 'Site ID' }) }))
    .output(z.object({ site: siteOutputSchema }))
    .handler(async ({ context, input }) => {
      const site = await appwriteSitesService.get(context.auth.accountId, input.regionId, {
        siteId: input.siteId,
      })
      return { site }
    }),

  /** Update site by its unique ID. */
  updateSite: userOrAppUserProtectedProcedure
    .route({
      method: 'PATCH',
      path: '/sites/{siteId}',
      tags: ['sites'],
      summary: 'Update a site',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        name: z.string().max(128).meta({ description: 'Site name' }),
        framework: frameworkSchema.meta({ description: 'Sites framework' }),
        enabled: z.boolean().optional().meta({ description: 'Is site enabled?' }),
        logging: z
          .boolean()
          .optional()
          .meta({ description: 'When disabled, request logs exclude logs and errors' }),
        timeout: z.number().optional().meta({ description: 'Maximum request time in seconds' }),
        installCommand: z.string().optional().meta({ description: 'Install command' }),
        buildCommand: z.string().optional().meta({ description: 'Build command' }),
        outputDirectory: z.string().optional().meta({ description: 'Output directory' }),
        buildRuntime: buildRuntimeSchema
          .optional()
          .meta({ description: 'Runtime during build step' }),
        adapter: adapterSchema.optional().meta({ description: 'Framework adapter' }),
        fallbackFile: z.string().optional().meta({ description: 'Fallback file for SPA' }),
        installationId: z.string().optional().meta({ description: 'Installation ID for VCS' }),
        providerRepositoryId: z
          .string()
          .optional()
          .meta({ description: 'Repository ID linked to the site' }),
        providerBranch: z.string().optional().meta({ description: 'Production branch' }),
        providerSilentMode: z.boolean().optional().meta({ description: 'VCS silent mode' }),
        providerRootDirectory: z
          .string()
          .optional()
          .meta({ description: 'Path to site code in repo' }),
        specification: z.string().optional().meta({ description: 'Framework specification' }),
      }),
    )
    .output(z.object({ site: siteOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, ...params } = input
      const site = await appwriteSitesService.update(context.auth.accountId, regionId, params)
      return { site }
    }),

  /** Delete a site by its unique ID. */
  deleteSite: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/sites/{siteId}',
      tags: ['sites'],
      summary: 'Delete a site',
    })
    .input(regionInput.extend({ siteId: z.string().meta({ description: 'Site ID' }) }))
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await appwriteSitesService.delete(context.auth.accountId, input.regionId, {
        siteId: input.siteId,
      })
    }),

  /** Update the site active deployment. Use this endpoint to switch the code deployment used when the site is opened. */
  updateDeployment: userOrAppUserProtectedProcedure
    .route({
      method: 'PUT',
      path: '/sites/{siteId}/deployment',
      tags: ['sites'],
      summary: 'Update the site active deployment',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        deploymentId: z.string().meta({ description: 'Deployment ID to activate' }),
      }),
    )
    .output(z.object({ site: siteOutputSchema }))
    .handler(async ({ context, input }) => {
      const site = await appwriteSitesService.updateDeployment(
        context.auth.accountId,
        input.regionId,
        {
          siteId: input.siteId,
          deploymentId: input.deploymentId,
        },
      )
      return { site }
    }),

  /** Get a list of all the site's code deployments. Cursor-based pagination. */
  listDeployments: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/{siteId}/deployments',
      tags: ['sites'],
      summary: 'List site code deployments',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
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
      const { regionId, siteId, cursor, limit, search } = input
      return appwriteSitesService.listDeployments(context.auth.accountId, regionId, {
        siteId,
        cursor,
        limit,
        search,
      })
    }),

  /** Create a new build for an existing site deployment. Rebuilds with updated site configuration. */
  createDuplicateDeployment: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sites/{siteId}/deployments/{deploymentId}/duplicate',
      tags: ['sites'],
      summary: 'Create a new build for an existing deployment',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        deploymentId: z.string().meta({ description: 'Deployment ID' }),
      }),
    )
    .output(z.object({ deployment: deploymentOutputSchema }))
    .handler(async ({ context, input }) => {
      const deployment = await appwriteSitesService.createDuplicateDeployment(
        context.auth.accountId,
        input.regionId,
        {
          siteId: input.siteId,
          deploymentId: input.deploymentId,
        },
      )
      return { deployment }
    }),

  /** Create a deployment based on a template. Use with listTemplates to find template details. */
  createTemplateDeployment: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sites/{siteId}/deployments/template',
      tags: ['sites'],
      summary: 'Create a deployment from a template',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        repository: z.string().meta({ description: 'Repository name of the template' }),
        owner: z.string().meta({ description: 'Owner of the template' }),
        rootDirectory: z.string().meta({ description: 'Path to site code in the template repo' }),
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
      const deployment = await appwriteSitesService.createTemplateDeployment(
        context.auth.accountId,
        regionId,
        params,
      )
      return { deployment }
    }),

  /** Create a deployment when a site is connected to VCS. Create from branch, commit, or tag. */
  createVcsDeployment: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sites/{siteId}/deployments/vcs',
      tags: ['sites'],
      summary: 'Create a deployment from VCS',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        type: vcsReferenceTypeSchema.meta({ description: 'Reference type: branch or commit' }),
        reference: z.string().meta({ description: 'Branch name or commit hash' }),
        activate: z.boolean().optional().meta({ description: 'Activate when build finishes' }),
      }),
    )
    .output(z.object({ deployment: deploymentOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, siteId, type, reference, activate } = input
      const deployment = await appwriteSitesService.createVcsDeployment(
        context.auth.accountId,
        regionId,
        {
          siteId,
          type,
          reference,
          activate,
        },
      )
      return { deployment }
    }),

  /** Get a site deployment by its unique ID. */
  getDeployment: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/{siteId}/deployments/{deploymentId}',
      tags: ['sites'],
      summary: 'Get a deployment by ID',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        deploymentId: z.string().meta({ description: 'Deployment ID' }),
      }),
    )
    .output(z.object({ deployment: deploymentOutputSchema }))
    .handler(async ({ context, input }) => {
      const deployment = await appwriteSitesService.getDeployment(
        context.auth.accountId,
        input.regionId,
        {
          siteId: input.siteId,
          deploymentId: input.deploymentId,
        },
      )
      return { deployment }
    }),

  /** Delete a site deployment by its unique ID. */
  deleteDeployment: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/sites/{siteId}/deployments/{deploymentId}',
      tags: ['sites'],
      summary: 'Delete a deployment',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        deploymentId: z.string().meta({ description: 'Deployment ID' }),
      }),
    )
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await appwriteSitesService.deleteDeployment(context.auth.accountId, input.regionId, {
        siteId: input.siteId,
        deploymentId: input.deploymentId,
      })
    }),

  /** Cancel an ongoing site deployment build. */
  updateDeploymentStatus: userOrAppUserProtectedProcedure
    .route({
      method: 'PATCH',
      path: '/sites/{siteId}/deployments/{deploymentId}/status',
      tags: ['sites'],
      summary: 'Cancel an ongoing deployment build',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        deploymentId: z.string().meta({ description: 'Deployment ID' }),
      }),
    )
    .output(z.object({ deployment: deploymentOutputSchema }))
    .handler(async ({ context, input }) => {
      const deployment = await appwriteSitesService.updateDeploymentStatus(
        context.auth.accountId,
        input.regionId,
        {
          siteId: input.siteId,
          deploymentId: input.deploymentId,
        },
      )
      return { deployment }
    }),

  /** Get a list of all site logs. Cursor-based pagination. */
  listLogs: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/{siteId}/logs',
      tags: ['sites'],
      summary: 'List site logs',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
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
          .meta({ description: 'List of site request logs (executions).' }),
        hasMore: z.boolean().meta({ description: 'Whether there are more results.' }),
        cursor: z.string().optional().meta({ description: 'Pagination cursor for next page.' }),
      }),
    )
    .handler(async ({ context, input }) => {
      const { regionId, siteId, cursor, limit } = input
      return appwriteSitesService.listLogs(context.auth.accountId, regionId, {
        siteId,
        cursor,
        limit,
      })
    }),

  /** Get a site request log by its unique ID. */
  getLog: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/{siteId}/logs/{logId}',
      tags: ['sites'],
      summary: 'Get a log by ID',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        logId: z.string().meta({ description: 'Log ID' }),
      }),
    )
    .output(z.object({ execution: executionOutputSchema }))
    .handler(async ({ context, input }) => {
      const execution = await appwriteSitesService.getLog(context.auth.accountId, input.regionId, {
        siteId: input.siteId,
        logId: input.logId,
      })
      return { execution }
    }),

  /** Delete a site log by its unique ID. */
  deleteLog: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/sites/{siteId}/logs/{logId}',
      tags: ['sites'],
      summary: 'Delete a log',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        logId: z.string().meta({ description: 'Log ID' }),
      }),
    )
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await appwriteSitesService.deleteLog(context.auth.accountId, input.regionId, {
        siteId: input.siteId,
        logId: input.logId,
      })
    }),

  /** Get usage metrics and statistics for a specific site. Use range: 24h, 30d, or 90d. Default 30 days. */
  getUsage: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/{siteId}/usage',
      tags: ['sites'],
      summary: 'Get usage metrics for a site',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
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
          requestsTotal: z
            .number()
            .optional()
            .meta({ description: 'Total aggregated number of requests.' }),
          requests: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of requests per period.' }),
          inboundTotal: z
            .number()
            .optional()
            .meta({ description: 'Total aggregated inbound bandwidth.' }),
          inbound: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of inbound bandwidth per period.' }),
          outboundTotal: z
            .number()
            .optional()
            .meta({ description: 'Total aggregated outbound bandwidth.' }),
          outbound: z
            .array(metricOutputSchema)
            .optional()
            .meta({ description: 'Aggregated number of outbound bandwidth per period.' }),
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
      const { regionId, siteId, range } = input
      const usage = await appwriteSitesService.getUsage(context.auth.accountId, regionId, {
        siteId,
        ...(range && { range }),
      })
      return { usage }
    }),

  /** Get a list of all variables of a specific site. */
  listVariables: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/{siteId}/variables',
      tags: ['sites'],
      summary: 'List site variables',
    })
    .input(regionInput.extend({ siteId: z.string().meta({ description: 'Site ID' }) }))
    .output(
      z.object({
        total: z
          .number()
          .meta({ description: 'Total number of variables that matched your query.' }),
        variables: z.array(siteVariableOutputSchema).meta({ description: 'List of variables.' }),
      }),
    )
    .handler(async ({ context, input }) => {
      return appwriteSitesService.listVariables(context.auth.accountId, input.regionId, {
        siteId: input.siteId,
      })
    }),

  /** Create a new site environment variable. Accessible during build and runtime (SSR) as environment variables. */
  createVariable: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/sites/{siteId}/variables',
      tags: ['sites'],
      summary: 'Create a site variable',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        key: z.string().max(255).meta({ description: 'Variable key' }),
        value: z.string().max(8192).meta({ description: 'Variable value' }),
        secret: z.boolean().optional().meta({
          description:
            'Secret variables can be updated or deleted; only sites can read them at build and runtime',
        }),
      }),
    )
    .output(z.object({ variable: siteVariableOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, siteId, key, value, secret } = input
      const variable = await appwriteSitesService.createVariable(context.auth.accountId, regionId, {
        siteId,
        key,
        value,
        secret,
      })
      return { variable }
    }),

  /** Get a variable by its unique ID. */
  getVariable: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/sites/{siteId}/variables/{variableId}',
      tags: ['sites'],
      summary: 'Get a variable by ID',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        variableId: z.string().meta({ description: 'Variable ID' }),
      }),
    )
    .output(z.object({ variable: siteVariableOutputSchema }))
    .handler(async ({ context, input }) => {
      const variable = await appwriteSitesService.getVariable(
        context.auth.accountId,
        input.regionId,
        {
          siteId: input.siteId,
          variableId: input.variableId,
        },
      )
      return { variable }
    }),

  /** Update variable by its unique ID. */
  updateVariable: userOrAppUserProtectedProcedure
    .route({
      method: 'PATCH',
      path: '/sites/{siteId}/variables/{variableId}',
      tags: ['sites'],
      summary: 'Update a variable',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        variableId: z.string().meta({ description: 'Variable ID' }),
        key: z.string().max(255).meta({ description: 'Variable key' }),
        value: z.string().max(8192).optional().meta({ description: 'Variable value' }),
        secret: z.boolean().optional().meta({
          description: 'Secret variables can be updated or deleted; only sites can read them',
        }),
      }),
    )
    .output(z.object({ variable: siteVariableOutputSchema }))
    .handler(async ({ context, input }) => {
      const { regionId, ...params } = input
      const variable = await appwriteSitesService.updateVariable(
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
      path: '/sites/{siteId}/variables/{variableId}',
      tags: ['sites'],
      summary: 'Delete a variable',
    })
    .input(
      regionInput.extend({
        siteId: z.string().meta({ description: 'Site ID' }),
        variableId: z.string().meta({ description: 'Variable ID' }),
      }),
    )
    .output(z.undefined())
    .handler(async ({ context, input }) => {
      await appwriteSitesService.deleteVariable(context.auth.accountId, input.regionId, {
        siteId: input.siteId,
        variableId: input.variableId,
      })
    }),
}
