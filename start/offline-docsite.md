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

::: tip
文档站默认启动在 `localhost:5173/` 上. 打开浏览器访问即可.
:::
