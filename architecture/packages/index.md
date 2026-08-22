---
order: 1
---

# 包目录

每个包一个栏目页面。状态标记与当前工作树一致：`已实现` 表示代码与测试已进入 nightly；
`规划` 表示边界已预留但尚无实现，不得被文档描述为现行能力。

| 包 | 定位 | 世界访问权 | 组合实例 | ops 入口 | 状态 |
| --- | --- | --- | --- | --- | --- |
| [contracts](./contracts.md) | 公共值对象与端口 | 端口定义处 | 无 | 无 | 已实现 |
| [world](./world.md) | 世界线唯一持久化实现 | 实现本身 | `world.journal`，第一个注册 | `GET /world/stream`、`GET /world/commits/{id}` | 已实现 |
| [agents](./agents.md) | AgentDefinition 目录与唯一解析 | 无 | `agents.catalog` | `GET /agents`、`GET /agents/{id}` | 已实现 |
| [tools](./tools.md) | 工具注册表与 builtin | builtin 世界工具持 journal | `tools.registry` | `GET /tools`、`GET /tools/{id}` | 已实现 |
| [prompt](./prompt.md) | 四角色上下文组装 | 需要时 `WorldReader` | `prompt.assembler` | `GET /prompts`、`GET /prompts/{id}` | 已实现 |
| [ai](./ai.md) | LiteLLM 模型网关 | 无 | `ai.model` | `GET /models`、`GET /models/{id}` | 已实现 |
| [console](./console.md) | 本地异步终端 | `WorldWriter` | `console.terminal` | `GET /console` | 已实现 |
| [engine](./engine.md) | AgentTree 确定性执行器 | `WorldJournal` | `engine.runner` | `GET/POST /trees`、`POST /events`、`GET /world/{scope}`、`GET /forest` | 已实现 |
| [memory](./memory.md) | 世界线驱动的简化记忆 | `WorldReader` | `memory.reader` | `GET /memory` | 已实现 |
| [cadence](./cadence.md) | 世界驱动唤起 AgentTree 的策略 | `WorldReader` + `WorldWriter` | `cadence.runtime` | `GET /cadence`、`POST /cadence/trigger` | 已实现 |
| [ops](./ops.md) | 统一操作目录 | 经注入端口，不直接持有 | `runtime.ops` | `GET /` 自描述 | 已实现 |
| [aurora](./aurora.md) | 项目组合根与运行时门面 | 持有并分发唯一单例 | 组合结果 | CLI + 全部 ops 端口 | 已实现 |
| [extensions](./extensions.md) | MCP / sandbox 等未来扩展 | 按角色授予 | 按基线注册 | 按基线注册 | 规划 |

新增包之前必须先读 [新包扩展基线](./package-baseline.md)。
