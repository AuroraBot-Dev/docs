---
title: RFC 0300：统一架构与公共契约
order: 10
---

# 0300：AuroraBot 统一架构与公共契约

状态：现行

日期：2026-08-24

## 1. 文档地位

本文件是 AuroraBot 唯一的设计基准。当前工作树只描述现行实现，不维护并行公共契约。
影响 AgentTree、消息角色、模型调用、工具调用、包边界、配置或持久化的改动必须先更新本文件。

源码、测试和配置注释直接说明局部行为与不变量，不引用具体 RFC 编号或章节。历史设计只由 Git 保存。

## 2. 当前范围

AuroraBot 是以 Bot 为主体、以 AgentTree 为一次认知运行的自主智能体框架。当前实现包含完整最小循环、项目级配置与组合、
统一操作目录及本地 Panel 适配、本地 Console、持久化世界提交日志、只读近期世界记忆、世界驱动的主动节律，以及 MCP 2.x 客户端适配；
每个运行时包在 ops 中拥有 JSON 化指令入口。MCP 只把外部工具映射为统一 Tool，把外部事实映射为 World 提交，
不引入第二套 Agent、Task、消息总线或运行循环。Panel 只观察和调用同一 ops 目录，不建立平行运行模型；当前不包含远程部署、
sandbox 或通用第三方扩展生态。

最小循环只有五个基本概念：

1. `AgentTree`：一次完整运行及其全部 Agent 节点；
2. `AgentNode`：树中的一个同构 Agent；
3. `ChatMessage`：节点内按序追加的模型上下文事实；
4. `Model`：读取组装后的消息并产生 assistant 消息；
5. `Tool`：执行模型请求的动作，产生规范化结果或显式的 AgentTree 操作请求。

任何新概念必须证明无法由这五个概念表达，才可以进入核心。Memory、Cadence 与 MCP 是核心之外的适配能力：
Memory 只产生 `PromptAssembler` 的显式输入，Cadence 只请求启动一棵 AgentTree，MCP 只产生 Tool 与世界事实。
三者不得保存或解释另一套认知运行状态。

## 3. 设计原则

- **Bot 拥有世界与森林**：Bot 持有追加式世界提交与多棵 AgentTree；一棵树只是一次运行，不是 Bot 本身。
- **一棵树就是一次运行**：不再用 Task、mailbox、Activity 和 continuation 的组合间接表达一次 Agent 运行。
- **节点同构**：root 与 child 使用同一种节点、消息和循环；实例差异只来自 system prompt、可见工具、初始 message 和
  使用的 LLM model。
- **上下文即状态**：模型可见状态由节点的追加式 transcript 表达，不在旁路状态机中复制一份认知状态。
- **模型决定，运行时执行**：assistant 可以回复或请求工具；真实效果只由 Tool 执行，结果再以 tool 消息返回。
- **委派就是工具请求的树操作**：委派是工具域中的普通可见 Tool；它产生显式委派请求，由拥有 AgentTree 的 engine
  创建 child，child 完成后以对应 tool 结果恢复 parent。
- **先求可解释，再求可靠**：持久化、恢复、并发、授权和运维设施必须建立在明确的最小语义上。
- **注册变化轴，不注册猜想**：命令、TOML 配置和项目组件是确定的并列变化轴，使用显式目录注册表；其他能力没有两个真实
  实现或明确不变量时，不建立生命周期体系或通用扩展接口。
- **外部动作归 Tool，外部事实归 World**：MCP `tools/call` 只能经统一 Tool 契约执行；MCP Server 主动上报的环境变化只能
  追加到 WorldJournal，不能直接追加节点 transcript、恢复节点或启动 AgentTree。只有 world 提交成功后，Cadence 才能按
  项目配置的注意力规则产生 `TreeLaunchRequest`；对外回复必须由 Agent 经可见的冻结发送 Tool 显式完成，运行时不做自动投递。
- **启动发现，运行冻结**：全部启用 MCP App 必须在 AgentDefinition 引用校验之前完成连接与工具发现；发现结果与 builtin
  Tool 合并为本进程唯一、不可变的 ToolRegistry。运行中目录变化只产生状态和 `restart_required`，不得热改已有节点的可见工具。
- **协议能力不产生旁路认知**：AuroraBot 不向 MCP Server 提供 sampling、elicitation、roots 或 Tasks 执行能力；任何这类请求、
  `input_required` 或 task handle 都不得触发隐藏模型调用、用户询问或独立任务循环。

## 4. AgentTree

`AgentTree` 是一次完整运行的唯一聚合根，至少包含：

- 稳定且在树内唯一的 tree id；
- 唯一 root node；
- 由 parent id 连接的有限节点集合；
- 树级运行状态。

项目可以预定义有限个无运行状态的 `AgentDefinition`。每个定义至少包含稳定 definition id、面向模型的用途说明、system
prompt id、model endpoint id、可见 Tool ID 集合和允许委派的 child definition ID 集合。定义是创建节点的完整原型，不是
提前运行的 Agent 实例；它不含 transcript、parent、状态、结果或 tree id。同一个 prompt 可以被多个定义复用，不同定义仍可
选择不同 model、tools 和 child allowlist。

`AgentNode` 至少包含：

- 稳定且在树内唯一的 node id；
- 可选 parent id；
- 创建本节点所用的 Agent definition id；
- prompt id；
- 本节点使用的 LLM model id；
- 本节点可见的 Tool 名称集合；
- node-local transcript（不含由组装器生成的 system）；
- `ready`、`waiting`、`completed` 或 `failed` 状态；
- 可选最终结果或错误。

强制不变量：

1. root 没有 parent，其他节点恰好有一个已经存在的 parent；
2. parent 关系无环且所有节点都可从 root 到达；
3. 深度由 parent 链推导，不作为独立事实保存；
4. node-local transcript 以 message 开始、只追加，且不保存 system；
5. completed/failed 节点不可再次追加消息或创建 child；
6. parent 创建 child 后进入 waiting；child 结束后 parent 收到一次对应 tool 消息并回到 ready；
7. root 结束即整棵树结束；非 root 结束不直接结束整棵树。
8. 每个新节点只能从组合时已注册的一个 AgentDefinition 创建；节点创建后复制 definition 的 prompt、model 和 tools，后续
   definition 目录变化不反向改写已有树；
