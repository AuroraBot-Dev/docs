---
order: 7
---

# src/ai

模型网关与 Provider 协议映射。纯效果端口实现，不持有 world，不关心 AgentTree。

## 职责

- `Model.complete(ModelRequest) -> ChatMessage`；
- LiteLLM 网关：`litellm` provider 映射为 `provider/model`，`openai_compatible` 映射为
  `openai/model + api_base`；
- OpenAI-compatible role 与 Tool 名称适配；Provider 别名不得泄漏回 AgentTree 或 ToolRegistry；
- 密钥只在调用时从 endpoint 声明的环境变量读取。
- 每个请求使用配置的单次 attempt 超时、最大 attempt 数和总截止时间；Provider SDK 隐式重试固定关闭；
- DEBUG 日志只记录 endpoint、attempt、耗时、消息数与工具数，不记录模型载荷。

## 边界

- 只依赖 contracts 与 litellm；
- 不读世界、不选择模型、不缓存 transcript、不执行工具；
- 模型失败作为异常交给 engine 记录为 `engine.model.failed`。
- 模型请求可以安全有限重试；Tool 的 failed / unknown 不属于此重试边界。

## ops 入口

- `GET /models`、`/models`：provider 与 endpoint 目录 JSON；
- `GET /models/{endpoint_id}`、`/model`：单个 endpoint 详情 JSON。
