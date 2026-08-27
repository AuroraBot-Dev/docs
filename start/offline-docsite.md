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

1. nightly 分支的当前代码与测试；
2. `architecture/` 按包拆分的解释页、主仓库 README 与代码注释。

文档只描述已经实现的行为，不用路线图设想代替现状。
