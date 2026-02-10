import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { BatchLinkPlugin } from '@orpc/client/plugins'
import { ORPCError } from '@orpc/server'
import { nanoid } from 'nanoid'

import type { AppRouter } from '@cared/redgw'
import { and, asc, eq, gt } from '@cared/db'
import { db } from '@cared/db/client'
import { Graph } from '@cared/db/schema'

import type { RouterClient } from '@orpc/server'
import { env } from '../env'

export class GraphService {
  static #redgw: RouterClient<AppRouter> | undefined

  get client(): RouterClient<AppRouter> {
    GraphService.#redgw ??= (() => {
      const link = new RPCLink({
        url: () => {
          return `${env.REDGW_API_URL}/rpc`
        },
        headers: () => ({
          Authorization: `Bearer ${env.REDGW_API_KEY}`,
        }),
        plugins: [
          new BatchLinkPlugin({
            groups: [
              {
                condition: () => true,
                context: {},
              },
            ],
          }),
        ],
      })

      return createORPCClient<RouterClient<AppRouter>>(link)
    })()

    return GraphService.#redgw
  }

  /**
   * Get a graph by name and accountId.
   * @param name - The graph name
   * @param accountId - The account ID
   * @returns The graph if found
   * @throws {ORPCError} If graph not found
   */
  async getGraphByName(name: string, accountId: string): Promise<Graph> {
    const graph = await db.query.Graph.findFirst({
      where: and(eq(Graph.name, name), eq(Graph.accountId, accountId)),
    })

    if (!graph) {
      throw new ORPCError('NOT_FOUND', {
        message: `Graph with name ${name} not found`,
      })
    }

    return graph
  }

  /**
   * Generate a unique graph key using nanoid.
   * @returns A unique graph key
   */
  async generateUniqueKey(): Promise<string> {
    let key: string
    let attempts = 0
    const maxAttempts = 10

    do {
      key = nanoid(12)
      const existing = await db.query.Graph.findFirst({
        where: eq(Graph.key, key),
      })

      if (!existing) {
        return key
      }

      attempts++
    } while (attempts < maxAttempts)

    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Failed to generate unique graph key after multiple attempts',
    })
  }

  /**
   * Create a new graph.
   * @param name - The graph name
   * @param accountId - The account ID
   * @returns The created graph
   */
  async createGraph(name: string, accountId: string): Promise<Graph> {
    // Check if name already exists for this account
    const existing = await db.query.Graph.findFirst({
      where: and(eq(Graph.name, name), eq(Graph.accountId, accountId)),
    })

    if (existing) {
      throw new ORPCError('CONFLICT', {
        message: `Graph with name ${name} already exists for this account`,
      })
    }

    // Generate unique key
    const key = await this.generateUniqueKey()

    // Create graph in database
    const [graph] = await db
      .insert(Graph)
      .values({
        name,
        key,
        mode: 'public', // TODO
        accountId,
      })
      .returning()

    if (!graph) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to create graph',
      })
    }

    return graph
  }

  /**
   * List all graphs for an account.
   * @param accountId - The account ID
   * @param opts
   * @returns Array of graphs
   */
  async listGraphs(
    accountId: string,
    { limit = 20, cursor }: { limit?: number; cursor?: string },
  ): Promise<{ graphs: Graph[]; hasMore: boolean; cursor?: string }> {
    const graphs = await db.query.Graph.findMany({
      where: and(eq(Graph.accountId, accountId), cursor ? gt(Graph.id, cursor) : undefined),
      orderBy: asc(Graph.id),
      limit: limit + 1,
    })
    const hasMore = graphs.length > limit
    if (hasMore) {
      graphs.pop()
    }
    return {
      graphs,
      hasMore,
      cursor: graphs.at(-1)?.id,
    }
  }

  /**
   * Delete a graph by name.
   * @param name - The graph name
   * @param accountId - The account ID
   */
  async deleteGraphByName(name: string, accountId: string): Promise<void> {
    const graph = await this.getGraphByName(name, accountId)

    // Delete from redgw first
    // TODO: dispatch to temporal
    await this.client.graph.delete({ graph: graph.key })

    // Delete from database
    await db.delete(Graph).where(eq(Graph.id, graph.id))
  }
}

export const graphService = new GraphService()
