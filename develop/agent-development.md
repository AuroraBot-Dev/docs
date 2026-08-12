# Agent 扩展

nightly 支持通过 TOML 组合新的 Agent profile，并从源码可导入路径加载 handler。稳定的起点是复用内建 `ToolAgent`；第三方 handler ABI 与分发仍在编写。

## 先用 Profile 组合角色

大多数“新 Agent”不需要新 Python 类。可以用不同 Prompt、模型、能力和委派边界复用 `ToolAgent`：

```toml
[[agent]]
id = "custom.researcher"
implementation = "src.agents.handler:ToolAgent"
model_role = "quality"
capabilities = [
    "aur.mcp.com.example.search.*",
    "!aur.mcp.com.example.search.delete_index",
]
can_delegate = false
child_profiles = []
```

添加 Prompt 映射：

```toml
[agent]
"custom.researcher" = "prompts/agents/researcher.md"
```

然后把它加入某个父 profile 的 `child_profiles`：

```toml
[[agent]]
id = "builtin.root"
# 其余字段省略
can_delegate = true
child_profiles = ["builtin.worker", "builtin.memory", "custom.researcher"]
```

配置加载器会校验：

- profile ID 唯一；
- model role 已声明；
- child profile 存在；
- `can_delegate = false` 时 children 为空；
- capability pattern 合法；
- 每个 profile 都有 Prompt 映射。

## Profile 设计

### 只给完成职责所需能力

优先精确或包级授权，避免长期使用 `*`：

```toml
capabilities = [
    "aur.mcp.com.example.search.*",
    "aur.serv.memory.remember",
]
```

使用 `!` 排除高风险动作：

```toml
capabilities = [
    "aur.mcp.com.example.files.*",
    "!aur.mcp.com.example.files.delete",
]
```

### 委派图要有界

- 专精 Agent 通常 `can_delegate = false`；
- 递归 Worker 仍受 Engine 的深度、总 Agent 和 children 上限；
- 不要创建互相无条件委派的 Prompt；
- Triage 控制权只属于入口 Triage，不给普通自定义 profile。

### Prompt 不替代授权

Prompt 说明角色、输出期望和协作方式。Tool schema、profile capability 和 Engine 预算才约束真实效果。

## Handler 公共形状

源码层当前使用：

```python
class BaseAgent:
    def handle(self, context: AgentContext) -> AgentDecision:
        ...
```

`AgentContext` 是只读快照；`AgentDecision` 必须只选一个原子主迁移。组合根会向 handler 安装 PromptComposer 和内建 Agent Capability。

handler 不得：

- 直接调用 ModelGateway；
- 直接读写 Runtime SQLite；
- 持有 Platform client；
- 直接执行环境效果；
- 绕过 Activity、Tool receipt 和 generation 提交屏障；
- 在事件循环里执行阻塞网络或数据库 I/O。

## 消息驱动

handler 需要显式处理它可能收到的消息类型，例如：

- `task.started`；
- `model.completed` / `model.failed`；
- `tool.succeeded` / `tool.failed` / `tool.unknown`；
- `child.completed` / `child.failed`。

未知消息应返回可审计 failure，不能把已领取消息留在 PROCESSING。

## 决策与恢复

模型或工具请求先成为持久化 Activity。handler 的私有可恢复进度只能放在 `state_patch` 中，并保持 JSON 可序列化。恢复时不要依赖进程内对象、协程句柄或 Provider continuation 之外的隐式状态。

## 测试

至少覆盖：

1. 每种消息类型到唯一 AgentDecision；
2. 缺失/畸形 payload；
3. 模型与工具失败；
4. 多 Tool call continuation；
5. 委派授权与上限；
6. wait 与 child report；
7. 重启后的状态恢复；
8. 不产生越权工具请求。

主仓库质量门：

```bash
uv run aurora check
```

## 当前限制

::: warning 文档正在编写中
以下内容尚未形成稳定公共契约，因此本页不提供可能误导的脚手架：

- 仓库外 Agent 包安装与依赖隔离；
- `extensions/agents` 自动扫描；
- handler ABI 版本与兼容策略；
- 热加载、卸载与状态迁移；
- 第三方签名、市场和沙箱；
- 为自定义 handler 注入额外服务 Port 的标准方式。

当前可依赖的是主仓库源码内的 `module:attribute` 显式加载。若改动跨层 DTO、决策语义或注入边界，必须先更新 RFC 0300。
:::
