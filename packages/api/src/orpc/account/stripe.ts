import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import { getStripe } from '../../client/stripe'
import { protectedProcedure } from '../../orpc'
import { lagoService } from '../../service/lago/lago'

export const stripeRouter = {
  /**
   * Get customer information from Stripe
   * @returns Customer information
   */
  getCustomer: protectedProcedure
    .route({
      method: 'GET',
      path: '/stripe/customer',
      tags: ['stripe'],
      summary: 'Get customer information from Stripe',
    })
    .handler(async ({ context }) => {
      await context.auth.requirePermissions()
      const accountId = context.auth.accountId

      const {
        paymentProvider: { customerId },
      } = await lagoService.ensureCustomer(accountId)
      if (!customerId) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Customer not found',
        })
      }

      const stripe = getStripe()

      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Customer not found',
        })
      }

      return {
        customer,
      }
    }),

  /**
   * List payment methods for the account
   * @returns List of payment methods
   */
  listPaymentMethods: protectedProcedure
    .route({
      method: 'GET',
      path: '/stripe/payment-methods',
      tags: ['stripe'],
      summary: 'List payment methods for the account',
    })
    .handler(async ({ context }) => {
      await context.auth.requirePermissions()
      const accountId = context.auth.accountId

      const {
        paymentProvider: { customerId },
      } = await lagoService.ensureCustomer(accountId)
      if (!customerId) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Customer not found',
        })
      }

      const stripe = getStripe()

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        // Limit should be sufficient for most use cases
        limit: 100,
      })

      return {
        paymentMethods: paymentMethods.data,
      }
    }),

  /**
   * Setup intent of adding a new payment method
   * @returns Setup intent client secret and ID
   */
  setupAddPaymentMethodIntent: protectedProcedure
    .route({
      method: 'POST',
      path: '/stripe/payment-methods',
      tags: ['stripe'],
      summary: 'Add a new payment method using SetupIntent',
    })
    .handler(async ({ context }) => {
      await context.auth.requirePermissions({ credits: ['write'] })
      const accountId = context.auth.accountId

      const {
        paymentProvider: { customerId },
      } = await lagoService.ensureCustomer(accountId)
      if (!customerId) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Customer not found',
        })
      }

      const stripe = getStripe()

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: 'off_session',
        // Enable automatic payment methods to support multiple payment types
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          accountId,
        },
      })

      return {
        setupIntentClientSecret: setupIntent.client_secret!,
        setupIntentId: setupIntent.id,
      }
    }),

  /**
   * Remove a payment method
   * @param input - Payment method ID
   * @returns Success status
   */
  removePaymentMethod: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/stripe/payment-methods/{paymentMethodId}',
      tags: ['stripe'],
      summary: 'Remove a payment method',
    })
    .input(
      z.object({
        paymentMethodId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ credits: ['write'] })
      const accountId = context.auth.accountId

      const {
        paymentProvider: { customerId },
      } = await lagoService.ensureCustomer(accountId)
      if (!customerId) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Customer not found',
        })
      }

      const stripe = getStripe()

      // Verify the payment method belongs to the customer
      const paymentMethod = await stripe.paymentMethods.retrieve(input.paymentMethodId)
      if (paymentMethod.customer !== customerId) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Payment method not found',
        })
      }

      await stripe.paymentMethods.detach(input.paymentMethodId)
    }),

  /**
   * Update customer's default payment method
   * @param input - Payment method ID
   * @returns Success status
   */
  updateDefaultPaymentMethod: protectedProcedure
    .route({
      method: 'PUT',
      path: '/stripe/payment-methods/{paymentMethodId}/default',
      tags: ['stripe'],
      summary: 'Update customer default payment method',
    })
    .input(
      z.object({
        paymentMethodId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ credits: ['write'] })
      const accountId = context.auth.accountId

      const {
        paymentProvider: { customerId },
      } = await lagoService.ensureCustomer(accountId)
      if (!customerId) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Customer not found',
        })
      }

      const stripe = getStripe()

      // Verify the payment method belongs to the customer
      const paymentMethod = await stripe.paymentMethods.retrieve(input.paymentMethodId)
      if (paymentMethod.customer !== customerId) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Payment method not found',
        })
      }

      // Update customer's default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: input.paymentMethodId,
        },
      })
    }),

  /**
   * Create customer session for pricing table
   * @returns Customer session
   */
  createCustomerSession: protectedProcedure
    .route({
      method: 'POST',
      path: '/stripe/customer-session',
      tags: ['stripe'],
      summary: 'Create customer session for pricing table',
    })
    .handler(async ({ context }) => {
      await context.auth.requirePermissions({ credits: ['write'] })
      const accountId = context.auth.accountId

      const {
        paymentProvider: { customerId },
      } = await lagoService.ensureCustomer(accountId)
      if (!customerId) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Customer not found',
        })
      }

      const stripe = getStripe()

      const customerSession = await stripe.customerSessions.create({
        customer: customerId,
        components: {
          pricing_table: {
            enabled: true,
          },
        },
      })

      return {
        customerSession,
      }
    }),
}
