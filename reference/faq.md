---
order: 2
---

# 常见问题

## 为什么 `aurora start` 不存在？

当前仓库不绑定具体联网 Model。项目保留组合根，但由应用调用 `assemble_runtime()` 注入 Model 与 Tools。

## `message` 为什么不是 `user`？

`message` 表示来自人或环境的平权事实。OpenAI-compatible adapter 只在协议边界把它映射为 `user`。

## 每个 child 可以用不同模型吗？

可以。model 是 AgentNode 的显式属性，也是 delegate 参数和 ModelRequest 的一部分；它不由 profile 隐式决定。

## 为什么当前没有记忆、MCP 和 Panel？

当前架构只接纳围绕 AgentTree 具有明确用例、不变量和独立测试的能力；这些能力尚不在当前范围内。
