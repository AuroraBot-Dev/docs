---
order: 12
---

# src/mcp

MCP Python SDK 2.x 的客户端协议适配包。它把 Server Tool 转换为 Aurora Tool，把经协商的 Server 业务事件转换为
EnvironmentEvent；不拥有 AgentTree，不建立 Task、AMP、Activity、Platform 或第二套运行循环。

## 协议与传输

- 依赖 `mcp>=2,<3`，使用 SDK v2 自动协商；优先使用 `2026-07-28`，由同一 SDK 兼容旧修订；
- ops 必须显示每个 App 的实际 negotiated version，不允许 TOML 选择 SDK v1 或伪装版本；
- 支持 stdio 与 HTTPS Streamable HTTP，不新建旧 HTTP+SSE 连接；
- stdio 只继承安全基础环境、受控临时目录、App 数据目录和 `apps.toml` 显式白名单变量；stdout 只承载 MCP，stderr 进入日志；
- 远程 URL 与每一跳重定向都必须保持 HTTPS；降级到 HTTP 时在发送后续请求前失败，Bearer 凭据不得跨授权 origin 转发；
- `org.aurorabot/tool-contract` 与 `org.aurorabot/world-events` 都只在 Client / Server capability settings 严格等于
  `{"version": 1}` 时协商成功，不接受额外字段、字符串版本或仅一方声明。

## 启动发现与冻结

每个 enabled App 依次完成连接、协议协商和完整分页 `tools/list`；这整个启动事务共用 `timeout_seconds` 截止时间。
目录监听在首次分页前建立，并且同一 notification 只进入一个接收路径。启动窗口若收到目录变化，本次分页作废；只能在剩余
截止时间内重新完整分页或失败，不能冻结已知过期快照。raw name 与 package 直接组成
`aur.mcp.<package>.<raw_name>`；空名称、非法小写 Tool ID、非 object input schema、重复 ID 或任一 App 启动失败都会使
整体启动失败，并逆序回收已经建立的连接和子进程。

全部 App 发现成功后，MCP Tool 快照才交给 `src/tools`，与 builtin 和调用方注入 Tool 一次性合并为不可变 ToolRegistry；
随后才校验 AgentDefinition 的精确 Tool 引用并允许 engine 接受 AgentTree。

运行中没有 reload、hot replace 或 auto reconnect：

- `tools/list_changed` 只记录 `mcp.catalog.changed` 并把 `restart_required` 置为 true；
- 断线只更新 App 可用性，不改变冻结 definition，也不自动重连；
- 断线前可能已送达的调用返回 unknown，可确定未执行的调用返回 failed；二者都不自动重试；
- 只有进程重启才能重新发现并形成新的 ToolRegistry。

## Tool 映射

每个发现项生成一个实现统一 `Tool` 契约的适配器。模型 call 由领域 Tool ID 唯一路由回 package/raw name，再执行 MCP
`tools/call`。

默认 observe / publish 都是 `aurora:mcp:<package>`。双方协商 `org.aurorabot/tool-contract` v1 后，Tool
`_meta["org.aurorabot/tool-contract"]` 可分别提供 `observe` / `publish` 非空 scope 模板列表；字段省略时保留 App scope
默认值。模板仅支持 `{name}` 形式的 object input schema 顶层 property，不支持嵌套路径、下标、默认值或转换函数。发现时验证
元数据、占位符和固定 scope；调用前只用本次顶层文本/整数 argument 解析并验证最终 scope。缺失或非标量参数、非法结果 scope
都在远端调用前 failed。解析结果通过普通 `ScopedTool` 参与 engine 的 world delta 检查。

结果映射为：

| MCP 结果 | ToolOutput status |
| --- | --- |
| 成功，存在 `structuredContent` 或文本 content | `succeeded` |
| 明确参数/方法拒绝，或 Server 确认可确定效果未执行/已回滚 | `failed` |
| 请求可能送达后的超时、断线或效果不确定 | `unknown` |

协商 v1 的 Server 以
`CallToolResult._meta["org.aurorabot/tool-contract"] = {"status": "unknown"}` 明确内部超时或下游断线等不确定结果；
该元数据优先于 `isError`，Host 必须原样保留 unknown。协商 v1 后，未带 unknown 元数据的 `isError` 表示 Server 确认没有
不确定副作用。Host 在请求可能送达后遇到的无法分类协议错误也返回 unknown；只有发送前校验和明确拒绝返回 failed。

