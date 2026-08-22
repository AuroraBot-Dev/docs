---
order: 10
---

# src/cadence（规划）

世界驱动的主动唤起策略。**当前没有实现**；本页只固定它的边界，防止决策逻辑重新长回 engine。

## 定位

cadence 是“是否唤起一棵 AgentTree”的唯一决策者：

```text
WorldReader（世界线 + frontier） + Bot 运行状态
        │
        ▼
cadence 策略（先表驱动，允许未来替换为模型/神经网络）
        │
        ▼
TreeLaunchRequest → engine
```

cadence 自己作为生产者提交节律与决策事实，例如 `cadence.tick`、`cadence.tree_planned`；
scope 由 cadence 决定（如 `aurora:cadence`）。它不直接修改 AgentTree。

## 边界

- 持有 `WorldReader` + `WorldWriter`，不持有 engine 内部状态；
- 只产生 `TreeLaunchRequest` 或空操作；
- 不进入 engine 热路径，不与交互式 `/run` 形成第二套循环；
- 策略替换（表 → 模型）不得改变 engine 与 world 的接口。

## ops 入口（规划）

- `GET /cadence`：策略状态；
- `POST /cadence/trigger`：显式要求一次唤起判断；
- `POST /cadence/pause` / `POST /cadence/resume`：暂停与恢复（若实现）。
