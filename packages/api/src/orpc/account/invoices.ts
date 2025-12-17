import { z } from 'zod/v4'

import { protectedProcedure } from '../../orpc'
import { LagoService } from '../../service/lago/lago'

const lagoService = new LagoService()

export const invoiceRouter = {
  /**
   * Get all invoices for the current account.
   */
  getInvoices: protectedProcedure
    .route({
      method: 'GET',
      path: '/v1/invoices',
      tags: ['invoices'],
      summary: 'Get all invoices for the account',
    })
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ invoice: ['read'] })
      const accountId = context.auth.accountId

      const { invoices, hasMore, cursor } = await lagoService.getInvoices(accountId, input)

      return {
        invoices,
        hasMore,
        cursor,
      }
    }),

  /**
   * Generate payment URL for an invoice.
   */
  generateInvoicePaymentUrl: protectedProcedure
    .route({
      method: 'POST',
      path: '/v1/invoices/{invoiceId}/payment-url',
      tags: ['invoices'],
      summary: 'Generate a payment URL for an invoice',
    })
    .input(
      z.object({
        invoiceId: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ invoice: ['write'] })
      const paymentUrl = await lagoService.generateInvoicePaymentUrl(input.invoiceId)

      return {
        paymentUrl,
      }
    }),

  /**
   * Download an invoice PDF.
   */
  downloadInvoice: protectedProcedure
    .route({
      method: 'POST',
      path: '/v1/invoices/{invoiceId}/download',
      tags: ['invoices'],
      summary: 'Get download URL for an invoice PDF',
    })
    .input(
      z.object({
        invoiceId: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ invoice: ['read'] })
      const downloadUrl = await lagoService.downloadInvoice(input.invoiceId)

      return {
        downloadUrl,
      }
    }),
}
