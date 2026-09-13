---
order: 4
---

# 运行核心

本页描述现行认知循环的实现结构：提示词组装、世界提交、最小循环与工具域。设计思想见 `RFC 0300`。

## 提示词组装

`PromptAssembler` 是纯函数对象，输入 `AgentTree + node id`，输出该节点下一次模型调用的四角色消息序列。它只做以下工作：

1. 把全局人格、世界说明和 node prompt 按固定顺序合并成唯一 system 消息；
2. 在 child 的 system 中加入其局部职责，在首条 message 中加入 parent 给出的 assignment；
3. 确定性渲染调用方显式传入的可选 `MemorySnapshot`；
4. 原样追加该节点已经发生的 message、assistant 和 tool transcript；
5. 校验角色顺序、Tool call 配对和上下文上界。

组装完成后的模型请求必须携带节点自己的 model id 和可见 Tool 定义。model 在节点创建时由 AgentDefinition 显式复制为节点事实，之后不由全局 runner、Provider 或 prompt id 临时推导；因此同一 prompt 的两个定义及其节点可以使用不同 model。

组装器不主动召回记忆或访问 WorldReader；它不访问数据库、不选择模型、不执行工具、不读取其他节点的完整 transcript，也不把 Tool schema 重复写进文本。召回 I/O 属于 `src/memory`，Runner 在模型请求前通过 `MemoryReader.recall()` 取得不可变快照，再把快照作为显式参数传入。当前 Memory 只读取最近时间窗口内有活动的 scope，并为每个 scope 读取最近有限条提交，窗口、每 scope 条数由配置决定；召回前先按配置的 scope 白名单/黑名单模式过滤，节点带有非空 frontier 时只召回该 frontier 涉及的业务 scope，避免一次交互把所有 App、Console 与其他会话历史重复注入；不写世界、不写 transcript、不调用模型，也不建立独立记忆数据库。工具定义使用模型请求的原生 `tools` 字段传递。

当前不做自动摘要；超过显式字符上界时不失败，而是确定性地从最早 transcript 消息开始丢弃，并在 system 后插入带 TODO 标记的 message；system 自身超限时截断 system 并附加同一标记，让上下文策略保持可见。

## 世界提交与观察前沿

Bot 的环境事实、终端输入、运行因果、工具请求与工具结果、root 对外发布都进入同一个只追加的 `WorldJournal`，它是连续世界事件流的唯一权威。端口分为 `WorldReader`（head / delta / commit / commits / stream / tree_index）、`WorldWriter`（append_event / append_commit / append_commits）与完整 `WorldJournal`；组合根把同一单例按各包需要注入。事件归属哪个 scope 由提交方决定，world 只校验 scope、分配单调 sequence 并保证 append-only，不替调用方推断 scope。除 per-scope sequence 外，每条提交拥有全局单调 insertion cursor，可经 `stream(after, limit)` 连续拉取。

一条 `EnvironmentEvent` 至少包含稳定 event id、source、scope、kind、发生时间、面向模型的 summary 和结构化 data。提交可以归属多个 scope；每个 scope 有独立单调 sequence。`WorldFrontier` 是 scope 到 sequence 的不可变映射，不相关 scope 的新提交不得互相阻塞。

engine 按因果阶段提交确定性事件：tree started/completed/failed、node spawned/completed/failed、model requested/completed/failed、tool requested/succeeded/failed/unknown、output requested/committed 与 world delta delivered；模型事件只记录元数据，不复制 transcript 正文。

`src/cadence` 持有 `WorldReader + WorldWriter`。启用时它按 `tick_seconds` 向 `aurora:cadence` 提交 `cadence.tick`。配置化 reactive rule 可以在一条匹配的 `mcp.event.received` 已提交后立即请求启动指定 AgentTree；未命中 reactive rule 的 MCP 业务事件累计到 `evoke_every` 后，最多请求启动一棵批量 triage AgentTree。Cadence 只产生 `TreeLaunchRequest`，不得直接创建或修改节点。全局 stream 必须逐提交推进 durable cursor；一次树运行期间新到达的提交不得因跳到 stream head 而丢弃。

