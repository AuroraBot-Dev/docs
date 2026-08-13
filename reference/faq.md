---
order: 11
---

# 常见问题

## 应该使用哪个分支？

本网站对齐 `nightly`。克隆时显式选择：

```bash
git clone --branch nightly --single-branch https://github.com/AuroraBot-Dev/AuroraBot.git
```

`main` 与 nightly 的架构和配置可能不同，不要混用命令或数据目录。

## 支持哪些 Python 和操作系统？

主项目声明 Python `>=3.12,<3.15`，推荐 3.12。代码包含 Windows 与 POSIX 的信号、路径和子进程处理，但 0.5 alpha 尚未给出所有系统/版本组合的稳定交付矩阵。

遇到平台差异时优先使用 Python 3.12、最新 uv 和本地 loopback 部署，并运行 `uv run aurora check`。

## 为什么干净克隆后 MCP 启动失败？

当前 `config/apps.toml` 默认启用了仓库外 `org.aurora.qq`。如果 `extensions/apps/Aurora-QQ` 不存在，把该条目的 `enabled` 改为 `false`。

这是 nightly 已登记的交付缺口，不是 uv 安装失败。

## 如何接入 QQ？

当前路径是独立 [Aurora-QQ MCP Server](https://github.com/Churk-Ben/Aurora-QQ) + NapCat OneBot 11 正向 WebSocket。

大致步骤：

1. 安装并登录 NapCat；
2. 只在本机开启正向 WebSocket并设置 token；
3. 克隆 Aurora-QQ 到 `extensions/apps/Aurora-QQ`；
4. 按扩展 README 创建 `config.toml` 并 `uv sync --frozen`；
5. 在 AuroraBot `.env` 提供 `AURORA_QQ_TOKEN`；
6. 保持 `config/apps.toml` 的 QQ 条目 enabled；
7. 启动 MCP Platform。

AuroraBot 核心不内置 OneBot、NoneBot2 或 NapCat 适配器。QQ 只是一个 MCP App，事件以 `qq:*` session 进入同一 Engine。

## 能否同时接入多个 IM？

架构允许。每个 IM 实现为独立 MCP App，使用唯一 package、稳定 session ID 与幂等键。Engine 不需要为每个平台增加特殊分支。

但 nightly 只随配置展示 Aurora-QQ 路径；其他 IM 的现成 App、版本兼容和部署文档正在编写中。

## `--headless` 会关闭哪些东西？

只关闭本地 Console。它不会关闭：

- Panel 后端；
- MCP Platform；
- MCP App；
- Engine pump。

分别修改 `runtime.panel.enabled`、`platform.mcp.enabled` 和 `apps.toml`。

## 为什么打开 8765 根路径是 404？

8765 是 Ops/Panel 后端，不托管完整 Vue 前端。公开健康检查在 `/healthz`，业务 API 在 `/api`，前端需要单独启动 [panel 仓库](https://github.com/AuroraBot-Dev/panel)。

## Panel 登录 token 在哪里？

`data/ops/Token.txt`。首次创建时后端也会显示它。它是 bootstrap credential，不是模型 API key。

不要提交、截图分享或放入 Prompt。登录后换取的 session 可以注销并按 TTL 过期。

## 为什么 `/status` 不可用？

nightly 的操作名是：

```text
/engine/status
```

`/help` 才是实时命令目录。旧版 alias 不作为兼容契约保留。

## 如何更换模型？

在 `config/models.toml`：

1. 定义 Provider 的 adapter、secret_env 和可选 base_url；
2. 把 fast/quality/multimodal/embedding role 绑定到模型；
3. 在启动环境提供 secret_env 指向的密钥；
4. 重启。

不要把真实密钥写进 TOML。用 `/models` 与 `/roles` 检查实际绑定。

## 语义记忆报 degraded，还能工作吗？

通常可以。mem0、Chroma 或 embedding 失败时，MemoryService 会回退到 durable facts 关键词检索。用：

```text
/memory/status
```

查看原因。降级不等于窗口和概要全部丢失。

## 上传附件后模型为什么看不到？

nightly 只完成文件存储、索引和稳定引用传递。MIME 校验、内容读取与 Multimodal role 的完整链路尚在编写中。

## 可以启用 Sandbox 或 TTS 吗？

当前不可以作为受支持功能使用。Sandbox 没有进入 Agent 组合；Speech 只有未启用的决策壳，没有 TTS 配置与执行绑定。

相关威胁模型、授权、资源限制与回执文档正在编写中。

## 可以把 Panel 暴露到公网吗？

不可以。配置加载器要求 loopback，当前只有单 owner token session，不提供多租户隔离、角色权限或公网安全承诺。

远程访问应通过可信隧道，且 AuroraBot 后端继续只监听本机。

## 有 Docker 或无人值守生产部署吗？

核心仓库当前推荐源码 + uv。Panel 仓库有前端构建/容器资产，但 AuroraBot 0.5 alpha 尚未发布完整的核心容器、备份、恢复、TTL、soak 和公网运维契约。

部署文档正在编写中。

## 如何清空或迁移数据？

nightly 尚无统一清理与备份操作。不要在运行时删除 SQLite、WAL 或表行。停止进程后可以自行保留整个 `data/` 副本，但当前不承诺任意 nightly 提交之间的手工恢复兼容性。

数据库升级应由内建连续迁移完成。

## MCP App 断线会怎样？

当前连接意外结束会传播到组合根，AuroraBot 进程随之停止并统一清理。自动重连和跨重连工具幂等边界尚在编写中。

## 旧 Brain、Kernel、Node 文档在哪里？

它们已经从现行文档站删除。当前唯一设计基准是
[RFC 0300](https://github.com/AuroraBot-Dev/AuroraBot/blob/nightly/docs/rfc/0300-unified-architecture-and-contracts.md)，历史判断请查看 Git 历史。
