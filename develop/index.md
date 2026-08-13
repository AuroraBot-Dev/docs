---
order: 3
---

# 扩展与开发

当前有两条受支持的扩展入口：

- [MCP App](./app-development.md)：用标准 MCP Server 添加环境能力和事件来源。
- [Agent profile 与 handler](./agent-development.md)：在同一 Engine 契约内增加协作角色。

外部事实使用 [AMP](./amp.md) 进入 Engine。修改主仓库前，请同时阅读 [CLI 参考](./aur-cli.md)和
[参与开发](./contributing.md)。

::: warning 尚未形成公共契约
第三方扩展市场、自动发现、热加载、版本兼容协商和 Agent 分发格式仍在编写中。`extensions/` 只是约定目录，不是插件加载器。
:::
