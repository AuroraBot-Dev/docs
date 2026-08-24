---
order: 14
---

# aurora

项目唯一组合根与运行时门面。`src` 与 `ops` 互不认识的实例都在这里显式装配。

## 结构

```text
aurora/
  commands/        每个 CLI 命令一个注册模块
  configuration/   每个 TOML 一个解析与注册模块
  composition/     每个需构造实例的 src 子包一个注册模块
  composer.py      InstanceKey、CompositionContext、AuroraAssembly
  config.py        ConfigKey、AuroraConfig、合并器
  runtime.py       AuroraRuntime、assemble_runtime、run_project
  main.py          顶层 CLI 解析与分派
  utils/           子进程、TOML 字段等无项目语义工具
```

## 启动与组合顺序

组合根先拥有异步效果边界：

```text
加载纯配置
  → 应用 logging.toml（终端 + 轮转文件）
  → 初始化唯一 WorldJournal
  → 启动全部 enabled MCP App
  → SDK 2.x 自动协商（2026-07-28 优先，旧修订兼容）
  → 在 App 启动截止时间内建立唯一目录监听并完整分页 tools/list
  → 冻结 MCP Tool 快照
  → 执行同步 composition
```

同步注册顺序：

```python
COMPOSITION_REGISTRARS = (
    world.register,    # 世界单例第一个构造
    mcp.register,      # 接收异步阶段已经冻结的 MCP runtime
    memory.register,   # 只读世界记忆
    cadence.register,  # 节律 + 唤起策略
    agents.register,
    ai.register,
    prompt.register,
    console.register,
    tools.register,
    engine.register,
)
```

- `CompositionContext.provide` 拒绝重复实例键：`world.journal` 是全局单例；
- `require` 读取尚未注册的依赖立即失败：顺序即契约；
- `AuroraRuntime` 持有该 world 实例，并向 console 注入 `WorldWriter`、向 engine 注入 `WorldJournal`。
- tools.register 一次性合并 builtin、调用方外部 Tool 与冻结 MCP Tool；engine.register 随后校验全部 AgentDefinition 引用。
- 任一启用 App 发现失败时，逆序关闭已建立连接和 stdio 子进程，不构造最终 runner。
- 启动期间的目录变化使当前分页作废，不能把已知过期目录交给同步组合；HTTPS 重定向不能降级到 HTTP。
- `world_events` handler 只有在双方严格协商 v1 后才获得 WorldWriter 提交通路，当前 Streamable HTTP 配置不允许启用该模式。

## 生命周期

- 异步 assembly：配置 → world 初始化 → MCP 完整发现 → 同步组合 → `AuroraRuntime`；
- 日志配置在 world 初始化和 MCP 子进程启动前生效；关闭日志只描述阶段和 ID，不复制领域载荷；
- `run_project()`：只有 registry 冻结和跨目录校验成功后才开放 Console/AgentTree；`cadence.enabled = true` 时再创建节律后台任务；
- 关闭顺序先停止 cadence/Console 与新的 AgentTree 输入，再关闭 MCP 连接和 stdio 子进程，最后关闭 WorldJournal；
- 运行中不 reload、不热替换 MCP Tool、不自动重连；目录变化或断线只更新状态并要求重启；
- SIGINT / SIGTERM / EOF / `/exit` 汇聚到同一停止事件。

## ops 端口

`AuroraRuntime` 实现 `TreeRuntimePort / ConfigRuntimePort / ProcessRuntimePort` 以及
`Agents/Tools/Prompt/Ai/World/Console/Cadence/Memory/Mcp/Utils/ContractsRuntimePort`，在最终 assembly 后注入 `OpsRuntime`。

这里没有通用 Platform 组合：MCP 是一个明确的协议适配包。组合根不接受 PlatformHandle、Manifest、AMP、Task、Activity 或
七类贡献端口，也不向 MCP sampling、elicitation、roots 或 Tasks 提供旁路认知能力。

## CLI

- `aurora start`：本地异步终端或 `--headless`；
- `aurora check / config / about / donk`：按命令模块注册，`main.py` 不分派具体逻辑。
