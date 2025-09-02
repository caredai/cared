'use client'

import assert from 'assert'
import type { Stripe } from 'stripe'
import { useState } from 'react'
import { format, formatDistance } from 'date-fns'
import { Decimal } from 'decimal.js'
import { CoinsIcon, CreditCardIcon, HistoryIcon, RepeatIcon } from 'lucide-react'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cared/ui/components/tabs'

import type { ColumnDef } from '@tanstack/react-table'
import { SectionTitle } from '@/components/section'
import { useCredits, useListCreditsOrders, useListCreditsSubscriptions } from '@/hooks/use-credits'
import { RechargeDialog } from './recharge-dialog'
import { PaymentMethods } from './payment-methods'

// Types for table data
interface OrderTableData {
  id: string
  kind: string
  status: OrderStatus
  credits: number
  paymentMethod: string
  orderKind: string
  updatedAt: Date
  object: Stripe.Checkout.Session | Stripe.Invoice
}

interface SubscriptionTableData {
  id: string
  status: Stripe.Subscription.Status
  createdAt: Date
  object: Stripe.Subscription
}

export function Credits() {
  const { credits } = useCredits()
  const { creditsOrdersPages } = useListCreditsOrders()
  const { creditsSubscriptions } = useListCreditsSubscriptions()

  const _autoRechargeAmount = credits.metadata.autoRechargeAmount
  const _autoRechargeThreshold = credits.metadata.autoRechargeThreshold

  const [isRechargeDialogOpen, setIsRechargeDialogOpen] = useState(false)

  // Transform orders data for table
  const ordersData: OrderTableData[] = creditsOrdersPages
    ? creditsOrdersPages
        .flatMap((page) => page.orders)
        .map((order) => {
          let credits = 0
          let paymentMethod = ''
          let orderKind = ''
          switch (order.kind) {
            case 'stripe-payment':
              {
                assert(isCheckoutSession(order.object))
                const session = order.object
                credits = !isNaN(Number(session.metadata?.credits))
                  ? Number(session.metadata?.credits)
                  : 0
                paymentMethod = 'Fiat'
                orderKind = 'Onetime top-up'
              }
              break
            case 'stripe-subscription':
              {
                assert(isCheckoutSession(order.object))
                paymentMethod = 'Fiat'
                orderKind = 'Subscription'
              }
              break
            case 'stripe-invoice':
              {
                assert(!isCheckoutSession(order.object))
                const invoice = order.object
                credits = !isNaN(Number(invoice.metadata?.credits))
                  ? Number(invoice.metadata?.credits)
                  : 0
                paymentMethod = 'Fiat'
                orderKind = 'Auto top-up'
              }
              break
          }

          return {
            id: order.id,
            kind: order.kind,
            status: order.status,
            credits,
            paymentMethod,
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
          <CardTitle className="flex items-center gap-2">
            <CoinsIcon className="h-5 w-5" />
            Current Balance
          </CardTitle>
          <CardDescription>Your available credits for using Cared services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">$ {new Decimal(credits.credits).toFixed(2)}</p>
            </div>
            <Button onClick={() => setIsRechargeDialogOpen(true)}>
              <CreditCardIcon className="h-4 w-4 mr-2" />
              Recharge Credits
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" />
            Order History
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <RepeatIcon className="h-4 w-4" />
            Subscriptions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <OrdersTable data={ordersData} />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionsTable data={subscriptionsData} />
        </TabsContent>
      </Tabs>

      <PaymentMethods />

      <RechargeDialog open={isRechargeDialogOpen} onOpenChange={setIsRechargeDialogOpen} />
    </>
  )
}

// Orders Table Component
function OrdersTable({ data }: { data: OrderTableData[] }) {
  const columns: ColumnDef<OrderTableData>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      enableSorting: true,
      cell: ({ row }) => {
        const id = row.getValue<string>('id')
        return (
          <span className="font-mono text-xs" title={id}>
            {id.slice(0, 8)}...
          </span>
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Date',
      enableSorting: true,
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
      enableSorting: true,
      cell: ({ row }) => row.getValue<string>('orderKind'),
    },
    {
      accessorKey: 'credits',
      header: 'Amount',
      enableSorting: true,
      cell: ({ row }) => {
        const credits = row.getValue<number>('credits')
        const kind = row.original.kind
        return kind !== 'stripe-subscription' ? `$${credits}` : '-'
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
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
      accessorKey: 'paymentMethod',
      header: 'Payment Method',
      enableSorting: true,
      cell: ({ row }) => row.getValue<string>('paymentMethod'),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>Your recent credit purchase orders</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          searchKey="orderKind"
          searchPlaceholder="Search orders..."
          defaultPageSize={10}
          defaultSorting={[{ id: 'updatedAt', desc: true }]}
        />
      </CardContent>
    </Card>
  )
}

// Subscriptions Table Component
function SubscriptionsTable({ data }: { data: SubscriptionTableData[] }) {
  const columns: ColumnDef<SubscriptionTableData>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      enableSorting: true,
      cell: ({ row }) => {
        const id = row.getValue<string>('id')
        return (
          <span className="font-mono text-xs" title={id}>
            {id.slice(0, 8)}...
          </span>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      enableSorting: true,
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
      enableSorting: true,
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
    <Card>
      <CardHeader>
        <CardTitle>Auto Top-up Subscriptions</CardTitle>
        <CardDescription>Your recent credit auto top-up subscriptions</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          searchKey="status"
          searchPlaceholder="Search subscriptions..."
          defaultPageSize={10}
          defaultSorting={[{ id: 'createdAt', desc: true }]}
        />
      </CardContent>
    </Card>
  )
}

function isCheckoutSession(
  object: Stripe.Checkout.Session | Stripe.Invoice,
): object is Stripe.Checkout.Session {
  return object.object === 'checkout.session'
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
      return 'pending'
    case 'complete':
    case 'paid':
      return 'paid'
    case 'expired':
    case 'void':
    case 'deleted':
      return 'canceled'
    default:
      return 'failed'
  }
}
