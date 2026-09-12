---
title: RFC 0302：微内核与模块协议
order: 12
---

# 0302：微内核与模块协议

状态：现行（已实施）

日期：2026-09-11

## 1. 动机

当前组合机制已经分层，但分层位置不彻底：

- `aurora/composer.py` 是纯机制——类型化实例键、`PackageSpec`/`ModuleSpec`、按依赖拓扑装配、`ManagedAssembly`
  生命周期，本身不含任何具体 `src` 子包名，却放在项目层 `aurora`。
- `aurora/composition/*` 才是项目策略——每个 `src` 包一个代表模块，读取 `aurora.configuration` 的 TOML 规格并构造实例。
- 每个能力都要在 `aurora/composition` 里再写一个代表模块，能力实现与它的装配描述分离；第三方无法在不修改宿主的情况下接入。

本 RFC 把**机制**下沉为 `src` 的无项目语义内核，让**能力在自身包里自描述**，把**装配策略彻底从 `aurora` 移除**：
`aurora` 只保留 CLI 命令分发与配置解析。内置能力与第三方插件走同一条声明式协议。

## 2. 目标与非目标

目标：

1. 组合机制下沉到 `src/kernel`，成为可被任何包（含第三方插件）依赖的叶子。
2. 每个能力在 `src/<pkg>` 内自描述：用装饰器声明“提供什么契约、需要什么契约、贡献什么、如何构造与何时激活”。
3. 启动前完成冲突裁决、缺失依赖检测、循环依赖检测与拓扑排序，失败即拒绝启动并给出诊断。
4. 内置能力与第三方插件使用同一协议；插件从 `./extensions/plugins/` 或 `aurorabot_plugin` entry point 接入，无需修改宿主。
5. `aurora` 不再持有任何运行时组合：只保留命令分发与配置解析。
6. 保留现有类型安全（以契约类型为能力身份，泛型读取）与“世界线是唯一媒介”。

非目标（本 RFC 明确不做）：

- 不引入第二套认知运行模型。微内核是**组合机制**，不是 Task、mailbox、Activity 或 continuation。
- 不引入通用事件总线。模块间同步协作靠注入的契约实例；事实变更只能经 `WorldJournal` 提交。
- 不引入 `transient` / `request` 作用域。当前只有进程内单例能力；没有真实用例前不注册变化轴。
- 不做运行时热插拔。装配在启动期完成，运行期冻结。
- 不做内核协议兼容性标志与版本协商；先按单一版本推进。
- 不改变 `AgentTree`、四角色消息、模型端口、工具端口、World 语义或配置 TOML 拓扑。

## 3. 内核边界

新增叶子包 `src/kernel`，职责只有机制：

- 能力身份与读取：以契约类型为键的类型化能力目录。
- 模块声明：`@module` 装饰器与 `ModuleSpec`。
- 解析与装配：冲突裁决、缺失依赖、环检测、拓扑排序。
- 生命周期：`prepare → construct → 冻结 Assembly → activate → run → close`。
- 发现：内置 `src` 源、本地插件目录源、entry point 源。

依赖约束：

- `src/kernel` 只依赖标准库、`src.utils` 与 `src.contracts`（仅取通用值类型，如 `ContributionKey`、`Settings`）。
- `src/kernel` 不 import 任何具体领域契约实现、`aurora` 或某个 `src` 功能包。
- 内核以 `type` 作为能力身份，不硬编码任何能力名称。

## 4. 能力身份与公共契约

能力身份就是 `src/contracts` 中定义能力的 `Protocol` 类型本身，例如 `Model`、`WorldReader`、`WorldWriter`、
`WorldJournal`、`MemoryReader`、`Tool`、`TreeLauncher`。模块通过契约类型声明依赖与提供，因此第三方只需依赖
`src.contracts` 就能实现或消费能力，无需引用宿主私有键对象。

- `src/contracts` 同时持有公共多值贡献点：`ContributionKey[T]` 值类型与具体贡献键（当前为 Tool 目录与
  `TreeLauncher` 绑定）。贡献键是稳定公共事实，第三方可向既有键追加同类型值。
- 读取能力使用泛型：`Capabilities.get[T](capability: type[T]) -> T`；可选依赖使用 `get_optional`。
  能力缺失是装配期错误，不是运行期 `KeyError`。
- 一个实例可实现多个契约：构造器返回同一对象，内核把它登记到该模块声明的全部 `provides` 类型下
  （例如同一 `WorldJournal` 同时作为 `WorldReader` 与 `WorldWriter`）。

## 5. 模块自描述

每个能力在 `src/<pkg>` 内用装饰器声明，能力实现与装配描述同处一包：

