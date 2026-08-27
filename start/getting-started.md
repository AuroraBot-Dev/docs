---
title: 快速开始md
order: 1
---

# 快速开始

::: info
此版本暂时只支持从源码运行. 后期会提供一键包安装.
:::

## 前期准备

- Python 3.12+
- Git
- [uv](https://docs.astral.sh/uv/)

## 克隆仓库

```bash
git clone https://github.com/JuFireX/AuroraBot.git
cd AuroraBot
```

::: tip
或者你可以通过 [Releases](https://github.com/JuFireX/AuroraBot/releases) 下载最新稳定版本的源码压缩包, 并解压到 `AuroraBot` 目录下.
:::

## 快捷安装

```bash
./scripts/linux/setup.sh
# macOS: ./scripts/macos/setup.command;
# Windows: .\scripts\windows\setup.ps1.
```

`setup.sh` 会把 aurora 安装到用户工具目录，并完成依赖同步、个人配置以及 docs/panel 子模块引导。

## 配置密钥

::: tip
在 `.env` 中配置你的密钥:

```
DEEPSEEK_API_KEY=
# XIAOMI_MIMO_API_KEY=
# OPENAI_API_KEY=
# SILICONFLOW_API_KEY=
```

更多配置说明见 [配置](./configuration)
:::

## 启动Bot

```bash
aurora start
```

此时你的Bot将会以默认人格`小光`启动，直接输入消息即可对话；输入 `/help` 查看操作，输入 `/exit` 停止。
