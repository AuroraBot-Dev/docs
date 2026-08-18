---
order: 2
---

# 安装与验证

需要 Python 3.12、Git 和 uv：

```bash
git clone --branch nightly --single-branch https://github.com/AuroraBot-Dev/AuroraBot.git
cd AuroraBot
git submodule update --init
uv sync
uv run aurora check
uv run aurora about
```

核心没有运行时第三方依赖，也不会连接网络。实际应用通过 `assemble_runtime(configuration, model, tools)` 注入 Model 与 Tool。
