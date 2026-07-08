---
title: Kernel-γ 路线图归档
description: 旧 Brain 设计路线图的历史归档。
order: 4
---

# Kernel-γ 路线图归档

::: warning
本文是历史归档。Kernel-γ 的 Pool A / Pool B、Internalizer / Externalizer、action queue 等设计不再作为 AuroraBot 的目标架构。
:::

这份路线图曾经推动 AuroraBot 从“消息处理流水线”转向“统一认知主体”。其中最有价值的思想仍然保留：

- 不把用户消息视为唯一中心。
- 所有事件都是主体经历的一部分。
- Bot 应有连续的自我状态与记忆沉淀。
- 文件化痕迹有利于复盘和调试。

但旧方案的问题也很明确：

- 双池物理划分过重，容易把实现细节误当成认知模型。
- Externalizer 与 command dispatcher 让行动链依赖文本 JSON 解析。
- 旧节点拓扑难以表达处境、关系、承诺和行动节奏。
- App/Platform 迁移到 MCP 后，旧命令派发模型已不适合作为长期目标。

新的 Brain 方向见：[Brain 架构重设计](../architecture/brain-redesign.html)。
