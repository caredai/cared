import { useId, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  ReferenceArea,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { DatabaseEndpointStatsChartPoint } from '@cared/api/types'
import { ChartContainer } from '@cared/ui/components/chart'
import { cn } from '@cared/ui/lib/utils'

interface EndpointMonitoringChartProps {
  points: DatabaseEndpointStatsChartPoint[]
  className?: string
}

interface ChartRow {
  time: number
  allocatedCu: number | null
  ramBytes: number | null
  /** Null buckets filled with 0 so the RAM curve stays continuous. */
  ramGb: number
  inactive: boolean
}

interface InactiveRange {
  start: number
  end: number
}

const RAM_COLOR = 'hsl(174 58% 42%)'
const CU_COLOR = 'hsl(220 9% 52%)'

/** Converts `hsl(H S% L%)` → `hsl(H S% L% / alpha)` for use in inline CSS. */
function withAlpha(hslColor: string, alpha: number): string {
  return hslColor.replace(/\)$/, ` / ${alpha})`)
}

function formatRam(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function findInactiveRanges(rows: ChartRow[]): InactiveRange[] {
  const ranges: InactiveRange[] = []
  let start: number | null = null
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row == null) continue
    if (row.inactive) {
      if (start == null) {
        // Start at the previous row's time so the inactive region begins
        // exactly where the last active CU bar ends ([T-1, T] bars end at T).
        start = rows[i - 1]?.time ?? row.time
      }
    } else if (start != null) {
      // End at the previous (last inactive) row's time so the inactive region
      // ends exactly where the next active CU bar begins.
      ranges.push({ start, end: rows[i - 1]?.time ?? row.time })
      start = null
    }
  }
  const last = rows.at(-1)
  if (start != null && last) ranges.push({ start, end: last.time })
  return ranges
}

function computeCuTicks(maxCu: number): number[] {
  if (maxCu <= 0.25) return [0, 0.25]
  if (maxCu <= 0.5) return [0, 0.25, 0.5]
  if (maxCu <= 1) return [0, 0.5, 1]
  const step = maxCu <= 4 ? 1 : 2
  const ticks: number[] = []
  for (let v = 0; v <= maxCu; v += step) ticks.push(v)
  const last = ticks.at(-1)
  if (last !== undefined && last !== maxCu) ticks.push(Math.ceil(maxCu))
  return ticks
}

function computeRamTicks(maxGb: number): number[] {
  if (maxGb <= 1) return [0, 1]
  if (maxGb <= 2) return [0, 1, 2]
  if (maxGb <= 4) return [0, 2, 4]
  const step = maxGb <= 8 ? 2 : 4
  const ticks: number[] = []
  for (let v = 0; v <= maxGb; v += step) ticks.push(v)
  const last = ticks.at(-1)
  if (last !== undefined && last < maxGb) ticks.push(Math.ceil(maxGb))
  return ticks
}

// ─── recharts internal types exposed via Customized ──────────────────────────

interface AxisObject {
  scale: (v: number) => number
}

interface ChartOffset {
  left: number
  top: number
  width: number
  height: number
}

interface ChartInternalProps {
  xAxisMap?: Record<string | number, AxisObject>
  yAxisMap?: Record<string | number, AxisObject>
  offset?: ChartOffset
}

// ─── Custom CU bar layer ──────────────────────────────────────────────────────

interface CuBarsLayerProps extends ChartInternalProps {
  rows: ChartRow[]
  gradientId: string
  clipId: string
  visible: boolean
}

/**
 * Renders CU as native SVG <rect> elements.
 *
 * Each bar spans the full interval [T-1, T] where T is the timestamp of the
 * data point.  Because every time bucket is present in `rows` (inactive ones
 * have allocatedCu=null), rows[i-1] always gives the correct left boundary.
 */