9. root definition 由 runtime 入口显式选择；child definition 必须位于 parent definition 的 child allowlist 中。

节点还保存其已观察的 `WorldFrontier`。child 从 parent 创建时复制 parent 的 frontier，之后独立推进；一个节点观察过的
世界事实不得隐式视为其他节点已经观察。

`AgentTree` 仍是内存中的不可变值对象。世界日志保存 Bot 的跨树事实，不保存或替代 AgentTree；未来导入/导出树时必须保存
同一树语义，不能发明第二套运行模型。

## 5. 四角色消息

核心只承认四种 chat-completion role：

| role | 含义 |
| --- | --- |
| `system` | 身份、世界、节点职责及稳定运行约定 |
| `message` | 来自人、环境或 parent 的待理解事实 |
| `assistant` | 模型产生的文本和零个或多个 Tool call |
| `tool` | 某个 Tool call 的一次规范化结果或错误 |

`message` 是 AuroraBot 的领域角色，表示平权的外部消息，不等同于“用户拥有最高指令权”。调用 OpenAI-compatible
Chat Completions 时，Provider adapter 在协议边界把 `message` 映射为 `user`；其余三个 role 保持原义。该映射不得泄漏回
AgentTree。

`role` 一词只用于 ChatMessage 的四种消息角色，不表示模型档位、Agent 类型或提示词档案。模型选择使用 model endpoint id；
完整 Agent preset 使用 AgentDefinition id；system 提示词引用使用 prompt id。三者不得复用 `role` 或 `profile` 命名。

消息约束：

- `system` 和 `message` 必须有非空文本，不能携带 Tool call 或 call id；
- `assistant` 可以包含文本、Tool call 或两者，至少有一项非空；
- `tool` 必须带 call id 和规范化文本结果，不能再携带 Tool call；
- 每个 Tool call id 在节点内唯一，并恰好对应零条或一条后续 tool 消息；节点只有在所有待处理调用都返回后才能再次请求模型；
- node-local transcript 的首条消息必须是 message，且不能出现 system；组装后的模型消息首条必须是唯一 system。

## 6. 提示词组装

`PromptAssembler` 是纯函数对象，输入 `AgentTree + node id`，输出该节点下一次模型调用的四角色消息序列。它只做以下工作：

1. 把全局人格、世界说明和 node prompt 按固定顺序合并成唯一 system 消息；
2. 在 child 的 system 中加入其局部职责，在首条 message 中加入 parent 给出的 assignment；
3. 确定性渲染调用方显式传入的可选 `MemorySnapshot`；
4. 原样追加该节点已经发生的 message、assistant 和 tool transcript；
5. 校验角色顺序、Tool call 配对和上下文上界。

组装完成后的模型请求必须携带节点自己的 model id 和可见 Tool 定义。model 在节点创建时由 AgentDefinition 显式复制为节点
事实，之后不由全局 runner、Provider 或 prompt id 临时推导；因此同一 prompt 的两个定义及其节点可以使用不同 model。

组装器不主动召回记忆或访问 WorldReader；它不访问数据库、不选择模型、不执行工具、不读取其他节点的完整 transcript，
也不把 Tool schema 重复写进文本。召回 I/O 属于 `src/memory`，Runner 在模型请求前通过 `MemoryReader.recall()` 取得不可变快照，
再把快照作为显式参数传入。当前 Memory 只读取最近时间窗口内有活动的 scope，并为每个 scope 读取最近有限条提交，窗口、
每 scope 条数由配置决定；召回前先按配置的 scope 白名单/黑名单模式过滤，节点带有非空 frontier 时只召回该 frontier 涉及的
业务 scope，避免一次交互把所有 App、Console 与其他会话历史重复注入；不写世界、不写 transcript、不调用模型，也不建立
独立记忆数据库。工具定义使用模型请求的原生 `tools` 字段传递。

当前不做自动摘要；超过显式字符上界时不失败，而是确定性地从最早 transcript 消息开始丢弃，并在 system 后插入带 TODO
标记的 message；system 自身超限时截断 system 并附加同一标记，让上下文策略保持可见。

## 7. 世界提交与观察前沿

Bot 的环境事实、终端输入、运行因果、工具请求与工具结果、root 对外发布都进入同一个只追加的 `WorldJournal`，
它是连续世界事件流的唯一权威。端口分为 `WorldReader`（head / delta / commit / commits / stream / tree_index）、
`WorldWriter`（append_event / append_commit / append_commits）与完整 `WorldJournal`；组合根把同一单例按各包需要注入。
事件归属哪个 scope 由提交方决定，world 只校验 scope、分配单调 sequence 并保证 append-only，不替调用方推断 scope。
除 per-scope sequence 外，每条提交拥有全局单调 insertion cursor，可经 `stream(after, limit)` 连续拉取。
一条 `EnvironmentEvent` 至少包含稳定 event id、source、scope、kind、发生时间、面向模型的 summary 和结构化 data。提交可以归属多个 scope；每个 scope 有独立
单调 sequence。`WorldFrontier` 是 scope 到 sequence 的不可变映射，不相关 scope 的新提交不得互相阻塞。

engine 按因果阶段提交确定性事件：tree started/completed/failed、node spawned/completed/failed、
model requested/completed/failed、tool requested/succeeded/failed/unknown、output requested/committed 与 world delta delivered；
模型事件只记录元数据，不复制 transcript 正文。

