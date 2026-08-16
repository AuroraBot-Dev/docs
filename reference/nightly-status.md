---
order: 10
---

# Nightly 实现状态

本页是“文档是否与代码一致”的快速边界表，不是路线图承诺。

## 对齐基线

| 项目 | 分支 / 提交 | 日期 |
| --- | --- | --- |
| AuroraBot 核心 | `nightly@97a5bdb69d02` | 2026-08-09 |
| AuroraBot Panel | `main@823fa73361e6` | 2026-08-12 |
| 文档盘点 | 本次重构 | 2026-08-12 |

核心版本为 `0.5.0`，Git 描述 `v0.5.0-alpha.5-10-g97a5bdb`。nightly 会继续前进；若提交晚于本基线，以最新 RFC、contracts 与测试为准。

## 状态定义

| 标记 | 含义 |
| --- | --- |
| 已实现 | nightly 有现行代码与测试/契约支撑 |
| 受限 | 已可用，但有明确的 alpha 边界 |
| 文档正在编写中 | 代码占位、路线图目标或公共边界尚未完成 |

## Engine 与会话

| 能力 | 状态 | 当前边界 |
| --- | --- | --- |
| AMP 直连 SQLite 摄入 | 已实现 | 无文件 Inbox、JSON archive 或 JSONL 会话日志 |
| Inbox 防抖与批次上限 | 已实现 | 默认 3 秒、24 事件、12000 字符 |
| Triage process/defer/discard | 已实现 | 结构失败 fail-open 到 Root |
| Fast / Root 双路径 | 已实现 | Fast 不可继续委派 |
| Task/Agent/邮箱/Activity | 已实现 | 单进程、单 Engine owner |
| 多 Tool call 恢复链 | 已实现 | 每项都需要真实回执 |
| Session revision 与 watermark | 已实现 | 同一 session 只有一个交互 generation |
| 有界抢占与提交屏障 | 已实现 | PROCESSING 不可撤回工具阻止抢占 |
| 跨 session 公平派发 | 已实现 | 交互优先，槽位释放即时领取 |
| 崩溃恢复 | 受限 | 模型失败化、工具恢复；真实故障注入覆盖仍不足 |
| 终态 TTL / checkpoint / 清理 | 文档正在编写中 | Ops 尚无可执行操作 |

## Agent 与 Prompt

| 能力 | 状态 | 当前边界 |
| --- | --- | --- |
| 同构 AgentContext/Profile/Handler | 已实现 | handler 只返回原子 Decision |
| Triage、Fast、Root、Worker、Memory | 已实现 | 配置与 Prompt 显式映射 |
| 有界监督树 | 已实现 | 总数、深度、children 和全局活跃上限 |
| 能力精确/前缀/全通配/排除 | 已实现 | 排除优先 |
| SOUL/WORLD/Profile 分层 | 已实现 | Prompt 不是授权边界 |
| 源码 `module:attribute` handler | 受限 | 只适合主仓库或可导入源码 |
| 第三方 Agent 包与热加载 | 文档正在编写中 | 无安装、版本和状态迁移规范 |
| Sandbox | 文档正在编写中 | 包存在但不参与 Agent 运行时 |

## AI

| 能力 | 状态 | 当前边界 |
| --- | --- | --- |
| Fast / Quality / Multimodal / Embedding | 已实现 | 角色语义由代码固定，模型由 TOML 绑定 |
| LiteLLM Provider | 已实现 | 密钥来自显式环境变量 |
| OpenAI-compatible Provider | 已实现 | 必须配置 base URL |
| models.dev 能力与价格缓存 | 已实现 | 冷启动可有界降级 |
| Chat Completions 语义 | 已实现 | 聊天角色统一入口 |
| 并行 Tool call 协商 | 已实现 | 网关不全局关闭 |
| 费用 SQLite | 已实现 | `data/ai/cost.sqlite3` |
| 费用长期聚合/清理 | 文档正在编写中 | 当前缺少有界历史运维操作 |
| 附件到 Multimodal | 文档正在编写中 | 角色存在，但完整内容链未接通 |

## 记忆

