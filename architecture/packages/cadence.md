---
order: 11
---

# src/cadence

世界驱动的主动唤起策略。cadence 是“是否唤起一棵 AgentTree”的唯一决策者，当前用最简单的表驱动策略落地：

- 每隔 `tick_seconds`（默认 3600 秒）向世界提交一次 `cadence.tick`，scope 为 `aurora:cadence`；
- 每 `evoke_every`（默认 5）个非 `engine.*` 世界提交，最多唤起一棵 AgentTree；
- 唤起目标 Agent 由 `config/cadence.toml` 的 `agent` 决定（默认 `builtin.triage`）；
- 唤起前提交 `cadence.tree_planned`，唤起失败提交 `cadence.tree_failed`；
- 唤起完成后把游标跳到世界线末尾，避免刚产生的树事件重新触发下一棵树。

## 结构

```text
src/cadence/
  __init__.py   # 导出 Cadence、scope/kind 常量与默认参数
  cadence.py    # 节律循环、tick 提交、唤起判断
```

## 组合

- 实例键：`CADENCE = InstanceKey[Cadence]("cadence.runtime")`；
- 注册顺序在 world 之后；持有同一个 `WorldJournal` 单例的 `WorldReader` + `WorldWriter` 窄视角；
- `AuroraRuntime.__post_init__` 调用 `cadence.bind_launcher(self)`，把运行时的 `TreeLauncher` 端口接回；
- `run_project()` 仅在 `cadence.enabled = true` 时创建后台任务，并在统一停止路径中取消。

## 配置

`config/cadence.toml`：

```toml
[cadence]
enabled = false
agent = "builtin.triage"
evoke_every = 5
tick_seconds = 3600
poll_seconds = 0.25
```

## 边界

- 只依赖 `src.contracts`（`WorldReader` / `WorldWriter` / `TreeLauncher`）；
- 不进入 engine 热路径，不与交互式 `/run` 形成第二套循环；
- 只产生 `TreeLaunchRequest` 或空操作，不直接修改 AgentTree；
- 策略替换（表 → 模型）不得改变 engine 与 world 的接口。

## ops 入口

- `GET /cadence`、`/cadence`：策略状态 JSON；
- `POST /cadence/trigger`、`/cadence-trigger`：显式执行一次唤起判断。
