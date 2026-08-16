---
order: 12
---

# 配置

AuroraBot 在启动时读取一次结构配置，校验后生成不可变 `AuroraConfig` 快照。修改配置需要重启。

## 配置原则

- 结构、启用状态和路径只写 TOML；
- 密钥只来自 TOML 明确点名的环境变量；
- `.env` 只是本地注入密钥的便捷文件，不会被应用自动加载；
- 未知键、缺失键、越界路径、重复 ID 和无效交叉引用会在启动时失败；
- profile 只能覆盖 `runtime.toml`，不能改模型、Agent、App 或存储结构。

## 文件一览

| 文件 | 职责 |
| --- | --- |
| `config/runtime.toml` | profile、Panel 后端、本地 Console |
| `config/profiles/*.toml` | 仅覆盖 runtime 段 |
| `config/engine.toml` | 并发、Triage、自主节律、Task 预算 |
| `config/models.toml` | Provider 与模型角色绑定 |
| `config/platforms.toml` | 默认平台组合 |
| `config/agents.toml` | Agent profile、能力与委派边界 |
| `config/apps.toml` | MCP App 连接和启动描述 |
| `config/prompts.toml` | SOUL、WORLD 与 profile 提示词映射 |
| `config/logging.toml` | 日志级别与目录 |
| `config/storage.toml` | 各包私有数据目录 |

## Profile 选择顺序

优先级从高到低：

1. CLI 全局参数 `aurora --profile NAME ...`；
2. 环境变量 `AURORA_PROFILE`；
3. `runtime.toml` 的 `runtime.profile`。

被选中的 `config/profiles/NAME.toml` 必须存在，且其中 `runtime.profile` 必须与名称一致。

## Runtime、Console 与 Panel

```toml
[runtime]
profile = "prod"

[runtime.panel]
enabled = true
host = "127.0.0.1"
port = 8765
allowed_origins = [
    "http://localhost:8766",
    "http://127.0.0.1:8766",
]
open_browser = false
session_ttl_seconds = 604800
max_upload_bytes = 67108864

[runtime.console]
enabled = true
terminal_logs = false
```

约束：

- Panel 只能绑定 loopback；它不是公网服务边界；
- `allowed_origins` 同时用于 CORS 和 WebSocket Origin 校验；
- `max_upload_bytes = 0` 会禁用附件上传；
- `--headless` 会覆盖 Console 启用状态，但不会改变 Panel 或 Platform；
- `terminal_logs` 控制运行日志是否同时输出到终端，文件日志始终保留。

## Engine

### Agent 与并发

```toml
[engine.agents]
root_profile = "builtin.triage"
worker_profile = "builtin.worker"
max_active_agents = 16
max_agents_per_task = 8
max_depth = 3
max_children_per_agent = 4
turn_concurrency = 8
model_concurrency = 4
tool_concurrency = 8
```

`root_profile` 是每个 Task 的入口 profile，nightly 固定使用 Triage 作为入口。`worker_profile` 是通用委派默认值。其余字段分别限制全局活跃 Agent、单 Task Agent 总数、树深、单 Agent children、turn/模型/工具并发。

### Triage 与会话抢占

```toml
[engine.triage]
model_role = "fast"
quiet_seconds = 3.0
max_wait_seconds = 3.0
defer_seconds = 5.0
max_defer_seconds = 60.0
max_batch_events = 24
max_batch_characters = 12000
max_interrupts = 2
max_generation_seconds = 45.0
```

- quiet window 聚合同一 session 的连续事件，但不超过 max wait；
- 单批次同时受事件数和字符数限制；
- Triage 可以 defer，但累计不能超过上界；
- 直接点名、明确纠正或语境失效可以请求抢占；
- `max_interrupts` 与 `max_generation_seconds` 防止生成反复重启。

### Task 预算

```toml
[engine.interactive_task]
max_model_calls = 8
max_tool_calls = 6
max_duration_seconds = 300.0

[engine.autonomous_task]
max_model_calls = 3
max_tool_calls = 2
max_duration_seconds = 120.0
```

预算是硬边界。超限 Task 进入 `BUDGET_EXHAUSTED`，不会无限继续调用模型或工具。

### 主动节律

```toml
[engine.autonomy]
scan_seconds = 1.0
heartbeat_initial_seconds = 30.0
heartbeat_min_seconds = 30.0
heartbeat_max_seconds = 1800.0
```

`scan_seconds` 是 Engine 空闲扫描间隔。心跳参数只在启用内建 Clock App 时注入该 App。

## 模型 Provider 与角色

Provider 声明连接方式和密钥变量名：

```toml
[models.providers.deepseek]
adapter = "litellm"
secret_env = "DEEPSEEK_API_KEY"

[models.providers.siliconflow]
adapter = "openai_compatible"
base_url = "https://api.siliconflow.cn/v1"
secret_env = "SILICONFLOW_API_KEY"
```

当前支持 `litellm` 与 `openai_compatible`。后者必须提供 `base_url`。

角色把运行时语义映射到具体模型：

```toml
[models.roles.fast]
provider = "deepseek"
model = "deepseek-v4-flash"
capabilities = ["chat", "stream", "json_text_fallback"]

[models.roles.quality]
provider = "deepseek"
model = "deepseek-v4-pro"
capabilities = ["chat", "stream", "json_text_fallback"]

[models.roles.multimodal]
provider = "xiaomi_mimo"
model = "mimo-v2.5-pro"

[models.roles.embedding]
provider = "siliconflow"
model = "BAAI/bge-m3"
```

