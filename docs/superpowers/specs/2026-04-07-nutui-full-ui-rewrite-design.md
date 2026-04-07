---
title: NutUI 全量 UI 重写设计
date: 2026-04-07
status: approved
owner: codex
---

# NutUI 全量 UI 重写设计

## 1. 背景与目标

当前项目页面以原生组件和文字为主，视觉层次与交互一致性较弱。目标是在不改业务逻辑和接口流程的前提下，全量切换到 NutUI 原生组件，并采用 NutUI 默认主题色（红色系），提升页面活力和可读性。

本次重写范围覆盖 `src/pages/**` 与 `src/subpackages/**` 的所有页面。

## 2. 设计原则

- 仅改 UI 层：不改路由、接口、store、权限逻辑。
- 轻度重排：允许调整布局层级与信息分组，不改变原有业务语义。
- 图标统一：使用 NutUI 自带图标，不引入第三方图标系统。
- 主题保持默认：不覆盖 NutUI 主色，不做品牌化调色。
- 跨端可用：优先保证微信小程序，其次保证 H5 视觉与交互一致。

## 3. 总体方案（已选）

采用“分层替换 + 页面模板化”的改造方式：

1. 先完成 NutUI 基础接入与全局样式基线。
2. 先定义页面模板（列表/详情/表单/主页与个人中心）。
3. 按模板全量替换页面组件并进行轻度重排。
4. 统一状态反馈（加载、空态、错误态）与图标语义。

该方案兼顾全量改造效率和最终一致性，能减少逐页平移导致的风格漂移。

## 4. 页面分型与组件映射

### 4.1 列表页

建议组合：`SearchBar + Tabs + Cell/List + Empty + InfiniteLoading`

适用页面：知识库首页、管理列表页。

### 4.2 详情页

建议组合：`Card + CellGroup + Tag + Divider + 固定底部操作`

适用页面：知识详情、管理详情。

### 4.3 表单页

建议组合：`Form + Input/TextArea + Picker + Uploader + Button`

适用页面：登录、注册、编辑资料、知识编辑、AI 生成输入页。

### 4.4 门户页（首页/个人中心）

建议组合：`NoticeBar + Grid + Cell + Card + Tag`

适用页面：首页、个人主页。

## 5. 模块级改造清单

### 5.1 主包页面

- `pages/auth/login`：登录表单 NutUI 化，按钮与提示统一。
- `pages/auth/register`：绑定/注册表单 NutUI 化，字段分组与校验提示优化。
- `pages/home/index`：欢迎区、快捷入口、订阅/提醒区卡片化并加图标。
- `pages/style-showcase/index`：改造成 NutUI 组件验收与视觉检查页。
- `pages/profile/index`：个人信息卡 + 功能入口 Cell 列表。
- `pages/profile/edit`：编辑资料页采用 NutUI Form 结构。

### 5.2 知识库分包页面

- `subpackages/knowledge/index`：搜索筛选区 + 列表卡片化。
- `subpackages/knowledge/detail`：标题区、标签区、正文区、操作区分层。
- `subpackages/knowledge/admin/index`：管理列表统一为 Cell/Card。
- `subpackages/knowledge/admin/detail`：管理详情信息分组显示。
- `subpackages/knowledge/admin/form`：编辑表单字段统一。
- `subpackages/knowledge/admin/import`：导入/附件管理页面组件统一。
- `subpackages/knowledge/admin/files`：上传与文件列表显示统一。
- `subpackages/knowledge/admin/ai-generate`：输入与结果区域卡片化、按钮语义化。

## 6. 状态与反馈规范

- 加载态：列表加载与提交按钮 loading 必须统一。
- 空态：使用 NutUI 空态组件并提供引导文案。
- 错误态：统一 Toast/Notify 提示，不使用分散的临时样式。
- 成功反馈：提交成功、保存成功统一反馈时机与文案风格。

## 7. 风险与应对

- 跨端样式差异：通过统一容器与间距 token 减少平台偏差。
- 页面数量多：采用“模板先行 + 批量迁移”降低重复改造成本。
- 样式遗留冲突：逐步清理原页面 scoped 样式，避免新旧规则叠加。

## 8. 验收标准

- 所有主包与分包页面可正常打开与跳转。
- 页面可见原生控件（button/input 等）基本完成 NutUI 替换。
- 关键页面具备图标与分组层次，不再是纯文本堆叠。
- 保持业务功能可用（登录、资料编辑、知识库浏览与管理流程不回归）。
- 通过 `npm run lint`、`npm run type-check`、`npm run build:mp-weixin`、`npm run build:h5`。

## 9. 非目标

- 不在本轮引入新的业务功能。
- 不进行主题品牌化二次定制（保持 NutUI 默认风格）。
- 不调整接口协议与后端契约。
