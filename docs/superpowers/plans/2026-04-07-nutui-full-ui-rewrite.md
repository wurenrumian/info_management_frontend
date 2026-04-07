# NutUI Full UI Rewrite Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改业务逻辑的前提下，将全项目页面替换为 NutUI 原生组件并完成轻度重排，统一视觉层次与图标表达。

**Architecture:** 采用“基础接入 -> 页面模板基建 -> 主包迁移 -> 分包迁移 -> 回归验收”的流水线。先统一 NutUI 入口与全局容器样式，再按页面类型（列表/详情/表单/门户）批量替换，确保主包与分包风格一致且业务不回归。

**Tech Stack:** uni-app (Vue3 + TypeScript), Pinia, Sass, NutUI (默认主题), npm scripts (`lint`, `type-check`, `build:mp-weixin`, `build:h5`)

---

## Chunk 1: NutUI 基础接入与样式基线

### Task 1: 安装并注册 NutUI

**Files:**
- Modify: `package.json`
- Modify: `src/main.ts`
- Modify: `src/App.vue`

- [ ] **Step 1: 写失败验证（依赖缺失）**

Run: `npm ls @nutui/nutui-uniapp`
Expected: FAIL（或 empty），说明依赖尚未安装。

- [ ] **Step 2: 运行基线验证**

Run: `npm run type-check`
Expected: PASS（当前基线）。

备注：该步骤仅确认当前工程健康，再进入依赖接入。

- [ ] **Step 3: 最小实现（安装 + 全局注册）**

Run: `npm install @nutui/nutui-uniapp`

在 `src/main.ts` 增加 NutUI 插件注册；在 `src/App.vue` 引入 NutUI 样式入口。

