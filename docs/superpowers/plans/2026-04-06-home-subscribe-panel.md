# Home Subscribe Panel Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在首页新增通知订阅面板，支持微信小程序一次订阅 3 个模板并逐条上报订阅结果到后端。

**Architecture:** 通过首页组件 `SubscribePanel` 承载交互，平台能力与状态映射收口到 `useNotificationSubscribe` hook，模板配置固定在常量文件中。订阅结果按模板映射为后端请求体并发上报，失败项在面板内可重试，H5 仅展示提示不触发微信接口。

**Tech Stack:** uni-app (Vue3 + TypeScript), Pinia（现有）, uni.requestSubscribeMessage, 现有 request/service 封装

---

## File Structure

- Create: `src/constants/notification.ts`（固定 3 个模板配置与展示文案）
- Modify: `src/types/notification.ts`（补充前端订阅流程类型）
- Modify: `src/services/notification.ts`（增加批量上报辅助方法）
- Create: `src/hooks/use-notification-subscribe.ts`（订阅申请、结果解析、上报、重试）
- Create: `src/components/notification/SubscribePanel.vue`（UI 与交互）
- Modify: `src/pages/home/index.vue`（接入订阅面板）
- Modify: `docs/wechat-subscribe-integration-guide.md`（补充“3 模板固定配置 + 首页引导”说明）

## Preconditions

- 必须先拿到 3 组真实模板信息：`template_code`、`wechat_template_id`、`name`（缺一不可）
- 在真实模板信息提供前，只允许提交类型与流程代码，不提交带伪造模板 id 的配置

## Chunk 1: Domain Types and Service Contracts

### Task 1: 固定模板常量与类型定义

**Files:**
- Create: `src/constants/notification.ts`
- Modify: `src/types/notification.ts`
- Test: `pnpm type-check`

- [ ] **Step 1: 在类型文件添加订阅流程类型定义**

```ts
export interface SubscribeTemplateConfig {
  templateCode: string
  wechatTemplateId: string
  name: string
  description: string
}

export type SubscribeDecision = 'accept' | 'reject' | 'ban' | 'filter'
```

- [ ] **Step 2: 运行类型检查，确认新增类型不破坏现有代码**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 使用真实模板信息创建固定 3 模板常量文件**

```ts
export const SUBSCRIBE_TEMPLATES: SubscribeTemplateConfig[] = [
  { templateCode: '<REAL_CODE_A>', wechatTemplateId: '<REAL_ID_A>', name: '模板A', description: '待补充' },
  { templateCode: '<REAL_CODE_B>', wechatTemplateId: '<REAL_ID_B>', name: '模板B', description: '待补充' },
  { templateCode: '<REAL_CODE_C>', wechatTemplateId: '<REAL_ID_C>', name: '模板C', description: '待补充' },
]
```

- [ ] **Step 4: 运行类型检查，确保类型与常量通过**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 5: Commit（仅在真实模板值已填写后执行）**

```bash
git add src/constants/notification.ts src/types/notification.ts
git commit -m "feat: add fixed subscribe template configs and types"
```

### Task 2: 订阅结果上报服务增强

**Files:**
- Modify: `src/services/notification.ts`
- Test: `pnpm type-check`

- [ ] **Step 1: 先写批量上报 helper 签名与返回类型**

```ts
export interface SubscribeReportItem {
  template_code: string
  wechat_template_id: string
  status: SubscribeReportStatus
}

export async function reportSubscribeResults(items: SubscribeReportItem[]) {
  return Promise.allSettled(items.map((item) => reportSubscribeResult(item)))
}

export interface SubscribeReportBatchResult {
  successCount: number
  failedItems: SubscribeReportItem[]
}
```

- [ ] **Step 2: 运行类型检查，验证签名完整**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 实现最小批量上报 helper 并暴露统一返回结构**

```ts
const settled = await Promise.allSettled(items.map((item) => reportSubscribeResult(item)))
const failedItems = items.filter((_, idx) => settled[idx]?.status === 'rejected')

return {
  successCount: settled.filter((item) => item.status === 'fulfilled').length,
  failedItems,
}
```

