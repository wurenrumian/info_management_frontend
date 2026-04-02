# 个人主页（小程序底部导航 / H5 左侧导航）设计

## 1. 背景与目标

当前前端希望新增个人主页，但后端接口实现与前端现有调用存在命名差异。目标是在不阻塞开发的前提下，优先复用后端已存在 API，上线可用的个人主页，并维护缺失 API 清单以支持后续后端迭代。

本设计采用 C 方案：**先前端聚合适配（A），后续可切换后端聚合接口（B）**。

## 2. 范围与非目标

### 2.1 本次范围

1. 新增个人主页页面（Profile Home）
2. 页面包含四个模块：
   - 基本信息
   - 账号状态
   - 快捷入口
   - 资料扩展占位（头像/简介占位）
3. 跨端布局策略：
   - 小程序：底部导航布局
   - H5：左侧导航布局
4. 新增前端聚合服务，屏蔽后端路径和字段差异
5. 新增 API 缺口文档目录与首版缺口清单

### 2.2 非目标

1. 本次不实现后端新接口
2. 本次不实现完整个人资料编辑流
3. 本次不做复杂个性化主题或皮肤配置

## 3. 方案对比与结论

### 方案 A：前端兼容层聚合（现有 API）

- 优点：开发快、后端无阻塞、风险低
- 缺点：前端存在一定组装逻辑

### 方案 B：后端先提供聚合接口

- 优点：前端最简洁，请求更集中
- 缺点：依赖后端排期，当前无法快速上线

### 方案 C：先 A 后 B（最终采用）

- 短期落地：先用 A 完成可用版本
- 中期演进：维护缺口文档，推动后端补齐
- 长期收敛：切换到 B，保持页面层零改动

## 4. 架构设计

### 4.1 页面与服务分层

1. 页面层只消费 `ProfileHomeViewModel`
2. 聚合层负责多接口请求、字段映射、降级与容错
3. 基础服务层继续复用现有 `src/services/*`

### 4.2 建议文件

- `src/pages/profile/index.vue`：个人主页页面
- `src/services/profile.ts`：个人主页聚合服务
- `src/types/profile.ts`：个人主页视图模型类型
- `docs/api-gaps/backend-required-apis.md`：后端 API 缺口清单

### 4.3 平台布局策略

1. 导航骨架与内容区分离，内容组件复用
2. 小程序端采用底部导航模式
3. H5 端采用左侧侧边导航模式
4. 平台判断统一通过 `src/utils/platform.ts`

## 5. 数据流与兼容策略

### 5.1 数据加载流程

页面进入后并行请求：

- `baseInfo`（核心）
- `announcements`（增强）
- `approvals`（增强）
- `knowledge`（增强）

其中 `baseInfo` 为必需数据，其余模块失败不阻塞主页渲染。

### 5.2 接口路径兼容

1. 用户信息：优先 `GET /api/v1/me`，失败后回退到现有前端路径
2. 审批数据：优先对接“我的审批”接口；若缺失则降级为通用列表或占位
3. 其他模块：以文档已存在接口为主，无法满足时文档化缺口

### 5.3 视图模型（示意）

```ts
interface ProfileHomeViewModel {
  basic: {
    id: number
    studentId: string
    name: string
    role: string
    className?: string
    grade?: string
    major?: string
  }
  account: {
    hasToken: boolean
    wechatBound?: boolean
  }
  quickEntry: {
    announcementsCount?: number
    approvalsCount?: number
    knowledgeCount?: number
  }
  profileExt: {
    avatarUrl?: string
    bio?: string
    editable: boolean
  }
}
```

## 6. 错误处理与降级策略

1. `baseInfo` 加载失败：显示错误态和重试按钮
2. 增强模块失败：显示“暂无数据/加载失败”，主页主体正常展示
3. 缺口场景统一登记到 API 缺口文档，标注优先级与临时方案

## 7. API 缺口文档规范

### 7.1 目录与文件

- 目录：`docs/api-gaps/`
- 文件：`backend-required-apis.md`

### 7.2 条目模板

- 接口名
- Method + Path
- 业务用途
- 请求参数
- 响应示例
- 鉴权要求
- 优先级（P0/P1/P2）
- 前端临时降级方案

### 7.3 首批候选缺口

1. `GET /api/v1/profile/home`（聚合接口，P1）
2. `PATCH /api/v1/me`（资料编辑，P1）
3. `GET /api/v1/approvals/me/summary`（审批统计，P2）
4. `GET /api/v1/notifications/unread/count`（未读数，P2）

## 8. 测试与验收

1. 仅依赖现有后端 API 时，主页基础信息可展示
2. 任一增强模块失败不影响基础信息与页面可用性
3. 小程序端为底部导航布局，H5 端为左侧导航布局
4. 页面不直接依赖后端原始字段，统一通过 ViewModel
5. 缺失能力可在文档中追踪（含优先级、降级策略）

## 9. 风险与控制

- 风险：后端文档与真实实现存在偏差
  - 控制：服务层保留兼容路径与错误兜底
- 风险：跨端导航骨架导致样式分叉
  - 控制：内容区组件化，导航与内容分层
- 风险：统计类数据接口短期不足
  - 控制：先展示占位与轻量指标，并沉淀缺口文档

## 10. 实施里程碑

1. 完成 `profile` 聚合服务与类型
2. 完成个人主页内容区
3. 完成小程序/ H5 双端导航骨架适配
4. 完成 API 缺口文档首版
5. 联调验证并进入后续后端接口收敛阶段
