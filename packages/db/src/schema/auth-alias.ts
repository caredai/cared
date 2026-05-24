import type { InferSelectModel } from 'drizzle-orm'

import type {
  Account,
  authAccount,
  invitation,
  jwks,
  member,
  oauthAccessToken,
  oauthApplication,
  oauthConsent,
  passkey,
  team,
  teamMember,
  twoFactor,
  user,
  verification,
} from './auth'

export {
  authAccount,
  invitation,
  jwks,
  member,
  oauthAccessToken,
  oauthApplication,
  oauthConsent,
  Account,
  passkey,
  team,
  teamMember,
  twoFactor,
  user,
  session,
  verification,
} from './auth'

// PascalCase aliases via re-export only (no runtime reads) to avoid TDZ on circular imports.
export {
  user as User,
  authAccount as AuthAccount,
  verification as Verification,
  jwks as Jwks,
  passkey as Passkey,
  twoFactor as TwoFactor,
  member as Member,
  invitation as Invitation,
  team as Team,
  teamMember as TeamMember,
  oauthApplication as OAuthApplication,
  oauthAccessToken as OAuthAccessToken,
  oauthConsent as OAuthConsent,
} from './auth'

export type User = InferSelectModel<typeof user>
export type AuthAccount = InferSelectModel<typeof authAccount>
export type Verification = InferSelectModel<typeof verification>
export type Jwks = InferSelectModel<typeof jwks>
export type Passkey = InferSelectModel<typeof passkey>
export type TwoFactor = InferSelectModel<typeof twoFactor>
export type Account = InferSelectModel<typeof Account>
export type Member = InferSelectModel<typeof member>
export type Invitation = InferSelectModel<typeof invitation>
export type Team = InferSelectModel<typeof team>
export type TeamMember = InferSelectModel<typeof teamMember>
export type OAuthApplication = InferSelectModel<typeof oauthApplication>
export type OAuthAccessToken = InferSelectModel<typeof oauthAccessToken>
export type OAuthConsent = InferSelectModel<typeof oauthConsent>
