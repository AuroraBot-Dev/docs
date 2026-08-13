import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { withSidebar, generateSidebar } from "vitepress-sidebar";

export default withSidebar(
  withMermaid(
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
      vite: {
        optimizeDeps: {
          exclude: [
            "@nolebase/vitepress-plugin-enhanced-readabilities/client",
            "vitepress",
            "@nolebase/ui",
          ],
        },
        ssr: {
          noExternal: [
            "@nolebase/vitepress-plugin-enhanced-readabilities",
            "@nolebase/ui",
          ],
        },
      },
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
  ),
  {
    documentRootPath: "/",
    scanStartPath: "/",
    resolvePath: "/",
    useTitleFromFileHeading: true,
    useTitleFromFrontmatter: true,
    useFolderTitleFromIndexFile: true,
    useFolderLinkFromIndexFile: true,
    includeFolderIndexFile: true,
    sortMenusByFrontmatterOrder: true,
    frontmatterOrderDefaultValue: 1000,
    excludeByGlobPattern: [
      ".vitepress/**",
      "node_modules/**",
      "assets/**",
      "public/**",
      "README*",
    ],
  },
);