`src/cadence` 持有 `WorldReader + WorldWriter`。启用时它按 `tick_seconds` 向 `aurora:cadence` 提交 `cadence.tick`。
配置化 reactive rule 可以在一条匹配的 `mcp.event.received` 已提交后立即请求启动指定 AgentTree；未命中 reactive rule 的
MCP 业务事件累计到 `evoke_every` 后，最多请求启动一棵批量 triage AgentTree。Cadence 只产生 `TreeLaunchRequest`，不得直接
创建或修改节点。全局 stream 必须逐提交推进 durable cursor；一次树运行期间新到达的提交不得因跳到 stream head 而丢弃。

MCP 生命周期与目录事实使用 `mcp.app.starting/ready/failed/disconnected` 和
`mcp.catalog.frozen/changed`，归属 `aurora:mcp:<package>` scope。MCP 业务事件使用 `mcp.event.received`，
至少归属载荷声明的业务 scope，并可同时归属 App scope；source 固定为 `mcp:<package>`。MCP 适配器必须拒绝伪造
`engine.*`、`tool.*`、`output.*`、`cadence.*` 或 `ops.*` 保留事件的载荷。

Tree 只基于已经披露给其 node 的 frontier 推理。环境适配器只提供有界提交索引，不能替 Bot 按语义筛选消息；delta 只
交付索引，正文读取由独立服务工具承担：`aur.serv.world.read` 按 scope 与序号有界读取提交正文并声明观察该 scope，
`aur.serv.world.trees` 列出由提交推导的 Bot 森林索引。索引超过上界时分页交付，未披露页面不得被记为已观察。

任何 assistant Tool batch 和 root 的最终文本都必须先提交检查：有未披露 delta 时，整个 batch 不执行，所有 Tool call 获得
配对的 deferred tool 结果；root draft 以普通 message 收到 delta。node 看完全部页面后的下一次 Tool batch 或 root 文本，
就是 Bot 明确选择以当前 observed frontier 为本次行动截面；随后到达的提交与该行动并发，不自动使它饥饿。接受的 Tool batch
先原子记录 `tool.requested`，执行后记录 `tool.succeeded` 或 `tool.failed`；root 文本记录 `output.requested` 和
`output.committed` 后才完成树。运行时不做自动投递：cadence 唤起树运行期间把各节点 assistant 文本渲染到本地终端（不进入
世界线），对外回复必须由 Agent 显式调用可见的发送 Tool；MCP 事件和 Cadence 都不直接调用协议客户端。

提交记录 tree id、node id、可选 tool call id 和 based-on frontier。框架只保证事实披露、因果、授权、参数与资源边界；消息
是否相关、是否等待、是否回复以及是否以某个 frontier 行动，都由 Bot 的 Cadence 配置与 Agent 决定。MCP 事件只进入
WorldJournal，不直接启动 AgentTree；是否主动唤起仍只由 Cadence 策略决定。MCP App 被发现不得隐式启动时钟或心跳。

## 8. 完整最小循环

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

首版调度是确定性的单循环：深度优先、同级按创建顺序执行，同一时刻只调用一个 Model 或 Tool。并发、优先级、抢占、防抖和
后台派发不是当前核心。这个选择用于暴露语义，不构成未来并发实现的限制；未来并发仍必须产生等价的树和节点 transcript。

模型失败使当前节点失败；Tool 的 failed 或 unknown 结果都生成普通 tool 错误消息，由模型决定如何继续。child 失败同样作为
delegate call 的 tool 错误返回 parent。engine 不伪造模型回复、不重试 Tool，也不把空文本改写成完成消息。Model gateway
可以在一个显式总截止时间内对无外部效果的模型请求作有限次尝试，但必须关闭 Provider SDK 的隐式重试、记录每次尝试的序号与
耗时，并把总截止时间耗尽作为一次明确模型失败。任何结果不确定的外部效果都不得自动重试。

## 9. 最小端口

认知循环有两个效果端口，并通过一个 Bot 级事实端口获得因果边界：

- `Model.complete(request) -> AssistantMessage`，其中 request 显式携带 node 的 model id；
- `Tool.execute(call) -> ToolResult`，其中当前结果只有带 `succeeded / failed / unknown` 状态的普通 `ToolOutput` 和树操作
  `DelegationRequest` 两种。
- `WorldReader` / `WorldWriter` / `WorldJournal` 只追加环境、输入、运行因果与输出提交，并按 scope 提供 head、有界
  delta、正文查询与全局 stream，以及从提交推导的 Bot 森林索引；它不保存 AgentTree。

Provider、Console、MCP、定时器和未来平台都是这两个端口之外的适配器或 message 来源。首版不定义 InputGateway、
EventSource、ControlAction、ContextContributor、OutputSink、Projector、Manifest 或 Lifecycle 公共体系。

Console 是本地终端前端，持有组合根注入的 `WorldWriter` 单例。每条非空输入先在 `aurora:console` scope 提交
`console.input`，再交给可注入文本分派端口：普通文本由组合根映射为“启动新 AgentTree”，斜杠文本交给 ops 的
统一目录；它不导入 ops、aurora 或 engine，不保存 AgentTree，也不拥有 Tool。终端只负责异步读行、历史、中文渲染、清屏和
停止协调；渲染输出是本地调试途径，不进入世界线。进程退出是 ops 的显式操作，Console 仅执行操作结果携带的终端控制语义。

工具域由 `src.tools` 独立实现，包含工具注册表与框架内建工具。注册表是本次进程组合形成的扁平、不可变目录，并同时承担：

1. 校验工具 ID 和定义，拒绝重复注册；
2. 提供完整名称集合，并按节点的可见名称集合筛选原生 Tool definitions；
3. 按 Tool call 名称进行唯一分派；
4. 把未知工具、执行前异常和非法返回值规范化为 failed `ToolOutput`，保留执行器显式返回的 unknown。

工具 ID 使用来源稳定的域名，统一以 `aur.` 开头：框架内建使用 `aur.agent.<方法>`，服务使用
`aur.serv.<服务名>.<方法>`，平台使用 `aur.<平台注册名>.<方法>`，MCP 使用
`aur.mcp.<app_package>.<tool>`。节点只保存 ID 集合作为可见性事实，不保存执行器或定义副本；目录注册不等于节点授权。

