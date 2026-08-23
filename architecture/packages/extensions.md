---
order: 15
---

# 未来扩展包（规划）

memory、cadence 与 MCP 已从规划移入现行架构，分别见 [memory](./memory.md)、[cadence](./cadence.md) 与
[mcp](./mcp.md)。MCP 是一个具体协议适配包，不是通用 Platform、Manifest、Lifecycle 或七端口扩展框架。
以下包当前不实现；这里只固定它的 world 访问权和 ops 入口形态，避免未来另建运行模型。

## sandbox（规划）

- 定位：工具执行的安全隔离环境；
- 世界访问权：无；执行效果由调用它的 Tool 提交，sandbox 不自行写入；
- ops 入口：`GET /sandbox` 状态。

## 基线

任何未来包进入工作树前，先读 [新包扩展基线](./package-baseline.md) 并创建自己的包页面。
新增能力不得恢复 Task、AMP、Activity、InputGateway、EventSource、ControlAction、ContextContributor、EffectTool、
OutputSink 或 Projector 作为平行公共体系。