```python
# src/engine/module.py
from src.kernel import ModuleContext, module
from src.contracts import AgentCatalog, Model, PromptAssembler, ToolRegistry, WorldJournal, MemoryReader

@module(
    name="engine",
    provides=AgentTreeRunner,
    requires=(PromptAssembler, Model, AgentCatalog, ToolRegistry, WorldJournal, MemoryReader),
)
def build_engine(context: ModuleContext) -> AgentTreeRunner:
    config = context.settings.get(EngineConfig)
    return AgentTreeRunner(
        context.get(Model),
        context.get(PromptAssembler),
        context.get(AgentCatalog),
        context.get(ToolRegistry),
        world=context.get(WorldJournal),
        memory=context.get(MemoryReader),
        max_depth=config.max_depth,
        max_nodes=config.max_nodes,
        max_steps=config.max_steps,
    )

MODULE = build_engine
```

规则：

- `@module` 把一个构造器登记为 `ModuleSpec`；装饰器返回同一个 `ModuleSpec`，包内绑定为 `MODULE`。
- `provides` / `requires` / `contributes` / `consumes` 均为契约类型或贡献键，不用字符串。
- `register` 是构造入口，经 `ModuleContext.provide/contribute` 登记本模块产出的实例与贡献；内核在返回后校验
  `provides` 全部已登记，且每个能力只有唯一提供者。
- `consumes` 表示读取某个贡献点的完整冻结序列；内核据此自动依赖全部已发现贡献者，零贡献合法。
- `activation_after` 表达“构造无依赖、但激活顺序有依赖”的生命周期关系，与 `requires` 分开解析。
- 纯副作用模块允许 `provides=()`；不提供任何能力且无贡献的模块是配置错误。
- `prepare/activate/run/close` 与今天语义一致：`prepare` 在 `register` 前并可返回清理函数；`activate` 在
  Assembly 冻结后按 `activation_after` 执行；`run` 由统一生命周期以后台任务运行；`close` 逆序执行。

## 6. 解析与装配

1. 收集全部 `ModuleSpec`，按 `name` 去重。
2. 构建 `provides` 目录；同一契约类型被多个模块提供时按 `priority` 降序裁决，平局立即失败并列出全部候选。
3. 校验每个非可选 `requires` 都有提供者；缺失即失败并输出 `模块 → 缺失契约`。可选模块在缺失时整体跳过。
4. 由 `requires` 与 `consumes` 构建有向图并 Kahn 拓扑排序；检测到环时输出完整环路。
5. 按序执行 `prepare`（可返回清理函数）与 `register`；冻结唯一 `Assembly`。
6. `activate` 按 `activation_after` 扩展后的拓扑序执行；`run` 以后台任务启动。
7. `close` 先取消后台任务，再逆序执行模块 `close` 与 `prepare` 清理。`prepare` 失败回滚已构造模块。

诊断要求：冲突输出候选与优先级，缺失输出模块与契约，环输出完整环路，启动失败输出失败模块、异常与已启动模块列表。

## 7. 发现源

```python
class DiscoverySource(Protocol):
    def discover(self) -> Iterable[ModuleSpec]: ...
```

- `BuiltinSource`：扫描随 AuroraBot 安装的 `src` 功能包，读取每个包暴露的唯一 `MODULE`。
- `DirectorySource`：扫描项目内被 Git 忽略的 `./extensions/plugins/`，加载本地插件。
- `EntryPointSource`：读取 `aurorabot_plugin` entry point 组，加载每个指向 `MODULE` 的对象。

确定性：内置源按包名排序；目录源按路径排序；entry point 按名称排序。发现顺序只影响同优先级冲突的报告顺序，
不产生隐式覆盖；跨源冲突仍必须由 `priority` 显式裁决。第三方插件在进程内与宿主同权限运行，这是有意的信任
边界，不做进程隔离。

## 8. 配置边界

- `aurora` 只负责配置解析：把 `config/` 下的 TOML 加载为只读配置对象，并暴露只读目录供 `aurora config`
  观察。`aurora` 不构造任何运行期实例，也不持有装配逻辑。
- 配置 DTO 定义在 `src/<pkg>`（能力自己的配置形状），`aurora.configuration` 的解析模块引用这些 DTO 把
  TOML 转成值；模块通过 `context.settings.resolve(DtoType)` 读取自己的配置。这样模块自描述配置形状，而解析
  机制仍在 `aurora`。
- `Settings` 是 `src.contracts` 中的只读配置访问契约，由内核注入 `ModuleContext`；`src` 功能包与内核不
  import `aurora.configuration`，项目 TOML 字段名不进入 `src`。

> 决策点：配置 DTO 与 TOML spec 的归属见第 14 节。本节按“DTO 在 src、解析在 aurora”推荐方案书写。

## 9. 进程门面与启动

