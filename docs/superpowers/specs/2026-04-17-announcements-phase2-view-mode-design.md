# Phase2 Announcements View Mode Design

## Background

当前公告模块已具备：
- 学生列表与详情（`/api/v1/announcements`、`/api/v1/announcements/:id`）
- 管理端发布入口（创建并发布）

但缺少 Phase2 里的教师只读管理视角：
- `GET /api/v1/announcements/all`
- `GET /api/v1/announcements/all/:id`

并且需要满足：教师默认学生视角，手动切换后才进入管理视角。

## Goals

- 教师/超级管理员（`role > 2`）在公告页可手动切换“管理视角”。
- 默认视角保持学生视角，避免改变现有使用习惯。
- 管理视角只覆盖“查看全部已发布公告”和“查看详情”，不包含后台完整管理台能力。
- 非教师角色始终走学生视角接口。

## Non-Goals

- 不实现 admin 列表管理台（按 `draft/published/archived` 筛选）。
- 不实现编辑公告、归档公告等后台管理操作。
- 不改动现有公告发布流程（create + publish）。

## User Experience

### Announcements List

- 学生与团学干部：
  - 看不到视角切换控件。
  - 列表固定请求 `GET /api/v1/announcements`。

- 教师/超级管理员：
  - 显示“管理视角”开关，默认关闭。
  - 关闭：请求学生接口。
  - 开启：请求 `GET /api/v1/announcements/all`。
  - 开启时显示提示文案，告知当前列表为“全部已发布公告（不按定向范围过滤）”。

### Announcement Detail

- 列表跳转详情时携带 `view_mode=student|admin`。
- 详情页按 `view_mode + role` 决定接口：
  - `view_mode=admin` 且 `role > 2`：`GET /api/v1/announcements/all/:id`
  - 其他：`GET /api/v1/announcements/:id`
- 若非教师手动构造 `view_mode=admin`，自动降级到学生接口。

## Architecture

### Constants

新增常量：
- `API_ANNOUNCEMENT_ALL_LIST = '/api/v1/announcements/all'`
- `API_ANNOUNCEMENT_ALL_DETAIL = '/api/v1/announcements/all'`

### Service Layer

在 `src/services/announcements.ts` 新增：
- `getAllAnnouncements(params)`
- `getAllAnnouncementDetail(id)`

接口实现与现有公告列表/详情保持一致的错误处理和返回格式。

### Page Layer

`src/subpackages/announcements/index.vue`：
- 增加 `isAdminView` 本地状态（默认 `false`）。
- 增加教师可见的视角开关和提示信息。
- `loadAnnouncements` 根据视角调用不同 service。
- `goDetail` 附带 `view_mode`。

`src/subpackages/announcements/detail.vue`：
- 解析 `view_mode` 参数。
- 基于角色判定是否允许 admin 详情接口。
- 统一复用现有展示结构。

## Data and Permissions Rules

- 角色判断以当前登录用户 `userInfo.role` 为准。
- 教师管理视角仅调用 `/announcements/all*`，不触达 `admin/announcements*`。
- 管理视角只读，不触发写操作，因此不涉及新增审计日志行为。

## Error Handling

- 沿用 request/service 既有策略：
  - `401`：清 token 并跳登录
  - `403`：提示无权限
  - `404`：提示接口不存在或资源不存在
  - `>=400`：展示后端 `error` 或通用错误

## Testing Strategy

手动验证：
- 学生账号：列表/详情均走学生接口，无视角开关。
- 教师账号默认：列表走学生接口。
- 教师账号打开开关：列表走 `/announcements/all`。
- 教师管理视角进入详情：走 `/announcements/all/:id`。
- 非教师手动拼接 `view_mode=admin`：仍走学生详情接口。
- 切换视角后刷新/加载更多逻辑正常。

## Risks and Mitigations

- 风险：视角切换后分页状态与旧数据混用。
  - 方案：切换视角时重置 offset/list 后重新拉取。
- 风险：详情参数缺失导致错误请求。
  - 方案：保留现有 id 校验与错误提示。

## Rollout

- 本次为前端兼容增强，保持默认行为不变。
- 通过后可在后续迭代再扩展完整后台管理台能力。
