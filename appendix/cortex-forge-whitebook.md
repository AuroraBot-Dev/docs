---
title: CortexForge 设计笔记归档
description: 文件驱动认知引擎早期设计的历史归档。
order: 2
---

# CortexForge 设计笔记归档

::: warning
本文是历史归档。早期 Node / Agent / Router 拓扑说明不再作为稳定开发文档。
:::

仍然保留的设计资产：

- 文件可作为认知痕迹和调试证据。
- 事件总线可以解耦输入、处理和后续派生事件。
- 声明式拓扑适合表达可观察的认知流程。
- 运行状态应该可回放，而不是只存在内存调用栈里。

需要替换的旧假设：

- 认知不应被固定为单条 pipeline。
- 行动不应依赖模型输出文本 JSON 后再解析。
- App 能力不应通过进程内命令表注册。
- 记忆不应只围绕聊天历史组织。

新的 Brain 设计见：[Brain 架构重设计](../architecture/brain-redesign.html)。
