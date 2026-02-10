import { useState } from 'react'
import { format, formatDistance } from 'date-fns'
import { Decimal } from 'decimal.js'
import { AlarmClockIcon, HandCoinsIcon, HistoryIcon, RepeatIcon } from 'lucide-react'

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

import type { ColumnDef } from '@tanstack/react-table'
import { SectionTitle } from '@/components/section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import {
  useCredits,
  useListCreditsSubscriptions,
  useListCreditsTransactions,
} from '@/hooks/use-credits'
import { AutoTopupDialog } from './auto-topup-dialog'
import { useCheckPaymentMethodSetupReturnUrl } from './payment-method-dialog'
import { PaymentMethods } from './payment-methods'
import { RechargeDialog } from './recharge-dialog'

// Types for table data
interface TransactionTableData {
  id: string
  transactionType: 'inbound' | 'outbound'
  transactionStatus: 'purchased' | 'granted' | 'voided' | 'invoiced'
  status: 'pending' | 'settled' | 'failed'
  source: 'manual' | 'interval' | 'threshold'
  credits: string
  createdAt?: Date
}

interface SubscriptionTableData {
  id: string
  planCode: string
  status: 'active' | 'canceled' | 'pending' | 'terminated'
  createdAt: Date
}

export function Credits() {
  useCheckPaymentMethodSetupReturnUrl()

  const { credits } = useCredits()
  const { creditsTransactionsPages } = useListCreditsTransactions()
  const { creditsSubscriptions } = useListCreditsSubscriptions()

  const [isRechargeDialogOpen, setIsRechargeDialogOpen] = useState(false)
  const [isAutoTopupDialogOpen, setIsAutoTopupDialogOpen] = useState(false)

  // Transform transactions data for table
  const transactionsData: TransactionTableData[] = creditsTransactionsPages
    ? creditsTransactionsPages
        .flatMap((page) => page.transactions)
        .map((transaction) => ({
          id: transaction.id,
          transactionType: transaction.transactionType,
          transactionStatus: transaction.transactionStatus,
          status: transaction.status,
          source: transaction.source,
          credits: transaction.credits,
          createdAt: transaction.createdAt,
        }))
    : []

  // Transform subscriptions data for table
  const subscriptionsData: SubscriptionTableData[] = creditsSubscriptions
    ? creditsSubscriptions.map((subscription) => ({
        id: subscription.id,
        planCode: subscription.planCode,
        status: subscription.status,
        createdAt: subscription.createdAt,
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
          <div className="flex items-start justify-between mt-8">
            <div>
              <p className="text-4xl font-bold">$ {new Decimal(credits.balance).toFixed(2)}</p>
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
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <HistoryIcon className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <RepeatIcon className="h-4 w-4" />
                Subscriptions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              <TransactionsTable data={transactionsData} />
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-4">
              <SubscriptionsTable data={subscriptionsData} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <PaymentMethods />

      <RechargeDialog open={isRechargeDialogOpen} onOpenChange={setIsRechargeDialogOpen} />

      <AutoTopupDialog open={isAutoTopupDialogOpen} onOpenChange={setIsAutoTopupDialogOpen} />
    </>
  )
}

// Transactions Table Component
function TransactionsTable({ data }: { data: TransactionTableData[] }) {
  const columns: ColumnDef<TransactionTableData>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => {
        const createdAt = row.getValue<Date | undefined>('createdAt')
        if (!createdAt) return '-'
        return (
          <span title={format(createdAt, 'MMM dd, yyyy hh:mm a')}>
            {formatDistance(createdAt, new Date(), { addSuffix: true })}
          </span>
        )
      },
    },
    {
      accessorKey: 'source',
      header: 'Type',
      cell: ({ row }) => {
        const source = row.getValue<'manual' | 'interval' | 'threshold'>('source')
        const type = row.original.transactionType

        if (type === 'outbound') {
          return 'Cost'
        }

        switch (source) {
          case 'manual':
            return 'Onetime top-up'
          default:
            return 'Auto top-up'
        }
      },
    },
    {
      accessorKey: 'credits',
      header: 'Amount',
      cell: ({ row }) => {
        const credits = row.getValue<string>('credits')
        const type = row.original.transactionType
        const sign = type === 'inbound' ? '+' : '-'
        return (
          <span>
            {sign} ${new Decimal(credits).toFixed(2)}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue<'pending' | 'settled' | 'failed'>('status')

        switch (status) {
          case 'settled':
            return <Badge variant="default">Settled</Badge>
          case 'pending':
            return <Badge variant="secondary">Pending</Badge>
          default:
            return <Badge variant="destructive">Failed</Badge>
        }
      },
    },
  ]

  return (
    <div>
      <p className="text-sm text-muted-foreground">Your recent transactions</p>
      <DataTable columns={columns} data={data} defaultPageSize={10} />
    </div>
  )
}

// Subscriptions Table Component
function SubscriptionsTable({ data }: { data: SubscriptionTableData[] }) {
  const columns: ColumnDef<SubscriptionTableData>[] = [
    {
      accessorKey: 'planCode',
      header: 'Plan',
      cell: ({ row }) => row.getValue<string>('planCode'),
    },
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
        const status = row.getValue<'active' | 'canceled' | 'pending' | 'terminated'>('status')

        switch (status) {
          case 'active':
            return <Badge variant="default">Active</Badge>
          case 'canceled':
            return <Badge variant="destructive">Canceled</Badge>
          case 'pending':
            return <Badge variant="secondary">Pending</Badge>
          case 'terminated':
            return <Badge variant="outline">Terminated</Badge>
          default:
            return <Badge variant="outline">{capitalizeString(status)}</Badge>
        }
      },
    },
  ]

  return (
    <div>
      <p className="text-sm text-muted-foreground">Your subscriptions</p>
      <DataTable columns={columns} data={data} defaultPageSize={10} />
    </div>
  )
}

function capitalizeString(str: string) {
  if (str.length === 0) {
    return ''
  }
  str = str.replace('_', ' ')
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
