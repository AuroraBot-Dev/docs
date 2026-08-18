---
title: RFC 0300：统一架构与公共契约
order: 10
---

# 0300：AuroraBot 统一架构与公共契约

状态：现行

日期：2026-08-18

## 1. 文档地位

本文件是 AuroraBot 唯一的设计基准。当前工作树只描述现行实现，不维护并行公共契约。
影响 AgentTree、消息角色、模型调用、工具调用、包边界、配置或持久化的改动必须先更新本文件。

源码、测试和配置注释直接说明局部行为与不变量，不引用具体 RFC 编号或章节。历史设计只由 Git 保存。

## 2. 当前范围

AuroraBot 是以 AgentTree 为运行聚合根的自主智能体框架。当前实现包含完整最小循环、项目级配置与组合、统一操作目录、
本地 Console 和进程启动入口，不包含部署、故障恢复、运维面板或第三方扩展生态。

最小循环只有五个基本概念：

1. `AgentTree`：一次完整运行及其全部 Agent 节点；
2. `AgentNode`：树中的一个同构 Agent；
3. `ChatMessage`：节点内按序追加的模型上下文事实；
4. `Model`：读取组装后的消息并产生 assistant 消息；
5. `Tool`：执行模型请求的动作并产生 tool 消息。

任何新概念必须证明无法由这五个概念表达，才可以进入核心。

## 3. 设计原则

- **一棵树就是一次运行**：不再用 Task、mailbox、Activity 和 continuation 的组合间接表达一次 Agent 运行。
- **节点同构**：root 与 child 使用同一种节点、消息和循环；实例差异只来自 system prompt、可见工具、初始 message 和
  使用的 LLM model。
- **上下文即状态**：模型可见状态由节点的追加式 transcript 表达，不在旁路状态机中复制一份认知状态。
- **模型决定，运行时执行**：assistant 可以回复或请求工具；真实效果只由 Tool 执行，结果再以 tool 消息返回。
- **委派就是树操作**：委派是一种内建 Tool 调用，创建 child；child 完成后以对应 tool 结果恢复 parent。
- **先求可解释，再求可靠**：持久化、恢复、并发、授权和运维设施必须建立在明确的最小语义上。
- **注册变化轴，不注册猜想**：命令、TOML 配置和项目组件是确定的并列变化轴，使用显式目录注册表；其他能力没有两个真实
  实现或明确不变量时，不建立生命周期体系或通用扩展接口。

## 4. AgentTree

`AgentTree` 是一次完整运行的唯一聚合根，至少包含：

- 稳定且在树内唯一的 tree id；
- 唯一 root node；
- 由 parent id 连接的有限节点集合；
- 树级运行状态。

`AgentNode` 至少包含：

- 稳定且在树内唯一的 node id；
- 可选 parent id；
- profile id；
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

首版实现使用内存中的不可变值对象。持久化不是核心契约；未来若加入存储，必须保存和恢复同一 `AgentTree` 语义，不能发明
第二套运行模型。

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

消息约束：

- `system` 和 `message` 必须有非空文本，不能携带 Tool call 或 call id；
- `assistant` 可以包含文本、Tool call 或两者，至少有一项非空；
- `tool` 必须带 call id 和规范化文本结果，不能再携带 Tool call；
- 每个 Tool call id 在节点内唯一，并恰好对应零条或一条后续 tool 消息；节点只有在所有待处理调用都返回后才能再次请求模型；
- node-local transcript 的首条消息必须是 message，且不能出现 system；组装后的模型消息首条必须是唯一 system。

## 6. 提示词组装

`PromptAssembler` 是纯函数对象，输入 `AgentTree + node id`，输出该节点下一次模型调用的四角色消息序列。它只做以下工作：

1. 把全局人格、世界说明和 node profile 按固定顺序合并成唯一 system 消息；
2. 在 child 的 system 中加入其局部职责，在首条 message 中加入 parent 给出的 assignment；
3. 原样追加该节点已经发生的 message、assistant 和 tool transcript；
4. 校验角色顺序、Tool call 配对和上下文上界。

