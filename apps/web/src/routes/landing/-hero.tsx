'use client'

import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import { Button } from '@cared/ui/components/button'

const ROTATING_WORDS = ['Use', 'Build', 'Deploy', 'Run'] as const
const ROTATE_INTERVAL_MS = 2800

export function LandingHero() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_WORDS.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const word = ROTATING_WORDS[index]

  return (
    <section className="relative overflow-hidden border-b border-border bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      {/* Gradient orbs — subtle, works in light and dark */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full opacity-20 blur-[120px] dark:opacity-[0.12]"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.2 260 / 0.4) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full opacity-15 blur-[100px] dark:opacity-[0.08]"
          style={{
            background: 'radial-gradient(circle, oklch(0.6 0.15 180 / 0.35) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute left-1/2 top-3/4 h-[320px] w-[320px] -translate-x-1/2 rounded-full opacity-10 blur-[80px] dark:opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle, oklch(0.55 0.18 300 / 0.3) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
        }}
      />

      <div className="relative mx-auto max-w-5xl text-center">
        <motion.h1
          className="font-mono text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl xl:text-[4rem]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <span
            className="relative inline-block min-w-[6ch] align-top text-right"
            style={{ height: '1.1em' }}
          >
            <span
              className="relative block overflow-hidden text-right"
              style={{ height: '1.1em' }}
              aria-hidden
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={word}
                  className="absolute right-0 top-0 block w-max bg-selection px-0.5 font-semibold text-selection-foreground"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '-100%' }}
                  transition={{
                    duration: 0.45,
                    ease: [0.32, 0.72, 0, 1],
                  }}
                  style={{ height: '1.1em' }}
                >
                  {word}
                </motion.span>
              </AnimatePresence>
            </span>
          </span>
          <span> AI Agents</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-8 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground sm:text-lg"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
        >
          All-in-one platform for your apps & agents. Pay as you go or Fixed plan. Unified billing
          unlocks the full suite, including Auth, LLM Gateway, Tools, Sandboxes, Memory, Knowledge
          base, Apps, Database, Storage...
        </motion.p>

        <motion.div
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button asChild size="lg" className="h-12 rounded-lg px-6 font-mono text-sm shadow-sm">
            <Link to="/auth/sign-in">Start for Free</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-lg border-2 px-6 font-mono text-sm"
          >
            <Link to="/docs" target="_blank">
              View Docs
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
