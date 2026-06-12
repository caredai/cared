export interface RegionInput {
  id: string
  name: string
}

export interface CreateFunctionWorkflowInput {
  accountId: string
  regionIds: string[]
  name: string
  runtime: string
  execute?: string[]
  events?: string[]
  schedule?: string
  timeout?: number
  enabled?: boolean
  logging?: boolean
  entrypoint?: string
  commands?: string
  scopes?: string[]
  installationId?: string
  providerRepositoryId?: string
  providerBranch?: string
  providerSilentMode?: boolean
  providerRootDirectory?: string
  buildSpecification?: string
  runtimeSpecification?: string
}

export interface CreateFunctionWorkflowResult {
  functionId: string
}

interface CreateSiteWorkflowBaseInput {
  accountId: string
  name: string
  framework: string
  buildRuntime: string
  enabled?: boolean
  logging?: boolean
  timeout?: number
  installCommand?: string
  buildCommand?: string
  outputDirectory?: string
  adapter?: string
  installationId?: string
  fallbackFile?: string
  providerRepositoryId?: string
  providerBranch?: string
  providerSilentMode?: boolean
  providerRootDirectory?: string
  buildSpecification?: string
  runtimeSpecification?: string
}

export interface CreateSingleRegionSiteWorkflowInput extends CreateSiteWorkflowBaseInput {
  deploymentMode: 'single_region'
  regionId: string
}

export interface CreateGlobalSiteWorkflowInput extends CreateSiteWorkflowBaseInput {
  deploymentMode: 'global'
}

export type CreateSiteWorkflowInput =
  | CreateSingleRegionSiteWorkflowInput
  | CreateGlobalSiteWorkflowInput

export interface CreateSiteWorkflowResult {
  siteId: string
}

export type ResourceType = 'function' | 'site'

export interface CreateDeploymentWorkflowInput {
  accountId: string
  resourceType: ResourceType
  resourceId: string
  primaryRegionId: string
  regionIds: string[]
  activate?: boolean
  metadata?: Record<string, unknown>
}

export interface CreateDeploymentWorkflowResult {
  deploymentId: string
}

export interface DeploymentRegionWorkflowInput {
  deploymentId: string
  accountId: string
  resourceType: ResourceType
  resourceId: string
  primaryRegionId: string
  regionId: string
}

export type RuleTriggerType = 'deployment' | 'manual'

export interface CreateRuleWorkflowInput {
  ruleId: string
  accountId: string
  resourceType: ResourceType
  resourceId: string
  triggerType: RuleTriggerType
  domain: string
  regionIds: string[]
  metadata?: Record<string, unknown>
}

export interface CreateRuleWorkflowResult {
  ruleId: string
}

export interface RuleRegionWorkflowInput {
  ruleId: string
  accountId: string
  resourceType: ResourceType
  resourceId: string
  triggerType: RuleTriggerType
  domain: string
  regionId: string
}
