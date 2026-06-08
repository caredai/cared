# Account 角色权限

Cared 的交互式授权基于 [Better Auth organization 插件](https://www.better-auth.com/docs/plugins/organization)。自定义 **角色** 与 **statements** 通过 `better-auth/plugins/access` 的 `createAccessControl` 定义（organization 插件使用的访问控制能力，**不是**单独安装的插件）。产品上的 **account（账户）** 对应 Better Auth 的 **organization**；成员 **role（角色）** 在账户上授予 **statements（权限语句）**。

## Account（账户）

**账户**是 Cared 资源的租户边界（模型、数据集、计费等）。

- Better Auth 模型：`organization`，映射到数据库表 `Account`（`packages/auth/src/server.tsx`）。
- 用户通过 **成员关系**（`Member`，`accountId` = `organizationId`）可属于多个账户。
- Session 或 OAuth Access Token 请求使用当前 `accountId`（`X-ACCOUNT-ID`、session 的 `activeAccountId` 或 `user.defaultAccountId`）。

## Role（角色）

**角色**表示用户在某账户上的权限级别：`owner`、`admin`、`member`。

角色在 `packages/auth/src/permission/account.ts` 中通过 `createAccessControl` / `newRole` 定义，并以 `ac`、`roles` 传入 organization 插件：

```ts
organization({
  ac: accountAc,
  roles: accountRoles,
  schema: { organization: { modelName: 'Account' }, /* ... */ },
})
```

| 角色 | 说明 |
|------|------|
| `owner` | 在当前 statement 集下拥有完整账户管理能力 |
| `admin` | 与 `owner` 的 statement 集相同 |
| `member` | 以读为主；有限写权限（如 `model:invoke`） |

Session 与 OAuth Access Token 在运行时调用：

```ts
checkPermissionsByRole(membershipRole, { model: ['invoke'] })
```

内部委托 Better Auth 的 `clientSideHasPermission`，使用 organization 插件配置。

## Statements（权限语句）

**Statements** 是统一的权限词汇表：以 **资源（resource）** 为键、**动作（action）** 列表为值。

全集定义于 `packages/auth/src/permission/statement.ts`：

```ts
export const statements = {
  account: ['read', 'write'],
  member: ['read', 'write'],
  model: ['read', 'write', 'invoke'],
  dataset: ['read', 'write'],
  // ...
}
```

- `accountRoles` 中每个**角色**选取一个子集（`ownerAc`、`adminAc`、`memberAc`）。
- 路由通过 `Auth.requirePermissions({ model: ['invoke'] })` 传入所需子集 `StatementsSubset`。
- `pseudo` 为空占位，仅做认证或 `checkFields` 时不绑定具体能力。

Handler 与角色必须使用相同的资源/动作名。新增能力：先扩展 `statements`，再在 `account.ts` 中更新 `accountRoles`。

## 相关源码

- `packages/auth/src/permission/statement.ts` — `statements`
- `packages/auth/src/permission/account.ts` — `accountAc`、`accountRoles`、`checkPermissionsByRole`
- `packages/auth/src/server.tsx` — organization 插件配置
