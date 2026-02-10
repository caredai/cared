import type {
  ApiErrorUnprocessableEntity,
  ChargeFilterObject,
  ChargeObject,
  ChargeProperties as ChargePropertiesObject,
  CustomerChargeUsageObject,
  CustomerObjectExtended,
  CustomerProjectedUsageObject,
  CustomerUsageObject,
  EventObject,
  InvoiceObject,
  PaginationMeta,
  PlanObject,
  SubscriptionObject,
  WalletObject,
  WalletTransactionObject,
} from 'lago-javascript-client'
import { ORPCError } from '@orpc/server'
import { Decimal } from 'decimal.js'
import { getLagoError } from 'lago-javascript-client'

import { and, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Account, Member, User } from '@cared/db/schema'
import { generateId } from '@cared/shared'

import { getLago } from '../../client/lago'
import { env } from '../../env'

export class LagoService {
  get client() {
    return getLago()
  }

  async ensureCustomer(accountId: string) {
    try {
      const customer = (await this.client.customers.findCustomer(accountId)).data.customer
      return formatCustomer(customer)
    } catch (error) {
      const lagoError = await getLagoError<typeof this.client.customers.findCustomer>(error)
      if (lagoError.status !== 404) {
        throw error
      }
    }

    // Get account and owner information
    const { account, owner } =
      (
        await db
          .select({
            account: Account,
            owner: User,
          })
          .from(Account)
          .innerJoin(Member, and(eq(Member.accountId, Account.id), eq(Member.role, 'owner')))
          .innerJoin(User, eq(User.id, Member.userId))
          .where(eq(Account.id, accountId))
          .for('update')
      ).at(0) ?? {}

    if (!account || !owner) {
      throw new ORPCError('NOT_FOUND', {
        message: `Account with id ${accountId} not found`,
      })
    }

    const customer = (
      await this.client.customers.createCustomer({
        customer: {
          external_id: accountId,
          billing_entity_code: env.LAGO_BILLING_ENTITY_CODE,
          name: owner.name,
          email: owner.email,
          account_type: 'customer',
          customer_type: 'individual',
          billing_configuration: {
            payment_provider: 'stripe',
            payment_provider_code: env.LAGO_STRIPE_CONNECTION_CODE,
            sync: true,
            sync_with_provider: true,
            provider_payment_methods: [
              'card',
              'link',
              'us_bank_account',
              'crypto',
            ],
          },
        },
      })
    ).data.customer
    return formatCustomer(customer)
  }

