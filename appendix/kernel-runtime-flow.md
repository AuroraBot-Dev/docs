---
title: 旧内核运行时流程归档
description: 旧 ApplicationHost + EventBridge + Circuit 流程的历史归档。
order: 1
---

# 旧内核运行时流程归档

::: warning
本文是历史归档。旧 `ApplicationHost`、`run_app_loop()`、`AppEvent` 队列和 `command_dispatcher` 不再是目标运行时。
:::

旧流程的价值在于证明文件驱动调度可行：

```text
AppEvent -> EventBridge -> inbox/pending/*.json -> FileEventBus -> Node
```

重构完成后，入口改为：

```text
MCP notification -> AMP envelope -> unified event inbox -> Brain
```

行动链改为：

```text
Brain ActionIntent -> MCP tools/call -> App MCP Server -> tool result event
```

新的目标运行时见：

- [架构总览](../architecture/system-overview.html)
- [平台运行时](../architecture/platform-runtime.html)
- [Brain 架构重设计](../architecture/brain-redesign.html)
