---
order: 2
---

# AgentTree

一棵 `AgentTree` 表示一次完整运行，拥有唯一 root 和由 parent id 连接的有限节点集合。节点结构相同，每个实例显式选择：

- `prompt_id`：本节点的 Agent prompt；
- `model`：本节点调用的 LLM endpoint id；
- `tools`：本节点可见的 Tool ID 集合；
- 首条 `message`：外部输入或 parent assignment。

节点 transcript 只追加 message、assistant 和 tool。`PromptAssembler` 在每次模型调用前生成唯一 system，并把节点 transcript
接在其后。assistant 无 Tool call 时节点完成；普通 Tool call 返回 tool 消息；delegate call 创建 child。child 完成或失败后，
parent 获得同一 delegate call id 的 tool 消息并恢复。

普通 Tool 的一次结果具有 `succeeded`、`failed` 或 `unknown` 三种状态。`unknown` 表示请求可能已送达但真实效果无法确认，
仍必须形成同一 call id 的 tool 消息；engine 记录 `tool.unknown`，且不得自动重试。MCP Tool 与 builtin Tool 使用完全相同的
节点消息和结果路径。

model 是节点一等事实。同一 prompt 的两个节点可以使用不同 LLM，Runner 和 Provider 不得从 prompt id 隐式推导 model。

## 世界观察前沿

每个节点保存 `observed_frontier: WorldFrontier`。child 创建时复制 parent 的 frontier，之后独立推进；一个节点观察过的事实
不得隐式视为其他节点已经观察。

engine 在以下位置把未披露 delta 作为显式 message/tool 结果交付给节点：

- assistant Tool batch 执行前；
- root 无 Tool call 完成前。

接受一个 batch 或 root draft 意味着 Bot 以当前 frontier 为行动截面；之后到达的提交与该行动并发，不会自动使它饥饿。

每个 MCP Tool 默认观察并发布 App scope；双方严格协商 `org.aurorabot/tool-contract` v1 后，可以用只引用顶层调用参数的
scope 模板细化本次调用的 observe / publish 集合。模板仍通过普通 `ScopedTool` 进入这里的 frontier 屏障，不建立 MCP 旁路。

MCP Server 上报的业务事件只追加 WorldJournal。它不会直接成为节点消息、恢复 waiting 节点或启动新树；engine 仍只按
节点 frontier 显式披露世界 delta，是否主动唤起新树只由 cadence 决定。

## 工具目录冻结

启用的 MCP App 必须先由 SDK 2.x 完成协议协商与完整分页 `tools/list`。全部发现成功后，MCP Tool 与 builtin/外部注入 Tool
合并并冻结为本进程唯一 ToolRegistry，随后才校验 AgentDefinition 的精确 Tool ID 引用并允许创建节点。运行中的目录变化
不得改写 AgentDefinition 或已有 AgentNode；状态只报告 `restart_required`。

## 同构与特化

workerAgent、memoryAgent、gateAgent 这类“具体 Agent”应表现为 `AgentDefinition` 预设（prompt + model + tools + children），
而不是 `AgentNode` 的 Python 子类。特化行为优先实现为 Tool 或 prompt；只有证明无法由现有节点表达的新概念才允许进入核心。
MCP sampling、elicitation、roots、Tasks 也不能成为隐藏 Agent 或独立运行模型。
