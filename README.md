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

也可从仓库根目录使用脚本（`docs` 是 Git 子模块，`docs_setup` 会先初始化子模块）：

```bash
# Linux / macOS
./scripts/linux/docs_setup.sh        # 初始化子模块并安装依赖
./scripts/linux/docs_update.sh       # 拉取子模块最新提交并更新依赖
./scripts/linux/docs_preview.sh      # 本地预览（或 scripts/macos/docs_*.command）
./scripts/linux/docs_build.sh        # 生产构建

# Windows (PowerShell)
.\scripts\windows\docs_setup.ps1
.\scripts\windows\docs_update.ps1
.\scripts\windows\docs_preview.ps1
.\scripts\windows\docs_build.ps1
```

`docs_setup` 与 `docs_update` 会先通过 `git submodule update --init` 确保 `docs` 子模块已检出（未初始化时自动补上），再安装依赖；`docs_update` 会把子模块更新到远端最新提交，指针变化时需在主仓提交该变化。

## 配置说明

- `.npmrc` 中设置了 `node-linker=hoisted`，使 pnpm 以平铺方式安装依赖，兼容 Vite 的依赖预打包；
- Mermaid 图表通过 `vitepress-plugin-mermaid` 集成；
- 阅读增强通过 `@nolebase/vitepress-plugin-enhanced-readabilities` 提供。

## 约定

- 设计变更先更新 `rfc/0300-unified-architecture-and-contracts.md`，再同步 `architecture/` 下的实施架构页；
- 新增包必须遵循 `architecture/packages/package-baseline.md`。
