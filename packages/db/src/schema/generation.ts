import { boolean, index, jsonb, numeric, pgTable, text } from 'drizzle-orm/pg-core'

import type { GenerationDetails } from '@cared/providers'
import { createdAt, generateId } from '@cared/shared'

import { App } from './app'
import { Member, Organization, User } from './auth-alias'

export const Generation = pgTable(
  'generation',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('gen')),
    userId: text().references(() => User.id, { onDelete: 'cascade' }), // for user scope
    organizationId: text().references(() => Organization.id, { onDelete: 'cascade' }), // for organization scope
    appId: text().references(() => App.id, { onDelete: 'cascade' }), // when use app in user scope
    memberId: text().references(() => Member.id, { onDelete: 'cascade' }), // when in organization scope
    usage: numeric({ precision: 18, scale: 10 }), // in credits
    byok: boolean().notNull(),
    details: jsonb().$type<GenerationDetails>().notNull(),
    createdAt,
  },
  (table) => [
    index().on(table.userId, table.appId),
    index().on(table.organizationId, table.memberId),
    index().on(table.createdAt),
  ],
)
