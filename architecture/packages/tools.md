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

`builtin_tools(agents=..., journal=...)` 是内置目录的显式汇总入口，组合根把外部注入工具追加到同一
`ToolRegistry`。新增工具时按“一个模块 + 一条 builtin 记录”加入即可。

## 职责

- 校验 `aur.*` 工具 ID 与重复注册；
- 提供完整名称集合，并按节点可见集合筛选原生 definitions；
- 唯一执行路由，把未知工具、执行异常、非法返回值规范化为失败的 `ToolOutput`；
- `ScopedTool.resolve_scopes(call)`：由每个工具声明本次调用的观察与发布 scope；
- 外部工具域经 `assemble_runtime(config, model, tools=...)` 注入，与 builtin 在组合根合并。

## 世界访问权

工具本身不默认持有 world。世界服务工具（`aur.serv.world.read`、`aur.serv.world.trees`）在组合时注入
journal，未来收敛为只读 `WorldReader`。

## ops 入口

- `GET /tools`、`/tools`：全部已注册工具定义 JSON；
- `GET /tools/{tool_id}`、`/tool`：单个工具定义 JSON。
