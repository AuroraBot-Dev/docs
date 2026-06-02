---
title: 认知节点开发
description: 基于 base.py + node_factory + topology.yaml 的认知节点开发方式。
order: 1
---

# 认知节点开发

::: warning
施工中... 指文本大致正确, 但是不完整或缺乏人工审核, 暂时仅供参考.
:::

认知节点（Brain Node）是 AuroraBot 认知系统中的插件化工作单元。目前节点体系已运行在生产电路中，开放给开发者扩展。

## 节点分类

| 类型     | 基类           | LLM 调用 | 执行时间 | 用途                           |
| -------- | -------------- | -------- | -------- | ------------------------------ |
| `Agent`  | `Agent(Node)`  | ✅       | 不确定   | 意图识别、规划、展开等         |
| `Router` | `Router(Node)` | ❌       | 可预测   | 条件分支、汇合、扇出、缓存匹配 |

Agent 执行时通过 `llm_chat()` 调用 LLM（项目内所有 LLM 调用的唯一入口）；Router 执行纯逻辑，零 LLM 开销。

## 三步添加一个新节点

### 1. 编写节点类

继承 `Agent` 或 `Router`，实现 `guards` / `produces` / `execute()`：

```python
# src/brain/nodes/agents/my_agent.py
from src.brain.kernel.base import Agent, FileDescriptor, FilePattern, FileUpdate
from src.brain.ai.llm_gate import llm_chat

class MyAgent(Agent):
    _default_guards = ["inbox/event_*.json"]
    _default_produces = ["plans/my_plan.json"]

    def __init__(self, node_id: str, **kwargs):
        super().__init__(node_id, system_prompt="You are...", **kwargs)

    async def execute(self) -> list[FileUpdate]:
        # 读 guards 中的文件 → llm_chat() → 写 produces 中的文件
        ...
```

Router 只需做纯逻辑运算。

### 2. 注册到节点工厂

在 `src/brain/kernel/node_factory.py` 的 `NODE_REGISTRY` 中注册：

```python
NODE_REGISTRY: dict[str, type[Node]] = {
    ...
    "my_agent": MyAgent,
}
```

如果节点需要 `host` 引用、接收额外 `config` 或需要 `UnifiedMemoryManager`，需要在 `NODE_NEEDS_HOST` / `NODE_ACCEPTS_CONFIG` / `NODE_NEEDS_MEMORY` 中声明。

### 3. 在拓扑配置中启用

在 `src/brain/nodes/topology.yaml` 添加节点：

```yaml
nodes:
  - id: my-agent
    type: my_agent
    enabled: true
    watch:
      - "inbox/event_*.json"
    config:
      some_param: value
```

`watch` 和 `emit`（可选）可覆盖节点类中的默认 `guards` / `produces`。多个节点通过文件模式隐式连边，无需声明上下游关系。

## 内置节点参考

`src/brain/nodes/agents/` 下已实现的 Agent：

| 文件                       | 节点类型（注册名）    | 状态     | 职责                          |
| -------------------------- | --------------------- | -------- | ----------------------------- |
| `internalizer.py`          | `internalizer`        | ✅ 启用  | B→A 转义者：事件→第一人称体验 |
| `externalizer.py`          | `externalizer`        | ✅ 启用  | A→B 转义者：自我决定→JSON动作 |
| `memory_consolidator.py`   | `memory_consolidator` | 禁用     | 记忆沉淀与归档                |
| `action_planner.py`        | `action_planner`      | 禁用     | (旧) LLM 动作规划             |
| `impulse_gate.py`          | `impulse_gate`        | 禁用     | (旧) 门控判断                 |
| `polaris_agent.py`         | `polaris`             | 禁用     | (旧) 单体 Agent               |

`src/brain/nodes/routers/` 下已实现的 Router：

| 文件                      | 节点类型（注册名）     | 状态     | 职责                    |
| ------------------------- | ---------------------- | -------- | ----------------------- |
| `message_preprocessor.py` | `message_preprocessor` | ✅ 启用  | 事件收束 & 消息防抖     |
| `command_dispatcher.py`   | `command_dispatcher`   | ✅ 启用  | JSON 解析 → 命令派发    |
| `heartbeat_generator.py`  | `heartbeat_generator`  | ✅ 启用  | 周期性心跳 (60s)        |
| `timer_scheduler.py`      | `timer_scheduler`      | ✅ 启用  | cron 规则 → 节律触发器  |
| `metrics_collector.py`    | `metrics_collector`    | 禁用     | 文件流转统计            |
| `switch_router.py`        | `switch_router`        | 禁用     | 条件分支                |
| `merge_router.py`         | `merge_router`         | 禁用     | 归并多个文件            |
| `broadcast_router.py`     | `broadcast_router`     | 禁用     | 广播到多个下游          |
| `dead_letter_router.py`   | `dead_letter_router`   | 禁用     | 超期文件回收            |

## 设计约束

- Agent 不直接调用 LLM API——走 `llm_chat()` 统一入口
- Agent 不直接访问 App 的私有文件
- 节点本身无内部状态，每次 `execute()` 后理论上可回收

## 继续阅读

- 想理解认知架构：读 [认知架构](../architecture/brain-architecture.html)
- 想理解节点设计哲学与数据结构：读 [节点系统](../architecture/node-system.html)
- 想开发 App 插件：读 [App 开发指南](./app-development.html)
