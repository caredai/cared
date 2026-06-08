import { describe, expect, it } from 'vitest';



import {
  checkPermissionsByOAuthAppScopes,
  hasNonStandardOAuthScopes,
  OAUTH_APP_SCOPES,
  OAUTH_APP_SCOPES_MAP,
  OAUTH_PROVIDER_SCOPES,
  OAUTH_STANDARD_SCOPES,
  oauthProviderScopesSchema,
  resolveOAuthAppScopes,
} from './scope'


describe('OAUTH_APP_SCOPES', () => {
  it('exposes a non-empty catalog with unique ids in the map', () => {
    expect(OAUTH_APP_SCOPES.length).toBeGreaterThan(0)
    expect(OAUTH_APP_SCOPES_MAP.size).toBe(OAUTH_APP_SCOPES.length)
    const ids = OAUTH_APP_SCOPES.map((scope) => scope.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const scope of OAUTH_APP_SCOPES) {
      expect(Object.keys(scope.statements)).toHaveLength(1)
    }
  })

  it('uses resource:action scope ids', () => {
    expect(OAUTH_APP_SCOPES_MAP.get('model:read')?.id).toBe('model:read')
    expect(OAUTH_APP_SCOPES_MAP.get('model:read')?.name).toBe('AI Model Read')
  })

  it('does not expose oauthApp or legacy app scopes in the catalog', () => {
    expect(OAUTH_APP_SCOPES_MAP.get('oauthApp:read')?.statements).toBeUndefined()
    expect(OAUTH_APP_SCOPES_MAP.get('app:read')?.statements).toBeUndefined()
  })
})

describe('OAUTH_PROVIDER_SCOPES', () => {
  it('includes OIDC standard scopes and all API scopes', () => {
    for (const scope of OAUTH_STANDARD_SCOPES) {
      expect(OAUTH_PROVIDER_SCOPES).toContain(scope)
    }
    for (const scope of OAUTH_APP_SCOPES) {
      expect(OAUTH_PROVIDER_SCOPES).toContain(scope.id)
    }
  })
})

describe('oauthProviderScopesSchema', () => {
  it('accepts known scopes and rejects duplicates', () => {
    expect(oauthProviderScopesSchema.parse(['model:read', 'account:read'])).toEqual([
      'model:read',
      'account:read',
    ])
    expect(() => oauthProviderScopesSchema.parse(['model:read', 'model:read'])).toThrow()
    expect(() => oauthProviderScopesSchema.parse(['invalid:scope'])).toThrow()
  })
})

describe('hasNonStandardOAuthScopes', () => {
  it('returns false for OIDC-only scopes', () => {
    expect(hasNonStandardOAuthScopes([...OAUTH_STANDARD_SCOPES])).toBe(false)
  })

  it('returns true when any API scope is present', () => {
    expect(hasNonStandardOAuthScopes(['openid', 'account:read'])).toBe(true)
  })
})

describe('resolveOAuthAppScopes', () => {
  it('resolves known scope ids to catalog entries', () => {
    expect(resolveOAuthAppScopes(['model:read', 'unknown:scope'])).toEqual([
      { id: 'model:read', name: 'AI Model Read' },
    ])
  })
})

describe('checkPermissionsByOAuthAppScopes', () => {
  it('grants statements from oauth app scopes with role ceiling', () => {
    expect(
      checkPermissionsByOAuthAppScopes({
        permissions: { model: ['read'] },
        scopes: ['model:read'],
        role: 'member',
      }),
    ).toBe(true)
    expect(
      checkPermissionsByOAuthAppScopes({
        permissions: { model: ['write'] },
        scopes: ['model:write'],
        role: 'member',
      }),
    ).toBe(false)
  })

  it('denies when the granted scope does not cover the required statement', () => {
    expect(
      checkPermissionsByOAuthAppScopes({
        permissions: { model: ['write'] },
        scopes: ['model:read'],
        role: 'owner',
      }),
    ).toBe(false)
  })

  it('returns true when only pseudo permissions are requested', () => {
    expect(
      checkPermissionsByOAuthAppScopes({
        permissions: { pseudo: [] },
        scopes: ['model:read'],
      }),
    ).toBe(true)
  })
})
