# Neon Postgres 集成 — 设计说明

本文说明 Cared 如何集成 [Neon](https://neon.tech) 无服务器 Postgres，涵盖对象语义、元数据归属、分层策略以及 `neon.ts` 与账号级 `database` oRPC 路由中的 API 设计取舍。

## 目标

- 将**按账号隔离的托管 Postgres** 作为平台一等能力（与沙箱、数据集等同级）。
- 暴露 Neon 的分支、PITR、角色/数据库模型，而不在 Cared 内重复实现 Postgres 运维逻辑。
- 在 Cared 数据库中保留**精简、权威的映射**，运行时状态委托给 Neon API。
- 通过**两个 Neon 组织**与对应 API Key 支持低成本与标准两档套餐。

## Cared 平台上下文

Cared 的资源层级以 **Account（账号）** 为中心：

| Cared 对象          | 作用域                   | 与数据库的关系                                           |
| ------------------- | ------------------------ | -------------------------------------------------------- |
| **User（用户）**    | 全局身份                 | 通过成员关系在账号内操作                                 |
| **Account（账号）** | 计费、团队与主要隔离边界 | 拥有 database namespace、数据集、沙箱、API Token、文件等 |

Database namespace 为**账号级**资源。所有 database 路由使用 `protectedProcedure`；每次操作从 `context.auth.accountId` 解析账号，不信任客户端传入的 account id。

## 术语映射

Cared 使用与 Neon API 对齐但略有差异的产品用语：

| Cared 术语             | API / 路径                        | Neon 对应                  | 说明                                 |
| ---------------------- | --------------------------------- | -------------------------- | ------------------------------------ |
| **Database namespace** | `/database-namespaces`，表 `neon` | **Project（项目）**        | 一个 namespace 对应一个 Neon project |
| **Branch（分支）**     | `.../branches/{branchId}`         | **Branch**                 | 基本透传；支持 PITR 父分支参数       |
| **Database（数据库）** | `.../databases/{databaseName}`    | 分支内的 **Database**      | 分支上的逻辑库，不是 namespace 本身  |
| **Role（角色）**       | `.../roles/{roleName}`            | 分支上的 **Postgres 角色** | 含查密、重置密码                     |

使用 **namespace** 一词，是为了避免与 Postgres/Neon 中的 **database**（分支内单个库）混淆。

### 创建时的默认引导

创建 namespace 时，Neon 会初始化：

- 分支名：`production`
- 数据库名：`cared`
- 角色名：`cared`

每个新 namespace 具有一致的起点；更多库与角色通过分支级 API 创建。

## 架构：元数据拆分

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cared API (oRPC)                         │
│  databaseRouter → NeonService                                    │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│ Cared Postgres（`neon` 表）│   │ Neon 控制面 API                  │
│ - id (neon_*)              │   │ - project、branch、database      │
│ - accountId                │   │ - role、配额、endpoint           │
│ - name（展示名）            │   │ - 实时状态、用量、PITR           │
│ - isLowCost → 选组织/客户端 │   │                                  │
│ - orgId, projectId, region │   │                                  │
└───────────────────────────┘   └─────────────────────────────────┘
```

**保存在 Cared（持久映射）：**

- `id` — Cared 主键（`generateId('neon')`）
- `accountId` — 所有者；每次查询强制校验
- `name` — 用户可见展示名（仅 Cared）
- `isLowCost` — 选择 Neon 组织与 API 客户端
- `orgId`、`projectId`、`regionId` — 路由与唯一约束（`unique(orgId, projectId)`）

**不保存在 Cared（按需从 Neon 拉取）：**

- 分支、数据库、角色、密码
- 项目配额、自动扩缩容、挂起超时、逻辑复制、历史保留
- 计算 endpoint 与连接串（`NeonService` 尚未封装）

**原因：** 分支级对象变更频繁且以 Neon 为权威源；在 Cared 复制需要同步任务、冲突处理与陈旧数据。Namespace 级元数据稳定，且在调用 Neon 前即可完成鉴权与分层路由。

Namespace 相关 API 将 Cared 行与 Neon `project` 合并返回；`formatNamespace` 会从响应中剥离 `accountId`、`orgId`、`projectId`。

## Neon project name 与 Namespace name

刻意拆分以优化组织级批量查询：

| 字段              | 存放位置          | 取值             |
| ----------------- | ----------------- | ---------------- |
| Neon project name | Neon              | Cared 账号 id    |
| Namespace name    | Cared `neon.name` | 用户自定义展示名 |

**原因：** `listProjects({ org_id, search: accountId })` 可在列表 namespace 时一次性拉取该账号下所有项目，避免 N 次 `getProject`。展示名可在 Cared 侧修改，无需改 Neon project name。

`updateNamespace` 仅更新 Cared 中的 Namespace name；Neon project name 始终保持为账号 id。

## 双组织分层

两个 Neon 组织，各自配置 API Key 与 org id（环境变量）：

| 档位   | `DatabaseTier` | 环境变量          | 典型用途                          |
| ------ | -------------- | ----------------- | --------------------------------- |
| 低成本 | `low-cost`     | `NEON_FREE_ORG_*` | 固定较低配额与算力上限            |
| 标准   | `normal`       | `NEON_PAID_ORG_*` | 较高默认配额；创建/更新时可调设置 |

`neon.isLowCost` 在创建时写入，并用于 Neon API 调用的 `getClient(tier)`。

**档位迁移（规划中）：** 可通过 Neon 的项目转移 API 将 namespace 从低成本组织迁到标准组织（free org → paid org），再在 Cared 中更新 `isLowCost` 与 `orgId`。该能力尚未实现；在此之前，namespace 仅在创建时选择档位。

### 低成本档默认值（固定）

- 配额：360000 秒活跃时间、512 MiB 逻辑存储、5 GiB 传输
- 自动扩缩：0.25–2 CU
- 挂起超时：300 秒

### 标准档默认值（可通过 `NeonSettings` 配置）

- 配额默认：每月 750 小时活跃时间、10 GiB 存储、50 GiB 传输（可覆盖）
- 自动扩缩：默认 0.25–16 CU
- 挂起超时：默认 300 秒；`-1` 表示永不挂起

设置与 Neon 字段对应关系：

| `NeonSettings`                                                            | Neon 字段                                                       |
| ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `activeTimeSeconds`、`logicalSizeBytes`、`dataTransferBytes`              | `project.settings.quota`                                        |
| `autoscalingLimitMinCu`、`autoscalingLimitMaxCu`、`suspendTimeoutSeconds` | `project.default_endpoint_settings`                             |
| `enableLogicalReplication`                                                | `project.settings.enable_logical_replication`（开启后不可关闭） |
| `historyRetentionSeconds`                                                 | `project.history_retention_seconds`（全分支共享 PITR 窗口）     |

## API 面与请求流程

路由均在账号 router 下（`/database-namespaces/...`）。典型流程：

1. 解析 namespace：`SELECT FROM neon WHERE id = ? AND accountId = ?`
2. 不存在 → `NOT_FOUND`
3. 根据 `isLowCost` 选择 Neon 客户端
4. 使用 `projectId`（及 branch/database/role 标识）调用 Neon API

### Namespace CRUD

- **列表** — 按 `accountId` 查库，再按档位批量 `listProjects(search: accountId)`；列表缺失时回退 `getProject`
- **详情** — 库记录 + `getProject`
- **创建** — `createProject` 后 `INSERT neon`
- **更新** — patch Neon 项目设置 + 仅更新 Cared `name`
- **删除** — `deleteProject` 后删除 `neon` 行（无软删）

### 分支 / 数据库 / 角色

对 Neon SDK 的薄封装。`listBranches` 转发分页（`search`、`limit`、`cursor`），排序为 `created_at` 升序。

**敏感操作：** `getRolePassword`、`resetRolePassword` 返回凭据；调用方须按密钥处理，并依赖账号级鉴权。

**创建数据库：** `ownerName` 可选；未传入时，Cared 将 `owner_name` 设为与数据库 `name` 相同。

### 区域与 Postgres 版本

oRPC 将 `regionId` 限制为 `ALLOWED_DATABASE_REGIONS`（Neon 支持的 AWS 区域）。`pgVersion` 限制为 17–18（默认 17）。

## 鉴权与多租户

- 所有方法第一个参数为鉴权上下文中的 `accountId`。
- Namespace 行是**能力对象**：仅有 `namespaceId` 不足以访问，必须与 `accountId` 匹配。
- Neon API Key 仅平台后端持有；租户不接触组织级 Key。
- 在访问 Neon 前于 DB 查询层阻断跨账号访问。

## 运维与一致性

**列表性能：** 优先用组织级 `listProjects` + `search: accountId`，而非对每个 namespace 调用 `getProject`。混合档位账号仅在需要时并行拉取 free/paid 两个组织。

**删除顺序：** 先删 Neon project，再删 Cared 行。若 Neon 已删而 DB 删除失败，可能留下孤立映射（少见），需人工或对账处理。

**账号删除：** `neon.accountId` 引用 `account` 且**未**设置 `onDelete: cascade`。账号下仍有 namespace 时可能无法直接删账号，须先删 namespace——避免静默批量删除生产库。

**逻辑复制：** 通过设置开启后，Neon 不允许关闭；API 层应明确该约束。

## 当前未实现范围

以下 Neon 能力尚未在 `NeonService` 中暴露，后续可扩展：

- 计算 **endpoint**（创建/读取连接 URI）
- **Operations**（启停/挂起 endpoint）
- **Migrations** / schema diff
- **Consumption** 指标汇总至 Lago 计费
- **档位迁移**（低成本 → 标准：Neon 转移 API + 更新 Cared 元数据）

## 环境变量

| 变量                    | 用途                       |
| ----------------------- | -------------------------- |
| `NEON_FREE_ORG_API_KEY` | 低成本组织 API Key         |
| `NEON_FREE_ORG_ID`      | 低成本组织 id              |
| `NEON_PAID_ORG_API_KEY` | 标准档组织 API Key         |
| `NEON_PAID_ORG_ID`      | 标准档组织 id              |
| `NEON_PERSONAL_API_KEY` | 可选；`NeonService` 未使用 |

若缺少 free/paid API Key，`NeonService` 构造时会立即失败。

## 小结

Cared 将 **database namespace** 定义为账号持有的 Neon **project** 句柄：展示元数据与分层路由留在 Postgres，其余委托 Neon API。Neon project name 为账号 id，便于批量发现；Namespace name 是 Cared 中的用户可见名称。分支/数据库/角色 API 保留 Neon 数据模型以支持开发/生产工作流、PITR 分支与凭据管理，同时保持控制面精简、可审计，并与账号级隔离一致。
