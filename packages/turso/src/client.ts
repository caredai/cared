import { createClient } from '@libsql/client/web'
import { drizzle } from 'drizzle-orm/libsql'

import { env } from './env'
import * as schema from './schema'

interface CreateDatabaseResponse {
  database: {
    DbId: string
    Hostname: string
    Name: string
  }
}

interface CreateDatabaseError {
  error: string
}

/**
 * Create a new database in Turso
 * @param name - Database name (lowercase letters, numbers, dashes, max 64 chars)
 * @param group - Group name where the database should be created
 * @returns Created database information
 */
export async function createDb({
  name,
  group,
}: {
  name: string
  group: string
}): Promise<CreateDatabaseResponse['database']> {
  const url = `https://api.turso.tech/v1/organizations/${env.TURSO_ORGANIZATION}/databases`

  const token = getToken(group)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      group,
    }),
  })

  if (!response.ok) {
    let errorMessage = response.statusText
    try {
      const errorData = (await response.json()) as CreateDatabaseError
      if (errorData.error) {
        errorMessage = errorData.error
      }
    } catch {
      // If JSON parsing fails, use statusText
    }
    throw new Error(`Failed to create database: ${errorMessage}`)
  }

  const data = (await response.json()) as CreateDatabaseResponse
  return data.database
}

export function getDb({ url, group }: { url: string; group: string }) {
  const token = getToken(group)
  const client = createClient({
    url,
    authToken: token,
  })
  return drizzle({ client, schema, casing: 'camelCase', logger: env.NODE_ENV === 'development' })
}

export type Db = ReturnType<typeof getDb>

function getToken(group: string) {
  const token = env.TURSO_GROUP_TOKENS[group]
  if (!token) {
    throw new Error(`No token found for group '${group}'`)
  }
  return token
}
