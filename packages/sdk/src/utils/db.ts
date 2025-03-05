import { sql } from 'drizzle-orm'
import { index, timestamp } from 'drizzle-orm/pg-core'
import { v7 } from 'uuid'
import { z } from 'zod'

export function generateId(prefix: string) {
  const uuid = v7() // time based, monotonically increasing order
  return `${prefix}_${uuid.replaceAll('-', '')}`
}

const idRe = /^[0-9a-f]{8}[0-9a-f]{4}7[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/i

// Reference: https://gist.github.com/robinpokorny/3e1ef5eebce096824d3c2054202e4217
export function parseTimestampFromId(id: string) {
  const id_ = id.split('_')[1]
  if (!id_ || !idRe.test(id_)) {
    throw new Error(`Invalid ID format: should be UUID v7 (with '-' removed)`)
  }
  return Number.parseInt(id_.slice(0, 12), 16) // Unix timestamp in milliseconds
}

export function makeIdValid(prefix: string) {
  return z.string().superRefine((id, ctx) => {
    const prefix_ = id.split('_')[0]
    if (prefix_ !== prefix) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid ID prefix: should be '${prefix}_'`,
      })
      return z.NEVER
    }
    const timestamp = parseTimestampFromId(id)
    if (Math.abs(Date.now() - timestamp) > 1000 * 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid ID timestamp: should be within 10 seconds of current time',
      })
    }
  })
}

export function makeObjectNonempty<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.partial().refine((obj) => Object.keys(obj).length > 0, 'Object must not be empty')
}

export const createdAt = timestamp({ mode: 'date' }).notNull().defaultNow()
export const updatedAt = timestamp({ mode: 'date' })
  .notNull()
  .defaultNow()
  .$onUpdateFn(() => sql`now()`)
export const timestamps = {
  createdAt,
  updatedAt,
}
export const timestampsIndices = (table: any) => [
  index().on(table.createdAt),
  index().on(table.updatedAt),
]
export const timestampsOmits = { createdAt: true as const, updatedAt: true as const }
