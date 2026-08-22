---
order: 10
---

# src/engine

AgentTree 的确定性执行器。engine 只负责把一棵已经决定的树跑完，不负责决定“是否该有一棵树”。

## 职责

- 深度优先选择 ready 节点，单线程执行一个 Model 或 Tool；
- `PromptAssembler` 组装上下文（模型请求前先召回 `MemorySnapshot` 注入 system），`ToolRegistry` 分派工具；
- delegate 结果只按 `DelegationRequest` 应用树操作，并按 parent allowlist、深度、节点数校验；
- 在 Tool batch 与 root draft 前检查世界 delta，未披露时先交付并显式封口；
- 通过 `WorldJournal` 记录一棵树的完整因果链。

## 世界事件

engine 以确定性 commit id 提交（节选）：

| 阶段 | kind |
| --- | --- |
| 树启动 / 完成 / 失败 | `engine.tree.started / completed / failed` |
| 节点创建 / 完成 / 失败 | `engine.node.spawned / completed / failed` |
| 模型请求 / 完成 / 失败 | `engine.model.requested / completed / failed` |
| 工具请求 / 成功 / 失败 | `tool.requested / succeeded / failed` |
| root 输出请求 / 发布 | `output.requested / committed` |
| 世界 delta 交付 | `engine.world.delta_delivered` |

模型事件只记录元数据（model、消息数、工具数、错误），不复制 transcript 正文；正文以 AgentTree 快照为准。

## TreeLaunchRequest

唤起决策已经从 engine 拆出到 `cadence`。`AuroraRuntime.launch_tree` 消费同一值对象：

```python
@dataclass(frozen=True)
class TreeLaunchRequest:
    message: str
    tree_id: str | None
    agent: str | None
    frontier: WorldFrontier
    caused_by: str | None
```

交互式 `/run` 与后台 cadence 唤起都落到 `engine.run` 同一入口。

## 组合

- 实例键：`ENGINE_RUNNER = InstanceKey[AgentTreeRunner]("engine.runner")`；
- 依赖 agents、prompt、tools、ai 与 world 单例；
- 观察回调只向组合根发布不可变 AgentTree 快照。

## ops 入口

- `GET /engine/status`、`/status`；
- `GET /trees`、`GET /trees/{tree_id}`、`GET /trees/{tree_id}/nodes/{node_id}`；
- `POST /trees`、`/run`：启动一棵新树；
- `POST /events`：提交一条环境事实，不自动启动树；
- `GET /world/{scope}`、`GET /forest`。
