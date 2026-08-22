---
order: 6
---

# src/prompt

四角色上下文的唯一组装点。engine 不自己拼 prompt，prompt 也不执行模型、工具或记忆召回。

## 职责

- 输入 `AgentTree + node id`，输出下一次模型调用的四角色消息序列；
- 合并全局人格、世界说明与 node prompt 为唯一 system；
- child 的 system 注入局部职责，首条 message 注入 parent assignment；
- 校验角色顺序、Tool call 配对与上下文上界。

## 世界访问权

需要时通过 `WorldReader` 只读获得世界。当前组合保持 `PromptAssembler` 为纯函数，不注入 reader；
世界更新由 engine 以显式 delta message/tool 结果送入 transcript，保证模型看到的事实有审计路径。
若未来 prompt 直接读取世界，必须：

- 只依赖 `WorldReader`；
- 显式使用节点 `observed_frontier`；
- 组装结果保持确定性与可重放。

## 组合

- 实例键：`PROMPT_ASSEMBLER = InstanceKey[PromptAssembler]("prompt.assembler")`；
- 只依赖 contracts，不依赖任何具体实现。

## ops 入口

- `GET /prompts`、`/prompts`：全局 system 片段与全部 Agent prompt；
- `GET /prompts/{prompt_id}`、`/prompt`：单个 prompt 正文 JSON。