- 进程门面（今天的 `aurora/runtime`）下沉为 `src/runtime`，自描述为一个消费 runner、agents、console、
  world 与 `TreeLauncher` 绑定贡献、提供运行期门面工厂的模块。
- `aurora/commands/start.py` 只做：读取 `.env`、加载配置、应用日志、调用 `src` 的装配入口、管理停止事件与
  SIGINT/SIGTERM。命令层不持有协作者清单，也不写装配分支。
- 启动准备不产生世界提交；由模块声明得到的顺序必须等价于：world 初始化 → MCP 连接/发现与 Tool 贡献冻结 →
  ToolRegistry 冻结 → AgentDefinition 跨目录校验 → Assembly 完成 → cadence cursor 固定 → MCP 业务事件入口
  激活 → cadence 后台启动。

## 10. 依赖方向与布局变更

```text
src/utils  src/contracts          ← 叶子（内核与任何包可用）
src/kernel                         ← 组合机制叶子
src/<pkg>                          ← 能力实现 + 自描述模块 + 配置 DTO
src/runtime                        ← 进程门面（自描述模块）
aurora/commands, aurora/config*, aurora/main, aurora/utils  ← 命令分发与配置解析
```

- `aurora/composer.py`、`aurora/composition/`、`aurora/contributions.py`、`aurora/runtime/` 删除。
- `src` 不 import `aurora`。

## 11. 对 RFC 0300 的修订

本 RFC 生效时，同时修订 `0300-unified-architecture-and-contracts.md`：

- §10 包边界表：新增 `src/kernel` 与 `src/runtime`；删除 `aurora.composer`/`aurora.composition`/`aurora.runtime`。
- §10 增长边界：`aurora` 只保留命令、配置与项目工具；装配改述为“能力自描述 + 内核装配”。
- §10 自动发现段：删除“不读取 entry point、用户路径或第三方 manifest”，改为本 RFC 第 7 节的发现源。
- §12 当前范围之外：删除“面向第三方的扩展注册表”与“内部 PackageSpec 不构成第三方插件协议”，改为
  “第三方插件协议见 0302；仍不包含通用事件总线、作用域与热插拔”。

## 12. 迁移步骤

1. 抽出 `src/kernel`：把 `aurora/composer.py` 的机制泛化为以契约类型为键，`AuroraAssembly` 泛化为
   `Assembly`，`CompositionContext` 泛化为 `ModuleContext`，并实现 `@module` 装饰器与发现源。
2. 把公共贡献键移入 `src/contracts`，删除 `aurora/contributions.py`。
3. 把 `aurora/composition/*` 的构造逻辑搬回各自 `src/<pkg>/module.py`，实例键改为契约类型，绑定 `MODULE`。
4. 把配置 DTO 下沉到 `src/<pkg>`，`aurora.configuration` 改为引用 DTO；`Settings` 由 `aurora.config` 适配注入。
5. 把 `aurora/runtime/` 下沉为 `src/runtime`，并让 `aurora/commands/start.py` 只调用装配入口。
6. 更新 `tests/test_dependency_boundaries.py`：允许集加入 `src.kernel`、`src.runtime`，移除 `aurora.composer`/
   `aurora.composition`/`aurora.runtime`。
7. 增加本地插件目录与 `aurorabot_plugin` entry point 发现、冲突/缺失/环诊断的离线测试。

## 13. 验收标准

- [ ] `src/kernel` 运行时只依赖 `src.utils` 与 `src.contracts`，无领域实现 import。
- [ ] `aurora` 不再包含任何运行期组合或协作者清单，只保留命令、配置与项目工具。
- [ ] 每个 `src/<pkg>` 自描述唯一 `MODULE`；能力身份是契约类型，无字符串能力键。
- [ ] 依赖边界测试确认 `src` 不导入 `aurora`。
- [ ] 新增第三方插件无需修改宿主代码即可经 `./extensions/plugins/` 或 `aurorabot_plugin` 接入。
- [ ] 冲突、缺失依赖、循环依赖在启动前失败并输出可定位诊断。
- [ ] 不存在通用事件总线、非单例作用域、运行时热插拔或内核版本协商。
- [ ] `uv run aurora check --fix` 与全部离线测试通过。

## 14. 已定决策

- 配置归属采用方案 B：配置 DTO 下沉 `src/<pkg>`，TOML spec 留在 `aurora.configuration`；解析在 `aurora`、
  类型在 `src`，模块经 `context.settings.get(DtoType)` 读取。
- 每个 `src/<pkg>` 在 `module.py` 定义并导出唯一 `MODULE`，`__init__` 不感知组合；内置源扫描
  `src.<pkg>.module`。
- `./extensions/plugins/` 与 `aurorabot_plugin` entry point 的发现细节在实现时补充；命名冲突一律失败并报告，
  不做隐式覆盖。
