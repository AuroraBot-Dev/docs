---
order: 1
---

# AuroraBot 现在能做什么

这是一份现状清单，全部来自 nightly 分支的真实代码与测试：

- **AgentTree 核心**：树与节点、节点级 prompt/model/tools/首条消息、世界观察前沿；
- **四角色上下文**：system / message / assistant / tool 的组装，普通工具往返与树形委派；
- **模型网关**：LiteLLM 统一接入，OpenAI-compatible 角色映射，密钥只从环境变量读取；
- **世界线**：只追加的 WorldJournal，per-scope 序号、全局流、幂等提交与 schema 迁移；
- **本地终端**：输入先入世界线，渲染输出不入；`--headless` 与完整启动共用同一停止路径；
- **节律与唤起**：定时 tick、reactive 规则与批量唤起 triage，由 cadence 独立决策；
- **只读记忆**：最近时间窗口内活跃 scope 的最新提交，经 PromptAssembler 注入 system；
- **MCP 客户端**：SDK 2.x 协商，stdio / HTTPS 传输，完整工具发现、工具执行与业务事件入世界线；
- **统一操作目录**：engine / world / agents / tools / prompt / ai / console / cadence / memory / mcp 的 method/path 与斜杠入口；
- **本地 Panel**：Token 登录加限时 Bearer session，同一操作目录经 HTTP 调用；
- **离线测试**：fake Model/Tool，测试确定、离线、无网络。

范围之外：sandbox 沙箱、通用扩展平台、Panel 附件与 WebSocket，以及 MCP sampling、elicitation、roots、Tasks 与非文本结果注入。
