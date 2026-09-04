# Aurora MCP App 包管理命令设计

状态：已实现

面向读者：第一次接触 AuroraBot、准备理解或维护 `aurora app` 的开发者

## 1. 需求摘要

新增一组类似 winget 的命令：

```text
aurora app search
aurora app install
aurora app remove
aurora app list
```

它们负责：

1. 分页查找 GitHub 上带有 `aurorabot-app` topic 的仓库；
2. 把选中的 MCP App 安装到项目默认目录；
3. 将 App 的启动配置添加到个人 `config/apps.toml`；
4. 列出由该命令管理的本地安装；
5. 安全移除受管安装和对应配置。

本文同时是设计说明和实现导读；具体代码落点见第 15 节。

### 1.1 当前类型结论

当前 AuroraBot 唯一已经进入运行组合的第三方 App 类型是 MCP App，因此本命令只搜索、安装、列出和移除
**MCP App**，不支持普通 Python 插件、Prompt 包、AgentDefinition 包或任意可执行程序。

带有 `aurorabot-app` topic 只表示仓库作者声明“该仓库是 AuroraBot App”，不能单独证明它符合 MCP 协议。一个仓库要真正可安装，
还必须同时满足：

1. 仓库根目录提供合法的 `aurora-app.toml`；
2. 清单中的 `app.command` 能启动一个 stdio MCP Server；
3. Aurora 启动时，该 Server 能完成 MCP 协议握手与工具发现。

因此验证分成三层：

```text
GitHub topic       → 发现候选仓库
aurora-app.toml    → 安装前验证静态配置
MCP initialize     → Aurora 下次启动时验证真实协议能力
```

search 只完成第一层；install 完成前两层；第三层必须由现有 `McpRuntime` 在 `aurora start` 时完成。

## 2. 先理解 AuroraBot 中的 App

### 2.1 App 不是 Agent，也不是新的运行模型

AuroraBot 的认知主体是 Bot，一次认知运行是一棵 `AgentTree`。MCP App 位于认知核心之外，只提供两类能力：

- 把 MCP Server 暴露的工具转换成 Aurora `Tool`；
- 把 MCP Server 主动上报的外部事实写入 `WorldJournal`。

因此，安装 App 不会创建 Agent、Task、后台认知循环或另一套消息系统。

### 2.2 当前 App 从哪里进入运行时

现有启动链路是：

```text
config/apps.toml
    ↓ aurora.configuration.apps 解析和校验
AppConfig
    ↓ aurora.composition.mcp 转换
McpAppSpec
    ↓ aurora.runtime.run 在启动阶段连接和发现
McpRuntime
    ↓ 与内建工具合并并冻结
ToolRegistry
    ↓ AgentDefinition 按工具 ID 获得可见工具
AgentTreeRunner
```

其中：

- `config/apps.toml` 是用户个人的生效配置；
- `config.example/apps.toml` 只是随源码发布的模板，包管理命令不得修改它；
- `extensions/` 是本机应用目录，已经被 Git 忽略；
- App 配置和目录变化只在下次 `aurora start` 后生效；
- 运行时启动后，MCP 工具目录被冻结，包管理命令不得热替换它。

### 2.3 为什么不使用 extensions.toml

仓库中虽然存在 `extensions.toml`，但当前它只保留原始文档，没有进入 AgentTree 组合。真正连接 MCP App 的配置是
`apps.toml`。所以 `aurora app` 必须修改 `config/apps.toml`，不能把安装记录写到当前尚未生效的
`extensions.toml` 中。

## 3. 设计目标与非目标

### 3.1 目标

- 提供接近 winget 的发现、安装、查询和卸载体验；
- 命令行为在 Windows、Linux 和 macOS 上保持一致；
- 搜索支持明确的页码和每页数量；
- 安装前验证 GitHub topic 和仓库内清单；
- 复用现有 `AppConfig` 规则，不建立第二套 App 配置语义；
- TOML 修改保留用户已有注释、顺序和无关条目；
- install/remove 失败时可回滚，不留下半安装状态；
- remove 只能删除包管理器自己安装的目录；
- 测试可完全离线运行。