  async generateCustomerCheckoutUrl(accountId: string) {
    const checkoutUrl = (await this.client.customers.generateCustomerCheckoutUrl(accountId)).data
      .customer?.checkout_url
    if (!checkoutUrl) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: `Generate custom checkout url failed`,
      })
    }
    return checkoutUrl
  }

  async getCustomerPortalUrl(accountId: string) {
    return (await this.client.customers.getCustomerPortalUrl(accountId)).data.customer.portal_url
  }

  private async findCredits(accountId: string) {
    const credits = (
      await this.client.wallets.findAllWallets({
        external_customer_id: accountId,
      })
    ).data.wallets.find((w) => w.name === 'Credits' && w.status === 'active')
    if (credits) {
      return formatCredits(credits)
    }
  }

  // TODO: distributed lock
  async ensureCredits(accountId: string) {
    await this.ensureCustomer(accountId)

    const credits = await this.findCredits(accountId)
    if (credits) {
      return credits
    }

    return formatCredits(
      (
        await this.client.wallets.createWallet({
          wallet: {
            name: 'Credits',
            rate_amount: '1',
            currency: 'USD',
            paid_credits: '0',
            granted_credits: '0',
            external_customer_id: accountId,
            paid_top_up_min_amount_cents: 1500, // $15
            paid_top_up_max_amount_cents: 250000, // $2500
          },
        })
      ).data.wallet,
    )
  }

  async updateCredits(
    accountId: string,
    updates: {
      autoTopUp: Omit<NonNullable<Credits['autoTopUp']>, 'id'> | null
    },
  ) {
    const credits = await this.ensureCredits(accountId)
    try {
      const updatedWallet = (
        await this.client.wallets.updateWallet(credits.id, {
          wallet: {
            recurring_transaction_rules: updates.autoTopUp
              ? [
                  {
                    lago_id: credits.autoTopUp?.id,
                    trigger: updates.autoTopUp.trigger,
                    method: updates.autoTopUp.method,
                    threshold_credits: updates.autoTopUp.thresholdCredits,
                    interval: updates.autoTopUp.interval,
                    started_at: updates.autoTopUp.startedAt?.toISOString(),
                    paid_credits: updates.autoTopUp.topUpCredits,
                    target_ongoing_balance: updates.autoTopUp.targetOngoingBalance,
                    transaction_name: 'Auto Top-Up Credits',
                  },
                ]
              : [],
          },
        })
      ).data.wallet
      return formatCredits(updatedWallet)
    } catch (error) {
      const lagoError = await getLagoError<typeof this.client.wallets.updateWallet>(error)
      if (lagoError.status === 422) {
        console.error(lagoError, updates.autoTopUp)
      }
      throw error
    }
  }

  async topUpCredits(accountId: string, credits: number) {
    const c = await this.ensureCredits(accountId)
    const tx = (
      await this.client.walletTransactions.createWalletTransaction({
        wallet_transaction: {
          wallet_id: c.id,
          name: 'Top-Up Credits',
          paid_credits: credits.toString(),
          ignore_paid_top_up_limits: true,
        },
      })
    ).data.wallet_transactions.at(0)
    if (!tx) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: `Top-Up credits failed`,
      })
    }
    return formatCreditsTransaction(tx)
  }

  async generateTopUpPaymentUrl(txId: string) {
    try {
      return (await this.client.walletTransactions.walletTransactionPaymentUrl(txId)).data
        .wallet_transaction_payment_details?.payment_url
    } catch (error) {
      const lagoError =
        await getLagoError<typeof this.client.walletTransactions.walletTransactionPaymentUrl>(error)
      if (
        lagoError.status === 422 &&
        (
          (lagoError as ApiErrorUnprocessableEntity).error_details as {
            base: string[]
          }
        ).base.at(0) === 'wallet_transaction_already_settled'
      ) {
        return undefined
      }
      throw error
    }
  }

  async getCreditsTransactions(
    accountId: string,
    args: {
      limit?: number
      cursor?: number
    },
  ): Promise<{
    transactions: CreditsTransaction[]
    hasMore: boolean
    cursor?: number
  }> {
    const credits = await this.ensureCredits(accountId)
    const { wallet_transactions, meta } = (
      await this.client.wallets.findAllWalletTransactions(credits.id, {
        page: args.cursor,
        per_page: args.limit,
      })
    ).data
    return {
      transactions: wallet_transactions.map(formatCreditsTransaction),
      hasMore: meta.total_pages > meta.current_page,
      cursor: meta.next_page ?? undefined,
    }
  }

  async getCreditsTransaction(
    accountId: string,
    transactionId: string,
  ): Promise<CreditsTransaction> {
    const credits = await this.ensureCredits(accountId)

    let transaction: WalletTransactionObject
    try {
      transaction = // TODO: lago findWalletTransaction return value bug
        (
          (await this.client.walletTransactions.findWalletTransaction(transactionId))
            .data as unknown as {
            wallet_transaction: WalletTransactionObject
          }
        ).wallet_transaction
    } catch (error) {
      const lagoError =
        await getLagoError<typeof this.client.walletTransactions.findWalletTransaction>(error)
      if (lagoError.status === 404) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Transaction not found',
        })
      } else {
        console.error(error)
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Get transaction failed',
        })
      }
    }

    if (transaction.lago_wallet_id !== credits.id) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Transaction not found',
      })
    }

    return formatCreditsTransaction(transaction)
  }

  async getPlans() {
    return (await this.client.plans.findAllPlans()).data.plans.map(formatPlan)
  }

  async createSubscription(accountId: string, planCode: string) {
    const subscription = (
      await this.client.subscriptions.createSubscription({
        subscription: {
          plan_code: planCode,
          external_customer_id: accountId,
          external_id: formatSubscriptionExternalId(accountId, planCode), // serves as an idempotency key
          billing_entity_code: env.LAGO_BILLING_ENTITY_CODE,
          billing_time: 'anniversary',
        },
      })
    ).data.subscription
    return formatSubscription(subscription)
  }

  async cancelSubscription(accountId: string, planCode: string) {
    const subscription = (
      await this.client.subscriptions.destroySubscription(
        formatSubscriptionExternalId(accountId, planCode),
      )
    ).data.subscription
    return formatSubscription(subscription)
  }

  async getSubscriptions(accountId: string) {
    const result: SubscriptionObject[] = []
    let page: number | undefined = 1
    while (true) {
      const { subscriptions, meta } = (
        await this.client.subscriptions.findAllSubscriptions({
          external_customer_id: accountId,
          'status[]': ['active', 'pending'],
          page,
        })
      ).data as {
        subscriptions: SubscriptionObject[]
        meta: PaginationMeta
      }
      result.push(...subscriptions)
      page = meta.next_page ?? undefined
      if (!page) {
        break
      }
    }
    return result.map(formatSubscription)
  }

  async getSubscriptionLifetimeUsage(accountId: string, planCode: string) {
    const { lifetime_usage } = (
      await this.client.subscriptions.getSubscriptionLifetimeUsage(
        formatSubscriptionExternalId(accountId, planCode),
      )
    ).data
    return {
      invoicedUsageAmount: new Decimal(lifetime_usage.invoiced_usage_amount_cents).div(100),
      currentUsageAmount: new Decimal(lifetime_usage.current_usage_amount_cents).div(100),
      from: lifetime_usage.from_datetime ? new Date(lifetime_usage.from_datetime) : undefined,
      to: lifetime_usage.to_datetime ? new Date(lifetime_usage.to_datetime) : undefined,
    }
  }

  async getSubscriptionCurrentUsage(accountId: string, planCode: string) {
    const { customer_usage } = (
      await this.client.customers.findCustomerCurrentUsage(accountId, {
        external_subscription_id: formatSubscriptionExternalId(accountId, planCode),
      })
    ).data
    return formatSubscriptionUsage(customer_usage)
  }

  async getSubscriptionProjectedUsage(accountId: string, planCode: string) {
    const { customer_projected_usage } = (
      await this.client.customers.findCustomerProjectedUsage(accountId, {
        external_subscription_id: formatSubscriptionExternalId(accountId, planCode),
      })
    ).data
    return formatSubscriptionProjectedUsage(customer_projected_usage)
  }

  async getSubscriptionPastUsage(
    accountId: string,
    planCode: string,
    args: {
      limit?: number
      cursor?: number
      billableMetricCode?: string
      periodsCount?: number
    },
  ) {
    const { usage_periods, meta } = (
      await this.client.customers.findAllCustomerPastUsage(accountId, {
        external_subscription_id: formatSubscriptionExternalId(accountId, planCode),
        page: args.cursor,
        per_page: args.limit,
        billable_metric_code: args.billableMetricCode,
        periods_count: args.periodsCount,
      })
    ).data
    return {
      usagePeriods: usage_periods.map((period) => formatSubscriptionUsage(period.customer_usage)),
      hasMore: meta.total_pages > meta.current_page,
      cursor: meta.next_page ?? undefined,
    }
  }

  async sendUsageEvent(
    accountId: string,
    planCode: string,
    args: {
      billableMetricCode: string
      properties: Record<string, unknown>
      id?: string
      timestamp?: Date
    },
  ) {
    const event = (
      await this.client.events.createEvent({
        event: {
          transaction_id: args.id ?? generateId('evt'),
          timestamp: args.timestamp ? Math.floor(Number(args.timestamp) / 1000) : undefined,
          external_subscription_id: formatSubscriptionExternalId(accountId, planCode),
          code: args.billableMetricCode,
          properties: args.properties,
        },
      })
    ).data.event
    return formatUsageEvent(event)
  }

  async getUsageEvents(
    accountId: string,
    planCode: string,
    args: {
      limit?: number
      cursor?: number
      billableMetricCode?: string
      from?: Date
      to?: Date
    },
  ) {
    const { events, meta } = (
      await this.client.events.findAllEvents({
        page: args.cursor,
        per_page: args.limit,
        external_subscription_id: formatSubscriptionExternalId(accountId, planCode),
        code: args.billableMetricCode,
        timestamp_from: args.from instanceof Date ? args.from.toISOString() : undefined,
        timestamp_to: args.to instanceof Date ? args.to.toISOString() : undefined,
      })
    ).data
    return {
      events: events.map(formatUsageEvent),
      hasMore: meta.total_pages > meta.current_page,
      cursor: meta.next_page ?? undefined,
    }
  }

  async getInvoices(
    accountId: string,
    args: {
      limit?: number
      cursor?: number
    },
  ): Promise<{
    invoices: Invoice[]
    hasMore: boolean
    cursor?: number
  }> {
    const { invoices, meta } = (
      await this.client.invoices.findAllInvoices({
        external_customer_id: accountId,
        page: args.cursor,
        per_page: args.limit,
      })
    ).data
    return {
      invoices: invoices.map(formatInvoice),
      hasMore: meta.total_pages > meta.current_page,
      cursor: meta.next_page ?? undefined,
    }
  }

  async generateInvoicePaymentUrl(invoiceId: string): Promise<string> {
    const { invoice_payment_details } = (await this.client.invoices.invoicePaymentUrl(invoiceId))
      .data
    if (!invoice_payment_details?.payment_url) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to generate invoice payment URL',
      })
    }
    return invoice_payment_details.payment_url
  }

  async downloadInvoice(invoiceId: string): Promise<string> {
    const invoice = (await this.client.invoices.downloadInvoice(invoiceId)).data.invoice
    if (!invoice.file_url) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Invoice URL not available',
      })
    }
    return invoice.file_url
  }
}

