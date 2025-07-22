import type { UserThemeConfig } from "valaxy-theme-yun";
import { defineValaxyConfig } from "valaxy";
import { addonWaline } from "valaxy-addon-waline";

// add icons what you will need
const safelist = ["i-ri-home-line"];

/**
 * User Config
 */
export default defineValaxyConfig<UserThemeConfig>({
  // site config see site.config.ts

  theme: "yun",

  themeConfig: {
    banner: {
      enable: true,
      title: "张小阳的小站",
    },

    pages: [
      {
        name: "分类",
        url: "/categories/",
        icon: "i-ri-apps-line",
        color: "dodgerblue",
      },
      {
        name: "标签",
        url: "/tags/",
        icon: "i-ri-bookmark-3-line",
        color: "dodgerblue",
      },
      {
        name: '我的小伙伴们',
        url: '/links/',
        icon: 'i-ri-group-fill',
        color: 'dodgerblue',
      },
      // {
      //   name: '喜欢的女孩子',
      //   url: '/girls/',
      //   icon: 'i-ri-women-line',
      //   color: 'hotpink',
      // },
    ],

    footer: {
      since: 2025,
      powered: false,
      beian: {
        enable: true,
        icp: "黑ICP备2025035182号",
      },
      icon: {
        enable: true,
        // name: "i-ri-heart-line",
        animated: true,
        color: "#d69b54",
        url: "https://zzyang.top", //图标链接
        title: "首页", //鼠标悬停注释
      },
    },
  },
  siteConfig: {
    // 启用评论
    comment: {
      enable: true,
    },
  },
  // 设置 valaxy-addon-waline 配置项
  addons: [
    addonWaline({
      serverURL: "https://waline-pi-red.vercel.app/",
    }),
  ],

  unocss: { safelist },
});
