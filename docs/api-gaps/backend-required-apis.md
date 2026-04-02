# 后端 API 联调与缺口清单（登录 + 个人主页）

## 1. 文档目的

本文件用于统一前后端在“认证登录 + 个人主页”场景的接口对齐方式，分为两部分：

1. **已可联调接口**（可直接开发）
2. **后端待补接口**（当前无实现或能力不足）

说明：当前系统不包含“前端自助注册”流程，默认通过微信登录与绑定完成身份建立。

## 2. 环境与请求约定

### 2.1 前端环境变量（开发）

- `VITE_API_BASE_URL=/api`
- `VITE_API_PROXY_TARGET=http://localhost:8080`

### 2.2 统一请求/响应结构

- 成功：`{ "data": ... }`
- 失败：`{ "error": "..." }`

### 2.3 认证头

除登录/绑定外，默认带：

```http
Authorization: Bearer <token>
Content-Type: application/json
```

## 3. 已可联调接口（后端已提供）

## 3.1 微信登录

- **Method + Path**: `POST /api/v1/wechat/login`
- **用途**: 通过微信 `code` 获取 token 与用户信息

请求示例：

```json
{
  "code": "wx_auth_code"
}
```

成功响应示例：

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "student_id": "2020001",
      "name": "张三",
      "role": 1,
      "class_id": 10,
      "grade": "2020",
      "major": "信息管理"
    }
  }
}
```

常见错误：

- `400`: `missing code`
- `400`: code 无效
- `404`: 账号未绑定（需走 bind）

## 3.2 微信绑定

- **Method + Path**: `POST /api/v1/wechat/bind`
- **用途**: 绑定 openid 到已有账号

模式 A（已登录）：

```json
{
  "code": "wx_auth_code"
}
```

模式 B（未登录）：

```json
{
  "student_id": "2020001",
  "password": "mypassword",
  "code": "wx_auth_code"
}
```

成功响应：

```json
{
  "data": {
    "ok": true,
    "message": "绑定成功"
  }
}
```

## 3.3 获取当前用户

- **Method + Path**: `GET /api/v1/me`
- **用途**: 个人主页基础信息

响应示例：

```json
{
  "data": {
    "id": 1,
    "student_id": "2020001",
    "name": "张三",
    "role": 1,
    "class_id": 10,
    "grade": "2020",
    "major": "信息管理"
  }
}
```

## 3.4 个人主页增强数据

- `GET /api/v1/announcements?limit=10&offset=0`
- `GET /api/v1/approvals/me?limit=10&offset=0`
- `GET /api/v1/knowledge/search?limit=10&offset=0`

前端策略：增强数据失败不阻塞主页基础信息展示。

## 4. 后端待补接口（API Gaps）

### GAP-01 个人主页聚合接口

- **优先级**: P1
- **Method + Path**: `GET /api/v1/profile/home`
- **用途**: 一次返回主页关键数据，减少前端多请求聚合
- **鉴权**: JWT 登录用户
- **请求参数**: 无
- **响应建议**:

```json
{
  "data": {
    "basic": {
      "id": 1,
      "student_id": "2020001",
      "name": "张三",
      "role": 1,
      "class_id": 10,
      "grade": "2020",
      "major": "信息管理"
    },
    "quick_entry": {
      "announcements_count": 12,
      "approvals_count": 3,
      "knowledge_count": 25
    },
    "account": {
      "wechat_bound": true
    }
  }
}
```

- **前端降级方案**: 继续使用多接口聚合

### GAP-02 个人资料编辑

- **优先级**: P1
- **Method + Path**: `PATCH /api/v1/me`
- **用途**: 支持头像、简介等个人信息修改
- **鉴权**: JWT 登录用户
- **请求建议**:

```json
{
  "avatar_url": "https://example.com/avatar.png",
  "bio": "个人简介"
}
```

- **响应建议**:

```json
{
  "data": {
    "ok": true
  }
}
```

- **前端降级方案**: 资料扩展位显示“待接入”

### GAP-03 我的审批统计

- **优先级**: P2
- **Method + Path**: `GET /api/v1/approvals/me/summary`
- **用途**: 返回状态统计，减少分页遍历
- **鉴权**: JWT 登录用户
- **响应建议**:

```json
{
  "data": {
    "pending": 2,
    "approved": 8,
    "rejected": 1,
    "withdrawn": 0,
    "total": 11
  }
}
```

- **前端降级方案**: 使用 `/approvals/me` 的 `total`

### GAP-04 未读消息数量

- **优先级**: P2
- **Method + Path**: `GET /api/v1/notifications/unread/count`
- **用途**: 主页角标与通知提醒
- **鉴权**: JWT 登录用户
- **响应建议**:

```json
{
  "data": {
    "count": 5
  }
}
```

- **前端降级方案**: 不展示未读角标

### GAP-05 开发环境快捷登录（仅 Dev）

- **优先级**: P1（开发效率）
- **Method + Path**: `POST /api/v1/dev/login`
- **用途**: H5 本地开发快速获取 token，避免依赖微信授权
- **限制**: 仅 `dev` 环境启用，生产禁止暴露
- **请求建议**:

```json
{
  "student_id": "2020001"
}
```

- **响应建议**:

```json
{
  "data": {
    "token": "dev_token_xxx",
    "user": {
      "id": 1,
      "student_id": "2020001",
      "name": "开发测试账号",
      "role": 1,
      "class_id": 10,
      "grade": "2020",
      "major": "信息管理"
    }
  }
}
```

- **前端降级方案**: 无（无该接口时，H5 需手工注入 token 或使用小程序联调）

## 5. 前端联调处理规则

1. `GET /api/v1/me` 失败：显示错误态 + 重试
2. 增强接口失败：显示占位，不阻塞主页
3. 401：清理 token，跳转登录页
4. API 字段兼容：统一在 service 层映射，不把后端字段直接暴露到页面模板

## 6. 联调检查清单

- [ ] 环境变量与代理配置正确
- [ ] 登录成功后 token 已写入本地
- [ ] `GET /api/v1/me` 可返回用户信息
- [ ] 主页基础信息可渲染
- [ ] 增强模块失败不导致页面崩溃
- [ ] GAP 条目均有优先级与降级方案
