# 架构

AuroraBot 的现行架构只有一条 Agent 热路径。模型与外部生态通过 contracts Port 接入，`aurora` 组合根负责把它们组装成一个进程。

推荐阅读顺序：

1. [系统总览](./system-overview.md)：包边界与依赖方向。
2. [事件与运行时](./event-runtime.md)：一条输入怎样变成可提交输出。
3. [同构 Agent](./agent-system.md)：Triage、Fast、Root、Worker 与 Memory。
4. [记忆系统](./memory-system.md)：域内连续性、跨域动态与全局事实。
5. [MCP Platform](./platform-runtime.md)：外部工具与事件如何接入。
6. [Ops 与持久化](./operations-storage.md)：检查路径、安全边界和数据权威。

唯一设计基准是主仓库的
[RFC 0300](https://github.com/AuroraBot-Dev/AuroraBot/blob/nightly/docs/rfc/0300-unified-architecture-and-contracts.md)。
