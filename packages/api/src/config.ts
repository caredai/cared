import { maxMembers, maxOrganizations } from '@cared/auth'

export const cfg = {
  /**
   * User-level resource limitations
   * Defines the maximum resources allocated to each user
   */
  perUser: {
    /**
     * Maximum number of organizations a user can create
     */
    maxOrganizations,
    /**
     * Maximum number of organizations a user can create or join
     */
    maxMemberships: 10,
    /**
     * Maximum number of user-scoped API keys that can be created by a user
     */
    maxApiKeys: 50,
    /**
     * Provider-level resource limitations
     * Defines the maximum resources allocated to each provider
     */
    perProvider: {
      /**
       * Maximum number of API keys that can be created for a provider
       */
      maxApiKeys: 10,
    },
  },
  /**
   * Organization-level resource limitations
   * Defines the maximum resources allocated to each organization
   */
  perOrganization: {
    /**
     * Maximum number of members in an organization
     */
    maxMembers,
    /**
     * Maximum number of workspaces an organization can create or join
     */
    maxWorkspaces: 5,
    /**
     * Maximum number of organization-scoped API keys that can be created for an organization
     */
    maxApiKeys: 5,
    /**
     * Provider-level resource limitations
     * Defines the maximum resources allocated to each provider
     */
    perProvider: {
      /**
       * Maximum number of API keys that can be created for a provider
       */
      maxApiKeys: 10,
    },
  },

  /**
   * Workspace-level resource limitations
   * Defines the maximum resources allocated to each workspace
   */
  perWorkspace: {
    /**
     * Maximum number of applications that can be created in a workspace
     */
    maxApps: 100,
    /**
     * Maximum number of datasets that can be created in a workspace
     */
    maxDatasets: 100,
    /**
     * Maximum total number of documents across all datasets in a workspace
     * This limit applies to the sum of all documents in all datasets
     */
    maxDocuments: 1000,
    /**
     * Maximum total storage size (in GB) for all datasets in a workspace
     * This limit applies to the combined size of all datasets
     */
    maxStorageSizeGB: 20,
    /**
     * Maximum number of workspace-scoped API keys that can be created for a workspace
     */
    maxApiKeys: 5,
  },

  /**
   * Application-level resource limitations
   * Defines the maximum resources allocated to each application
   */
  perApp: {
    /**
     * Maximum number of agents that can be created for an application
     */
    maxAgents: 10,
    /**
     * Maximum number of app-scoped API keys that can be created for an application
     */
    maxApiKeys: 5,
  },

  /**
   * Chat-level resource limitations
   */
  perChat: {
    /**
     * Maximum number of messages that can be stored in a chat
     */
    maxMessages: 10000,
  },
}