`ToolOutput.status` 是因果事实：执行器确认成功时为 `succeeded`；参数/方法被明确拒绝，或执行器能确认效果未发生或已完整回滚时
为 `failed`；请求可能已送达后发生超时、连接中断或无法确定真实效果时为 `unknown`。unknown 必须作为配对的 tool 消息原样交给
模型，并记录 `tool.unknown`；运行时不得将它降级为 failed 或自动重试。

领域 Tool ID 不等于 Provider function name。OpenAI-compatible Provider 可能只接受 `[a-zA-Z0-9_-]` 且有长度上限；adapter
必须为本次请求中的领域 Tool ID 生成稳定、协议安全且无冲突的别名，在 Tool definitions 和历史 assistant Tool calls 中统一
使用别名，并在模型响应进入 `ChatMessage` 前反向映射为领域 ID。Provider 别名不得进入 AgentTree、ToolRegistry 或配置。

`aur.agent.delegate` 是注册表中的真实 Tool，与其他工具通过同一 `Tool` 契约暴露定义并接受调用。它由不可变
AgentDefinition 目录构造原生 schema，使 `agent` 参数列出所有 definition id 及其用途说明；调用只携带目标 `agent` 和局部
`instruction`。工具校验参数并产生 `DelegationRequest(agent, instruction)`，不持有或修改 AgentTree。engine 只按结果类型应用
树操作，并校验 parent 的 child allowlist、深度和节点数，再从选中的 definition 创建 child；它不再内置 delegate 的名称、
schema、参数解析、保留名或单独路由分支。项目组合的 `aurora.composition.tools` 把框架内建工具和外部注入工具合并为唯一
注册表，再将该注册表注入 engine。

### 9.1 MCP 适配

`src/mcp` 是 MCP Python SDK 2.x 的客户端适配包，依赖 `mcp>=2,<3`，首选协议修订版 `2026-07-28`。客户端使用 SDK v2
的自动协商模式：现代 Server 使用 `server/discover` 与无会话语义，旧 Server 可由同一 SDK 显式协商回退到早期修订版。
适配器必须在状态与 ops 中暴露实际 negotiated version；不允许通过 TOML 选择 SDK v1 实现或伪装协议版本。
支持本地 stdio 与 HTTPS Streamable HTTP，不新建旧 HTTP+SSE 连接。

每个启用 App 在启动阶段完成连接、协议协商与完整分页 `tools/list`；从建立传输、握手到全部页面读取完成的整个启动事务必须受
该 App 的 `timeout_seconds` 单一截止时间约束，不能只给单次 `tools/call` 设置超时。目录变化监听必须在首次 `tools/list`
之前建立，且同一协议通知只能由一个权威接收路径处理。监听到启动中的目录变化时，本次分页结果作废；实现可以在剩余截止时间内
重新完整分页，也可以使启动失败，但不得冻结已经知道过期的目录。raw tool name 与配置 package 组合为
`aur.mcp.<package>.<raw_name>`，不做静默改名：package 段保持项目规定的小写点分包名；raw name 段是第三方 App 的
外部命名事实，只要求 `[A-Za-z]` 开头、其余 `[A-Za-z0-9_-]`，允许第三方风格（如 `Screenshot`），不强制小写化。
description 与 object JSON Schema 进入 `ToolDefinition`，执行器保留 package/raw-name 反向路由。空名称、非 object schema、
重复领域 ID 或任一启用 App 启动失败，都使整体启动失败并逆序回收已建立的连接和子进程。

全部发现完成后，MCP Tool 与 builtin/外部注入 Tool 才合并为最终 ToolRegistry，随后校验 AgentDefinition 的精确 Tool ID 引用。
运行中不热替换目录；`tools/list_changed` 或重发现差异只记录 `mcp.catalog.changed`并报告
`restart_required=true`，不能替换 ToolRegistry 或改写已有 AgentNode。启动后连接断开不自动重连；目录保持冻结，对应调用返回
unknown 或可明确判定的 failed。

stdio 子进程只获得 SDK 安全基础环境与 App 配置显式白名单中的环境变量；stdout 只承载 MCP，诊断通过 stderr 进入日志。
远程地址及每一跳重定向目标都必须为 HTTPS；任何向明文 HTTP 的降级重定向都必须在发送后续请求前拒绝。重定向目标仍须通过
无 userinfo、无 fragment 的 URL 校验，Bearer 凭据只按 `auth_env` 从进程环境读取且不得跨授权 origin 转发。适配器不包装 SDK
私有接收方法，不手写 stdio JSON-RPC 转发，不自动重试工具效果。

Aurora MCP Tool 的版本化契约扩展标识为 `org.aurorabot/tool-contract`。Client 与 Server 只有在各自
`capabilities.extensions` 中都提供内容严格等于 `{"version": 1}` 的 settings 时才协商成功；缺少字段、版本类型或数值不符、
出现额外字段都视为未协商。未协商时 namespaced Tool / CallToolResult `_meta` 不得产生语义，Server 也不得依赖 Host 解释它们。

每个 MCP Tool 默认同时 observe 与 publish App scope `aurora:mcp:<package>`。协商 v1 后，Tool
`_meta["org.aurorabot/tool-contract"]` 可以用 `observe` 和 `publish` 分别声明非空、无重复的 scope 模板列表；某一字段省略时，
该字段仍使用 App scope 默认值。模板只允许引用 object input schema 中的顶层参数，例如 `qq:group:{group_id}`；不允许点路径、
数组下标、默认值、转换函数或嵌套对象取值。发现时必须验证元数据形状、占位符语法及其引用的顶层 property；固定模板还须在
发现时成为合法 scope。调用前只允许用本次 arguments 中的文本或整数标量替换占位符，并再次校验最终 scope。缺失参数、布尔值、
对象、数组或替换后的非法 scope 都在发送 `tools/call` 前返回 failed，因此不会产生远端效果。解析出的 observe / publish scope
进入普通 `ScopedTool` 与 engine frontier 屏障，不形成 MCP 专用授权或因果通道。