成功结果优先确定性序列化 `structuredContent`，否则合并文本 content block。当前 transcript 只承载文本；图像、音频、
embedded resource、resource link 与其他非文本结果必须明确返回不支持错误，不能静默丢弃或写入原始二进制。

ToolOutput 仍由 engine 记录 `tool.succeeded / failed / unknown` 并形成同一 call id 的 tool 消息。MCP 不写异步回执，
不经 AMP 或 Activity 恢复 Tool call。

## 事件映射

MCP 持有同一个 WorldJournal 的 `WorldWriter` 窄视角。生命周期与目录状态写入：

- `mcp.app.starting / ready / failed / disconnected`；
- `mcp.catalog.frozen / changed`；
- scope 为 `aurora:mcp:<package>`。

业务事件优先使用协商后的版本化扩展 `org.aurorabot/world-events`，通知 method 固定为
`notifications/org.aurorabot/world-events/event`。扩展必须在 App 配置中显式启用；Host 在握手完成且验证双方严格
`{"version": 1}` 前不得将通知写入 World。载荷映射为
`EnvironmentEvent(event_id, source, scope, kind, occurred_at, summary, data)`，再以 `mcp.event.received` 追加到载荷声明的
业务 scope，并可附加 App scope。source 固定为 `mcp:<package>`。

为迁移旧 Server，单个 App 可以显式启用受限的
`notifications/message + logger=aurora/event` 转换；它使用同一载荷校验和 WorldWriter 边界。普通未协商 vendor notification
不自动成为业务事实。适配器拒绝无稳定 event id、非法 scope/kind，以及伪造 `engine.*`、`tool.*`、`output.*`、
`cadence.*`、`ops.*` 的载荷。

MCP 事件只进入 WorldJournal，不直接追加节点 transcript、完成 Tool call 或启动 AgentTree。engine 只按 frontier 披露事件，
主动唤起仍由 cadence 决定；发现 App 也不会隐式启动 heartbeat。

当前 Streamable HTTP 客户端不提供自定义长期 Server→Client 事件订阅，因此配置不得组合该 transport 与 `world_events`。
通知只有 best-effort 语义，没有 Aurora 级 ACK、重放或送达证明；event id 只保证 Host 实际收到后的幂等提交。Server 与 ops 可以
报告发送尝试或已提交事实，不能声称通知已送达。断线丢失不建立恢复队列。

## 配置与组合

`apps.toml` 解析为不可变 App DTO：

- stdio：`package / enabled / transport / working_dir / command / env / timeout_seconds / event_mode`；
- Streamable HTTP：`package / enabled / transport / url / auth_env / timeout_seconds / event_mode`；
- package 全局唯一；两个 transport 的互斥字段在启动效果前校验。

既有个人配置省略 `event_mode` 时按 `disabled` 读取；`world_events` 与 `legacy_aurora_event` 始终要求显式配置。

`platforms.toml` 只保存 MCP 总开关和终端诊断偏好，不产生通用 Platform。组合根在 WorldJournal 初始化后启动 MCP，取得冻结
Tool 快照，再进入 tools/engine 的同步组合阶段。

## 世界访问权

只持有 `WorldWriter`。MCP Tool 的 tree 因果由 engine 写入，MCP 包只写连接、目录与外部事件事实。

## ops 入口

- `GET /mcp`、`/mcp`：全部 App 状态、冻结目录摘要与全局 `restart_required`；
- `GET /mcp/{package}`、`/mcp-app`：单个 App 的配置摘要、连接状态、negotiated version、工具 ID、最后错误；
- 无写入口；未装配端口返回 `NOT_AVAILABLE`。

## 明确不支持

- reload、运行期 ToolRegistry 替换、自动重连与跨重连效果幂等；
- Resources、Prompts、MCP Apps UI 与非文本结果注入；
- sampling、elicitation、roots、`input_required` 与 `io.modelcontextprotocol/tasks`；
- SDK 私有通知 hook、手写 stdio JSON-RPC 转发、旧 HTTP+SSE；
- `src/platform`、PlatformHandle、Manifest、Lifecycle、AMP、Task、Activity 与七端口贡献模型。
