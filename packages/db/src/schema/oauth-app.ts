import type { InferSelectModel } from 'drizzle-orm'
import { index, pgTable, primaryKey, text, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { App } from './app'
import { timestamps, timestampsIndices, timestampsOmits } from './utils'

// OAuthApp table to store the mapping between app and Clerk OAuth App.
export const OAuthApp = pgTable(
  'oauth_app',
  {
    appId: text()
      .notNull()
      .references(() => App.id),
    // Clerk OAuth App ID
    oauthAppId: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.appId] }),
    index().on(table.oauthAppId),
    ...timestampsIndices(table),
  ],
)

export type OAuthApp = InferSelectModel<typeof OAuthApp>

export const CreateOAuthAppSchema = createInsertSchema(OAuthApp, {
  appId: z.string(),
  oauthAppId: z.string().max(255),
}).omit({
  ...timestampsOmits,
})
