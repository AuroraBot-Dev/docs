---
title: 离线文档
description: 如何在本地查看文档站。
order: 4
---

# 离线文档

在本地查看文档站.

::: info
自从版本 `v0.0.4` 开始, 文档站已从主仓库分离. 你可以在 [此处](https://github.com/AuroraBot-Dev/docs) 查看文档仓库.
:::

## 前期准备

- `Node.js >=20`

## 克隆仓库

```bash
git clone https://github.com/AuroraBot-Dev/docs.git
cd docs
```

## 安装依赖

```bash
npm install
```

::: tip
如果你的网络环境不好导致 `npm` 下载缓慢, 你可以尝试使用以下命令来加速下载:

```bash
npm install --registry=https://registry.npmmirror.com
```

:::

## 启动文档站

```bash
npm run dev
```

::: tip
文档站默认启动在 `localhost:5173/` 上. 打开浏览器访问即可.
:::
