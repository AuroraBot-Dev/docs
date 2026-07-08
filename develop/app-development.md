---
title: App 开发指南
description: 基于 MCP Server 的 AuroraBot App 开发方式。
order: 2
---

# App 开发指南

App 是 AuroraBot 的感知与执行模块。重构完成后，一个 App 就是一个 MCP Server。

App 不负责推理，不维护人格，不跨 App 编排。它只做三件事：

1. 把外部变化暴露为标准 MCP 信号；Aurora 原生 App 可以选择发送业务 notification。
2. 通过 MCP Tools 暴露可执行动作。
3. 通过 MCP Resources 暴露必要的只读状态。

## 位置无关原则

AuroraBot 主仓库不规定 App 必须放在哪里，也不要求 App 使用主仓库的 Python 包结构。

Platform 只需要知道两类信息：

| 信息 | 作用 |
| --- | --- |
| MCP 连接信息 | 如何连接这个 Server，例如 `stdio` 命令、HTTP endpoint、环境变量 |
| 外围元信息 | package、显示名、版本、描述、权限、风险等级、默认启用状态 |

因此 App 可以位于：

- 主仓库 `apps/` 目录内，适合内置样例或开发联调。
- 独立 Git 仓库，适合第三方 App。
- 用户本机任意目录，通过 `stdio.command` 启动。
- 远程服务，通过 Streamable HTTP endpoint 连接。
- 受限情况下的 in-process adapter，但对 Brain/Platform 暴露的仍应是 MCP 语义。

主仓库只通过统一协议和外围信息与 App 通信，不 import App 的业务模块，不约束 App 的内部目录。

## 本地样例结构

```text
apps/aurora-app-example/
  __init__.py
  manifest.yaml
  mcp_server.py
  service.py
  config.example.json
  README.md
```

上面只是推荐的本地开发样例，不是协议要求。独立仓库或远程 Server 可以使用任何内部结构，只要能提供 MCP Server 入口。

| 文件 | 职责 |
| --- | --- |
| `manifest.yaml` | 本地样例的外围元信息；远程 App 可由 registry 或 `apps/config.yml` 提供等价信息 |
| `mcp_server.py` | MCP Server 入口，注册 tools/resources/notifications |
| `service.py` | 纯业务逻辑，不 import Platform 或 Brain |
| `config.example.json` | App 私有配置示例 |
| `README.md` | 能力边界、配置说明、风险说明 |

## 外围元信息

本地 App 可以用 `manifest.yaml` 声明外围元信息：

```yaml
package: im.polaris.example
name: 示例应用
version: 1.0.0
brain_version: ">=0.4.0"
type: mcp-server
app_desc: >-
  描述这个 App 提供什么外部感知或执行能力。

mcp:
  transport: stdio
  entry: mcp_server.py
  command: ["uv", "run", "python", "-m", "apps.aurora-app-example.mcp_server"]

tools:
  - name: do_something
    description: 执行一个原子动作
```

`tools` 字段只用于人类阅读和静态检查；真实工具目录来自 MCP `tools/list`。

远程 App 或第三方 App 不一定要把 manifest 放进主仓库。只要 `apps/config.yml`、App registry 或其他发现机制能向 Platform 提供等价元信息即可。

## 连接配置

`apps/config.yml` 是主仓库连接 App 的入口，而不是 App 位置规范。

本地 stdio App：

```yaml
apps:
  example-local:
    enabled: true
    package: im.polaris.example
    mcp:
      transport: stdio
      command:
        - uv
        - run
        - --project
        - D:/third-party/aurora-example-app
        - python
        - -m
        - aurora_example.mcp_server
      env: {}
```

远程 HTTP App：

```yaml
apps:
  example-remote:
    enabled: true
    package: im.polaris.example
    mcp:
      transport: streamable-http
      endpoint: https://example.com/mcp
      headers:
        Authorization: Bearer ${EXAMPLE_APP_TOKEN}
```

Platform 通过这些连接信息建立 MCP session，再用 `tools/list`、`resources/list` 和 notifications 了解 App 能力。

## service.py

业务逻辑必须能脱离 MCP 独立测试。

```python
from __future__ import annotations


class ExampleService:
    async def do_something(self, text: str) -> dict[str, object]:
        return {
            "ok": True,
            "text": text,
        }
```

