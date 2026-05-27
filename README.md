<p align="center">
  <img src="./assets/logo.svg" width="120" alt="AuroraBot Logo" />
</p>

<h1 align="center">AuroraBot 文档站</h1>

<p align="center">
  <b>中文</b> | <a href="README.en.md">English</a> | <a href="README.ja.md">日本語</a>
</p>

<p align="center">
  <em>基于 NoneBot2 的新一代内驱式、自主决策的智能体框架</em>
</p>

<p align="center">
  声明式认知拓扑 · 三级联合记忆 · 统一 LLM 网关
</p>

<p align="center">
  <a href="https://github.com/AuroraBot-Dev/AuroraBot"><img src="https://img.shields.io/badge/GitHub-仓库-black?logo=github" alt="GitHub" /></a>
  <a href="https://www.aurorabot.org/"><img src="https://img.shields.io/badge/Docs-文档站-blue?logo=vitepress" alt="Docs" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-CC%20BY%20SA%204.0-blue" alt="License" /></a>
</p>

---

## 快速导航

### 开始

| 文档                                                               | 说明                                   |
| ------------------------------------------------------------------ | -------------------------------------- |
| [项目总览](https://www.aurorabot.org/start/overview.html)          | 快速了解 AuroraBot 的定位与四层分层    |
| [快速开始](https://www.aurorabot.org/start/getting-started.html)   | 从零把项目跑起来                       |
| [配置说明](https://www.aurorabot.org/start/configuration.html)     | 环境变量、平台配置、应用配置与人格文档 |
| [离线文档站](https://www.aurorabot.org/start/offline-docsite.html) | 本地离线预览文档站                     |

### 架构

| 文档                                                                           | 说明                                               |
| ------------------------------------------------------------------------------ | -------------------------------------------------- |
| [架构总览](https://www.aurorabot.org/architecture/system-overview.html)        | 理解 Apps / Platform / Kernel / Brain 四层         |
| [平台运行时](https://www.aurorabot.org/architecture/platform-runtime.html)     | 理解宿主与 App 的运行时关系                        |
| [内核运行时](https://www.aurorabot.org/architecture/kernel-runtime.html)       | Circuit + EventBridge 的启动、调度与关闭           |
| [认知引擎架构](https://www.aurorabot.org/architecture/brain-architecture.html) | 文件驱动认知管道与当前启用的认知管线               |
| [节点系统](https://www.aurorabot.org/architecture/node-system.html)            | Node / Agent / Router 的数据结构、事件总线与状态机 |
| [记忆系统](https://www.aurorabot.org/architecture/memory-system.html)          | L1 / L2 / L3 三级联合记忆的存储与检索              |

### 开发

| 文档                                                                          | 说明                         |
| ----------------------------------------------------------------------------- | ---------------------------- |
| [认知节点开发](https://www.aurorabot.org/develop/brain-node-development.html) | 编写 Agent / Router 节点     |
| [App 开发指南](https://www.aurorabot.org/develop/app-development.html)        | 从目录结构到生命周期开发 App |
| [AUR CLI](https://www.aurorabot.org/develop/aur-cli.html)                     | 应用开发工具链路线图         |

### 问答

| 文档                                                               | 说明                                     |
| ------------------------------------------------------------------ | ---------------------------------------- |
| [跨平台](https://www.aurorabot.org/qa/cross-platform.html)         | 操作系统与部署环境兼容性                 |
| [多 IM 接入](https://www.aurorabot.org/qa/about-multi-im.html)     | 同时接入多个聊天平台的架构设计与扩展方式 |
| [关于适配器](https://www.aurorabot.org/qa/about-adapters.html)     | NapCat、NoneBot2 适配器与协议端          |
| [关于 OneBot 协议](https://www.aurorabot.org/qa/about-onebot.html) | OneBot v11 标准协议简介                  |

### 附录

| 文档                                                                               | 说明                                     |
| ---------------------------------------------------------------------------------- | ---------------------------------------- |
| [内核运行时流程图](https://www.aurorabot.org/appendix/kernel-runtime-flow.html)    | 启动、运行、事件处理的序列图             |
| [认知引擎设计笔记](https://www.aurorabot.org/appendix/cortex-forge-whitebook.html) | 文件驱动、事件总线与声明式拓扑的设计理念 |

## 开源致谢

| 文档                                                                                   | 说明                   |
| -------------------------------------------------------------------------------------- | ---------------------- |
| [VitePress](https://github.com/vuejs/vitepress)                                        | 静态站点生成框架       |
| [Mermaid](https://github.com/mermaid-js/mermaid)                                       | 图表与流程图渲染       |
| [vitepress-plugin-mermaid](https://github.com/emersonbottero/vitepress-plugin-mermaid) | VitePress Mermaid 插件 |
| [vitepress-sidebar](https://github.com/jooy2/vitepress-sidebar)                        | 自动生成侧边栏导航     |

## 协议说明

文档站内容遵循 [CC BY-SA 4.0](https://creativecommons.org/licenses/by/4.0/) 协议。详细协议内容请参考 [LICENSE](./LICENSE) 文件。

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/JuFireX">JuFireX</a> | <a href="https://github.com/AuroraBot-Dev">AuroraBot-Dev</a></sub>
</p>
