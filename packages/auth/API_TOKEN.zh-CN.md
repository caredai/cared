# API Token

本文说明 Cared 如何签发与校验 **API Token**（`crat_` / `crut_`）。模型参考 [Cloudflare API Token](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)：在 **API Token 策略**（`TokenPolicy`）中，将**权限组**绑定到**资源标识符**，并声明 `allow` 或 `deny` **效果**。

每个权限组的 `statements` 将 API Token 策略中的授权映射到**账户成员角色权限**：与 `accountRoles`（`permission/account.ts`）为 `owner` / `admin` / `member` 配置的资源/动作对相同，词汇表定义于 `statement.ts`。

## 术语

| 术语 | 含义 |
|------|------|
| **Statement（权限语句）** | 资源 + 动作（如 `model` + `invoke`）。与账户角色权限共用；定义于 `statement.ts`。 |
| **权限组** | `PERMISSION_GROUPS` 中的一项：元数据、`scopes`、一条 statement。策略中通过 `id` 引用。 |
| **权限组作用域** | 策略 `resources` 中允许的形态：`dev.cared.api.account`、`dev.cared.api.user`、`dev.cared.api.account.user`。 |
| **资源标识符** | `dev.cared.api.` 前缀下的策略键。 |
| **API Token 策略** | 一个 `TokenPolicy`：`effect`、`resources`、`permissionGroups`。 |
| **API Token 凭证类型** | `ApiToken.credentialType`：`account`（`crat_`）或 `user`（`crut_`）。 |

## 设计目标

- **最小权限**：每个 API Token 仅包含选定的权限组与资源标识符。
- **稳定 ID**：权限组 `id` 为 `md5(\`${resource}:${action}\`)`，便于策略持久化。
- **两种凭证类型**：账户 API Token 对应单一账户；用户 API Token 对应单一用户并可绑定多个账户。
- **角色上限**：在账户相关权限组上，用户 API Token 不得超出持有者在当前账户上的成员角色。

## 代码分布

| 位置 | 职责 |
|------|------|
| `@cared/shared` — `policy.ts` | `TokenPolicy`、`PermissionGroup`、`tokenPolicySchema`、`resourcesSchema` |
| `@cared/auth` — `permission/statement.ts` | 权限词汇表（`statements`） |
| `@cared/auth` — `permission/account.ts` | `accountRoles`（成员角色权限） |
| `@cared/auth` — `permission/permission.ts` | `PERMISSION_GROUPS`、`validateTokenPolicies`、`checkPermissionsByTokenPolicies` |
| `@cared/db` — `api-token.ts` | 每个 API Token 的 `policies: TokenPolicy[]` |
| `@cared/api` — `auth/auth.ts` | `authenticate`、`Auth.requirePermissions` |

## `PERMISSION_GROUPS`

`GET /api-tokens/permission-groups` 返回的目录。每项：

```ts
{
  id: string
  name: string
  description: string
  scopes: PermissionGroupScope[]
  statements: StatementsSubset  // 恰好一条：单资源 → 单动作
}
```

权限组上的 `statements` 是 **API Token 策略 + 权限组** 与**账户角色权限**的衔接：每项一条资源/动作，与成员角色使用的资源/动作对一致。策略仅通过 `id` 引用权限组。

**运行时**（`checkPermissionsByTokenPolicies`）：例如 handler 要求 `{ model: ['invoke'] }` 时，某条策略中的权限组包含该 statement、`resources` 与请求上下文匹配且 `effect` 允许，则通过。

**角色上限**（仅用户 API Token 的账户相关作用域）：该 statement 还须允许持有者在当前账户上的成员角色（`permission/account.ts` 中的 `checkPermissionsByRole`）。

**创建时**（`validateTokenPolicies`）：将输入规范为 `formattedPolicies`（规范化 `resources`、补全权限组 `name`）后持久化。用户 API Token 引用的每个账户须满足成员 `apiToken:write`；`dev.cared.api.account.*` 会展开为用户名下所有满足该条件的账户。

### 权限组 `id`

```ts
function generateId(resource: string, action: string) {
  return md5(`${resource}:${action}`)
}
```

