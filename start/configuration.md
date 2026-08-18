---
order: 3
---

# 配置

当前配置目录包含：

- `runtime.toml` 与 `engine.toml`：进程参数和 AgentTree 边界；
- `agents.toml`、`models.toml` 与 `prompts.toml`：Agent、模型角色和提示词路径；
- `apps.toml`、`platforms.toml` 与 `extensions.toml`：外部能力及扩展声明；
- `logging.toml` 与 `storage.toml`：日志和存储路径；
- `profiles/*.toml`：环境 profile；
- `prompts/**/*.md`：SOUL、WORLD 和各 Agent 的提示词正文。

每个 TOML 由 `aurora.configuration` 中同相对路径的模块解析并注册。全部值按显式注册顺序合并为一个 `AuroraConfig`。
增加配置只需要一个 TOML、一个同路径 Python 模块和目录入口中的一条注册记录。

`aurora config list` 列出注册名称与源文件，`aurora config show <name>` 原样显示一份 TOML。当前命令只读。

model 必须显式写入节点和 ModelRequest。profile 只决定提示词，不决定模型。child 由 delegate call 显式指定 profile、model、
tools 和 instruction。
