---
order: 1
---

# 当前实现状态

当前 nightly 实现 AgentTree 核心、注册式项目配置与组合根、统一操作目录、本地 Console 和 start 生命周期。

已实现：AgentTree 值对象、节点级 profile/model/tools/message、四角色 PromptAssembler、普通 Tool 往返、树形 delegate、
LiteLLM 模型网关、OpenAI role 映射、按职责拆分的 TOML 配置、项目组合根、Console 普通文本/斜杠操作与统一停止路径。

未实现：持久化、恢复、记忆、环境事件入口、主动节律、并发、授权、MCP、Panel backend、sandbox、运维和发布。
这些能力进入实现前，需要围绕 AgentTree 明确其用例、不变量与独立测试。
