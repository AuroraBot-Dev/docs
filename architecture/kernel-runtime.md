---
title: 内核运行时
description: Circuit + EventBridge 的实际运行机制——启动、调度、文件落盘与节点执行循环。
order: 3
---

# 内核运行时

本文描述 Kernel-γ 认知引擎的启动和运作方式。

::: warning
源码 API 文档正在施工中...
:::

## 启动

[平台侧启动](./platform-runtime.md#启动) (discover → load config → register → on_start) 完成后，`start_runtime()` 继续初始化内核:

1. `build_circuit(app_host)` — 读 `topology.yaml`，通过 `NODE_REGISTRY` 实例化节点
2. `circuit.start()` — 创建 `FileEventBus`，启动 `dispatch_forever` 协程 + 各个 `node.run()` 协程
3. 心跳自举 — `HeartbeatGenerator` 启动后写入首个 `heartbeat/tick.json`，注入初始 `FileEvent`
4. `run_event_bridge()` — 创建 `asyncio.Task`，将 `ApplicationHost._events` 桥接到 `FileEventBus`
5. 本地控制台 — `run_console_control_loop()` 创建交互式命令行

::: tip
仅在 `RUN_MODE` 为 `agent` / `core` / `dev` / `prod` 时启动内核组件。`start_runtime()` 统一管理启动逻辑，详见 `src/brain/runtime.py`。
:::

## 运行时

`RuntimeState` 数据类管理全部协程的引用和生命周期：

```python
@dataclass(slots=True)
class RuntimeState:
    host: ApplicationHost
    stop_event: asyncio.Event
    circuit: Circuit | None = None
    app_task: asyncio.Task | None = None
    bridge_task: asyncio.Task | None = None
```

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
事件桥轮询间隔由 `EVENT_BRIDGE_INTERVAL` 环境变量控制，默认 1.5 秒。
:::

### 2. 认知电路 — `Circuit` + `FileEventBus`

`src/brain/kernel/circuit.py` + `src/brain/kernel/event_bus.py`

`Circuit` 创建 `FileEventBus`，注入所有 enabled 节点，管理 `dispatch_forever` 和 `node.run()` 协程。

::: tip
认知周期流程、节点状态机和文件写入锁机制见 [节点系统 - FileEventBus](./node-system.md#fileeventbus--事件总线)。
:::

### 3. 本地控制台 — localhost

`src/brain/localhost/` 提供命令行交互式调试能力：

- **shell.py** — 控制台主循环，基于 `rich` 库
- **commands/** — 内置命令：`say`（注入消息）、`invoke`（调用命令）、`emit`（注入事件）、`memtest`（记忆测试）、`self_cli`（自我之流查询）
- **reloader.py** — 运行时热重载支持

## 关闭

`shutdown_runtime()` 中关闭顺序:

1. `state.stop_event.set()` — 通知所有协程停止
2. `stop_runtime_components()`:
   - `bridge_task.cancel()` — 取消事件桥协程
   - `circuit.stop()` — 将所有节点标记 `TERMINATED`，取消各 `node.run()` 协程和 `dispatch_forever`
   - `app_task.cancel()` — 取消 App 循环协程
3. `host.stop_all()` — 遍历所有 App 调用 `app.on_stop()`

## 下一步阅读

- 想了解节点数据结构与调度细节: 读 [节点系统](./node-system.html)
- 想了解认知管线的完整拓扑: 读 [认知引擎架构](./brain-architecture.html)
- 想了解 App 生命周期: 读 [平台运行时](./platform-runtime.html)
