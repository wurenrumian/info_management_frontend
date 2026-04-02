# 学院事务前端样式基线文档（V1）

## 1. 目的

本文件用于固化当前项目的样式基线，确保后续页面开发在视觉与交互上保持一致，减少重复设计和返工。

适用范围：`info_management_frontend` 全部学生端页面（微信小程序优先，兼容 H5）。

## 2. 视觉方向（已确定）

- 风格定位：学生易用性优先的人大轻正式
- 关键词：正式但不压迫、清晰优先、学院感、温和克制
- 原则：信息可读性优先于装饰效果

## 3. 当前样式结构

样式文件位于 `src/styles/`：

- `tokens.scss`：设计变量（颜色、字号、间距、圆角、阴影、层级）
- `mixins.scss`：复用样式片段（卡片、按钮、文本省略）
- `utilities.scss`：轻量工具类
- `index.scss`：全局入口样式

入口引入：`src/App.vue`。

## 4. 关键 Design Tokens

主色与语义色（首版固定）：

- `--color-primary: #9D2933`
- `--color-primary-soft: #F6E9EA`
- `--color-bg: #F7F4F1`
- `--color-surface: #FFFFFF`
- `--color-text: #2B2B2B`
- `--color-text-secondary: #6B7280`
- `--color-border: #E7E2DD`
- `--color-success: #2F7D4A`
- `--color-warning: #B7791F`
- `--color-danger: #C53B3B`

间距节奏：`8 / 12 / 16 / 24 / 32`

圆角：`8 / 12 / 16`

## 5. 使用规范

### 5.1 必须遵守

1. 业务样式优先引用 token，不直接硬编码颜色
2. 复用卡片、按钮、截断样式时优先使用 mixin
3. 页面样式默认使用 scoped，避免全局污染
4. 除基础基线外，不新增业务相关全局选择器

### 5.2 建议

1. 新页面先在样式展示页对齐视觉元素再落业务
2. 同一语义只使用一套颜色（如“已完成”固定成功色）
3. 按钮层级保持克制，一屏避免多个主按钮抢视觉

## 6. 样式展示页

路径：`src/pages/style-showcase/index.vue`

已覆盖元素：

- 色板
- 文字层级
- 按钮（主/次/危险/禁用）
- 卡片与标签
- 流程状态
- 表单示例
- 空状态

用途：作为业务页面实现时的视觉对照基准。

## 7. 本地查看方式

### H5

1. 运行：`npm run dev:h5`
2. 打开：`http://localhost:5173`
3. 在首页点击“查看样式预览页”

### 微信小程序

1. 运行：`npm run dev:mp-weixin`
2. 微信开发者工具导入：`dist/dev/mp-weixin`
3. 进入首页后点击“查看样式预览页”

## 8. 后续维护建议

1. 若只改风格（色彩、圆角、间距），优先改 `tokens.scss`
2. 若增加可复用样式能力，优先加到 `mixins.scss`
3. 每次调整后至少验证：`type-check`、`build:h5`、`dev:mp-weixin`

## 9. 关联文档

- 设计规格：`docs/superpowers/specs/2026-04-02-ruc-student-affairs-css-design.md`
- 实施计划：`docs/superpowers/plans/2026-04-02-ruc-style-foundation.md`
- 验收清单：`docs/superpowers/checklists/style-foundation-acceptance.md`
