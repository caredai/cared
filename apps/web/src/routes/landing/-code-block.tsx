'use client'

import { motion } from 'motion/react'

const LINES = [
  { type: 'comment', text: '# One binding, all features' },
  { type: 'empty', text: '' },
  { type: 'key', text: 'CARED_API_KEY' },
  { type: 'eq', text: '=' },
  { type: 'value', text: 'sk_...' },
  { type: 'empty', text: '' },
  { type: 'comment', text: '# Gateway · Tools · Sandboxes · DB · Storage · Agents' },
]

export function LandingCodeBlock() {
  return (
    <section className="border-b border-border bg-muted/20 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            One key. One integration.
          </h2>
          <p className="mx-auto mt-3 max-w-lg font-sans text-muted-foreground">
            No per-service keys. Use the same credential for models, tools,
            sandboxes, and storage.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 overflow-hidden rounded-xl border border-border bg-card font-mono text-sm shadow-lg"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
            <span className="size-2.5 rounded-full bg-muted-foreground/50" />
            <span className="size-2.5 rounded-full bg-muted-foreground/50" />
            <span className="size-2.5 rounded-full bg-muted-foreground/50" />
            <span className="ml-2 text-xs text-muted-foreground">.env</span>
          </div>
          <div className="p-4 sm:p-6">
            {LINES.map((line, i) => (
              <div
                key={`${line.type}-${i}-${line.text.slice(0, 12)}`}
                className="flex min-h-[1.5rem] items-center gap-4 font-mono text-sm"
              >
                <span className="w-6 shrink-0 select-none text-right text-muted-foreground/70">
                  {line.type === 'empty' ? '' : i + 1}
                </span>
                <span
                  className={
                    line.type === 'comment'
                      ? 'text-muted-foreground'
                      : line.type === 'key'
                        ? 'text-foreground'
                        : line.type === 'value'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                  }
                >
                  {line.text}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
