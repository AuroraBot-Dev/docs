---
order: 3
---

# 配置

当前只读取 `config/aurora.toml`：

- `[root]`：root node id、profile、model 和可见 Tool 名称；
- `[runner]`：深度、节点数、循环步数和 prompt 字符上界；
- `[prompt].system`：全局 system 片段；
- `[prompt.profiles]`：profile id 到局部 system prompt 的映射。

model 必须显式写入节点和 ModelRequest。profile 只决定提示词，不决定模型。child 由 delegate call 显式指定 profile、model、
tools 和 instruction。

`config/apps.toml` 是收核前遗留且尚未迁移的用户配置，当前 runtime 不读取它。
