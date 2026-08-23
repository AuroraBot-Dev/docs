---
order: 16
---

# 新包扩展基线

任何 `src` 新包、未来扩展包或新的 `ops` 域，从以下最低成本基线开始。基线目标是：
**新增能力只增加并列模块，不修改中心加载器、世界总线或 engine 分支。**

## 1. 先定契约

- 跨包共享的值对象或端口先进入 `src/contracts`；
- 只包内使用的实现留在包内；
- 端口区分读写：需要世界时选择 `WorldReader`、`WorldWriter` 或 `WorldJournal`，不允许 import `src.world`。

## 2. 先定世界角色

| 包行为 | 注入端口 |
| --- | --- |
| 产生事实/效果事件 | `WorldWriter` |
| 只读观察世界 | `WorldReader` |
| 既观察又产生因果记录 | `WorldJournal` |
| 纯计算/纯效果，不涉及世界 | 无 |

提交时由本包决定 scope 与 kind；需要可重放的 commit 使用确定 commit id。纯读操作不写世界。

## 3. 先定 ops 指令化路径

每个运行时包必须拥有：

- `ops/contracts.py` 中的 `<Pkg>RuntimePort`；
- `ops/operations/<pkg>.py` 中的 `@operation` 注册；
- `ops/registry._load_all()` 的一条模块记录；
- `AuroraRuntime` 的端口实现与注入。

命名模式：

- 目录：`GET /<pkg>`；
- 单项：`GET /<pkg>/{id}`；
- 动作：`POST /<pkg>/{resource}/{action}`；
- 斜杠别名至少覆盖常用入口；
- 成功数据走 `OperationResult.success(data)`，终端以 JSON 输出；未装配端口统一 `NOT_AVAILABLE`。

## 4. 先定组合成本

需要项目实例的包增加：

```python
# aurora/composition/<pkg>.py
KEY = InstanceKey[...]("<pkg>....")
def register(context: CompositionContext) -> None: ...
```

并在 `COMPOSITION_REGISTRARS` 中按依赖顺序插入。`world.register` 永远第一；
新包不得在模块 import 时自行构造实例，不得绕过 composer。

如果包需要网络连接、子进程或远端目录发现，必须把 I/O 放在组合根拥有的异步启动边界：先完成全部发现并生成不可变快照，
再把快照交给同步 composition。依赖该目录的跨引用必须在快照冻结后校验；运行中不得 reload、热替换目录或自动重连后改写
既有运行对象。连接状态可以变化，目录身份不能变化。

## 5. 先定测试与文档

- 新增依赖边界测试：包只允许 import 其声明依赖；
- 离线 fake 端口测试，不依赖网络、数据库、密钥或真实终端；
- 在 `docs/architecture/packages/` 增加一个包页面，写明状态、职责、世界访问权、组合实例与 ops 入口；
- 若影响 AgentTree、消息、模型/工具、包边界或持久化，先更新 RFC，再同步本栏目。

新包只增加完成真实用例所需的窄端口。不得以复用为名恢复通用 Platform、Manifest、Lifecycle、Task、AMP、Activity 或七类
贡献端口；协议自己的 task 或回调也不能绕过 AgentTree。
