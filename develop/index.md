---
order: 3
---

# 开发

开发入口：

- [AgentTree 与端口](./agent-development.md)：扩展核心能力；
- [新增一个包](../architecture/packages/package-baseline.md)：新能力落地的路标；
- [参与开发](./contributing.md)：依赖方向与测试要求。

扩展能力通过 `AgentDefinition` 预设、`Tool` / `Model` 端口与组合根注入完成；项目不提供
进程内插件体系，也不需要——需要新行为时，先想清楚它是 prompt、工具还是新的 Agent 定义。
