import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Stripe } from 'stripe'

import { getStripe } from '../../client/stripe'
import { env } from '../../env'

export async function POST(req: Request) {
  const stripe = getStripe()

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { message: 'Payment webhook error: Missing STRIPE_WEBHOOK_SECRET_KEY' },
      { status: 500 },
    )
  }

  let event: Stripe.Event

  try {
    const stripeSignature = (await headers()).get('stripe-signature')
    if (!stripeSignature) {
      return NextResponse.json(
        { message: 'Payment webhook error: Missing stripe-signature header' },
        { status: 400 },
      )
    }

    event = stripe.webhooks.constructEvent(
      await req.text(),
      stripeSignature,
      env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.log(`❌ Payment webhook error: ${errorMessage}`)
    return NextResponse.json({ message: `Payment webhook error: ${errorMessage}` }, { status: 400 })
  }

  const permittedEvents: string[] = [
    'checkout.session.completed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
  ]

  if (permittedEvents.includes(event.type)) {
    let data

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          data = event.data.object
          console.log(`💰 CheckoutSession status: ${data.payment_status}`)
          break
        case 'checkout.session.async_payment_succeeded':
          data = event.data.object
          console.log(`❌ Payment failed: ${data.payment_status}`)
          break
        case 'checkout.session.async_payment_failed':
          data = event.data.object
          console.log(`💰 PaymentIntent status: ${data.status}`)
          break
        case 'checkout.session.expired':
          data = event.data.object
          break
        default:
          throw new Error(`Unhandled event: ${event.type}`)
      }
    } catch (error) {
      console.log(error)
      return NextResponse.json({ message: 'Webhook handler failed' }, { status: 500 })
    }
  }

  // Return a response to acknowledge receipt of the event.
  return NextResponse.json({ message: 'Received' }, { status: 200 })
}
