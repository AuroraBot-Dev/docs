---
order: 3
---

# src/world

世界线的唯一持久化实现。**逻辑上是总线，代码上是叶子**：只有 `aurora.composition.world` 可以构造它，
其他包只能通过 `src.contracts` 中的端口使用同一单例。

## 职责

- SQLite + SQLAlchemy 的只追加提交存储；
- 每个 scope 的单调 sequence 分配；
- 全局 `insertion_sequence` 连续游标、`cursor()` 与 `stream(after, limit)` 分页；
- 按 scope 的 `head` / `delta` / `commits` / `active_scopes(since)` 查询；
- 稳定 `commit_id` 的幂等追加：重复提交同 ID 且内容一致时返回原提交，内容冲突立即失败；
- schema version 与逐版本 migration。

## 组合

`COMPOSITION_REGISTRARS` 的第一项是 `world.register`，随后组件全部通过
`context.require(WORLD_JOURNAL)` 取得同一实例。`SqlAlchemyWorldJournal.initialize()` 幂等；
`run_project()` 在进入 Console 前初始化一次，热路径不再承担建库职责。

## 提交规则

1. **scope 由提交方决定**：`WorldCommitInput.scopes` 非空；world 不推断、不改写。
2. **kind 与 source 由提交方决定**：world 不按字符串分支。
3. **commit_id 由提交方决定**：可重放事件必须使用确定 ID；一次性事实允许随机 ID。
4. **世界不产生事件**：tick、input、config 变更与 MCP 外部事实由 console / cadence / ops / mcp 等生产者提交。

## 当前事件 kind

| kind | 来源 | 典型 scope |
| --- | --- | --- |
| `environment.<kind>` | 环境适配器/ops POST | 提交方指定 |
| `console.input` | console | `aurora:console` |
| `engine.tree.started` / `completed` / `failed` | engine | `aurora:tree:<id>` |
| `engine.node.spawned` / `completed` / `failed` | engine | `aurora:tree:<id>` |
| `engine.model.requested` / `completed` / `failed` | engine | `aurora:tree:<id>` |
| `tool.requested` / `succeeded` / `failed` / `unknown` | engine | `aurora:tree:<id>` + 工具 publish |
| `output.requested` / `committed` | engine | `aurora:tree:<id>` |
| `engine.world.delta_delivered` | engine | `aurora:tree:<id>` |
| `cadence.tick` / `tree_planned` / `tree_failed` | cadence | `aurora:cadence` |
| `mcp.app.starting` / `ready` / `failed` / `disconnected` | mcp | `aurora:mcp:<package>` |
| `mcp.catalog.frozen` / `changed` | mcp | `aurora:mcp:<package>` |
| `mcp.event.received` | mcp | 载荷业务 scope，可附加 `aurora:mcp:<package>` |
| `ops.config.changed` | ops | `aurora:config` |
| `ops.tree.requested` / `ops.process.shutdown_requested` | ops | `aurora:system` |

## ops 入口

- `GET /world/stream?after=&limit=` → 全局事件流 JSON；
- `GET /world/commits/{commit_id}` → 单条提交正文 JSON。

## 边界

- 不导入 engine、agents、tools、prompt、ai、console、aurora 或 ops；
- 不保存 AgentTree 快照，不承担运行时状态权威；
- 不做实时推送；消费者按游标或 frontier 拉取。
- MCP 适配器负责拒绝伪造 `engine.*`、`tool.*`、`output.*`、`cadence.*` 与 `ops.*` 的外部载荷；world 仍只校验、编号和追加。
- MCP 事件只增加世界事实，不直接写 AgentNode transcript、完成 Tool call 或启动 AgentTree。
