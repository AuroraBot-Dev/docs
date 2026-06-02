---
layout: home

hero:
  name: AuroraBot
  text: 新一代内驱式、自主决策的智能体框架
  tagline: 声明式认知拓扑 · 三级联合记忆 · 统一 LLM 网关
  image:
    src: /logo.svg
    alt: AuroraBot Logo
  actions:
    - theme: brand
      text: 快速开始
      link: /start/getting-started.html
    - theme: alt
      text: 架构总览
      link: /architecture/system-overview.html
    - theme: alt
      text: 应用开发
      link: /develop/app-development.html

features:
  - icon: 🌊
    title: 双池认知架构 (Pool A / Pool B)
    details: Pool A 维护第一人称"自我之流" (now.md)，Pool B 以 JSON 文件驱动无状态路由与派发。两池之间由 Internalizer 和 Externalizer 两个转义者桥接。
  - icon: 🧠
    title: 文件驱动认知管道
    details: Node / Agent / Router 节点通过 FileEventBus 事件总线协作，topology.yaml 声明式配置邻接关系，文件落盘自动触发下游节点。
  - icon: 📔
    title: 三级联合记忆 + 自我之流
    details: L1 工作记忆 / L2 情景记忆 / L3 语义记忆，通过 UnifiedMemoryManager 统一存取。自我之流 (SelfStream) 提供第一人称叙事式记忆载体。
  - icon: 🤖
    title: 多角色统一模型网关
    details: 基于 litellm 的 ModelGateway，支持 fast / quality / multimodal / embedding 多角色，流式打断、费用追踪、异常分类。
  - icon: ⏱️
    title: 节律系统
    details: HeartbeatGenerator + TimerScheduler 构成自主节律环路，她感知时间流逝——整点、早晨、深夜——如同另一种感官。
  - icon: 🧩
    title: App 插件体系
    details: 每个 App 通过 manifest.yaml 声明能力，PlatformAPI 统一交互，按需启用。
---
