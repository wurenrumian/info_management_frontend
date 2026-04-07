# 团队入手指南（环境、工具与 .env 配置）

本文面向第一次接手本项目前端的同学，目标是快速完成本地运行，并避免常见配置错误。

## 1. 项目基本信息

- 技术栈：uni-app + Vue3 + TypeScript
- 目标平台：微信小程序（优先）+ H5
- 状态管理：Pinia
- UI 组件库：`nutui-uniapp`
- Node.js 要求：`>=18.0.0`
- 开发规范入口：`docs/development-standard.md`

## 2. 本地环境准备

### 2.1 必装软件

1. Node.js 18+
2. 包管理器：`pnpm`（推荐）或 `npm`（团队需统一）
3. 微信开发者工具（用于小程序调试）
4. Git

### 2.2 推荐工具

- IDE：VS Code（建议安装 Vue/TypeScript/ESLint 相关插件）
- 可选：HBuilderX（如需使用其调试/构建能力）

## 3. 拉起项目（第一次）

### 3.1 安装依赖

```bash
pnpm install
```

若团队当前统一使用 npm，则执行：

```bash
npm install
```

### 3.2 配置环境变量

复制模板文件后按本地环境修改（见第 4 节）：

```bash
cp .env.example .env.development.local
```

Windows PowerShell 可用：

```powershell
Copy-Item .env.example .env.development.local
```

### 3.3 启动开发

```bash
pnpm dev:mp-weixin
pnpm dev:h5
```

## 4. .env 配置规则（重点）

### 4.1 已存在的环境文件

- `.env.example`：示例模板（应保持可提交）
- `.env.development`：开发环境默认值（可提交）
- `.env.development.local`：本地私有覆盖（不提交）

`*.local` 文件已被 `.gitignore` 忽略，请把本机敏感或个性化配置放到 `.local` 文件。

### 4.2 变量优先级与建议

- 同环境下，`.env.development.local` 会覆盖 `.env.development`
- 团队默认建议：把通用配置留在 `.env.development`，个人机器差异配置放在 `.env.development.local`
- 不要在前端保存敏感密钥（例如 `AppSecret`、JWT Secret）

### 4.3 关键变量说明

1. `VITE_API_BASE_URL`
   - 用途：前端请求基地址
   - 开发推荐：`/api`（配合 Vite 代理，避免 CORS）
2. `VITE_API_PROXY_TARGET`
   - 用途：本地开发代理后端地址
   - 示例：`http://localhost:8080`
3. `VITE_WECHAT_APP_ID`
   - 用途：微信小程序 AppID
   - 示例：`wx1234567890abcdef`
4. `VITE_ENABLE_DEV_WECHAT_TOOLS`
   - 用途：开发态微信调试开关
   - 开发建议：`true`
5. `VITE_FILE_PUBLIC_BASE_URL`（可选）
   - 用途：文件公开访问地址前缀
   - 不配时会根据 `VITE_API_BASE_URL` / `VITE_API_PROXY_TARGET` 推断

### 4.4 推荐的本地开发示例

```dotenv
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_WECHAT_APP_ID=你的微信小程序AppID
VITE_ENABLE_DEV_WECHAT_TOOLS=true
# 可选
# VITE_FILE_PUBLIC_BASE_URL=http://localhost:8080
```

## 5. 开发时必须遵守的约束（摘录）

1. 页面/组件中禁止直接写 `uni.request` / `fetch`，必须走 `src/services/`（常规接口走 `request.ts`，流式场景由 service 层统一封装）
2. 禁止硬编码接口地址，统一使用环境变量 + 常量
3. 接口路径统一维护在 `src/constants/api.ts`
4. 跨模块开发遵循目录归属，避免互相引用内部实现
5. 提交前至少通过：`lint`、`type-check`、`build:mp-weixin`、`build:h5`
6. 页面 UI 优先使用 `nutui-uniapp` 组件，确需自定义时再做薄封装

## 6. 常用命令速查

```bash
pnpm dev:mp-weixin
pnpm dev:h5
pnpm lint
pnpm type-check
pnpm build:mp-weixin
pnpm build:h5
```

## 7. 常见问题

1. H5 请求报跨域
   - 检查 `VITE_API_BASE_URL` 是否为 `/api`
   - 检查 `VITE_API_PROXY_TARGET` 是否指向可访问后端
2. 小程序接口请求失败
   - 检查微信开发者工具中的合法域名配置
   - 检查后端服务是否已启动且可访问
3. 文件预览链接不正确
   - 优先显式配置 `VITE_FILE_PUBLIC_BASE_URL`
   - 或检查 API 基地址与代理配置是否匹配

## 8. 相关文档

- 开发规范：`docs/development-standard.md`
- 微信订阅通知说明：`docs/wechat-subscribe-integration-guide.md`
- 项目入口说明：`README.md`