组装完成后的模型请求必须携带节点自己的 model id 和可见 Tool 定义。model 选择是节点事实，不由全局 runner、Provider
或 profile id 隐式推导；因此同一 profile 的两个节点可以使用不同 model。

组装器不召回记忆、不访问数据库、不选择模型、不执行工具、不读取其他节点的完整 transcript，也不把 Tool schema重复写进
文本。工具定义使用模型请求的原生 `tools` 字段传递。

首版不做自动裁剪和摘要；超过显式字符上界时立即失败，让上下文策略保持可见。记忆只能作为产生 message 或 system
片段的上游能力加入，不能隐藏在组装器内部。

## 7. 完整最小循环

一次 tree turn 严格遵循：

```text
选择 ready node
  → PromptAssembler.assemble(tree, node)
  → Model.complete(messages, tools)
  → 追加 assistant
      ├─ 无 Tool call：完成 node
      │    ├─ root：完成 tree
      │    └─ child：向 parent 追加 tool，唤醒 parent
      └─ 有 Tool call：逐个执行
           ├─ 普通 Tool：追加 tool 结果
           └─ delegate Tool：创建 child，parent 等待 child
  → 仍有 ready node 时继续
```

首版调度是确定性的单循环：深度优先、同级按创建顺序执行，同一时刻只调用一个 Model 或 Tool。并发、优先级、抢占、防抖和
后台派发不是当前核心。这个选择用于暴露语义，不构成未来并发实现的限制；未来并发仍必须产生等价的树和节点 transcript。

模型失败使当前节点失败；Tool 失败生成普通 tool 错误消息，由模型决定如何继续。child 失败同样作为 delegate call 的 tool
错误返回 parent。运行时不伪造模型回复、不自动重试，也不把空文本改写成完成消息。

## 8. 最小端口

核心只有两个效果端口：

- `Model.complete(request) -> AssistantMessage`，其中 request 显式携带 node 的 model id；
- `Tool.execute(call) -> ToolMessage`。

Provider、Console、MCP、定时器和未来平台都是这两个端口之外的适配器或 message 来源。首版不定义 InputGateway、
EventSource、ControlAction、ContextContributor、OutputSink、Projector、Manifest 或 Lifecycle 公共体系。

Console 是只依赖可注入文本分派端口的本地终端前端：普通文本由组合根映射为“启动新 AgentTree”，斜杠文本交给 ops 的
统一目录；它不导入 ops、aurora 或 engine，不保存 AgentTree，也不拥有 Tool。终端只负责异步读行、历史、中文渲染、清屏和
停止协调。进程退出是 ops 的显式操作，Console 仅执行操作结果携带的终端控制语义。

delegate 是唯一内建 Tool，由 engine 解释为树操作，不交给外部 Tool executor。除此以外，engine 不按工具名称理解业务语义。

## 9. 包边界

当前最小包结构：

| 包 | 职责 | 可依赖 |
| --- | --- | --- |
| `src/utils` | 无项目语义的日志、时间、文本与序列化工具 | 标准库 |
| `src/contracts` | Chat、Tool、Model 与 AgentTree 不可变值对象和端口 | 标准库 |
| `src/prompt` | 四角色 PromptAssembler | contracts |
| `src/engine` | AgentTree 的确定性最小循环 | contracts、prompt |
| `src/ai` | LiteLLM 模型网关与 OpenAI-compatible 协议映射 | contracts、litellm |
| `src/console` | 本地异步终端与终端控制 DTO | 标准库、prompt-toolkit |
| `ops` | 热路径外的操作资源树、运行监测与显式改动入口 | 标准库、tomlkit |
| `aurora` | 项目配置、分阶段组合根、项目 runtime 与 CLI | 所有下层包 |

依赖方向固定为 `utils/contracts ← prompt/ai ← engine ← aurora`，`console ← aurora`，`ops ← aurora`；ops 与 src 互不导入。核心不依赖配置加载器、
数据库、Web 框架、MCP SDK 或具体 Provider。`src` 不导入 `aurora` 或 `ops`。

