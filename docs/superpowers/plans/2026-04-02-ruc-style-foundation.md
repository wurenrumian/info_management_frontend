# RUC 学院事务小程序样式基础框架 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可复用的 CSS 样式基础框架，并提供一个可运行的样式演示页面，供后续业务模块统一复用。

**Architecture:** 先用 `src/styles` 建立 design tokens + 基础 mixins + 轻量 utilities，再在 `App.vue` 注入全局样式入口。通过新增 `style-showcase` 页面集中展示按钮、卡片、标签、状态、列表与表单基础视觉，作为统一 UI 基线。由于当前仓库无 UI 自动化测试框架，本计划采用“验收清单先行 + 构建验证 + 手工页面核对”的轻量 TDD 替代流程。

**Tech Stack:** uni-app (Vue3 + TypeScript), SCSS, Vite, npm scripts (`type-check`, `build:h5`, `dev:mp-weixin`)

---

## 文件结构与职责

- Create: `src/styles/tokens.scss`（颜色、字号、间距、圆角、阴影、层级 token）
- Create: `src/styles/mixins.scss`（卡片、按钮、文本截断等复用 mixins）
- Create: `src/styles/utilities.scss`（克制的工具类）
- Create: `src/styles/index.scss`（统一样式入口）
- Create: `src/pages/style-showcase/index.vue`（样式演示页）
- Modify: `src/App.vue`（引入全局样式与页面基线）
- Modify: `src/pages.json`（注册样式演示页路由）
- Modify: `src/pages/home/index.vue`（添加入口链接，便于快速进入演示页）
- Create: `docs/superpowers/checklists/style-foundation-acceptance.md`（验收清单）

## Chunk 1: 建立样式底座（Tokens + Global）

### Task 1: 先写验收清单（测试先行）

**Files:**
- Create: `docs/superpowers/checklists/style-foundation-acceptance.md`

- [ ] **Step 1: 写“失败态”验收清单**

在清单中定义必须满足的可观察结果（如：主色 token 存在、卡片样式可复用、App 背景统一、首页可跳转 showcase）。

- [ ] **Step 2: 记录当前状态为未满足**

Run: `rg "style-showcase|tokens.scss|--color-primary" src docs/superpowers/checklists`

Expected: 仅能搜到 0 或极少命中，说明清单条目当前尚未实现。

- [ ] **Step 3: 增加全局污染护栏条目**

在清单中增加“除 `App.vue` 基线外，不新增业务相关全局选择器”检查项。

- [ ] **Step 4: 提交清单（可选小提交）**

```bash
git add docs/superpowers/checklists/style-foundation-acceptance.md
git commit -m "test: add acceptance checklist for style foundation"
```

### Task 2: 实现全局样式文件与入口

**Files:**
- Create: `src/styles/tokens.scss`
- Create: `src/styles/mixins.scss`
- Create: `src/styles/utilities.scss`
- Create: `src/styles/index.scss`
- Modify: `src/App.vue`

- [ ] **Step 1: 在 `tokens.scss` 定义颜色 token**

主色、中性色、状态色按 spec 固定命名。

- [ ] **Step 2: 在 `tokens.scss` 定义排版与尺寸 token**

字体大小、字重、间距、圆角、阴影、层级。

- [ ] **Step 3: 验证关键主色 token 已落地**

Run: `rg "^\s*--color-primary:\s*#9D2933" src/styles/tokens.scss`

Expected: 精确 1 命中。

- [ ] **Step 4: 在 `mixins.scss` 定义复用块**

最小集：卡片容器、主按钮态、单行/双行省略。

- [ ] **Step 5: 在 `utilities.scss` 定义少量工具类**

例如：常用间距与文字色，不扩展为大规模原子类。

- [ ] **Step 6: 在 `index.scss` 聚合并导出全局样式**

按 `tokens -> mixins -> utilities` 顺序引入，避免变量未定义。

- [ ] **Step 7: 在 `App.vue` 引入 `src/styles/index.scss` 并设置 page 基线**

包括统一背景色、默认字体色、box-sizing 基线。

