# Cared 与 Appwrite 集成架构

本文说明 Cared 如何对接定制后的自部署 Appwrite，以提供 Functions 和 Sites 能力，同时不向 Cared 用户暴露 Appwrite 的组织、团队或项目模型。

## 目标

- 在 Cared Web 体验中隐藏 Appwrite 术语和概念。
- 将每个 Function 或 Site 约束在一个 Cared account 与一个或多个 Appwrite region 中。
- 对同一个逻辑资源，在跨 region 同步时保持 Appwrite 侧公开资源 ID 稳定一致。
- 以主 region 作为资源元数据和构建产物的事实来源。
- 使用持久化 workflow 编排多步骤、多 region 操作。
- 尽量通过 Appwrite 自身 API 和内部副作用机制，保持每个 Appwrite region 内部状态一致。

## 核心概念

Cared 会为每个 account 和每个 Appwrite region 映射一组专用的 Appwrite user、team、project 和 API key。这些资源在该 account 启用对应 region 时创建。

Cared 用户只看到 Cared 层面的 Functions、Sites、Deployments、Rules 和 Regions。Web 前端不应该出现 Appwrite、team、organization、project 等面向 Appwrite 内部模型的概念。

Function 或 Site 的主 region 是创建其 canonical Appwrite 资源的 region。对于多 region 资源，其他 secondary regions 会使用相同的公开 ID 镜像主 region 资源，但保留各自 Appwrite 本地的 internal sequence ID。

## Cared 数据模型

Cared 将集成元数据存储在 `packages/db/src/schema/appwrite.ts` 中定义的数据表里。

核心表：

- `AppwriteRegion`：从环境变量加载并持久化到 DB 的 region 配置。行 ID 即 region ID。
- `AppwriteFunction`：Cared account 范围内的 Function 记录。主键与 Appwrite function ID 一致。
- `AppwriteSite`：Cared account 范围内的 Site 记录。主键与 Appwrite site ID 一致。
- `AppwriteDeployment`：deployment 元数据。主键与 Appwrite deployment ID 一致。
- `AppwriteRule`：proxy rule 元数据。主键与 Appwrite rule ID 一致。

关联表用于记录 Functions、Sites、Deployments 和 Rules 分别存在于哪些 regions。Function 可以选择一个或多个 regions。Site 只能选择单 region 或所有 regions；不支持部分多 region Site，因为 Cloudflare Load Balancing 无法自然表达任意 region 子集的站点部署策略。

当创建资源时选择了多个 regions，第一个被选择的 region 就是主 region。

## API 层

Cared API service 拥有所有 Appwrite client 访问能力。Web 客户端只调用 Cared oRPC routes，不直接调用 Appwrite。

实现结构：

- 共享 Appwrite client、region/account credential 处理位于 `packages/api/src/service/appwrite/base.ts`。
- Function 相关行为位于 `packages/api/src/service/appwrite/functions.ts`。
- Site 相关行为位于 `packages/api/src/service/appwrite/sites.ts`。
- Temporal client、worker、workflows 和 activities 位于 `packages/api/src/workflows`。

对外暴露的 oRPC 和 service-layer DTO 字段，无论入参还是返回值，都应该使用小驼峰命名。

## Workflow 编排

包含多个持久化副作用的操作应使用 Temporal workflows。

推荐 workflow 形态：

- 每个 region 级 deployment 操作对应一个 workflow。
- 主 region deployment workflow 先执行。
- 只有当主 region deployment ready 之后，才启动 secondary region deployment workflows，因为此时构建产物才可用。
- secondary deployment sync 先将主 region 的 S3 对象复制到 secondary region 的相同 object paths，再调用 Appwrite deployment sync API。
- workflow activities 应尽量具备幂等性。
- Cared DB 应记录足够状态，以支持安全重试或补偿。

对于 Functions、Sites、Deployments、Rules 的 create/update/delete，Cared 需要协调：

1. Cared DB 状态。
2. 主 Appwrite region 状态。
3. secondary Appwrite regions 状态。
4. 涉及 Site 自定义域名时的 Cloudflare 状态。

只要资源表、region 关联表、workflow ID 和状态字段能提供足够的重试与 reconciliation 信息，就不需要额外引入 operation 表。

## Deployment 同步语义

主 region deployment：

- 通过 Appwrite 常规 deployment API 创建。
- 执行上传和构建。
- 在对象存储中产出 source 和 build artifacts。
- 更新 Appwrite deployment 的状态、`buildPath`、`buildSize`、`totalSize`，以及资源的 latest/active 指针。

secondary region deployment：

- 不应该重新 build。
- Cared 将主 region 的 S3 对象复制到 secondary region，并保持相同的 `sourcePath` 和 `buildPath`。
- Cared 使用主 region deployment 元数据调用 Appwrite deployment sync API。
- secondary Appwrite region 使用相同 deployment ID 创建或更新本地 deployment document，但使用本 region 的 `resourceInternalId` 和 deployment sequence。
- 如果调用方要求，secondary region 会更新本地 latest 和 active deployment 指针。

