---
order: 15
---

# 本地预览文档

文档站使用 VitePress 1.6、Mermaid 和本地搜索。

## 环境

- Node.js LTS；
- npm；
- Git。

## 克隆与安装

```bash
git clone https://github.com/AuroraBot-Dev/docs.git AuroraBot-docs
cd AuroraBot-docs
npm ci
```

## 开发服务器

```bash
npm run docs:dev
```

默认地址为 `http://127.0.0.1:5173`，开发脚本会监听 `0.0.0.0`。

## 生产构建

```bash
npm run docs:build
```

输出位于 `.vitepress/dist`。构建会校验站内链接；不要用忽略死链掩盖已经不存在的页面。

## 内容基准

文档事实按以下顺序核对：

1. 主仓库 [RFC 0300](https://github.com/AuroraBot-Dev/AuroraBot/blob/nightly/docs/rfc/0300-unified-architecture-and-contracts.md)；
2. nightly 当前 contracts、配置和测试；
3. `ARCHITECTURE.md`、`TECHNICAL.md`、README 与代码注释。

若模块尚未形成公共边界，文档应明确写“文档正在编写中”，不能用路线图设想冒充已实现功能。
