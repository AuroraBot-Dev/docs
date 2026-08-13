---
order: 13
---

# 运行与操作

AuroraBot 只有一套操作语义：`OperationSpec` 同时生成 Console 斜杠命令与 Panel REST 资源。两种入口共享参数校验、handler 和 `OperationResult`。

## Console

非 `--headless` 且 `runtime.console.enabled = true` 时，本地 Console 自动启动。

- 普通文本进入 `local:console` 会话；
- 以 `/` 开头的文本进入操作路由；
- Bot 文本来自 Engine 的 `output_publications` 输出流；
- EOF、Ctrl+C、Ctrl+D 或 `/quit` 会请求统一停机。

输入 `/help` 会显示运行时自描述的完整操作目录。任意命令可加 `--help` 查看生成的用法。

## 常用命令

### 运行态

| 命令 | 作用 |
| --- | --- |
| `/engine/status` | Engine 运行态快照 |
| `/tasks [--status STATUS] [--limit N]` | Task 列表 |
| `/task TASK_ID` | Task 预算、监督树、waiting_on 与因果摘要 |
| `/agents [--limit N]` | Agent 列表 |
| `/agent AGENT_ID` | Agent 详情 |
| `/events [--session_id ID] [--task_id ID]` | 查询因果事件 |
| `/export SESSION_ID` | 导出会话因果与输出投影 |
| `/pump [MAX_TURNS]` | 显式推进 1–100 个 turn |

nightly 没有旧文档曾使用的 `/status` 别名。请使用 `/engine/status`。

### 模型、记忆与配置

| 命令 | 作用 |
| --- | --- |
| `/cost` | 模型费用分类统计 |
| `/models` | 角色、模型、能力与模态 |
| `/roles` | 模型角色目录 |
| `/memory/status` | 记忆条数与语义降级状态 |
| `/memory/history [--scope ID] [--limit N]` | 窗口、概要和长期事实 |
| `/memory/search --query TEXT [--scope ID]` | 语义优先、关键词降级检索 |
| `/profiles` | Agent profile 目录 |
| `/config` | 脱敏启动配置快照 |
| `/prompt ROLE` | 查看 `soul`、`world` 或 profile Prompt |

### 会话与控制

| 命令 | 作用 |
| --- | --- |
| `/messages [--session_id ID]` | 会话消息投影 |
| `/say TEXT [--session_id ID]` | 显式走对话操作 |
| `/activities [--cursor N]` | 查询用户可见输出流 |
| `/event JSON` | 注入完整 AMP 对象 |
| `/log` | 查看终端日志开关 |
| `/console/log --enabled true|false` | 切换终端日志 |
| `/clear` | 清空终端 |
| `/quit` | 请求进程优雅关闭 |

参数可以写为 `--key value` 或 `--key=value`。JSON 参数需要 shell 兼容引用，例如：

```text
/event '{"header":{"protocol":"amp/1.0",...},"payload":{...}}
```

输出很长时可加 `--short` 得到紧凑 JSON，或用 Python slice 形状截取：

```text
/config --short=0:500
```

## Panel REST

登录后，操作路径位于 `/api/ops`：

```text
OperationSpec: GET /engine/status
HTTP:          GET /api/ops/engine/status

OperationSpec: POST /messages
HTTP:          POST /api/ops/messages
```

固定 envelope：

```json
{
  "ok": true,
  "code": "ok",
  "message": null,
  "data": {}
}
```

业务失败通常仍返回 HTTP 200，并通过 `ok=false` 与 `code` 表达；认证、找不到静态资源、附件过大等 HTTP 边界错误使用相应 HTTP 状态码。

操作目录：

```http
GET /api/ops
Authorization: Bearer <session-token>
```

## 健康检查

唯一公开业务信息的无认证端点：

```http
GET /healthz
```

受认证版本：

```http
GET /api/health
Authorization: Bearer <session-token>
```

## 日志

运行日志固定写入 `logs/aurora.log`。级别来自 `config/logging.toml`。日志不得包含密钥、完整 Prompt、真实对话、continuation 或敏感工具载荷。

常见排查：

```bash
# Linux / macOS
tail -f logs/aurora.log
```

```powershell
# PowerShell
Get-Content logs/aurora.log -Wait
```

MCP 子进程诊断是否打印到终端由 `platform.mcp.terminal_logs` 控制；Console 的运行日志由 `runtime.console.terminal_logs` 控制。

## 停机与恢复

优先使用 `/quit`、SIGINT 或 SIGTERM。组合根会：

1. 设置共享停止信号；
2. 停止 Panel 和 Platform 后台任务；
3. 关闭 MCP 会话与子进程；
4. 关闭 Memory、AI 与 Engine 存储。

下次启动时：

- PROCESSING Agent 消息退回 PENDING；
- 中断的模型 Activity 结束并产生失败消息；
- 已持久化工具 Activity 由 ToolRegistry 恢复派发；
- 重复 AMP 和重复回执由稳定 ID 幂等处理。

::: warning 当前长期运维边界
终态 TTL、显式 WAL checkpoint、统一备份/恢复和清理操作尚在编写中。不要自行修改运行中的 SQLite；长期部署前请阅读[Nightly 实现状态](../reference/nightly-status.md)。
:::
