import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import { protectedProcedure } from '../../orpc'
import { LagoService } from '../../service/lago/lago'

const lagoService = new LagoService()

export const creditsRouter = {
  getCredits: protectedProcedure
    .route({
      method: 'GET',
      path: '/v1/credits',
      tags: ['credits'],
      summary: 'Get credits information for the account',
    })
    .handler(async ({ context }) => {
      await context.auth.requirePermissions({ credits: ['read'] })
      const accountId = context.auth.accountId

      const credits = await lagoService.ensureCredits(accountId)

      return {
        credits,
      }
    }),

  updateAutoTopUpSettings: protectedProcedure
    .route({
      method: 'PUT',
      path: '/v1/credits/auto-top-up/settings',
      tags: ['credits'],
      summary: 'Update auto top-up credits settings',
    })
    .input(
      z.object({
        autoTopUp: z
          .object({
            trigger: z.enum(['interval', 'threshold']),
            method: z.enum(['fixed', 'target']),
            thresholdCredits: z.string().optional(),
            interval: z.enum(['weekly', 'monthly', 'quarterly', 'semiannual', 'yearly']).optional(),
            startedAt: z.date().optional(),
            topUpCredits: z.string().optional(),
            targetOngoingBalance: z.string().optional(),
          })
          .superRefine((val, ctx) => {
            if (val.trigger === 'threshold') {
              if (!val.thresholdCredits) {
                ctx.addIssue({
                  code: 'custom',
                  message: '`thresholdCredits` is required for threshold trigger',
                  input: val,
                })
                return
              }
            } else {
              if (!val.interval) {
                ctx.addIssue({
                  code: 'custom',
                  message: '`interval` is required for interval trigger',
                  input: val,
                })
                return
              }
              if (!val.startedAt) {
                ctx.addIssue({
                  code: 'custom',
                  message: '`startedAt` is required for interval trigger',
                  input: val,
                })
                return
              }
            }

            if (val.method === 'fixed') {
              if (!val.topUpCredits) {
                ctx.addIssue({
                  code: 'custom',
                  message: '`topUpCredits` is required for fixed method',
                  input: val,
                })
                return
              }
            } else {
              if (!val.targetOngoingBalance) {
                ctx.addIssue({
                  code: 'custom',
                  message: '`targetOngoingBalance` is required for target method',
                  input: val,
                })
                return
              }
            }
          })
          .nullable(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ credits: ['write'] })
      const accountId = context.auth.accountId

      const credits = await lagoService.updateCredits(accountId, { autoTopUp: input.autoTopUp })

      return {
        credits,
      }
    }),

  topUpCredits: protectedProcedure
    .route({
      method: 'POST',
      path: '/v1/credits/top-up',
      tags: ['credits'],
      summary: 'Create a top-up credits transaction',
    })
    .input(
      z.object({
        credits: z.coerce.number().int().min(5).max(1000),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ credits: ['write'] })
      const accountId = context.auth.accountId

      const transaction = await lagoService.topUpCredits(accountId, input.credits)

      return {
        transaction,
      }
    }),

  /**
   * Generate payment URL for a top-up transaction.
   */
  generateTopUpUrl: protectedProcedure
    .route({
      method: 'POST',
      path: '/v1/credits/top-up/payment-url',
      tags: ['credits'],
      summary: 'Generate a payment URL for the top-up transaction',
    })
    .input(
      z.object({
        transactionId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ credits: ['write'] })
      const paymentUrl = await lagoService.generateTopUpPaymentUrl(input.transactionId)

      if (!paymentUrl) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Payment link unavailable or already settled',
        })
      }

      return {
        paymentUrl,
      }
    }),

  getTransactions: protectedProcedure
    .route({
      method: 'GET',
      path: '/v1/credits/transactions',
      tags: ['credits'],
      summary: 'List credits transactions',
    })
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ credits: ['read'] })
      const accountId = context.auth.accountId

      const { transactions, hasMore, cursor } = await lagoService.getCreditsTransactions(
        accountId,
        input,
      )

      return {
        transactions,
        hasMore,
        cursor,
      }
    }),
}
