---
order: 6
---

# 质量与验收

本页记录现行质量基线与架构验收标准。设计思想见 `RFC 0300`。

## 代码质量

- Python 3.12；使用 uv；Ruff 行宽 120、LF、双引号；公开 API 有类型注解；值对象优先 frozen + slots dataclass。
- 主源码文件不超过 500 行；核心代码不通过 lint ignore 隐藏复杂度。
- 测试以公开行为为主，不复制实现内部状态机。

## 架构验收

最小架构完成必须同时满足：

1. 可创建只有 root 的 AgentTree，并完成一次 message → assistant 循环；
2. assistant Tool call 可获得 tool 结果并继续到最终 assistant；
3. `aur.agent.delegate` 与其他 Tool 一样存在于注册表和模型请求的原生 tools 字段中；其 call 可创建 child，child 完成后正确恢复 parent，最终完成 root；engine 不按该工具名分派；
4. root 与 child 都从预定义 AgentDefinition 创建；两个定义可以共享 prompt 而使用不同 model/tools，delegate 只能选择 parent allowlist 内的 child definition；
5. PromptAssembler 只产生 system、message、assistant、tool 四种领域 role，Provider adapter 单独测试 message → user 映射；
6. 非法树、非法角色顺序、重复或错配 call id、越界上下文都在效果发生前失败；
7. 除 WorldJournal 的临时 SQLite 集成测试外，fake Model 与 fake Tool 可在无网络、无环境变量时跑通测试；
8. 当前 Python runtime 不再导入已移除的生产化子系统，活动架构文档不再把它们描述为现行能力。
9. fake Model 下可通过 Console 完成普通文本 → AgentTree → assistant → 终端输出；`/help`、`/clear`、`/quit` 作为本地命令不进入组合内核；
10. `aurora start --headless` 与 Console 模式共享同一组合和停止路径，测试不依赖网络、密钥或真实终端；
11. 终端输入在分派前产生 `console.input` 世界提交，所有观察或本地命令都不产生额外世界提交。
12. cadence 只通过 `TreeLaunchRequest` 唤起 AgentTree，memory 只以显式快照参数进入 PromptAssembler，两者均有独立离线测试。
13. 项目依赖 MCP Python SDK 2.x；现代测试 Server 协商 `2026-07-28`，旧修订版兼容测试仍由 SDK v2 完成并显式报告协商版本。
14. stdio 与 Streamable HTTP 均可在 App 的单一启动截止时间内完整分页发现 Tool；目录监听在首次分页前建立且没有重复接收路径，启动窗口发生变化时不冻结已知过期目录。任一启用 App 启动失败时逆序清理，且全部发现完成前不构造最终 registry/runner。
15. MCP Tool ID、object schema、重复项及 AgentDefinition 引用在效果发生前校验；运行中 catalog 变化不修改 registry 或 node，只报告需重启。
16. `org.aurorabot/tool-contract` 只在双方严格协商 `{"version": 1}` 后解释 Tool / CallToolResult `_meta`；默认 App scope、顶层参数 scope 模板的发现与调用前校验，以及 succeeded/failed/unknown 到 tool 消息和世界因果的映射均有离线测试。
17. MCP 内部超时或下游断线可通过结果 `_meta` 明确产生 unknown，Host 保留 unknown 且不自动重试；只有明确拒绝或无效果错误产生 failed，非文本结果在当前契约下明确失败。
18. 经双方严格协商的 Aurora 事件扩展只在协商完成后追加 World，不直接启动树或写 transcript；当前 Streamable HTTP 不允许 `world_events`，测试不声称 best-effort 通知已经送达。sampling、elicitation、roots 和 Tasks 不会触发模型、用户或独立任务旁路。
19. HTTPS 重定向逐跳验证并拒绝降级到 HTTP；stdio 子进程不继承未授权密钥；依赖边界测试确认没有 `src/platform`、AMP、Task 或七端口回流。
20. `logging.toml` 在 World/MCP 启动效果前配置统一终端与轮转文件 logger；核心运行包的启动、结束、失败和效果未知路径有日志行为测试，且测试确认消息正文、Prompt、Tool 参数/结果、模型载荷、环境变量值与世界 data 不会进入项目日志。
