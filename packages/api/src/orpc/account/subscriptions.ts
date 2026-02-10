import { z } from 'zod/v4'

import { protectedProcedure } from '../../orpc'
import { LagoService } from '../../service/lago/lago'

const lagoService = new LagoService()

export const subscriptionRouter = {
  /**
   * Get all available plans.
   */
  getPlans: protectedProcedure
    .route({
      method: 'GET',
      path: '/subscriptions/plans',
      tags: ['subscriptions'],
      summary: 'Get all available subscription plans',
    })
    .handler(async ({ context }) => {
      await context.auth.requirePermissions({ subscription: ['read'] })
      const plans = await lagoService.getPlans()

      return {
        plans,
      }
    }),

  /**
   * Create a subscription for the current account.
   */
  createSubscription: protectedProcedure
    .route({
      method: 'POST',
      path: '/subscriptions',
      tags: ['subscriptions'],
      summary: 'Create a subscription for the account',
    })
    .input(
      z.object({
        planCode: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ subscription: ['write'] })
      const accountId = context.auth.accountId

      const subscription = await lagoService.createSubscription(accountId, input.planCode)

      return {
        subscription,
      }
    }),

  /**
   * Cancel a subscription for the current account.
   */
  cancelSubscription: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/subscriptions/{planCode}',
      tags: ['subscriptions'],
      summary: 'Cancel a subscription for the account',
    })
    .input(
      z.object({
        planCode: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ subscription: ['write'] })
      const accountId = context.auth.accountId

      const subscription = await lagoService.cancelSubscription(accountId, input.planCode)

      return {
        subscription,
      }
    }),

  /**
   * Get all subscriptions for the current account.
   */
  getSubscriptions: protectedProcedure
    .route({
      method: 'GET',
      path: '/subscriptions',
      tags: ['subscriptions'],
      summary: 'Get all subscriptions for the account',
    })
    .handler(async ({ context }) => {
      await context.auth.requirePermissions({ subscription: ['read'] })
      const accountId = context.auth.accountId

      const subscriptions = await lagoService.getSubscriptions(accountId)

      return {
        subscriptions,
      }
    }),

  /**
   * Get lifetime usage for a subscription.
   */
  getSubscriptionLifetimeUsage: protectedProcedure
    .route({
      method: 'GET',
      path: '/subscriptions/{planCode}/lifetime-usage',
      tags: ['subscriptions'],
      summary: 'Get lifetime usage for a subscription',
    })
    .input(
      z.object({
        planCode: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ subscription: ['read'] })
      const accountId = context.auth.accountId

      const usage = await lagoService.getSubscriptionLifetimeUsage(accountId, input.planCode)

      return {
        usage,
      }
    }),

  /**
   * Get current usage for a subscription.
   */
  getSubscriptionCurrentUsage: protectedProcedure
    .route({
      method: 'GET',
      path: '/subscriptions/{planCode}/current-usage',
      tags: ['subscriptions'],
      summary: 'Get current usage for a subscription',
    })
    .input(
      z.object({
        planCode: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ subscription: ['read'] })
      const accountId = context.auth.accountId

      const usage = await lagoService.getSubscriptionCurrentUsage(accountId, input.planCode)

      return {
        usage,
      }
    }),

  /**
   * Get projected usage for a subscription.
   */
  getSubscriptionProjectedUsage: protectedProcedure
    .route({
      method: 'GET',
      path: '/subscriptions/{planCode}/projected-usage',
      tags: ['subscriptions'],
      summary: 'Get projected usage for a subscription',
    })
    .input(
      z.object({
        planCode: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ subscription: ['read'] })
      const accountId = context.auth.accountId

      const usage = await lagoService.getSubscriptionProjectedUsage(accountId, input.planCode)

      return {
        usage,
      }
    }),

  /**
   * Get past usage for a subscription with pagination.
   */
  getSubscriptionPastUsage: protectedProcedure
    .route({
      method: 'GET',
      path: '/subscriptions/{planCode}/past-usage',
      tags: ['subscriptions'],
      summary: 'Get past usage for a subscription',
    })
    .input(
      z.object({
        planCode: z.string().min(1),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().optional(),
        billableMetricCode: z.string().optional(),
        periodsCount: z.number().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ subscription: ['read'] })
      const accountId = context.auth.accountId

      const { usagePeriods, hasMore, cursor } = await lagoService.getSubscriptionPastUsage(
        accountId,
        input.planCode,
        {
          limit: input.limit,
          cursor: input.cursor,
          billableMetricCode: input.billableMetricCode,
          periodsCount: input.periodsCount,
        },
      )

      return {
        usagePeriods,
        hasMore,
        cursor,
      }
    }),

  /**
   * Get usage events for a subscription with pagination.
   */
  getUsageEvents: protectedProcedure
    .route({
      method: 'GET',
      path: '/subscriptions/{planCode}/usage-events',
      tags: ['subscriptions'],
      summary: 'Get usage events for a subscription',
    })
    .input(
      z.object({
        planCode: z.string().min(1),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().optional(),
        billableMetricCode: z.string().optional(),
        from: z.date().optional(),
        to: z.date().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ subscription: ['read'] })
      const accountId = context.auth.accountId

      const { events, hasMore, cursor } = await lagoService.getUsageEvents(
        accountId,
        input.planCode,
        {
          limit: input.limit,
          cursor: input.cursor,
          billableMetricCode: input.billableMetricCode,
          from: input.from,
          to: input.to,
        },
      )

      return {
        events,
        hasMore,
        cursor,
      }
    }),
}
