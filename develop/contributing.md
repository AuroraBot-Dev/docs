---
order: 2
---

# 参与开发

保持 `contracts ← prompt/ai ← engine ← aurora` 依赖方向。公共语义先更新 RFC；测试必须离线、确定，不依赖数据库、环境变量或
真实模型额度。

提交前运行：

```bash
uv run aurora check
```

当前优先接受 AgentTree 反例、四角色兼容性、不同模型/工具适配和组合边界方面的改进。
