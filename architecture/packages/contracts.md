---
order: 2
---

# src/contracts

公共值对象与端口的唯一来源。任何包需要跨边界共享事实或能力时，先在这里增加 DTO 或 Protocol，
不得让上层包 import 另一个具体包。

## 职责

- `AgentTree`、`AgentNode`、`AgentDefinition`：树与节点的不可变值对象；
- `ChatMessage`、`ModelRequest`、`ToolCall`：四角色消息与调用契约；
- `Tool`、`ScopedTool`、`ToolOutput`、`DelegationRequest`：工具域端口；
- `WorldReader`、`WorldWriter`、`WorldJournal`：世界线窄端口；
- `WorldFrontier`、`WorldDeltaPage`、`WorldStreamPage`：观察前沿、scope 分页与全局流分页；
- 稳定 scope/kind 常量：`tree_scope()`、`CONSOLE_SCOPE`、`CONFIG_SCOPE`、`SYSTEM_SCOPE` 与
  `TREE_*`、`NODE_*`、`MODEL_*`、`TOOL_*`、`OUTPUT_*` 等事件 kind。

## 边界

- 只依赖标准库；
- 不导入 `src/world`、`src/engine`、`aurora` 或 `ops`；
- 端口只描述能力，不绑定 SQLAlchemy、LiteLLM、prompt-toolkit 或任何实现。

## 世界线端口

```python
class WorldReader(Protocol):
    async def head(...)
    async def delta(...)
    async def commit(...)
    async def commits(...)
    async def stream(...)
    async def tree_index(...)

class WorldWriter(Protocol):
    async def append_event(...)
    async def append_commit(...)
    async def append_commits(...)

class WorldJournal(WorldReader, WorldWriter, Protocol):
    async def initialize(...)
    async def close(...)
```

组合根把同一个 `WORLD_JOURNAL` 实例以不同窄端口注入各包；只有 engine 拿到完整 `WorldJournal`。
