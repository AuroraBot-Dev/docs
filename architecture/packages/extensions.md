---
order: 13
---

# 未来扩展包（规划）

以下包当前不实现；只固定它们的 world 访问权和 ops 入口形态，避免未来各建一套。

## mcp（规划）

- 定位：外部 MCP 工具/资源的协议适配器；
- 世界访问权：`WorldWriter`；
- 提交内容：`mcp.*` 事件，scope 由 mcp 适配器按调用上下文决定；
- 工具 ID 统一为 `aur.mcp.<app_package>.<tool>`，经 `src/tools` 注入；
- ops 入口：`GET /mcp` 状态、`POST /mcp/{app}/reload` 等按基线注册。

## memory（规划）

- 定位：长期记忆检索与写入建议；
- 世界访问权：只读 `WorldReader`；
- 不直接追加世界提交；记忆事实若成为环境事实，必须由环境生产者显式提交；
- ops 入口：`GET /memory` 状态、`GET /memory/query`（只读）。

## sandbox（规划）

- 定位：工具执行的安全隔离环境；
- 世界访问权：无；执行效果由调用它的 Tool 提交，sandbox 不自行写入；
- ops 入口：`GET /sandbox` 状态。

## 基线

任何未来包进入工作树前，先读 [新包扩展基线](./package-baseline.md) 并创建自己的包页面。
