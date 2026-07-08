# MCP 模型上下文协议详解与 AuroraBot 落地指南

> 文档日期：2026-06-17  
> 参考规范：Model Context Protocol Specification `2025-11-25`（当前官方 `latest`）  
> 适用范围：协议理解、架构选型、AuroraBot App/Platform 层 MCP 化设计

---

## 目录

1. [MCP 解决什么问题](#1-mcp-解决什么问题)
2. [核心架构：Host / Client / Server](#2-核心架构host--client--server)
3. [协议分层](#3-协议分层)
4. [JSON-RPC 消息模型](#4-json-rpc-消息模型)
5. [连接生命周期](#5-连接生命周期)
6. [传输层：stdio 与 Streamable HTTP](#6-传输层stdio-与-streamable-http)
7. [能力协商](#7-能力协商)
8. [Server Features：Tools / Resources / Prompts](#8-server-featurestools--resources--prompts)
9. [Client Features：Roots / Sampling / Elicitation](#9-client-featuresroots--sampling--elicitation)
10. [通知、进度、取消与错误处理](#10-通知进度取消与错误处理)
11. [安全模型与工程约束](#11-安全模型与工程约束)
12. [MCP 与 function calling 的关系](#12-mcp-与-function-calling-的关系)
13. [AuroraBot 的 MCP 化边界](#13-aurorabot-的-mcp-化边界)
14. [AuroraBot 目标架构](#14-aurorabot-目标架构)
15. [AuroraBot App MCP Server 设计规范](#15-aurorabot-app-mcp-server-设计规范)
16. [AMP：Platform 侧 MCP 兼容 envelope](#16-ampplatform-侧-mcp-兼容-envelope)
17. [迁移建议](#17-迁移建议)
18. [实现检查清单](#18-实现检查清单)
19. [参考资料](#19-参考资料)

---

## 1. MCP 解决什么问题

MCP（Model Context Protocol，模型上下文协议）是一个用于连接 LLM 应用与外部系统的开放协议。它的目标不是定义模型本身，也不是替代业务 API，而是标准化下面三类交互：

- **给模型提供上下文**：文件、数据库 schema、业务对象、知识库条目等。
- **让模型调用能力**：查询天气、发送消息、写入日记、调用内部系统 API 等。
- **暴露可复用工作流**：提示词模板、结构化对话流程、用户可选择的命令入口等。

在没有 MCP 之前，常见集成方式是每个 AI 应用为每个外部系统写一套适配器。假设有 `N` 个 AI 客户端和 `M` 个业务系统，就容易形成 `N x M` 的重复集成。MCP 把接口统一成一套 client-server 协议，让业务系统只需要实现 MCP Server，AI 应用只需要实现 MCP Client。

在 AuroraBot 中，MCP 的价值主要体现在：

- 用 `tools/list` 和 `tools/call` 替代自定义 `CommandSpec` 注册与派发。
- 用标准 JSON Schema 描述工具入参和结构化出参。
- 用标准 MCP 能力接入外部生态，由 Platform 把 notifications、lifecycle、tool result、resource observation 等信号归一化为 Brain 事件。
- 让 App 从同进程插件变成可独立运行、可独立重启、可独立测试的服务进程。
- 消除 “LLM 输出文本 JSON -> 解析 -> 派发命令” 的脆弱链路。

MCP 不适合替代 AuroraBot 的 Brain 内部认知管线。Brain 的核心价值是 FileEventBus、文件驱动中间状态、异步图计算和可追溯调试；这类内部认知流不应该被同步 RPC 语义重写。

## 2. 核心架构：Host / Client / Server

MCP 使用 Host / Client / Server 三层结构。

```text
┌──────────────────────────────────────────────┐
│ Host：AI 应用外壳                            │
│ - 管理用户界面、权限、LLM、上下文聚合         │
│ - 为每个 MCP Server 创建一个 MCP Client       │
│                                              │
│  ┌────────────────┐    ┌────────────────┐    │
│  │ MCP Client A   │    │ MCP Client B   │    │
│  │ 1:1 连接 Server │    │ 1:1 连接 Server │    │
│  └───────┬────────┘    └───────┬────────┘    │
└──────────┼─────────────────────┼─────────────┘
           │ JSON-RPC             │ JSON-RPC
           ▼                      ▼
┌──────────────────┐     ┌──────────────────┐
│ MCP Server A      │     │ MCP Server B      │
│ Tools/Resources   │     │ Tools/Prompts     │
└──────────────────┘     └──────────────────┘
```

三者职责如下：

| 角色 | 职责 | AuroraBot 映射 |
|------|------|----------------|
| Host | 管理 LLM、用户授权、多个 Client、上下文聚合、安全边界 | AuroraBot 主进程 / Brain 外围运行时 |
| Client | 与单个 Server 建立 1:1 有状态会话，处理协议协商、请求、响应、通知 | `MCPClientManager` 中的单 server connection |
| Server | 提供工具、资源、提示词等能力，可本地进程或远程服务 | `apps/aurora-app-*` 改造后的 MCP Server |

一个 Host 可以连接多个 Server，但每个 Client 只连接一个 Server。这个隔离性很重要：Server 不应该看见完整对话历史，也不应该直接看见其他 Server 的数据。跨 Server 的上下文聚合、权限判断和调用编排应由 Host 负责。

## 3. 协议分层

MCP 可以拆成以下层次理解：

| 层 | 内容 | 是否必需 |
|----|------|----------|
| Base Protocol | JSON-RPC 2.0 请求、响应、通知格式 | 必需 |
| Lifecycle | 初始化、版本协商、能力协商、运行、关闭 | 必需 |
| Transports | `stdio`、Streamable HTTP、自定义传输 | 至少一种 |
| Server Features | `tools`、`resources`、`prompts` | 按需 |
| Client Features | `roots`、`sampling`、`elicitation` | 按需 |
| Utilities | ping、logging、pagination、completion、progress、cancellation | 按需 |
| Authorization | HTTP transport 的认证授权框架 | HTTP 场景按需 |

实现 MCP 时不要把所有功能一次性做完。协议本身允许渐进式能力协商。对 AuroraBot 来说，第一阶段建议只实现：

- `stdio` transport
- lifecycle
- `tools/list`
- `tools/call`
- notification handler
- 基础超时、取消、重连

`resources`、`prompts`、`roots`、`sampling`、`elicitation` 可以等基础链路稳定后再引入。

## 4. JSON-RPC 消息模型

MCP 使用 JSON-RPC 2.0 编码消息。消息必须是 UTF-8。核心消息类型有三种。

### 4.1 Request

Request 表示一次需要响应的操作。

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "cursor": "optional-cursor"
  }
}
```

约束：

- `id` 必须是字符串或整数。
- `id` 不能是 `null`。
- 同一会话内，请求方不能重复使用已经发出的 request id。
- `method` 是操作名，例如 `initialize`、`tools/list`、`tools/call`。
- `params` 可选，但应是对象。

### 4.2 Response

成功响应：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": []
  }
}
```

错误响应：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "field": "arguments.city"
    }
  }
}
```

约束：

- 响应必须带回对应 request 的同一个 `id`。
- 成功响应使用 `result`。
- 失败响应使用 `error.code` 和 `error.message`。
- 协议错误应使用 JSON-RPC 错误；业务失败通常放在工具调用结果里表达。

### 4.3 Notification

Notification 是单向消息，不允许接收方返回 response。

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/tools/list_changed"
}
```

约束：

- notification 不能包含 `id`。
- notification 可以由 Client 发给 Server，也可以由 Server 发给 Client。
- AuroraBot 的 AMP 事件上报就是建立在 MCP notification 之上的应用层约定。

## 5. 连接生命周期

MCP 连接是有状态会话。生命周期分为三段：

1. **Initialization**：版本协商、能力协商、交换实现信息。
2. **Operation**：按协商出的能力进行正常通信。
3. **Shutdown**：通过底层 transport 关闭连接。

### 5.1 初始化请求

Client 必须先发 `initialize`。

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "roots": {
        "listChanged": true
      },
      "sampling": {}
    },
    "clientInfo": {
      "name": "AuroraBot",
      "title": "AuroraBot MCP Client",
      "version": "0.1.0"
    }
  }
}
```

Server 返回自己的协议版本、能力和实现信息。

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "tools": {
        "listChanged": true
      },
      "logging": {}
    },
    "serverInfo": {
      "name": "im.polaris.weather",
      "title": "Aurora Weather App",
      "version": "0.2.0"
    },
    "instructions": "Provides weather query tools for AuroraBot."
  }
}
```

初始化成功后，Client 发送 `notifications/initialized`：

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}
```

### 5.2 版本协商

Client 在 `initialize` 中发送自己支持的协议版本，通常应发送它支持的最新版本。Server 如果支持该版本，应返回同一版本；否则返回它支持的另一个版本。Client 如果不支持 Server 返回的版本，应断开连接。

如果使用 HTTP transport，后续 HTTP 请求还应携带：

```http
MCP-Protocol-Version: 2025-11-25
```

### 5.3 运行阶段

运行阶段双方必须遵守两条规则：

- 只使用已经协商成功的协议版本。
- 只使用对方声明支持的能力。

例如，Server 没有声明 `tools`，Client 就不应调用 `tools/list` 或 `tools/call`。Client 没有声明 `sampling`，Server 就不应请求 `sampling/createMessage`。

### 5.4 关闭阶段

MCP 不定义专门的 shutdown request。关闭通过底层 transport 表达：

- `stdio`：Client 关闭 Server 子进程 stdin，等待退出，必要时终止进程。
- HTTP：关闭相关 HTTP 连接；如果有 session，可以按规范使用 session 删除流程。

AuroraBot 的 `MCPServerKit` 应负责进程退出、超时、强制终止和日志收集；`MCPClientManager` 应负责连接状态、请求取消和重连。

## 6. 传输层：stdio 与 Streamable HTTP

MCP 标准定义两种主要 transport：

- `stdio`
- Streamable HTTP

也允许自定义 transport，只要保留 JSON-RPC 消息格式和生命周期要求。

### 6.1 stdio

`stdio` 模式中，Client 启动 Server 子进程：

```text
Client process
  ├─ writes JSON-RPC lines to server stdin
  ├─ reads JSON-RPC lines from server stdout
  └─ may read logs from server stderr

Server process
  ├─ reads stdin
  ├─ writes valid MCP messages to stdout
  └─ writes logs to stderr
```

约束：

- 每条 MCP 消息以换行分隔。
- 单条 JSON-RPC 消息内部不能包含未转义的真实换行作为消息分隔。
- Server 的 stdout 只能输出合法 MCP 消息。
- 日志必须写 stderr，不能污染 stdout。
- Client 不应把 stderr 输出直接视为协议错误。

AuroraBot 初始迁移建议优先使用 `stdio`：

- App 都在本机，进程边界足够。
- 不需要引入 HTTP server、端口管理和认证。
- 延迟低，便于 `asyncio.create_subprocess_exec` 管理生命周期。
- 崩溃隔离好，单个 App 挂掉不拖垮主进程。

### 6.2 Streamable HTTP

Streamable HTTP 中，Server 是可独立连接的 HTTP 服务，提供单一 MCP endpoint，例如：

```text
https://example.com/mcp
```

Client 通过 HTTP POST 发送 JSON-RPC request / response / notification。Server 可以返回单个 JSON 响应，也可以返回 SSE stream，用于流式结果、服务端请求或通知。Client 也可以通过 HTTP GET 打开 SSE stream，接收 Server 主动发来的消息。

关键点：

- Client POST 时应声明支持 `application/json` 和 `text/event-stream`。
- Server 可以用 SSE 发送多个 JSON-RPC 消息。
- HTTP transport 可以有 `MCP-Session-Id`。
- 支持基于 SSE event id 和 `Last-Event-ID` 的断线恢复。
- 使用 HTTP 时应按规范处理认证授权。

本地 HTTP MCP Server 有额外安全要求：

- 校验 `Origin`，防 DNS rebinding。
- 本地服务默认只绑定 `127.0.0.1`。
- 需要认证的场景必须做认证。

AuroraBot 中 `aurora-app-qq` 可能是一个例外：如果 NoneBot/OneBot 的运行模型与 stdio 子进程不兼容，可以延长旧兼容层，或单独评估 Streamable HTTP。

## 7. 能力协商

能力协商是 MCP 的核心机制。Client 和 Server 都会在初始化阶段声明自己支持什么，后续只能使用协商成功的能力。

### 7.1 Server 能力

常见 Server capabilities：

| Capability | 含义 |
|------------|------|
| `tools` | 暴露可调用工具 |
| `resources` | 暴露可读取资源 |
| `prompts` | 暴露提示词模板 |
| `logging` | 向 Client 输出结构化日志 |
| `completions` | 支持参数自动补全 |
| `tasks` | 支持任务增强执行 |
| `experimental` | 非标准实验能力 |

示例：

```json
{
  "capabilities": {
    "tools": {
      "listChanged": true
    },
    "resources": {
      "subscribe": true,
      "listChanged": true
    },
    "logging": {}
  }
}
```

### 7.2 Client 能力

常见 Client capabilities：

| Capability | 含义 |
|------------|------|
| `roots` | Client 可向 Server 暴露文件系统边界 |
| `sampling` | Server 可请求 Client 代发 LLM 调用 |
| `elicitation` | Server 可请求 Client 向用户补充信息 |
| `tasks` | 支持任务增强客户端请求 |
| `experimental` | 非标准实验能力 |

AuroraBot 初期建议：

- 默认不暴露 `roots`，除非某个 App 明确需要读项目文件。
- 默认不开放 `sampling`，避免 App 反向触发 LLM 递归调用。
- 默认不开放 `elicitation`，先通过 Brain 的现有对话机制处理追问。
- 优先把 App 能力收敛为 `tools` 和 notification。

## 8. Server Features：Tools / Resources / Prompts

MCP Server 可以向 Client 提供三类核心能力：Tools、Resources、Prompts。它们的控制主体不同：

| Feature | 主要控制者 | 用途 | AuroraBot 建议 |
|---------|------------|------|----------------|
| Tools | 模型控制 / Host 授权 | 执行动作、调用 API、查询系统 | 第一优先级 |
| Resources | 应用控制 / 用户选择 | 提供上下文数据 | 第二阶段引入 |
| Prompts | 用户控制 | 暴露可复用提示词模板 | 可选 |

### 8.1 Tools

Tools 是 MCP 中最接近 AuroraBot `CommandSpec` 的概念。一个 Tool 由名称、描述、入参 schema、可选出参 schema 等组成。

#### 8.1.1 声明 tools 能力

```json
{
  "capabilities": {
    "tools": {
      "listChanged": true
    }
  }
}
```

`listChanged: true` 表示 Server 的工具列表变化时会发送：

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/tools/list_changed"
}
```

#### 8.1.2 工具发现：tools/list

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "cursor": "optional-cursor"
  }
}
```

返回：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "im.polaris.weather.get_weather",
        "title": "Weather Query",
        "description": "Query current weather and forecast for a city.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "city": {
              "type": "string",
              "description": "City name."
            },
            "days": {
              "type": "integer",
              "minimum": 1,
              "maximum": 7,
              "default": 1
            }
          },
          "required": ["city"],
          "additionalProperties": false
        },
        "outputSchema": {
          "type": "object",
          "properties": {
            "ok": { "type": "boolean" },
            "report": { "type": "string" }
          },
          "required": ["ok", "report"],
          "additionalProperties": true
        }
      }
    ]
  }
}
```

工具命名建议：

- 使用点分命名：`im.polaris.weather.get_weather`。
- 避免空格、逗号和特殊字符。
- 同一 Server 内名称必须唯一。
- 跨 Server 聚合后也应避免冲突，因此 AuroraBot 推荐完整包名前缀。

#### 8.1.3 工具调用：tools/call

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "im.polaris.weather.get_weather",
    "arguments": {
      "city": "上海",
      "days": 3
    }
  }
}
```

返回：

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"ok\":true,\"report\":\"上海未来 3 天天气...\"}"
      }
    ],
    "structuredContent": {
      "ok": true,
      "report": "上海未来 3 天天气..."
    },
    "isError": false
  }
}
```

建议：

- 对机器可读结果使用 `structuredContent`。
- 为兼容旧客户端，同时在 `content` 里返回文本摘要或 JSON 字符串。
- 如果声明了 `outputSchema`，Server 必须让 `structuredContent` 符合 schema。
- 输入校验失败、业务失败可用 `isError: true` 表示。
- 协议层错误才返回 JSON-RPC error，例如未知工具、请求格式非法、内部异常。

#### 8.1.4 Tool 错误分类

| 错误类型 | 表达方式 | 示例 |
|----------|----------|------|
| 协议错误 | JSON-RPC `error` | `tools/call` 缺少 `name`、未知 method |
| 工具不存在 | JSON-RPC `error` | `name` 不存在 |
| 参数格式错误 | 通常 JSON-RPC `error` 或 `isError`，需统一 | `days` 不是整数 |
| 业务失败 | Tool result + `isError: true` | 天气服务超时、城市不存在 |
| 部分成功 | Tool result + structuredContent | 批量发送部分失败 |

AuroraBot 建议：参数 schema 级别错误返回 JSON-RPC `-32602`；业务错误返回 `isError: true`，并在 `structuredContent` 中提供 `ok: false`、`error_code`、`message`。

### 8.2 Resources

Resources 用于让 Server 暴露可读取上下文，例如文件、数据库 schema、配置片段、日记索引、可公开状态等。每个 Resource 用 URI 唯一标识。

#### 8.2.1 声明 resources 能力

```json
{
  "capabilities": {
    "resources": {
      "subscribe": true,
      "listChanged": true
    }
  }
}
```

- `listChanged`：资源列表变化时通知 Client。
- `subscribe`：Client 可以订阅某个资源变化。

#### 8.2.2 资源发现：resources/list

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/list"
}
```

返回：

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "resources": [
      {
        "uri": "aurora://diary/index",
        "name": "diary-index",
        "title": "Diary Index",
        "description": "Searchable index of recent diary entries.",
        "mimeType": "application/json"
      }
    ]
  }
}
```

#### 8.2.3 资源读取：resources/read

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "resources/read",
  "params": {
    "uri": "aurora://diary/index"
  }
}
```

返回：

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "contents": [
      {
        "uri": "aurora://diary/index",
        "mimeType": "application/json",
        "text": "{\"entries\":[]}"
      }
    ]
  }
}
```

AuroraBot 中 Resources 适合用于：

- App 暴露只读状态，例如 clock 的活动 timer 列表。
- App 暴露可供模型参考的业务数据，例如 diary 的索引或摘要。
- App 返回 tool result 时附带 `resource_link`，让 Client 按需读取大块内容。

不建议把 Brain 内部 `data/kernel/`、`data/memory/` 原样暴露为 Resources。Brain 内部状态应继续由 FileEventBus 和 UnifiedMemoryManager 管理。

### 8.3 Prompts

Prompts 用于 Server 暴露提示词模板。它偏向用户主动选择，而不是模型自主调用。

#### 8.3.1 声明 prompts 能力

```json
{
  "capabilities": {
    "prompts": {
      "listChanged": true
    }
  }
}
```

#### 8.3.2 提示词发现：prompts/list

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "prompts/list"
}
```

返回：

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "prompts": [
      {
        "name": "weather_summary",
        "title": "Weather Summary",
        "description": "Generate a user-facing weather summary.",
        "arguments": [
          {
            "name": "city",
            "description": "City name.",
            "required": true
          }
        ]
      }
    ]
  }
}
```

#### 8.3.3 获取提示词：prompts/get

```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "prompts/get",
  "params": {
    "name": "weather_summary",
    "arguments": {
      "city": "上海"
    }
  }
}
```

返回：

```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "description": "Weather summary prompt.",
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "请用简洁自然的中文总结上海天气。"
        }
      }
    ]
  }
}
```

AuroraBot 当前已有 `src/brain/prompts/` 管理核心认知提示词。App 侧 Prompts 只应用于 App 自己的辅助工作流，不应覆盖 Internalizer、Externalizer、SOUL 等核心提示词。

## 9. Client Features：Roots / Sampling / Elicitation

Client Features 是 Client 提供给 Server 使用的能力。它们比 Server Features 更敏感，因为它们可能让 Server 访问本地边界、间接触发 LLM、或向用户索要信息。

### 9.1 Roots

Roots 表示 Client 允许 Server 看到或操作的文件系统边界。Server 可以请求：

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "roots/list"
}
```

返回：

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "roots": [
      {
        "uri": "file:///E:/AuroraBot",
        "name": "AuroraBot"
      }
    ]
  }
}
```

安全要求：

- Client 只暴露明确授权的目录。
- Server 必须尊重 root 边界。
- 路径解析必须防止 path traversal。
- 不要把 `.env`、token、密钥、聊天隐私数据默认暴露给 App Server。

AuroraBot 初期不建议默认启用 Roots。App 如果需要读写数据，应通过自己的配置目录、业务 API 或明确的 Tool 参数完成。

### 9.2 Sampling

Sampling 允许 Server 请求 Client 代为调用 LLM。这样 Server 不需要持有模型 API key，但可以实现嵌套智能行为。

风险：

- 可能形成 App -> LLM -> Tool -> App 的递归调用。
- Server 可能借 Sampling 获取本不该看到的上下文。
- 用户很难理解一次工具调用背后又触发了多少模型调用。

AuroraBot 初期应禁用 Sampling。原因是 AuroraBot 的 LLM 调度权应集中在 Brain，App 只提供外部能力，不应主动驱动认知过程。

### 9.3 Elicitation

Elicitation 允许 Server 请求 Client 向用户补充信息，分为：

- Form mode：请求结构化表单数据。
- URL mode：引导用户去外部 URL 完成敏感交互。

安全要求：

- Form mode 不得索要密码、API key、access token、支付凭据等敏感信息。
- 敏感交互必须走 URL mode，并清晰展示目标域名。
- 用户必须能审阅、拒绝或取消。

AuroraBot 初期不建议开放 Elicitation。App 缺参数时应返回结构化错误，由 Brain 决定是否追问用户。

## 10. 通知、进度、取消与错误处理

### 10.1 通知

通知适合表达无需响应的事件，例如：

- `notifications/initialized`
- `notifications/tools/list_changed`
- `notifications/resources/list_changed`
- `notifications/prompts/list_changed`
- AuroraBot 自定义 `aurora/event`

通知不带 `id`，接收方不能返回 response。因此如果业务上需要确认送达，应在应用层定义 ack notification 或改用 request/response。

### 10.2 进度

长耗时请求可以通过 progress notification 表达进展。Client 收到进度后可以刷新 UI，也可以选择重置普通超时计时。但实现仍应设置最大超时，避免对端持续发送进度导致请求永不结束。

AuroraBot 中耗时工具建议：

- 给每个 `tools/call` 设置默认超时。
- 对天气、网络、LLM 外部依赖设置更短业务超时。
- 后续如引入长任务，再使用 progress 或 tasks。

### 10.3 取消

请求超时、用户中止、系统关机时，发送方应发 cancellation notification，然后停止等待结果。取消是协作式的：接收方应尽力停止工作，但不能假设一定成功。

AuroraBot 中：

- shutdown 时取消所有 inflight request。
- Server 重启前取消对该 Server 的所有请求。
- LLM 本轮决策结束后，废弃过期工具调用结果。

### 10.4 错误处理

实现应覆盖：

- 协议版本不兼容。
- 必需能力协商失败。
- JSON-RPC 格式错误。
- 请求超时。
- Server 子进程退出。
- Server stdout 输出非法 JSON。
- HTTP session 过期。
- 工具业务失败。

建议统一错误结构：

```json
{
  "ok": false,
  "error_code": "WEATHER_PROVIDER_TIMEOUT",
  "message": "Weather provider timed out.",
  "retryable": true
}
```

## 11. 安全模型与工程约束

MCP 的安全边界不能只靠协议本身。Host、Client、Server 都必须承担约束。

### 11.1 基本原则

- 用户应知道哪些 Server 暴露给模型。
- 高风险工具调用前应有确认或策略授权。
- Server 的 tool description、annotations、resource content 都应视为不可信输入。
- Host 不应把完整对话、全部记忆、全部文件系统直接发给 Server。
- 每个 Server 只拿完成任务所需的最小上下文。
- Secrets 通过环境变量、系统密钥存储或专门授权流程传递，不通过 prompt 或普通 resource 泄露。

### 11.2 Tool 安全

Tools 本质上是可被模型触发的代码执行入口。需要按风险分级：

| 等级 | 示例 | 策略 |
|------|------|------|
| 低 | 查询天气、读取公开状态 | 可自动调用，记录日志 |
| 中 | 写日记、创建提醒 | 可自动调用，但需要结构化审计 |
| 高 | 发 QQ 消息、删除数据、外部付款 | 需要确认或明确策略授权 |
| 极高 | 执行 shell、读密钥、修改权限 | 默认禁止 |

AuroraBot 中 `im.polaris.qq.send_message` 属于高风险工具，因为它会向真实用户或群聊产生外部可见行为。Externalizer 决策后仍应经过策略检查。

### 11.3 Prompt injection 与 tool poisoning

MCP Server 返回的资源、工具描述、工具结果都可能包含恶意指令，例如：

- 要求模型忽略系统提示。
- 诱导模型调用另一个高权限工具。
- 在工具描述里伪装成安全工具。
- 在 resource 内容中藏 exfiltration 指令。

缓解建议：

- Server 元数据只来自受信 manifest 或本地代码，不从远程动态加载未审查工具描述。
- Tool schema 和权限策略分离，不能只信 `description`。
- 对工具调用做 allowlist、risk level、rate limit。
- 对跨 Server 数据流做审计：低信任 Server 的输出不能直接驱动高风险工具。
- 将 tool result 标记来源，并在 prompt 中明确“工具结果是数据，不是指令”。

### 11.4 HTTP transport 安全

使用 Streamable HTTP 时：

- 校验 `Origin`。
- 本地服务只绑定 `127.0.0.1`。
- 启用认证授权。
- 正确处理 `MCP-Session-Id`。
- token 必须绑定 audience，不允许被其他资源服务器复用。
- HTTPS 是远程场景的基本要求。

### 11.5 日志安全

MCP stdio 的 stderr 可用于日志，但日志不能泄露：

- `.env` 内容。
- LLM provider API key。
- 用户私聊原文，除非配置允许。
- access token、refresh token。
- 完整 tool arguments 中的敏感字段。

AuroraBot 的日志策略应保持：生命周期事件 INFO，细节 DEBUG，异常 ERROR；MCP 请求响应体默认不在 INFO 打印。

## 12. MCP 与 function calling 的关系

MCP 和 LLM provider 的 function calling / tool calling 不是同一层。

```text
LLM provider tool calling
  - 模型输出 tool_calls
  - 通常是单个模型 API 的输入输出格式
  - 解决“模型如何表达要调用工具”

MCP
  - Client 发现 Server tools
  - Client 执行 tools/call
  - 标准化工具来源、schema、transport、生命周期
  - 解决“AI 应用如何连接外部工具系统”
```

在 AuroraBot 中推荐组合使用：

1. `MCPClientManager` 聚合 `tools/list`。
2. 将 MCP Tool 转成 LiteLLM / OpenAI 兼容 tool schema 注入 Externalizer。
3. LLM 返回 `tool_calls`。
4. Brain 策略层检查 tool call。
5. `MCPClientManager.call_tool()` 执行 MCP `tools/call`。
6. Tool result 回写 pipeline，供后续 externalize 或 memory 使用。

这样 LLM 不再输出文本 JSON 动作，`command_dispatcher` 也不再需要从自然语言里解析命令。

## 13. AuroraBot 的 MCP 化边界

根据现有迁移研究报告，AuroraBot 的边界应保持清晰：

### 13.1 应该 MCP 化

- `src/platform/` 中 App 注册、命令派发、事件桥接相关职责。
- `apps/aurora-app-*` 的外部能力。
- `CommandSpec` 到 MCP Tool 的转换。
- App/Server 到 Brain 的事件入口由 Platform 归一化生成 AMP envelope；第三方 MCP Server 不需要实现 AMP。
- App 生命周期管理，改为独立 Server 进程管理。

### 13.2 不应该 MCP 化

- `FileEventBus`
- `Circuit`
- `Node` / `Agent` / `Router`
- `Internalizer`
- `Externalizer`
- `HeartbeatGenerator`
- `UnifiedMemoryManager`
- `topology.yaml` 表达的认知图本身

原因：

- Brain 的核心是异步文件驱动图，不是同步 request/response 服务。
- Internalizer / Externalizer 是认知转换器，不是外部工具。
- HeartbeatGenerator 是自持节律，不是被调用的能力。
- MemoryManager 是内部状态系统，不能作为普通外部资源裸暴露。

## 14. AuroraBot 目标架构

```text
┌────────────────────────────────────────────────────────────┐
│ AuroraBot 主进程                                           │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Brain Kernel                                         │  │
│  │ - FileEventBus                                       │  │
│  │ - Cognitive Pipeline                                 │  │
│  │ - Memory System                                      │  │
│  └───────────────▲─────────────────────────┬────────────┘  │
│                  │ 文件事件                 │ tool_calls    │
│                  │                         ▼              │
│  ┌───────────────┴─────────────────────────────────────┐   │
│  │ Platform MCP Kit                                     │   │
│  │ - MCPServerKit: spawn / stop / restart / health      │   │
│  │ - MCPClientManager: initialize / list / call          │   │
│  │ - AMPCompatibilityBridge: MCP signals -> inbox file   │   │
│  │ - AMP normalizer / validator                         │   │
│  └───────┬───────────────┬───────────────┬──────────────┘   │
└──────────┼───────────────┼───────────────┼──────────────────┘
           │ stdio          │ stdio          │ stdio
           ▼                ▼                ▼
┌──────────────────┐ ┌────────────────┐ ┌────────────────┐
│ QQ MCP Server     │ │ Weather Server │ │ Diary Server   │
│ tools + events    │ │ tools          │ │ tools/resources│
└──────────────────┘ └────────────────┘ └────────────────┘
```

新模块建议：

```text
src/platform/mcp_kit/
├── __init__.py
├── server_kit.py       # Server 进程生命周期
├── client.py           # MCP Client Manager
├── protocol.py         # AMP envelope、校验、常量
├── discovery.py        # manifest + mcp 配置发现
├── manifest.py         # MCP app manifest 解析
└── errors.py           # 平台层错误类型
```

App 新结构：

```text
apps/aurora-app-weather/
├── __init__.py
├── manifest.yaml
├── mcp_server.py
├── service.py
├── runtime.py              # 迁移期兼容层，可后续删除
├── config.example.json
├── README.md
└── LICENSE
```

## 15. AuroraBot App MCP Server 设计规范

### 15.1 manifest.yaml

建议扩展现有 manifest：

```yaml
package: im.polaris.weather
name: 天气应用
version: 0.2.0
type: mcp-server

mcp:
  transport: stdio
  entry: mcp_server.py
  command: ["uv", "run", "python"]
  args: ["apps/aurora-app-weather/mcp_server.py"]
  env:
    AURORA_APP_CONFIG: "apps/aurora-app-weather/config.json"
  health_timeout: 10
  restart:
    enabled: true
    max_attempts: 3
    backoff_seconds: 2

commands:
  - name: get_weather
    description: 查询指定城市天气
```

`commands` 在 MCP 化后不再是运行时唯一真相，运行时工具列表以 `tools/list` 为准。但保留 `commands` 有三个价值：

- 静态文档。
- 向后兼容旧 ApplicationHost。
- CI 可比对 manifest 与 MCP `tools/list` 是否一致。

### 15.2 工具命名

统一格式：

```text
{package}.{verb_object}
```

示例：

```text
im.polaris.weather.get_weather
im.polaris.clock.create_timer
im.polaris.clock.cancel_timer
im.polaris.diary.write_entry
im.polaris.qq.send_message
```

命名规则：

- 只使用 ASCII 字母、数字、下划线、短横线、点。
- 不使用空格。
- 不使用中文工具名；中文放 `title` 和 `description`。
- 不把版本号写进工具名，版本由 manifest 和 Server info 表达。

### 15.3 Tool schema

每个工具必须提供：

- `name`
- `description`
- `inputSchema`

建议提供：

- `title`
- `outputSchema`
- 结构化 `structuredContent`

无参数工具使用：

```json
{
  "type": "object",
  "additionalProperties": false
}
```

不要使用 `inputSchema: null`。

### 15.4 Tool result

统一成功结果：

```json
{
  "content": [
    {
      "type": "text",
      "text": "天气查询完成。"
    }
  ],
  "structuredContent": {
    "ok": true,
    "data": {
      "city": "上海",
      "report": "..."
    }
  },
  "isError": false
}
```

统一业务失败结果：

```json
{
  "content": [
    {
      "type": "text",
      "text": "天气服务暂时不可用。"
    }
  ],
  "structuredContent": {
    "ok": false,
    "error_code": "WEATHER_PROVIDER_TIMEOUT",
    "message": "Weather provider timed out.",
    "retryable": true
  },
  "isError": true
}
```

### 15.5 App 业务逻辑拆分

`mcp_server.py` 只处理协议适配：

- 初始化 MCP Server。
- 注册 tools。
- 参数校验。
- 调用 service。
- 将 service 返回值转换为 MCP result。
- 发 notification。

`service.py` 承载纯业务逻辑：

- 天气 API 调用。
- QQ 消息发送。
- 日记读写。
- 闹钟调度。

这样可以让旧 `runtime.py` 和新 `mcp_server.py` 在迁移期共用同一套业务代码。

### 15.6 stdout / stderr 约束

所有使用 stdio transport 的 MCP Server 必须遵守：

- stdout 只写 MCP JSON-RPC 消息。
- 日志写 stderr。
- 不使用 `print()` 输出调试信息到 stdout。
- Python logging handler 必须指向 stderr 或文件。
- 启动 banner、调试文本、第三方库输出都不能污染 stdout。

这条约束应加入 App 开发规范和测试。

## 16. AMP：Platform 侧 MCP 兼容 envelope

AMP（Aurora Message Protocol）不是要求所有 MCP Server 实现的私有协议。它是 AuroraBot Platform 内部的统一事件 envelope，用来把 MCP 生态中的多种标准信号归一化成 Brain 可消费的文件事件。

这一定义保证 AuroraBot 可以直接接入现有 MCP 生态：

- 第三方 MCP Server 只需要遵守 MCP 标准，不需要知道 AMP。
- Platform 从 `tools/list`、`tools/call`、resources、prompts、notifications、lifecycle、transport error 等信号生成 AMP。
- Aurora 原生 App 可以选择发送 `aurora/event` notification，作为业务事件快捷路径。
- Brain 只消费 AMP 文件事件，不直接感知底层 Server 是第三方 MCP 还是 Aurora 原生 App。

### 16.1 MCP 信号映射

| 来源信号 | AMP payload.type 示例 | 说明 |
| --- | --- | --- |
| initialize 成功 | `lifecycle.started` | Server 接入成功 |
| transport 断开 / 进程退出 | `lifecycle.stopped` / `lifecycle.crashed` | 连接状态变化 |
| `notifications/tools/list_changed` | `capability.changed` | 工具目录变化 |
| `notifications/resources/list_changed` | `capability.changed` | 资源目录变化 |
| `notifications/prompts/list_changed` | `capability.changed` | Prompt 目录变化 |
| `tools/call` result | `tool.completed` / `tool.failed` | 工具调用审计 |
| `resources/read` result | `resource.observed` | 资源快照，按需进入 Brain |
| 任意第三方 notification | `mcp.notification.<method>` | 保守映射；可由 adapter 覆盖 |
| 可选 `aurora/event` | App 声明的业务类型 | Aurora 原生 App 快捷路径 |

命令调用不使用 notification 表达，应优先走标准 `tools/call`。

### 16.2 Envelope

```json
{
  "header": {
    "protocol": "amp/1.0",
    "method": "mcp.notification",
    "message_id": "018f2f4c-7b2a-7b8a-9c31-2e9a0b9b2d11",
    "timestamp": "2026-06-17T14:30:00+08:00",
    "source": {
      "app": "im.polaris.qq",
      "instance": "qq-server-01"
    }
  },
  "payload": {
    "type": "message.received",
    "session_id": "group_123456",
    "summary": "群聊收到一条新消息",
    "data": {
      "user_id": "987654",
      "group_id": "123456",
      "message_text": "今天天气怎么样",
      "is_group": true
    },
    "expire_at": "2026-06-17T14:35:00+08:00"
  }
}
```

字段规则：

| 字段 | 必填 | 说明 |
|------|------|------|
| `header.protocol` | 是 | 固定 `amp/1.0` |
| `header.method` | 是 | 原始信号类别，如 `mcp.notification`、`mcp.tool_result`、`mcp.lifecycle`、`aurora/event` |
| `header.message_id` | 是 | 全局唯一，用于去重和追溯 |
| `header.timestamp` | 是 | ISO 8601，必须带时区 |
| `header.source.app` | 是 | MCP Server package 或连接名 |
| `header.source.instance` | 否 | 多实例标识 |
| `payload.type` | 是 | 点分事件类型 |
| `payload.session_id` | 否 | 会话标识 |
| `payload.summary` | 否 | 人类可读摘要 |
| `payload.data` | 否 | 类型相关数据 |
| `payload.expire_at` | 否 | 过期时间 |

### 16.3 事件类型

建议初始事件类型：

```text
message.received
message.reaction
session.created
session.closed
alarm.triggered
timer.triggered
diary.written
diary.queried
lifecycle.started
lifecycle.stopping
lifecycle.crashed
capability.changed
tool.completed
tool.failed
resource.observed
mcp.error
```

### 16.4 EventBridge 行为

AMP Compatibility Bridge 接收 Platform 可观测到的 MCP 信号后，不直接调用 Brain 内部对象，而是写入 FileEventBus inbox：

```text
MCP signals
  -> AMP normalize / validate
  -> deduplicate by message_id
  -> write data/kernel/inbox/pending/event_{type}_{message_id}.json
  -> existing FileEventBus pipeline continues
```

这样可以保持 Brain 的文件驱动特性，同时用 MCP 替代旧 `ApplicationHost.drain_events()`。没有 `aurora/event` 的第三方 MCP Server 仍然可以作为 App 被接入；它只是没有主动业务事件快捷通道。

## 17. 迁移建议

### Phase 1：协议基础设施

- 引入 MCP Python SDK。
- 新增 `src/platform/mcp_kit/`。
- 实现 `MCPServerKit`：启动、停止、重启、健康检查、stderr 日志采集。
- 实现 `MCPClientManager`：初始化、能力协商、`tools/list` 缓存、`tools/call`、notification 分发。
- 实现 AMP envelope dataclass、normalizer 和 validator。
- 增加最小集成测试：启动一个不含 AMP 逻辑的 fake MCP Server，完成 initialize/list/call，并验证 Platform 能生成 lifecycle/tool result 类 AMP 事件。

### Phase 2：App 双入口

- 每个 App 抽出 `service.py`。
- 保留旧 `runtime.py`。
- 新增 `mcp_server.py`。
- `manifest.yaml` 增加 `type: mcp-server` 和 `mcp:`。
- CI 对比旧 commands 与 MCP tools。

### Phase 3：Brain 外围适配

- Externalizer 改为使用 LLM 原生 tool calls。
- `MCPClientManager` 把 MCP Tool 转换为 LiteLLM/OpenAI tool schema。
- tool call 经过策略检查后执行 `tools/call`。
- EventBridge 改为接收 Platform 侧 AMP queue。
- `command_dispatcher` 逐步下线。

### Phase 4：清理

- 删除旧 `ApplicationHost` 的命令派发职责。
- 删除 `PlatformAPI` 反向引用。
- 删除 App `runtime.py` 兼容层。
- 删除文本 JSON 动作解析 fallback。
- 更新 `topology.yaml`。
- 更新测试和文档。

## 18. 实现检查清单

### 18.1 MCP Client Manager

- [ ] 每个 Server 一个隔离 session。
- [ ] initialize 后发送 `notifications/initialized`。
- [ ] 校验 Server 返回 protocol version。
- [ ] 只调用已声明 capability。
- [ ] `tools/list` 支持分页。
- [ ] `tools/list_changed` 后刷新缓存。
- [ ] 所有 request 有超时。
- [ ] shutdown 时取消 inflight requests。
- [ ] 子进程退出时标记连接不可用。
- [ ] stdout 非法 JSON 有明确错误日志。
- [ ] stderr 日志不污染协议解析。

### 18.2 MCP Server Kit

- [ ] 从 manifest 读取 mcp 配置。
- [ ] 使用 `asyncio.create_subprocess_exec` 启动。
- [ ] stdout / stderr 分流。
- [ ] 支持健康检查。
- [ ] 支持自动重启和 backoff。
- [ ] shutdown 先关 stdin，再等待，再 terminate。
- [ ] 启动失败不影响其他 App。
- [ ] 进程状态可观测。

### 18.3 App MCP Server

- [ ] stdout 只输出 MCP 消息。
- [ ] 工具名使用完整 package 前缀。
- [ ] 每个工具有 `inputSchema`。
- [ ] 高价值工具有 `outputSchema`。
- [ ] 参数校验错误结构统一。
- [ ] 业务错误使用 `isError: true`。
- [ ] 不在 tool description 中写策略绕过提示。
- [ ] 不把 secret 打进日志。
- [ ] 如果 Server 主动上报业务事件，notification payload 有稳定 schema，Platform 能映射为 AMP。

### 18.4 安全策略

- [ ] 工具有风险等级。
- [ ] 高风险工具需要确认或策略授权。
- [ ] tool result 作为数据处理，不作为指令处理。
- [ ] Server 不默认获得完整对话。
- [ ] Server 不默认获得 Brain memory。
- [ ] 禁止默认 roots。
- [ ] 禁止默认 sampling。
- [ ] 禁止默认 elicitation。

## 19. 参考资料

- Model Context Protocol 官方介绍：<https://modelcontextprotocol.io/docs/getting-started/intro>
- MCP Specification `2025-11-25`：<https://modelcontextprotocol.io/specification/2025-11-25>
- MCP Architecture：<https://modelcontextprotocol.io/specification/2025-11-25/architecture>
- MCP Base Protocol：<https://modelcontextprotocol.io/specification/2025-11-25/basic>
- MCP Lifecycle：<https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle>
- MCP Transports：<https://modelcontextprotocol.io/specification/2025-11-25/basic/transports>
- MCP Tools：<https://modelcontextprotocol.io/specification/2025-11-25/server/tools>
- MCP Resources：<https://modelcontextprotocol.io/specification/2025-11-25/server/resources>
- MCP Prompts：<https://modelcontextprotocol.io/specification/2025-11-25/server/prompts>
- MCP Roots：<https://modelcontextprotocol.io/specification/2025-11-25/client/roots>
- MCP Sampling：<https://modelcontextprotocol.io/specification/2025-11-25/client/sampling>
- MCP Elicitation：<https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation>
- MCP Authorization：<https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization>
- AuroraBot MCP 迁移研究报告：[app-platform-mcp-migration.md](reports/app-platform-mcp-migration.md)