- [ ] **Step 4: 运行验证通过**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/main.ts src/App.vue
git commit -m "feat: integrate nutui globally for uni-app"
```

### Task 2: 建立全局页面容器和 NutUI 轻覆盖

**Files:**
- Create: `src/styles/nutui-overrides.scss`
- Modify: `src/styles/index.scss`
- Modify: `src/styles/tokens.scss`
- Modify: `src/components/layout-shell.vue`

- [ ] **Step 1: 写失败验证（样式未生效）**

在首页手动检查：页面分组和卡片容器仍是旧样式（记录截图/描述）。

- [ ] **Step 2: 运行验证失败**

Run: `npm run dev:h5`
Expected: 首页仍未体现 NutUI 风格容器。

- [ ] **Step 3: 最小实现（容器类 + 覆盖）**

新增统一类：`.page-container`, `.section-card`, `.section-title`, `.action-group`，仅覆盖间距、圆角、边框、阴影，不改主题主色。

- [ ] **Step 4: 运行验证通过**

Run: `npm run dev:h5`
Expected: 首页和个人页已有统一容器基线。

- [ ] **Step 5: Commit**

```bash
git add src/styles/nutui-overrides.scss src/styles/index.scss src/styles/tokens.scss src/components/layout-shell.vue
git commit -m "refactor: add unified nutui page container styles"
```

## Chunk 2: 页面模板组件改造（先主包）

### Task 3: 门户类页面（首页/个人中心）NutUI 化

**Files:**
- Modify: `src/pages/home/index.vue`
- Modify: `src/pages/profile/index.vue`

- [ ] **Step 1: 写失败验证（旧原生控件）**

记录当前页面仍使用原生 `button` 和文本块堆叠。

- [ ] **Step 2: 运行验证失败**

Run: `npm run dev:h5`
Expected: 页面仍为旧结构。

- [ ] **Step 3: 最小实现（首页）**

仅改 `src/pages/home/index.vue`：替换为 NutUI `Card/Grid/Button/Tag` 组合，加入入口图标。

- [ ] **Step 4: 验证首页**

Run: `npm run type-check`
Expected: PASS

手测：首页动作反馈（成功/错误提示）样式统一为 NutUI 提示体系。

- [ ] **Step 5: 最小实现（个人中心）**

仅改 `src/pages/profile/index.vue`：替换为 NutUI `Card/Cell/List` 组合，加入功能图标。

- [ ] **Step 6: 验证个人中心**

Run: `npm run type-check`
Expected: PASS

手测：个人中心动作反馈（成功/错误提示）样式统一为 NutUI 提示体系。

Run: `npm run build:mp-weixin`
Expected: PASS

手测（微信开发者工具）：首页/个人中心页面样式和点击反馈正常。

- [ ] **Step 7: Commit**

```bash
git add src/pages/home/index.vue src/pages/profile/index.vue
git commit -m "feat: migrate home and profile pages to nutui portal layout"
```

### Task 4: 表单类页面（登录/注册/编辑资料）NutUI 化

**Files:**
- Modify: `src/pages/auth/login.vue`
- Modify: `src/pages/auth/register.vue`
- Modify: `src/pages/profile/edit.vue`

- [ ] **Step 1: 写失败验证（旧输入样式）**

记录现有输入和按钮风格不统一、缺少语义图标。

- [ ] **Step 2: 运行验证失败**

Run: `npm run dev:h5`
Expected: 三个表单页仍是旧控件。

- [ ] **Step 3: 最小实现（登录页）**

仅改 `src/pages/auth/login.vue`：替换为 NutUI `Form/Input/Button`，保留提交逻辑。

- [ ] **Step 4: 验证登录页**

Run: `npm run type-check`
Expected: PASS

手测：登录页出现 NutUI 表单、按钮 loading 与错误提示可见。

- [ ] **Step 5: 最小实现（注册页）**

仅改 `src/pages/auth/register.vue`：替换为 NutUI 表单组件并补充分组标题与图标。

- [ ] **Step 6: 验证注册页**

Run: `npm run type-check`
Expected: PASS

手测：注册/绑定页有 empty/error/success 反馈文案与提示样式。

- [ ] **Step 7: 最小实现（资料编辑页）**

仅改 `src/pages/profile/edit.vue`：替换为 NutUI `Form/Input/TextArea/Button`，保留原字段逻辑。

- [ ] **Step 8: 验证编辑页**

Run: `npm run type-check`
Expected: PASS

手测：提交成功反馈与校验错误反馈均可见。

Run: `npm run build:mp-weixin`
Expected: PASS

手测（微信开发者工具）：登录/注册/编辑资料三页样式与交互正常。

- [ ] **Step 9: Commit**

```bash
git add src/pages/auth/login.vue src/pages/auth/register.vue src/pages/profile/edit.vue
git commit -m "feat: migrate auth and profile form pages to nutui"
```

### Task 5: 样式预览页重建为 NutUI 验收面板

**Files:**
- Modify: `src/pages/style-showcase/index.vue`

- [ ] **Step 1: 写失败验证（缺少统一验收）**

确认当前预览页未覆盖此次改造核心组件。

- [ ] **Step 2: 运行验证失败**

Run: `npm run dev:h5`
Expected: 预览页无法用于 NutUI 回归检查。

- [ ] **Step 3: 最小实现（验收面板）**

重建为组件分组展示：按钮、表单、列表、弹层、空态、图标。

- [ ] **Step 4: 运行验证通过**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/style-showcase/index.vue
git commit -m "chore: rebuild style showcase page for nutui regression"
```

## Chunk 3: 知识库分包全量迁移

### Task 6: 知识库用户侧页面迁移

**Files:**
- Modify: `src/subpackages/knowledge/index.vue`
- Modify: `src/subpackages/knowledge/detail.vue`

- [ ] **Step 1: 写失败验证（列表/详情非 NutUI）**

确认搜索、列表、详情分组仍为旧样式。

- [ ] **Step 2: 运行验证失败**

Run: `npm run dev:h5`
Expected: 两页仍是旧结构。

- [ ] **Step 3: 最小实现（知识库列表）**

仅改 `src/subpackages/knowledge/index.vue`：切换为 `SearchBar + List/Cell + Empty`。

- [ ] **Step 4: 验证知识库列表**

Run: `npm run type-check`
Expected: PASS

手测：列表页 loading/empty 状态完整。

- [ ] **Step 5: 最小实现（知识库详情）**

仅改 `src/subpackages/knowledge/detail.vue`：切换为 `Card + Tag + CellGroup + 底部操作`。