export const lagoService = new LagoService()

function formatSubscriptionExternalId(accountId: string, planCode: string) {
  return `${accountId}-${planCode}`
}

export interface Customer {
  id: string
  email?: string
  name?: string

  phone?: string
  timezone?: string
  billingAddress?: Address
  shippingAddress?: Address
  paymentProvider: {
    provider?: string
    code?: string
    customerId?: string
    paymentMethods?: string[]
    paymentMethodId?: string
  }

  createdAt?: Date
  updatedAt?: Date
}

export interface Address {
  country?: string // country code
  state?: string
  city?: string
  zipcode?: string
  addressLine1?: string
  addressLine2?: string
}

function formatCustomer(c: CustomerObjectExtended): Customer {
  const shipping = c.shipping_address
  const billing = c.billing_configuration
  return {
    id: c.external_id,
    email: c.email ?? undefined,
    name: c.name ?? undefined,
    phone: c.phone ?? undefined,
    timezone: c.timezone ?? undefined,
    billingAddress: {
      country: c.country,
      state: c.state ?? undefined,
      city: c.city ?? undefined,
      zipcode: c.zipcode ?? undefined,
      addressLine1: c.address_line1 ?? undefined,
      addressLine2: c.address_line2 ?? undefined,
    },
    shippingAddress: {
      country: shipping?.country,
      state: shipping?.state ?? undefined,
      city: shipping?.city ?? undefined,
      zipcode: shipping?.zipcode ?? undefined,
      addressLine1: shipping?.address_line1 ?? undefined,
      addressLine2: shipping?.address_line2 ?? undefined,
    },
    paymentProvider: {
      provider: billing?.payment_provider,
      code: billing?.payment_provider_code,
      customerId: billing?.provider_customer_id,
      paymentMethods: billing?.provider_payment_methods?.filter((m) => typeof m === 'string'),
      paymentMethodId:
        (
          billing as
            | {
                payment_method_id?: string | null
              }
            | undefined
        )?.payment_method_id ?? undefined,
    },
    createdAt: new Date(c.created_at),
    updatedAt: c.updated_at ? new Date(c.updated_at) : undefined,
  }
}

