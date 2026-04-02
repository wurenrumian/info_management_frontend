# 前端开发规范（Team Development Standard）

本规范用于多人并行开发，目标是：
- 减少冲突
- 提高可集成性
- 让每个模块可独立开发与验证

适用范围：本仓库所有前端开发（uni-app + Vue3）、页面、组件、状态管理、接口调用与提交流程。

---

## 1. 技术基线

- 框架：uni-app（Vue3 + TypeScript）
- 目标平台：微信小程序（优先）、H5（兼容）
- Node.js：>= 18.x（具体版本以 `.nvmrc` 或 `package.json` engines 为准）
- 包管理器：pnpm（推荐）或 npm，团队统一
- 构建工具：HBuilderX 或 uni-app CLI（vite）
- 状态管理：Pinia
- 请求库：uni.request 封装（统一 service 层）

约束：
- 禁止在页面/组件中直接写 `uni.request` 调用，必须经过 service 层
- 禁止硬编码接口地址，必须通过环境变量注入
- 禁止在组件中直接操作全局 store 做表单临时状态管理

---

## 2. 统一目录约定（强制）

```text
src/
├── pages/                          # 主包页面（按模块分目录）
│   ├── auth/                       # 登录绑定
│   ├── home/                       # 首页
│   └── ...
├── subpackages/                    # 分包页面（按模块分目录）
│   ├── knowledge/                  # 知识库模块
│   ├── announcements/              # 信息发布模块
│   ├── approvals/                  # 审批流程模块
│   ├── partyflow/                  # 党团流程模块
│   └── profile/                    # 个人中心
├── components/                     # 全局通用组件
│   └── common/                     # 基础组件（按钮、表单、弹窗等）
├── services/                       # 接口调用层（按模块分文件）
│   ├── auth.ts
│   ├── knowledge.ts
│   ├── announcements.ts
│   ├── approvals.ts
│   ├── partyflow.ts
│   └── request.ts                  # 请求封装
├── stores/                         # Pinia stores（按模块分文件）
│   ├── user.ts
│   ├── knowledge.ts
│   ├── announcements.ts
│   ├── approvals.ts
│   └── partyflow.ts
├── hooks/                          # 组合式函数
│   ├── useAuth.ts
│   ├── usePagination.ts
│   └── ...
├── utils/                          # 工具函数
│   ├── platform.ts                 # 平台差异处理
│   ├── format.ts
│   └── ...
├── types/                          # TypeScript 类型定义
│   ├── api.ts                      # 接口入参/出参类型
│   ├── user.ts
│   ├── knowledge.ts
│   ├── announcements.ts
│   ├── approvals.ts
│   └── partyflow.ts
├── constants/                      # 常量定义
│   ├── api.ts                      # 接口路径常量
│   ├── enums.ts                    # 枚举常量
│   └── config.ts
├── static/                         # 静态资源
├── App.vue                         # 应用入口
├── main.ts                         # 挂载入口
├── manifest.json                   # uni-app 配置
├── pages.json                      # 页面路由配置
└── env.d.ts                        # 类型声明
```

禁止项：
- 禁止在 `pages/` 下创建非模块目录（所有页面必须按模块归类）
- 禁止把 service 调用直接写在页面/组件的 `<script>` 中（必须抽到 hooks 或 methods 中统一管理）
- 禁止跨模块直接引用内部文件（如 `subpackages/knowledge` 不能直接 import `subpackages/approvals` 的内部组件）

---

## 3. 模块并行开发与代码归属

当前并行模块（与后端模块对应）：
- `auth`（登录与身份绑定，基础模块）
- `knowledge`（知识库与问答）
- `announcements`（信息发布与推送）
- `approvals`（审批流程）
- `partyflow`（党团流程管理）

每个模块代码必须放在以下位置：
- 页面：`src/pages/<module>/` 或 `src/subpackages/<module>/`
- 组件：`src/components/<module>/`（模块专属组件）或 `src/components/common/`（通用组件）
- Service：`src/services/<module>.ts`
- Store：`src/stores/<module>.ts`
- Types：`src/types/<module>.ts`
- 常量：`src/constants/<module>.ts`

示例（knowledge 模块）：
- `src/subpackages/knowledge/index.vue`
- `src/subpackages/knowledge/search.vue`
- `src/subpackages/knowledge/detail.vue`
- `src/components/knowledge/KnowledgeCard.vue`
- `src/services/knowledge.ts`
- `src/stores/knowledge.ts`
- `src/types/knowledge.ts`

### 共享服务约定

`src/services/request.ts` 为统一请求封装，所有模块需要网络请求能力时：
- 通过 `request.ts` 导出的方法发起请求
- 禁止各模块自行封装 `uni.request`
- 统一错误处理、token 注入、loading 状态由 `request.ts` 管理

---

## 4. 路由与页面规范

- 主包页面放在 `src/pages/<module>/`，分包页面放在 `src/subpackages/<module>/`
- 页面文件名使用小写 + 短横线（如 `detail.vue`、`search-result.vue`）
- 每个页面必须在 `pages.json` 中正确注册
- 分包原则：
  - 非首屏必需的页面放入分包
  - 单个分包大小不超过 4MB（微信小程序限制）
  - 独立功能模块应独立分包
- 页面参数通过 URL query 传递，类型在 `src/types/` 中定义
- 页面与组件职责边界：
  - 页面负责：数据获取、状态管理、布局编排
  - 组件负责：UI 展示、用户交互、局部状态

---

## 5. 接口调用与数据流规范

- 所有接口调用必须通过 `src/services/<module>.ts`
- Service 层只负责：请求构造、参数校验、类型转换、错误映射
- 禁止在页面/组件中直接拼接口 URL
- 接口路径统一在 `src/constants/api.ts` 中定义
- 接口入参/出参类型统一在 `src/types/api.ts` 或对应模块类型文件中定义

