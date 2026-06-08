import { describe, expect, it } from 'vitest'

import { checkPermissionsByRole } from './account'
import {
  PERMISSION_GROUPS,
  PERMISSION_GROUPS_MAP,
  checkPermissionsByTokenPolicies,
  validateTokenPolicies,
} from './permission'
import {
  TEST_ACCOUNT_A,
  TEST_ACCOUNT_B,
  TEST_MEMBER_USER,
  TEST_USER_ID,
  allowPolicy,
  mockUserAccounts,
  permissionGroupId,
} from './test-helpers'

describe('checkPermissionsByRole', () => {
  it('uses static role statements under Vitest', () => {
    expect(checkPermissionsByRole('owner', { apiToken: ['write'] })).toBe(true)
    expect(checkPermissionsByRole('admin', { apiToken: ['write'] })).toBe(true)
    expect(checkPermissionsByRole('member', { apiToken: ['write'] })).toBe(false)
    expect(checkPermissionsByRole('member', { apiToken: ['read'] })).toBe(true)
  })
})

describe('PERMISSION_GROUPS', () => {
  it('exposes a non-empty catalog with unique ids in the map', () => {
    expect(PERMISSION_GROUPS.length).toBeGreaterThan(0)
    expect(PERMISSION_GROUPS_MAP.size).toBe(PERMISSION_GROUPS.length)
    const ids = PERMISSION_GROUPS.map((group) => group.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const group of PERMISSION_GROUPS) {
      expect(group.scopes.length).toBeGreaterThan(0)
      expect(Object.keys(group.statements)).toHaveLength(1)
    }
  })

  it('uses stable md5 ids for resource:action pairs', () => {
    expect(permissionGroupId('apiToken', 'read')).toBe(
      PERMISSION_GROUPS_MAP.get(permissionGroupId('apiToken', 'read'))?.id,
    )
  })

  it('exposes dual scopes on model permission groups', () => {
    const group = PERMISSION_GROUPS_MAP.get(permissionGroupId('model', 'read'))
    expect(group?.scopes).toEqual(['dev.cared.api.account', 'dev.cared.api.account.user'])
    expect(group?.name).toBe('AI Model Read')
  })

  it('includes oauthApp permission groups without legacy app groups', () => {
    expect(PERMISSION_GROUPS_MAP.get(permissionGroupId('oauthApp', 'read'))?.statements).toEqual({
      oauthApp: ['read'],
    })
    expect(PERMISSION_GROUPS_MAP.get(permissionGroupId('app', 'read'))).toBeUndefined()
  })
})