- [ ] **Step 4: 再次运行类型检查**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/notification.ts
git commit -m "feat: add batch subscribe report helper"
```

## Chunk 2: Subscription Workflow Logic

### Task 3: 实现订阅 hook（平台判断 + 结果映射 + 重试）

**Files:**
- Create: `src/hooks/use-notification-subscribe.ts`
- Modify: `src/types/notification.ts`
- Modify: `src/services/notification.ts`
- Test: `pnpm type-check`

- [ ] **Step 1: 先写 hook 对外 API 与状态类型（loading/result/error）**

```ts
export function useNotificationSubscribe() {
  const loading = ref(false)
  const summary = ref({ accept: 0, reject: 0, ban: 0, filter: 0, reportFailed: 0 })
  const lastError = ref('')
  async function requestAndReport() {}
  async function retryFailedReports() {}
  return { loading, summary, lastError, requestAndReport, retryFailedReports }
}
```

- [ ] **Step 2: 运行类型检查，确认占位实现已连通导出**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 实现 `uni.requestSubscribeMessage` 调用和结果解析**

```ts
const tmplIds = SUBSCRIBE_TEMPLATES.map((item) => item.wechatTemplateId)
const res = await uni.requestSubscribeMessage({ tmplIds })
// 将 res[wechatTemplateId] 映射为 SubscribeReportStatus
```

- [ ] **Step 4: 实现逐条上报、失败缓存与重试逻辑（Promise.allSettled）**

```ts
failedReports.value = mappedItems.filter((_, idx) => settled[idx]?.status === 'rejected')
```

- [ ] **Step 5: 加入平台与异常分支**

```ts
if (!isWeixinMiniProgram()) {
  lastError.value = '仅微信小程序支持订阅消息'
  return
}
```

- [ ] **Step 6: 运行类型检查**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/hooks/use-notification-subscribe.ts src/types/notification.ts src/services/notification.ts
git commit -m "feat: implement subscribe workflow hook with report retry"
```

## Chunk 3: UI Integration and Verification

### Task 4: 新增首页订阅面板组件

**Files:**
- Create: `src/components/notification/SubscribePanel.vue`
- Create/Modify: `src/constants/notification.ts`
- Test: `pnpm type-check`

- [ ] **Step 1: 写组件静态结构（模板列表、主按钮、结果区、重试按钮）**

```vue
<button class="subscribe-button" :disabled="loading" @tap="onSubscribeTap">一键订阅通知（3项）</button>
```

- [ ] **Step 2: 运行类型检查，确认模板与 props/emits 正常**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 接入 hook 状态与文案映射**

```ts
const { loading, summary, lastError, requestAndReport, retryFailedReports } = useNotificationSubscribe()
```

- [ ] **Step 4: 添加 H5 提示和小程序专属按钮禁用文案**

```vue
<text v-if="!isMpWeixin">仅微信小程序支持订阅消息</text>
```

- [ ] **Step 5: 运行类型检查**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/notification/SubscribePanel.vue src/constants/notification.ts
git commit -m "feat: add subscribe panel component for home page"
```

### Task 5: 首页接入与文档更新

**Files:**
- Modify: `src/pages/home/index.vue`
- Modify: `docs/wechat-subscribe-integration-guide.md`
- Test: `pnpm type-check`, `pnpm lint`, `pnpm build:mp-weixin`, `pnpm build:h5`

- [ ] **Step 1: 在首页接入 `SubscribePanel`，保持现有 hero 区块不破坏**

```vue
<subscribe-panel class="home-subscribe-panel" />
```

- [ ] **Step 2: 运行类型检查，确保首页引用正确**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: 更新订阅集成文档（固定 3 模板、手动触发、逐条上报）**

```md
- 首页订阅按钮触发 `uni.requestSubscribeMessage`
- 3 个模板返回状态逐条上报 `/api/v1/user/subscribe/report`
```

- [ ] **Step 4: 运行 lint 并修复问题**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 5: 运行构建验证（小程序 + H5）**

Run: `pnpm build:mp-weixin`
Expected: PASS

Run: `pnpm build:h5`
Expected: PASS

- [ ] **Step 6: 手工验收（微信开发者工具）**

Run: 打开首页，点击“一键订阅通知（3项）”
Expected:
- 仅点击后触发订阅
- 返回 3 模板状态
- 成功后逐条上报
- 失败项可重试

- [ ] **Step 7: Commit**

```bash
git add src/pages/home/index.vue docs/wechat-subscribe-integration-guide.md
git commit -m "feat: integrate home subscribe panel and document workflow"
```

## Final Validation Checklist

- [ ] 三个模板配置已替换为真实 `template_code` 与 `wechat_template_id`
- [ ] 订阅仅用户点击触发，不在页面打开时自动拉起
- [ ] 每个模板结果都上报到 `POST /api/v1/user/subscribe/report`
- [ ] `accept/reject/ban/filter` 映射完整
- [ ] 失败重试链路可用
- [ ] `pnpm type-check`、`pnpm lint`、`pnpm build:mp-weixin`、`pnpm build:h5` 全通过