### 3.2 非目标

当前不实现：

- 通用 Aurora Plugin API、第三方 Python 代码动态导入或生命周期钩子；
- MCP 之外的七端口扩展体系；
- `update`、`upgrade`、依赖解析、依赖锁文件或多版本共存；
- 自建中心仓库、评分、推荐、签名和信任认证；
- 自动修改 AgentDefinition 的工具白名单；
- 自动写入密钥、读取仓库声明的秘密或修改 `.env`；
- 安装脚本、post-install hook 或安装时执行仓库代码；
- 对正在运行的 Aurora 进程热加载或热卸载 App；
- 删除 App 在安装目录之外产生的业务数据。

这些边界很重要：当前命令只是“GitHub 发现 + 本地包目录 + apps.toml 管理”，不是新的运行时扩展框架。

## 4. 术语

| 术语 | 含义 |
| --- | --- |
| repository | GitHub 仓库，使用 `owner/repo` 唯一标识 |
| topic | GitHub 仓库 topic；本设计固定使用 `aurorabot-app` |
| package ID | App 的稳定、小写点分标识，例如 `org.aurora.qq` |
| manifest | 仓库根目录的 `aurora-app.toml` 安装清单 |
| managed installation | 由 `aurora app install` 创建并带有管理标记的安装 |
| app config | 写入个人 `config/apps.toml` 的 `[[app]]` |
| install root | 固定的项目内目录 `extensions/apps/` |
| ref | 要安装的 Git branch 或 tag；省略时使用默认分支 |

GitHub 正式使用的是 topic，搜索条件为 `topic:aurorabot-app`。“`#aurorabot-app` 标签”只作为需求中的通俗表达，
实现时不能退化为在 README 或描述中搜索字符串。

## 5. 总体设计

包管理命令位于项目组合层，不进入 `src`：

```text
aurora app ...
        │
        ├── GitHub catalog：只负责搜索和读取仓库元数据
        │
        ├── Manifest reader：只解析本地 aurora-app.toml
        │
        ├── Installation store：只管理 extensions/apps 下的受管目录
        │
        └── Apps config editor：只修改 config/apps.toml

下次 aurora start
        │
        └── 继续走现有 configuration → composition → McpRuntime 链路
```

这里不新增 composition 注册器，因为 package manager 是启动前使用的 CLI 工具，本身不是运行时组件。

## 6. GitHub 仓库要求

一个可安装仓库必须同时满足：

1. 仓库具有 `aurorabot-app` topic；
2. 仓库未被 GitHub 标记为 archived 或 disabled；
3. 仓库根目录存在 `aurora-app.toml`；
4. 清单版本受当前 Aurora 支持；
5. 清单中的 package ID 和 App 字段通过本地校验；
6. 仓库不会通过清单指定项目外工作目录；
7. 仓库中不存在安装器保留的管理标记文件。
8. `app.command` 启动的进程是 stdio MCP Server，而不是普通 CLI 或常驻程序。

search 结果满足第 1 条即可展示。install 必须重新读取 GitHub 仓库元数据并在 clone 后验证清单能够描述一个 stdio MCP
Server，不能相信之前的搜索结果，因为搜索和安装之间仓库可能已经变化。静态安装过程不会执行第三方代码，所以不能在安装时
证明 Server 的协议行为；真正的 MCP 握手、能力协商和工具发现仍在下次 `aurora start` 时完成，失败则沿用现有启动失败语义。

私有仓库可在 GitHub API Token 和本机 Git credential helper 都有权限时工作。`GITHUB_TOKEN` 只进入 HTTPS 请求头，
不得拼进 clone URL、日志或错误信息；Git clone 的认证继续交给用户已有的 Git 凭据配置。

## 7. 安装清单

