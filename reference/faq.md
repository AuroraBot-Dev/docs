---
order: 2
---

# 常见问题

## `aurora start` 如何选择模型？

root 和 child 显式保存 `models.roles` 中的 endpoint id，模型网关把 endpoint 固定映射到 provider/model，不从任何全局配置隐式推导。测试和嵌入应用仍可调用 `assemble_runtime()` 注入自定义 Model 与 Tools。

## `message` 为什么不是 `user`？

`message` 表示来自人或环境的平权事实。只有在模型供应商的协议边界上，adapter 才把它映射为协议的 `user` 角色——供应商的术语不改变事实的地位。

## 每个 child 可以用不同模型吗？

可以。model 是节点的显式属性，也是委派参数和模型请求的一部分；便宜的小模型干杂活，贵的大模型把方向，各得其所。

## 没有人发消息时，它会做什么？

节律（cadence）把时间本身变成输入：每隔一段时间提交一次 tick，外部业务事件到达时按配置规则唤起一棵 AgentTree，由 Agent 自行判断要不要行动。

## 外部应用怎么接入？

两条路：通过 MCP 应用（stdio 或 HTTPS）把外部能力变成工具与事件；让 Agent 调用可见的发送类工具主动对外回复。本地 Panel 则提供一个经过认证的 HTTP 界面，调用与终端完全相同的操作目录。
