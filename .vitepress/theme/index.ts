import DefaultTheme from "vitepress/theme";
import type { EnhanceAppContext } from "vitepress";
import Layout from "./Layout";
import "./custom.css";
import "@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css";
import type { Options } from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import { InjectionKey } from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import { defaultZhCNLocale } from "@nolebase/vitepress-plugin-enhanced-readabilities/locales";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp(ctx: EnhanceAppContext) {
    DefaultTheme.enhanceApp?.(ctx);
    ctx.app.provide(InjectionKey, {
      spotlight: {
        defaultToggle: true,
      },
      locales: {
        "zh-CN": defaultZhCNLocale,
      },
    } as Options);
  },
};
