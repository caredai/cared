import { z } from 'zod/v4'

// Entity field conditions
type EntityFieldCondition =
  | { user_id: string | '*' }
  | { user_id: { '=': string } }
  | { user_id: { '!=': string } }
  | { user_id: { in: string[] } }
  | { agent_id: string | '*' }
  | { agent_id: { '=': string } }
  | { agent_id: { '!=': string } }
  | { agent_id: { in: string[] } }
  | { app_id: string | '*' }
  | { app_id: { '=': string } }
  | { app_id: { '!=': string } }
  | { app_id: { in: string[] } }
  | { run_id: string | '*' }
  | { run_id: { '=': string } }
  | { run_id: { '!=': string } }
  | { run_id: { in: string[] } }

// Time field conditions
type TimeFieldCondition =
  | { created_at: { '>': string } }
  | { created_at: { '>=': string } }
  | { created_at: { '<': string } }
  | { created_at: { '<=': string } }
  | { created_at: { '=': string } }
  | { created_at: { '!=': string } }
  | { updated_at: { '>': string } }
  | { updated_at: { '>=': string } }
  | { updated_at: { '<': string } }
  | { updated_at: { '<=': string } }
  | { updated_at: { '=': string } }
  | { updated_at: { '!=': string } }
  | { timestamp: { '>': string } }
  | { timestamp: { '>=': string } }
  | { timestamp: { '<': string } }
  | { timestamp: { '<=': string } }
  | { timestamp: { '=': string } }
  | { timestamp: { '!=': string } }

// Content field conditions
type ContentFieldCondition =
  | { categories: string[] }
  | { categories: { '=': string[] } }
  | { categories: { '!=': string[] } }
  | { categories: { in: string[] } }
  | { categories: { contains: string } }
  | { metadata: Record<string, unknown> }
  | { metadata: { '=': Record<string, unknown> } }
  | { metadata: { '!=': Record<string, unknown> } }
  | { keywords: { contains: string } }
  | { keywords: { icontains: string } }

// Special field conditions
type SpecialFieldCondition = { memory_ids: string[] } | { memory_ids: { in: string[] } }

// Base condition type
type FilterCondition =
  | EntityFieldCondition
  | TimeFieldCondition
  | ContentFieldCondition
  | SpecialFieldCondition

// Logical operator types
interface AndFilter {
  AND: Filter[]
}
interface OrFilter {
  OR: Filter[]
}
interface NotFilter {
  NOT: Filter
}

// Main filter type
export type Filter = AndFilter | OrFilter | NotFilter | FilterCondition

// Zod schemas
const entityFieldSchema = z.union([
  // user_id
  z.object({ user_id: z.union([z.literal('*'), z.string()]) }),
  z.object({ user_id: z.object({ '=': z.string() }) }),
  z.object({ user_id: z.object({ '!=': z.string() }) }),
  z.object({ user_id: z.object({ in: z.array(z.string()) }) }),
  // agent_id
  z.object({ agent_id: z.union([z.literal('*'), z.string()]) }),
  z.object({ agent_id: z.object({ '=': z.string() }) }),
  z.object({ agent_id: z.object({ '!=': z.string() }) }),
  z.object({ agent_id: z.object({ in: z.array(z.string()) }) }),
  // app_id
  z.object({ app_id: z.union([z.literal('*'), z.string()]) }),
  z.object({ app_id: z.object({ '=': z.string() }) }),
  z.object({ app_id: z.object({ '!=': z.string() }) }),
  z.object({ app_id: z.object({ in: z.array(z.string()) }) }),
  // run_id
  z.object({ run_id: z.union([z.literal('*'), z.string()]) }),
  z.object({ run_id: z.object({ '=': z.string() }) }),
  z.object({ run_id: z.object({ '!=': z.string() }) }),
  z.object({ run_id: z.object({ in: z.array(z.string()) }) }),
])

const timeFieldSchema = z.union([
  // created_at
  z.object({ created_at: z.object({ '>': z.string() }) }),
  z.object({ created_at: z.object({ '>=': z.string() }) }),
  z.object({ created_at: z.object({ '<': z.string() }) }),
  z.object({ created_at: z.object({ '<=': z.string() }) }),
  z.object({ created_at: z.object({ '=': z.string() }) }),
  z.object({ created_at: z.object({ '!=': z.string() }) }),
  // updated_at
  z.object({ updated_at: z.object({ '>': z.string() }) }),
  z.object({ updated_at: z.object({ '>=': z.string() }) }),
  z.object({ updated_at: z.object({ '<': z.string() }) }),
  z.object({ updated_at: z.object({ '<=': z.string() }) }),
  z.object({ updated_at: z.object({ '=': z.string() }) }),
  z.object({ updated_at: z.object({ '!=': z.string() }) }),
  // timestamp
  z.object({ timestamp: z.object({ '>': z.string() }) }),
  z.object({ timestamp: z.object({ '>=': z.string() }) }),
  z.object({ timestamp: z.object({ '<': z.string() }) }),
  z.object({ timestamp: z.object({ '<=': z.string() }) }),
  z.object({ timestamp: z.object({ '=': z.string() }) }),
  z.object({ timestamp: z.object({ '!=': z.string() }) }),
])

const contentFieldSchema = z.union([
  // categories
  z.object({ categories: z.array(z.string()) }),
  z.object({ categories: z.object({ '=': z.array(z.string()) }) }),
  z.object({ categories: z.object({ '!=': z.array(z.string()) }) }),
  z.object({ categories: z.object({ in: z.array(z.string()) }) }),
  z.object({ categories: z.object({ contains: z.string() }) }),
  // metadata
  z.object({ metadata: z.record(z.string(), z.unknown()) }),
  z.object({ metadata: z.object({ '=': z.record(z.string(), z.unknown()) }) }),
  z.object({ metadata: z.object({ '!=': z.record(z.string(), z.unknown()) }) }),
  // keywords
  z.object({ keywords: z.object({ contains: z.string() }) }),
  z.object({ keywords: z.object({ icontains: z.string() }) }),
])

const specialFieldSchema = z.union([
  z.object({ memory_ids: z.array(z.string()) }),
  z.object({ memory_ids: z.object({ in: z.array(z.string()) }) }),
])

// Recursive filter schema
export const filterSchema: z.ZodType<Filter> = z.lazy(() =>
  z.union([
    // Logical operators
    z.object({ AND: z.array(filterSchema) }),
    z.object({ OR: z.array(filterSchema) }),
    z.object({ NOT: filterSchema }),
    // Field conditions
    entityFieldSchema,
    timeFieldSchema,
    contentFieldSchema,
    specialFieldSchema,
  ]),
)

// Export types for convenience
export type {
  EntityFieldCondition,
  TimeFieldCondition,
  ContentFieldCondition,
  SpecialFieldCondition,
  FilterCondition,
}
export type { AndFilter, OrFilter, NotFilter }

