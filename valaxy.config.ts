import type { UserThemeConfig } from "valaxy-theme-yun";
import { defineValaxyConfig } from "valaxy";

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
      // {
      //   name: '我的小伙伴们',
      //   url: '/links/',
      //   icon: 'i-ri-genderless-line',
      //   color: 'dodgerblue',
      // },
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

  unocss: { safelist },
});
