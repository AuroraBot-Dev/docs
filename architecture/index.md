---
order: 10
---

# 架构

这一部分解释 AuroraBot 是怎么组织的：一张总览图、一棵树的工作方式，以及每个包的"工作名片"。

1. [系统总览](./system-overview.md)：配置、启动发现、组合、世界线、engine 与终端的完整数据流；
2. [AgentTree](./agent-system.md)：树、同构节点、四角色消息与世界观察前沿；
3. [包目录](./packages/index.md)：每个包的职责、世界访问权与 ops 入口；
4. [新增一个包](./packages/package-baseline.md)：给项目加新能力时的路标。

## 四件始终如一的事

1. **世界线是总线，但代码上是叶子**：`src/world` 只保存存储实现；跨包共享的 `WorldReader / WorldWriter / WorldJournal` 端口全部定义在 `src/contracts`。上层包只认识端口，不认识实现。
2. **scope 由提交方决定**：world 只校验 scope、分配单调 sequence 并保证 append-only，从不替调用方推断归属。生产者自选 `aurora:tree:<id>`、`aurora:console` 等 scope；消费者永远显式给出 frontier。
3. **每个包都有 ops 指令化路径**：`ops/contracts` 为每个运行时包声明窄端口，`ops/operations/<pkg>.py` 注册 method/path 与斜杠入口；数据经 `OperationResult.success(data)` 返回，终端以 JSON 渲染。读操作不产生世界提交，写操作成功后才允许产生对应事实。
4. **MCP 启动发现、运行冻结**：MCP Python SDK 2.x 优先协商 `2026-07-28`，并由同一 SDK 兼容旧修订。全部启用 App 完整分页发现后，MCP Tool 才与 builtin 合并为唯一 ToolRegistry；运行中不 reload、不热替换、不自动重连。MCP 外部动作只经 Tool，外部事实只追加 World。
