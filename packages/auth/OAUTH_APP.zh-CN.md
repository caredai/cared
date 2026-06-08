# OAuth App Scopes

本文说明 Cared 如何注册 **OAuth 应用**，并在访问令牌（`croat_`）上校验 **OAuth scope**。第三方应用在用户授权后获得一部分能力；每个 scope 映射到与账户角色、API Token 相同的 **statements**（资源 + 动作）。

另见 [API_TOKEN.zh-CN.md](./API_TOKEN.zh-CN.md)（权限组 `PERMISSION_GROUPS`）。两套模型共用 `statement.ts`，但在标识符、存储方式以及可向第三方开放的能力上不同。

## 术语

| 术语 | 含义 |
|------|------|
| **Statement（权限语句）** | 资源 + 动作（如 `model` + `invoke`）。定义于 `statement.ts`。 |
| **OAuth scope** | 访问令牌上授予的字符串。API scope 使用 `resource:action`（如 `account:read`）。 |
| **标准（OIDC）scope** | `openid`、`profile`、`email`、`offline_access`。由 OAuth 提供方处理；不映射到 API statements。 |
| **OAuth app scope** | `OAUTH_APP_SCOPES` 中的一项：`id`、`name` 与一条 `statements`。由 `GET /oauth-apps/scopes` 列出。 |
| **Provider scope** | 认证服务器可注册或接受的 scope：`OAUTH_PROVIDER_SCOPES` = 标准 scope + app scope。 |

## 设计目标

- **最小权限**：创建 OAuth 客户端时声明允许的 scope 列表；令牌仅包含用户同意的 scope。
- **可读的 scope ID**：App scope 使用 `resource:action`（`scopeId()`），而非 MD5（API Token 权限组使用 `md5(\`${resource}:${action}\`)`）。
- **与角色同一套词汇**：Scope 的 `statements` 与 `permission/roles.ts` 中的 `accountRoles` 对齐。
- **角色上限**：OAuth 访问令牌不得超出授权用户在当前账户上的成员角色。
- **与 API Token 分离**：OAuth 应用不使用 `TokenPolicy` 或 `dev.cared.api.*` 资源标识符。

## 代码分布

| 位置 | 职责 |
|------|------|
| `@cared/shared` — `oauth-app.ts` | `OAuthAppScope`（`id`、`name`） |
| `@cared/auth` — `permission/scope.ts` | `OAUTH_APP_SCOPES`、`OAUTH_PROVIDER_SCOPES`、`oauthProviderScopesSchema`、`checkPermissionsByOAuthAppScopes` |
| `@cared/auth` — `permission/permission.ts` | `PERMISSION_GROUPS`（仅 API Token） |
| `@cared/auth` — `server.tsx` | `oauthProvider`：注册 scope、同意页、`account:read` 绑定账户 |
| `@cared/db` — `oauth-app.ts`、`auth.ts` | `OAuthApp`；`oauth_access_token.scopes` |
| `@cared/api` — `orpc/account/oauth-app.ts` | `listScopes`、`create` 可选 `scopes` |
| `@cared/api` — `auth/auth.ts` | `authenticate`、`Auth.requirePermissions`（OAuth 访问令牌） |

## Scope 分层

### 标准（OIDC）scope

`OAUTH_STANDARD_SCOPES`：`openid`、`profile`、`email`、`offline_access`。

- 在 OAuth 提供方注册（`server.tsx` 中 `oauthProvider.scopes`）。
- 不是 `OAUTH_APP_SCOPES` 条目，也不经 `checkPermissionsByOAuthAppScopes` 校验 API 权限。
- 用于身份、资料声明与 refresh token。

### API scope（`OAUTH_APP_SCOPES`）

目录每项：

```ts
{
  id: string       // scopeId(resource, action) → `${resource}:${action}`
  name: string
  statements: StatementsSubset  // 恰好一个资源 → 一个动作
}
```

`GET /oauth-apps/scopes` 返回 `{ scopes: { id, name }[] }`（不含 `statements`）。

### Provider scope（`OAUTH_PROVIDER_SCOPES`）

`[...OAUTH_STANDARD_SCOPES, ...OAUTH_APP_SCOPES 的 id]`。

- **创建 OAuth 应用** 时 `oauthProviderScopesSchema` 的合法取值。
- 必须是 `server.tsx` 中 provider 已注册 scope 的子集。

## 与 API Token 权限组对比

| | API Token（`PERMISSION_GROUPS`） | OAuth App（`OAUTH_APP_SCOPES`） |
|---|----------------------------------|----------------------------------|
| 目录 `id` | MD5 哈希 | `resource:action` |
| 授权载体 | `TokenPolicy` + `permissionGroups` + `resources` | 客户端与令牌上的 scope 字符串 |
| 资源绑定 | `dev.cared.api.account.{id}` 等 | 令牌 `referenceId` / `accountId` + `account:read` scope |
| 角色上限 | 用户 API Token 在账户相关权限组上 | 所有 OAuth 访问令牌 |
| `apiToken` / `oauthApp` | 权限组中包含 | **不**列入 OAuth app scope 目录（见下） |