### 7.1 文件位置

仓库根目录必须包含普通文件 `aurora-app.toml`，不递归查找，也不从 README 猜测启动命令。该文件不得是
symlink 或 junction，解析后的绝对路径必须仍直接位于仓库根目录，避免仓库借清单读取 checkout 外的本地文件。

### 7.2 完整示例

```toml
manifest_version = 1

[package]
id = "org.example.weather"
name = "Weather MCP"
version = "1.2.0"
description = "提供天气查询工具。"

[app]
command = ["uv", "run", "--frozen", "weather-mcp"]
env = ["WEATHER_API_KEY"]
timeout_seconds = 30
event_mode = "disabled"
```

### 7.3 字段定义

| 字段 | 必填 | 规则 | 用途 |
| --- | --- | --- | --- |
| `manifest_version` | 是 | 当前只能是整数 `1` | 清单格式版本，不是 App 版本 |
| `package.id` | 是 | 复用现有小写点分 package 规则 | 写入 `app.package`，也是 remove 的主标识 |
| `package.name` | 是 | 非空文本 | search/install/list 的人类可读名称 |
| `package.version` | 是 | 非空、不含控制字符 | 写入管理标记，不写入运行时 apps.toml |
| `package.description` | 是 | 非空文本 | 安装确认和 list 展示 |
| `app.command` | 是 | 非空文本数组 | stdio MCP Server 启动命令 |
| `app.env` | 是 | 不重复的环境变量名数组，可为空 | 允许透传给子进程的环境变量白名单 |
| `app.timeout_seconds` | 是 | 有限正数 | MCP 启动和调用时限 |
| `app.event_mode` | 是 | `disabled`、`world_events`、`legacy_aurora_event` | 主动事件兼容模式 |

清单中禁止出现 `working_dir`、`enabled`、`transport`、`url`、`auth_env` 和任意安装脚本：本地包固定为 stdio，
目录和启用状态由 Host 决定，远程 HTTP App 无须下载。

解析器应拒绝未知字段，防止拼写错误被静默忽略。清单字段最终必须转换成现有 `AppConfig` 做第二次校验，
确保安装命令和运行时对 package、env、timeout、event mode 的理解一致。

### 7.4 package 版本与 Git ref

`package.version` 是 App 作者声明的发布版本；Git ref 是用户选择的代码位置。二者相关但不等价：

- 安装默认分支时，记录默认分支名、package version 和解析后的 commit SHA；
- 使用 `--ref v1.2.0` 时，仍以 clone 后清单内的 `package.version` 为准；
- 当前不强制 tag 名等于版本，以免绑定具体版本命名习惯；
- 管理标记同时记录 ref、commit SHA 和 package version，方便后续设计 upgrade。

## 8. 本地目录与管理标记

### 8.1 默认目录

受管安装固定存放在：

```text
extensions/apps/<owner>/<repository>/
```

例如 `extensions/apps/AuroraBot-Dev/Aurora-QQ/`。现有模板中的手工 App 使用过
`extensions/apps/<repository>` 的扁平目录；新包管理器使用 owner/repository 两级目录，目的是避免不同 owner 下同名仓库冲突。
两种形式都能被现有 `AppConfig.working_dir` 接受。

owner 与 repository 必须来自 GitHub API 返回的规范 `full_name`，不能直接把未经校验的用户输入拼接成路径。

### 8.2 管理标记

安装成功前，在 App 目录写入保留文件 `.aurora-installed.toml`：

```toml
marker_version = 1
package = "org.example.weather"
name = "Weather MCP"
version = "1.2.0"
repository = "example/weather-mcp"
requested_ref = "v1.2.0"
resolved_commit = "0123456789abcdef..."
installed_at = "2026-09-02T12:00:00Z"
```

它不参与运行时配置，只用于证明目录由 package manager 创建，并让 list/remove 能交叉核对 package、仓库、版本和路径。
如果仓库自身已经包含同名文件，install 必须拒绝，不能覆盖后再假装它是可信标记。