规则：

- 不 import `src.platform`。
- 不 import `src.brain`。
- 不直接读写 Brain 的 `data/kernel/` 或 `data/memory/`。
- App 私有状态放在自己的数据目录或外部服务中。
- 异常返回结构化错误，不让 MCP Server 进程退出。

## mcp_server.py

推荐使用官方 Python SDK 的 FastMCP。

```python
from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from .service import ExampleService

mcp = FastMCP("aurora-example", json_response=True)
service = ExampleService()


@mcp.tool(name="do_something")
async def do_something(text: str) -> dict[str, object]:
    """执行一个原子动作。"""
    return await service.do_something(text=text)


@mcp.resource("example://status")
async def status() -> str:
    return "ok"


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

stdio 约束：

- stdout 只能输出 MCP 消息。
- 日志写 stderr 或项目日志文件。
- tool 返回值必须 JSON 可序列化。

## 事件上报

第三方 MCP Server 不需要实现 AMP。只要它是标准 MCP Server，Platform 就能通过 tools/resources/prompts/notifications/lifecycle/error 等信号把它纳入 AuroraBot 的统一事件认知。

如果 App 是 Aurora 原生事件源，推荐发送 `aurora/event` notification，让 Platform 更精确地理解业务语义。这个 notification 的 payload 可以只包含业务字段，Platform 会补齐 AMP header。

事件类型建议使用点分隔：

- `message.received`
- `alarm.triggered`
- `timer.triggered`
- `weather.reported`
- `diary.written`
- `lifecycle.started`
- `lifecycle.crashed`

事件 payload 应该包含足够上下文，但不要塞入 App 的全部私有状态。

```json
{
  "method": "aurora/event",
  "params": {
    "type": "message.received",
    "session_id": "group_123456",
    "summary": "收到一条消息",
    "data": {
      "text": "你好"
    }
  }
}
```

对普通 MCP Server：

- `notifications/tools/list_changed` 会被 Platform 转成 `capability.changed`。
- tool 调用成功或失败会被 Platform 转成 `tool.completed` / `tool.failed`。
- 自定义 notification 会被 Platform 按 method 和 params 映射为 `mcp.notification.*`，也可以通过 adapter 配置映射为业务事件。

## 工具设计准则

好的 Tool 应满足：

- 原子：一次调用只做一件明确的事。
- 可审计：参数和返回值能解释发生了什么。
- 可组合：复杂行为留给 Brain 编排。
- 可失败：失败时返回结构化错误，而不是假装成功。
- 有边界：不要暴露读取全盘文件、执行任意命令等危险能力。

## App 不该做什么

- 不要判断“该不该回复用户”。
- 不要在 App 内写复杂对话策略。
- 不要读取 Brain 的人格提示词或记忆数据库。
- 不要把 MCP Tool 描述写成诱导模型越权的提示词。
- 不要用 notification 表达有副作用的命令；有副作用必须走 Tool。

## 开发流程

1. 写 `service.py`，先让业务逻辑可单测。
2. 写 `mcp_server.py`，暴露最小 tools。
3. 准备外围元信息：本地样例可写 `manifest.yaml`，第三方/远程 App 可由 registry 或连接配置提供。
4. 在 `apps/config.yml` 添加连接配置，而不是把代码搬进主仓库。
5. 用 MCP Inspector 或测试 Client 验证 `tools/list` 和 `tools/call`。
6. 再接入 AuroraBot Platform。

## 自检清单

- package 是否全局唯一。
- App 是否能在主仓库外独立运行。
- tools 是否都有清晰描述和类型标注。
- stdout 是否没有普通日志。
- App 是否没有 import Brain。
- Tool 是否返回结构化成功/失败结果。
- 如果需要主动上报业务事件，notification payload 是否有稳定 schema，Platform 是否能映射为 AMP。
- 私有数据是否没有越过 Platform 直接进入 Brain。

## 继续阅读

- 平台如何连接 App：[平台运行时](../architecture/platform-runtime.html)
- MCP 协议背景：[MCP 模型上下文协议](../appendix/mcp-model-context-protocol.html)
- Brain 设计边界：[Brain 架构重设计](../architecture/brain-redesign.html)
