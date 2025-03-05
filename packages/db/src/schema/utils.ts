import { pgEnum } from 'drizzle-orm/pg-core'

export {
  generateId,
  parseTimestampFromId,
  makeIdValid,
  makeObjectNonempty,
  createdAt,
  updatedAt,
  timestampsIndices,
  timestampsOmits,
  timestamps,
} from '@mindworld/sdk/utils'

export const visibilityEnumValues = ['public', 'private'] as const
export const visibilityEnum = pgEnum('visibility', visibilityEnumValues)

export const roleEnumValues = ['owner', 'member'] as const
export const roleEnum = pgEnum('role', roleEnumValues)