角色语义：

- `fast`：Triage、低延迟短决策与记忆概要；
- `quality`：Root、Worker、Memory 等复杂工作；
- `multimodal`：多模态 endpoint；附件链路尚未接通；
- `embedding`：长期记忆向量化。

`capabilities` 省略时，网关优先从 models.dev 推导；显式配置会覆盖推导结果。模型查询与响应日志默认关闭，避免敏感信息进入日志。

## Agent profile

```toml
[[agent]]
id = "builtin.worker"
implementation = "src.agents.handler:ToolAgent"
model_role = "quality"
capabilities = ["*", "!aur.serv.memory.remember"]
can_delegate = true
child_profiles = ["builtin.worker"]
```

字段含义：

| 字段 | 含义 |
| --- | --- |
| `id` | 唯一 profile ID，也用于提示词映射 |
| `implementation` | `module:attribute` 形式的 handler 类 |
| `model_role` | 必须引用 `models.toml` 已声明角色 |
| `capabilities` | 精确 ID、`prefix.*`、`*` 与 `!` 排除 |
| `can_delegate` | 是否可以创建 child Agent |
| `child_profiles` | 允许委派的 profile 白名单 |
| `triage_control` | 是否获权执行 process/defer/discard；仅入口 Triage 使用 |

排除规则优先，例如 `["*", "!aur.serv.memory.remember"]` 表示允许所有已发现能力，但拒绝主动写长期记忆。

更多边界见[同构 Agent](../architecture/agent-system.md)。

## MCP App

### 本地 stdio

```toml
[[app]]
package = "com.example.weather"
enabled = true
transport = "stdio"
working_dir = "extensions/apps/weather"
command = ["uv", "run", "--frozen", "weather-mcp"]
env = ["WEATHER_API_KEY"]
timeout_seconds = 30
```

只有 `env` 白名单中的变量会在基础安全环境之上转交子进程。密钥值不写进 TOML。

### 远程 Streamable HTTP

```toml
[[app]]
package = "com.example.remote"
enabled = true
transport = "streamable_http"
url = "https://mcp.example.com/mcp"
auth_env = "REMOTE_MCP_TOKEN"
env = []
timeout_seconds = 30
```

远程 URL 必须使用 HTTPS。若设置 `auth_env`，客户端以 Bearer token 连接。HTTP App 不能声明 `command` 或 `working_dir`。

App 的 MCP tool `lookup` 会成为能力 `aur.mcp.com.example.remote.lookup`。详细开发方式见[MCP App 开发](../develop/app-development.md)。

### 启用 Clock 主动节律

把内建 Clock 条目改成 `enabled = true`：

```toml
[[app]]
package = "org.aurora.clock"
enabled = true
transport = "stdio"
working_dir = "src/apps/aurora-app-clock"
command = ["uv", "run", "--no-sync", "python", "mcp_server.py"]
env = []
timeout_seconds = 30
```

MCP Platform 发现 `start_heartbeat` 后会自动调用它。Clock 把持久化任务写入 `data/platform/mcp/apps/org.aurora.clock/tasks.json`。

## Prompt

`config/prompts.toml` 只保存文件映射：

```toml
[system]
soul = "prompts/SOUL.md"
world = "prompts/WORLD.md"

[agent]
"builtin.root" = "prompts/agents/root.md"
```

Prompt 最多分为三层：

1. 稳定 system：SOUL、WORLD、当前 profile；
2. 可选 memory system：概要、窗口、跨域动态与相关事实；
3. 当前 user：批次、assignment、工具结果或 child report。

Prompt 影响人格和表达，但不是授权边界。增加 profile 时必须同时增加同 ID 的 Prompt 映射。

## Platform 偏好

```toml
[platform.mcp]
enabled = true
terminal_logs = true
```

当前平台注册表只有 `mcp`。Console 与 Panel 不是 Platform。CLI 提供 `--platform` 时会形成精确集合；未提供时才读取这里的偏好。

## 日志与存储

```toml
[logging]
level = "INFO"
log_dir = "logs"
```

```toml
[storage]
data_root = "data"
engine = "engine"
ai = "ai"
memory = "memory"
ops = "ops"

[storage.platform]
data_dir = "platform"

[storage.platform.mcp]
data_dir = "mcp"
apps_dir = "apps"
```

路径必须停留在各自父目录内，包级目录不能非法重叠。`engine.workspace` 必须解析为同一个 `storage.engine`。

## 环境变量清单

| 变量 | 用途 |
| --- | --- |
| `AURORA_PROFILE` | 选择 runtime profile |
| Provider 的 `secret_env` | 模型服务密钥 |
| App 的 `env` | 显式传给 stdio 子进程 |
| HTTP App 的 `auth_env` | 远程 MCP Bearer token |

`AURORA_APP_DATA_DIR` 和 Clock 心跳变量由组合根内部注入，不应作为普通用户配置入口。

## 变更如何生效

配置只在启动时加载一次。修改 TOML、Prompt 或密钥后，使用 `/quit` 优雅停止，再重新运行 `aurora start`。

可在 Console 执行 `/config` 查看脱敏启动快照，使用 `/prompt ROLE` 查看当前加载的 Prompt。
