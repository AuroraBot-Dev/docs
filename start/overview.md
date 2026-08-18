---
order: 1
---

# 认识当前 AuroraBot

AuroraBot 正在验证自主智能体的最小结构，而不是准备发布产品。核心问题是：同构 Agent 能否只依靠树形关系和四角色上下文，
完成理解、行动、委派与恢复。

一次运行就是一棵 AgentTree。模型读取 system/message/assistant/tool 消息，产生 assistant；工具结果作为 tool 回到同一节点；
delegate 创建 child，child 的结果再回到 parent。当前实现全部在内存中确定性运行。

被删除的持久化、记忆、MCP、Panel、Triage、并发和恢复不再是默认架构。未来只有在 AgentTree 语义稳定且出现真实用例后，
才逐项重建。
