---
order: 1
---

# 系统总览

```text
config.example/（源码模板） → config/（个人配置，Git 忽略）
  → TOML + prompts/**/*.md
  → configuration 同名模块注册
  → AuroraConfig
  → composition/{prompt,engine}.py 注册实例
  → assemble_runtime(Model, Tools)
  → AuroraRuntime.create_tree(message)
  → AgentTreeRunner
      → PromptAssembler
      → Model.complete
      → Tool.execute / delegate child
```

`src/contracts` 定义不可变值对象和 Model/Tool 端口；`src/prompt` 只组装上下文；`src/engine` 只运行树；`src/ai` 只做
Provider 协议形状映射；`aurora` 是唯一认识配置和具体注入对象的组合根。

依赖方向是 `contracts ← prompt/ai ← engine ← aurora`。当前没有数据库、网络 Provider、后台进程或第二套状态权威。
