---
order: 3
---

# 配置与存储

本页描述现行配置与存储结构。设计思想见 `RFC 0300`。

## 个人配置与模板

核心值对象可直接由 Python 构造。`config.example/` 是随源码发布的完整配置模板；用户将其复制为 `config/` 后形成个人生效配置。`config/` 必须被 Git 忽略，运行时默认只读取它，不隐式回退到模板；`aurora config` 默认也只读，只有显式 `--edit`/`--set` 才修改个人 `config/`，绝不把修改写回源码或模板。

`.env` 是本地启动便利入口，只能向进程环境补充尚不存在的变量，不覆盖调用者显式设置的环境，也不定义或改写 TOML 结构。文件不存在时按空环境处理；`.env` 与 `config/` 一样属于个人文件，不进入源码发布或 Git 跟踪。

模板与个人目录保持相同拓扑。每个 TOML 只由同相对路径的 configuration 模块解析；通用加载器不包含文件名、字段名或具体配置类型分支。新增结构配置时，只增加一个模板 TOML 与一个导出 `CONFIG_SPEC` 的同路径 configuration 模块。密钥只来自环境变量。

## 配置清单

项目配置按职责拆成 `runtime.toml`、`engine.toml`、`agents.toml`、`models.toml`、`prompts.toml`、`apps.toml`、`platforms.toml`、`extensions.toml`、`logging.toml` 和 `storage.toml`；环境 profile 位于 `profiles/<name>.toml`，提示词正文位于 `prompts/`。

`runtime.tree` 只保存 root node id 和 root AgentDefinition id；`agents.toml` 定义全部可实例化 Agent 的 description、prompt、model、tools 和 children；`engine.tree`、`prompts.toml` 与 `models.toml` 分别提供树上限、prompt 正文和 model endpoint。组合时必须拒绝重复 definition id，以及不存在的 root、child、prompt、model 或 Tool 引用。`runtime.console` 决定默认是否启动本地终端。其余配置作为已注册的只读项目事实进入 `AuroraConfig`，直到对应运行包出现真实用例。

> 注：现行 `config.example/` 以 `providers.toml`、`endpoints.toml` 承载模型配置，未使用 `models.toml`、`extensions.toml` 或独立 `logging.toml`；日志级别来自 `runtime.toml`、日志目录来自 `storage.toml`。以模板与解析模块为准。

## 模型配置

模型 endpoint id 是节点显式保存和 `ModelRequest` 显式携带的事实；每个 endpoint 固定指向一个 provider 和协议 model 名称。Provider 不从 prompt 或 AgentDefinition 推导 endpoint。密钥字段只声明环境变量名，真实密钥只在调用时从环境变量读取。

当前模型效果统一经过 LiteLLM 网关：`litellm` adapter 使用显式 `provider/model`，`openai_compatible` adapter 使用 `openai/model + api_base`。两者共用 Chat Completions 消息与 Tool 映射，不建立绕过网关的直连客户端；其他 adapter 启动即失败，不进行隐式兼容猜测。

## MCP 与平台配置

`apps.toml` 由同名 configuration 模块解析为类型化、不可变的 MCP App DTO，不再只保留原始 TOML。package 全局唯一。stdio App 必须声明 `working_dir + command`，不得声明 URL；Streamable HTTP App 必须声明 HTTPS URL，不得声明本地命令或工作目录。两者均支持 `enabled`、`timeout_seconds`、显式环境变量名白名单与事件模式；远程认证只使用 `auth_env`。协议首选版本与自动兼容策略是架构事实，不开放 TOML 选择另一 SDK 主版本。为兼容已有个人配置，省略 `event_mode` 等价于安全的 `disabled`；启用现代扩展或受限 legacy 转换仍必须显式填写对应模式。

`platforms.toml` 只保存 MCP 总开关与终端诊断偏好，不由此恢复通用 Platform、Manifest 或七端口体系。App enabled、目录或 schema 变化只在重启后生效。

## 日志配置

日志解析为不可变的 `level + log_dir` 配置；level 只接受标准 DEBUG/INFO/WARNING/ERROR/CRITICAL（WARN 规范化为 WARNING），log_dir 必须是项目内相对目录。运行日志固定写入该目录的 `aurora.log` 并按大小轮转，同时保留终端诊断；配置本身不提供任意格式字符串、绝对路径、handler 类或远程日志地址。

## 存储

`storage.toml` 的 `storage.data_root` 与 `storage.world` 共同确定 WorldJournal SQLite 文件路径。WorldJournal 维护单行 schema version；首版为 v1，后续每次 schema 改动必须提供 `vN → vN+1` SQLAlchemy migration 并更新版本。它同时维护 per-scope sequence 与全局 insertion cursor，只保存世界提交，不归档 AgentTree，也不把数据库对象泄漏进节点契约。费用库与独立记忆库仍未定义。
