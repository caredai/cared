import { maxAccounts, maxMembers } from '@cared/auth'

export const cfg = {
  /**
   * Platform-level configurations
   * Defines global settings for the platform
   */
  platform: {
    /**
     * Fee rate applied to credits purchased by users
     */
    creditsFeeRate: 0.05,

    model: {
      /**
       * Circuit breaker settings for handling AI model call failures.
       * Prevents overwhelming AI services by limiting requests after repeated failures.
       */
      circuitBreaker: {
        /**
         * Number of failures before opening the circuit.
         * If the number of failures exceeds this threshold within the window duration,
         * the circuit will open and block further requests for the cooldown period.
         */
        failureThreshold: 5,

        /**
         * Time window (in milliseconds) to monitor failures
         */
        windowDuration: 10 * 60 * 1000, // 10 minutes

        /**
         * Time (in milliseconds) the circuit remains open
         */
        cooldownPeriod: 5 * 60 * 1000, // 5 minutes
      },
    },
  },
  /**
   * User-level resource limitations
   * Defines the maximum resources allocated to each user
   */
  perUser: {
    /**
     * Maximum number of accounts a user can create
     */
    maxAccounts,
    /**
     * Maximum number of accounts a user can create or join
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
    perDay: {
      /**
       * Maximum number of AI model calls a user can send per day
       */
      freeQuotaModelCalls: 500,
    },
  },
  /**
   * Account-level resource limitations
   * Defines the maximum resources allocated to each account
   */
  perAccount: {
    /**
     * Maximum number of members in an account
     */
    maxMembers,
    /**
     * Maximum number of applications that can be created in an account
     */
    maxApps: 100,
    /**
     * Maximum number of account-scoped API keys that can be created for an account
     */
    maxApiKeys: 5,
    perUser: {
      maxModelApiKeys: 20,
    },
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
   * Application-level resource limitations
   * Defines the maximum resources allocated to each application
   */
  perApp: {
    /**
     * Maximum number of agents that can be created for an application
     */
    maxAgents: 10,
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
