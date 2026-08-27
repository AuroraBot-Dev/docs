---
order: 2
---

# 离线文档

## 前置

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9

```bash
npm install -g pnpm   # 如果尚未安装
```

## 快速开始

在 AuroraBot 主仓根目录使用快捷脚本（`docs` 是 Git 子模块，`docs_setup` 会先初始化子模块）：

```bash
# Linux / macOS
./scripts/linux/docs_setup.sh        # 初始化子模块并安装依赖
./scripts/linux/docs_preview.sh      # 本地预览，默认 http://localhost:5173
./scripts/linux/docs_build.sh        # 生产构建，输出到 .vitepress/dist
./scripts/linux/docs_update.sh       # 拉取子模块最新提交并更新依赖

# Windows (PowerShell)
.\scripts\windows\docs_setup.ps1
.\scripts\windows\docs_preview.ps1
.\scripts\windows\docs_build.ps1
.\scripts\windows\docs_update.ps1
```

也可以在主仓运行 `aurora setup`（初始化子模块并安装 docs 依赖），或在本目录直接使用 pnpm：

```bash
pnpm install
pnpm dev        # 本地开发，默认 http://localhost:5173
pnpm build      # 生产构建，输出到 .vitepress/dist
```

::: tip
文档站默认启动在 `localhost:5173/` 上. 打开浏览器访问即可.
:::
