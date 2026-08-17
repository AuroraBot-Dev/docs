<p align="center">
  <img src="./public/logo.svg" width="120" alt="AuroraBot Logo" />
</p>

<h1 align="center">AuroraBot 文档站</h1>

<p align="center">
  <b>中文</b> | <a href="README.en.md">English</a> | <a href="README.ja.md">日本語</a>
</p>

<p align="center">
  <em>让 Agent 拥有自己的生活。</em>
</p>

本文档站面向 AuroraBot `nightly` 分支，当前对齐
[`9c9e215`](https://github.com/AuroraBot-Dev/AuroraBot/commit/9c9e215e10ac5f5b6c0ea9551d3c65bad8fb26bd)
（0.6.0 alpha 开发线）。它只描述现行实现；旧 Kernel、Brain、Node 与文件投递箱架构已经移除。

## 阅读入口

### 开始

| 文档 | 说明 |
| --- | --- |
| [认识 AuroraBot](https://www.aurorabot.org/start/overview) | 产品定位、核心概念和当前边界 |
| [快速开始](https://www.aurorabot.org/start/getting-started) | 从 nightly 源码完成首次启动 |
| [配置](https://www.aurorabot.org/start/configuration) | TOML、密钥、模型、Agent 与 App |
| [运行与操作](https://www.aurorabot.org/start/operations) | Console、命令、日志与停机 |
| [Web 管理面板](https://www.aurorabot.org/start/panel) | 后端认证与独立前端项目 |

### 架构

| 文档 | 说明 |
| --- | --- |
| [系统总览](https://www.aurorabot.org/architecture/system-overview) | Engine 热路径、组合根和依赖方向 |
| [事件与运行时](https://www.aurorabot.org/architecture/event-runtime) | AMP、Inbox、Triage、Activity 与抢占 |
| [同构 Agent](https://www.aurorabot.org/architecture/agent-system) | Profile、权限、委派和决策契约 |
| [记忆系统](https://www.aurorabot.org/architecture/memory-system) | 域内窗口、跨域动态和全局事实 |
| [MCP Platform](https://www.aurorabot.org/architecture/platform-runtime) | stdio/HTTP App、工具发现和事件桥接 |
| [Ops 与持久化](https://www.aurorabot.org/architecture/operations-storage) | 操作树、Panel 安全与 SQLite 布局 |

### 开发

| 文档 | 说明 |
| --- | --- |
| [MCP App 开发](https://www.aurorabot.org/develop/app-development) | 用标准 MCP Server 添加感知与行动能力 |
| [Agent 扩展](https://www.aurorabot.org/develop/agent-development) | Profile 与 handler 的现行边界 |
| [AMP 事件协议](https://www.aurorabot.org/develop/amp) | 外部事实信封和幂等要求 |
| [CLI 参考](https://www.aurorabot.org/develop/aur-cli) | `start`、`check` 与 `donk` |
| [参与开发](https://www.aurorabot.org/develop/contributing) | 设计权威、质量门与改动入口 |

### 版本状态

| 文档 | 说明 |
| --- | --- |
| [Nightly 实现状态](https://www.aurorabot.org/reference/nightly-status) | 已实现、受限与文档编写中的能力 |
| [常见问题](https://www.aurorabot.org/reference/faq) | 平台、部署、QQ、数据和故障排查 |

## 本地预览

```bash
npm ci
npm run docs:dev
```

生产构建使用 `npm run docs:build`。

## 协议说明

文档站内容遵循 [CC BY-SA 4.0](https://creativecommons.org/licenses/by/4.0/) 协议。详见 [LICENSE](./LICENSE)。
