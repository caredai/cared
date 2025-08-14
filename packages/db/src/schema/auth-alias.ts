import type { InferSelectModel } from 'drizzle-orm'

import {
  account,
  apikey,
  invitation,
  jwks,
  member,
  oauthAccessToken,
  oauthApplication,
  oauthConsent,
  organization,
  passkey,
  team,
  teamMember,
  twoFactor,
  user,
  verification,
} from './auth'

export {
  account,
  apikey,
  invitation,
  jwks,
  member,
  oauthAccessToken,
  oauthApplication,
  oauthConsent,
  organization,
  passkey,
  team,
  teamMember,
  twoFactor,
  user,
  session,
  verification,
} from './auth'

export const User = user
export type User = InferSelectModel<typeof User>
export const Account = account
export type Account = InferSelectModel<typeof Account>
export const Verification = verification
export type Verification = InferSelectModel<typeof Verification>
export const Jwks = jwks
export type Jwks = InferSelectModel<typeof Jwks>
export const Passkey = passkey
export type Passkey = InferSelectModel<typeof Passkey>
export const TwoFactor = twoFactor
export type TwoFactor = InferSelectModel<typeof TwoFactor>
export const Organization = organization
export type Organization = InferSelectModel<typeof Organization>
export const Member = member
export type Member = InferSelectModel<typeof Member>
export const Invitation = invitation
export type Invitation = InferSelectModel<typeof Invitation>
export const Team = team
export type Team = InferSelectModel<typeof Team>
export const TeamMember = teamMember
export type TeamMember = InferSelectModel<typeof TeamMember>
export const OAuthApplication = oauthApplication
export type OAuthApplication = InferSelectModel<typeof OAuthApplication>
export const OAuthAccessToken = oauthAccessToken
export type OAuthAccessToken = InferSelectModel<typeof OAuthAccessToken>
export const OAuthConsent = oauthConsent
export type OAuthConsent = InferSelectModel<typeof OAuthConsent>
export const ApiKey = apikey
export type ApiKey = InferSelectModel<typeof ApiKey>