### 8.3 受管路径判断

任何删除前必须：

1. 确认项目根到 install root 的所有现有路径组件均不是 symlink 或 junction；
2. 解析 install root 和候选目录的绝对路径，并确认 install root 仍位于项目内；
3. 确认候选目录严格位于 install root 内，而不是 install root 本身；
4. 确认相对路径恰好是 `<owner>/<repository>` 两段，并与标记中的 repository 一致；
5. 拒绝候选目录或管理标记使用符号链接或 junction；
6. 确认标记、package、repository 和 `apps.toml` 相互一致。

只满足“目录名看起来正确”不足以授权删除。

## 9. apps.toml 写入规则

### 9.1 写入位置

只允许修改 `config/apps.toml`。文件不存在时失败并提示先运行 `aurora setup`，不得回退修改模板。

### 9.2 生成配置

以上面的清单为例，安装器追加：

```toml
[[app]]
package = "org.example.weather"
enabled = true
transport = "stdio"
working_dir = "extensions/apps/example/weather-mcp"
command = ["uv", "run", "--frozen", "weather-mcp"]
env = ["WEATHER_API_KEY"]
timeout_seconds = 30
event_mode = "disabled"
```

| apps.toml 字段 | 来源 |
| --- | --- |
| `package` | `manifest.package.id` |
| `enabled` | 默认 true；`--disabled` 时为 false |
| `transport` | 固定生成 `stdio` |
| `working_dir` | 最终目录的项目相对 POSIX 路径 |
| `command`、`env`、`timeout_seconds`、`event_mode` | manifest 的同名 app 字段 |

### 9.3 保留用户内容

使用项目已经依赖的 tomlkit 修改配置，必须保留其他 App、注释、顺序和空行。修改前完整解析并拒绝重复 package；
写入同目录临时文件，flush 后原子 replace。install/remove 不修改 `agents.toml`：App 安装后，Agent 仍需通过自身 tools 模式
显式获得 `aur.mcp.<package>.*` 可见性。

运行时接受的空配置 `app = []` 也必须可作为首次安装的起点；写入时将其转换为标准 `[[app]]` 表数组，并保留相关注释。

## 10. 命令设计

### 10.1 search

```text
aurora app search \
  [--query TEXT] [--page PAGE] [--page-size SIZE] \
  [--sort stars|updated] [--order asc|desc]
```

默认 page=1、page-size=20、sort=stars、order=desc。查询固定包含 `topic:aurorabot-app`；例如用户传入
`--query "clock language:python"`，最终查询是 `topic:aurorabot-app clock language:python`。

page 至少为 1，page-size 为 1–100。GitHub Search 只能访问前 1000 条结果，超出范围应在请求前报错。
请求使用固定 Accept、User-Agent 和 API 版本；存在 `GITHUB_TOKEN` 时以 Bearer header 发送。

建议输出：

```text
Repository                         Stars  Updated     Description
example/weather-mcp                   42  2026-09-01  提供天气查询工具

共 37 个仓库；第 1 页，每页 20 条。
使用 aurora app install example/weather-mcp 安装。
```

搜索接口不能可靠得到仓库内 manifest 版本，当前不应逐仓库下载清单制造 N+1 请求。GitHub 返回
`incomplete_results=true` 时继续展示但标注结果不完整；rate limit 要显示重置时间，不能伪装成空列表。

### 10.2 install

```text
aurora app install <owner/repository> [--ref REF] [--disabled]
```

也接受标准 GitHub HTTPS URL及其 `.git` 形式，不接受 SSH、本地路径或其他 Git Server。

```text
找到：Weather MCP 1.2.0（example/weather-mcp）
安装目录：extensions/apps/example/weather-mcp
配置：org.example.weather，enabled=true
安装成功；配置将在下次 aurora start 时生效。
```