协商 v1 后，Server 对请求可能已经送达或开始执行、但真实效果因内部超时、下游断线或其他原因无法确认的调用，必须在
`CallToolResult._meta["org.aurorabot/tool-contract"]` 中返回严格对象 `{"status": "unknown"}`。Host 必须优先保留为
`ToolOutput.unknown`，无论该结果的 `isError` 为何，不得降格或自动重试。明确的参数/方法拒绝，以及 Server 能确认效果没有发生
或已经完整回滚的错误，才可以返回 failed；协商 v1 的 Server 返回其他 `isError`，即声明该错误没有不确定副作用。Host 自身在
请求可能送达后遇到的超时、断线或无法分类的协议错误同样映射为 unknown；只有发送前本地校验和明确的参数/方法拒绝映射为 failed。

MCP succeeded 结果优先把 `structuredContent` 确定性序列化为文本，否则合并文本 content block；failed 与 unknown 均保留
面向模型的错误文本。
当前四角色消息只承载文本，因此图像、音频、embedded resource、resource link 与其他非文本结果不得静默丢失或将原始二进制塞入
transcript；适配器必须返回明确的不支持错误，直到未来内容契约先进入本 RFC。

现代 MCP App 的业务事件使用版本化扩展 `org.aurorabot/world-events`，不使用已弃用的协议 logging 作为新设计。
扩展通知 method 固定为 `notifications/org.aurorabot/world-events/event`。Client 与 Server 的 capability settings 都必须严格
等于 `{"version": 1}`，且 App 配置必须显式启用；Host 在握手完成并验证双方 settings 前不得把该通知写入 World，未协商、
版本不符或启动失败期间收到的通知必须拒绝。载荷映射为
`EnvironmentEvent(event_id, source, scope, kind, occurred_at, summary, data)`。无稳定 event id、非法 scope/kind 或伪造保留事件的载荷必须拒绝；
普通未协商 vendor notification 不自动成为业务事实。为迁移已有旧 Server，`apps.toml` 可对单个 App 显式开启受限的 legacy
`notifications/message + logger=aurora/event` 转换；该兼容路径必须使用同样的载荷验证和世界提交边界，不得成为通用日志入口。
当前 Streamable HTTP 客户端没有为自定义扩展建立可持续的 Server→Client 事件订阅，因此该 transport 与 `world_events` 的组合
必须在启动效果前拒绝；不能把一次请求期间可用的响应流当成长连接。事件通知是 best-effort：协议没有 Aurora 级确认、重放或送达
证明，稳定 event id 只用于收到后的幂等提交；Server 和 ops 只能报告通知尝试或 Host 已实际提交的事件，不能把“已发送”表述为
“已送达”。断线期间丢失的事件不创建恢复队列，也不直接唤起 AgentTree。

当前不建立旧工具活动、异步回执、AMP、恢复队列、动态重绑定、通用生命周期或多级 catalog。MCP 包内封闭的连接/关闭不是通用扩展生命周期。
将来若真实异步工具需要更多语义，
必须继续让模型只看到同一个工具 ID/definition 目录，并保持 Tool call 到一次规范化 tool 消息的对应关系。

## 10. 包边界

当前最小包结构：

| 包 | 职责 | 可依赖 |
| --- | --- | --- |
| `src/utils` | 无项目语义的日志、时间、文本与序列化工具 | 标准库、loguru |
| `src/contracts` | Chat、Tool、Model、AgentTree 与世界线不可变值对象和端口 | 标准库 |
| `src/agents` | 不可变 AgentDefinition 目录与唯一解析 | contracts |
| `src/prompt` | 四角色 PromptAssembler | contracts |
| `src/tools` | 不可变工具注册表、统一路由与框架内建工具 | contracts、agents |
| `src/engine` | AgentTree 的确定性最小循环 | contracts、agents、prompt、tools |
| `src/ai` | LiteLLM 模型网关与 OpenAI-compatible 协议映射 | contracts、litellm |
| `src/world` | SQLAlchemy WorldJournal、ORM 模型与版本迁移 | contracts、SQLAlchemy、aiosqlite |
| `src/memory` | 从世界线生成有界近期 MemorySnapshot | contracts |
| `src/cadence` | 世界驱动 tick 与 AgentTree 唤起决策 | contracts |
| `src/mcp` | MCP 2.x 连接、发现、Tool 适配与事件写入 | contracts、mcp SDK、httpx2 |
| `src/console` | 本地异步终端、终端控制 DTO 与输入世界事件 | contracts、prompt-toolkit |
| `ops` | 热路径外的操作资源树、运行监测、显式改动入口与本地 Panel HTTP 适配 | 标准库、tomlkit、aiosqlite、FastAPI、Uvicorn、Rich |
| `aurora` | 项目配置、分阶段组合根、项目 runtime 与 CLI | 所有下层包 |

依赖方向固定为 `utils/contracts ← agents/prompt/ai/world/memory/cadence/mcp`、`agents/contracts ← tools ← engine ← aurora`，`console ← aurora`，
`ops ← aurora`；ops 与 src 互不导入。除 `src.world` 外的认知核心不依赖配置加载器、数据库、Web 框架、MCP SDK 或具体
Provider；`src/mcp` 作为协议适配叶子例外依赖 MCP SDK，但不依赖 tools、engine、aurora 或 ops。`src` 不导入 `aurora` 或 `ops`。

规划但尚未实现的包只保留 `src/sandbox`；它不持有 world。sandbox 进入实现前必须使用同一注册基线与 ops 入口模式，
且不得反向侵入现有包。

`ops` 保留统一操作体系的标准设计：一个 `OperationSpec` 同时描述 method/path 资源入口和斜杠文本入口，参数只解析一次，
处理器统一返回 `OperationResult`。操作按领域模块显式注册，目录可自描述。它只经组合根注入的窄端口观察或请求改动：

