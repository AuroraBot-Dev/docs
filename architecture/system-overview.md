---
order: 1
---

# 系统总览

```text
config.example/（源码模板） ──复制──→ config/（个人配置，Git 忽略）
                                      │
                          TOML + prompts/**/*.md
                                      │  configuration/<同名>.py 显式注册
                                      ▼
                               AuroraConfig（只读纯配置）
                                      │
                                      └─→ 配置统一终端 + logs/aurora.log 轮转日志

异步启动边界：
  WorldJournal.initialize()
    → MCP SDK 2.x 连接、自动协议协商
    → 在单一启动截止时间内建立唯一目录监听、完整分页 tools/list
    → 冻结 MCP Tool 快照

同步 composition（world 单例与已冻结 MCP Tool 作为输入）：
  world → memory → cadence → agents → ai → prompt → console → tools → engine
                                                                  │
                      builtin + 外部注入 + MCP Tool ──────────────┘

最终启动校验：
  ToolRegistry 冻结 → AgentDefinition 精确 Tool ID 引用校验 → engine 可接受 AgentTree

普通终端输入（不特化，先入世界线）：
  TerminalConsole ──WorldWriter.append_commit──→ WorldJournal
        │  console.input / aurora:console
        ▼
  TerminalDispatcher → OpsRuntime.route_text 或 POST /trees

斜杠命令与 JSON 输出：
  /<command> ──→ OperationRouter ──→ ops/operations/<pkg>.py
                                          │ OperationResult.success(data)
                                          ▼
                                  终端以 JSON 渲染 data

AgentTree 热路径：
  AgentTreeRunner.run(tree)
    ├─ 记录 engine.tree.started / model.* / tool.* / node.* / output.* / tree.completed
    ├─ Memory.recall() → MemorySnapshot → PromptAssembler 注入 system
    ├─ 检查 WorldJournal 未披露 delta → 先交付，再执行已封口的 Tool batch
    ├─ PromptAssembler 只组装四角色上下文
    ├─ LiteLLMModelGateway.complete(ModelRequest)
    └─ ToolRegistry.execute(ToolCall)
           ├─ ToolOutput(succeeded / failed / unknown) → 配对 tool 消息
           └─ DelegationRequest → child AgentNode

MCP 外部事实：
  双方严格协商 v1 的 stdio world-events / 受限 legacy event
    → src/mcp 校验 EnvironmentEvent
    → WorldWriter.append_event
    → WorldJournal（不直接写 transcript，不直接启动 AgentTree）

MCP Tool 因果：
  默认 App scope / 协商 tool-contract v1 的顶层参数 scope 模板
    → ScopedTool.resolve_scopes → engine frontier 屏障
    → tools/call → succeeded / failed / result _meta unknown
    → 同一 ToolOutput 与世界因果路径（不建立异步回执或第二套运行循环）

运行诊断（不进入 World / transcript）：
  aurora / engine / ai / tools / world / mcp / cadence / memory / console / ops
    → src.utils.logging 非传播 logger
    → INFO 生命周期、WARNING 已处理降级、ERROR 当前操作失败、DEBUG ID/计数/阶段
    → 终端 + 有界轮转文件；不记录消息、Prompt、Tool 参数/结果、模型载荷、密钥或世界 data
```

## 包边界一句话

- `src/contracts`：全部公共值对象与端口，含世界线端口和稳定 scope/kind 常量；
- `src/world`：WorldJournal 的唯一持久化实现，组合时第一个构造；
- `src/agents`：不可变 `AgentDefinition` 目录与唯一解析；
- `src/tools`：全项目工具汇总处：注册表 + 框架内建工具；
- `src/prompt`：四角色 `PromptAssembler`，保持纯函数；
- `src/ai`：LiteLLM 模型网关与 Provider 协议映射，不持有 world；
- `src/console`：本地异步终端，输入事件先入世界线，输出不入；
- `src/engine`：确定性 AgentTree 执行器，通过 WorldJournal 记录全部运行因果；
- `src/memory`：最近一小时活跃 scope 的最近 50 条提交记忆，经 prompt 注入 system；
- `src/cadence`：每小时提交 tick，每 5 个非 engine 世界提交唤起一棵 triage AgentTree；
- `src/mcp`：SDK 2.x 协议协商、stdio/HTTPS 连接、完整 Tool 发现、Tool 执行与外部事件写入；
- `ops`：热路径外的统一操作目录，为每个包提供 method/path 与斜杠入口；
- `aurora`：唯一组合根、配置加载、runtime 门面与 CLI。

## 世界访问权

| 包 | 世界角色 | 端口 |
| --- | --- | --- |
| `src/console` | 事件生产者 | `WorldWriter` |
| `src/mcp` | 外部事件生产者 | `WorldWriter` |
| `src/cadence` | 节律生产者 + 状态读者 | `WorldReader` + `WorldWriter` |
| `src/prompt` | 不持有；只渲染显式 MemorySnapshot | 无 |
| `src/memory` | 只读消费者 | `WorldReader` |
| `src/engine` | 因果记录者 + delta 读者 | `WorldJournal` |
| `src/ai` | 不持有 | 无 |
| 未来 `src/sandbox` | 不持有 | 无 |

## 依赖方向

```text
contracts ← agents / prompt / tools / ai / world / memory / cadence / mcp
agents/contracts ← tools ← engine ← aurora
console ← aurora；ops ← aurora
```

`src` 不导入 `aurora` 或 `ops`；`ops` 不导入 `src` 或 `aurora`；`src/world` 只被
`aurora.composition.world` 引用。`src/mcp` 只依赖 contracts、MCP SDK 与 HTTP 客户端，不导入 tools、engine，
也不恢复 `src/platform`、AMP、Task、Activity 或七端口扩展体系。
