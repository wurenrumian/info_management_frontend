# Phase2 微信通知联调前端设计（登录页开发面板）

## 1. 背景与目标

后端已提供 Phase2 微信相关 API，前端需要尽快提供可操作的联调入口，用于验证“开发环境快捷登录 + 订阅状态记录 + 订阅消息发送”的完整链路。

本设计采用方案 A：在现有登录页开发面板中新增“订阅通知联调”能力，优先实现最短测试路径。

## 2. 范围与非目标

### 2.1 本次范围

1. 新增开发环境通知联调接口常量与 service 方法
2. 在 `pages/auth/login` 的开发面板增加联调表单
3. 支持提交 `dev/login-and-send-subscribe-check` 所需参数并展示结果
4. 复用现有 token / user store 逻辑，保证联调后可进入已登录状态

### 2.2 非目标

1. 不改动正式环境微信登录/绑定主流程
2. 不新增独立调试页面与复杂日志系统
3. 不引入新的全局 store 或跨模块组件

## 3. 方案对比与结论

### 方案 A：登录页开发面板扩展（采用）

- 优点：最小改动、复用现有 auth 逻辑、最快联调
- 缺点：开发能力集中在登录页，后续可能需要拆分

### 方案 B：个人主页新增联调入口

- 优点：登录后测试体验自然
- 缺点：页面职责变重，且需额外处理登录前后状态

### 方案 C：新增独立调试页

- 优点：结构清晰，扩展性好
- 缺点：改动范围更大，不符合当前“快速验证”目标

## 4. 架构与文件变更

1. `src/constants/api.ts`
   - 新增 `API_AUTH_DEV_LOGIN_SUBSCRIBE_CHECK`
2. `src/services/auth.ts`
   - 新增 `devLoginAndSendSubscribeCheck` 方法
3. `src/types/user.ts`（或 auth 相关类型文件）
   - 新增请求/响应类型，约束 `status`、`template_data` 等字段
4. `src/pages/auth/login.vue`
   - 在 `isDev` 面板新增“订阅通知联调”输入区与提交按钮
   - 展示接口返回结果（订阅状态、发送结果、错误信息）

## 5. 数据流设计

1. 用户填写（或使用默认）联调参数
2. 前端调用 `POST /api/v1/dev/login-and-send-subscribe-check`
3. 响应成功后：
   - 设置 token 到 `userStore`
   - 更新 userInfo（优先 `getUserInfo`，失败回退接口内 user）
   - 页面展示 `subscription_status` / `send_ok` / `send_error`
4. 响应失败后：
   - 展示明确错误 toast
   - 保留当前表单输入便于重试

## 6. 参数策略与默认值

为了便于快速测试，开发面板提供后端约定默认值：

- `template_code`: `dev_login_check`
- `wechat_template_id`: `tmpl_dev_login_check`
- `status`: `accept`
- `open_id`: 允许留空（后端可自动生成）
- `page`: `/pages/index/index`
- `template_data.thing1.value`: `Dev登录订阅验证`

`role` 保持与现有开发登录一致（1-4）。

## 7. 错误处理

1. 前端必填校验：`student_id` 必填
2. 服务端错误原样透传（如 `missing student_id`、`invalid role`、`status must be accept or reject`）
3. 非 dev 环境返回 403 时，展示后端错误文案并引导使用常规登录流程
4. 若 `send_ok=false` 但请求 200，页面展示业务失败信息而不是误报“联调成功”

## 8. 验收标准

1. 在开发环境可从登录页直接触发通知联调接口
2. 能看到 `subscription_status`、`send_ok`、`send_error` 返回值
3. 触发成功后本地 token 与用户态可用，页面可继续访问登录后页面
4. 不影响现有 `wechatLogin` / `bindStudent` / `devLogin` 功能

## 9. 风险与控制

- 风险：后端默认值与文档不一致
  - 控制：前端允许手动编辑关键字段，避免硬编码死锁
- 风险：小程序/H5 下 `uni.login` 差异影响联调
  - 控制：该接口走 dev 直连，不依赖 `uni.login` code
- 风险：登录页开发面板过于复杂
  - 控制：仅在 `isDev` 下显示，生产环境不可见
