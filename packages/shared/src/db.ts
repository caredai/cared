import { index, timestamp } from 'drizzle-orm/pg-core'
import { v7 } from 'uuid'
import { z } from 'zod/v4'

export function generateId(prefix: string, sep = '_') {
  const uuid = v7() // time based, monotonically increasing order
  return `${prefix}${sep}${uuid.replaceAll('-', '')}`
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
  return z.string().check((ctx) => {
    const prefix_ = ctx.value.split('_')[0]
    if (prefix_ !== prefix) {
      ctx.issues.push({
        code: 'custom',
        message: `Invalid ID prefix: should be '${prefix}_'`,
        input: ctx.value,
      })
      return z.NEVER
    }
    const timestamp = parseTimestampFromId(ctx.value)
    if (timestamp - Date.now() > 1000 * 10) {
      ctx.issues.push({
        code: 'custom',
        message: 'Invalid ID timestamp: should be within 10 seconds of current time',
        input: ctx.value,
      })
    }
  })
}

export function makeObjectNonempty<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.partial().refine((obj) => Object.keys(obj).length > 0, 'Object must not be empty')
}

export const createdAt = timestamp({
  mode: 'date',
  withTimezone: true,
})
  .notNull()
  .defaultNow()
export const updatedAt = timestamp({
  mode: 'date',
  withTimezone: true,
})
  .notNull()
  .defaultNow()
  .$onUpdateFn(() => new Date())
export const timestamps = {
  createdAt,
  updatedAt,
}
export const timestampsIndices = (table: { createdAt: any; updatedAt: any }) => [
  index().on(table.createdAt),
  index().on(table.updatedAt),
]
export const timestampsOmits = { createdAt: true as const, updatedAt: true as const }

export function hasWhitespace(s: string) {
  return /\s/.test(s)
}
