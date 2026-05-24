import { Box, Cpu, KeyRound } from 'lucide-react'
import { motion } from 'motion/react'

export function LandingBento() {
  return (
    <section
      id="features"
      className="border-b border-border bg-background px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Built for production
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-sans text-muted-foreground">
            From AI gateway to sandboxes and databases—one platform, one integration.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-6 sm:grid-rows-2">
          {/* Large: AI Gateway */}
          <motion.div
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-colors hover:border-foreground/15 hover:bg-muted/30 sm:col-span-4 sm:row-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45 }}
          >
            <div className="flex size-14 items-center justify-center rounded-xl border border-border bg-muted/50 text-foreground">
              <Cpu className="size-7" />
            </div>
            <h3 className="mt-6 font-mono text-xl font-semibold tracking-tight text-foreground">
              AI Gateway
            </h3>
            <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-muted-foreground">
              Unified routing for multiple providers. Bring your own keys or use ours. Usage
              tracking, fallbacks, and a single API surface for chat, embeddings, and tools.
            </p>
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5">/v1/chat/completions</code>
              {' · '}
              <code className="rounded bg-muted px-1.5 py-0.5">embeddings</code>
            </p>
          </motion.div>

          {/* Sandboxes */}
          <motion.div
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-foreground/15 hover:bg-muted/30 sm:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/50 text-foreground">
              <Box className="size-6" />
            </div>
            <h3 className="mt-4 font-mono text-lg font-semibold tracking-tight text-foreground">
              Sandboxes
            </h3>
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
              Ephemeral dev environments for agents. Code, run, and tear down with one API. Volumes
              and snapshots supported.
            </p>
          </motion.div>

          {/* One binding */}
          <motion.div
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-foreground/15 hover:bg-muted/30 sm:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.12 }}
          >
            <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/50 text-foreground">
              <KeyRound className="size-6" />
            </div>
            <h3 className="mt-4 font-mono text-lg font-semibold tracking-tight text-foreground">
              One binding
            </h3>
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
              One API key unlocks gateway, tools, MCP, vector store, database, object storage, and
              app deployment. No fragmented dashboards.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