默认 enabled=true，与 winget 的“安装后可使用”体验一致；`--disabled` 用于先审查配置和准备环境变量。
当前不增加交互确认，保证脚本行为稳定，但输出必须明确来源、ref、commit、目录、启用状态和重启要求，并提醒用户审查 manifest 中的 command。

### 10.3 list

```text
aurora app list
```

```text
Package ID             Version  Repository             Enabled  State
org.example.weather    1.2.0    example/weather-mcp    yes      ready
org.example.calendar   0.8.1    example/calendar-mcp   no       config_missing
```

| State | 含义 |
| --- | --- |
| `ready` | 标记、目录和 apps.toml 一致 |
| `config_missing` | 受管目录存在，但配置缺失 |
| `invalid_marker` | 保留标记无法验证 |
| `config_mismatch` | package、working_dir 或目录与标记 repository 不一致 |

list 是诊断命令：一个损坏项不能隐藏其他项；有异常时展示全部结果后返回失败码。没有管理标记的手工 App 不列为受管安装。
管理标记保存在安装目录内，因此目录整体消失后无法再证明对应 `apps.toml` 条目是受管安装；当前不猜测或报告
`directory_missing`，这类孤立配置继续由现有配置加载器在下次启动时报告工作目录不存在。

### 10.4 remove

```text
aurora app remove <package-id>
```

例如 `aurora app remove org.example.weather`。remove 使用稳定 package ID，不使用目录名。默认不提供 `--force`；
标记、路径或配置不一致时拒绝删除，让用户先检查现场。

## 11. 端到端流程

### 11.1 search

```text
解析和校验分页/排序参数
  → 组合强制 topic 与用户 query
  → 调 GitHub Search API
  → 校验 JSON 必要字段
  → 渲染当前页、总数、不完整状态和下一步提示
```

search 是纯网络读取，不读取或修改本地安装状态。

### 11.2 install

```text
规范化 owner/repository
  → 检查 config/apps.toml 可读
  → 获取 GitHub 元数据并校验 topic/archived/disabled
  → 检查目标目录和同仓库标记不存在
  → 在 extensions/apps 下创建同盘 staging
  → git clone --depth 1（可选 branch/tag）
  → 读取 manifest 并复用 AppConfig 校验
  → 检查 package 在配置和受管安装中不重复
  → git rev-parse HEAD 得到 commit
  → 写管理标记
  → 原子 rename 到最终目录
  → 原子追加 apps.toml
  → 成功并提示重启生效
```

不在 clone 前创建最终目录，避免失败时让 list 误认为已经安装。

### 11.3 remove

```text
按 package ID 查管理标记
  → 交叉验证 marker / apps.toml / resolved path
  → 原子 rename 到 install root 下的 quarantine
  → 原子删除 apps.toml 唯一对应条目
      ├─ 配置失败：rename 回原目录
      └─ 配置成功：递归清理 quarantine
  → 清理空 owner 目录并提示重启生效
```

先隔离而不是立即递归删除，才能在配置写入失败时恢复。

## 12. 事务与恢复

### 12.1 install 回滚

| 失败阶段 | apps.toml | 最终目录 | 处理 |
| --- | --- | --- | --- |
| GitHub、clone、manifest 或重复校验失败 | 不变 | 不存在 | 删除 staging |
| 最终目录发布失败 | 不变 | 不存在或原状 | 删除 staging |
| apps.toml 写入失败 | 不变 | 已发布 | 移回 staging 后清理 |
| 成功 | 新增一条 | 存在 | 无回滚 |

### 12.2 remove 回滚

| 失败阶段 | apps.toml | 原目录 | 处理 |
| --- | --- | --- | --- |
| 状态校验失败 | 不变 | 不变 | 拒绝删除 |
| 移入 quarantine 失败 | 不变 | 原状或系统错误 | 停止 |
| apps.toml 写入失败 | 不变 | 暂时隔离 | rename 回原目录 |
| quarantine 清理失败 | 已删除条目 | 不在正常目录 | 报告残留路径，不恢复安装 |
| 成功 | 删除一条 | 不存在 | 无回滚 |

