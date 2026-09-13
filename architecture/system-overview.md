---
order: 1
---

# 系统总览

本页描述 AuroraBot 的现行实现结构。设计思想见 `RFC 0300`；精确词汇与协议见 `reference/`。实现结构可随开发更新，不受 RFC 修订约束。

## 进程结构

进程分两层：

- `aurora`：CLI 命令分发与项目配置解析，不持有任何运行期组合。
- `src`：运行期核心。以组合微内核装配自描述能力包，并提供进程门面。

## 包边界

| 包 | 职责 | 可依赖 |
| --- | --- | --- |
| `src/utils` | 无项目语义的日志、时间、文本与序列化工具 | 标准库、loguru |
| `src/contracts` | 公共值对象、常量与贡献契约；跨包能力端口按提供方放在 `pkgs/<pkg>.py` | 标准库 |
| `src/agents` | 不可变 AgentDefinition 目录与唯一解析 | contracts |
| `src/prompt` | 四角色 PromptAssembler | contracts |
| `src/tools` | 不可变工具注册表、统一路由与框架内建工具 | contracts |
| `src/engine` | AgentTree 的确定性最小循环 | contracts |
| `src/ai` | LiteLLM 模型网关与 OpenAI-compatible 协议映射 | contracts、litellm |
| `src/world` | SQLAlchemy WorldJournal、ORM 模型与版本迁移 | contracts、SQLAlchemy、aiosqlite |
| `src/memory` | 从世界线生成有界近期 MemorySnapshot | contracts |
| `src/cadence` | 世界驱动 tick 与 AgentTree 唤起决策 | contracts |
| `src/mcp` | MCP 2.x 连接、发现、Tool 适配与事件写入 | contracts、mcp SDK、httpx2 |
| `src/console` | 本地异步终端、本地命令与输入世界事件 | contracts、prompt-toolkit |
| `src/kernel` | 组合微内核：模块声明、依赖解析、拓扑装配与统一生命周期 | contracts、utils |
| `src/runtime` | Bot 进程门面与装配工厂 | contracts、kernel、utils |
| `aurora` | CLI 命令分发与项目配置解析 | 下层包 |

依赖方向固定为 `utils/contracts ← agents/prompt/ai/world/memory/cadence/mcp/console`、`contracts ← kernel ← runtime`，`src ← aurora`。除 `src.world` 外的认知核心不依赖配置加载器、数据库、Web 框架、MCP SDK 或具体 Provider；`src/mcp` 作为协议适配叶子例外依赖 MCP SDK，但不依赖 tools、engine 或 aurora。`src` 不导入 `aurora`。

`contracts` 与 `utils` 是唯一可被任何包运行时直接引用的基础设施叶子。功能 src 包之间不运行时相互引用：跨包能力只经组合内核装配并注入的契约实例在运行期调用，类型位置只允许 `TYPE_CHECKING` 导入。上表“可依赖”列表示逻辑类型依赖，不代表运行时 import 边。

跨包能力端口按提供方组织在 `src/contracts/pkgs/<pkg>.py`：每个 `src/<pkg>` 若向全局暴露端口，就在该目录放一个同名文件，只定义 Protocol 并引用 `src.contracts` 的基础值对象；消费方直接从 `src.contracts.pkgs.<pkg>` 导入。新增端口只增加一个文件，不需要修改任何聚合入口或其他模块。`src.contracts/__init__.py` 只再导出基础值对象与常量，不再中心化导出端口。

规划但尚未实现的包只保留 `src/sandbox`；它不持有 world，进入实现前必须使用同一 `@module` 注册基线，且不得反向侵入现有包。

## 组合机制与门面

- `src.kernel`：以契约类型为能力身份，提供 `ModuleSpec` 与 `@module` 装饰器、`Capabilities`/`ModuleContext`、只读 `Assembly`、依赖解析（冲突裁决、缺失依赖、可选跳过、环检测、拓扑排序）与 `ManagedAssembly` 生命周期。发现源包括随安装发布的 `src` 功能包（读取每个包的唯一 `MODULE`）、项目内被 Git 忽略的 `extensions/plugins/` 目录，以及 `aurorabot_plugin` entry point。同优先级冲突、缺失依赖与依赖环都在启动前失败并给出诊断；第三方模块在进程内与宿主同权限运行，这是有意的信任边界。
- 每个 `src/<pkg>` 在 `module.py` 中自描述唯一 `MODULE`：声明 `provides`、`requires`、`contributes/consumes`、`declares`，并以阶段为键注册钩子（具名参数是内置阶段的便捷写法，`hooks` 可声明任意阶段），用 `order` 声明顺序约束。兄弟能力只经契约类型注入，模块之间不运行时相互 import（类型位置允许 TYPE_CHECKING）。机制把“模块 × 阶段”编译为一份阶段计划：每个阶段带 `kind`（setup/build/hook/task）与全局 `order`，构造阶段全部先于运行阶段、运行阶段全部先于关闭阶段，Assembly 在构造阶段之后冻结。内置阶段为 `prepare → construct → activate → ready → run → drain → close`；机制按 `kind` 通用调用钩子，模块可声明自定义阶段而无需修改机制。具体分工保持：agents 模块从纯配置和完整 Tool 贡献目录构造 AgentDefinition 目录；mcp 模块在 prepare 中完成连接与工具发现并贡献冻结 Tool；world 模块在 prepare 中初始化唯一 WorldJournal；cadence 模块自行声明初始化和后台循环并贡献 `TreeLauncher` 绑定；console 模块向 TerminalConsole 注入同一 WorldWriter 并贡献一个交互式前台；engine 模块消费模型、提示词、工具、世界与记忆实例并完成跨目录引用校验。
- 扩展维度由提供方声明：贡献点身份由声明该维度的模块在 `declares` 中公开，机制在装配前收集并校验唯一性；引用未声明贡献点或重复声明都在启动前失败。
- `src.runtime`：自描述为 `runtime` 模块，提供从冻结 `Assembly` 创建进程门面的 `RuntimeFactory` 契约；装配入口发现内建 `src` 模块、本地插件目录与 entry point，执行统一生命周期，并从冻结 `Assembly` 创建门面、驱动全部已贡献前台（无界面时排除交互式前台）与逆序关闭。工厂只捕获 runner、agents、root 配置、console 与 world，不为了转存实例而持有 Memory、MCP 或 Cadence；`TREE_LAUNCHER_BINDINGS` 是接收 `TreeLauncher` 的同步绑定函数贡献点，工厂创建门面后逐一接线，绑定完成后才允许生命周期 activate/run。`FRONT_BINDINGS` 是进程前台贡献点：每个绑定接收一个只读的按需能力视图（可读取已装配能力与进程运行服务），返回一个前台；运行入口并发运行全部非交互前台（或交互前台），无前台时等待停止事件。Console 是其中一个交互式前台，按需读取调度端口与前台 I/O，不需要终端的前台不会收到终端字段。进程日志与 SIGINT/SIGTERM 由 `aurora start` 拥有，不在门面内实现。

