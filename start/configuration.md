---
order: 3
---

# 配置

当前读取三份职责独立的配置：

- `config/runtime.toml`：root node id、profile、model 和可见 Tool 名称；
- `config/engine.toml`：深度、节点数和循环步数上界；
- `config/prompt.toml`：字符上界、全局 system 片段和 profile prompt 映射。

每个 TOML 由 `aurora.configuration` 中的同名模块定义 DTO、解析并注册。全部值按显式注册顺序合并为一个
`AuroraConfig`。增加配置只需要一个 TOML、一个同名 Python 模块和目录入口中的一条注册记录。

model 必须显式写入节点和 ModelRequest。profile 只决定提示词，不决定模型。child 由 delegate call 显式指定 profile、model、
tools 和 instruction。
