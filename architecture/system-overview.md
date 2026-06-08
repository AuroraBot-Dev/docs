---
title: 架构总览
description: 运行时两条协程线的协作方式——App循环、事件桥、认知电路的职责与代码位置。
order: 1
---

# 架构总览

AuroraBot 总体基于 NoneBot2 框架。项目的独特点在于**CortexForge**: 一个文件驱动、事件驱动的认知引擎。

## 代码结构

```
AuroraBot/
├── apps/                    -- 各应用, 通过 manifest.yaml 声明能力
├── src/
│   ├── main.py              -- NoneBot 启动钩子
│   ├── platform/            -- 应用宿主(发现、注册、生命周期、事件队列、命令调度)
│   └── brain/               -- 认知引擎
│       ├── runtime.py       -- 运行时管理器
│       ├── kernel/          -- Node 基类、Circuit 编排器、FileEventBus 总线
│       ├── nodes/           -- Agent(LLM) + Router(纯逻辑)
│       ├── memory/          -- 三级记忆 + UnifiedMemoryManager
│       ├── ai/              -- 多角色模型网关
│       ├── localhost/       -- 本地控制台(CLI 调试)
│       └── prompts/         -- LLM 提示词
```

## 运行时模型

启动后，`RuntimeState` 管理两条并行的协程线：

**协程线 A — App 循环** (`run_app_loop`)

```
while 未停止:
    host.tick()          # 遍历所有 App，调用 on_tick()
    sleep(interval)
```

::: tip
App 在 `on_tick()` 中感知外部变化（如 QQ 消息），通过 `PlatformAPI.emit_event()` 将 `AppEvent` 推入 `ApplicationHost` 的事件队列。
:::

**协程线 B — 事件桥 + 认知电路** (`run_event_bridge` + `Circuit`)

```
while 未停止:
    events = host.drain_events()
    for event in events:
        写入 data/kernel/inbox/pending/event_<type>_<id>.json
    sleep(interval)
```

::: tip
文件落盘自动触发 `FileEvent`，经 `FileEventBus.dispatch_forever()` 分发到匹配的节点。节点的 `execute()` 产出新文件，再次触发下游节点，形成循环。
:::

**协程线 C — 本地控制台** (`run_console_control_loop`)

提供命令行交互式调试能力，支持运行时热重载、状态查询等。

## 启动流程

两阶段启动: 平台先注册 App → `start_runtime()` 根据 `RUN_MODE` 按需启动 App 循环、Circuit、EventBridge。详见:

- 平台侧: [平台运行时 - 启动](./platform-runtime.md#启动)
- 内核侧: [内核运行时 - 启动](./kernel-runtime.md#启动)

## 下一步阅读

- 想了解 Platform 与 App 的契约: [平台运行时](./platform-runtime.html)
- 想了解 Circuit 与 EventBridge 的协作: [内核运行时](./kernel-runtime.html)
- 想了解认知引擎的详细机制: [认知引擎架构](./brain-architecture.html)
