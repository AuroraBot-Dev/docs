import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import Layout from "./Layout";
import "./custom.css";
import "@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css";
import type { Options } from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import { InjectionKey } from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import { defaultZhCNLocale } from "@nolebase/vitepress-plugin-enhanced-readabilities/locales";

const theme: Theme = {
  extends: DefaultTheme,
  Layout,
  enhanceApp(ctx) {
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

export default theme;