- 运行监测读取当前及已完成的 AgentTree、节点、状态和 transcript 投影，以及指定 scope 的有界世界提交索引；
- 运行改动只能请求 AuroraRuntime 发起一棵新树或提交一条环境事实，不直接替换节点或追加消息；提交环境事实不会自动启动树；
- 配置监测读取 `AuroraConfig` 的注册目录和个人 TOML；
- 配置改动当前只允许切换 `apps.toml` / `extensions.toml` 中既有条目的 `enabled`，保留注释，并在值发生变化时返回
  `restart_required = true`；不得修改 `config.example/`；
- 每个运行时包在 ops 中拥有自己的窄 RuntimePort 与操作模块：engine、config、agents、tools、prompt、ai、world、console、
  cadence、memory、mcp
  均有 method/path 与斜杠入口；成功数据经 `OperationResult.success` 返回并由终端以 JSON 渲染，端口未装配时统一返回
  `NOT_AVAILABLE`。写入类操作成功后由对应运行时记录世界事实，纯读操作不产生提交；
- ops 不拥有第二份运行状态，不进入 AgentTreeRunner 热路径；engine 只通过通用观察回调发布不可变树快照，不依赖 ops。

ops 的 `OperationSpec`、`OperationRouter` 与操作处理器保持适配器中立。`ops.panel` 是消费同一目录的本地 HTTP 适配层：

- 默认只绑定 loopback；除存活检查和登录外，目录与全部 HTTP 操作都要求有效 Bearer session；
- 长期 bootstrap Token 由密码学安全随机数生成并原子保存到 `storage.ops/Token.txt`，只用于换取 session；比较使用恒定时间函数；
- session 使用独立随机 Token，明文只在登录响应出现一次，SQLite 只保存摘要、创建时间与过期时间；登出立即撤销当前 session；
- 删除 `Token.txt` 后重启会生成新 Token 并撤销全部旧 session；首次生成时终端显示完整 Token，后续启动只显示文件路径；
- Token 与 session 不进入日志、World、OperationResult、URL query 或异常文本；Uvicorn access log 关闭；
- CORS 只接受配置中的精确 Origin，Host 必须是本地绑定地址；HTTP adapter 严格区分 path/query/JSON body 并拒绝未知参数；
- `GET /api/ops` 返回目录，`GET|POST /api/ops/{path}` 调用现有 OperationRouter。`text_only` 操作保留在目录但不经 HTTP 暴露；
- HTTP adapter 可以保存认证数据，但不保存 AgentTree、世界提交或第二份运行状态，也不得把认证判断放入 operation handler。

当前 Panel 不包含附件、WebSocket、静态文件托管或进程日志读取。前端用现有轮询操作观察 Tree 与 World；发送消息等价于显式
`POST /trees`，不会恢复 Session、Activity 或 mailbox。

`src.utils` 只保留没有上层包依赖的通用实现。WorldJournal 的 SQLAlchemy ORM 与迁移只归 `src.world` 所有；项目配置加载、
子进程命令等组合层工具仍属于
`aurora.utils`，不得下沉后让 `src` 反向理解项目目录。

进程日志是运行诊断，不是世界事实：日志不得写入 WorldJournal、AgentNode transcript 或 Tool 结果，也不能替代已有的因果提交。
`src.utils.logging` 提供基于 loguru 的统一 logger、线程安全的终端 sink 与轮转文件 sink；`aurora start` 在配置加载完成后、WorldJournal 和 MCP
产生启动效果前应用 `logging.toml`，后续注册的 logger 继承同一状态。项目拥有的运行模块只在稳定边界记录结构化参数：INFO 表示
启动、就绪和关闭等生命周期，WARNING 表示已经被处理的降级或效果未知，ERROR/exception 表示当前操作失败，DEBUG 表示不改变
行为的计数、ID 和阶段。日志不得包含环境变量值、认证信息、消息正文、Prompt、Tool 参数或结果正文、模型原始请求/响应、世界提交
summary/data；这些内容只能留在其已有领域边界。第三方库日志不计为项目诊断覆盖，也不得通过 root logger 重复传播。

`aurora` 虽不属于认知核心，仍保留以下必要的增长边界：

- `aurora.commands`：每个 CLI 命令一个模块，由命令目录统一注册；命令实现不进入 `main.py`；`config list` 与
  `config show <name>` 只读取注册目录和源文件，不修改配置；
- `aurora.configuration`：每个 TOML 文件对应一个同名 Python 模块；模块定义自己的纯配置值、解析器和注册函数；
- `aurora.composition`：每个需要项目实例的 `src` 子包对应一个同名 Python 模块；模块声明自己需要的实例并注册构造结果；
  其中 agents 模块先从纯配置构造 AgentDefinition 目录，mcp 模块接收异步阶段已冻结的 MCP runtime，tools 模块再用该目录构造
  `aur.agent.delegate` 并与外部注入工具、冻结 MCP Tool 组成唯一注册表；world 模块按 `storage.toml` 构造 WorldJournal 并作为第一个注册器提供单例，console 模块向 TerminalConsole
  注入同一单例的 `WorldWriter`，engine 模块消费模型、提示词、工具与世界实例并完成跨目录引用校验；
- `aurora.config`：按配置目录的显式注册顺序加载全部 TOML，并合并为一个只读 `AuroraConfig`；
- `aurora.composer`：为分阶段组合提供类型化实例键、构造上下文和只读结果，不知道具体 `src` 子包；
- `aurora.runtime`：在异步进程边界中先应用日志配置并初始化唯一 WorldJournal，再连接并完整发现 MCP，然后把同一 world 实例与冻结的 MCP Tool 集合
  交给同步组合，并从组合结果取得最终 runner 和项目入口配置。启动顺序固定为 world 初始化 → MCP 连接/发现 →
  ToolRegistry 冻结 → AgentDefinition 跨目录校验 → engine 可运行 → 绑定统一停止请求 → Panel ready → cadence 后台启动；
  发现完成和停止请求绑定前不得接受 HTTP AgentTree。关闭时先停止 HTTP 接入，再停止 cadence、MCP 与 world。
