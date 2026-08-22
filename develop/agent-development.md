---
order: 1
---

# AgentTree 与端口开发

新的 Agent 角色不需要新 handler 类型。为节点提供 prompt、model、可见 tools 和首条 message，即可进入同一个循环。

新增普通工具时实现 `Tool.definition` 和异步 `Tool.execute(call)`，然后在组合根调用中注入。新增模型时实现异步
`Model.complete(request)` 并返回 assistant `ChatMessage`。Provider 特有 role 或 JSON 形状只能存在于 `src/ai` adapter。

新增整个 `src` 包或运行时端口前，先按 [新包扩展基线](../architecture/packages/package-baseline.md) 确定契约、
世界访问权、ops 入口与组合成本。

修改树操作、消息顺序或完成规则前先更新唯一 RFC，并补充 fake Model/Tool 的离线行为测试。
