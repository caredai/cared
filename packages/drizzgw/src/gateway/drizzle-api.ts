import { v7 as uuidv7 } from 'uuid'

export interface ConnectionUri {
  name: string
  url: string
}

interface DrizzleGatewayResponse<T> {
  success: boolean
  data?: T
}

export interface DrizzleSlotSummary {
  id: string
  name: string
  dialect: string
}

export interface DrizzleSlotDetails extends DrizzleSlotSummary {
  credentials: {
    url: string
  }
}

/**
 * Low-level JSON POST to a Drizzle Gateway pod.
 */
export async function callDrizzleGateway<T>(
  baseUrl: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Drizzle Gateway request failed: ${response.status} ${response.statusText}`)
  }

  const payload = (await response.json()) as DrizzleGatewayResponse<T>
  if (!payload.success) {
    throw new Error('Drizzle Gateway returned success=false')
  }

  return payload.data as T
}

export async function initGateway(baseUrl: string) {
  return callDrizzleGateway(baseUrl, { type: 'init' })
}

export async function listSlots(baseUrl: string) {
  return callDrizzleGateway<DrizzleSlotSummary[]>(baseUrl, { type: 'slots' })
}

export async function getSlot(baseUrl: string, id: string) {
  return callDrizzleGateway<DrizzleSlotDetails>(baseUrl, {
    type: 'slots:get',
    data: { id },
  })
}

export async function syncSlot(baseUrl: string, connection: ConnectionUri) {
  await callDrizzleGateway(baseUrl, {
    type: 'slots:sync',
    data: {
      slot: {
        id: uuidv7(),
        name: connection.name,
        dialect: 'postgresql',
        credentials: { url: connection.url },
      },
    },
  })
}

export async function deleteSlot(baseUrl: string, id: string) {
  await callDrizzleGateway(baseUrl, {
    type: 'slots:delete',
    data: { id },
  })
}

/**
 * Reads configured slot URLs keyed by database name.
 */
export async function listSlotConnections(baseUrl: string): Promise<ConnectionUri[]> {
  const slots = await listSlots(baseUrl)
  const connections: ConnectionUri[] = []

  for (const slot of slots) {
    const details = await getSlot(baseUrl, slot.id)
    connections.push({
      name: details.name,
      url: details.credentials.url,
    })
  }

  return connections
}

function connectionUriEqual(a: ConnectionUri, b: ConnectionUri) {
  return a.name === b.name && a.url === b.url
}

/**
 * Returns the first index where expected and actual differ, or null when equal.
 */
export function findConnectionDivergenceIndex(
  expected: ConnectionUri[],
  actual: ConnectionUri[],
): number | null {
  const sharedLength = Math.min(expected.length, actual.length)
  for (let i = 0; i < sharedLength; i++) {
    const expectedConn = expected[i]
    const actualConn = actual[i]
    if (
      expectedConn === undefined ||
      actualConn === undefined ||
      !connectionUriEqual(expectedConn, actualConn)
    ) {
      return i
    }
  }
  if (expected.length === actual.length) {
    return null
  }
  return sharedLength
}

export function connectionsEqual(a: ConnectionUri[], b: ConnectionUri[]) {
  return findConnectionDivergenceIndex(a, b) === null
}

/**
 * Keeps slots before divergenceIndex, removes the rest, then appends expected tail.
 */
export async function syncSlotsFromDivergence(
  baseUrl: string,
  expected: ConnectionUri[],
  divergenceIndex: number,
) {
  const slots = await listSlots(baseUrl)

  for (const slot of slots.slice(divergenceIndex)) {
    await deleteSlot(baseUrl, slot.id)
  }

  for (const connection of expected.slice(divergenceIndex)) {
    await syncSlot(baseUrl, connection)
  }
}

/**
 * Replaces all Drizzle Gateway slots with the given connections.
 */
export async function replaceAllSlots(baseUrl: string, connections: ConnectionUri[]) {
  const existing = await listSlots(baseUrl)
  for (const slot of existing) {
    await deleteSlot(baseUrl, slot.id)
  }

  for (const connection of connections) {
    await syncSlot(baseUrl, connection)
  }
}
