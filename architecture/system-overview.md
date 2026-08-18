---
order: 1
---

# 系统总览

```text
config.example/（源码模板） → config/（个人配置，Git 忽略）
  → TOML + prompts/**/*.md
  → configuration 同名模块注册
  → AuroraConfig
  → composition/{ai,prompt,console,engine}.py 注册实例
  → aurora start / assemble_runtime(Model?, Tools)
  → Console 普通文本或 ops /run 创建 AgentTree
  → AgentTreeRunner
      → PromptAssembler
      → LiteLLMModelGateway.complete
      → Tool.execute / delegate child
```

`src/contracts` 定义不可变值对象和 Model/Tool 端口；`src/prompt` 只组装上下文；`src/engine` 只运行树；`src/ai` 提供
LiteLLM 网关；`src/console` 只负责终端交互；ops 提供统一操作目录；`aurora` 是唯一认识配置和具体注入对象的组合根。

依赖方向是 `utils/contracts ← prompt/ai ← engine ← aurora`、`console ← aurora`、`ops ← aurora`。当前没有数据库、后台平台或
第二套状态权威。
