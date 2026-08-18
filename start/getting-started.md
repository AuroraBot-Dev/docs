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
cp -r config.example config
uv run aurora check
uv run aurora about
uv run aurora start
```

`aurora start` 会先读取项目根目录的 `.env`，但不会覆盖进程已有环境变量；随后从 `models.toml` 创建 LiteLLM 模型
网关，密钥只从 provider 声明的环境变量读取。普通文本启动一棵新 AgentTree；输入 `/help` 查看操作，输入 `/exit`
停止。测试和嵌入应用仍可通过
`assemble_runtime(configuration, model, tools)` 注入 fake 或自定义 Model 与 Tool。
