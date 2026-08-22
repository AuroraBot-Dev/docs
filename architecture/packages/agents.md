---
order: 4
---

# src/agents

具体 Agent 的定义处。workerAgent、memoryAgent、gateAgent 等都应成为这里的 `AgentDefinition` 预设，
而不是新的 AgentNode 子类。当前 `config.example/agents.toml` 已有：

- `builtin.root`：总代理，可委派 worker / fast-worker / reviewer；
- `builtin.worker` / `builtin.fast-worker` / `builtin.reviewer`：执行与审阅分工；
- `builtin.triage`：注意力初筛，cadence 默认经它唤起；可委派 root / worker / fast-worker；
- `builtin.memory`：记忆专员预设，prompt 只负责忠实写入记忆。

## 职责

- `AgentDefinition`：稳定 definition id、description、prompt id、model endpoint、可见 tools、child allowlist；
- `AgentCatalog`：不可变目录、重复拒绝、child 引用闭包校验、唯一解析；
- 向 tools 提供 delegate 的 schema，向 engine 提供创建节点所需的完整原型。

## 特化边界

同一个 prompt 可以形成不同 model/tools/children 的多个 definition。需要新行为时，先问三件事：

1. 是否只是 prompt 差异 → 新 prompt；
2. 是否是需要执行的动作 → 新 tool；
3. 是否是可见工具/可委派范围差异 → 新 `AgentDefinition`。

三者都不满足时，才允许讨论新的节点类型，并且必须先更新 RFC。

## 组合

- 实例键：`AGENTS = InstanceKey[AgentCatalog]("agents.catalog")`；
- 在 `world.register` 之后注册，供 tools 与 engine 依赖。

## 世界访问权

不持有 world 端口。

## ops 入口

- `GET /agents`、`/agents`：全部 definition 的 JSON 目录；
- `GET /agents/{agent_id}`、`/agent`：单个 definition；
- `GET /agents/{agent_id}/tools`：该 Agent 的可见工具集合。
