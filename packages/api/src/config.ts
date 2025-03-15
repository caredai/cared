export const config = {
  /**
   * User-level resource limitations
   * Defines the maximum resources allocated to each user
   */
  perUser: {
    /**
     * Maximum number of workspaces a user can create or join
     */
    maxWorkspaces: 10,
  },

  /**
   * Workspace-level resource limitations
   * Defines the maximum resources allocated to each workspace
   */
  perWorkspace: {
    /**
     * Maximum number of members that can be added to a workspace
     */
    maxMembers: 100,

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
  },
}
