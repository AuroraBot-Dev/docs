---
title: 节点系统
description: 旧节点系统说明已降级为施工中资料。
order: 5
---

# 节点系统

::: warning
施工中。旧 Node / Agent / Router 体系仍存在于当前代码，但它不是重构后的目标认知模型。
:::

当前可以暂时依赖的原则：

- Brain 内部状态应可追溯。
- 认知单元之间不应通过隐式全局变量耦合。
- App 能力必须通过 MCP Tool 进入 Brain 的行动空间。
- 事件必须先被归一化，再进入认知流程。

不建议在此阶段新增依赖旧 `command_dispatcher`、旧 action queue 或旧 Kernel-γ 双池假设的文档。

新的认知分层方案见：[Brain 架构重设计](./brain-redesign.html)。
