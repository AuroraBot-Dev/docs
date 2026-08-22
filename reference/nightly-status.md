---
order: 1
---

# 当前实现状态

当前 nightly 实现 AgentTree 核心、注册式项目配置与组合根、世界线总线、统一操作目录、本地 Console 和 start 生命周期。

已实现：

- AgentTree 值对象、节点级 prompt/model/tools/message、世界观察前沿；
- 四角色 PromptAssembler、普通 Tool 往返、树形 delegate；
- LiteLLM 模型网关与 OpenAI role 映射；
- 只追加 WorldJournal：per-scope sequence、全局 stream、幂等 commit 与 migration；
- 世界事件：environment、console.input、tree/node/model/tool/output/delta 因果记录；
- 世界窄端口：`WorldReader / WorldWriter / WorldJournal`；
- Console 输入先入世界线，输出不入；`--headless` 共享同一停止路径；
- ops 为 engine/config/agents/tools/prompt/ai/world/console 提供 JSON 指令化入口。

未实现：主动节律（cadence）、自动记忆、MCP、sandbox、并发、恢复、Panel backend、运维与发布。
这些能力进入实现前，需要围绕 AgentTree 明确其用例、不变量与独立测试。
