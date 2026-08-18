---
order: 2
---

# AgentTree

一棵 `AgentTree` 表示一次完整运行，拥有唯一 root 和由 parent id 连接的有限节点集合。节点结构相同，每个实例显式选择：

- `profile_id`：system prompt 的局部职责；
- `model`：本节点调用的 LLM；
- `tools`：本节点可见的 Tool 名称；
- 首条 `message`：外部输入或 parent assignment。

节点 transcript 只追加 message、assistant 和 tool。`PromptAssembler` 在每次模型调用前生成唯一 system，并把节点 transcript
接在其后。assistant 无 Tool call 时节点完成；普通 Tool call 返回 tool 消息；delegate call 创建 child。child 完成或失败后，
parent 获得同一 delegate call id 的 tool 消息并恢复。

model 是节点一等事实。同一 profile 的两个节点可以使用不同 LLM，Runner 和 Provider 不得从 profile 隐式推导 model。
