# AuroraBot 文档

本目录是 AuroraBot 文档站的源码，基于 [VitePress](https://vitepress.dev/) 构建。

## 内容

- **开始**：安装、配置与最小上手路径；
- **架构**：系统总览、AgentTree 语义，以及按包拆分的 `architecture/packages/` 栏目；
- **开发**：端口扩展方式与贡献治理；
- **RFC**：唯一设计基准（`rfc/0300-unified-architecture-and-contracts.md`）。

## 前置

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9

```bash
npm install -g pnpm   # 如果尚未安装
```

## 快速开始

```bash
cd docs
pnpm install
pnpm dev        # 本地开发，默认 http://localhost:5173
pnpm build      # 生产构建，输出到 .vitepress/dist
```

也可从仓库根目录使用脚本：

```bash
# Linux / macOS
./scripts/linux/docs_preview.sh      # 或 scripts/macos/docs_preview.command
./scripts/linux/docs_build.sh        # 或 scripts/macos/docs_build.command

# Windows (PowerShell)
.\scripts\windows\docs_preview.ps1
.\scripts\windows\docs_build.ps1
```

## 配置说明

- `.npmrc` 中设置了 `node-linker=hoisted`，使 pnpm 以平铺方式安装依赖，兼容 Vite 的依赖预打包；
- Mermaid 图表通过 `vitepress-plugin-mermaid` 集成；
- 阅读增强通过 `@nolebase/vitepress-plugin-enhanced-readabilities` 提供。

## 约定

- 设计变更先更新 `rfc/0300-unified-architecture-and-contracts.md`，再同步 `architecture/` 下的实施架构页；
- 新增包必须遵循 `architecture/packages/package-baseline.md`。