Tool 是第一个多值贡献点：mcp、调用者注入和未来 TTS 等能力都向稳定 Tool 贡献键追加 `Tool`，agents 用完整贡献集合解析可见名称，tools 用同一集合与框架内建工具冻结唯一 `ToolRegistry`；新增 Tool 提供者不得修改 agents、tools 或 runtime。启动准备不产生世界提交；由模块声明得到的顺序必须等价于 world 初始化 → MCP 连接/发现与 Tool 贡献冻结 → ToolRegistry 冻结 → AgentDefinition 跨目录校验 → Assembly 完成 → cadence cursor 固定 → MCP 业务事件入口激活 → cadence 后台启动。关闭时由生命周期取消 run task、逆序执行模块 close 与 prepare cleanup；runtime 不按 world、MCP、cadence 或未来能力名称增加启动/关闭分支。

命令与配置模块都按目录约定自动发现，文件名排序保证确定性；新增并列能力只增加该能力自己的配置模板、`configuration`/`src/<pkg>/module.py` 文件，不修改目录入口或 Tool 聚合方。重复配置键、重复模块名、重复能力提供者、未声明依赖、贡献类型冲突和依赖环都立即失败。配置值不直接使用 PromptCatalog、AgentTreeRunner 等实现期对象；从配置形状到运行对象的转换只发生在 `src/<pkg>/module.py`。

## CLI 与配置层

`aurora` 只保留 CLI 命令分发与项目配置解析，不再持有任何运行期组合：

- `aurora.commands`：每个 CLI 命令一个模块（可为包），目录入口按文件名排序自动发现同时导出 `COMMAND + execute` 的模块；命令实现不进入 `main.py`；`aurora config` 默认只读：不带参数列出全部注册配置，带名称显示源文件路径与实例化后的类型化值，`--raw` 显示原始 TOML；仅在显式 `--edit`（调用 `$EDITOR`）或 `--set`（经 tomlkit 保留格式地改写个人 `config/`）时才写入，且只写个人配置、绝不回退模板或写回源码；`aurora start` 读取 `.env`、加载个人配置、应用进程日志、安装并恢复 SIGINT/SIGTERM 停止处理器，然后调用 `src.runtime` 的装配与运行入口；`--headless` 只禁用 Console；
- `aurora.configuration`：每个 TOML 文件对应一个同名 Python 模块；模块引用 `src/<pkg>` 的配置 DTO、声明解析器并导出唯一 `CONFIG_SPEC`，目录入口按文件名排序自动发现；配置 DTO 由能力包拥有，解析仍在 aurora；
- `aurora.config`：按配置目录的显式注册顺序加载全部 TOML，并合并为一个只读 `AuroraConfig`；`AuroraConfig` 同时实现 `src.contracts.Settings`，向自描述模块提供 `project_root` 与按 DTO 类型读取的 `resolve`；
- `aurora.utils`：只保存无项目语义的功能工具，例如子进程执行与 TOML 字段读取。

## 日志边界

进程日志是运行诊断，不是世界事实：日志不得写入 WorldJournal、AgentNode transcript 或 Tool 结果，也不能替代已有的因果提交。`src.utils.logging` 提供基于 loguru 的统一 logger、线程安全的终端 sink 与轮转文件 sink；`aurora start` 在配置加载完成后、WorldJournal 和 MCP 产生启动效果前应用 `logging.toml`，后续注册的 logger 继承同一状态。项目拥有的运行模块只在稳定边界记录结构化参数：INFO 表示启动、就绪和关闭等生命周期，WARNING 表示已经被处理的降级或效果未知，ERROR/exception 表示当前操作失败，DEBUG 表示不改变行为的计数、ID 和阶段。日志不得包含环境变量值、认证信息、消息正文、Prompt、Tool 参数或结果正文、模型原始请求/响应、世界提交 summary/data；这些内容只能留在其已有领域边界。第三方库日志不计为项目诊断覆盖，也不得通过 root logger 重复传播。
