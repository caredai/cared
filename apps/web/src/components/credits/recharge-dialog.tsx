'use client'

import { useState } from 'react'
import { BitcoinIcon, CreditCardIcon } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import { Label } from '@cared/ui/components/label'
import { Separator } from '@cared/ui/components/separator'

import { NumberInput } from '@/components/number-input'
import { HelioCheckoutForm } from './helio-checkout-form'
import { StripeCheckoutForm } from './stripe-checkout-form'

type PaymentGateway = 'stripe' | 'crypto'

export function RechargeDialog({
  organizationId,
  open,
  onOpenChange,
}: {
  organizationId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [rechargeAmount, setRechargeAmount] = useState(10)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentGateway>('stripe')
  const [showCheckout, setShowCheckout] = useState(false)

  const fee = Math.max(rechargeAmount * 0.05, 0.8)
  const totalAmount = rechargeAmount + fee

  const handleRecharge = () => {
    if (rechargeAmount > 0) {
      setShowCheckout(true)
    }
  }

  const handleCloseRechargeDialog = () => {
    onOpenChange(false)
    setRechargeAmount(10)
    setSelectedPaymentMethod('stripe')
    setShowCheckout(false)
  }

  const formatCredits = (amount: number) => {
    return amount.toFixed(2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[95vh] px-0 flex flex-col">
        <DialogHeader className="px-6">
          <DialogTitle>Buy More Credits</DialogTitle>
          <DialogDescription>
            Purchase credits as a one time top-up to use for your Cared usage. Cared charges a 5%
            ($0.80 minimum) fee.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-6">
          {!showCheckout ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Amount{' '}
                    <span className="text-muted-foreground text-xs">
                      (Minimum of $5 and maximum of $2500)
                    </span>
                  </Label>
                  <NumberInput
                    id="amount"
                    value={rechargeAmount}
                    onChange={setRechargeAmount}
                    min={5}
                    max={2500}
                    step={1}
                    placeholder="Enter amount"
                  />
                </div>

                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Amount:</span>
                    <span>${formatCredits(rechargeAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Processing Fee:</span>
                    <span>${formatCredits(fee)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>${formatCredits(totalAmount)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Payment Gateway</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedPaymentMethod === 'stripe' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPaymentMethod('stripe')}
                    >
                      <CreditCardIcon className="h-4 w-4" />
                      Stripe
                    </Button>
                    <Button
                      variant={selectedPaymentMethod === 'crypto' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPaymentMethod('crypto')}
                    >
                      <BitcoinIcon className="h-4 w-4" />
                      Helio (Crypto)
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseRechargeDialog}>
                  Cancel
                </Button>
                <Button onClick={handleRecharge} disabled={rechargeAmount <= 0}>
                  Continue
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="space-y-4">
              <div className="isolate">
                {selectedPaymentMethod === 'stripe' ? (
                  <StripeCheckoutForm organizationId={organizationId} credits={rechargeAmount} />
                ) : (
                  <HelioCheckoutForm credits={rechargeAmount} />
                )}
              </div>
              <Button variant="outline" onClick={handleCloseRechargeDialog} className="w-full">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
