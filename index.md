---
layout: home

hero:
  name: AuroraBot
  text: 一棵 AgentTree，一次完整运行
  tagline: 同构节点 · 四角色上下文 · 树形委派
  image:
    src: /logo.svg
    alt: AuroraBot Logo
  actions:
    - theme: brand
      text: 认识当前核心
      link: /start/overview
    - theme: alt
      text: 架构总览
      link: /architecture/system-overview
    - theme: alt
      text: 唯一 RFC
      link: /rfc/0300-unified-architecture-and-contracts

features:
  - title: 一棵树就是一次运行
    details: AgentTree 直接表达 root、children、消息、工具往返和最终结果，不再由多套运行状态间接拼合。
  - title: 节点结构同构
    details: root 与 child 使用同一种循环，只因 system profile、初始 message、可见 tools 和 LLM model 不同。
  - title: 四角色上下文
    details: 核心只承认 system、message、assistant 和 tool；Provider adapter 才处理供应商角色差异。
  - title: 显式项目组合
    details: 每个 TOML 和项目组件都有同名注册模块，统一构造 AuroraConfig、AgentTreeRunner 和 AuroraRuntime。
---
