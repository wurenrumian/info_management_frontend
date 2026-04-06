# 首页通知订阅面板设计（微信小程序多模板订阅）

## 1. 背景与目标

用户希望在首页增加一个通知订阅面板，支持一次性订阅 3 个微信模板消息，并将每个模板的订阅结果上报后端，以保障后续通知能力可用。

约束条件：

- 前端不实现后台模板管理（模板信息由前端常量维护）
- 目标平台优先微信小程序，H5 保持兼容
- 一次固定订阅 3 个模板（项目内不支持动态扩容）
- 每次进入小程序首页都可看到订阅引导入口

## 2. 范围与非范围

### 2.1 范围

- 首页新增通知订阅面板
- 微信小程序调用 `uni.requestSubscribeMessage` 申请 3 个模板
- 按模板逐条上报 `accept/reject/ban/filter` 到后端
- 展示本次订阅与上报结果摘要

### 2.2 非范围

- 不接入 `admin/notification/templates` 的创建与读取
- 不实现后端推送回调处理逻辑（由后端处理）
- 不扩展超过 3 个模板的业务配置界面

## 3. 用户体验与交互流程

1. 用户进入首页，看到“通知订阅面板”（每次进入都展示）
2. 用户点击“一键订阅通知（3项）”
3. 微信客户端弹出订阅选择框（由用户手动确认）
4. 前端拿到 3 个模板各自状态
5. 前端逐条上报后端 `POST /api/v1/user/subscribe/report`
6. 页面展示结果：同意数量、拒绝数量、上报失败数量

说明：

- 若用户勾选“总是保持以上选择，不再询问”，后续触发时通常不再重复询问
- 由于微信能力限制，不能在无用户交互时直接拉起订阅系统弹窗

## 4. 架构与模块设计

### 4.1 页面与组件

- 页面接入：`src/pages/home/index.vue`
- 新增组件：`src/components/notification/SubscribePanel.vue`

组件职责：

- 展示模板列表与按钮
- 触发订阅申请
- 汇总并展示结果
- 触发失败项重试上报

### 4.2 配置与常量

- 新增通知模板常量文件（建议）：`src/constants/notification.ts`
- 常量结构包含：`template_code`、`wechat_template_id`、`name`

示意结构：

```ts
export interface SubscribeTemplateConfig {
  templateCode: string
  wechatTemplateId: string
  name: string
}
```

### 4.3 服务层

复用现有 `src/services/notification.ts` 中：

- `reportSubscribeResult(payload)`
- `getUnreadNotificationCount()`（可用于首页未读数展示）

遵循规范：页面不直接 `uni.request`，仅调用 service。

## 5. API 与数据映射

### 5.1 微信订阅 API

调用：

```ts
uni.requestSubscribeMessage({ tmplIds: [id1, id2, id3] })
```

返回（示意）：

```json
{
  "errMsg": "requestSubscribeMessage:ok",
  "tmpl_id_1": "accept",
  "tmpl_id_2": "reject",
  "tmpl_id_3": "filter"
}
```

### 5.2 后端上报 API

逐条调用 `POST /api/v1/user/subscribe/report`：

```json
{
  "template_code": "deadline_remind",
  "wechat_template_id": "tmpl_123",
  "status": "accept"
}
```

状态值严格映射：`accept/reject/ban/filter`。

## 6. 错误处理与兼容策略

### 6.1 微信接口失败

- `10001/10004/20003`：配置错误，提示联系管理员
- `20004`：用户主开关关闭，提示前往小程序设置开启
- `20005`：小程序订阅能力异常，提示稍后重试
- `10005`：当前场景不可展示，提示回到前台后重试

### 6.2 上报失败

- 使用 `Promise.allSettled` 并发上报，记录失败项
- 展示“部分上报失败，可重试”
- 提供“重试上报失败项”操作

上报接口异常处理：

- `401`：按现有鉴权流程跳转登录，并保留本次结果摘要
- `403`：提示“当前账号暂无上报权限，请联系管理员”
- `500` 或网络超时：提示“服务暂不可用，可稍后重试上报”

### 6.3 平台兼容

- 仅在 `mp-weixin` 下启用订阅能力
- H5 展示说明文案，不调用微信接口

## 7. 状态与文案

- 全部同意：`已开启 3 项通知，后续将按你的设置发送提醒`
- 部分同意：`已开启部分通知，建议补充开启剩余模板`
- 全部未同意：`当前未开启可用通知，可能影响提醒送达`
- 上报失败：`订阅已完成，但结果同步失败，请重试`

## 8. 测试与验收标准

### 8.1 功能验收

- 一次订阅请求包含 3 个模板 id
- 仅在用户点击按钮后触发订阅接口，不允许页面进入时自动拉起弹窗
- 微信返回 3 条结果后，均可对应上报后端
- 后端可收到正确 `template_code/wechat_template_id/status`
- 每次进入首页都可见订阅面板
- 失败项重试后可补齐上报结果
- H5 无报错并有清晰提示

### 8.2 质量验收

- `pnpm lint` 通过
- `pnpm type-check` 通过
- `pnpm build:mp-weixin` 通过
- `pnpm build:h5` 通过

## 9. 需要用户补充的数据

实现前需由用户提供 3 个模板的完整信息：

1. 模板 A：`template_code`、`wechat_template_id`、展示名称
2. 模板 B：`template_code`、`wechat_template_id`、展示名称
3. 模板 C：`template_code`、`wechat_template_id`、展示名称

---

该设计已按“模板写死 + 首页持续引导 + 手动触发订阅 + 结果逐条上报后端”的方向确认。
