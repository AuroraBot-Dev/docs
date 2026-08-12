---
layout: home

hero:
  name: AuroraBot
  text: 让 Agent 拥有自己的生活
  tagline: 因果事件 · 同构协作 · 主动节律
  image:
    src: /logo.svg
    alt: AuroraBot Logo
  actions:
    - theme: brand
      text: 快速开始
      link: /start/getting-started
    - theme: alt
      text: 架构总览
      link: /architecture/system-overview
    - theme: alt
      text: Nightly 状态
      link: /reference/nightly-status

features:
  - title: 事件平权
    details: 用户消息、应用事件、时间变化、工具回执和子 Agent 报告都通过 AMP 进入同一条因果链。
  - title: 同构 Agent
    details: Triage、Fast、Root、Worker 与 Memory 共享同一种上下文、权限和决策契约，以有界监督树协作。
  - title: 判断与效果分离
    details: 模型提出决策，Engine 校验能力与预算，真实环境效果只由获权 ToolExecutor 执行。
  - title: 可持续运行
    details: Inbox 防抖、持久化 Activity、会话 revision、崩溃恢复和 SQLite 终态共同维持运行连续性。
  - title: MCP 原生扩展
    details: 本地 stdio 与远程 Streamable HTTP MCP Server 可动态提供工具，并把环境通知归一化为事件。
  - title: 可观察、可审计
    details: Console、Ops 和 Panel 读取同一份因果事件与输出流，不在热路径外复制第二套状态。
---