使用该权限组 statement 的**资源**与**动作**（如 `generateId('model', 'read')`）。

### 权限组作用域

| 作用域 | 要求的 `resources` 形态 |
|--------|-------------------------|
| `dev.cared.api.account` | `dev.cared.api.account.{accountId}` 或 `dev.cared.api.account.*`，值为 `'*'` |
| `dev.cared.api.user` | `dev.cared.api.user.{userId}`，值为 `'*'` |
| `dev.cared.api.account.user` | `dev.cared.api.account.{accountId}` 下嵌套 `dev.cared.api.account.user.{userId}: '*'` |

创建 API Token 时，**每条**策略对象的 `resources` 只能表达**一种**作用域（`dev.cared.api.account`、`dev.cared.api.user` 或 `dev.cared.api.account.user`）。该条策略上的权限组须在 `scopes` 中包含该作用域。用户作用域与账户作用域的授权须写成 `policies` 数组中的**多条**策略。

运行时遍历 `permissionGroup.scopes` 的每一项；**任一**作用域匹配（并按需施加角色上限）即视为该权限组命中。

一项可声明多个 scope（如 `apiToken` 同时含 `dev.cared.api.account` 与 `dev.cared.api.user`；成员向 `model` 含 `dev.cared.api.account.user`）。

## API Token 策略

每个 API Token 存储 `policies: TokenPolicy[]`（创建时经 `validateTokenPolicies` 规范化）：

```ts
interface TokenPolicy {
  effect: 'allow' | 'deny'
  resources: Resources
  permissionGroups: { id: string; name?: string }[]
}
```

**求值**（每条所需 statement）：

1. `deny` 策略 — 任一匹配则拒绝。
2. `allow` 策略 — 任一匹配则允许。
3. 否则隐式拒绝。

## 资源标识符

前缀 `dev.cared.api.` 为稳定契约。

| 资源标识符 | 值 | 权限组作用域 | 策略中的使用 |
|------------|-----|--------------|--------------|
| `dev.cared.api.account.*` | `'*'` | `dev.cared.api.account` | 仅**用户 API Token**；`accountId` 由 `X-ACCOUNT-ID` 或 `defaultAccountId` 决定。 |
| `dev.cared.api.account.{accountId}` | `'*'` | `dev.cared.api.account` | **用户 API Token**：零个或多个；**账户 API Token**：一个且等于 `ApiToken.accountId`。 |
| `dev.cared.api.account.{accountId}` | 嵌套 `account.user.{userId}: '*'` | `dev.cared.api.account.user` | 仅**账户 API Token**；成员级时 `{userId}` 写入 `ApiToken.userId`。 |
| `dev.cared.api.user.{userId}` | `'*'` | `dev.cared.api.user` | 仅**用户 API Token**；`{userId}` = `ApiToken.userId`。 |

写入时由 `@cared/shared` 的 Zod 校验。

## API Token 凭证类型

| `credentialType` | 前缀 | `ApiToken` 行 | 允许的 policy `resources` |
|------------------|------|---------------|---------------------------|
| `account` | `crat_` | `accountId`；嵌套 `account.user` 时可选 `userId` | 一个 `dev.cared.api.account.{accountId}`：`'*'` 或嵌套 `dev.cared.api.account.user.{userId}: '*'` |
| `user` | `crut_` | `userId`；`defaultAccountId` | 允许多条策略：一条含 `dev.cared.api.user.{userId}: '*'`；可另加仅含账户作用域的对象（`account.{accountId}` 和/或 `account.*`，每条对象一种作用域） |

### `validateTokenPolicies`

在 API Token 创建/更新时执行。返回 `{ credentialType, formattedPolicies, userId, accountId? | accountIds? }`。

**每条策略对象**

- `resources` 只能对应**一种**作用域（同一对象内不得混用 `user` 与 `account` 键）。同一种作用域可写多个键（例如一条策略内多个 `dev.cared.api.account.{accountId}`）。
- 每个 `permissionGroups[].id` 须存在于 `PERMISSION_GROUPS`，且该组的 `scopes` 须包含本条策略的作用域种类（如 `dev.cared.api.account`）。
- 输出的 `formattedPolicies` 会按作用域规范化 `resources`，并从目录填入权限组 `id` 与 `name`。

