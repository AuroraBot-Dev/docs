# CLI 参考

主程序只有一个入口：`aurora`。

```text
aurora [--root PATH] [--profile NAME] {start,check,donk} ...
```

全局参数必须写在子命令前。

## 全局参数

| 参数 | 默认值 | 作用 |
| --- | --- | --- |
| `--root PATH` | 当前工作目录 | 配置与运行根目录 |
| `--profile NAME` | 环境变量或 runtime.toml | 选择 runtime profile |

裸 `aurora` 只显示用法并以参数错误结束，不会隐式启动。

## `aurora start`

```text
aurora start [--headless] [--platform NAME ...]
```

| 参数 | 作用 |
| --- | --- |
| `--headless` | 禁用本地 Console；不改变 Panel 和 Platform |
| `--platform mcp` | 精确选择本次 Platform；可重复 |

未提供 `--platform` 时，读取 `config/platforms.toml`。显式提供后不会与默认集合叠加。

```bash
# 默认组合
uv run --env-file .env aurora start

# dev profile
uv run --env-file .env aurora --profile dev start

# 只选择 MCP，并关闭 Console
uv run --env-file .env aurora start --platform mcp --headless
```

当前唯一合法 Platform name 是 `mcp`。

## `aurora check`

```text
aurora check [--lint] [--test] [--fix] [--unsafe-fixes] [--check]
```

无 `--lint` / `--test` 时运行完整质量门：

1. Ruff check；
2. Ruff format check；
3. Pyright；
4. Pytest + coverage。

范围固定覆盖 `aurora/`、`ops/`、`src/`、`tests/`，coverage 门槛为 75%。

选择：

```bash
# 完整门
uv run aurora check

# 只运行 lint、format、类型
uv run aurora check --lint

# 只运行测试
uv run aurora check --test

# 两者都运行
uv run aurora check --lint --test

# 允许 Ruff 修复并格式化
uv run aurora check --lint --fix
```

`--unsafe-fixes` 会把 Ruff unsafe fixes 传入检查命令，使用前应审查 diff。`--check` 在修复模式下强制 format 只检查。

## `aurora donk`

```text
aurora donk {show,major,minor,patch}
```

维护者版本工具：

- `show`：读取 `pyproject.toml` 当前版本；
- `major`、`minor`、`patch`：调用 donk 更新项目版本。

它会修改主仓库版本文件，不是运行 AuroraBot 的必要命令。

## Console 命令不是 CLI 子命令

`/help`、`/tasks`、`/memory/status` 和 `/quit` 等斜杠命令只在运行中的 Console/操作路由内使用：

```text
You> /engine/status
```

不要写成 `aurora status` 或 `aurora /help`。完整目录见[运行与操作](../start/operations.md)。