MCP 的连接、协商、启动失败与初始目录冻结属于进程准备状态，只进入日志，不形成世界提交。最终 Assembly 激活后的连接中断与冻结目录变化分别使用 `mcp.app.disconnected` 和 `mcp.catalog.changed`，归属 `aurora:mcp:<package>` scope。MCP 业务事件使用 `mcp.event.received`，至少归属载荷声明的业务 scope，并可同时归属 App scope；source 固定为 `mcp:<package>`。MCP 适配器必须拒绝伪造 `engine.*`、`tool.*`、`output.*` 或 `cadence.*` 保留事件的载荷。

Tree 只基于已经披露给其 node 的 frontier 推理。环境适配器只提供有界提交索引，不能替 Bot 按语义筛选消息；delta 只交付索引，正文读取由独立服务工具承担：`aur.serv.world.read` 按 scope 与序号有界读取提交正文并声明观察该 scope，`aur.serv.world.trees` 列出由提交推导的 Bot 森林索引。索引超过上界时分页交付，未披露页面不得被记为已观察。

任何 assistant Tool batch 和 root 的最终文本都必须先提交检查：有未披露 delta 时，整个 batch 不执行，所有 Tool call 获得配对的 deferred tool 结果；root draft 以普通 message 收到 delta。node 看完全部页面后的下一次 Tool batch 或 root 文本，就是 Bot 明确选择以当前 observed frontier 为本次行动截面；随后到达的提交与该行动并发，不自动使它饥饿。接受的 Tool batch 先原子记录 `tool.requested`，执行后记录 `tool.succeeded` 或 `tool.failed`；root 文本记录 `output.requested` 和 `output.committed` 后才完成树。运行时不做自动投递：cadence 唤起树运行期间把各节点 assistant 文本渲染到本地终端（不进入世界线），对外回复必须由 Agent 显式调用可见的发送 Tool；MCP 事件和 Cadence 都不直接调用协议客户端。

提交记录 tree id、node id、可选 tool call id 和 based-on frontier。框架只保证事实披露、因果、授权、参数与资源边界；消息是否相关、是否等待、是否回复以及是否以某个 frontier 行动，都由 Bot 的 Cadence 配置与 Agent 决定。MCP 事件只进入 WorldJournal，不直接启动 AgentTree；是否主动唤起仍只由 Cadence 策略决定。MCP App 被发现不得隐式启动时钟或心跳。

## 完整最小循环

一次 tree turn 严格遵循：

```text
选择 ready node
  → PromptAssembler.assemble(tree, node)
  → Model.complete(messages, tools)
  → 追加 assistant
      ├─ 无 Tool call：检查已观察 scope 的 delta
      │    ├─ 有 delta：追加 message，下一次文本显式封口
      │    └─ 无 delta / 已封口：完成 node；child 向 parent 追加 tool，root 发布输出后完成 tree
      └─ 有 Tool call：解析各 Tool scope 并检查合并 delta
           ├─ 有 delta：整批追加 deferred tool 结果，下一批显式封口
           └─ 无 delta / 已封口：原子记录全部 tool.requested，再依序执行
                ├─ ToolOutput：按 succeeded / failed / unknown 记录结果并追加 tool 消息
                └─ DelegationRequest：创建 child，parent 等待 child
  → 仍有 ready node 时继续
```

首版调度是确定性的单循环：深度优先、同级按创建顺序执行，同一时刻只调用一个 Model 或 Tool。并发、优先级、抢占、防抖和后台派发不是当前核心。这个选择用于暴露语义，不构成未来并发实现的限制；未来并发仍必须产生等价的树和节点 transcript。

模型失败使当前节点失败；Tool 的 failed 或 unknown 结果都生成普通 tool 错误消息，由模型决定如何继续。child 失败同样作为 delegate call 的 tool 错误返回 parent。engine 不伪造模型回复、不重试 Tool，也不把空文本改写成完成消息。Model gateway 可以在一个显式总截止时间内对无外部效果的模型请求作有限次尝试，但必须关闭 Provider SDK 的隐式重试、记录每次尝试的序号与耗时，并把总截止时间耗尽作为一次明确模型失败。任何结果不确定的外部效果都不得自动重试。

