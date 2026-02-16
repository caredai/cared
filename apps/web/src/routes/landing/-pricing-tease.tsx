'use client'

import { motion } from 'motion/react'
import { Check } from 'lucide-react'

const PLANS = [
  {
    name: 'Pay-as-you-go',
    description: 'Usage-based billing. No upfront commitment.',
    points: ['Per-request pricing', 'No minimums', 'Cancel anytime'],
  },
  {
    name: 'Subscription',
    description: 'Predictable monthly cost for teams.',
    points: ['Included usage', 'Priority support', 'Volume discounts'],
  },
  {
    name: 'No lock-in',
    description: 'Your infrastructure, your control.',
    points: ['Bring your own keys', 'Export data', 'Standard APIs'],
  },
] as const

export function LandingPricingTease() {
  return (
    <section className="border-b border-border bg-muted/20 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Pricing that scales with you
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-sans text-muted-foreground">
            Start with pay-as-you-go. Move to subscription when it fits. No
            lock-in.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              className="relative rounded-2xl border border-border bg-card p-8 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <h3 className="font-mono text-lg font-semibold tracking-tight text-foreground">
                {plan.name}
              </h3>
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                {plan.description}
              </p>
              <ul className="mt-6 space-y-3">
                {plan.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-3 font-sans text-sm text-muted-foreground"
                  >
                    <Check className="size-4 shrink-0 text-foreground/70" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