- [ ] **Step 6: 验证知识库详情**

Run: `npm run type-check`
Expected: PASS

手测：详情页错误提示与成功反馈可见。

Run: `npm run build:mp-weixin`
Expected: PASS

手测（微信开发者工具）：知识库 index/detail 视觉与交互正常。

- [ ] **Step 7: Commit**

```bash
git add src/subpackages/knowledge/index.vue src/subpackages/knowledge/detail.vue
git commit -m "feat: migrate knowledge user pages to nutui"
```

### Task 7: 知识库管理页迁移

**Files:**
- Modify: `src/subpackages/knowledge/admin/index.vue`
- Modify: `src/subpackages/knowledge/admin/detail.vue`
- Modify: `src/subpackages/knowledge/admin/form.vue`
- Modify: `src/subpackages/knowledge/admin/import.vue`
- Modify: `src/subpackages/knowledge/admin/files.vue`
- Modify: `src/subpackages/knowledge/admin/ai-generate.vue`

- [ ] **Step 1: 写失败验证（管理页风格分裂）**

确认管理列表、上传、AI 页面的控件与间距风格不统一。

- [ ] **Step 2: 运行验证失败**

Run: `npm run dev:h5`
Expected: 管理页仍是旧 UI。

- [ ] **Step 3: 最小实现（管理列表与详情）**

仅改：
- `src/subpackages/knowledge/admin/index.vue`
- `src/subpackages/knowledge/admin/detail.vue`

替换为 `Cell/List/Card` 组合。

- [ ] **Step 4: 验证管理列表与详情**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 5: 最小实现（管理表单与导入）**

仅改：
- `src/subpackages/knowledge/admin/form.vue`
- `src/subpackages/knowledge/admin/import.vue`

替换为 `Form/Input/Uploader/Button`。

- [ ] **Step 6: 验证管理表单与导入**

Run: `npm run type-check`
Expected: PASS

手测：上传页空态、失败态、成功态可见。

- [ ] **Step 7: 最小实现（文件与 AI 页面）**

仅改：
- `src/subpackages/knowledge/admin/files.vue`
- `src/subpackages/knowledge/admin/ai-generate.vue`

替换为卡片化布局与 NutUI 操作组件。

- [ ] **Step 8: 验证文件与 AI 页面**

Run: `npm run type-check`
Expected: PASS

手测：AI 页面 loading/错误/成功反馈完整，文件页空态反馈完整。

Run: `npm run build:mp-weixin`
Expected: PASS

手测（微信开发者工具）：admin 全页可用。

- [ ] **Step 9: Commit**

```bash
git add src/subpackages/knowledge/admin/index.vue src/subpackages/knowledge/admin/detail.vue src/subpackages/knowledge/admin/form.vue src/subpackages/knowledge/admin/import.vue src/subpackages/knowledge/admin/files.vue src/subpackages/knowledge/admin/ai-generate.vue
git commit -m "feat: migrate knowledge admin pages to nutui components"
```

## Chunk 4: 回归与交付

### Task 8: 全量回归验证与修正

**Files:**
- Modify: `src/pages/**/*.vue`（仅限回归修正）
- Modify: `src/subpackages/**/*.vue`（仅限回归修正）
- Modify: `src/styles/*.scss`（仅限回归修正）

- [ ] **Step 1: 运行静态检查**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 2: 运行类型检查**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: 运行双端构建**

Run: `npm run build:mp-weixin`
Expected: PASS

Run: `npm run build:h5`
Expected: PASS

- [ ] **Step 4: 手测关键流程**

登录/注册、首页跳转、个人资料编辑、知识库浏览、知识库管理上传与 AI 生成流程。

- [ ] **Step 5: Commit**

```bash
git add src/pages src/subpackages src/styles
git commit -m "chore: finalize nutui full ui rewrite and regression fixes"
```

## 执行备注

- 保持 DRY / YAGNI：只做 UI 层替换，不引入新业务能力。
- 任何涉及接口、store、权限逻辑的变化均视为偏离计划，需要单独确认。
- 如 NutUI 某组件在小程序端行为异常，优先同类组件替代，不回退到原生控件。
