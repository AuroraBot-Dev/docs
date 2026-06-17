---
title: 认知引擎设计笔记
description: 文件驱动、事件总线与声明式拓扑——核心设计理念记录。
order: 2
---

# 认知引擎设计笔记

本文记录 AuroraBot 认知引擎（内部代号 CortexForge）的核心设计——以下内容均已实现在当前代码中。

## 核心设计

### 文件作为数据载体

所有认知状态和事件以 JSON 文件形式存放在 `data/kernel/` 下。文件不是临时变量，是**持久的、可追踪的数据单元**。

代码对应：`src/brain/kernel/base.py` 中的 `FileDescriptor`、`FileEvent`、`FileUpdate`。
实际落盘由 `FileEventBus.apply_update()` 执行，为每个文件路径维护 `asyncio.Lock`。

### 节点作为处理单元

一切认知逻辑封装为 `Node`。代码中分为两类：

- **Agent** — 调用 LLM（通过 `llm_chat()`），执行时间不确定
- **Router** — 纯逻辑运算，零 LLM，执行时间可预测

节点不保持运行内存状态（LLM 上下文除外）。节点实例可随时销毁与重建。

代码对应：`src/brain/kernel/base.py` 中的 `Node` / `Agent` / `Router`。

### 事件总线作为调度系统

文件变更通过 `FileEventBus` 广播。节点通过 glob 模式订阅事件（`FilePattern.match()`），自行决定是否激活。`dispatch_forever()` 协程持续从 `asyncio.Queue` 取事件并遍历匹配。

代码对应：`src/brain/kernel/event_bus.py` 的 `FileEventBus`。

### 声明式拓扑配置

节点的邻接关系不在代码中硬编码，而在 `topology.yaml` 中声明。每行的 `watch` / `emit` 字段定义节点监听的 glob 模式和产出的文件路径。相邻节点靠文件模式自动连边，无需显式声明上下游。

### 桥接外部事件

`EventBridge`（`src/brain/nodes/event_bridge.py`）将 `ApplicationHost` 队列中的 `AppEvent` 转化为文件写入，注入 `Circuit`。这是 App 层到认知层的正式接口。

## 当前拓扑 (Kernel-γ)

```yaml
# topology.yaml — 当前 enabled: true 的节点
nodes:
  - id: message_preprocessor  # 事件收束 & 消息防抖
  - id: internalizer          # B→A 转义者：事件→第一人称体验
  - id: externalizer          # A→B 转义者：自我决定→JSON动作
  - id: command_dispatcher    # JSON 解析 → 命令派发
  - id: heartbeat             # 周期性心跳 (60s)
  - id: timer_scheduler       # cron 规则 → 节律触发器
```

## 文件生命周期 (Kernel-γ)

```
inbox/pending/  →  MessagePreprocessor  →  pipeline/message_queue/
                 →  Internalizer        →  pipeline/internalized/ + self/stream/now.md
                 →  Externalizer        →  pipeline/action_queue/
                 →  CommandDispatcher   →  App 命令执行

heartbeat/tick.json  →  TimerScheduler  →  rhythm/triggers/
                     →  MessagePreprocessor → (同上管线)
```

每个处理节点处理完毕后将输入文件移入 `done/` 子目录。
