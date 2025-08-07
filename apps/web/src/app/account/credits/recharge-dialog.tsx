'use client'

import { useState } from 'react'
import { CoinsIcon, CreditCardIcon } from 'lucide-react'

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

type PaymentMethod = 'fiat' | 'crypto'

export function RechargeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [rechargeAmount, setRechargeAmount] = useState(10)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('fiat')
  const [showCheckout, setShowCheckout] = useState(false)

  const fee = rechargeAmount * 0.05
  const totalAmount = rechargeAmount + fee

  const handleRecharge = () => {
    if (rechargeAmount > 0) {
      setShowCheckout(true)
    }
  }

  const handleCloseRechargeDialog = () => {
    onOpenChange(false)
    setRechargeAmount(10)
    setSelectedPaymentMethod('fiat')
    setShowCheckout(false)
  }

  const formatCredits = (amount: number) => {
    return amount.toFixed(2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recharge Credits</DialogTitle>
          <DialogDescription>
            Add credits to your account. Cared charges a 5% processing fee on all transactions.
          </DialogDescription>
        </DialogHeader>

        {!showCheckout ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <NumberInput
                  id="amount"
                  value={rechargeAmount}
                  onChange={setRechargeAmount}
                  min={5}
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
                  <span>Processing Fee (5%):</span>
                  <span>${formatCredits(fee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${formatCredits(totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedPaymentMethod === 'fiat' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPaymentMethod('fiat')}
                  >
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    Credit Card
                  </Button>
                  <Button
                    variant={selectedPaymentMethod === 'crypto' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPaymentMethod('crypto')}
                  >
                    <CoinsIcon className="h-4 w-4 mr-2" />
                    Cryptocurrency
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseRechargeDialog}>
                Cancel
              </Button>
              <Button onClick={handleRecharge} disabled={rechargeAmount <= 0}>
                Continue to Payment
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            <div className="isolate">
              {selectedPaymentMethod === 'fiat' ? (
                <StripeCheckoutForm credits={rechargeAmount} />
              ) : (
                <HelioCheckoutForm credits={rechargeAmount} />
              )}
            </div>
            <Button variant="outline" onClick={handleCloseRechargeDialog} className="w-full">
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
