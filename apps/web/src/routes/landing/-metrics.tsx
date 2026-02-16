'use client'

import { motion } from 'motion/react'
import { Zap, Lock, Layers, CreditCard } from 'lucide-react'

const METRICS = [
  {
    icon: Zap,
    value: 'One API',
    label: 'Single integration for the full stack',
  },
  {
    icon: CreditCard,
    value: 'Pay-as-you-go',
    label: 'Plus subscription plans',
  },
  {
    icon: Layers,
    value: 'Full stack',
    label: 'Gateway, DB, storage, agents',
  },
  {
    icon: Lock,
    value: 'No lock-in',
    label: 'Your keys, your data',
  },
] as const

export function LandingMetrics() {
  return (
    <section className="border-b border-border bg-muted/20 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((item, i) => (
            <motion.li
              key={item.value}
              className="flex flex-col items-center text-center sm:items-start sm:text-left"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-foreground/80">
                <item.icon className="size-5" />
              </span>
              <span className="mt-3 font-mono text-sm font-semibold tracking-tight text-foreground">
                {item.value}
              </span>
              <span className="mt-1 font-sans text-xs text-muted-foreground">
                {item.label}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
