# MCP App 开发

AuroraBot App 是一个标准 MCP Server。App 负责自己的业务逻辑和外部协议，Platform 负责连接、工具发现、事件归一化和生命周期。

nightly 不扫描 App 目录，也没有私有 manifest。一个 App 是否启用，只由 `config/apps.toml` 决定。

## 当前 App 契约

一个 App 可以：

- 通过 `tools/list` 与 `tools/call` 提供环境能力；
- 通过 MCP notification 上报外部事实；
- 使用本地 stdio 或远程 HTTPS Streamable HTTP；
- 在自己的私有数据目录持久化状态。

当前不会把 MCP Resources 或 Prompts 注入 Agent 上下文。若你的 App 需要向 Agent 提供只读信息，请先暴露无副作用 Tool，或等待相关公共边界完成。

## 最小 stdio App

```python
from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import Context, FastMCP

mcp = FastMCP("Weather")


@mcp.tool("current_weather")
async def current_weather(city: str) -> dict[str, Any]:
    """返回城市当前天气。"""
    return {"city": city, "condition": "rain", "temperature_c": 22}


@mcp.tool("watch_city")
async def watch_city(ctx: Context, city: str) -> dict[str, Any]:
    """订阅城市天气；真实项目应在后台监听供应商事件。"""
    await ctx.session.send_log_message(
        level="info",
        logger="aurora/event",
        data={
            "type": "weather.subscription.started",
            "session_id": f"weather:{city}",
            "summary": f"开始关注 {city} 的天气",
            "data": {"city": city},
            "idempotency_key": f"watch:{city}",
        },
    )
    return {"watching": city}


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

项目结构可以很简单：

```text
extensions/apps/weather/
├─ pyproject.toml
├─ uv.lock
├─ weather_mcp.py
└─ tests/
```

## 在 AuroraBot 中注册

```toml
[[app]]
package = "com.example.weather"
enabled = true
transport = "stdio"
working_dir = "extensions/apps/weather"
command = ["uv", "run", "--frozen", "python", "weather_mcp.py"]
env = ["WEATHER_API_KEY"]
timeout_seconds = 30
```

启动时，raw tool `current_weather` 会变成：

```text
aur.mcp.com.example.weather.current_weather
```

`package` 应是稳定点分名称。Tool name 只写业务动作，不重复 package。

## 授权给 Agent

精确授权：

```toml
capabilities = [
    "aur.mcp.com.example.weather.current_weather",
    "aur.mcp.com.example.weather.watch_city",
]
```

包级授权：

```toml
capabilities = ["aur.mcp.com.example.weather.*"]
```

::: warning 实际前缀
能力 ID 的完整前缀是 `aur.mcp.`。不要照搬旧文档中的 `org.example.tool` 或 App manifest allowlist。
:::

## 事件通知

Aurora 原生事件使用 MCP logging notification：

```python
await ctx.session.send_log_message(
    level="info",
    logger="aurora/event",
    data={
        "type": "weather.changed",
        "session_id": "weather:shanghai",
        "summary": "上海开始下雨",
        "data": {
            "provider_event_id": "evt_123",
            "condition": "rain",
        },
        "idempotency_key": "evt_123",
    },
)
```

字段：

| 字段 | 要求 |
| --- | --- |
| `type` | 非空、稳定、描述事实，不描述处理命令 |
| `session_id` | 稳定会话域，用于防抖、记忆与输出 |
| `summary` | 非空、适合 Triage 的有界说明 |
| `data` | JSON 对象，保存结构事实 |
| `idempotency_key` | 强烈建议；同一供应商事实重发时保持稳定 |

若省略幂等键，Platform 会以整个事件对象的规范 JSON 推导 ID；任何字段变化都会被视为新事实。

普通 MCP notification 也能进入 AuroraBot，但会统一成为 `mcp.notification`，通常不如原生事件语义清晰。

## Tool 设计

### Schema

FastMCP 会生成 `inputSchema`。Platform 要求每个 Tool 有非空 name 和对象 schema。Agent 只看到公开 schema，运行时不会注入隐藏参数。

建议：

- 参数名表达业务意义；
- 对枚举、范围、必填项和危险确认给出约束；
- destructive 操作要求显式 `confirm=true`；
- 不把 session、Task 或内部 request ID 伪装成模型参数；
- 不让 Tool 自己宣布 Aurora Task 完成。

### 结果

优先返回结构化对象。Platform 的成功规范化顺序是 structured content、可解析 JSON 文本、纯文本。

明确失败应由 MCP Server 返回 `isError` 或抛出可识别的 MCP 错误。连接中断等效果未知的情况会变成 `tool.unknown`，不要在 App 外自动重复不可撤回动作。

### 副作用

每个工具调用应：

- 有清楚的真实效果边界；
- 尽可能使用供应商幂等键；
- 不在 stdout 输出日志；
- 不绕过 MCP 直接写 AuroraBot Runtime SQLite；
- 不把密钥、完整请求或敏感响应写入日志。

## 环境与私有数据

stdio App 只得到有限基础环境和 `apps.toml.env` 白名单变量。Platform 还会注入：

```text
AURORA_APP_DATA_DIR=/absolute/path/to/data/platform/mcp/apps
```

App 应在其下建立以 package 命名的私有目录，不要写 `data/engine`、`data/memory` 或 `data/ops`。

## 远程 App

AuroraBot 只接受 HTTPS Streamable HTTP：

```toml
[[app]]
package = "com.example.weather"
enabled = true
transport = "streamable_http"
url = "https://weather.example.com/mcp"
auth_env = "WEATHER_MCP_TOKEN"
env = []
timeout_seconds = 30
```

`auth_env` 会成为 Authorization Bearer token。远程 App 的部署、TLS、租户与服务端鉴权由 App 自己负责。

## 生命周期约束

- stdio stdout 只用于 MCP 协议；
- stderr 可由 Platform 转发为诊断；
- App 连接结束会使 AuroraBot 组合根停止；
- 通知消费者是有界队列；
- 关闭必须响应取消或 SIGTERM；
- 长时间操作应在 Tool timeout 内完成，或设计成“创建工作 + 事件回报”两阶段。

## 测试清单

在独立 MCP 客户端中先验证：

1. initialize 成功；
2. tools/list 的 name、description、schema 正确；
3. tools/call 成功、业务失败和 timeout 都可辨认；
4. stdout 无日志污染；
5. notification 含稳定 session 与幂等键；
6. 重复供应商事件不会产生不同 ID；
7. 断开和 SIGTERM 能有界退出。

再用 AuroraBot 验证：

```bash
uv run --env-file .env aurora start --platform mcp
```

通过 `/profiles`、`/events` 和 Task/Agent 详情确认能力授权、事件摄入与 Tool receipt。

## 尚未定义

::: warning 文档正在编写中
App 脚手架、版本兼容协商、健康检查、自动重连、Resources/Prompts 上下文、签名与市场分发尚未形成稳定公共契约。当前最可靠的交付方式是独立 MCP Server + 显式 TOML。
:::
