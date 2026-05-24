import { motion } from 'motion/react'

const PILLS = [
  'REST API',
  'TypeScript',
  'Python',
  'OpenAI-compatible',
  'MCP',
  'Bring your own keys',
] as const

export function LandingDevelopers() {
  return (
    <section className="border-b border-border bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <motion.p
          className="text-center font-mono text-xs uppercase tracking-widest text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          Built for developers
        </motion.p>
        <motion.div
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          {PILLS.map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-border bg-muted/50 px-4 py-1.5 font-mono text-xs text-muted-foreground"
            >
              {pill}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