export interface Credits {
  id: string // account id
  status: string
  balance: string
  ongoingBalance: string // effective credits balance which equals to `balance` - `ongoingUsage`
  ongoingUsage: string // total ongoing usage credits which have not been invoiced yet
  lastSyncAt?: Date
  consumed: string // historical total consumed credits
  lastConsumedAt?: Date
  autoTopUp?: {
    id: string
    trigger: 'interval' | 'threshold'
    method: 'fixed' | 'target'
    thresholdCredits?: string // for 'threshold' trigger
    interval?: 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly' // for 'interval' trigger
    startedAt?: Date // for 'interval' trigger
    topUpCredits?: string // for 'fixed' method
    targetOngoingBalance?: string // for 'target' method
  }
}

function formatCredits(w: WalletObject): Credits {
  const r = w.recurring_transaction_rules?.at(0)
  return {
    id: w.lago_id,
    status: w.status,
    balance: w.credits_balance,
    ongoingBalance: w.credits_ongoing_balance,
    ongoingUsage: w.credits_ongoing_usage_balance,
    lastSyncAt: w.last_balance_sync_at ? new Date(w.last_balance_sync_at) : undefined,
    consumed: w.consumed_credits,
    lastConsumedAt: w.last_consumed_credit_at ? new Date(w.last_consumed_credit_at) : undefined,
    ...(r && {
      autoTopUp: {
        id: r.lago_id,
        trigger: r.trigger,
        method: r.method,
        thresholdCredits: r.threshold_credits,
        interval: r.interval,
        startedAt: r.started_at ? new Date(r.started_at) : undefined,
        topUpCredits: r.paid_credits,
        targetOngoingBalance: r.target_ongoing_balance ?? undefined,
      },
    }),
  }
}

