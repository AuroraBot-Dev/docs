---
title: 快速开始
description: 从环境准备到启动运行，快速把 AuroraBot 跑起来。
order: 2
---

# 快速开始

从环境准备到启动运行，快速把 AuroraBot 跑起来。

::: info
此版本暂时只支持从源码运行. 后期会提供一键包安装.
:::

## 前期准备

- `Python >=3.12, <3.13`

::: info
当前仅支持 Python 3.12 版本. 理论将支持 Python 3.12 以上所有版本.
:::

## 克隆仓库

```bash
git clone https://github.com/AuroraBot-Dev/AuroraBot.git
cd AuroraBot
```

::: tip
或者你可以通过 [Releases](https://github.com/AuroraBot-Dev/AuroraBot/releases) 下载最新稳定版本的源码压缩包, 并解压到 `AuroraBot` 目录下.
:::

## 安装依赖

我们推荐使用 [uv](https://github.com/astral-sh/uv) 管理依赖:

```bash
pip install uv
uv sync
```

::: tip
如果你的网络环境不好导致 `pip` 下载缓慢, 你可以尝试使用以下命令来加速下载:

```bash
pip install uv -i https://pypi.tuna.tsinghua.edu.cn/simple
uv sync
```

:::

## 配置密钥

```bash
cp .env.example .env
```

::: tip 配置模型和密钥
在 `.env` 中配置你的模型和密钥. 其中快速模型是必须的, 其他模型可以根据需要配置.

```
# 模型配置
LLM_GATEWAY_FAST_MODEL=openai/gpt-4o-mini
LLM_GATEWAY_QUALITY_MODEL=openai/gpt-4o
LLM_GATEWAY_MULTIMODAL_MODEL=openai/gpt-4o
LLM_GATEWAY_EMBEDDING_MODEL=openai/text-embedding-3-small
LLM_GATEWAY_RERANKER_MODEL=

# 密钥配置
OPENAI_API_KEY=sk-your-key-here
```

:::

::: tip
如果你使用的模型并非 OpenAI 模型, 那么请确保配置了正确的密钥. 比如一个可能的有效配置如下:

```
# 模型配置
LLM_GATEWAY_FAST_MODEL=deepseek/deepseek-v4-flash
LLM_GATEWAY_QUALITY_MODEL=deepseek/deepseek-v4-pro
LLM_GATEWAY_MULTIMODAL_MODEL=xiaomi_mimo/mimo-v2.5-pro
LLM_GATEWAY_EMBEDDING_MODEL=siliconflow/BAAI/bge-m3
LLM_GATEWAY_RERANKER_MODEL=

# 密钥配置
DEEPSEEK_API_KEY=sk-xxx
SILICONFLOW_API_KEY=sk-xxx
XIAOMI_MIMO_API_KEY=sk-xxx
OPENAI_API_KEY=
```

:::

::: tip
更多模型提供商/模型列表见 [Litellm](https://docs.litellm.ai/docs/providers)
:::

::: tip
更多配置说明见 [配置说明](./configuration)
:::

## 启动Bot

```bash
uv run bot.py
```

::: tip
此时你的Bot将会以默认人格**小光**启动。启动后你可以直接在命令行(localhost)中与她对话:

- 直接输入文字即可向小光发送消息
- 输入 `/help` 查看可用命令
- 输入 `/quit` 退出

无需任何应用或适配器即可在控制台中体验完整的认知管线！
:::

::: tip
如果想接入 QQ，可以启动你的应用适配器，例如 [NapCat](https://github.com/NapNeko/NapCatQQ)。由于 AuroraBot 基于 NoneBot2 框架，你可以参考 [NapCat 官方文档](https://napneko.github.io/use/integration#nonebot) 来对接 NapCat 适配器。
:::

::: info
框架第一适配 NapCat 适配器。其他适配器将在后续测试后逐渐开放。
:::