TOML 临时文件必须与目标同目录，以便原子 replace。quarantine 清理失败时不恢复配置，否则一个已被用户要求删除的包会再次启用。

### 12.3 并发

install/remove 必须串行。建议用 `extensions/apps/.aurora-app.lock/` 原子锁目录，记录 PID、命令和创建时间但不记录 Token。
创建失败表示另一个写操作正在进行。finally 尝试释放；当前不自动删除陈旧锁，避免误杀仍运行的进程。
search/list 不获取写锁，但 list 看见写锁时显示“安装状态正在变化”。

## 13. 错误与退出码

| 退出码 | 场景 |
| --- | --- |
| `0` | 成功；search 无匹配也成功 |
| `1` | 网络、Git、重复、无效来源、清单、锁、删除或事务失败 |
| `2` | 个人配置缺失、TOML 语法或现有 App 配置错误 |
| `130` | 用户中断 |

错误使用中文并提供下一步，但不能包含 Token、Git credential、环境变量值、Authorization header 或可能带凭据的 URL。

```text
搜索失败：GitHub API 速率已用尽，将在 2026-09-02T13:00:00Z 重置。
安装失败：仓库 example/demo 没有 aurorabot-app topic。
安装失败：config/apps.toml 已存在 package org.example.demo。
安装失败：aurora-app.toml 包含未知字段 app.working_dir。
移除失败：org.example.demo 的配置与管理标记不一致，未删除任何文件。
```

## 14. 安全设计

### 14.1 网络

- GitHub API 和 clone 只允许 HTTPS；
- 禁止接受非 GitHub clone host；
- 重定向不得降级 HTTP；
- Token 只放 header；
- 设置超时和响应正文上限；
- 把连接、响应读取、字符解码和 JSON 解析错误统一映射为不含敏感响应正文的中文错误；
- 仓库描述和错误正文按普通文本渲染。

### 14.2 文件系统

- owner/repo 校验后才参与路径计算；
- staging、quarantine、最终目录必须解析在 install root 内；
- recursive remove 只作用于已验证的 quarantine 绝对路径；
- 拒绝越界 symlink/junction；
- 不使用 shell 或 glob 生成删除命令；
- 不覆盖任何已有目录。

### 14.3 代码执行

install 只 clone、读取文本清单和写配置，不执行 App 脚本、package manager、依赖安装、MCP command 或 Git hook。
App command 只在下次启动且 enabled 时由现有 McpRuntime 执行。成功信息应提醒用户审查来源、manifest 和 command。

## 15. 实现代码落点

当前实现按用例、外部访问和文件边界分层：

```text
aurora/commands/app.py        CLI 规格、分派、输出和退出码
aurora/apps/models.py         Repository、Manifest、InstalledApp 值对象
aurora/apps/github.py         GitHub API 与分页
aurora/apps/manifest.py       清单解析与 AppConfig 复用校验
aurora/apps/store.py          目录、标记、锁、TOML 与回滚
aurora/apps/service.py        四个用例编排
aurora/apps/__init__.py       最小公共导出
tests/test_app_github.py
tests/test_app_manifest.py
tests/test_app_store.py
tests/test_app_command.py
```

```text
commands/app
    ↓
apps/service
    ├── apps/github
    ├── apps/manifest
    └── apps/store
             ↓
aurora.configuration.apps.AppConfig（只复用校验）
```

不修改 `src.engine`、`src.contracts`、`src.tools`、运行中的 `src.mcp`、`ops` 或 `AuroraRuntime`。

## 16. CLI 注册

仓库采用显式命令注册：`aurora/commands/app.py` 声明 `COMMAND` 和 `execute`，再向
`aurora/commands/__init__.py` 的 `COMMAND_SPECS` 增加一条记录；不在 `aurora/main.py` 增加分支。

