# 样式基础框架验收清单

日期：2026-04-02

## A. 样式底座

- [x] 存在 `src/styles/tokens.scss`
- [x] 存在 `src/styles/mixins.scss`
- [x] 存在 `src/styles/utilities.scss`
- [x] 存在 `src/styles/index.scss`
- [x] `--color-primary` 已定义为 `#9D2933`
- [x] 除 `App.vue` 基线外，未新增业务全局选择器

## B. 页面与路由

- [x] 存在 `src/pages/style-showcase/index.vue`
- [x] `src/pages.json` 的 `pages` 已包含 `pages/style-showcase/index`
- [x] 首页提供了进入样式预览页的入口

## C. 视觉元素覆盖

- [x] Showcase 包含色板
- [x] Showcase 包含文字层级
- [x] Showcase 包含按钮（主/次/危险/禁用）
- [x] Showcase 包含卡片与标签
- [x] Showcase 包含流程状态
- [x] Showcase 包含表单示例
- [x] Showcase 包含空状态

## D. 运行验证

- [x] `npm run type-check` 通过
- [x] `npm run build:h5` 通过
- [x] `npm run dev:h5` 可启动并可访问页面
- [x] `npm run dev:mp-weixin` 可启动并可访问页面
