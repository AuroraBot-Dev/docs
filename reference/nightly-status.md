---
order: 1
---

# 当前实现状态

当前 nightly 是架构收核后的实验核心，不是 0.6 产品候选。

已实现：AgentTree 值对象、节点级 profile/model/tools/message、四角色 PromptAssembler、普通 Tool 往返、树形 delegate、
OpenAI role 纯映射、最小 TOML 配置和项目组合根。

未实现：联网 Model、持久化、恢复、记忆、环境事件入口、主动节律、并发、授权、MCP、Panel backend、sandbox、运维和发布。
这些能力不会按旧实现整体恢复，只能围绕 AgentTree 逐项验证。
