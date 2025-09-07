'use client'

import assert from 'assert'
import type { Stripe } from 'stripe'
import { useState } from 'react'
import { format, formatDistance } from 'date-fns'
import { Decimal } from 'decimal.js'
import {
  AlarmClockIcon,
  HandCoinsIcon,
  HistoryIcon,
  MoreHorizontal,
  RepeatIcon,
  Trash2Icon,
} from 'lucide-react'

import type { OrderStatus } from '@cared/db/schema'
import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
import { DataTable } from '@cared/ui/components/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'

import type { ColumnDef } from '@tanstack/react-table'
import { SectionTitle } from '@/components/section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import {
  useCancelCreditsOrder,
  useCredits,
  useListCreditsOrders,
  useListCreditsSubscriptions,
} from '@/hooks/use-credits'
import { AutoTopupDialog } from './auto-topup-dialog'
import { useCheckPaymentMethodSetupReturnUrl } from './payment-method-dialog'
import { PaymentMethods } from './payment-methods'
import { RechargeDialog } from './recharge-dialog'
import { useCheckStripeCheckoutSessionReturnUrl } from './stripe-checkout-form'

// Types for table data
interface OrderTableData {
  id: string
  kind: string
  status: OrderStatus
  credits: number
  gateway: string
  orderKind: string
  updatedAt: Date
  object: Stripe.Checkout.Session | Stripe.PaymentIntent | Stripe.Invoice
}

interface SubscriptionTableData {
  id: string
  status: Stripe.Subscription.Status
  createdAt: Date
  object: Stripe.Subscription
}

export function Credits({ organizationId }: { organizationId?: string }) {
  useCheckStripeCheckoutSessionReturnUrl(organizationId)
  useCheckPaymentMethodSetupReturnUrl()

  const { credits } = useCredits(organizationId)
  const { creditsOrdersPages } = useListCreditsOrders(organizationId)
  const { creditsSubscriptions } = useListCreditsSubscriptions(organizationId)

  const [isRechargeDialogOpen, setIsRechargeDialogOpen] = useState(false)
  const [isAutoTopupDialogOpen, setIsAutoTopupDialogOpen] = useState(false)

  // Transform orders data for table
  const ordersData: OrderTableData[] = creditsOrdersPages
    ? creditsOrdersPages
        .flatMap((page) => page.orders)
        .map((order) => {
          let credits = 0
          let gateway = ''
          let orderKind = ''
          switch (order.kind) {
            case 'stripe-payment':
              {
                assert(isCheckoutSession(order.object))
                const session = order.object
                credits = !isNaN(Number(session.metadata?.credits))
                  ? Number(session.metadata?.credits)
                  : 0
                gateway = 'Stripe'
                orderKind = 'Onetime top-up'
              }
              break
            case 'stripe-payment-intent':
              {
                assert(isPaymentIntent(order.object))
                const paymentIntent = order.object
                credits = !isNaN(Number(paymentIntent.metadata.credits))
                  ? Number(paymentIntent.metadata.credits)
                  : 0
                gateway = 'Stripe'
                orderKind = 'Auto top-up'
              }
              break
            case 'stripe-subscription':
              {
                assert(isCheckoutSession(order.object))
                gateway = 'Stripe'
                orderKind = 'Subscription'
              }
              break
            case 'stripe-invoice':
              {
                assert(isInvoice(order.object))
                const invoice = order.object
                credits = !isNaN(Number(invoice.metadata?.credits))
                  ? Number(invoice.metadata?.credits)
                  : 0
                gateway = 'Stripe'
                orderKind = 'Auto top-up'
              }
              break
          }

          return {
            id: order.id,
            kind: order.kind,
            status: order.status,
            credits,
            gateway,
            orderKind,
            updatedAt: order.updatedAt,
            object: order.object,
          }
        })
    : []

  // Transform subscriptions data for table
  const subscriptionsData: SubscriptionTableData[] = creditsSubscriptions
    ? creditsSubscriptions.map((subscription) => ({
        id: subscription.id,
        status: subscription.status,
        createdAt: new Date(subscription.created),
        object: subscription,
      }))
    : []

  return (
    <>
      <SectionTitle title="Credits" description="Manage your credits and billing" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Balance</CardTitle>
          <CardDescription>Your available credits for using Cared services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold">$ {new Decimal(credits.credits).toFixed(2)}</p>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Button onClick={() => setIsRechargeDialogOpen(true)}>
                <HandCoinsIcon className="h-4 w-4" />
                Buy Credits
              </Button>
              <Button variant="outline" onClick={() => setIsAutoTopupDialogOpen(true)}>
                <AlarmClockIcon className="h-4 w-4" />
                Auto Top-Up
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <HistoryIcon className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <RepeatIcon className="h-4 w-4" />
                Subscriptions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <OrdersTable data={ordersData} organizationId={organizationId} />
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-4">
              <SubscriptionsTable data={subscriptionsData} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <PaymentMethods />

      <RechargeDialog
        organizationId={organizationId}
        open={isRechargeDialogOpen}
        onOpenChange={setIsRechargeDialogOpen}
      />

      <AutoTopupDialog
        organizationId={organizationId}
        open={isAutoTopupDialogOpen}
        onOpenChange={setIsAutoTopupDialogOpen}
      />
    </>
  )
}