`ops` 保留统一操作体系的标准设计：一个 `OperationSpec` 同时描述 method/path 资源入口和斜杠文本入口，参数只解析一次，
处理器统一返回 `OperationResult`。操作按领域模块显式注册，目录可自描述。它只经组合根注入的窄端口观察或请求改动：

- 运行监测读取当前及已完成的 AgentTree、节点、状态和 transcript 投影；
- 运行改动只能请求 AuroraRuntime 发起一棵新树，不直接替换节点或追加消息；
- 配置监测读取 `AuroraConfig` 的注册目录和个人 TOML；
- 配置改动当前只允许切换 `apps.toml` / `extensions.toml` 中既有条目的 `enabled`，保留注释，并在值发生变化时返回
  `restart_required = true`；不得修改 `config.example/`；
- ops 不拥有第二份运行状态，不进入 AgentTreeRunner 热路径；engine 只通过通用观察回调发布不可变树快照，不依赖 ops。

当前 ops 是适配器中立的核心，不包含 HTTP 服务、Panel 认证、附件、WebSocket、数据库或前端 Lab；这些都是以后消费同一
OperationSpec 目录的独立适配器，不得反向侵入操作处理器。

`src.utils` 只保留没有上层包依赖的通用实现。当前不包含 SQLAlchemy migration、uvicorn server 包装或其他已移除子系统的
辅助代码。项目配置加载、子进程命令等组合层工具仍属于
`aurora.utils`，不得下沉后让 `src` 反向理解项目目录。

`aurora` 虽不属于认知核心，仍保留以下必要的增长边界：

- `aurora.commands`：每个 CLI 命令一个模块，由命令目录统一注册；命令实现不进入 `main.py`；`config list` 与
  `config show <name>` 只读取注册目录和源文件，不修改配置；
- `aurora.configuration`：每个 TOML 文件对应一个同名 Python 模块；模块定义自己的纯配置值、解析器和注册函数；
- `aurora.composition`：每个需要项目实例的 `src` 子包对应一个同名 Python 模块；模块声明自己需要的实例并注册构造结果；
- `aurora.config`：按配置目录的显式注册顺序加载全部 TOML，并合并为一个只读 `AuroraConfig`；
- `aurora.composer`：为分阶段组合提供类型化实例键、构造上下文和只读结果，不知道具体 `src` 子包；
- `aurora.runtime`：调用全部组件注册函数，并从组合结果取得最终 runner 和项目入口配置。
- `aurora start`：首先读取项目根目录的 `.env`，且不覆盖进程已有环境变量；随后加载个人配置，从已注册模型端点构造
  Model，组合一个 AuroraRuntime，并统一管理 Console、停止事件和 SIGINT/SIGTERM；`--headless` 只禁用 Console。当前没有
  Platform，因此不接受或伪装平台选择参数；
- `aurora.utils`：只保存无项目语义的功能工具，例如子进程执行与 TOML 字段读取。

命令、配置和组合使用同一种扩展成本：新增一个并列模块，并在对应目录入口增加一条显式注册记录。中心加载器、
`AuroraConfig`、通用合成器和 runtime 不因新增配置文件或中间组件而增加分支。注册顺序是确定性的；重复配置键、重复实例键
和读取尚未注册的依赖都立即失败。配置值不直接使用 PromptCatalog、AgentTreeRunner 等实现期对象；从配置形状到运行对象的
转换只发生在 composition。只提供契约或纯函数、无需项目实例的 `src` 子包不需要空的 composition 模块。

## 10. 配置与存储

核心值对象可直接由 Python 构造。`config.example/` 是随源码发布的完整配置模板；用户将其复制为 `config/` 后形成个人生效
配置。`config/` 必须被 Git 忽略，运行时和 `aurora config` 只读取它，不隐式回退到模板，也不把个人修改写回源码。