- [ ] **Step 8: 验证 `App.vue` 未加入业务全局样式**

Run: `rg "\.notice|\.approval|\.knowledge" src/App.vue`

Expected: 0 命中。

- [ ] **Step 9: 运行类型检查确认无回归**

Run: `npm run type-check`

Expected: PASS。

- [ ] **Step 10: 提交底座改动（可选小提交）**

```bash
git add src/styles src/App.vue
git commit -m "feat: add global style tokens and base stylesheet"
```

## Chunk 2: 样式演示页与运行验证

### Task 3: 实现 `style-showcase` 页面

**Files:**
- Create: `src/pages/style-showcase/index.vue`
- Modify: `src/pages.json`
- Modify: `src/pages/home/index.vue`

- [ ] **Step 1: 创建页面基础模板（script/template/style）**

页面先能渲染标题与容器。

- [ ] **Step 2: 实现色板与文字层级分区**

覆盖主色、中性色、状态色与标题/正文/说明。

- [ ] **Step 3: 实现按钮与卡片分区**

展示主按钮、次按钮、危险按钮、禁用态和两种卡片。

- [ ] **Step 4: 实现标签、通知列表、状态块分区**

覆盖通知标签、流程状态标签、通知列表项。

- [ ] **Step 5: 实现表单样式与空态分区**

确保至少有输入容器样式和空态块。

- [ ] **Step 6: 使用 token 与 mixins，不写硬编码魔法值**

确保演示页成为“业务页抄作业模板”。

- [ ] **Step 7: 在 `src/pages.json` 的 `root.pages` 追加路由**

追加 `pages/style-showcase/index`。

- [ ] **Step 8: 验证路由注册准确**

Run: `rg "pages/style-showcase/index" src/pages.json`

Expected: 精确 1 命中。

- [ ] **Step 9: 在首页增加“样式预览”入口**

便于开发和评审直接访问，不依赖手动改启动页。

- [ ] **Step 10: 验证关键条目已从未满足变为满足（确定性检查）**

Run: `rg "^\s*--color-primary:\s*#9D2933" src/styles/tokens.scss`

Expected: 精确 1 命中。

Run: `rg "u-text-secondary|card|button" src/pages/style-showcase/index.vue`

Expected: 至少 3 命中。

- [ ] **Step 11: 提交演示页改动（可选小提交）**

```bash
git add src/pages/style-showcase/index.vue src/pages.json src/pages/home/index.vue
git commit -m "feat: add style showcase page for visual baseline"
```

### Task 4: 运行与人工验收

**Files:**
- Modify: `docs/superpowers/checklists/style-foundation-acceptance.md`

- [ ] **Step 1: 构建 H5 产物**

Run: `npm run build:h5`

Expected: PASS，产物可生成。

- [ ] **Step 2: 启动本地预览**

Run: `npm run dev:h5`

Expected: 本地可访问页面（例如 `http://localhost:5173`），首页可进入样式演示页。

- [ ] **Step 3: 启动小程序端预览**

Run: `npm run dev:mp-weixin`

Expected: 小程序端可访问首页与样式演示页。

- [ ] **Step 4: 按清单做双端对照验收并勾选结果**

核对 H5 与小程序：色板、按钮态、列表项、表单、空态是否一致可接受。

- [ ] **Step 5: 最终提交（可选）**

```bash
git add docs/superpowers/checklists/style-foundation-acceptance.md
git commit -m "test: validate style foundation and showcase acceptance"
```

## 风险与回滚点

- 若全局样式污染业务页面：先保留 token，引入范围缩小到 `App.vue` + showcase 页面
- 若 H5 与小程序表现差异大：优先修正 token 与基础容器样式，不先改业务页
- 若视觉争议：只改 `tokens.scss`，确保结构与组件样式不大改

## 完成定义（DoD）

- `src/styles` 下样式基础框架完成并可复用
- `style-showcase` 页面可访问并覆盖核心视觉元素
- `npm run type-check`、`npm run build:h5` 与 `npm run dev:mp-weixin` 启动验证通过
- 验收清单有明确勾选结果
