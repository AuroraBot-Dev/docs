# AuroraBot 文档

<b>中文</b> | <a href="README.en.md">English</a> | <a href="README.ja.md">日本語</a>

本目录是 AuroraBot 文档站的源码，基于 [VitePress](https://vitepress.dev/) 构建。

## 内容

- **开始**：认识 AuroraBot、安装配置与最小上手路径；
- **架构**：系统总览、按包拆分的 `architecture/packages/` 栏目等；
- **开发**：端口扩展方式与贡献指南；
- **参考**：能力一览与常见问题。

## 前置

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9

```bash
npm install -g pnpm   # 如果尚未安装
```

## 快速开始

`docs` 是 Git 子模块。在主仓运行 `aurora setup` 会初始化子模块并安装依赖；之后在主仓根目录用 `aurora docs` 驱动本目录的 pnpm 脚本：

```bash
aurora docs dev      # 本地预览，默认 http://localhost:5173
aurora docs build    # 生产构建，输出到 .vitepress/dist
```

也可以在本目录直接使用 pnpm：

```bash
pnpm install
pnpm dev        # 本地开发，默认 http://localhost:5173
pnpm build      # 生产构建，输出到 .vitepress/dist
```
