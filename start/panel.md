# Web 管理面板

AuroraBot Panel 分为两个项目：

- AuroraBot 主仓库的 `ops`：FastAPI 后端、认证、操作树、附件和 WebSocket；
- 独立的 [panel 仓库](https://github.com/AuroraBot-Dev/panel)：Vue 3 / Vite / Naive UI 前端。

后端不会从根路径托管完整 Panel 前端。二者需要分别启动。

## 后端

默认 `config/runtime.toml`：

```toml
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
```

启动 AuroraBot 后，bootstrap token 位于：

```text
data/ops/Token.txt
```

第一次创建时也会在后端终端显示。不要提交或分享该文件。

## 启动前端

要求：

- Node.js 22.18+ 或 24.12+；
- pnpm 11+；
- 已运行的 AuroraBot 后端。

```bash
git clone https://github.com/AuroraBot-Dev/panel.git AuroraBot-panel
cd AuroraBot-panel
pnpm install --frozen-lockfile
pnpm dev
```

开发服务器默认位于 `http://127.0.0.1:8766`，并把 `/api`、`/healthz` 和 WebSocket 代理到 `127.0.0.1:8765`。

打开登录页，输入 `data/ops/Token.txt` 的 bootstrap token。成功后，后端会：

1. 签发随机 Bearer session token；
2. 在 `data/ops/panel.sqlite3` 记录摘要与过期时间；
3. 同时设置同源 HttpOnly、SameSite=Strict cookie。

## 认证边界

无需 session：

- `GET /healthz`；
- `POST /api/auth/login`，仅用于 bootstrap token 换取 session。

需要有效 Bearer 或 cookie：

- `/api/health`；
- `/api/ops` 与所有业务操作；
- 附件上传、下载；
- `/debug/lab`；
- WebSocket 输出流。

WebSocket 还要求 Origin 位于 `allowed_origins`，否则以 4403 关闭；session 无效时以 4401 关闭。

::: danger 不要暴露到公网
Panel 只允许绑定 loopback，当前是单 owner、单进程检查界面，不具备公网多租户隔离保证。需要远程访问时，请先建立可信隧道，并保持后端只监听本机。
:::

## 前端当前覆盖

使用真实后端数据的页面包括：

- 运行概览、Task、Agent 与因果观察；
- Panel 对话、会话与输出流；
- 模型角色、能力、模态与费用；
- 配置快照、Prompt 与 Agent profile；
- 记忆历史、检索与降级状态；
- 日志和诊断操作。

Emoji、表情、屏蔽词、学习、插件和市场入口是明确占位，不代表后端已有对应公共 API。

## 跨域部署

前端可通过环境变量覆盖地址：

```dotenv
VITE_GLOB_API_URL=https://example.invalid/api
VITE_GLOB_WS_URL=wss://example.invalid/api/ops/stream
```

同时必须把前端 Origin 加入后端 `runtime.panel.allowed_origins`。即使如此，后端仍只接受 loopback 绑定；跨主机网络拓扑不属于当前稳定部署契约。

## 附件

附件上传：

```http
POST /api/ops/attachments
Content-Type: multipart/form-data
Authorization: Bearer <session-token>
```

文件名只允许 ASCII 字母、数字、点、下划线和连字符，最多 64 字符。文件存入 `data/ops/uploads`，索引在 `panel.sqlite3`。

::: warning 多模态链路正在编写
nightly 已完成附件存储与稳定引用传递，但还没有把 MIME 校验、内容读取和 `multimodal` 角色串成完整理解链路。上传成功不代表模型能读取该文件。
:::

## Lab 调试页

本地 Console 启用时，受认证的 `/debug/lab` 可用于快速调用后端操作。使用 `--headless` 时该路由不提供。

## 前端质量命令

```bash
pnpm typecheck
pnpm exec vitest run apps/web-naive/src/api/operation-coverage.test.ts --dom
pnpm lint
pnpm build
```

后端操作契约变化时，前端需要同步更新 `apps/web-naive/src/api/modules`、传输 DTO 和覆盖测试。
