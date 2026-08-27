---
order: 5
---

# src/tools

全项目工具最终汇总处。组织方式与 `AuroraConfig` 相同：**每个工具一个模块，目录入口显式注册，
注册表只做校验、筛选与分派**。

## 目标结构

```text
src/tools/
  __init__.py       # 只导出目录与注册入口
  registry.py       # ToolRegistry：唯一汇总与执行路由
  builtin/
    __init__.py     # BUILTIN_TOOL_REGISTRARS 显式元组
    delegate.py     # aur.agent.delegate
    wait.py         # aur.builtin.wait
    world.py        # aur.serv.world.read / aur.serv.world.trees
```

`builtin_tools(agents=..., journal=...)` 是内置目录的显式汇总入口。组合根先让全部启用 MCP App 完整发现，随后把冻结的
MCP Tool 快照、其他外部注入 Tool 与 builtin 一次性合并为同一 `ToolRegistry`。新增 builtin 时仍按“一个模块 + 一条记录”加入。

## 职责

- 校验 `aur.*` 工具 ID 与重复注册；
- 提供完整名称集合，并按节点可见集合筛选原生 definitions；
- 唯一执行路由，把未知工具、执行前异常、非法返回值规范化为 failed `ToolOutput`，保留执行器显式返回的 unknown；
- `ScopedTool.resolve_scopes(call)`：由每个工具声明本次调用的观察与发布 scope；
- 外部工具域经 `assemble_runtime(config, model, tools=...)` 注入，与 builtin 在组合根合并。

## MCP 与冻结边界

- raw name 与 App package 组合为 `aur.mcp.<package>.<raw_name>`，registry 不替 MCP 静默改名；package 与框架 ID 段保持
  小写，raw name 段是第三方命名事实，允许 `[A-Za-z]` 开头的大小写风格；
- 全部 App 完整分页 `tools/list` 后才允许构造 registry，并在构造时拒绝跨来源冲突；
- registry 构造后不可变；`tools/list_changed` 只使 MCP 状态显示 `restart_required=true`；
- 当前没有 reload、hot replace 或自动重连后的目录重绑定；断线只改变执行可用性，不改变 definition；
- MCP Tool 仍实现同一个 `Tool.execute` 与 `ScopedTool.resolve_scopes`，不经过 AMP、Activity、异步回执或第二套路由；
- MCP Tool 默认 observe / publish App scope；双方严格协商 `org.aurorabot/tool-contract` v1 后，可以由 Tool `_meta`
  声明只引用顶层调用参数的 scope 模板，发现时校验模板，调用前解析失败即在远端效果发生前 failed。

## ToolOutput 三态

`succeeded`、`failed` 与 `unknown` 都是正常的 Tool 返回值。unknown 表示效果不确定，必须原样交给 engine；registry 只把
确定发生在调用前的本地异常归为 failed，不能自动重试或猜测远端效果。

协商后的 MCP `CallToolResult._meta` 可以显式声明 `status="unknown"`；适配器必须优先保留该状态。远端明确参数/方法拒绝或
确认没有效果时才是 failed，内部超时、下游断线和其他可能已产生效果的错误不能降格。

## 世界访问权

工具本身不默认持有 world。世界服务工具（`aur.serv.world.read`、`aur.serv.world.trees`）在组合时注入
journal，以只读 `WorldReader` 视角使用。

## ops 入口

- `GET /tools`、`/tools`：全部已注册工具定义 JSON；
- `GET /tools/{tool_id}`、`/tool`：单个工具定义 JSON。
