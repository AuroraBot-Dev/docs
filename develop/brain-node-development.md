---
title: 认知扩展开发
description: Brain 扩展开发入口，当前重设计中。
order: 1
---

# 认知扩展开发

::: warning
施工中。Brain 扩展 API 尚未稳定，不建议基于旧 Node / Agent / Router 接口开发新扩展。
:::

旧 Node 体系会降级，但“社区共创认知能力”的目标必须保留。未来 Brain 扩展不再是随意插入拓扑的 Node，而是声明式的 Cognitive Extension（CogExt）：它增强 Bot 的理解、检索、评估和记忆沉淀，但不直接执行外部副作用。

## App 与认知扩展的区别

| 类型 | 负责什么 | 例子 |
| --- | --- | --- |
| MCP App | 连接外部世界，提供工具、资源、事件 | QQ、天气、日记、搜索 |
| Cognitive Extension | 增强 Brain 对事件和处境的理解 | 热梗理解、关系分析、风险识别、记忆整理 |

如果你的能力需要访问外部服务或执行动作，优先开发 MCP App。

如果你的能力是在 Brain 内部解释“这件事对我意味着什么”，未来应开发 Cognitive Extension。

## 目标接口草案

每个认知扩展需要声明：

- `package`：全局唯一扩展名。
- `hooks`：挂载点，例如 `perception.enrich`、`situation.interpret`、`memory.query_planner`、`deliberation.advisor`。
- `inputs`：关心哪些事件或状态。
- `outputs`：会提交哪些 patch / proposal / advice。
- `permissions`：可读写哪些记忆范围，默认不能调用 MCP Tool。

扩展输出不是最终决策，而是可审计建议：

```json
{
  "extension": "im.polaris.cogext.meme_literacy",
  "hook": "situation.interpret",
  "patches": [
    {
      "path": "cultural_context.memetic_reference",
      "op": "set",
      "value": {
        "label": "可能是近期网络梗",
        "confidence": 0.74,
        "evidence": ["原始消息片段"]
      }
    }
  ]
}
```

临时约束：

- 不新增依赖 `ApplicationHost` 的 Brain 节点。
- 不新增依赖旧 `command_dispatcher` 的行动链。
- 不让认知扩展直接调用 App 私有代码。
- 所有外部动作都应通过 MCP Tool 抽象。
- 不让扩展覆盖 Self 的核心人格和边界。
- 不让扩展绕过审议层直接决定行动。

设计方向见：[Brain 架构重设计](../architecture/brain-redesign.html)。
