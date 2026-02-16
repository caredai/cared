'use client'

import { motion } from 'motion/react'

/**
 * SVG diagram: one binding (center) connecting to all capabilities (nodes).
 * Developer/geek style: clean lines, mono labels.
 */
export function LandingStackDiagram() {
  return (
    <section className="border-b border-border bg-background px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <motion.h2
          className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
        >
          One binding, all features
        </motion.h2>
        <motion.p
          className="mt-2 font-sans text-muted-foreground"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          Connect once. Use gateway, tools, sandboxes, agents, storage, and more.
        </motion.p>

        <motion.div
          className="mt-14 flex justify-center"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StackDiagramSvg />
        </motion.div>
      </div>
    </section>
  )
}

function StackDiagramSvg() {
  return (
    <svg
      viewBox="0 0 400 320"
      className="mx-auto w-full max-w-[400px] text-foreground"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Central node: Cared / one binding */}
      <g filter="url(#glow)">
        <rect
          x="140"
          y="130"
          width="100"
          height="60"
          rx="8"
          fill="var(--card)"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-foreground"
        />
        <text
          x="190"
          y="158"
          textAnchor="middle"
          className="fill-foreground font-mono text-[11px] font-semibold"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Cared
        </text>
        <text
          x="190"
          y="172"
          textAnchor="middle"
          className="fill-muted-foreground font-mono text-[9px]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          one binding
        </text>
      </g>

      {/* Top row: Gateway, Tools, Sandboxes */}
      <Line x1={190} y1={130} x2={70} y2={70} />
      <Line x1={190} y1={130} x2={190} y2={60} />
      <Line x1={190} y1={130} x2={310} y2={70} />

      <Node x={50} y={45} label="Gateway" />
      <Node x={175} y={35} label="Tools" />
      <Node x={305} y={45} label="Sandboxes" />

      {/* Bottom row: Agents, Storage, DB */}
      <Line x1={190} y1={190} x2={70} y2={250} />
      <Line x1={190} y1={190} x2={190} y2={265} />
      <Line x1={190} y1={190} x2={310} y2={250} />

      <Node x={50} y={275} label="Agents" />
      <Node x={175} y={280} label="Storage" />
      <Node x={295} y={275} label="Database" />

      {/* Left: Auth, Knowledge */}
      <Line x1={140} y1={160} x2={30} y2={130} />
      <Line x1={140} y1={160} x2={30} y2={190} />
      <Node x={10} y={120} label="Auth" small />
      <Node x={10} y={200} label="Knowledge" small />

      {/* Right: Apps, Memory */}
      <Line x1={240} y1={160} x2={350} y2={130} />
      <Line x1={240} y1={160} x2={350} y2={190} />
      <Node x={355} y={120} label="Apps" small />
      <Node x={355} y={200} label="Memory" small />
    </svg>
  )
}

function Line({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth="1"
      strokeOpacity="0.35"
      strokeDasharray="4 3"
    />
  )
}

function Node({
  x,
  y,
  label,
  small,
}: {
  x: number
  y: number
  label: string
  small?: boolean
}) {
  const w = small ? 52 : 64
  const h = small ? 22 : 28
  const rx = 6
  const px = x - w / 2
  const py = y - h / 2
  const fontSize = small ? 8 : 10
  return (
    <g>
      <rect
        x={px}
        y={py}
        width={w}
        height={h}
        rx={rx}
        fill="var(--muted)"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.5"
        className="text-foreground"
      />
      <text
        x={x}
        y={y + (small ? 1 : 2)}
        textAnchor="middle"
        className="fill-foreground"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize,
          fontWeight: 500,
        }}
      >
        {label}
      </text>
    </g>
  )
}