function CuBarsLayer({
  xAxisMap,
  yAxisMap,
  offset,
  rows,
  gradientId,
  clipId,
  visible,
}: CuBarsLayerProps): React.ReactNode | null {
  if (!visible) return null

  const xScale = xAxisMap ? Object.values(xAxisMap)[0]?.scale : undefined
  // Prefer the axis registered as "cu"; fall back to the first y-axis.
  const yScale: ((v: number) => number) | undefined =
    yAxisMap?.cu?.scale ?? Object.values(yAxisMap ?? {})[0]?.scale

  if (!xScale || !yScale || !offset) return null

  const baseline = yScale(0) // SVG y of the y=0 line (bottom of bars)

  // Default bar width: one time-bucket interval in pixels.
  const firstRow = rows[0]
  const secondRow = rows[1]
  const defaultWidthPx =
    firstRow != null && secondRow != null
      ? Math.abs(xScale(secondRow.time) - xScale(firstRow.time))
      : 10

  const rects: React.ReactNode[] = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row == null) continue
    if (row.allocatedCu == null) continue

    const x2 = xScale(row.time) // right edge: current data point
    const prevRow = rows[i - 1]
    const x1 = prevRow != null ? xScale(prevRow.time) : x2 - defaultWidthPx // left edge

    const barTop = yScale(row.allocatedCu) // SVG y of bar top
    const barH = baseline - barTop // height in pixels (always positive)

    if (barH > 0 && Math.abs(x2 - x1) > 0) {
      rects.push(
        <rect
          key={row.time}
          x={Math.min(x1, x2)}
          y={barTop}
          width={Math.abs(x2 - x1)}
          height={barH}
          fill={`url(#${gradientId})`}
          stroke={CU_COLOR}
          strokeWidth={0.5}
          strokeOpacity={0.3}
        />,
      )
    }
  }

  if (rects.length === 0) return null

  return (
    <g>
      {/* Clip bars to the chart data area so they never overlap axis labels */}
      <defs>
        <clipPath id={clipId}>
          <rect x={offset.left} y={offset.top} width={offset.width} height={offset.height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{rects}</g>
    </g>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function MonitoringTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { payload: ChartRow }[]
  label?: number
}) {
  if (!active || !payload?.length || label == null) return null
  const row = payload[0]?.payload
  if (!row) return null

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md min-w-[168px]">
      <p className="mb-1.5 text-[11px] text-muted-foreground">
        {format(new Date(label), 'MMM d, yyyy h:mm a')}
      </p>
      {row.inactive ? (
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 shrink-0"
            style={{
              backgroundImage: `repeating-linear-gradient(-45deg, ${withAlpha(CU_COLOR, 0.5)} 0, ${withAlpha(CU_COLOR, 0.5)} 1px, transparent 1px, transparent 4px)`,
            }}
          />
          <span className="text-muted-foreground">Endpoint Inactive</span>
        </div>
      ) : (
        <div className="space-y-1">
          {row.allocatedCu != null && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 shrink-0"
                  style={{
                    background: `linear-gradient(to top, white, ${withAlpha(CU_COLOR, 0.73)})`,
                    borderColor: withAlpha(CU_COLOR, 0.33),
                  }}
                />
                <span className="text-muted-foreground">Allocated CU</span>
              </div>
              <span className="font-mono font-medium tabular-nums">{row.allocatedCu}</span>
            </div>
          )}
          {row.ramBytes != null && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 shrink-0" style={{ backgroundColor: RAM_COLOR }} />
                <span className="text-muted-foreground">RAM Usage</span>
              </div>
              <span className="font-mono font-medium tabular-nums">{formatRam(row.ramBytes)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EndpointMonitoringChart({ points, className }: EndpointMonitoringChartProps) {
  const gradientId = useId()
  const patternId = useId()
  const clipId = useId()

  const [showCu, setShowCu] = useState(true)
  const [showRam, setShowRam] = useState(true)
  const [showInactive, setShowInactive] = useState(true)

  const rows = useMemo<ChartRow[]>(
    () =>
      points.map((p) => ({
        time: p.timestamp.getTime(),
        allocatedCu: p.allocatedCu ?? null,
        ramBytes: p.ramBytes ?? null,
        ramGb: p.ramBytes != null ? p.ramBytes / 1_073_741_824 : 0,
        inactive: p.inactive,
      })),
    [points],
  )

  const hasData = rows.some((r) => r.allocatedCu != null || r.ramBytes != null)

  const { cuMax, ramMaxGb, inactiveRanges, cuTicks, ramTicks } = useMemo(() => {
    const cuVals = rows.map((r) => r.allocatedCu).filter((v): v is number => v != null)
    const ramVals = rows.map((r) => r.ramGb)
    const maxCu = Math.max(0.25, ...(cuVals.length ? cuVals : [0.25]))
    const maxRam = Math.max(1, ...(ramVals.length ? ramVals : [1]))
    return {
      cuMax: maxCu * 1.2,
      ramMaxGb: maxRam * 1.2,
      inactiveRanges: findInactiveRanges(rows),
      cuTicks: computeCuTicks(maxCu),
      ramTicks: computeRamTicks(maxRam),
    }
  }, [rows])

  if (!hasData) return null

  return (
    <div className={cn('space-y-3', className)}>
      {/*
       * Outer padding reserves horizontal space for the axis labels.
       * The labels are absolutely positioned outside the ChartContainer SVG
       * so they sit right alongside the axis tick numbers.
       */}
      <div className="relative pl-[18px] pr-[22px]">
        {/* Left Y-axis label "CU" — reads bottom-to-top */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center"
          style={{ width: 18, paddingBottom: 20 }}
        >
          <span
            className="whitespace-nowrap text-[11px] text-muted-foreground"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            CU
          </span>
        </div>

        <ChartContainer
          config={{
            allocatedCu: { label: 'Allocated CU', color: CU_COLOR },
            ramGb: { label: 'RAM Usage', color: RAM_COLOR },
          }}
          className="h-[260px] w-full aspect-auto"
        >
          <ComposedChart data={rows} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <defs>
              {/* CU gradient: white at the bar bottom → gray at the bar top */}
              <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity={0.85} />
                <stop offset="100%" stopColor={CU_COLOR} stopOpacity={0.6} />
              </linearGradient>

              {/* Diagonal hatching for inactive time buckets */}
              <pattern
                id={patternId}
                patternUnits="userSpaceOnUse"
                width="6"
                height="6"
                patternTransform="rotate(45)"
              >
                <line x1="0" y1="0" x2="0" y2="6" className="stroke-border" strokeWidth="3" />
              </pattern>
            </defs>

            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />

            {showInactive &&
              inactiveRanges.map((range) => (
                <ReferenceArea
                  key={`${range.start}-${range.end}`}
                  x1={range.start}
                  x2={range.end}
                  y1={0}
                  y2={cuMax}
                  yAxisId="cu"
                  fill={`url(#${patternId})`}
                  fillOpacity={0.65}
                  strokeOpacity={0}
                  ifOverflow="extendDomain"
                />
              ))}

            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={48}
              tickFormatter={(v: number) => format(new Date(v), 'h:mm a')}
              className="text-[11px]"
            />

            <YAxis
              yAxisId="cu"
              orientation="left"
              domain={[0, cuMax]}
              ticks={cuTicks}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={36}
              tickFormatter={(v: number) => String(v)}
              className="text-[11px]"
            />

            <YAxis
              yAxisId="ram"
              orientation="right"
              domain={[0, ramMaxGb]}
              ticks={ramTicks}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={36}
              tickFormatter={(v: number) => String(v)}
              className="text-[11px]"
            />

            <Tooltip
              cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, fill: 'none' }}
              content={<MonitoringTooltip />}
              isAnimationActive={false}
            />

            {/*
             * CU bars: drawn as native <rect> elements via Customized so that
             * each bar precisely occupies the interval [T-1, T].
             * The gradient and clip-path are also defined here (same SVG).
             */}
            <Customized
              component={(chartProps: Record<string, unknown>) => (
                <CuBarsLayer
                  xAxisMap={chartProps.xAxisMap as ChartInternalProps['xAxisMap']}
                  yAxisMap={chartProps.yAxisMap as ChartInternalProps['yAxisMap']}
                  offset={chartProps.offset as ChartInternalProps['offset']}
                  rows={rows}
                  gradientId={gradientId}
                  clipId={clipId}
                  visible={showCu}
                />
              )}
            />

            {/* RAM: smooth monotone line, strokeWidth=1 */}
            {showRam && (
              <Line
                yAxisId="ram"
                type="monotone"
                dataKey="ramGb"
                stroke={RAM_COLOR}
                strokeWidth={1}
                dot={false}
                activeDot={{ r: 3, fill: RAM_COLOR, stroke: 'var(--background)', strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ChartContainer>

        {/* Right Y-axis label "RAM (GB)" — reads bottom-to-top */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center"
          style={{ width: 22, paddingBottom: 20 }}
        >
          <span
            className="whitespace-nowrap text-[11px] text-muted-foreground"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            RAM (GB)
          </span>
        </div>
      </div>

      {/* Legend toggle buttons — always square icons */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <LegendToggle
          active={showInactive}
          onToggle={() => setShowInactive((v) => !v)}
          type="inactive"
          label="Endpoint Inactive"
        />
        <LegendToggle
          active={showCu}
          onToggle={() => setShowCu((v) => !v)}
          type="bar"
          color={CU_COLOR}
          label="Allocated CU"
        />
        <LegendToggle
          active={showRam}
          onToggle={() => setShowRam((v) => !v)}
          type="line"
          color={RAM_COLOR}
          label="RAM Usage"
        />
      </div>
    </div>
  )
}

// ─── Legend toggle button ─────────────────────────────────────────────────────

/**
 * A clickable legend item.
 * - ON : small square filled with the series' representative colour.
 * - OFF: small square filled with a neutral gray.
 * Both states always show the same square shape.
 */
function LegendToggle({
  active,
  onToggle,
  type,
  color,
  label,
}: {
  active: boolean
  onToggle: () => void
  type: 'inactive' | 'bar' | 'line'
  color?: string
  label: string
}) {
  const squareStyle: React.CSSProperties = active
    ? type === 'inactive'
      ? {
          // Use CU_COLOR-toned stripes so the inactive region matches the chart
          backgroundImage: `repeating-linear-gradient(-45deg, ${withAlpha(CU_COLOR, 0.5)} 0, ${withAlpha(CU_COLOR, 0.5)} 1px, transparent 1px, transparent 4px)`,
        }
      : type === 'bar'
        ? {
            background: `linear-gradient(to top, white 0%, ${withAlpha(color ?? CU_COLOR, 0.6)} 100%)`,
          }
        : {
            backgroundColor: color,
          }
    : {
        backgroundColor: 'hsl(var(--muted))',
        border: '1px solid hsl(var(--border))',
      }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex cursor-pointer select-none items-center gap-1.5 text-xs transition-opacity',
        active ? 'text-muted-foreground' : 'text-muted-foreground/40',
      )}
    >
      {/* Always a 12×12 square — colour changes based on active state */}
      <span className="h-3 w-3 shrink-0" style={squareStyle} />
      <span>{label}</span>
    </button>
  )
}
