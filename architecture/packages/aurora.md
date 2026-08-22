---
order: 13
---

# aurora

项目唯一组合根与运行时门面。`src` 与 `ops` 互不认识的实例都在这里显式装配。

## 结构

```text
aurora/
  commands/        每个 CLI 命令一个注册模块
  configuration/   每个 TOML 一个解析与注册模块
  composition/     每个需构造实例的 src 子包一个注册模块
  composer.py      InstanceKey、CompositionContext、AuroraAssembly
  config.py        ConfigKey、AuroraConfig、合并器
  runtime.py       AuroraRuntime、assemble_runtime、run_project
  main.py          顶层 CLI 解析与分派
  utils/           子进程、TOML 字段等无项目语义工具
```

## 组合顺序

```python
COMPOSITION_REGISTRARS = (
    world.register,    # 世界单例第一个构造
    memory.register,   # 只读世界记忆
    cadence.register,  # 节律 + 唤起策略
    agents.register,
    ai.register,
    prompt.register,
    console.register,
    tools.register,
    engine.register,
)
```

- `CompositionContext.provide` 拒绝重复实例键：`world.journal` 是全局单例；
- `require` 读取尚未注册的依赖立即失败：顺序即契约；
- `AuroraRuntime` 持有该 world 实例，并向 console 注入 `WorldWriter`、向 engine 注入 `WorldJournal`。

## 生命周期

- `assemble_runtime()`：配置 → 组合 → `AuroraRuntime`；
- `run_project()`：`await runtime.world.initialize()` 一次；`cadence.enabled = true` 时创建节律后台任务；再进入 Console 或 headless 停止等待；
- SIGINT / SIGTERM / EOF / `/exit` 汇聚到同一停止事件。

## ops 端口

`AuroraRuntime` 实现 `TreeRuntimePort / ConfigRuntimePort / ProcessRuntimePort` 以及
`Agents/Tools/Prompt/Ai/World/Console/Cadence/Memory/Utils/ContractsRuntimePort`，在 `__post_init__` 注入 `OpsRuntime`。

## CLI

- `aurora start`：本地异步终端或 `--headless`；
- `aurora check / config / about / donk`：按命令模块注册，`main.py` 不分派具体逻辑。