项目配置按职责拆成 `runtime.toml`、`engine.toml`、`agents.toml`、`models.toml`、
`prompts.toml`、`apps.toml`、`platforms.toml`、`extensions.toml`、`logging.toml` 和 `storage.toml`；环境 profile 位于
`profiles/<name>.toml`，提示词正文位于 `prompts/`。`runtime.tree`、`engine.tree` 和 `prompts.toml` 是当前 AgentTree
组合直接消费的配置；`runtime.console` 决定默认是否启动本地终端，`models.toml` 为 start 提供模型端点。其余配置作为已注册的
只读项目事实进入 `AuroraConfig`，直到对应运行包出现真实用例。

`models.toml` 的角色键是节点显式保存和 `ModelRequest` 显式携带的 model endpoint id；每个 endpoint 固定指向一个 provider
和协议 model 名称。Provider 不从 profile 推导 endpoint。密钥字段只声明环境变量名，真实密钥只在调用时从环境变量读取。
当前模型效果统一经过 LiteLLM 网关：`litellm` adapter 使用显式 `provider/model`，`openai_compatible` adapter 使用
`openai/model + api_base`。两者共用 Chat Completions 消息与 Tool 映射，不建立绕过网关的直连客户端；其他 adapter 启动即
失败，不进行隐式兼容猜测。

`.env` 是本地启动便利入口，只能向进程环境补充尚不存在的变量，不覆盖调用者显式设置的环境，也不定义或改写 TOML
结构。文件不存在时按空环境处理；`.env` 与 `config/` 一样属于个人文件，不进入源码发布或 Git 跟踪。

模板与个人目录保持相同拓扑。每个 TOML 只由同相对路径的 configuration 模块解析；通用加载器不包含文件名、字段名或具体
配置类型分支。新增结构配置时，增加一个模板 TOML、一个同路径 configuration 模块和一条注册记录。密钥只来自环境变量。

当前不定义运行时数据库、schema 版本、迁移、会话归档、费用库、记忆库或面板存储。需要持久化时，先以完整
AgentTree 的显式导入/导出适配器验证，不把存储细节加入节点契约。

## 11. 当前范围之外

当前实现不包含：

- Inbox、quiet window、triage、fast/root 双入口和 session revision；
- 独立 Task、Agent mailbox、Activity、因果投影和 output publication 状态机；
- continuation、Responses/Chat Completions 双通道重放和多 Provider 能力协商；
- 自动记忆、embedding、mem0/Chroma 和终态投影；
- 七类贡献端口、manifest、面向第三方的扩展注册表和生命周期装配；
- Panel 后端、认证、附件和 WebSocket；
- MCP 进程管理、应用目录、sandbox 和生产化日志设施；
- SQLite 历史 schema 与迁移链、故障恢复、租约、抢占、并发和费用统计；
- 为上述能力存在的结构配置与测试。

这些能力进入当前实现前，必须围绕稳定的 AgentTree 提供真实用例、清楚的不变量和独立测试。

## 12. 质量与验收

- Python 3.12；使用 uv；Ruff 行宽 120、LF、双引号；公开 API 有类型注解；值对象优先 frozen + slots dataclass。
- 主源码文件不超过 500 行；核心代码不通过 lint ignore 隐藏复杂度。
- 测试以公开行为为主，不复制实现内部状态机。

最小架构完成必须同时满足：

1. 可创建只有 root 的 AgentTree，并完成一次 message → assistant 循环；
2. assistant Tool call 可获得 tool 结果并继续到最终 assistant；
3. delegate call 可创建 child，child 完成后正确恢复 parent，最终完成 root；
4. PromptAssembler 只产生 system、message、assistant、tool 四种领域 role，Provider adapter 单独测试 message → user 映射；
5. 非法树、非法角色顺序、重复或错配 call id、越界上下文都在效果发生前失败；
6. fake Model 与 fake Tool 可在无网络、无数据库、无环境变量时跑通全部测试；
7. 当前 Python runtime 不再导入第 11 节已移除的生产化子系统，活动架构文档不再把它们描述为现行能力。
8. fake Model 下可通过 Console 完成普通文本 → AgentTree → assistant → 终端输出，并通过斜杠操作查询状态和停止进程；
9. `aurora start --headless` 与 Console 模式共享同一组合和停止路径，测试不依赖网络、密钥或真实终端。