export interface CreditsTransaction {
  id: string
  status: 'pending' | 'settled' | 'failed'
  source: 'manual' | 'interval' | 'threshold'
  transactionStatus: 'purchased' | 'granted' | 'voided' | 'invoiced'
  transactionType: 'inbound' | 'outbound'
  credits: string
  settledAt?: Date
  failedAt?: Date
  createdAt?: Date
}

function formatCreditsTransaction(tx: WalletTransactionObject): CreditsTransaction {
  return {
    id: tx.lago_id,
    status: tx.status,
    source: tx.source,
    transactionStatus: tx.transaction_status,
    transactionType: tx.transaction_type,
    credits: tx.credit_amount,
    settledAt: tx.settled_at ? new Date(tx.settled_at) : undefined,
    failedAt: tx.failed_at ? new Date(tx.failed_at) : undefined,
    createdAt: tx.created_at ? new Date(tx.created_at) : undefined,
  }
}

export interface Plan {
  code: string
  name: string
  description?: string
  createdAt: Date

  interval: 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly'
  amount: string // amount in USD
  payInAdvance?: boolean
  usageChargesMonthly?: boolean

  charges?: Charge[]
}

export type ChargeModelEnum =
  | 'dynamic'
  | 'graduated'
  | 'graduated_percentage'
  | 'package'
  | 'percentage'
  | 'standard'
  | 'volume'

export interface Charge {
  billableMetricCode: string
  chargeModel: ChargeModelEnum
  payInAdvance: boolean
  invoiceable: boolean
  invoiceAtPeriodEnd: boolean
  prorated: boolean
  minAmount: string
  properties: ChargeProperties // default properties
  filters: ChargeFilter[] // properties filters
}

export interface ChargeProperties {
  groupKeys?: string[]
  // `graduated`
  graduatedRanges?: {
    from: number
    to?: number
    perUnitAmount: string
    flatAmount: string
  }[]
  // `graduated_percentage`
  graduatedPercentageRanges?: {
    from: number
    to?: number
    rate: string // e.g., 0.05, 1.02
    flatAmount: string
  }[]
  // `standard`, `package`
  amount?: string
  // `package`
  packageSize?: number
  freeUnits?: number
  // `percentage`
  rate?: string
  fixedAmountPerEvent?: string
  freeEvents?: number
  freeAmount?: string // the total free amount
  minAmountPerEvent?: string
  maxAmountPerEvent?: string
  // `volume`
  volumeRanges?: {
    from: number
    to?: number
    perUnitAmount: string
    flatAmount: string
  }[]
}

export interface ChargeFilter {
  displayName?: string
  properties: ChargeProperties // properties
  filters: Record<string, string[]>
}

function formatPlan(p: PlanObject): Plan {
  return {
    code: p.code,
    name: p.name,
    description: p.description,
    createdAt: new Date(p.created_at),
    interval: p.interval,
    amount: new Decimal(p.amount_cents).div(100).toString(),
    payInAdvance: p.pay_in_advance,
    usageChargesMonthly: p.bill_charges_monthly ?? undefined,
    charges: p.charges?.map(formatCharge),
  }
}

