'use client'

import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'

import { Button } from '@cared/ui/components/button'

export function LandingCta() {
  return (
    <section className="border-b border-border bg-muted/20 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <motion.h2
          className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
        >
          Start building in minutes
        </motion.h2>
        <motion.p
          className="mt-3 font-sans text-muted-foreground"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          Pay-as-you-go and subscription. No lock-in. One account for the full
          stack.
        </motion.p>
        <motion.div
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Button asChild size="lg" className="font-mono text-sm h-11 px-6">
            <Link to="/auth/sign-in">
              Get started
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-mono text-sm h-11 px-6">
            <Link to="/docs">Documentation</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
