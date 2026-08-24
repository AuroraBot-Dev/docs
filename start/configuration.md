---
order: 3
---

# 配置

`config.example/` 是随源码发布的完整模板。首次使用时复制为个人配置：

```bash
cp -r config.example config
```

`config/` 被 Git 忽略；运行时和配置命令只读取个人目录，不会回退到模板。目录包含：

- `runtime.toml` 与 `engine.toml`：进程参数和 AgentTree 边界；
- `agents.toml`、`models.toml` 与 `prompts.toml`：Agent、模型角色和提示词路径；
- `apps.toml`、`platforms.toml` 与 `extensions.toml`：外部能力及扩展声明；
- `logging.toml` 与 `storage.toml`：日志和存储路径；
- `profiles/*.toml`：环境 profile；
- `prompts/**/*.md`：SOUL、WORLD 和各 Agent 的提示词正文。

每个 TOML 由 `aurora.configuration` 中同相对路径的模块解析并注册。全部个人配置按显式注册顺序合并为一个 `AuroraConfig`。
增加配置只需要一个 TOML、一个同路径 Python 模块和目录入口中的一条注册记录。

`aurora config list` 列出注册名称与源文件，`aurora config show <name>` 原样显示一份 TOML。当前命令只读。

`aurora start` 在读取 TOML 前加载项目根目录的 `.env`。它只补充进程中尚不存在的环境变量，不覆盖调用方显式设置的
值；文件不存在等同于没有额外环境输入。`.env` 仅存放本地密钥等环境值，不承担结构配置职责，并由 Git 忽略。

`models.roles` 的键是 model endpoint id，必须显式写入节点和 ModelRequest。endpoint 固定映射 provider/model；profile 只决定
提示词，不决定模型。child 由 delegate call 显式指定 profile、model、tools 和 instruction。`litellm` 与
`openai_compatible` provider 都通过 LiteLLM 模型网关调用，密钥只读取 `secret_env` 指定的环境变量。

`runtime.console.enabled` 决定 `aurora start` 默认是否启动本地终端；命令行 `--headless` 可以在单次启动中禁用终端。

`logging.level` 接受 `DEBUG / INFO / WARNING / ERROR / CRITICAL`（`WARN` 等价于 `WARNING`）；`logging.log_dir` 必须是项目内
相对目录。`aurora start` 在其他运行时效果前配置终端日志，并把同一批项目日志写入 `<log_dir>/aurora.log` 的有界轮转文件。
日志只记录阶段、稳定 ID、计数和错误类型，不记录消息、Prompt、Tool 参数/结果、模型请求响应、环境变量值或世界提交 data。
