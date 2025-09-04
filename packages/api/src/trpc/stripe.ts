import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'

import { OrganizationScope } from '../auth'
import { getStripe } from '../client/stripe'
import { userProtectedProcedure } from '../trpc'
import { ensureCustomer } from './credits'

export const stripeRouter = {
  // Get customer information
  getCustomer: userProtectedProcedure
    .input(
      z
        .object({
          organizationId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (input?.organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, input.organizationId)
        await scope.checkPermissions()
      }

      const stripe = getStripe()
      const { customerId } = await ensureCustomer(ctx, stripe, input?.organizationId)

      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Customer not found',
        })
      }

      return {
        customer,
      }
    }),

  // List payment methods for a customer
  listPaymentMethods: userProtectedProcedure
    .input(
      z
        .object({
          organizationId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (input?.organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, input.organizationId)
        await scope.checkPermissions()
      }

      const stripe = getStripe()
      const { customerId } = await ensureCustomer(ctx, stripe, input?.organizationId)

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        // Limit should be sufficient for most use cases
        limit: 100,
      })

      return {
        paymentMethods: paymentMethods.data,
      }
    }),

  // Add a new payment method using SetupIntent
  addPaymentMethod: userProtectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, input.organizationId)
        await scope.checkPermissions({ credits: ['create'] })
      }

      const stripe = getStripe()
      const { customerId } = await ensureCustomer(ctx, stripe, input.organizationId)

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: 'off_session',
        // Enable automatic payment methods to support multiple payment types
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          ...(!input.organizationId && { userId: ctx.auth.userId }),
          ...(input.organizationId && { organizationId: input.organizationId }),
        },
      })

      return {
        clientSecret: setupIntent.client_secret!,
        setupIntentId: setupIntent.id,
      }
    }),

  // Remove a payment method
  removePaymentMethod: userProtectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        paymentMethodId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, input.organizationId)
        await scope.checkPermissions({ credits: ['delete'] })
      }

      const stripe = getStripe()
      const { customerId } = await ensureCustomer(ctx, stripe, input.organizationId)

      // Verify the payment method belongs to the customer
      const paymentMethod = await stripe.paymentMethods.retrieve(input.paymentMethodId)
      if (paymentMethod.customer !== customerId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment method not found',
        })
      }

      await stripe.paymentMethods.detach(input.paymentMethodId)
    }),
}