对于 Sites，deployment-trigger proxy rule 也必须使用相同 rule ID 和 domain 跨 regions 同步。

## Rule 语义

Deployment-trigger rules：

- 为 deployment 访问域名自动生成。
- 对同一个逻辑 deployment，生成的 ID/domain 前缀应在各 region 中保持一致。
- 对 Sites，Appwrite sync API 接收 deployment rule ID 和 deployment domain，避免 secondary regions 生成不同的规则。

Manual Function 自定义域名 rules：

- region-specific。
- 使用 Appwrite 原生域名验证和证书生成流程。
- Cared 可以显式生成 rule ID 并传给 Appwrite。

Manual Site 自定义域名 rules：

- 在该 Site 选中的所有 regions 中全局一致。
- Cared 绕过 Appwrite 的域名验证和证书生成流程。
- Cloudflare for SaaS 验证用户自定义 hostname 并终止 TLS。
- Cloudflare Load Balancing 选择健康的 Appwrite region endpoint，例如 `hil.sites.cared.work`。
- Appwrite 收到请求时仍带有 `Host: <用户自定义域名>`，因此仍可通过 proxy rule 定位到具体 Site。

## Cloudflare 职责

在 Site 自定义域名的多 region 模式下，Cared 负责：

- 创建和验证 Cloudflare for SaaS custom hostname。
- 通过 Cloudflare 管理证书生命周期。
- 配置指向各 region Appwrite Site 域名的 origins。
- 配置 load balancer 和 pools。
- 配置 health checks 与 failover 策略。

Appwrite 不应为这些 Site 自定义域名签发证书。

## 对自部署 Appwrite 的必要改造

Cared 需要定制版自部署 Appwrite。开源 Appwrite 需要扩展内部 sync APIs，以在保留 Appwrite region-local invariants 的同时，让 Cared 编排跨 region 状态。

需要新增的 API：

- Function sync resource APIs：
  - `POST /v1/functions/sync`
  - `PUT /v1/functions/:functionId/sync`
  - `DELETE /v1/functions/:functionId/sync`
- Site sync resource APIs：
  - `POST /v1/sites/sync`
  - `PUT /v1/sites/:siteId/sync`
  - `DELETE /v1/sites/:siteId/sync`
- Function deployment sync APIs：
  - `POST /v1/functions/:functionId/deployments/:deploymentId/sync`
  - `DELETE /v1/functions/:functionId/deployments/:deploymentId/sync`
- Site deployment sync APIs：
  - `POST /v1/sites/:siteId/deployments/:deploymentId/sync`
  - `DELETE /v1/sites/:siteId/deployments/:deploymentId/sync`
- Rule sync APIs：
  - `POST /v1/proxy/rules/function/sync`
  - `POST /v1/proxy/rules/site/sync`
  - `DELETE /v1/proxy/rules/:ruleId/sync`

重要 Appwrite 行为要求：

- Sync resource APIs 应与公开 create/update/delete APIs 分离。
- Function/Site sync APIs 可以复用 Appwrite 现有 actions，以保持 schedules、repositories、delete queues 等本地副作用一致。
- Deployment sync APIs 只导入 metadata。它们不能上传 source code，不能 enqueue builds，也不能重新生成 artifacts。
- Deployment sync APIs 必须接受显式 deployment ID。
- Site deployment sync APIs 必须接受显式 deployment-trigger rule ID 和 domain。
- Rule sync APIs 必须接受显式 rule ID。
- Rule sync APIs 必须幂等：如果同一 project、resource、domain 下存在匹配 rule，应更新本地 internal pointers，而不是失败。
- Rule sync APIs 必须支持为 Cloudflare 管理的 Site 自定义域名跳过 Appwrite 验证和证书生成流程。
- Delete sync APIs 在安全时应具备幂等性：目标资源已不存在时也返回成功。
- Deployment delete 仍应 enqueue Appwrite delete worker，让对象存储清理、screenshots/build artifact 清理继续使用 Appwrite 现有流程。

## 一致性说明

跨 region 一致性由 Cared 编排保证，而不是由 Appwrite 内部复制保证。

在每个 Appwrite region 内：

- Appwrite 本地 DB sequence ID 是 region-local，不能从其他 region 复制。
- Functions、Sites、Deployments 和共享 Rules 的公开 ID 可以复制。
- `resourceInternalId`、`deploymentInternalId`、`latestDeploymentInternalId`、active deployment fields 等本地指针必须基于本 region 的 Appwrite documents 重新计算。
- Appwrite 现有 workers 应继续处理 delete cleanup 和其他异步本地副作用。

重试不应为同一个逻辑同步资源生成新 ID。如果 sync API 使用相同 IDs 和匹配 ownership 被调用多次，它应收敛到调用方要求的状态。