- `aurora start`：首先读取项目根目录的 `.env`，且不覆盖进程已有环境变量；随后加载个人配置并应用进程日志，从已注册模型端点构造
  Model，组合一个 AuroraRuntime，并统一管理 Panel、Console、停止事件和 SIGINT/SIGTERM；`--headless` 只禁用 Console。当前没有
  Platform，因此不接受或伪装平台选择参数；
- `aurora.utils`：只保存无项目语义的功能工具，例如子进程执行与 TOML 字段读取。

命令、配置和组合使用同一种扩展成本：新增一个并列模块，并在对应目录入口增加一条显式注册记录。中心加载器、
`AuroraConfig`、通用合成器和 runtime 不因新增配置文件或中间组件而增加分支。注册顺序是确定性的；重复配置键、重复实例键
和读取尚未注册的依赖都立即失败。配置值不直接使用 PromptCatalog、AgentTreeRunner 等实现期对象；从配置形状到运行对象的
转换只发生在 composition。只提供契约或纯函数、无需项目实例的 `src` 子包不需要空的 composition 模块。

## 11. 配置与存储

核心值对象可直接由 Python 构造。`config.example/` 是随源码发布的完整配置模板；用户将其复制为 `config/` 后形成个人生效
配置。`config/` 必须被 Git 忽略，运行时和 `aurora config` 只读取它，不隐式回退到模板，也不把个人修改写回源码。

项目配置按职责拆成 `runtime.toml`、`engine.toml`、`agents.toml`、`models.toml`、
`prompts.toml`、`apps.toml`、`platforms.toml`、`extensions.toml`、`logging.toml` 和 `storage.toml`；环境 profile 位于
`profiles/<name>.toml`，提示词正文位于 `prompts/`。`runtime.tree` 只保存 root node id 和 root AgentDefinition id；
`agents.toml` 定义全部可实例化 Agent 的 description、prompt、model、tools 和 children；`engine.tree`、`prompts.toml` 与
`models.toml` 分别提供树上限、prompt 正文和 model endpoint。组合时必须拒绝重复 definition id，以及不存在的 root、
child、prompt、model 或 Tool 引用。`runtime.console` 决定默认是否启动本地终端。其余配置作为已注册的只读项目事实进入
`AuroraConfig`，直到对应运行包出现真实用例。

`models.toml` 的 `models.endpoints` 键是节点显式保存和 `ModelRequest` 显式携带的 model endpoint id；每个 endpoint 固定指向
一个 provider 和协议 model 名称。Provider 不从 prompt 或 AgentDefinition 推导 endpoint。密钥字段只声明环境变量名，真实密钥只在调用时从环境变量读取。
当前模型效果统一经过 LiteLLM 网关：`litellm` adapter 使用显式 `provider/model`，`openai_compatible` adapter 使用
`openai/model + api_base`。两者共用 Chat Completions 消息与 Tool 映射，不建立绕过网关的直连客户端；其他 adapter 启动即
失败，不进行隐式兼容猜测。

`apps.toml` 由同名 configuration 模块解析为类型化、不可变的 MCP App DTO，不再只保留原始 TOML。package 全局唯一。
stdio App 必须声明 `working_dir + command`，不得声明 URL；Streamable HTTP App 必须声明 HTTPS URL，不得声明本地命令或工作目录。
两者均支持 `enabled`、`timeout_seconds`、显式环境变量名白名单与事件模式；远程认证只使用 `auth_env`。协议首选版本与自动兼容策略是架构事实，
不开放 TOML 选择另一 SDK 主版本。为兼容已有个人配置，省略 `event_mode` 等价于安全的 `disabled`；启用现代扩展或受限 legacy
转换仍必须显式填写对应模式。

`platforms.toml` 只保存 MCP 总开关与终端诊断偏好，不由此恢复通用 Platform、Manifest 或七端口体系。App enabled、目录或 schema 变化只在
重启后生效。`ops` 对现有 App 的 enabled 改动仍保留 TOML 注释，并返回 `restart_required=true`。

`logging.toml` 解析为不可变的 `level + log_dir` 配置；level 只接受标准 DEBUG/INFO/WARNING/ERROR/CRITICAL（WARN 规范化为
WARNING），log_dir 必须是项目内相对目录。运行日志固定写入该目录的 `aurora.log` 并按大小轮转，同时保留终端诊断；配置本身不提供
任意格式字符串、绝对路径、handler 类或远程日志地址。

`.env` 是本地启动便利入口，只能向进程环境补充尚不存在的变量，不覆盖调用者显式设置的环境，也不定义或改写 TOML
结构。文件不存在时按空环境处理；`.env` 与 `config/` 一样属于个人文件，不进入源码发布或 Git 跟踪。

模板与个人目录保持相同拓扑。每个 TOML 只由同相对路径的 configuration 模块解析；通用加载器不包含文件名、字段名或具体
配置类型分支。新增结构配置时，增加一个模板 TOML、一个同路径 configuration 模块和一条注册记录。密钥只来自环境变量。

`runtime.panel` 定义 enabled、loopback host、port、唯一 frontend URL、精确 allowed origins、是否打开浏览器与 session TTL；
这些值在进程启动时冻结，配置 reload 后需要重启。`storage.data_root` 与 `storage.ops` 共同确定 Panel Token 和 session 数据目录。

`storage.toml` 的 `storage.data_root` 与 `storage.world` 共同确定 WorldJournal SQLite 文件路径。WorldJournal 维护单行
schema version；首版为 v1，后续每次 schema 改动必须提供 `vN → vN+1` SQLAlchemy migration 并更新版本。它同时维护
per-scope sequence 与全局 insertion cursor，只保存世界提交，不归档 AgentTree，也不把数据库对象泄漏进节点契约。Panel SQLite
只保存认证 session，不是会话归档；费用库与独立记忆库仍未定义。

## 12. 当前范围之外

当前实现不包含：

