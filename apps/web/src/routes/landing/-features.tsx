'use client'

import { motion } from 'motion/react'

const FEATURES = [
  {
    id: 'gateway',
    label: 'AI Gateway',
    desc: 'Unified model routing, keys, and usage.',
    icon: GatewayIcon,
  },
  {
    id: 'tools',
    label: 'Tools',
    desc: 'Custom tools and MCP integrations.',
    icon: ToolsIcon,
  },
  {
    id: 'sandbox',
    label: 'Sandboxes',
    desc: 'Ephemeral dev environments for agents.',
    icon: SandboxIcon,
  },
  {
    id: 'agents',
    label: 'Agents',
    desc: 'Flows and agent orchestration.',
    icon: AgentIcon,
  },
  {
    id: 'memory',
    label: 'Memory',
    desc: 'Conversation and context persistence.',
    icon: MemoryIcon,
  },
  {
    id: 'knowledge',
    label: 'Knowledge base',
    desc: 'Vector store and RAG datasets.',
    icon: KnowledgeIcon,
  },
  {
    id: 'app',
    label: 'App builder',
    desc: 'Build and deploy agent apps.',
    icon: AppIcon,
  },
  {
    id: 'auth',
    label: 'Auth',
    desc: 'OAuth apps, API keys, users.',
    icon: AuthIcon,
  },
  {
    id: 'database',
    label: 'Database',
    desc: 'Managed Postgres per account.',
    icon: DatabaseIcon,
  },
  {
    id: 'storage',
    label: 'Object storage',
    desc: 'Files and buckets for agents.',
    icon: StorageIcon,
  },
] as const

function GatewayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={true}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ToolsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={true}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function SandboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={true}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  )
}

function AgentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={true}>
      <path d="M12 8V4H8" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <path d="M6 18h4M15 18h3" />
      <path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
  )
}

function MemoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={true}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.27 6.96 8.73 5.05 8.73-5.05M12 22.08V12" />
    </svg>
  )
}

function KnowledgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={true}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </svg>
  )
}

function AppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={true}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

function AuthIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={true}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={true}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    </svg>
  )
}

function StorageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={true}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function LandingFeatures() {
  return (
    <section
      id="capabilities"
      className="border-b border-border bg-muted/10 px-4 py-24 sm:px-6 lg:px-8"
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
            Everything in one stack
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-sans text-muted-foreground">
            One account. One binding. All capabilities.
          </p>
        </motion.div>

        <ul className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.li
              key={feature.id}
              className="group rounded-2xl border border-border bg-card p-6 font-mono shadow-sm transition-all hover:border-foreground/15 hover:shadow-md"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.32) }}
            >
              <feature.icon className="size-6 text-foreground/80" />
              <h3 className="mt-3 text-sm font-semibold tracking-tight text-foreground">
                {feature.label}
              </h3>
              <p className="mt-1 font-sans text-xs text-muted-foreground">
                {feature.desc}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
