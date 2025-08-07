'use client'

import assert from 'assert'
import type { Stripe } from 'stripe'
import { useState } from 'react'
import { format, formatDistance } from 'date-fns'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cared/ui/components/tabs'

import { useCredits, useListCreditsOrders, useListCreditsSubscriptions } from '@/hooks/use-credits'
import { RechargeDialog } from './recharge-dialog'

export default function Page() {
  const { credits } = useCredits()
  const { creditsOrdersPages } = useListCreditsOrders()
  const { creditsSubscriptions } = useListCreditsSubscriptions()

  const autoRechargeAmount = credits.metadata.autoRechargeAmount
  const autoRechargeThreshold = credits.metadata.autoRechargeThreshold

  const [isRechargeDialogOpen, setIsRechargeDialogOpen] = useState(false)

  const formatCredits = (amount: number) => {
    return amount.toFixed(2)
  }

  const getOrderStatus = (status: OrderStatus) => {
    switch (status) {
      case 'draft':
      case 'open':
        return 'pending'
      case 'complete':
      case 'paid':
        return 'paid'
      case 'expired':
        return 'expired'
      default:
        return 'failed'
    }
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Credits</h1>
        <p className="text-gray-600">Manage your credits and billing</p>
      </div>

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
              <p className="text-2xl font-bold">$ {formatCredits(credits.credits)}</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Your recent credit purchase orders</CardDescription>
            </CardHeader>
            <CardContent>
              {creditsOrdersPages && creditsOrdersPages.length > 0 ? (
                <div className="space-y-4">
                  {creditsOrdersPages
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

                      const status = getOrderStatus(order.status)
                      const updatedAt = order.updatedAt

                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between gap-2 p-2 border rounded-lg"
                        >
                          <span title={format(updatedAt, 'MMM dd, yyyy hh:mm a')}>
                            {formatDistance(updatedAt, new Date(), {
                              addSuffix: true,
                            })}
                          </span>
                          <span>{orderKind}</span>
                          <span>{order.kind !== 'stripe-subscription' ? `$${credits}` : ''}</span>
                          {status === 'paid' ? (
                            <Badge variant="default" className="bg-green-500">
                              Completed
                            </Badge>
                          ) : status === 'pending' ? (
                            <Badge variant="secondary">Pending</Badge>
                          ) : status === 'expired' ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                          <span>{paymentMethod}</span>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <HistoryIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <span>No orders found</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto Top-up Subscriptions</CardTitle>
              <CardDescription>Your recent credit auto top-up subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {creditsSubscriptions && creditsSubscriptions.length > 0 ? (
                <div className="space-y-4">
                  {creditsSubscriptions.map((subscription) => {
                    const status = subscription.status
                    const createdAt = new Date(subscription.created)

                    return (
                      <div
                        key={subscription.id}
                        className="flex items-center justify-between gap-2 p-2 border rounded-lg"
                      >
                        <span title={format(createdAt, 'MMM dd, yyyy hh:mm a')}>
                          {formatDistance(createdAt, new Date(), {
                            addSuffix: true,
                          })}
                        </span>

                        {status === 'active' ? (
                          <Badge variant="default" className="bg-green-500">
                            Active
                          </Badge>
                        ) : status === 'canceled' ? (
                          <Badge variant="destructive">Canceled</Badge>
                        ) : (
                          <Badge variant="outline">{capitalizeString(status)}</Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <RepeatIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <span>No subscriptions found</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RechargeDialog open={isRechargeDialogOpen} onOpenChange={setIsRechargeDialogOpen} />
    </div>
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
