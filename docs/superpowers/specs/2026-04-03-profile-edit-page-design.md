# 个人主页拆分编辑页（Profile Edit Page）设计

## 1. 背景与目标

当前 `src/pages/profile/index.vue` 承载了展示、联调、订阅测试等多类能力，页面职责偏重。后端 Phase1 API 已提供资料读写能力（`GET /api/v1/me`、`PATCH /api/v1/me`、文件上传），可支持将资料编辑能力从主页中拆出。

本次目标：

1. 保留主页为“信息展示 + 入口分发”
2. 新增独立编辑页，承载个人资料编辑流程
3. 对齐后端字段语义（`real_name` 只读、`nickname` 可编辑）
4. 保持前端 service/type 分层，符合开发规范

## 2. 范围与非范围

### 2.1 范围（P0）

- 新增 `src/pages/profile/edit.vue`
- 在主页增加“编辑资料”跳转入口
- 编辑字段：`nickname`、`major`、`college`、`enrollment_year`、`bio`、`avatar_url`
- 头像使用文件上传接口后写回 `avatar_url`
- 保存时统一调用 `PATCH /api/v1/me`（部分更新）

### 2.2 非范围

- 资料修改审批流
- 管理端改资料能力
- 修改历史审计与频率限制
- 订阅消息联调功能重构（后续可单独拆）

## 3. 方案对比

### 方案 A：主页弹层编辑

- 优点：改动量小，开发快
- 缺点：主页继续膨胀，维护成本高

### 方案 B：独立编辑页（采用）

- 优点：页面职责清晰，后续扩展方便
- 缺点：需新增路由与页面状态同步

### 方案 C：字段内联编辑

- 优点：所见即改
- 缺点：交互碎片化，接口请求分散，错误处理复杂

结论：采用方案 B。

## 4. 信息架构与数据流

### 4.1 页面职责

- `profile/index.vue`：展示当前资料、提供“去编辑”入口
- `profile/edit.vue`：表单编辑、头像上传、提交保存

### 4.2 数据来源

- 初始化：调用 `GET /api/v1/me` 作为编辑页初始值
- 保存：调用 `PATCH /api/v1/me`，仅提交变更字段
- 头像：先 `POST /api/v1/files/upload`，再以返回 URL/可解析地址写入 `avatar_url`

### 4.3 展示名规则

- `display_name = nickname || real_name`
- `real_name` 在编辑页仅展示，不允许编辑

## 5. 类型与服务设计

### 5.1 类型补充

- 在 `src/types/user.ts` 增补后端已实现字段：
  - `real_name?: string`
  - `nickname?: string`
  - `college?: string`
  - `enrollment_year?: number`
  - `bio?: string`
  - `avatar_url?: string`

### 5.2 Service 设计

- 在 `src/services/profile.ts` 新增：
  - `getProfileEditableInfo()`（封装 `GET /api/v1/me`）
  - `updateProfile(payload)`（封装 `PATCH /api/v1/me`）

要求：页面不得直接写请求，全部经 service 层。

## 6. 交互与校验

- 昵称：1-20 字符
- 个性签名：0-100 字符
- 专业/学院：非空时去首尾空格
- 入学学年：`2000 ~ 当前年份 + 1`
- 保存时仅提交改动字段；若无改动，提示“暂无变更”

错误处理：

- `400xx` 展示后端 message
- `401` 跳转登录由 request 层统一处理
- 上传失败与保存失败分开提示

## 7. 路由与兼容性

- 在 `src/pages.json` 注册 `pages/profile/edit`
- 保持小程序与 H5 兼容，避免平台特有逻辑散落在页面中

## 8. 验证方案

最低验证：

1. `pnpm lint`
2. `pnpm type-check`
3. `pnpm build:mp-weixin`
4. `pnpm build:h5`

手测要点：

1. 从主页进入编辑页，初始值正确
2. 修改昵称/专业/学院/学年/签名后保存成功并回显
3. 修改头像后可回显新头像
4. 非法学年/超长字段提示正确
5. token 失效时能正确回到登录流程

## 9. 风险与应对

- 风险：上传返回结构与前端预期不一致
  - 应对：在 service 层做解析兼容并保底错误提示
- 风险：`/profile/home` 与 `/me` 字段存在短期不一致
  - 应对：编辑页以 `/me` 为准，主页刷新时做兼容映射

## 10. 里程碑

1. 完成类型与 service 扩展
2. 完成编辑页与路由接入
3. 完成主页入口调整
4. 完成 lint/type-check/build 与手测
