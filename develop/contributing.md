# 参与开发

AuroraBot 当前工作树只描述现行实现。新设计必须融入唯一架构基准，不能再建立与现行系统并行的 Brain、Kernel、Node 或第二套运行时。

## 先读什么

1. 主仓库 `AGENTS.md`；
2. [RFC 0300](https://github.com/AuroraBot-Dev/AuroraBot/blob/nightly/docs/rfc/0300-unified-architecture-and-contracts.md)；
3. `ARCHITECTURE.md`；
4. 与改动对应的 contracts、实现和测试；
5. `ROADMAP.md` 中已登记的缺口。

优先级是 RFC 0300 > contracts 与测试 > 实施说明、README、配置样例和注释。

## 何时先改 RFC

以下变化必须先更新 RFC 0300：

- 模块与依赖边界；
- AMP、事件或 Tool receipt 语义；
- Task、Agent、Activity 或决策形状；
- 结构配置与 profile 规则；
- 扩展协议、模型调用或记忆边界；
- 数据权威、迁移和保留语义；
- 进程组合、Platform、Ops 或安全契约。

除非先修改治理规则，不新增并行编号 RFC。

## 改动入口

| 改动 | 首要位置 | 重点测试 |
| --- | --- | --- |
| 跨层 DTO / Port | `src/contracts` | 依赖与契约 |
| 决策语义 | contracts + Engine store | 原子性、授权、恢复 |
| 模型角色 | `src/ai/roles` | endpoint、能力与解析 |
| 主动能力 | `src/agents/capabilities` | 纯决策与执行回执 |
| MCP App | `apps.toml` / `extensions` | 工具发现、事件、生命周期 |
| Platform | contracts + platform + aurora | 组合、故障与清理 |
| Ops 操作 | contracts operation + ops | Console/REST 同构 |
| 数据库 | models + migration | 连续升级与失败回滚 |

## 代码边界

- Engine 只依赖 contracts 与 utils；
- Agent handler 只读 Context、只返回 Decision；
- Platform 不导入 Engine 或 Ops；
- Ops 不进入热路径；
- `src` 不导入 `aurora`；
- 阻塞 I/O 不占用 Engine 事件循环；
- 日志统一使用 `src.utils.logging.get_logger()`；
- 公开 API 提供类型注解，dataclass 优先 `slots=True`；
- 主源码文件原则上不超过 500 行。

## 环境

```bash
git clone --branch nightly https://github.com/AuroraBot-Dev/AuroraBot.git
cd AuroraBot
uv sync
```

Python 3.12 为推荐版本，项目声明支持 `>=3.12,<3.15`。

## 质量门

```bash
uv run aurora check
```

等价覆盖：

- Ruff lint；
- Ruff format check；
- Pyright standard；
- Pytest；
- `src`、`aurora`、`ops` coverage。

按风险增加定向测试。架构依赖、状态迁移、幂等、崩溃恢复、数据库迁移、Panel 认证、WebSocket 和工具效果必须有回归证据。

## 数据安全

测试不得读写仓库真实 `data/`。不要提交：

- `.env` 或 Provider 密钥；
- `data/ops/Token.txt`；
- 真实对话、Prompt 或 continuation；
- 本地 Runtime SQLite、日志和上传附件；
- App 私有 token 与配置。

数据库变化必须提供 `vN_vN+1` 连续迁移，不能让业务代码兼容读取多版列形状。

## 注释与文档

Python 注释和 docstring 只解释局部行为、原因和不变量，不引用具体 RFC 编号或章节。设计来源集中维护在 RFC、架构说明、技术说明和路线图。

公共文档必须：

- 只描述 nightly 当前实现或已接受契约；
- 明确区分“已实现”“受限”和“文档正在编写中”；
- 删除已废弃架构，不长期保留为现行导航中的历史归档；
- 使用可构建的站内链接；
- 给出能在干净环境复现的命令，并说明已知交付缺口。

文档站检查：

```bash
npm ci
npm run docs:build
```

## 当前阶段

0.5 alpha 已完成统一 Engine 主体，但长期运维、真实 MCP 故障注入、附件多模态、Sandbox、Speech 和稳定第三方分发仍未闭环。扩展新能力前，优先关闭 [Nightly 状态](../reference/nightly-status.md) 中已登记的正确性与交付缺口。