**用户 API Token（`crut_`）**

- 全部策略中恰好一个 `userId`（来自 `dev.cared.api.user.{userId}`）。
- 可包含独立的账户作用域策略（`dev.cared.api.account.{accountId}` 和/或 `dev.cared.api.account.*`），不可使用嵌套 `account.user`。
- `dev.cared.api.account.*`：展开为用户所属且创建者具 `apiToken:write` 的全部账户；规范化后的 `resources` 为 `account.*` 或若干 `account.{id}`。
- 显式 `account.{id}`：每个 id 须为成员账户且创建者具 `apiToken:write`。
- 返回值含 `accountIds`（展开与校验后的账户 id 列表），而非单个 `accountId`。

**账户 API Token（`crat_`）**

- 可使用 `dev.cared.api.account.{accountId}` 且值为 `'*'`，或嵌套 `dev.cared.api.account.user.{userId}`（不可 `account.*`，不可 `dev.cared.api.user.*`）。
- 全部策略中有且仅有一个 `accountId`，嵌套 `userId` 至多一个。

## 运行时流程

### 认证

| 主体 | `AuthContext` |
|------|---------------|
| API Token | `type: 'user'` 或 `type: 'account'`，带 `policies` |
| OAuth Access Token / Session | `type: 'user'`，无 `policies` |

用户 API Token：`accountId` 来自 `X-ACCOUNT-ID` 或 `defaultAccountId`；遵守 `enabled`、`notBefore`、`expiresAt`。

### `Auth.requirePermissions`

```
已认证？ ─否→ UNAUTHORIZED
checkFields 一致？ ─否→ FORBIDDEN
type === 'account'？
  是 → checkPermissionsByTokenPolicies
  否 → 携带 policies？
          是 → checkPermissionsByTokenPolicies（账户作用域上角色上限）
          否 → checkPermissionsByRole（仅 Session / OAuth）
```

## 示例

**账户 API Token** — `model:read`：

```json
{
  "effect": "allow",
  "resources": { "dev.cared.api.account.acc_abc": "*" },
  "permissionGroups": [{ "id": "<md5('model:read')>" }]
}
```

**用户 API Token** — 两账户 `dataset:write` + 用户作用域 `apiToken:read`：

```json
[
  {
    "effect": "allow",
    "resources": {
      "dev.cared.api.account.acc_a": "*",
      "dev.cared.api.account.acc_b": "*"
    },
    "permissionGroups": [{ "id": "<md5('dataset:write')>" }]
  },
  {
    "effect": "allow",
    "resources": { "dev.cared.api.user.usr_xyz": "*" },
    "permissionGroups": [{ "id": "<md5('apiToken:read')>" }]
  }
]
```

**账户 API Token（成员级）**：

```json
{
  "effect": "allow",
  "resources": {
    "dev.cared.api.account.acc_abc": {
      "dev.cared.api.account.user.usr_xyz": "*"
    }
  },
  "permissionGroups": [{ "id": "<md5('model:invoke')>" }]
}
```

## 扩展 API Token 能力

1. 在 `statement.ts` 中增加资源/动作（若尚未存在）。
2. 在 `PERMISSION_GROUPS` 增加对应 `statements`、`scopes`、`generateId`。
3. handler 使用 `auth.requirePermissions`。
4. `listPermissionGroups` 自动暴露新权限组。

勿修改已有 `generateId` 入参。

## 安全

- API Token 明文密钥仅创建时返回；库内存 SHA-256 哈希。
- 未知权限组 `id` → 不匹配 → 隐式拒绝。
- 优先使用 `dev.cared.api.account.{accountId}`。
- 通过 `enabled`、`notBefore`、`expiresAt` 轮换。

## 相关源码

- `packages/auth/src/permission/permission.ts`
- `packages/shared/src/policy.ts`
- `packages/api/src/auth/auth.ts`
- `apps/web/src/components/api-tokens/`
