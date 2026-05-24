import { useMemo } from 'react'
import { format } from 'date-fns'
import { CartesianGrid, ComposedChart, Line, ReferenceArea, Tooltip, XAxis, YAxis } from 'recharts'

import type { RouterOutputs } from '@cared/api'
import type { ChartConfig } from '@cared/ui/components/chart'
import { ChartContainer, ChartTooltipContent } from '@cared/ui/components/chart'
import { cn } from '@cared/ui/lib/utils'

type EndpointStatsPoint = RouterOutputs['account']['database']['getEndpointStats']['points'][number]

interface EndpointMonitoringChartProps {
  points: EndpointStatsPoint[]
  className?: string
}

interface ChartRow {
  timestamp: Date
  time: number
  allocatedCu?: number
  ramBytes?: number
  ramGb?: number
  inactive: boolean
}

interface InactiveRange {
  start: number
  end: number
}

const chartConfig = {
  allocatedCu: {
    label: 'Allocated CU',
    color: 'hsl(var(--muted-foreground))',
  },
  ramGb: {
    label: 'RAM usage',
    color: 'hsl(174 58% 42%)',
  },
  inactive: {
    label: 'Endpoint inactive',
    color: 'hsl(var(--muted))',
  },
} satisfies ChartConfig

function formatRamTooltip(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function findInactiveRanges(rows: ChartRow[]): InactiveRange[] {
  const ranges: InactiveRange[] = []
  let start: number | null = null

  for (const row of rows) {
    if (row.inactive) {
      if (start == null) start = row.time
    } else if (start != null) {
      ranges.push({ start, end: row.time })
      start = null
    }
  }

  const lastRow = rows.at(-1)
  if (start != null && lastRow) {
    ranges.push({ start, end: lastRow.time })
  }

  return ranges
}

function computeCuTicks(maxCu: number): number[] {
  if (maxCu <= 0.25) return [0, 0.25]
  if (maxCu <= 0.5) return [0, 0.25, 0.5]
  if (maxCu <= 1) return [0, 0.5, 1]
  const step = maxCu <= 4 ? 1 : 2
  const ticks: number[] = []
  for (let v = 0; v <= maxCu; v += step) ticks.push(v)
  const lastCuTick = ticks.at(-1)
  if (lastCuTick !== undefined && lastCuTick !== maxCu) ticks.push(Math.ceil(maxCu))
  return ticks
}

function computeRamTicks(maxGb: number): number[] {
  if (maxGb <= 1) return [0, 1]
  if (maxGb <= 2) return [0, 1, 2]
  if (maxGb <= 4) return [0, 2, 4]
  const step = maxGb <= 8 ? 2 : 4
  const ticks: number[] = []
  for (let v = 0; v <= maxGb; v += step) ticks.push(v)
  const lastTick = ticks.at(-1)
  if (lastTick !== undefined && lastTick < maxGb) ticks.push(Math.ceil(maxGb))
  return ticks
}

export function EndpointMonitoringChart({ points, className }: EndpointMonitoringChartProps) {
  const rows = useMemo<ChartRow[]>(
    () =>
      points.map((p) => ({
        timestamp: p.timestamp,
        time: p.timestamp.getTime(),
        allocatedCu: p.allocatedCu,
        ramBytes: p.ramBytes,
        ramGb: p.ramBytes != null ? p.ramBytes / 1_073_741_824 : undefined,
        inactive: p.inactive,
      })),
    [points],
  )

  const hasData = rows.some((r) => r.allocatedCu != null || r.ramBytes != null)

  const { cuMax, ramMaxGb, inactiveRanges, cuTicks, ramTicks } = useMemo(() => {
    const cuValues = rows.map((r) => r.allocatedCu).filter((v): v is number => v != null)
    const ramValues = rows.map((r) => r.ramGb).filter((v): v is number => v != null)

    const maxCu = Math.max(0.25, ...(cuValues.length ? cuValues : [0.25]))
    const maxRam = Math.max(1, ...(ramValues.length ? ramValues : [1]))

    return {
      cuMax: maxCu * 1.15,
      ramMaxGb: maxRam * 1.15,
      inactiveRanges: findInactiveRanges(rows),
      cuTicks: computeCuTicks(maxCu),
      ramTicks: computeRamTicks(maxRam),
    }
  }, [rows])

  if (!hasData) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      <ChartContainer config={chartConfig} className="h-[280px] w-full aspect-auto">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <pattern
              id="endpointInactivePattern"
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="6" className="stroke-border" strokeWidth="3" />
            </pattern>
          </defs>

          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />

          {inactiveRanges.map((range) => (
            <ReferenceArea
              key={`${range.start}-${range.end}`}
              x1={range.start}
              x2={range.end}
              y1={0}
              y2={cuMax}
              yAxisId="cu"
              fill="url(#endpointInactivePattern)"
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
            tickFormatter={(value: number) => format(new Date(value), 'h:mm a')}
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
          />

          <YAxis
            yAxisId="ram"
            orientation="right"
            domain={[0, ramMaxGb]}
            ticks={ramTicks}
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            width={28}
            tickFormatter={(v: number) => String(v)}
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length || label == null) return null
              const row = payload[0]?.payload as ChartRow | undefined
              if (!row) return null

              return (
                <ChartTooltipContent
                  active={active}
                  payload={[
                    {
                      name: 'allocatedCu',
                      value: row.allocatedCu ?? 0,
                      dataKey: 'allocatedCu',
                      color: chartConfig.allocatedCu.color,
                      payload: row,
                    },
                    ...(row.ramBytes != null
                      ? [
                          {
                            name: 'ramGb',
                            value: row.ramBytes,
                            dataKey: 'ramGb',
                            color: chartConfig.ramGb.color,
                            payload: row,
                          },
                        ]
                      : []),
                  ]}
                  label={format(new Date(label), 'MMM d, yyyy hh:mm:ss a')}
                  formatter={(value, name) => {
                    if (name === 'allocatedCu') {
                      return <span className="font-mono font-medium">{row.allocatedCu ?? '—'}</span>
                    }
                    if (name === 'ramGb' && typeof value === 'number') {
                      return (
                        <span className="font-mono font-medium">{formatRamTooltip(value)}</span>
                      )
                    }
                    return null
                  }}
                />
              )
            }}
          />

          <Line
            yAxisId="cu"
            type="stepAfter"
            dataKey="allocatedCu"
            stroke="var(--color-allocatedCu)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />

          <Line
            yAxisId="ram"
            type="monotone"
            dataKey="ramGb"
            stroke="var(--color-ramGb)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <LegendItem pattern="inactive" label="Endpoint inactive" />
        <LegendItem dashed color="var(--color-allocatedCu)" label="Allocated CU" />
        <LegendItem color="var(--color-ramGb)" label="RAM usage" />
      </div>
    </div>
  )
}

function LegendItem({
  label,
  color,
  dashed,
  pattern,
}: {
  label: string
  color?: string
  dashed?: boolean
  pattern?: 'inactive'
}) {
  return (
    <div className="flex items-center gap-2">
      {pattern === 'inactive' ? (
        <span
          className="h-3 w-5 rounded-sm border border-border"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, hsl(var(--border)) 0, hsl(var(--border)) 1px, transparent 1px, transparent 4px)',
          }}
        />
      ) : (
        <span
          className="h-0.5 w-5 rounded-full"
          style={{
            backgroundColor: dashed ? 'transparent' : color,
            borderTop: dashed ? `2px dashed ${color}` : undefined,
          }}
        />
      )}
      <span>{label}</span>
    </div>
  )
}
