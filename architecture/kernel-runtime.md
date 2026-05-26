---
title: 内核运行时
description: Circuit + EventBridge 的实际运行机制——启动、调度、文件落盘与节点执行循环。
order: 3
---

# 内核运行时

本文描述认知引擎的结构和启动后的运作方式

::: warning
源码 API 文档正在施工中...
:::

## 启动

[平台侧启动](./platform-runtime.md#启动) (discover → load config → register → on_start) 完成后，`startup_agent()` 继续初始化内核:

1. `build_circuit(app_host)` — 读 `topology.yaml`，通过 `NODE_REGISTRY` 实例化节点
2. `circuit.start()` — 启动 `dispatch_forever` 协程 + 各个 `node.run()` 协程
3. `circuit._bootstrap_heartbeat()` — 写入首个 `heartbeat/tick.json`，注入初始 `FileEvent`
4. `run_event_bridge()` — 创建 `asyncio.Task`，将 `ApplicationHost._events` 桥接到 `FileEventBus`

::: tip
仅在 `RUN_MODE` 为 `agent` / `core` / `prod` 时启动。平台侧的 `run_app_loop()` 启动逻辑见 [平台运行时](./platform-runtime.md#运行时)。
:::

## 运行时

`main.py` 通过 `asyncio.create_task` 创建 `run_event_bridge()` 协程，`Circuit` 内部另有一组协程:

### 1. 事件桥 — `run_event_bridge()`

```python
# src/brain/nodes/event_bridge.py

while not stop_event.is_set():
    events = host.drain_events()
    for event in events:
        file_path = f"inbox/pending/event_{type}_{id}.json"
        circuit.apply_update(FileUpdate(...), node_id="event_bridge")
    await asyncio.sleep(interval)
```

`apply_update()` 由 `FileEventBus` 执行：写文件 → 生成 `FileEvent` → `publish` 入队列。将平台侧产出的 `AppEvent` 转换为内核侧的文件事件，驱动认知电路运转。

::: tip
仅在 `RUN_MODE` 为 `agent` / `core` / `prod` 时启动。
:::

### 2. 认知电路 — `Circuit` + `FileEventBus`

`src/brain/kernel/circuit.py` + `src/brain/kernel/event_bus.py`

`Circuit` 创建 `FileEventBus`，注入所有节点，管理 `dispatch_forever` 和 `node.run()` 协程。启动时 `_bootstrap_heartbeat()` 注入首个 `FileEvent` 激活管道。

::: tip
认知周期流程、节点状态机和文件写入锁机制见 [节点系统 - FileEventBus](./node-system.md#fileeventbus--事件总线)。
:::

## 关闭

内核侧关闭顺序:

1. `_stop_event.set()` — 通知所有协程停止
2. `_bridge_task.cancel()` — 取消事件桥协程
3. `circuit.stop()` — 将所有节点标记 `TERMINATED`，取消各 `node.run()` 协程和 `dispatch_forever`

::: tip
平台侧的 `_app_task` 取消和 `app_host.stop_all()` 见 [平台运行时 - 关闭](./platform-runtime.md#关闭)。
:::

## 下一步阅读

- 想了解节点数据结构与调度细节: 读 [节点系统](./node-system.html)
- 想了解认知管线的完整拓扑: 读 [认知引擎架构](./brain-architecture.html)
- 想了解 App 生命周期: 读 [平台运行时](./platform-runtime.html)