Handler 仍通过 `requirePermissions({ oauthApp: ['read'] })` 等校验**控制台操作**；成员角色与 API Token 可使用 `oauthApp` / `apiToken` 资源，第三方 OAuth 客户端不能通过 scope 申请这些能力。

## 故意排除的 scope（`apiToken`、`oauthApp`）

在 `permission/scope.ts` 中，`apiToken:*` 与 `oauthApp:*` 在 `OAUTH_APP_SCOPES` 里被**注释掉**。它们仍存在于 `PERMISSION_GROUPS` 供 API Token 使用。

详见 [OAUTH_APP.md](./OAUTH_APP.md#excluded-scopes-apitoken-oauthapp) 英文版中的安全说明；要点如下：

### `apiToken:read` / `apiToken:write`

不向 OAuth 客户端开放，因为：

- API Token 由成员在控制台创建，带明确的 `TokenPolicy` 与资源标识符。
- 第三方应用若可申请 `apiToken` scope，可能代用户创建或读取 API Token，带来持久化凭据与权限提升风险。

### `oauthApp:read` / `oauthApp:write`

不向 OAuth 客户端开放，因为：

- 注册 OAuth 应用、轮换密钥、配置回调等属于**账户管理**操作，由控制台与成员角色 `oauthApp:*` 承担。
- 授予 `oauthApp:write` 会使第三方应用在同一账户下创建或修改其他 OAuth 客户端（混淆代理 / 元权限）。

若需为 OAuth 应用开放更多能力，在 `scope.ts` 的 `OAUTH_APP_SCOPES` 中新增条目，并在 `server.tsx` 的 `OAUTH_PROVIDER_SCOPES` 中注册。未经安全评审，请勿取消注释 `apiToken` 或 `oauthApp`。

## 运行时鉴权

### OAuth 访问令牌

1. `authenticate` 经 `getAccessToken` 加载令牌，用 `resolveOAuthAppScopes(token.scopes)` 设置 `AuthContext.scopes`。
2. 当存在 `auth.scopes`（且非 API Token 策略）时，`Auth.requirePermissions` 调用 `checkPermissionsByOAuthAppScopes`。

对每条要求的 statement（如 `{ model: ['invoke'] }`）：

1. 是否存在已授予 scope，其 `statements` 包含该资源/动作。
2. 若传入 `role`，该 statement 还须被用户在当前账户上的成员角色允许。
3. 否则拒绝。

OAuth 令牌无单独的 allow/deny 策略对象，未匹配即拒绝。

### 凭证类型与校验路径

| 凭证 | `requirePermissions` |
|------|----------------------|
| Session | `checkPermissionsByRole` |
| 用户/账户 API Token | `checkPermissionsByTokenPolicies` |
| OAuth 访问令牌（`croat_`） | `checkPermissionsByOAuthAppScopes` |

## OAuth 提供方（`server.tsx`）

- **注册 scope**：`OAUTH_PROVIDER_SCOPES`。
- **账户上下文**：`account:read`（替代旧版 `read:account`）用于在授权中绑定 `referenceId` / 访问令牌上的 `accountId`。
- **账户选择**：`hasNonStandardOAuthScopes` — 授权包含非 OIDC scope 时，用户可能需要选择活动账户。

## HTTP API

### `GET /oauth-apps/scopes`

返回 OAuth app scope 目录（`id`、`name`），供创建应用时选择。

### `POST /oauth-apps` — 可选 `scopes`

```ts
scopes?: string[]  // oauthProviderScopesSchema，取值 ∈ OAUTH_PROVIDER_SCOPES，且唯一
```

- 以空格分隔的 `scope` 写入 confidential / public 两个 `createOAuthClient`。
- 不传 `scopes` 时，创建时不设置客户端 scope 字符串（由后续流程或默认值决定）。

示例：

```json
{
  "name": "My integration",
  "redirectUris": ["https://example.com/callback"],
  "scopes": ["openid", "profile", "email", "offline_access", "account:read", "model:read"]
}
```

需要 OIDC 能力时请在 `scopes` 中显式包含标准 scope；创建接口不会自动合并。

## 新增或修改 scope

1. 如有需要，扩展 `statement.ts`。
2. 在 `OAUTH_APP_SCOPES` 增加 `scopeId(resource, action)` 行。
3. 在 `scope.ts` 的 `OAUTH_PROVIDER_SCOPES` 与 `server.tsx` 的 `oauthProvider.scopes` 中注册新 `id`。
4. 更新 `permission/scope.test.ts`。
5. 若某 `PERMISSION_GROUPS` 项不应出现在 OAuth 目录，在本文档记录排除原因。

## 相关文档

- [API_TOKEN.zh-CN.md](./API_TOKEN.zh-CN.md)
- [ACCOUNT_ROLE_PERMISSIONS.zh-CN.md](./ACCOUNT_ROLE_PERMISSIONS.zh-CN.md)
