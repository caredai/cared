import type { InferSelectModel } from 'drizzle-orm'

import type {
  Account,
  authAccount,
  invitation,
  jwks,
  member,
  oauthAccessToken,
  oauthClient,
  oauthConsent,
  oauthRefreshToken,
  passkey,
  session,
  team,
  teamMember,
  twoFactor,
  user,
} from './auth'

export {
  authAccount,
  invitation,
  jwks,
  member,
  oauthAccessToken,
  oauthClient,
  oauthConsent,
  oauthRefreshToken,
  Account,
  passkey,
  team,
  teamMember,
  twoFactor,
  user,
  session,
  userRelations,
  sessionRelations,
  authAccountRelations,
  passkeyRelations,
  twoFactorRelations,
  AccountRelations,
  teamRelations,
  teamMemberRelations,
  memberRelations,
  invitationRelations,
  oauthClientRelations,
  oauthRefreshTokenRelations,
  oauthAccessTokenRelations,
  oauthConsentRelations,
} from './auth'

// PascalCase aliases via re-export only (no runtime reads) to avoid TDZ on circular imports.
export {
  user as User,
  session as Session,
  authAccount as AuthAccount,
  jwks as Jwks,
  passkey as Passkey,
  twoFactor as TwoFactor,
  member as Member,
  invitation as Invitation,
  team as Team,
  teamMember as TeamMember,
  oauthClient as OAuthClient,
  oauthRefreshToken as OAuthRefreshToken,
  oauthAccessToken as OAuthAccessToken,
  oauthConsent as OAuthConsent,
} from './auth'

export type User = InferSelectModel<typeof user>
export type Session = InferSelectModel<typeof session>
export type AuthAccount = InferSelectModel<typeof authAccount>
export type Jwks = InferSelectModel<typeof jwks>
export type Passkey = InferSelectModel<typeof passkey>
export type TwoFactor = InferSelectModel<typeof twoFactor>
export type Account = InferSelectModel<typeof Account>
export type Member = InferSelectModel<typeof member>
export type Invitation = InferSelectModel<typeof invitation>
export type Team = InferSelectModel<typeof team>
export type TeamMember = InferSelectModel<typeof teamMember>
export type OAuthClient = InferSelectModel<typeof oauthClient>
export type OAuthRefreshToken = InferSelectModel<typeof oauthRefreshToken>
export type OAuthAccessToken = InferSelectModel<typeof oauthAccessToken>
export type OAuthConsent = InferSelectModel<typeof oauthConsent>
