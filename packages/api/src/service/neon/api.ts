import type { DatabaseEndpointStatsChartPoint, DatabaseEndpointStatsGrouping } from '../../types'
import type { Api } from '@neondatabase/api-client'

/** Response shape for GET /projects/branches/count */
export interface ProjectsBranchesCountResponse {
  projects: Record<string, { count: number }>
}

/** Supported metric names for endpoint stats */
export type EndpointStatsMetric = 'cpu_provisioned_cores' | 'ram_consumed_bytes'

export interface EndpointStatsRequest {
  from: string
  to: string
  grouping: DatabaseEndpointStatsGrouping
  metrics: EndpointStatsMetric[]
}

/** Raw Neon response for endpoint stats */
export interface EndpointStatsResponse {
  data: {
    metric: string
    values: (number | null)[]
    labels: Record<string, string>
  }[]
  timestamps: number[]
}

const BRANCH_COUNT_BATCH_SIZE = 100

const DEFAULT_ENDPOINT_STATS_METRICS: EndpointStatsMetric[] = [
  'cpu_provisioned_cores',
  'ram_consumed_bytes',
]

/**
 * Returns branch counts for the given Neon project IDs.
 * Batches requests when many project IDs are provided.
 */
export async function countProjectsBranches(
  client: Api<unknown>,
  projectIds: string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  if (projectIds.length === 0) {
    return counts
  }

  for (let i = 0; i < projectIds.length; i += BRANCH_COUNT_BATCH_SIZE) {
    const batch = projectIds.slice(i, i + BRANCH_COUNT_BATCH_SIZE)
    const res = await client.request<ProjectsBranchesCountResponse>({
      path: '/projects/branches/count',
      method: 'GET',
      query: { project_ids: batch.join(',') },
      secure: true,
      format: 'json',
    })

    for (const [projectId, entry] of Object.entries(res.data.projects)) {
      counts[projectId] = entry.count
    }
  }

  return counts
}

/**
 * Fetches time-series stats for a compute endpoint (Neon console monitoring API).
 */
export async function getEndpointStats(
  client: Api<unknown>,
  projectId: string,
  endpointId: string,
  body: EndpointStatsRequest,
): Promise<EndpointStatsResponse> {
  const res = await client.request<EndpointStatsResponse>({
    path: `/projects/${projectId}/endpoints/${endpointId}/stats`,
    method: 'POST',
    body: {
      from: body.from,
      to: body.to,
      grouping: body.grouping,
      metrics: body.metrics.length > 0 ? body.metrics : DEFAULT_ENDPOINT_STATS_METRICS,
    },
    secure: true,
    format: 'json',
  })

  return res.data
}

/**
 * Merges Neon endpoint stats series into chart-ready points.
 */
export function formatEndpointStatsChart(
  response: EndpointStatsResponse,
): DatabaseEndpointStatsChartPoint[] {
  const { timestamps, data } = response
  const cpuSeries = data.find((s) => s.metric === 'cpu_provisioned_cores')
  const ramSeries = data.find((s) => s.metric === 'ram_consumed_bytes')

  return timestamps.map((timestamp, index) => {
    const allocatedCu = cpuSeries?.values[index] ?? undefined
    const ramBytes = ramSeries?.values[index] ?? undefined
    const inactive = allocatedCu == null

    return {
      timestamp: new Date(timestamp * 1000),
      allocatedCu,
      ramBytes,
      inactive,
    }
  })
}