## 端口与工具域

认知循环有两个效果端口，并通过一个 Bot 级事实端口获得因果边界：

- `Model.complete(request) -> AssistantMessage`，其中 request 显式携带 node 的 model id；
- `Tool.execute(call) -> ToolResult`，其中当前结果只有带 `succeeded / failed / unknown` 状态的普通 `ToolOutput` 和树操作 `DelegationRequest` 两种；
- `WorldReader` / `WorldWriter` / `WorldJournal` 只追加环境、输入、运行因果与输出提交，并按 scope 提供 head、有界 delta、正文查询与全局 stream，以及从提交推导的 Bot 森林索引；它不保存 AgentTree。

Provider、Console、MCP、定时器和未来平台都是这两个端口之外的适配器或 message 来源。首版不定义 InputGateway、EventSource、ControlAction、ContextContributor、OutputSink、Projector、Manifest 或 Lifecycle 公共体系。

Console 是本地终端前端，持有组合根注入的 `WorldWriter` 单例。每条非空输入先在 `aurora:console` scope 提交 `console.input`，再交给可注入文本分派端口：普通文本映射为“启动新 AgentTree”；`/help`、`/clear`、`/quit` 是 Console 本地命令，分别负责显示本地帮助、清屏与请求停止当前进程。Console 不导入 aurora 或 engine，不保存 AgentTree，也不拥有 Tool。终端只负责异步读行、历史、中文渲染、清屏和停止协调；渲染输出是本地调试途径，不进入世界线。

工具域由 `src.tools` 独立实现，包含工具注册表与框架内建工具。注册表是本次进程组合形成的扁平、不可变目录，并同时承担：

1. 校验工具 ID 和定义，拒绝重复注册；
2. 提供完整名称集合，并按节点的可见名称集合筛选原生 Tool definitions；
3. 按 Tool call 名称进行唯一分派；
4. 把未知工具、执行前异常和非法返回值规范化为 failed `ToolOutput`，保留执行器显式返回的 unknown。

工具 ID 使用来源稳定的域名，统一以 `aur.` 开头：框架内建使用 `aur.agent.<方法>`，服务使用 `aur.serv.<服务名>.<方法>`，平台使用 `aur.<平台注册名>.<方法>`，MCP 使用 `aur.mcp.<app_package>.<tool>`。节点只保存 ID 集合作为可见性事实，不保存执行器或定义副本；目录注册不等于节点授权。

`ToolOutput.status` 是因果事实：执行器确认成功时为 `succeeded`；参数/方法被明确拒绝，或执行器能确认效果未发生或已完整回滚时为 `failed`；请求可能已送达后发生超时、连接中断或无法确定真实效果时为 `unknown`。unknown 必须作为配对的 tool 消息原样交给模型，并记录 `tool.unknown`；运行时不得将它降级为 failed 或自动重试。

领域 Tool ID 不等于 Provider function name。OpenAI-compatible Provider 可能只接受 `[a-zA-Z0-9_-]` 且有长度上限；adapter 必须为本次请求中的领域 Tool ID 生成稳定、协议安全且无冲突的别名，在 Tool definitions 和历史 assistant Tool calls 中统一使用别名，并在模型响应进入 `ChatMessage` 前反向映射为领域 ID。Provider 别名不得进入 AgentTree、ToolRegistry 或配置。

`aur.agent.delegate` 是注册表中的真实 Tool，与其他工具通过同一 `Tool` 契约暴露定义并接受调用。它由不可变 AgentDefinition 目录构造原生 schema，使 `agent` 参数列出所有 definition id 及其用途说明；调用只携带目标 `agent` 和局部 `instruction`。工具校验参数并产生 `DelegationRequest(agent, instruction)`，不持有或修改 AgentTree。engine 只按结果类型应用树操作，并校验 parent 的 child allowlist、深度和节点数，再从选中的 definition 创建 child；它不再内置 delegate 的名称、schema、参数解析、保留名或单独路由分支。
