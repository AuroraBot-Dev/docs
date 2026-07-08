---
title: Brain 运行时
description: Brain 运行时正在重设计；本文只声明边界。
order: 3
---

# Brain 运行时

::: warning
施工中。当前代码中的 Kernel 运行时仍可作为实现参考，但不再作为文档站的目标架构。
:::

重构后的 Platform 会把标准 MCP 信号和 Aurora 原生 App 事件归一化为 AMP envelope，再写入 Brain 的统一事件入口。Brain 内部如何调度、如何分层、如何沉淀记忆正在重设计。

稳定边界：

- Brain 接收统一事件，不直接接平台协议。
- Brain 发起行动意图，不直接操作 App 私有实现。
- Tool 调用通过 Platform 的 MCP Client Manager 执行。
- 文件仍可作为认知痕迹载体，但旧 action queue 不再是长期目标。

下一步阅读：[Brain 架构重设计](./brain-redesign.html)。
