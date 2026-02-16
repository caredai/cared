'use client'

import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { UserPlus, Link2, Code, Rocket, ArrowRight } from 'lucide-react'

import { Button } from '@cared/ui/components/button'

const STEPS = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Sign up',
    description: 'Create an account and get your API key in the dashboard.',
  },
  {
    step: '02',
    icon: Link2,
    title: 'Connect',
    description: 'Add your key to env or SDK. One binding for gateway, DB, storage.',
  },
  {
    step: '03',
    icon: Code,
    title: 'Build',
    description: 'Use models, tools, sandboxes, and vector store from a single API.',
  },
  {
    step: '04',
    icon: Rocket,
    title: 'Deploy',
    description: 'Ship agent apps with built-in auth and hosting. Scale on demand.',
  },
] as const

export function LandingHowItWorks() {
  return (
    <section className="border-b border-border bg-background px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-sans text-muted-foreground">
            Four steps from sign-up to production.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item, i) => (
            <motion.div
              key={item.step}
              className="relative flex flex-col items-center text-center lg:items-start lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-muted/50 text-foreground">
                <item.icon className="size-8" />
              </div>
              <span className="mt-4 block font-mono text-xs font-medium text-muted-foreground">
                {item.step}
              </span>
              <h3 className="mt-1 font-mono text-lg font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-16 flex justify-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Button asChild size="lg" className="font-mono">
            <Link to="/auth/sign-in">
              Get started
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