// Orders Table Component
function OrdersTable({
  data,
  organizationId,
}: {
  data: OrderTableData[]
  organizationId?: string
}) {
  const cancelOrder = useCancelCreditsOrder(organizationId)

  const columns: ColumnDef<OrderTableData>[] = [
    {
      accessorKey: 'updatedAt',
      header: 'Date',
      cell: ({ row }) => {
        const updatedAt = row.getValue<Date>('updatedAt')
        return (
          <span title={format(updatedAt, 'MMM dd, yyyy hh:mm a')}>
            {formatDistance(updatedAt, new Date(), { addSuffix: true })}
          </span>
        )
      },
    },
    {
      accessorKey: 'orderKind',
      header: 'Type',
      cell: ({ row }) => row.getValue<string>('orderKind'),
    },
    {
      accessorKey: 'credits',
      header: 'Amount',
      cell: ({ row }) => {
        const credits = row.getValue<number>('credits')
        const kind = row.original.kind
        return kind !== 'stripe-subscription' ? `$${credits}` : '-'
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue<OrderStatus>('status')
        const statusType = getOrderStatus(status)

        switch (statusType) {
          case 'paid':
            return (
              <Badge variant="default" className="bg-green-500">
                Completed
              </Badge>
            )
          case 'pending':
            return <Badge variant="secondary">Pending</Badge>
          case 'canceled':
            return <Badge variant="destructive">Canceled</Badge>
          default:
            return <Badge variant="destructive">Failed</Badge>
        }
      },
    },
    {
      accessorKey: 'gateway',
      header: 'Gateway',
      cell: ({ row }) => row.getValue<string>('gateway'),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const order = row.original
        const statusType = getOrderStatus(order.status)
        const isPending = statusType === 'pending'

        if (!isPending) {
          return null
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={async () => {
                  await cancelOrder(order.id)
                }}
              >
                <Trash2Icon className="h-4 w-4" />
                Cancel Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Your recent orders</p>
      </div>
      <DataTable columns={columns} data={data} defaultPageSize={10} />
    </div>
  )
}

// Subscriptions Table Component
function SubscriptionsTable({ data }: { data: SubscriptionTableData[] }) {
  const columns: ColumnDef<SubscriptionTableData>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const createdAt = row.getValue<Date>('createdAt')
        return (
          <span title={format(createdAt, 'MMM dd, yyyy hh:mm a')}>
            {formatDistance(createdAt, new Date(), { addSuffix: true })}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue<Stripe.Subscription.Status>('status')

        switch (status) {
          case 'active':
            return (
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            )
          case 'canceled':
            return <Badge variant="destructive">Canceled</Badge>
          default:
            return <Badge variant="outline">{capitalizeString(status)}</Badge>
        }
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Your recent auto top-up subscriptions</p>
      </div>
      <DataTable columns={columns} data={data} defaultPageSize={10} />
    </div>
  )
}

function isCheckoutSession(
  object: Stripe.Checkout.Session | Stripe.PaymentIntent | Stripe.Invoice,
): object is Stripe.Checkout.Session {
  return object.object === 'checkout.session'
}

function isPaymentIntent(
  object: Stripe.Checkout.Session | Stripe.PaymentIntent | Stripe.Invoice,
): object is Stripe.PaymentIntent {
  return object.object === 'payment_intent'
}

function isInvoice(
  object: Stripe.Checkout.Session | Stripe.PaymentIntent | Stripe.Invoice,
): object is Stripe.Invoice {
  return object.object === 'invoice'
}

function capitalizeString(str: string) {
  if (str.length === 0) {
    return ''
  }
  str = str.replace('_', ' ')
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function getOrderStatus(status: OrderStatus) {
  switch (status) {
    case 'draft':
    case 'open':
    case 'processing':
    case 'requires_action':
    case 'requires_capture':
    case 'requires_confirmation':
    case 'requires_payment_method':
    case 'uncollectible':
      return 'pending'
    case 'complete':
    case 'paid':
    case 'succeeded':
      return 'paid'
    case 'expired':
    case 'canceled':
    case 'void':
    case 'deleted':
      return 'canceled'
    default:
      return 'failed'
  }
}
