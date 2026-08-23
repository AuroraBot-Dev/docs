---
order: 13
---

# ops

统一操作目录：所有包的“指令化输入/输出”都从这里走。一个 `OperationSpec` 同时描述 method/path 资源入口和
斜杠文本入口；参数只解析一次，处理器统一返回 `OperationResult`。终端对成功数据的默认渲染是 JSON。

## 结构

```text
ops/
  contracts.py       OperationSpec、OperationResult、各包窄 RuntimePort
  parser.py          斜杠文本参数解析
  router.py          method/path 与文本共用路由、JSON 渲染
  runtime.py         OpsRuntime：装配 OpsPorts
  registry.py        装饰器注册与目录加载
  operations/
    system.py
    config.py
    engine.py
    agents.py
    tools.py
    prompt.py
    ai.py
    world.py
    console.py
    cadence.py
    memory.py
    mcp.py
    utils.py
    contracts.py
```

## 每个包的窄端口

`OpsPorts` 汇总 `engine / config / process / agents / tools / prompt / ai / world / console / cadence / memory / mcp / utils / contracts`。新增包时：

1. 在 `ops/contracts.py` 增加 `<Pkg>RuntimePort` Protocol 和 `OpsPorts` 字段；
2. `AuroraRuntime` 实现该端口，并在构造 `OpsRuntime` 时注入；
3. 新建 `ops/operations/<pkg>.py`，每个操作一个 `@operation` 注册；
4. 在 `ops/registry._load_all()` 的显式元组增加模块名；
5. handler 先用 `require_port(context.runtime.<pkg>, "<pkg>")` 取窄端口；端口未装配时统一返回 `NOT_AVAILABLE`。

## 当前入口

| 域 | 读取 | 写入/动作 |
| --- | --- | --- |
| 系统 | `GET /`、`/help` | `POST /process/shutdown`、`POST /console/clear` |
| 配置 | `GET /config`、`GET /config/{name}` | `POST /apps/{pkg}/enabled`、`POST /extensions/{id}/enabled` |
| engine | `GET /engine/status`、`GET /trees...`、`GET /forest` | `POST /trees`、`POST /events` |
| agents | `GET /agents`、`GET /agents/{id}` | 无（目录只读） |
| tools | `GET /tools`、`GET /tools/{id}` | 无（目录只读） |
| prompt | `GET /prompts`、`GET /prompts/{id}` | 无（正文只读） |
| ai | `GET /models`、`GET /models/{id}` | 无（endpoint 只读） |
| world | `GET /world/stream`、`GET /world/commits/{id}` | 无（写入只经各生产者端口） |
| console | `GET /console` | 无（输入来自终端循环本身） |
| cadence | `GET /cadence` | `POST /cadence/trigger` |
| memory | `GET /memory` | 无（只读快照） |
| mcp | `GET /mcp`、`GET /mcp/{package}` | 无（状态只读，无 reload/hot replace） |
| utils | `GET /utils` | 无（纯工具能力清单） |
| contracts | `GET /contracts` | 无（公共值对象与端口清单） |

## 世界线关联

ops 不直接持有 world，而是通过 `WorldRuntimePort.record_event` 提交已确定 scope 的事实：config 变更写入
`ops.config.changed`（scope `aurora:config`），`POST /trees` 写入 `ops.tree.requested`，shutdown 写入
`ops.process.shutdown_requested`（scope `aurora:system`）。纯读操作不产生世界提交。

`McpRuntimePort` 只投影 App 的 configured/connected 状态、negotiated protocol version、冻结工具数量、最后错误与
`restart_required`。ops 不持有 MCP session，不提供 reload、reconnect 或目录替换动作；App enabled 修改仍只改 TOML 并要求重启。

## 边界

- 只依赖标准库与 tomlkit；不导入 `src` 或 `aurora`；
- 不保存第二份运行状态，不进入 AgentTreeRunner 热路径；
- 未来 HTTP、Panel 等适配器消费同一 `OperationSpec`，不得在 ops 里写适配器逻辑。
