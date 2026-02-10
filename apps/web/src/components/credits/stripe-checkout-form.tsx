import type Stripe from 'stripe'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PlusIcon } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import { Label } from '@cared/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { Spinner } from '@cared/ui/components/spinner'

import {
  useCreateCreditsOnetimeTopUp,
  useCredits,
  useGenerateCreditsTopUpUrl,
  useListCreditsTransactions,
  usePollCreditsOnetimeTopUpStatus,
} from '@/hooks/use-credits'
import {
  useDefaultPaymentMethodId,
  useListPaymentMethods,
  useUpdateDefaultPaymentMethod,
} from '@/hooks/use-stripe'
import { PaymentMethodDialog } from './payment-method-dialog'

export function StripeCheckoutForm({
  credits,
  onSuccess,
  onCancel,
}: {
  credits: number
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const createTransaction = useCreateCreditsOnetimeTopUp()
  const { generateCreditsTopUpUrl, creditsTopUpUrl } = useGenerateCreditsTopUpUrl()
  const { refetchCredits } = useCredits()
  const { refetchCreditsTransactions } = useListCreditsTransactions()
  const defaultPaymentMethodId = useDefaultPaymentMethodId()
  const { paymentMethods, refetchPaymentMethods } = useListPaymentMethods()
  const updateDefaultPaymentMethod = useUpdateDefaultPaymentMethod()

  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false)
  const [transactionId, setTransactionId] = useState<string>()
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>()
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { status: transactionStatus } = usePollCreditsOnetimeTopUpStatus(transactionId)

  // Initialize selected payment method
  useEffect(() => {
    const firstPaymentMethodId = paymentMethods?.[0]?.id
    const paymentMethodId = defaultPaymentMethodId ?? firstPaymentMethodId

    // Set payment method if not set, or reset if current selection is invalid
    if (
      !selectedPaymentMethodId ||
      !paymentMethods?.some((pm) => pm.id === selectedPaymentMethodId)
    ) {
      setSelectedPaymentMethodId(paymentMethodId)
    }
  }, [defaultPaymentMethodId, paymentMethods, selectedPaymentMethodId])

  // Format payment method for display
  const formatPaymentMethod = (pm: Stripe.PaymentMethod) => {
    if (pm.type === 'card' && pm.card) {
      const card = pm.card
      return `${card.brand.toUpperCase()} •••• ${card.last4}`
    }
    return pm.type
  }

  const handlePaymentMethodAdded = (id?: string) => {
    setShowPaymentMethodDialog(false)
    void refetchPaymentMethods().then(() => {
      if (id) {
        setSelectedPaymentMethodId(id)
      }
    })
  }

  // Handle transaction status changes
  useEffect(() => {
    if (!transactionStatus || transactionStatus === 'pending') return

    void refetchCredits()
    void refetchCreditsTransactions()

    if (transactionStatus === 'settled') {
      onSuccess?.()
    } else {
      onCancel?.()
    }
  }, [
    transactionStatus,
    refetchCredits,
    refetchCreditsTransactions,
    onSuccess,
    onCancel,
  ])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  const handlePayment = useCallback(async () => {
    // If payment URL is available, navigate to it
    if (creditsTopUpUrl) {
      window.location.replace(creditsTopUpUrl)
      return
    }

    // Create transaction and start 5-second timeout
    setIsCreatingTransaction(true)
    try {
      // Update default payment method first if selected payment method is different from current default
      // This ensures the transaction is created with the correct payment method
      if (selectedPaymentMethodId && selectedPaymentMethodId !== defaultPaymentMethodId) {
        await updateDefaultPaymentMethod(selectedPaymentMethodId)
      }

      const transaction = await createTransaction(credits)
      setTransactionId(transaction.id)
      setIsCreatingTransaction(false)

      // Start timeout to generate payment URL after 5 seconds if still pending
      timeoutRef.current = setTimeout(() => {
        if (transactionStatus === 'pending' && !creditsTopUpUrl) {
          void generateCreditsTopUpUrl(transaction.id)
        }
        timeoutRef.current = null
      }, 5000)
    } catch (error) {
      console.error('Failed to create transaction:', error)
      setIsCreatingTransaction(false)
    }
  }, [
    creditsTopUpUrl,
    createTransaction,
    credits,
    transactionStatus,
    generateCreditsTopUpUrl,
    selectedPaymentMethodId,
    defaultPaymentMethodId,
    updateDefaultPaymentMethod,
  ])

  return (
    <div className="space-y-4">
      {isCreatingTransaction ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Spinner className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Creating transaction...</p>
        </div>
      ) : transactionId &&
        (!transactionStatus || transactionStatus === 'pending') &&
        !creditsTopUpUrl ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Spinner className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Processing transaction...</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>${credits.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="flex gap-2">
              <Select
                value={selectedPaymentMethodId}
                onValueChange={setSelectedPaymentMethodId}
                disabled={!paymentMethods || paymentMethods.length === 0}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue
                    placeholder={
                      !paymentMethods || paymentMethods.length === 0
                        ? 'No payment methods'
                        : 'Select a payment method'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods?.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {formatPaymentMethod(pm)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setShowPaymentMethodDialog(true)}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose a payment method for this transaction. Click + to add a new payment method.
            </p>
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            {creditsTopUpUrl
              ? 'Click the button below to complete your payment securely through Stripe.'
              : 'Click the button below to confirm and proceed through Stripe.'}
          </p>
          <Button
            onClick={handlePayment}
            className="w-full"
            size="lg"
            disabled={!selectedPaymentMethodId}
          >
            {creditsTopUpUrl ? 'Go to Payment' : 'Confirm and Pay'}
          </Button>
        </>
      )}

      <PaymentMethodDialog
        open={showPaymentMethodDialog}
        onOpenChange={setShowPaymentMethodDialog}
        onSuccess={handlePaymentMethodAdded}
      />
    </div>
  )
}