```text
app
├── search
│   ├── --query
│   ├── --page
│   ├── --page-size
│   ├── --sort
│   └── --order
├── install <source>
│   ├── --ref
│   └── --disabled
├── list
└── remove <package>
```

现有 commander 已支持带默认值和类型转换的 option 字典，因此无需改变顶层 CLI 架构。

## 17. 测试设计

测试必须离线、确定、无真实用户配置；GitHub、Git clone、时间和 commit SHA 都用 fake 注入。

### 17.1 search

- 强制 topic 与用户 query 组合；
- 全部分页排序参数及边界；
- 1000 条结果上限；
- Token header；
- incomplete、rate limit、HTTP 错误、畸形 JSON和空结果。
- 响应读取超时、无效 UTF-8 与超大响应正文。

### 17.2 manifest

- 正常 v1；缺失、未知版本和未知字段；
- 非法 package、重复 env、空 command、timeout、event mode；
- 禁止 Host 字段和安装脚本；
- 能构造现有 AppConfig。

### 17.3 install

- 默认分支、指定 ref、disabled；
- topic/archived/disabled 拒绝；
- 目录/repository/package 重复拒绝；
- marker 含版本、ref、commit、时间；
- TOML 注释保留；
- `app = []` 空配置可以完成首次安装；
- 各失败阶段满足回滚表；
- 中断清理 staging；
- 不执行仓库代码。

### 17.4 list/remove

- 正常与 disabled 安装；
- config missing、invalid marker 与 config mismatch 状态；
- 手工 App 不冒充受管安装；
- 一项损坏不影响其他项；
- 未知包、配置/标记/路径冲突；
- symlink、junction、路径穿越；junction/symlink 用例在无链接权限的环境（如未开启开发者模式的 Windows）自动跳过；
- install root 自身为链接、清单链接越界、标记 repository 与目录不一致；
- TOML 失败恢复目录；
- 不删除 `.env`、其他 App、项目根或 install root。

### 17.5 架构与质量

- 命令显式注册，`src`/`ops` 依赖边界不变；
- 单文件不超过项目限制；
- `uv run aurora check --fix` 通过；
- 测试不访问网络、环境密钥或真实 Git 配置。

## 18. 验收标准

1. search 按页查询强制 topic，并展示总数与不完整状态；
2. 用户 query 不能覆盖强制 topic；
3. install 只接受 GitHub owner/repo 或标准 HTTPS URL；
4. topic、清单或 AppConfig 校验失败不会改变目录和配置；
5. 安装目录固定为 `extensions/apps/<owner>/<repo>`；
6. 生成条目能被现有 configuration 解析；
7. 用户注释和无关 App 不变；
8. 重复 repository、package、目录不被覆盖；
9. list 只认受管安装并能报告损坏状态；
10. remove 只删除校验一致的受管目录和唯一配置条目；
11. install/remove 满足回滚表；
12. 不热改运行中 ToolRegistry，明确提示重启；
13. Token、凭据和环境变量值不进入输出、日志或标记；
14. 全部测试离线通过，依赖边界不变。

## 19. 上手阅读顺序

1. 从 `aurora/commands/app.py` 看四个子命令的入口、输出和退出码；
2. 跟进 `aurora/apps/service.py`，理解 search/install/list/remove 的用例编排；
3. 阅读 `github.py` 和 `manifest.py`，理解候选发现与安装前静态校验为什么是两层；
4. 阅读 `store.py`，重点看管理标记、原子 TOML 写入、写锁、staging 和 quarantine；
5. 对照 `aurora/configuration/apps.py` 和 `aurora/composition/mcp.py`，确认包管理器只生成现有运行时能读取的 AppConfig；
6. 最后阅读四个 `tests/test_app_*.py`，用离线 fake 理解正常流程、损坏状态和回滚边界。

这个顺序先看用户行为，再下沉到外部边界和事务细节，适合第一次接触该仓库的开发者。