describe('validateTokenPolicies', () => {
  describe('account credential type', () => {
    it('accepts a single account-scoped allow policy and normalizes output', async () => {
      const result = await validateTokenPolicies(
        'account',
        [
          allowPolicy({
            resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
            group: { resource: 'model', action: 'read' },
          }),
        ],
        mockUserAccounts([]),
      )

      expect(result).toMatchObject({
        credentialType: 'account',
        accountId: TEST_ACCOUNT_A,
        userId: undefined,
      })
      expect(result.formattedPolicies).toHaveLength(1)
      expect(result.formattedPolicies[0]!.resources).toEqual({
        [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*',
      })
      expect(result.formattedPolicies[0]!.permissionGroups[0]).toMatchObject({
        id: permissionGroupId('model', 'read'),
        name: 'AI Model Read',
      })
    })

    it('accepts nested account.user resources', async () => {
      const result = await validateTokenPolicies(
        'account',
        [
          allowPolicy({
            resources: {
              [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: {
                [`dev.cared.api.account.user.${TEST_MEMBER_USER}`]: '*',
              },
            },
            group: { resource: 'model', action: 'read' },
          }),
        ],
        mockUserAccounts([]),
      )

      expect(result).toMatchObject({
        accountId: TEST_ACCOUNT_A,
        userId: TEST_MEMBER_USER,
      })
      expect(result.formattedPolicies[0]!.resources).toEqual({
        [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: {
          [`dev.cared.api.account.user.${TEST_MEMBER_USER}`]: '*',
        },
      })
    })

    it('rejects account.* resources', async () => {
      await expect(
        validateTokenPolicies(
          'account',
          [
            allowPolicy({
              resources: { 'dev.cared.api.account.*': '*' },
              group: { resource: 'model', action: 'read' },
            }),
          ],
          mockUserAccounts([]),
        ),
      ).rejects.toThrow(/cannot use dev\.cared\.api\.account\.\*/)
    })

    it('rejects user-scoped resources', async () => {
      await expect(
        validateTokenPolicies(
          'account',
          [
            allowPolicy({
              resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
              group: { resource: 'model', action: 'read' },
            }),
          ],
          mockUserAccounts([]),
        ),
      ).rejects.toThrow(/cannot use dev\.cared\.api\.user/)
    })

    it('rejects mixed scope kinds in one policy object', async () => {
      await expect(
        validateTokenPolicies(
          'user',
          [
            {
              effect: 'allow',
              resources: {
                [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*',
                [`dev.cared.api.user.${TEST_USER_ID}`]: '*',
              },
              permissionGroups: [{ id: permissionGroupId('apiToken', 'read') }],
            },
          ],
          mockUserAccounts([{ id: TEST_ACCOUNT_A, role: 'owner' }]),
        ),
      ).rejects.toThrow(/exactly one resource scope kind/)
    })

    it('rejects unknown permission group ids', async () => {
      await expect(
        validateTokenPolicies(
          'account',
          [
            {
              effect: 'allow',
              resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
              permissionGroups: [{ id: 'unknown-group-id' }],
            },
          ],
          mockUserAccounts([]),
        ),
      ).rejects.toThrow(/Permission group .* not found/)
    })

    it('rejects permission groups whose scopes do not match the policy scope', async () => {
      await expect(
        validateTokenPolicies(
          'user',
          [
            allowPolicy({
              resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
              group: { resource: 'credits', action: 'read' },
            }),
          ],
          mockUserAccounts([]),
        ),
      ).rejects.toThrow(/requires at least one resource scope/)
    })

    it('preserves deny effect and normalizes multiple permission groups', async () => {
      const result = await validateTokenPolicies(
        'account',
        [
          {
            effect: 'deny',
            resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
            permissionGroups: [
              { id: permissionGroupId('model', 'read') },
              { id: permissionGroupId('dataset', 'read') },
            ],
          },
        ],
        mockUserAccounts([]),
      )

      expect(result.formattedPolicies[0]).toMatchObject({
        effect: 'deny',
        resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
      })
      expect(result.formattedPolicies[0]!.permissionGroups).toHaveLength(2)
      expect(result.formattedPolicies[0]!.permissionGroups[1]).toMatchObject({
        id: permissionGroupId('dataset', 'read'),
        name: 'Dataset Read',
      })
    })

    it('rejects policies with no resource scope', async () => {
      await expect(
        validateTokenPolicies(
          'account',
          [
            {
              effect: 'allow',
              resources: {},
              permissionGroups: [{ id: permissionGroupId('model', 'read') }],
            },
          ],
          mockUserAccounts([]),
        ),
      ).rejects.toThrow(/exactly one resource scope kind/)
    })

    it('rejects multiple nested user ids on account credentials', async () => {
      await expect(
        validateTokenPolicies(
          'account',
          [
            allowPolicy({
              resources: {
                [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: {
                  [`dev.cared.api.account.user.${TEST_MEMBER_USER}`]: '*',
                },
              },
              group: { resource: 'model', action: 'read' },
            }),
            allowPolicy({
              resources: {
                [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: {
                  [`dev.cared.api.account.user.${TEST_USER_ID}`]: '*',
                },
              },
              group: { resource: 'model', action: 'read' },
            }),
          ],
          mockUserAccounts([]),
        ),
      ).rejects.toThrow(/multiple different user ids/)
    })

    it('requires exactly one accountId across all policies', async () => {
      await expect(
        validateTokenPolicies(
          'account',
          [
            allowPolicy({
              resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
              group: { resource: 'model', action: 'read' },
            }),
            allowPolicy({
              resources: { [`dev.cared.api.account.${TEST_ACCOUNT_B}`]: '*' },
              group: { resource: 'dataset', action: 'read' },
            }),
          ],
          mockUserAccounts([]),
        ),
      ).rejects.toThrow(/exactly one account id/)
    })
  })

  describe('user credential type', () => {
    it('accepts separate user and account policy objects', async () => {
      const result = await validateTokenPolicies(
        'user',
        [
          allowPolicy({
            resources: {
              [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*',
              [`dev.cared.api.account.${TEST_ACCOUNT_B}`]: '*',
            },
            group: { resource: 'dataset', action: 'write' },
          }),
          allowPolicy({
            resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
            group: { resource: 'apiToken', action: 'read' },
          }),
        ],
        mockUserAccounts([
          { id: TEST_ACCOUNT_A, role: 'owner' },
          { id: TEST_ACCOUNT_B, role: 'admin' },
        ]),
      )

      expect(result).toMatchObject({
        credentialType: 'user',
        userId: TEST_USER_ID,
        accountIds: [TEST_ACCOUNT_A, TEST_ACCOUNT_B],
      })
      expect(result.formattedPolicies).toHaveLength(2)
      expect(result.formattedPolicies[0]!.resources).toEqual({
        [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*',
        [`dev.cared.api.account.${TEST_ACCOUNT_B}`]: '*',
      })
      expect(result.formattedPolicies[1]!.resources).toEqual({
        [`dev.cared.api.user.${TEST_USER_ID}`]: '*',
      })
    })

    it('isolates account resources per policy object when multiple account policies exist', async () => {
      const result = await validateTokenPolicies(
        'user',
        [
          allowPolicy({
            resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
            group: { resource: 'dataset', action: 'read' },
          }),
          allowPolicy({
            resources: { [`dev.cared.api.account.${TEST_ACCOUNT_B}`]: '*' },
            group: { resource: 'dataset', action: 'write' },
          }),
          allowPolicy({
            resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
            group: { resource: 'apiToken', action: 'read' },
          }),
        ],
        mockUserAccounts([
          { id: TEST_ACCOUNT_A, role: 'owner' },
          { id: TEST_ACCOUNT_B, role: 'owner' },
        ]),
      )

      expect(result.formattedPolicies[0]!.resources).toEqual({
        [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*',
      })
      expect(result.formattedPolicies[1]!.resources).toEqual({
        [`dev.cared.api.account.${TEST_ACCOUNT_B}`]: '*',
      })
    })

    it('expands account.* to accounts where the creator has apiToken:write', async () => {
      const result = await validateTokenPolicies(
        'user',
        [
          allowPolicy({
            resources: { 'dev.cared.api.account.*': '*' },
            group: { resource: 'credits', action: 'read' },
          }),
          allowPolicy({
            resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
            group: { resource: 'apiToken', action: 'read' },
          }),
        ],
        mockUserAccounts([
          { id: TEST_ACCOUNT_A, role: 'owner' },
          { id: TEST_ACCOUNT_B, role: 'member' },
        ]),
      )

      expect(result.accountIds).toEqual([TEST_ACCOUNT_A])
      expect(result.formattedPolicies[0]!.resources).toEqual({
        'dev.cared.api.account.*': '*',
      })
    })

    it('rejects nested account.user on user credentials', async () => {
      await expect(
        validateTokenPolicies(
          'user',
          [
            allowPolicy({
              resources: {
                [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: {
                  [`dev.cared.api.account.user.${TEST_MEMBER_USER}`]: '*',
                },
              },
              group: { resource: 'model', action: 'read' },
            }),
            allowPolicy({
              resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
              group: { resource: 'apiToken', action: 'read' },
            }),
          ],
          mockUserAccounts([{ id: TEST_ACCOUNT_A, role: 'owner' }]),
        ),
      ).rejects.toThrow(/nested dev\.cared\.api\.account\.user/)
    })

    it('requires exactly one userId across policies', async () => {
      await expect(
        validateTokenPolicies(
          'user',
          [
            allowPolicy({
              resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
              group: { resource: 'apiToken', action: 'read' },
            }),
            allowPolicy({
              resources: { [`dev.cared.api.user.${TEST_MEMBER_USER}`]: '*' },
              group: { resource: 'apiToken', action: 'read' },
            }),
          ],
          mockUserAccounts([]),
        ),
      ).rejects.toThrow(/exactly one userId/)
    })

    it('rejects unknown membership accounts', async () => {
      await expect(
        validateTokenPolicies(
          'user',
          [
            allowPolicy({
              resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
              group: { resource: 'credits', action: 'read' },
            }),
            allowPolicy({
              resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
              group: { resource: 'apiToken', action: 'read' },
            }),
          ],
          mockUserAccounts([]),
        ),
      ).rejects.toThrow(/Account acc_a not found/)
    })

    it('allows user-only policies with an empty accountIds list', async () => {
      const result = await validateTokenPolicies(
        'user',
        [
          allowPolicy({
            resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
            group: { resource: 'apiToken', action: 'read' },
          }),
        ],
        mockUserAccounts([]),
      )

      expect(result.accountIds).toEqual([])
      expect(result.formattedPolicies).toHaveLength(1)
    })

    it('returns empty accountIds when account.* matches no writable memberships', async () => {
      const result = await validateTokenPolicies(
        'user',
        [
          allowPolicy({
            resources: { 'dev.cared.api.account.*': '*' },
            group: { resource: 'credits', action: 'read' },
          }),
          allowPolicy({
            resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
            group: { resource: 'apiToken', action: 'read' },
          }),
        ],
        mockUserAccounts([
          { id: TEST_ACCOUNT_A, role: 'member' },
          { id: TEST_ACCOUNT_B, role: 'member' },
        ]),
      )

      expect(result.accountIds).toEqual([])
    })

    it('rejects policies with no resource scope', async () => {
      await expect(
        validateTokenPolicies(
          'user',
          [
            {
              effect: 'allow',
              resources: {},
              permissionGroups: [{ id: permissionGroupId('apiToken', 'read') }],
            },
          ],
          mockUserAccounts([]),
        ),
      ).rejects.toThrow(/exactly one resource scope kind/)
    })

    it('rejects accounts where the creator lacks apiToken:write', async () => {
      await expect(
        validateTokenPolicies(
          'user',
          [
            allowPolicy({
              resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
              group: { resource: 'credits', action: 'read' },
            }),
            allowPolicy({
              resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
              group: { resource: 'apiToken', action: 'read' },
            }),
          ],
          mockUserAccounts([{ id: TEST_ACCOUNT_A, role: 'member' }]),
        ),
      ).rejects.toThrow(/no permission to create API tokens/)
    })
  })
})

describe('checkPermissionsByTokenPolicies', () => {
  const modelReadPolicy = allowPolicy({
    resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
    group: { resource: 'model', action: 'read' },
  })

  describe('account credential context', () => {
    it('allows when policy resources and statements match', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['read'] },
          policies: [modelReadPolicy],
          accountId: TEST_ACCOUNT_A,
        }),
      ).toBe(true)
    })

    it('denies when accountId does not match policy resources', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['read'] },
          policies: [modelReadPolicy],
          accountId: TEST_ACCOUNT_B,
        }),
      ).toBe(false)
    })

    it('allows account.* wildcard for the active account', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { credits: ['read'] },
          policies: [
            allowPolicy({
              resources: { 'dev.cared.api.account.*': '*' },
              group: { resource: 'credits', action: 'read' },
            }),
          ],
          accountId: TEST_ACCOUNT_A,
        }),
      ).toBe(true)
    })

    it('matches nested account.user resources', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['read'] },
          policies: [
            allowPolicy({
              resources: {
                [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: {
                  [`dev.cared.api.account.user.${TEST_MEMBER_USER}`]: '*',
                },
              },
              group: { resource: 'model', action: 'read' },
            }),
          ],
          accountId: TEST_ACCOUNT_A,
          userId: TEST_MEMBER_USER,
        }),
      ).toBe(true)
    })

    it('denies nested account.user when userId does not match', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['read'] },
          policies: [
            allowPolicy({
              resources: {
                [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: {
                  [`dev.cared.api.account.user.${TEST_MEMBER_USER}`]: '*',
                },
              },
              group: { resource: 'model', action: 'read' },
            }),
          ],
          accountId: TEST_ACCOUNT_A,
          userId: 'usr_other',
        }),
      ).toBe(false)
    })
  })

  describe('user credential context', () => {
    it('allows user-scoped statements without a membership role', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { apiToken: ['read'] },
          policies: [
            allowPolicy({
              resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
              group: { resource: 'apiToken', action: 'read' },
            }),
          ],
          userId: TEST_USER_ID,
        }),
      ).toBe(true)
    })

    it('applies role ceiling on account-scoped permission groups', () => {
      const writePolicy = allowPolicy({
        resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
        group: { resource: 'model', action: 'write' },
      })

      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['write'] },
          policies: [writePolicy],
          accountId: TEST_ACCOUNT_A,
          userId: TEST_USER_ID,
          role: 'owner',
        }),
      ).toBe(true)

      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['write'] },
          policies: [writePolicy],
          accountId: TEST_ACCOUNT_A,
          userId: TEST_USER_ID,
          role: 'member',
        }),
      ).toBe(false)
    })

    it('allows account-scoped grants when the role permits the statement', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { dataset: ['read'] },
          policies: [
            allowPolicy({
              resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
              group: { resource: 'dataset', action: 'read' },
            }),
          ],
          accountId: TEST_ACCOUNT_A,
          userId: TEST_USER_ID,
          role: 'member',
        }),
      ).toBe(true)
    })

    it('denies user-scoped statements when userId does not match', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { apiToken: ['read'] },
          policies: [
            allowPolicy({
              resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
              group: { resource: 'apiToken', action: 'read' },
            }),
          ],
          userId: TEST_MEMBER_USER,
        }),
      ).toBe(false)
    })

    it('does not apply role ceiling when role is omitted', () => {
      const writePolicy = allowPolicy({
        resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
        group: { resource: 'model', action: 'write' },
      })

      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['write'] },
          policies: [writePolicy],
          accountId: TEST_ACCOUNT_A,
          userId: TEST_USER_ID,
        }),
      ).toBe(true)
    })

    it('applies role ceiling on account.user scoped permission groups', () => {
      const nestedWritePolicy = allowPolicy({
        resources: {
          [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: {
            [`dev.cared.api.account.user.${TEST_USER_ID}`]: '*',
          },
        },
        group: { resource: 'model', action: 'write' },
      })

      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['write'] },
          policies: [nestedWritePolicy],
          accountId: TEST_ACCOUNT_A,
          userId: TEST_USER_ID,
          role: 'owner',
        }),
      ).toBe(true)

      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['write'] },
          policies: [nestedWritePolicy],
          accountId: TEST_ACCOUNT_A,
          userId: TEST_USER_ID,
          role: 'member',
        }),
      ).toBe(false)
    })

    it('matches dual-scope permission groups via user scope without accountId', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { apiToken: ['read'] },
          policies: [
            allowPolicy({
              resources: { [`dev.cared.api.user.${TEST_USER_ID}`]: '*' },
              group: { resource: 'apiToken', action: 'read' },
            }),
          ],
          userId: TEST_USER_ID,
        }),
      ).toBe(true)
    })
  })

  describe('policy effects', () => {
    it('allows when a deny policy does not match the requested context', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['read'] },
          policies: [
            modelReadPolicy,
            allowPolicy({
              resources: { [`dev.cared.api.account.${TEST_ACCOUNT_B}`]: '*' },
              group: { resource: 'model', action: 'read' },
              effect: 'deny',
            }),
          ],
          accountId: TEST_ACCOUNT_A,
        }),
      ).toBe(true)
    })

    it('returns false when an explicit deny policy matches', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['read'] },
          policies: [
            modelReadPolicy,
            allowPolicy({
              resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
              group: { resource: 'model', action: 'read' },
              effect: 'deny',
            }),
          ],
          accountId: TEST_ACCOUNT_A,
        }),
      ).toBe(false)
    })

    it('implicitly denies when no policy matches', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['write'] },
          policies: [modelReadPolicy],
          accountId: TEST_ACCOUNT_A,
        }),
      ).toBe(false)
    })

    it('requires every requested statement to be satisfied', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['read'], dataset: ['read'] },
          policies: [modelReadPolicy],
          accountId: TEST_ACCOUNT_A,
        }),
      ).toBe(false)
    })

    it('satisfies multiple statements via separate allow policies', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['read'], dataset: ['read'] },
          policies: [
            modelReadPolicy,
            allowPolicy({
              resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
              group: { resource: 'dataset', action: 'read' },
            }),
          ],
          accountId: TEST_ACCOUNT_A,
        }),
      ).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('denies when policies are empty', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['read'] },
          policies: [],
          accountId: TEST_ACCOUNT_A,
        }),
      ).toBe(false)
    })

    it('ignores unknown permission group ids in stored policies', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['read'] },
          policies: [
            {
              effect: 'allow',
              resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
              permissionGroups: [{ id: 'unknown-group-id' }],
            },
          ],
          accountId: TEST_ACCOUNT_A,
        }),
      ).toBe(false)
    })

    it('denies account-scoped checks when accountId is missing', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { model: ['read'] },
          policies: [modelReadPolicy],
        }),
      ).toBe(false)
    })

    it('resolves oauthApp statements from oauthApp permission group ids', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { oauthApp: ['read'] },
          policies: [
            allowPolicy({
              resources: { [`dev.cared.api.account.${TEST_ACCOUNT_A}`]: '*' },
              group: { resource: 'oauthApp', action: 'read' },
            }),
          ],
          accountId: TEST_ACCOUNT_A,
        }),
      ).toBe(true)
    })

    it('returns true when only pseudo permissions are requested', () => {
      expect(
        checkPermissionsByTokenPolicies({
          permissions: { pseudo: [] },
          policies: [],
        }),
      ).toBe(true)
    })
  })
})
