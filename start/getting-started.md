---
order: 11
---

# 快速开始

本页从一个干净目录启动 `nightly@97a5bdb`。当前推荐源码运行。

## 环境要求

| 依赖 | 要求 |
| --- | --- |
| Python | `>=3.12, <3.15`；推荐 3.12 |
| Git | 能克隆 GitHub 仓库 |
| uv | Python 包与虚拟环境管理 |
| 模型凭据 | 默认配置需要 `DEEPSEEK_API_KEY` |

Web 管理面板还需要 Node.js 22.18+ 或 24.12+ 与 pnpm 11+，但它不是启动核心运行时的前置条件。

## 1. 克隆 nightly

```bash
git clone --branch nightly --single-branch https://github.com/AuroraBot-Dev/AuroraBot.git
cd AuroraBot
```

确认当前版本：

```bash
git branch --show-current
git describe --tags --always
```

第一条应输出 `nightly`。本文对齐的描述为 `v0.5.0-alpha.5-10-g97a5bdb`；分支继续前进后提交号可能不同。

## 2. 安装依赖

```bash
uv sync --no-dev
```

需要运行测试或参与开发时，改用：

```bash
uv sync
```

## 3. 配置密钥

::: code-group

```bash [Linux / macOS]
cp .env.example .env
```

```powershell [PowerShell]
Copy-Item .env.example .env
```

:::

编辑 `.env`：

```dotenv
DEEPSEEK_API_KEY=你的密钥
```

`.env` 不会被 AuroraBot 自动读取，后面的启动命令会显式使用 `uv --env-file`。结构配置必须写在 `config/*.toml`，不要放进 `.env`。

## 4. 处理默认 Aurora-QQ 条目

当前 nightly 的 `config/apps.toml` 默认启用了仓库外的 Aurora-QQ 扩展。这是已登记的 0.5 alpha 交付缺口；干净克隆若没有该扩展，MCP 启动会失败。

首次体验时，请把对应条目改成：

```toml
[[app]]
package = "org.aurora.qq"
enabled = false
```

若你确实要接入 QQ，请先安装 Aurora-QQ 和 NapCat，再保留 `enabled = true`。详见[常见问题：如何接入 QQ](../reference/faq.md#如何接入-qq)。

## 5. 启动

```bash
uv run --no-dev --env-file .env aurora start
```

默认组合会：

- 启动 Engine 与后台 pump；
- 按 `config/platforms.toml` 启动 MCP Platform；
- 启动本地 Console；
- 在 `127.0.0.1:8765` 启动 Panel 后端；
- 把运行日志写入 `logs/aurora.log`。

看到以下提示后，可直接输入普通文本：

```text
AuroraBot local console; 输入 /help 查看命令。
You>
```

输入 `/help` 查看当前操作目录；输入 `/quit` 请求优雅停机。不要使用旧文档中的 `/status`，nightly 没有该别名；运行态查询是 `/engine/status`。

## 6. 验证后端

另开终端：

```bash
curl http://127.0.0.1:8765/healthz
```

预期返回：

```json
{"ok":true,"status":"ok","profile":"prod"}
```

完整 Panel 接入见 [Web 管理面板](./panel.md)。

## 常用启动方式

```bash
# 使用 runtime.toml 的默认 profile 和 platforms.toml 的平台偏好
uv run --no-dev --env-file .env aurora start

# 选择 dev runtime profile
uv run --no-dev --env-file .env aurora --profile dev start

# 不启动本地 Console；Panel 与平台组合保持不变
uv run --no-dev --env-file .env aurora start --headless

# 精确选择 MCP 平台；不会与默认集合叠加
uv run --no-dev --env-file .env aurora start --platform mcp

# 从其他工作目录指定项目根
uv run --no-dev --env-file /path/to/AuroraBot/.env aurora --root /path/to/AuroraBot start
```

::: warning `--headless` 的含义
`--headless` 只禁用本地 Console。它不会禁用 MCP，也不会关闭 Panel。要禁用 MCP，请修改 `config/platforms.toml`；要关闭 Panel，请修改 `config/runtime.toml`。
:::

## 首次启动失败

### 缺少模型凭据

检查 `config/models.toml` 中角色使用的 Provider，以及对应 `secret_env` 是否存在于当前进程。默认 Fast 与 Quality 都使用 `DEEPSEEK_API_KEY`。

### MCP 工作目录或命令失败

先关闭 `config/apps.toml` 中未安装的 App。当前启动前诊断尚未完全闭环，一些错误会在创建 MCP 子进程时才出现。

### 端口 8765 被占用

修改 `config/runtime.toml` 的 `runtime.panel.port`，并同步更新 Panel 前端代理或 API 地址。

### 语义记忆降级

这不一定阻止启动。Embedding、mem0 或 Chroma 不可用时，记忆会降级到 durable facts 的确定性关键词检索；可通过 `/memory/status` 查看状态。

下一步阅读[配置](./configuration.md)和[运行与操作](./operations.md)。
