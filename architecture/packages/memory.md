---
order: 9
---

# src/memory

世界线驱动的简化记忆。当前只做一件事：查询时返回**最近一小时有活动的 scope** 的最新 50 条提交（含完整 data 细节）。

## 职责

- 持有 `WorldReader`，不写世界；
- `Memory.recall(now=...)`：
  1. 用 `active_scopes(since)` 找出窗口内有活动的 scope；
  2. 对每个 scope 用 `head` 得到当前序号；
  3. 读取最近 50 条 `commits`，生成 `MemorySnapshot`；
- `Memory.render(snapshot)` 把快照渲染为可注入 system 的文本。

## 与 prompt 的联动

`AgentTreeRunner` 在每次模型请求前调用 `Memory.recall()`，把 `MemorySnapshot` 传给
`PromptAssembler.assemble(..., memory=...)`。记忆以“最近一小时的世界活动”片段注入唯一 system 消息；
不写 transcript、不创建第二条上下文路径。

## 组合

- 实例键：`MEMORY = InstanceKey[Memory]("memory.reader")`；
- 在 world 之后注册，注入同一个世界单例的只读端口；
- engine 通过 `MemoryReader` 协议消费，不 import `src.memory`。

## 世界访问权

只读 `WorldReader`。

## ops 入口

- `GET /memory`、`/memory`：当前记忆快照 JSON。