- Inbox、quiet window、triage、fast/root 双入口和 session revision；
- 独立 Task、Agent mailbox、Activity、因果投影和 output publication 状态机；
- continuation、Responses/Chat Completions 双通道重放和多 Provider 能力协商；
- 自动长期记忆、embedding、mem0/Chroma 和终态投影；
- 七类贡献端口、manifest、面向第三方的扩展注册表和生命周期装配；
- Panel 附件、WebSocket、静态文件托管、远程账号与多用户权限；
- MCP Resources、Prompts、MCP Apps UI、sampling、elicitation、roots、`io.modelcontextprotocol/tasks` 与非文本工具结果；
- 运行期 ToolRegistry 热替换、MCP 自动重连和跨重连效果幂等；
- sandbox，以及远程日志收集、分布式 trace、审计归档和运行期日志重配置；
- WorldJournal 之外的持久化、故障恢复、租约、抢占、并发和费用统计；
- 为上述能力存在的结构配置与测试。

这些能力进入当前实现前，必须围绕稳定的 AgentTree 提供真实用例、清楚的不变量和独立测试。不得以“兼容旧业务”为由恢复上述旧运行模型。
MCP Tasks 只是一种协议扩展，也不得映射为 Aurora Task；如未来支持长时 MCP 调用，仍须表现为一条 AgentTree Tool call 的可审计结果，
并先更新本 RFC。

## 13. 质量与验收

- Python 3.12；使用 uv；Ruff 行宽 120、LF、双引号；公开 API 有类型注解；值对象优先 frozen + slots dataclass。
- 主源码文件不超过 500 行；核心代码不通过 lint ignore 隐藏复杂度。
- 测试以公开行为为主，不复制实现内部状态机。

最小架构完成必须同时满足：

1. 可创建只有 root 的 AgentTree，并完成一次 message → assistant 循环；
2. assistant Tool call 可获得 tool 结果并继续到最终 assistant；
3. `aur.agent.delegate` 与其他 Tool 一样存在于注册表和模型请求的原生 tools 字段中；其 call 可创建 child，child 完成后正确
   恢复 parent，最终完成 root；engine 不按该工具名分派；
4. root 与 child 都从预定义 AgentDefinition 创建；两个定义可以共享 prompt 而使用不同 model/tools，delegate 只能选择
   parent allowlist 内的 child definition；
5. PromptAssembler 只产生 system、message、assistant、tool 四种领域 role，Provider adapter 单独测试 message → user 映射；
6. 非法树、非法角色顺序、重复或错配 call id、越界上下文都在效果发生前失败；
7. 除 WorldJournal 的临时 SQLite 集成测试外，fake Model 与 fake Tool 可在无网络、无环境变量时跑通测试；
8. 当前 Python runtime 不再导入第 11 节已移除的生产化子系统，活动架构文档不再把它们描述为现行能力。
9. fake Model 下可通过 Console 完成普通文本 → AgentTree → assistant → 终端输出，并通过斜杠操作查询状态和停止进程；
10. `aurora start --headless` 与 Console 模式共享同一组合和停止路径，测试不依赖网络、密钥或真实终端；
11. 终端输入在分派前产生 `console.input` 世界提交；ops 的每个包目录与单项命令在终端输出 JSON，端口未装配时返回
    `NOT_AVAILABLE` 而不是崩溃。
12. cadence 只通过 `TreeLaunchRequest` 唤起 AgentTree，memory 只以显式快照参数进入 PromptAssembler，两者均有独立离线测试。
13. 项目依赖 MCP Python SDK 2.x；现代测试 Server 协商 `2026-07-28`，旧修订版兼容测试仍由 SDK v2 完成并显式报告协商版本。
14. stdio 与 Streamable HTTP 均可在 App 的单一启动截止时间内完整分页发现 Tool；目录监听在首次分页前建立且没有重复接收路径，
    启动窗口发生变化时不冻结已知过期目录。任一启用 App 启动失败时逆序清理，且全部发现完成前不构造最终 registry/runner。
15. MCP Tool ID、object schema、重复项及 AgentDefinition 引用在效果发生前校验；运行中 catalog 变化不修改 registry 或 node，只报告需重启。
16. `org.aurorabot/tool-contract` 只在双方严格协商 `{"version": 1}` 后解释 Tool / CallToolResult `_meta`；默认 App scope、
    顶层参数 scope 模板的发现与调用前校验，以及 succeeded/failed/unknown 到 tool 消息和世界因果的映射均有离线测试。
17. MCP 内部超时或下游断线可通过结果 `_meta` 明确产生 unknown，Host 保留 unknown 且不自动重试；只有明确拒绝或无效果错误
    产生 failed，非文本结果在当前契约下明确失败。
18. 经双方严格协商的 Aurora 事件扩展只在协商完成后追加 World，不直接启动树或写 transcript；当前 Streamable HTTP 不允许
    `world_events`，测试不声称 best-effort 通知已经送达。sampling、elicitation、roots 和 Tasks 不会触发模型、用户或独立任务旁路。
19. HTTPS 重定向逐跳验证并拒绝降级到 HTTP；stdio 子进程不继承未授权密钥；MCP ops 端口未装配时返回
    `NOT_AVAILABLE`；依赖边界测试确认没有 `src/platform`、AMP、Task 或七端口回流。
20. `logging.toml` 在 World/MCP 启动效果前配置统一终端与轮转文件 logger；核心运行包的启动、结束、失败和效果未知路径有日志行为测试，
    且测试确认消息正文、Prompt、Tool 参数/结果、模型载荷、环境变量值与世界 data 不会进入项目日志。
21. Panel bootstrap Token 可原子创建、复用和轮换，session 只以摘要持久化并可过期或登出；测试确认认证信息不进入日志、World、
    URL 或操作目录。35 个 OperationSpec 中 34 个经认证 HTTP 暴露，`POST /console/clear` 保持 `text_only`。
22. Panel server 只在最终 runtime 可运行且停止请求已绑定后 ready；bind 失败会逆序清理，shutdown 响应完成后再停止 HTTP。
