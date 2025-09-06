'use client'

import { useEffect, useState } from 'react'
import { CreditCardIcon } from 'lucide-react'

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
import { Switch } from '@cared/ui/components/switch'

import { NumberInput } from '@/components/number-input'
import { useCredits, useUpdateAutoRechargeCreditsSubscription, useCancelAutoRechargeCreditsSubscription } from '@/hooks/use-credits'
import { StripeAutoTopupForm } from './stripe-auto-topup-form'

export function AutoTopupDialog({
  organizationId,
  open,
  onOpenChange,
}: {
  organizationId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { credits } = useCredits(organizationId)
  const updateAutoRechargeSubscription = useUpdateAutoRechargeCreditsSubscription(organizationId)
  const cancelAutoRechargeSubscription = useCancelAutoRechargeCreditsSubscription(organizationId)

  const [autoRechargeThreshold, setAutoRechargeThreshold] = useState(10)
  const [autoRechargeAmount, setAutoRechargeAmount] = useState(50)
  const [showCheckout, setShowCheckout] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAutoTopupEnabled, setIsAutoTopupEnabled] = useState(true)

  const fee = Math.max(autoRechargeAmount * 0.05, 0.8)
  const totalAmount = autoRechargeAmount + fee

  // Check if auto-recharge subscription already exists
  const hasExistingSubscription = !!credits.metadata.autoRechargeSubscriptionId

  useEffect(() => {
    setAutoRechargeThreshold(credits.metadata.autoRechargeThreshold ?? 10)
    setAutoRechargeAmount(credits.metadata.autoRechargeAmount ?? 50)
    setShowCheckout(false)
    setIsUpdating(false)
    setIsAutoTopupEnabled(!!credits.metadata.autoRechargeSubscriptionId)
  }, [open, credits])

  const handleAutoTopup = () => {
    if (autoRechargeThreshold > 0 && autoRechargeAmount > 0) {
      setShowCheckout(true)
    }
  }

  const handleUpdateSettings = async () => {
    setIsUpdating(true)
    try {
      if (isAutoTopupEnabled) {
        // Update existing subscription
        if (autoRechargeThreshold > 0 && autoRechargeAmount > 0) {
          await updateAutoRechargeSubscription(autoRechargeThreshold, autoRechargeAmount)
        }
      } else {
        // Cancel subscription when disabled
        await cancelAutoRechargeSubscription()
      }
      onOpenChange(false)
    } catch {
      // Error is handled by the hook
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCloseAutoTopupDialog = () => {
    onOpenChange(false)
  }

  const formatCredits = (amount: number) => {
    return amount.toFixed(2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[95vh] px-0 flex flex-col">
        <DialogHeader className="px-6">
          <DialogTitle>Auto Top-Up</DialogTitle>
          <DialogDescription>
            Automatically top-up your credits when your balance falls below the threshold. Cared
            charges a 5% ($0.80 minimum) fee per recharge.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-6">
          {!showCheckout ? (
            <>
              {hasExistingSubscription && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-topup-enabled">Enable Auto Top-Up</Label>
                    <Switch
                      id="auto-topup-enabled"
                      checked={isAutoTopupEnabled}
                      onCheckedChange={setIsAutoTopupEnabled}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Toggle to enable or disable automatic credit top-up.
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold">
                    Auto Top-Up Threshold{' '}
                    <span className="text-muted-foreground text-xs">
                      (Minimum of $5 and maximum of $2500)
                    </span>
                  </Label>
                  <NumberInput
                    id="threshold"
                    value={autoRechargeThreshold}
                    onChange={setAutoRechargeThreshold}
                    min={5}
                    max={2500}
                    step={1}
                    placeholder="Enter threshold amount"
                  />
                  <p className="text-sm text-muted-foreground">
                    When your balance falls below this amount, we'll automatically top-up your
                    account.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Top-Up Amount{' '}
                    <span className="text-muted-foreground text-xs">
                      (Minimum of $5 and maximum of $2500)
                    </span>
                  </Label>
                  <NumberInput
                    id="amount"
                    value={autoRechargeAmount}
                    onChange={setAutoRechargeAmount}
                    min={5}
                    max={2500}
                    step={1}
                    placeholder="Enter recharge amount"
                  />
                  <p className="text-sm text-muted-foreground">
                    This amount will be added to your account each time auto top-up is triggered.
                  </p>
                </div>

                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Top-Up Amount:</span>
                    <span>${formatCredits(autoRechargeAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Processing Fee:</span>
                    <span>${formatCredits(fee)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total per Recharge:</span>
                    <span>${formatCredits(totalAmount)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Payment Gateway</Label>
                  <div className="flex gap-2">
                    <Button variant="default" size="sm">
                      <CreditCardIcon className="h-4 w-4" />
                      Stripe
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Currently only Stripe is supported for auto top-up subscriptions.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseAutoTopupDialog}>
                  Cancel
                </Button>
                {hasExistingSubscription ? (
                  <Button
                    onClick={handleUpdateSettings}
                    disabled={
                      (isAutoTopupEnabled && (autoRechargeThreshold <= 0 || autoRechargeAmount <= 0)) ||
                      isUpdating
                    }
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleAutoTopup}
                    disabled={autoRechargeThreshold <= 0 || autoRechargeAmount <= 0}
                  >
                    Setup Auto Top-Up
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : (
            <div className="space-y-4">
              <div className="isolate">
                <StripeAutoTopupForm
                  organizationId={organizationId}
                  autoRechargeThreshold={autoRechargeThreshold}
                  autoRechargeAmount={autoRechargeAmount}
                  onSuccess={handleCloseAutoTopupDialog}
                  onCancel={handleCloseAutoTopupDialog}
                />
              </div>
              <Button variant="outline" onClick={handleCloseAutoTopupDialog} className="w-full">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
