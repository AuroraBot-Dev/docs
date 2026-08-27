---
order: 15
---

# 新增一个包：五步走

给 AuroraBot 加一个新的运行时包（或给现有包增加一块重要能力）时，按这个路标走，
可以保证新能力只增加并列模块，不惊动中心加载器、世界总线或 engine。

## 第一步：先定契约

- 跨包共享的值对象或端口先进 `src/contracts`；
- 只在本包内部使用的实现留在包内；
- 需要世界时，在 `WorldReader`、`WorldWriter`、`WorldJournal` 中选合适的端口，不 import `src.world`。

## 第二步：先定世界角色

| 包行为 | 注入端口 |
| --- | --- |
| 产生事实/效果事件 | `WorldWriter` |
| 只读观察世界 | `WorldReader` |
| 既观察又产生因果记录 | `WorldJournal` |
| 纯计算/纯效果，不涉及世界 | 无 |

scope 与 kind 由本包决定；需要可重放的 commit 使用确定 commit id。纯读操作不写世界。

## 第三步：先定 ops 路径

每个运行时包都有一套"指令化入口"，让终端斜杠命令与本地 Panel 用同一套方式调用：

- `ops/contracts.py` 中的 `<Pkg>RuntimePort`；
- `ops/operations/<pkg>.py` 中的 `@operation` 注册；
- `ops/registry._load_all()` 的一条模块记录；
- `AuroraRuntime` 的端口实现与注入。

命名习惯：目录 `GET /<pkg>`；单项 `GET /<pkg>/{id}`；动作 `POST /<pkg>/{resource}/{action}`；
斜杠别名至少覆盖常用入口。成功数据走 `OperationResult.success(data)`，终端以 JSON 输出；
未装配的端口统一返回 `NOT_AVAILABLE`。

## 第四步：先定组合成本

需要项目实例的包增加 `aurora/composition/<pkg>.py`，并在 `COMPOSITION_REGISTRARS` 中按依赖
顺序插入；`world.register` 永远第一。包不得在模块 import 时自行构造实例，不得绕过 composer。

需要网络连接、子进程或远端目录发现时，把 I/O 放在组合根拥有的异步启动边界：先完成全部发现
并生成不可变快照，再把快照交给同步组合。跨目录引用在快照冻结后校验；运行中不 reload、
不热替换、不自动重连。连接状态可以变化，目录身份不能变化。

## 第五步：先定测试与文档

- 依赖边界测试：包只允许 import 其声明依赖；
- 离线 fake 端口测试：不依赖网络、数据库、密钥或真实终端；
- 在 `docs/architecture/packages/` 增加一个包页面，写明职责、世界访问权、组合实例与 ops 入口。

只加完成真实用例所需的窄端口。协议自己的 task 或回调也不能绕过 AgentTree。
