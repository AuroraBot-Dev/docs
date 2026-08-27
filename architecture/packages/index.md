---
order: 1
---

# 包目录

每个包一页"工作名片"：它负责什么、在世界线里扮演什么角色、怎么组合、怎么经 ops 调用。

| 包 | 定位 | 世界访问权 | 组合实例 | ops 入口 |
| --- | --- | --- | --- | --- |
| [contracts](./contracts.md) | 公共值对象与端口 | 端口定义处 | 无 | 无 |
| [world](./world.md) | 世界线唯一持久化实现 | 实现本身 | `world.journal`，第一个注册 | `GET /world/stream`、`GET /world/commits/{id}` |
| [agents](./agents.md) | AgentDefinition 目录与唯一解析 | 无 | `agents.catalog` | `GET /agents`、`GET /agents/{id}` |
| [tools](./tools.md) | 工具注册表与 builtin | builtin 世界工具持 journal | `tools.registry` | `GET /tools`、`GET /tools/{id}` |
| [prompt](./prompt.md) | 四角色上下文组装 | 需要时 `WorldReader` | `prompt.assembler` | `GET /prompts`、`GET /prompts/{id}` |
| [ai](./ai.md) | LiteLLM 模型网关 | 无 | `ai.model` | `GET /models`、`GET /models/{id}` |
| [console](./console.md) | 本地异步终端 | `WorldWriter` | `console.terminal` | `GET /console` |
| [engine](./engine.md) | AgentTree 确定性执行器 | `WorldJournal` | `engine.runner` | `GET/POST /trees`、`POST /events`、`GET /world/{scope}`、`GET /forest` |
| [memory](./memory.md) | 世界线驱动的简化记忆 | `WorldReader` | `memory.reader` | `GET /memory` |
| [cadence](./cadence.md) | 世界驱动唤起 AgentTree 的策略 | `WorldReader` + `WorldWriter` | `cadence.runtime` | `GET /cadence`、`POST /cadence/trigger` |
| [mcp](./mcp.md) | MCP SDK 2.x 协议适配与冻结工具目录 | `WorldWriter` | 启动发现结果 + `mcp.runtime` | `GET /mcp`、`GET /mcp/{package}` |
| [ops](./ops.md) | 统一操作目录与本地 Panel HTTP | 经注入端口，不直接持有 | `runtime.ops` | `GET /` 自描述、`/api/ops` |
| [aurora](./aurora.md) | 项目组合根与运行时门面 | 持有并分发唯一单例 | 组合结果 | CLI + 全部 ops 端口 |

新增能力之前，先读 [新增一个包](./package-baseline.md)。
