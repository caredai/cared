import { boolean, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { timestampsIndices } from '@cared/shared'

import { App } from './app'

export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    twoFactorEnabled: boolean('two_factor_enabled').default(false),
    role: text('role'),
    banned: boolean('banned').default(false),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires'),
    normalizedEmail: text('normalized_email').unique(),
    defaultAccountId: text('default_account_id').references(() => Account.id, {
      onDelete: 'no action',
    }),
  },
  (table) => [
    index().on(table.name),
    index().on(table.email),
    index().on(table.role),
    ...timestampsIndices(table),
  ],
)

// NOTE: The session table will be only used in the development environment.
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
  activeAccountId: text('active_account_id'),
  activeTeamId: text('active_team_id'),
  geolocation: text('geolocation'),
})

export const authAccount = pgTable(
  'auth_account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    profile: text('profile'),
  },
  (table) => [
    index().on(table.accountId, table.providerId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index().on(table.identifier),
    index().on(table.expiresAt),
    ...timestampsIndices(table),
  ],
)

export const jwks = pgTable(
  'jwks',
  {
    id: text('id').primaryKey(),
    publicKey: text('public_key').notNull(),
    privateKey: text('private_key').notNull(),
    createdAt: timestamp('created_at').notNull(),
  },
  (table) => [
    index().on(table.createdAt),
  ],
)

export const passkey = pgTable(
  'passkey',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    publicKey: text('public_key').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    credentialID: text('credential_id').notNull(),
    counter: integer('counter').notNull(),
    deviceType: text('device_type').notNull(),
    backedUp: boolean('backed_up').notNull(),
    transports: text('transports'),
    createdAt: timestamp('created_at'),
    aaguid: text('aaguid'),
  },
  (table) => [
    index().on(table.userId),
    index().on(table.credentialID),
    index().on(table.createdAt),
  ],
)

export const twoFactor = pgTable(
  'two_factor',
  {
    id: text('id').primaryKey(),
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index().on(table.secret),
    index().on(table.userId),
  ],
)

export const Account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').unique(),
    logo: text('logo'),
    createdAt: timestamp('created_at').notNull(),
    metadata: text('metadata'),
  },
  (table) => [
    index().on(table.name),
    index().on(table.slug),
    index().on(table.createdAt),
  ],
)

export const member = pgTable(
  'member',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').default('member').notNull(),
    createdAt: timestamp('created_at').notNull(),
  },
  (table) => [
    index().on(table.accountId, table.userId),
    index().on(table.userId),
    index().on(table.createdAt),
  ],
)

export const invitation = pgTable(
  'invitation',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role'),
    teamId: text('team_id'),
    status: text('status').default('pending').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index().on(table.accountId, table.teamId),
    index().on(table.email),
    index().on(table.expiresAt),
    index().on(table.inviterId),
  ],
)

export const team = pgTable(
  'team',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    accountId: text('account_id')
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (table) => [
    index().on(table.accountId),
    ...timestampsIndices(table),
  ],
)

export const teamMember = pgTable(
  'team_member',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at'),
  },
  (table) => [
    index().on(table.teamId, table.userId),
    index().on(table.userId),
    index().on(table.createdAt),
  ],
)

export const oauthApplication = pgTable(
  'oauth_application',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    icon: text('icon'),
    metadata: text('metadata'),
    clientId: text('client_id').unique(),
    clientSecret: text('client_secret'),
    redirectURLs: text('redirect_urls'),
    type: text('type'),
    disabled: boolean('disabled').default(false),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    appId: text('app_id')
      .unique()
      .references(() => App.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index().on(table.clientId),
    index().on(table.appId),
    ...timestampsIndices(table),
  ],
)

export const oauthAccessToken = pgTable(
  'oauth_access_token',
  {
    id: text('id').primaryKey(),
    accessToken: text('access_token').unique(),
    refreshToken: text('refresh_token').unique(),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    clientId: text('client_id').references(() => oauthApplication.clientId, {
      onDelete: 'cascade',
    }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    scopes: text('scopes'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
  },
  (table) => [
    index().on(table.accessToken),
    index().on(table.refreshToken),
    index().on(table.clientId),
    index().on(table.userId, table.clientId),
    ...timestampsIndices(table),
  ],
)

export const oauthConsent = pgTable(
  'oauth_consent',
  {
    id: text('id').primaryKey(),
    clientId: text('client_id').references(() => oauthApplication.clientId, {
      onDelete: 'cascade',
    }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    scopes: text('scopes'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    consentGiven: boolean('consent_given'),
  },
  (table) => [
    index().on(table.clientId, table.userId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)