请求封装约定（`src/services/request.ts`）：
- 统一 base URL 通过环境变量注入
- 自动注入 JWT token（`Authorization: Bearer <token>`）
- 统一错误处理（401 跳转登录、403 提示权限、500 提示服务异常）
- 支持 loading 状态管理
- 返回统一格式：`{ data: T }` 或抛出错误

```typescript
// Service 层示例
import { request } from './request'
import type { KnowledgeItem, KnowledgeSearchParams } from '@/types/knowledge'
import { API_KNOWLEDGE_SEARCH } from '@/constants/api'

export function searchKnowledge(params: KnowledgeSearchParams) {
  return request<KnowledgeItem[]>({
    url: API_KNOWLEDGE_SEARCH,
    method: 'GET',
    data: params,
  })
}
```

---

## 6. 状态管理规范

- 使用 Pinia 管理全局状态
- Store 按模块拆分：`src/stores/<module>.ts`
- 以下状态放入全局 store：
  - 用户信息（登录态、角色、权限）
  - 跨页面共享的数据（如通知未读数）
  - 需要持久化的配置
- 以下状态留在页面/组件内部：
  - 表单临时状态
  - 页面局部 UI 状态（如展开/收起、弹窗显示）
  - 一次性数据（如搜索结果列表）
- Store 中禁止：
  - 直接调用 `uni.request`（通过 service 层）
  - 存储大量列表数据（考虑分页和缓存策略）

---

## 7. 平台差异处理规范

- 平台差异判断统一收口到 `src/utils/platform.ts`
- 禁止在页面/组件中到处写 `#ifdef MP-WEIXIN` / `#ifdef H5`
- 平台差异处理原则：
  - 优先使用 uni-app 跨平台 API
  - 必须区分平台时，封装为工具函数或 hooks
  - 微信小程序特有能力（订阅消息、分享等）单独封装

```typescript
// utils/platform.ts 示例
export function isWeixinMiniProgram(): boolean {
  return uni.getSystemInfoSync().platform === 'devtools' ||
    uni.getSystemInfoSync().platform === 'ios' ||
    uni.getSystemInfoSync().platform === 'android'
}

export function shareToWeixin(title: string, path: string): void {
  // #ifdef MP-WEIXIN
  uni.showShareMenu({ withShareTicket: true })
  // #endif
}
```

---

## 8. UI 与交互规范

- 组件命名：大驼峰（PascalCase），如 `KnowledgeCard.vue`
- 页面文件命名：小写 + 短横线，如 `search-result.vue`
- 样式使用 scoped，避免全局污染
- 统一间距、字号、颜色通过 CSS 变量或设计 token 管理
- 加载态、空态、错误态、权限态必须有明确 UI 反馈
- 表单验证：
  - 前端校验 + 后端校验双重保障
  - 错误提示明确具体字段
- 权限态：
  - 根据用户角色显示/隐藏操作按钮
  - 无权限操作时给出明确提示

---

## 9. 测试与验证规范

最低验证要求（合并前必须通过）：
- `npm run lint` 或 `pnpm lint` 通过
- `npm run type-check` 或 `vue-tsc --noEmit` 通过
- `npm run build:mp-weixin` 微信小程序构建成功
- `npm run build:h5` H5 构建成功

建议补充：
- 核心页面手测清单（登录、知识库搜索、信息发布、审批提交）
- 接口联调验证（对照后端 API 文档逐项验证）
- 多端验证（微信小程序 + H5 各跑一遍核心流程）

---

## 10. 环境变量与配置规范

- 环境变量文件：
  - `.env.development` — 开发环境
  - `.env.test` — 测试环境
  - `.env.production` — 生产环境
- 必须配置的环境变量：
  - `VITE_API_BASE_URL` — 后端接口 base URL
  - `VITE_WECHAT_APP_ID` — 微信小程序 AppID
- 禁止提交 `.env` 文件到仓库（加入 `.gitignore`）
- 敏感信息（AppSecret、JWT Secret 等）不得出现在前端代码中

---

## 11. 分支与提交规范

分支命名建议：
- `feat/<module>-<topic>`
- `fix/<module>-<topic>`
- `docs/<topic>`

提交信息：
- `<type>: <summary>`
- type: `feat|fix|docs|refactor|test|chore`

建议每个任务一个 commit，避免"超大混合提交"。

---

## 12. 前后端联调流程

1. 先对齐 API 文档（后端 `docs/api/`）
2. 前端根据 API 文档定义 types 和 service 层
3. 使用 mock 数据开发页面（可选）
4. 后端接口就绪后联调
5. 接口变更流程：
   - 后端先改 `docs/api/*.md`
   - 前端同步更新 types 和 service 层
   - 必须在 PR 中明确"兼容/不兼容"

联调检查清单：
- [ ] 接口路径、方法、参数类型与后端文档一致
- [ ] 鉴权 token 正确注入
- [ ] 错误码处理完整（400/401/403/404/500）
- [ ] 列表接口分页参数正确（limit/offset）
- [ ] 文件上传/下载接口测试通过

---

## 13. 文档要求

每个模块至少提供：
- 模块说明（职责、页面列表）
- 接口依赖（依赖哪些后端 API）
- 页面结构说明
- 权限规则（哪些角色可访问）

推荐位置：
- 设计与计划：`docs/superpowers/specs/`、`docs/superpowers/plans/`
- API 依赖说明：`docs/api-dependencies/`（可选）

并行开发要求：
- 每个并行模块都必须有对应 spec 文档（可先提交 v0 占位稿）
- 开发前完成 plan 文档
