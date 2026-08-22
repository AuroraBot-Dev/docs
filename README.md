# AuroraBot 文档

本仓库是 AuroraBot 文档站与唯一 RFC 的源码。文档站当前包含：

- 开始与配置：AgentTree 最小运行的最小上手路径；
- 架构：系统总览、AgentTree 语义，以及按包拆分的 `docs/architecture/packages/` 栏目；
- 开发：端口扩展方式与贡献治理；
- RFC：唯一设计基准。

```bash
npm install
npm run docs:dev
npm run docs:build
```

设计变更先更新 `rfc/0300-unified-architecture-and-contracts.md`，再同步 `architecture/` 下的实施架构页。
新增包必须遵循 `architecture/packages/package-baseline.md`。