function formatCharge(c: ChargeObject): Charge {
  return {
    billableMetricCode: c.billable_metric_code,
    chargeModel: c.charge_model,
    payInAdvance: c.pay_in_advance,
    invoiceable: c.invoiceable,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    invoiceAtPeriodEnd: c.regroup_paid_fees === 'invoice',
    prorated: c.prorated,
    minAmount: new Decimal(c.min_amount_cents).div(100).toString(),
    properties: formatChargeProperties(c.properties),
    filters: c.filters.map(formatChargeFilter),
  }
}

function formatChargeProperties(props: ChargePropertiesObject): ChargeProperties {
  return {
    groupKeys: props.pricing_group_keys ?? props.grouped_by,
    graduatedRanges: props.graduated_ranges?.map((r) => ({
      from: r.from_value,
      to: r.to_value ?? undefined,
      perUnitAmount: r.per_unit_amount,
      flatAmount: r.flat_amount,
    })),
    graduatedPercentageRanges: props.graduated_percentage_ranges?.map((r) => ({
      from: r.from_value,
      to: r.to_value ?? undefined,
      rate: new Decimal(r.rate).div(100).toString(),
      flatAmount: r.flat_amount,
    })),
    amount: props.amount,
    packageSize: props.package_size,
    freeUnits: props.free_units,
    rate: props.rate ? new Decimal(props.rate).div(100).toString() : undefined,
    fixedAmountPerEvent: props.fixed_amount,
    freeEvents: props.free_units_per_events ?? undefined,
    freeAmount: props.free_units_per_total_aggregation ?? undefined,
    minAmountPerEvent: props.per_transaction_min_amount ?? undefined,
    maxAmountPerEvent: props.per_transaction_max_amount ?? undefined,
    volumeRanges: props.volume_ranges?.map((r) => ({
      from: r.from_value,
      to: r.to_value ?? undefined,
      perUnitAmount: r.per_unit_amount,
      flatAmount: r.flat_amount,
    })),
  }
}

function formatChargeFilter(f: ChargeFilterObject): ChargeFilter {
  return {
    displayName: f.invoice_display_name ?? undefined,
    properties: formatChargeProperties(f.properties),
    filters: f.values,
  }
}

export interface Subscription {
  id: string
  planCode: string
  status: 'active' | 'canceled' | 'pending' | 'terminated'
  billingTime: 'calendar' | 'anniversary'
  name?: string
  createdAt: Date
  canceledAt?: Date
  startedAt?: Date
  endingAt?: Date
  subscriptionAt: Date
  terminatedAt?: Date
  currentPeriodStartedAt?: Date
  currentPeriodEndingAt?: Date
  previousPlanCode?: string
  nextPlanDate?: string
  downgradePlanDate?: string
}

function formatSubscription(subscription: SubscriptionObject): Subscription {
  return {
    id: subscription.external_id,
    planCode: subscription.plan_code,
    status: subscription.status,
    billingTime: subscription.billing_time,
    name: subscription.name ?? undefined,
    createdAt: new Date(subscription.created_at),
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at) : undefined,
    startedAt: subscription.started_at ? new Date(subscription.started_at) : undefined,
    endingAt: subscription.ending_at ? new Date(subscription.ending_at) : undefined,
    subscriptionAt: new Date(subscription.subscription_at),
    terminatedAt: subscription.terminated_at ? new Date(subscription.terminated_at) : undefined,
    currentPeriodStartedAt: subscription.current_billing_period_started_at
      ? new Date(subscription.current_billing_period_started_at)
      : undefined,
    currentPeriodEndingAt: subscription.current_billing_period_ending_at
      ? new Date(subscription.current_billing_period_ending_at)
      : undefined,
    previousPlanCode: subscription.previous_plan_code ?? undefined,
    nextPlanDate: subscription.next_plan_code ?? undefined,
    downgradePlanDate: subscription.downgrade_plan_date ?? undefined,
  }
}

export interface UsageEvent {
  id: string
  code: string // billableMetricCode
  timestamp?: Date
  properties?: Record<string, unknown>
}

function formatUsageEvent(e: EventObject): UsageEvent {
  return {
    id: e.transaction_id,
    code: e.code,
    timestamp: e.timestamp ? new Date(e.timestamp) : undefined,
    properties: e.properties,
  }
}

export interface ChargeUsage {
  units: string
  totalUnits: string
  events: number
  amount: string // amount in USD
  charge: {
    chargeModel: string
    displayName?: string
  }
  billableMetric: {
    name: string
    code: string
    aggregationType: string
  }
}

