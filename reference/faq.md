---
order: 2
---

# 常见问题

## `aurora start` 如何选择模型？

root 和 child 显式保存 `models.roles` 中的 endpoint id；LiteLLM 网关把 endpoint 固定映射到 provider/model，不从 profile
推导。测试和嵌入应用仍可调用 `assemble_runtime()` 注入 Model 与 Tools。

## `message` 为什么不是 `user`？

`message` 表示来自人或环境的平权事实。OpenAI-compatible adapter 只在协议边界把它映射为 `user`。

## 每个 child 可以用不同模型吗？

可以。model 是 AgentNode 的显式属性，也是 delegate 参数和 ModelRequest 的一部分；它不由 profile 隐式决定。

## 为什么当前没有记忆、MCP 和 Panel？

当前架构只接纳围绕 AgentTree 具有明确用例、不变量和独立测试的能力；这些能力尚不在当前范围内。