| 能力 | 状态 | 当前边界 |
| --- | --- | --- |
| 会话原文窗口 | 已实现 | 默认 100/300 下上界 |
| 异步概要 | 已实现 | Fast 角色；失败规则降级 |
| Global durable facts | 已实现 | 被动投影与 Memory Agent 同源 |
| mem0 / Chroma 语义检索 | 已实现 | 依赖 Embedding 与 Quality 模型 |
| 关键词确定性降级 | 已实现 | 语义失败或无结果时合并 |
| 跨域概要与尾部 | 已实现 | 最近 6 小时、每域 20 条 |
| 统一 32K 字符预算 | 已实现 | 为跨域与事实保留最多 8K 保障 |
| 记忆 status/history/search | 已实现 | Console 与 REST 同构 |
| 用户级保留/删除/导出 | 文档正在编写中 | 尚无完整生命周期操作 |
| 72 小时长期验证 | 文档正在编写中 | Roadmap M2/M3 |

## MCP 与 App

| 能力 | 状态 | 当前边界 |
| --- | --- | --- |
| 本地 stdio MCP | 已实现 | 有限环境继承，stdout 只跑协议 |
| HTTPS Streamable HTTP | 已实现 | 可选 Bearer `auth_env` |
| 动态 tools/list 与 tools/call | 已实现 | 能力 ID 为 `aur.mcp.<package>.<tool>` |
| 工具结果规范化 | 已实现 | structured → JSON text → text |
| MCP notification → AMP | 已实现 | 原生 `aurora/event` 与通用通知 |
| Clock 心跳、闹钟、定时器 | 已实现 | App 默认关闭 |
| Aurora-QQ / NapCat | 受限 | 仓库外扩展；默认配置却启用，干净克隆需处理 |
| App 统一启动前诊断 | 文档正在编写中 | 一些错误在子进程创建时才暴露 |
| 自动断线重连 | 文档正在编写中 | 当前断线传播到组合根并停机 |
| TOML 瞬时事件过滤 | 文档正在编写中 | 当前由具体 App 过滤 |
| MCP Resources / Prompts | 文档正在编写中 | 未进入 Agent 上下文 |
| App 脚手架、版本、市场 | 文档正在编写中 | 当前仅独立 Server + 显式 TOML |

## Console、Ops 与 Panel

| 能力 | 状态 | 当前边界 |
| --- | --- | --- |
| 本地 Console | 已实现 | `--headless` 可关闭 |
| OperationSpec 命令/REST 同构 | 已实现 | 固定 OperationResult envelope |
| Engine/Memory/AI/Config 查询 | 已实现 | 通过窄 Port |
| Session export 与输出 cursor | 已实现 | 因果与 output publication 同源 |
| Panel bootstrap + session | 已实现 | Bearer 与 HttpOnly cookie |
| WebSocket Origin 校验 | 已实现 | 只接受 allowed origins |
| 附件存储与引用 | 已实现 | 模型内容读取链未完成 |
| 独立 Vue Panel | 已实现 | 需单独启动 `panel` 仓库 |
| 公网多租户 | 文档正在编写中 | 当前明确不支持 |
| Emoji/插件/市场等页面 | 文档正在编写中 | 前端占位，无对应公共 API |

## 存储与运维

| 能力 | 状态 | 当前边界 |
| --- | --- | --- |
| Engine schema v10 | 已实现 | v1→v10 连续迁移 |
| Memory v2、AI v1、Ops v1 | 已实现 | 独立 schema_meta |
| SQLite WAL / busy timeout | 已实现 | 各包私有存储 |
| 数据路径沙箱与重叠校验 | 已实现 | `storage.toml` |
| 一致备份与恢复 | 文档正在编写中 | 无公共操作和兼容承诺 |
| 数据保留与墓碑 | 文档正在编写中 | 清理后幂等语义未闭环 |
| 生产 soak / 性能基线 | 文档正在编写中 | 0.5 alpha 不承诺无人值守长期运行 |

## 已知交付缺口

首次使用最重要的三个事实：

1. `config/apps.toml` 默认启用仓库外 Aurora-QQ；没有安装时请先设为 `enabled = false`。
2. Panel 后端不托管完整 Web 前端；前端来自独立 `panel` 仓库。
3. `/status` 不是 nightly 命令；使用 `/engine/status`。

这些差异已经在[快速开始](../start/getting-started.md)中给出可复现处理方式。