function formatChargeUsage(chargeUsage: CustomerChargeUsageObject): ChargeUsage {
  return {
    units: chargeUsage.units,
    totalUnits: chargeUsage.total_aggregated_units,
    events: chargeUsage.events_count,
    amount: new Decimal(chargeUsage.amount_cents).div(100).toString(),
    charge: {
      chargeModel: chargeUsage.charge.charge_model,
      displayName: chargeUsage.charge.invoice_display_name ?? undefined,
    },
    billableMetric: {
      name: chargeUsage.billable_metric.name,
      code: chargeUsage.billable_metric.code,
      aggregationType: chargeUsage.billable_metric.aggregation_type,
    },
  }
}

export interface SubscriptionUsage {
  totalAmount: Decimal
  amount: Decimal
  taxAmount: Decimal
  from: Date
  to: Date
  chargesUsage: ChargeUsage[]
}

function formatSubscriptionUsage(usage: CustomerUsageObject): SubscriptionUsage {
  return {
    totalAmount: new Decimal(usage.total_amount_cents).div(100),
    amount: new Decimal(usage.amount_cents).div(100),
    taxAmount: new Decimal(usage.taxes_amount_cents).div(100),
    from: new Date(usage.from_datetime),
    to: new Date(usage.to_datetime),
    chargesUsage: usage.charges_usage.map(formatChargeUsage),
  }
}

export interface SubscriptionProjectedUsage {
  totalAmount: Decimal
  amount: Decimal
  projectedAmount: Decimal
  taxAmount: Decimal
  from: Date
  to: Date
  chargesUsage: ChargeUsage[]
}

function formatSubscriptionProjectedUsage(
  usage: CustomerProjectedUsageObject,
): SubscriptionProjectedUsage {
  return {
    ...formatSubscriptionUsage(usage),
    projectedAmount: new Decimal(usage.projected_amount_cents).div(100),
  }
}

export interface Invoice {
  id: string
  number: string
  issuingDate: Date
  paymentDueDate?: Date
  paymentOverdue?: boolean
  invoiceType: 'subscription' | 'add_on' | 'credit' | 'one_off' | 'progressive_billing'
  status: 'draft' | 'finalized' | 'voided' | 'failed' | 'pending'
  paymentStatus: 'pending' | 'succeeded' | 'failed'
  feesAmount: string
  couponsAmount: string
  creditNotesAmount: string
  subTotalExcludingTaxes: string
  taxesAmount: string
  subTotalIncludingTaxes: string
  prepaidCreditAmount: string
  progressiveBillingAmount: string
  totalAmount: string
  fileUrl?: string
  createdAt: Date
  updatedAt: Date
}

function formatInvoice(invoice: InvoiceObject): Invoice {
  return {
    id: invoice.lago_id,
    number: invoice.number,
    issuingDate: new Date(invoice.issuing_date),
    paymentDueDate: invoice.payment_due_date ? new Date(invoice.payment_due_date) : undefined,
    paymentOverdue: invoice.payment_overdue ?? undefined,
    invoiceType: invoice.invoice_type,
    status: invoice.status,
    paymentStatus: invoice.payment_status,
    feesAmount: new Decimal(invoice.fees_amount_cents).div(100).toString(),
    couponsAmount: new Decimal(invoice.coupons_amount_cents).div(100).toString(),
    creditNotesAmount: new Decimal(invoice.credit_notes_amount_cents).div(100).toString(),
    subTotalExcludingTaxes: new Decimal(invoice.sub_total_excluding_taxes_amount_cents)
      .div(100)
      .toString(),
    taxesAmount: new Decimal(invoice.taxes_amount_cents).div(100).toString(),
    subTotalIncludingTaxes: new Decimal(invoice.sub_total_including_taxes_amount_cents)
      .div(100)
      .toString(),
    prepaidCreditAmount: new Decimal(invoice.prepaid_credit_amount_cents).div(100).toString(),
    progressiveBillingAmount: new Decimal(invoice.progressive_billing_credit_amount_cents)
      .div(100)
      .toString(),
    totalAmount: new Decimal(invoice.total_amount_cents).div(100).toString(),
    fileUrl: invoice.file_url ?? undefined,
    createdAt: new Date(invoice.created_at),
    updatedAt: new Date(invoice.updated_at),
  }
}
