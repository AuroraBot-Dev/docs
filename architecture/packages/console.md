---
order: 8
---

# src/console

本地异步终端。**输入是事实，输出是调试途径**：

- 所有非空输入先通过 `WorldWriter.append_commit` 提交为 `console.input`，scope 固定 `aurora:console`，
  然后才进入分派端口；普通文本与斜杠命令不建立第二条特化路径。
- 终端渲染文本不入世界线；它是本地调试/交互输出，不是 Bot 世界的事实。

## 职责

- 异步读行、历史、清屏与停止协调；
- 以 `TerminalDispatcher.dispatch_terminal(text)` 调用组合根注入的分派逻辑；
- 把 `TerminalResponse` 渲染为文本，并执行 clear / shutdown 控制。

## 边界

- 只依赖 `src.contracts`（WorldWriter、scope/kind 常量）与 prompt-toolkit；
- 不导入 ops、engine、aurora，不保存 AgentTree，不解释命令；
- 输入事件由 console 自己决定 scope：`aurora:console`。
- Panel Token 的 Rich 提示属于 ops/aurora 启动生命周期，不由 `src.console` 渲染，也不进入世界线。

## ops 入口

- `GET /console`、`/console`：终端状态 JSON，至少返回 `enabled`、`input_to_worldline`、
  `output_to_worldline`、`scope`。
