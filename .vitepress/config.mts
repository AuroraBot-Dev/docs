import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "AuroraBot 文档站",
    description: "AuroraBot — 以因果事件、同构 Agent 和主动节律为核心的自主智能体框架",
    base: "/",
    cleanUrls: true,
    lastUpdated: true,
    ignoreDeadLinks: false,
    srcExclude: ["README.md", "README.*.md"],
    head: [
      [
        "link",
        { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
      ],
    ],
    mermaid: {
      theme: "default",
      securityLevel: "loose",
      look: "handDrawn",
      startOnLoad: false,
      flowchart: {
        curve: "basis",
      },
    },
    markdown: {
      container: {
        tipLabel: "💡 小贴士",
        warningLabel: "⚠️ 注意",
        dangerLabel: "💀 危险操作",
        infoLabel: "🪧 告示牌",
        detailsLabel: "展开",
      },
    },
    themeConfig: {
      nav: [
        { text: "首页", link: "/" },
        { text: "开始", link: "/start/getting-started" },
        { text: "架构", link: "/architecture/system-overview" },
        { text: "开发", link: "/develop/app-development" },
        { text: "Nightly 状态", link: "/reference/nightly-status" },
      ],
      sidebar: [
        {
          text: "开始使用",
          items: [
            { text: "认识 AuroraBot", link: "/start/overview" },
            { text: "快速开始", link: "/start/getting-started" },
            { text: "配置", link: "/start/configuration" },
            { text: "运行与操作", link: "/start/operations" },
            { text: "Web 管理面板", link: "/start/panel" },
            { text: "本地预览文档", link: "/start/offline-docsite" },
          ],
        },
        {
          text: "架构",
          items: [
            { text: "系统总览", link: "/architecture/system-overview" },
            { text: "事件与运行时", link: "/architecture/event-runtime" },
            { text: "同构 Agent", link: "/architecture/agent-system" },
            { text: "记忆系统", link: "/architecture/memory-system" },
            { text: "MCP Platform", link: "/architecture/platform-runtime" },
            { text: "Ops 与持久化", link: "/architecture/operations-storage" },
          ],
        },
        {
          text: "扩展与开发",
          items: [
            { text: "MCP App 开发", link: "/develop/app-development" },
            { text: "Agent 扩展", link: "/develop/agent-development" },
            { text: "AMP 事件协议", link: "/develop/amp" },
            { text: "CLI 参考", link: "/develop/aur-cli" },
            { text: "参与开发", link: "/develop/contributing" },
          ],
        },
        {
          text: "参考",
          items: [
            { text: "Nightly 实现状态", link: "/reference/nightly-status" },
            { text: "常见问题", link: "/reference/faq" },
          ],
        },
      ],
      search: {
        provider: "local",
      },
      socialLinks: [
        { icon: "github", link: "https://github.com/AuroraBot-Dev/AuroraBot" },
      ],
      outline: {
        label: "本页内容",
      },
      docFooter: {
        prev: "上一页",
        next: "下一页",
      },
      lastUpdated: {
        text: "最后更新",
        formatOptions: {
          dateStyle: "short",
          timeStyle: "medium",
        },
      },
      footer: {
        message: "Built with VitePress",
        copyright: "Copyright © JuFireX | AuroraBot-Dev",
      },
    },
  }),
);
