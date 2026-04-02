# 学院学生事务一站式系统 - 前端

uni-app + Vue3 + TypeScript 实现微信小程序和 H5 的前端项目。

## 技术栈

- **框架**: uni-app (Vue3 + TypeScript)
- **目标平台**: 微信小程序、H5
- **状态管理**: Pinia
- **包管理器**: pnpm

## 项目结构

```
src/
├── pages/              # 主包页面
├── subpackages/        # 分包页面
├── components/         # 组件
├── services/           # 接口调用层
├── stores/             # Pinia stores
├── hooks/              # 组合式函数
├── utils/              # 工具函数
├── types/              # TypeScript 类型
├── constants/          # 常量
└── static/             # 静态资源
```

## 开发

```bash
pnpm install
pnpm dev:mp-weixin    # 微信小程序
pnpm dev:h5           # H5
```

## 构建

```bash
pnpm build:mp-weixin  # 微信小程序
pnpm build:h5         # H5
```

## 文档

- [开发规范](docs/development-standard.md)
- [功能设计](docs/superpowers/specs/)
- [实现计划](docs/superpowers/plans/)
- [后端 API 缺口清单](docs/api-gaps/backend-required-apis.md)

## 后端仓库

- [info_management](https://github.com/wurenrumian/info_management)
