'use client'

import type { Stripe } from 'stripe'
import React, { useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { CreditCardIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@cared/ui/components/alert-dialog'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cared/ui/components/dialog'

import type { PaymentMethodDisplayInfo } from '@/lib/payment-method-utils'
import type { ColumnDef } from '@tanstack/react-table'
import { useListPaymentMethods, useRemovePaymentMethod } from '@/hooks/use-stripe'
import { getPaymentMethodDisplayInfo } from '@/lib/payment-method-utils'
import { StripePaymentMethodForm } from './stripe-payment-method-form'

// Types for table data
interface PaymentMethodTableData {
  id: string
  type: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
  created: number
  object: Stripe.PaymentMethod
  displayInfo: PaymentMethodDisplayInfo
}

export function PaymentMethods({ organizationId }: { organizationId?: string }) {
  const result = useListPaymentMethods()
  const paymentMethods = result.paymentMethods
  const isLoading = result.isLoading
  const refetchPaymentMethods = result.refetchPaymentMethods
  const removePaymentMethod = useRemovePaymentMethod()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Transform payment methods data for table
  const paymentMethodsData: PaymentMethodTableData[] = Array.isArray(paymentMethods)
    ? paymentMethods.map((pm: Stripe.PaymentMethod) => {
        const displayInfo = getPaymentMethodDisplayInfo(pm)
        return {
          id: pm.id,
          type: pm.type,
          brand: displayInfo.brand,
          last4: displayInfo.last4,
          expMonth: displayInfo.expMonth,
          expYear: displayInfo.expYear,
          isDefault: false, // Stripe doesn't have a default flag, we'll show all as non-default
          created: pm.created,
          object: pm,
          displayInfo,
        }
      })
    : []

  const handlePaymentMethodAdded = () => {
    setIsAddDialogOpen(false)
    void refetchPaymentMethods()
  }

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      await removePaymentMethod(paymentMethodId)
    } catch (error) {
      console.error('Failed to remove payment method:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Manage your saved payment methods</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[95vh] px-0 flex flex-col">
              <DialogHeader className="px-6">
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>
                  Securely add a new payment method to your account.
                </DialogDescription>
              </DialogHeader>
              <StripePaymentMethodForm
                organizationId={organizationId}
                onSuccess={handlePaymentMethodAdded}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <PaymentMethodsTable
          data={paymentMethodsData}
          onRemove={handleRemovePaymentMethod}
          onAdd={() => setIsAddDialogOpen(true)}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  )
}

// Payment Methods Table Component
function PaymentMethodsTable({
  data,
  onAdd,
  onRemove,
  isLoading,
}: {
  data: PaymentMethodTableData[]
  onAdd: () => void
  onRemove: (paymentMethodId: string) => void
  isLoading: boolean
}) {
  const columns: ColumnDef<PaymentMethodTableData>[] = [
    {
      accessorKey: 'brand',
      header: 'Payment Method',
      enableSorting: true,
      cell: ({ row }) => {
        const displayInfo = row.original.displayInfo
        const isDefault = row.original.isDefault
        const icon = displayInfo.icon

        return (
          <div className="flex items-center gap-2">
            {typeof icon === 'string' ? (
              <Image
                src={icon}
                alt={displayInfo.brand}
                width={16}
                height={16}
                className="object-contain"
              />
            ) : (
              React.createElement(icon, { className: 'h-4 w-4 text-muted-foreground' })
            )}
            <span className="font-medium">{displayInfo.displayName}</span>
            {isDefault && (
              <Badge variant="secondary" className="text-xs">
                Default
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'expMonth',
      header: 'Expires',
      enableSorting: true,
      cell: ({ row }) => {
        const displayInfo = row.original.displayInfo

        if (!displayInfo.hasExpiry) {
          return <span className="text-muted-foreground">—</span>
        }

        const expMonth = displayInfo.expMonth
        const expYear = displayInfo.expYear

        return (
          <span>
            {expMonth.toString().padStart(2, '0')}/{expYear}
          </span>
        )
      },
    },
    {
      accessorKey: 'created',
      header: 'Added',
      enableSorting: true,
      cell: ({ row }) => {
        const created = row.getValue<number>('created')
        const date = new Date(created * 1000)

        return (
          <span title={format(date, 'MMM dd, yyyy hh:mm a')}>{format(date, 'MMM dd, yyyy')}</span>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const paymentMethodId = row.original.id

        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this payment method? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onRemove(paymentMethodId)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading payment methods...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CreditCardIcon className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No payment methods</h3>
        <p className="text-muted-foreground mb-4">You haven't added any payment methods yet.</p>
        <Button onClick={onAdd}>
          <PlusIcon className="h-4 w-4" />
          Add Payment Method
        </Button>
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      defaultPageSize={10}
      defaultSorting={[{ id: 'created', desc: true }]}
    />
  )
}
