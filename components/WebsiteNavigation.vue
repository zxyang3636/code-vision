<template>
  <!--
    网站导航组件，内置分类数据
    包含开发工具、博客论坛、学习资源等分类
    每个网站卡片支持tip标签、主题色等
  -->
  <div class="website-nav-container" :class="{ dark: appStore.isDark }">
    <!-- 遍历所有分类 -->
    <div v-for="category in websiteCategories" :key="category.name" class="nav-category">
      <!-- 分类标题 -->
      <div class="category-header">
        <h3 class="category-title">
          <i :class="category.icon" class="category-icon"></i>
          {{ category.name }}
        </h3>
        <p class="category-desc">{{ category.description }}</p>
      </div>

      <!-- 该分类下的网站网格 -->
      <div class="nav-grid">
        <a
          v-for="site in category.websites"
          :key="site.name"
          :href="site.url"
          target="_blank"
          class="nav-card-wrapper"
        >
          <div class="nav-card" :style="{ '--theme-color': site.themeColor || '#4f46e5' }">
            <!-- tip标签显示在右上角 -->
            <div
              v-if="site.tip"
              class="nav-tip"
              :class="`tip-${site.tip.type || 'info'}`"
            >
              {{ site.tip.text }}
            </div>

            <!-- 网站头像 -->
            <img :src="site.avatar" :alt="site.name" class="nav-avatar" />

            <!-- 网站信息内容 -->
            <div class="nav-content">
              <div class="nav-name">{{ site.name }}</div>
              <div class="nav-desc">{{ site.description }}</div>
            </div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 引入Valaxy的store来支持暗黑模式
import { useAppStore } from "valaxy";

// 实例化store
const appStore = useAppStore();

// 定义tip的数据结构
interface SiteTip {
  text: string;           // tip显示的文字
  type: 'info' | 'success' | 'warning' | 'error' | 'hot' | 'new'; // tip类型
}

// 定义网站导航的数据结构
interface WebsiteItem {
  name: string;           // 网站名称
  url: string;            // 网站链接
  avatar: string;         // 网站头像/logo
  description: string;    // 网站描述
  themeColor?: string;    // 主题色（可选，默认为蓝色）
  tip?: SiteTip;         // tip信息（可选）
}

// 定义分类的数据结构
interface WebsiteCategory {
  name: string;           // 分类名称
  description: string;    // 分类描述
  icon: string;           // 分类图标类名
  websites: WebsiteItem[]; // 该分类下的网站列表
}

// 定义所有分类和网站数据，基于data.ts中的真实数据
const websiteCategories: WebsiteCategory[] = [
  {
    name: "实用工具",
    description: "助力开发人员和IT工作者的实用工具集合",
    icon: "i-ri-tools-line",
    websites: [
      {
        name: "IT - Tools",
        url: "https://tools.ytdevops.com/",
        avatar: "https://tools.ytdevops.com/logo.png",
        description: "助力开发人员和IT工作者",
        tip: { text: "工具集", type: "success" }
      },
      {
        name: "JSON Editor Online",
        url: "https://jsoneditoronline.org/#",
        avatar: "/TBeeCjRH.png",
        description: "JSON编辑器在线工具",
        tip: { text: "JSON编辑", type: "info" }
      },
      {
        name: "在线云转换",
        url: "https://cloudconvert.com/",
        avatar: "https://cloudconvert.com/images/logo_flat_110_borderless.png",
        description: "CloudConvert 是一款在线文件转换器",
        tip: { text: "转换神器", type: "warning" }
      },
      {
        name: "JSON在线解析",
        url: "https://www.json.cn",
        avatar: "/TBeeCjRH.png",
        description: "JSON 在线解析及格式化验证"
      },
      {
        name: "菜鸟工具",
        url: "https://www.jyshare.com/",
        avatar: "/JYSHARE-COM.png",
        description: "不止于工具"
      },
      {
        name: "PDF24 Tools",
        url: "https://tools.pdf24.org/zh/",
        avatar: "https://tools.pdf24.org/static/img/pageIcons/svg/default.svg?v=5cae54fd",
        description: "免费且易于使用的在线PDF工具"
      }
    ]
  },
  {
    name: "社区论坛",
    description: "开发者交流学习的社区平台",
    icon: "i-ri-team-line",
    websites: [
      {
        name: "GitHub",
        url: "https://github.com",
        avatar: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/1c/67/ac/1c67accb-02dc-aedc-cd63-6896a5abdf43/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/230x0w.webp",
        description: "全球最大开源社区",
        tip: { text: "Top1", type: "hot" }
      },
      {
        name: "Gitee",
        url: "https://gitee.com",
        avatar: "/GITEE-copy.png",
        description: "国内开源社区"
      },
      {
        name: "CSDN",
        url: "https://csdn.net",
        avatar: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/31/bc/28/31bc28c0-ec9c-8ae3-be57-7450b35d1063/AppIcon-0-1x_U007emarketing-0-7-0-0-sRGB-85-220-0.png/230x0w.webp",
        description: "CSDN——专业技术平台，成就一亿技术人",
        tip: { text: "国内最常见", type: "info" }
      },
      {
        name: "博客园",
        url: "https://www.cnblogs.com/",
        avatar: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/d4/a1/65/d4a1655f-51e4-4a50-884e-72c99a393959/AppIcon-1x_U007emarketing-0-7-0-85-220-0.png/230x0w.webp",
        description: "代码改变世界 Coding Changes the World",
        tip: { text: "老牌社区", type: "info" }
      },
      {
        name: "稀土掘金",
        url: "https://juejin.cn/",
        avatar: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/7f/65/e3/7f65e329-9603-d575-11b7-528cfa0b8bb8/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/230x0w.webp",
        description: "一个帮助开发者成长的社区"
      },
      {
        name: "知乎",
        url: "https://www.zhihu.com",
        avatar: "https://static.zhihu.com/heifetz/favicon.ico",
        description: "有问题，就会有答案",
        tip: { text: "知识问答", type: "info" }
      }
    ]
  },
  {
    name: "后端开发",
    description: "后端开发相关的技术栈和工具",
    icon: "i-ri-server-line",
    websites: [
      {
        name: "Docker Hub",
        url: "https://hub.docker.com/",
        avatar: "https://www.docker.com/favicon.ico",
        description: "Docker Hub容器镜像库 | 应用容器化"
      },
      {
        name: "Hutool",
        url: "https://www.hutool.cn/",
        avatar: "https://www.hutool.cn/favicon.ico",
        description: "Hutool🍬一个功能丰富且易用的Java工具库"
      },
      {
        name: "MyBatis-Plus",
        url: "https://baomidou.com/introduce/",
        avatar: "https://baomidou.com/img/logo.svg",
        description: "在 MyBatis 的基础上只做增强不做改变，为简化开发、提高效率而生"
      },
      {
        name: "Java 全栈知识体系",
        url: "https://pdai.tech/",
        avatar: "https://pdai.tech/_media/logo.png",
        description: "包含: Java 基础, Java 部分源码, JVM, Spring, Spring Boot, Spring Cloud"
      },
      {
        name: "JavaGuide",
        url: "https://javaguide.cn/",
        avatar: "https://javaguide.cn/logo.svg",
        description: "「Java学习 + 面试指南」涵盖 Java 程序员需要掌握的核心知识"
      },
      {
        name: "二哥的Java进阶之路",
        url: "https://javabetter.cn/",
        avatar: "https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/logo.png",
        description: "沉默王二BB：这是一份通俗易懂、风趣幽默的Java学习指南"
      }
    ]
  },
  {
    name: "Vue 生态",
    description: "Vue.js 相关的框架、工具和资源",
    icon: "i-ri-vuejs-line",
    websites: [
      {
        name: "Vue 3",
        url: "https://cn.vuejs.org",
        avatar: "https://cn.vuejs.org/logo.svg",
        description: "渐进式 JavaScript 框架",
        tip: { text: "推荐", type: "success" }
      },
      {
        name: "Vue Router",
        url: "https://router.vuejs.org/zh",
        avatar: "https://cn.vuejs.org/logo.svg",
        description: "Vue.js 的官方路由 为 Vue.js 提供富有表现力、可配置的、方便的路由"
      },
      {
        name: "Pinia",
        url: "https://pinia.vuejs.org/zh",
        avatar: "https://pinia.vuejs.org/logo.svg",
        description: "符合直觉的 Vue.js 状态管理库"
      },
      {
        name: "Nuxt.js",
        url: "https://nuxt.com",
        avatar: "https://nuxt.com/icon.png",
        description: "一个基于 Vue.js 的通用应用框架"
      },
      {
        name: "VueUse",
        url: "https://vueuse.org",
        avatar: "https://vueuse.org/favicon.svg",
        description: "Vue Composition API 的常用工具集"
      },
      {
        name: "Vite",
        url: "https://cn.vitejs.dev/",
        avatar: "https://cn.vitejs.dev/logo.svg",
        description: "Vite 是一个超快速的前端构建工具，推动着下一代网络应用的发展"
      }
    ]
  },
  {
    name: "UI组件库",
    description: "优秀的UI组件库和设计系统",
    icon: "i-ri-layout-grid-line",
    websites: [
      {
        name: "Element Plus",
        url: "https://element-plus.org",
        avatar: "https://element-plus.org/images/element-plus-logo-small.svg",
        description: "基于 Vue 3，面向设计师和开发者的组件库",
        tip: { text: "Vue3", type: "success" }
      },
      {
        name: "Naive UI",
        url: "https://www.naiveui.com/zh-CN/os-theme",
        avatar: "https://www.naiveui.com/assets/naivelogo-93278402.svg",
        description: "一个 Vue 3 组件库比较完整，主题可调，使用 TypeScript，快有点意思",
        tip: { text: "Vue3组件库", type: "success" }
      },
      {
        name: "Arco Design",
        url: "https://arco.design/",
        avatar: "/arco-design.png",
        description: "字节跳动出品的企业级设计系统",
        tip: { text: "Vue & React", type: "info" }
      },
      {
        name: "Ant Design",
        url: "https://ant-design.antgroup.com/index-cn",
        avatar: "https://gw.alipayobjects.com/zos/rmsportal/rlpTLlbMzTNYuZGGCVYM.png",
        description: "一套企业级 UI 设计语言和 React 组件库",
        tip: { text: "React", type: "info" }
      },
      {
        name: "Vant",
        url: "https://vant-ui.github.io/vant",
        avatar: "https://fastly.jsdelivr.net/npm/@vant/assets/logo.png",
        description: "轻量、可定制的移动端 Vue 组件库",
        tip: { text: "移动端", type: "warning" }
      },
      {
        name: "TDesign",
        url: "https://tdesign.tencent.com/",
        avatar: "https://static.tdesign.tencent.com/vue/favicon.ico",
        description: "为设计师 & 开发者，打造工作美学",
        tip: { text: "Vue & React", type: "info" }
      }
    ]
  },
  {
    name: "前端学习",
    description: "前端技术学习资源和教程",
    icon: "i-ri-book-open-line",
    websites: [
      {
        name: "MDN Web Docs",
        url: "https://developer.mozilla.org/zh-CN",
        avatar: "https://developer.mozilla.org/favicon-48x48.cbbd161b5b0b6cd07c7b0ad734c69d6a.png",
        description: "Mozilla 的开发者平台，提供了大量关于 HTML、CSS 和 JavaScript 的详细文档",
        tip: { text: "权威", type: "success" }
      },
      {
        name: "菜鸟教程",
        url: "https://www.runoob.com",
        avatar: "https://www.runoob.com/favicon.ico",
        description: "学的不仅是技术，更是梦想！"
      },
      {
        name: "ES6 入门教程",
        url: "http://es6.ruanyifeng.com",
        avatar: "https://es6.ruanyifeng.com/images/cover_thumbnail_3rd.jpg",
        description: "阮一峰的网络日志"
      },
      {
        name: "TypeScript 入门教程",
        url: "https://ts.xcatliu.com/",
        avatar: "https://ts.xcatliu.com/favicon.ico",
        description: "从 JavaScript 程序员的角度总结思考，循序渐进的理解 TypeScript"
      },
      {
        name: "JavaScript 教程",
        url: "https://wangdoc.com/javascript/",
        avatar: "https://wangdoc.com/favicon.ico",
        description: "本教程全面介绍 JavaScript 核心语法，覆盖了 ES5 和 DOM 规范的所有内容"
      },
      {
        name: "网道（WangDoc.com）",
        url: "https://wangdoc.com/",
        avatar: "https://wangdoc.com/favicon.ico",
        description: "是一个文档网站，提供互联网开发文档"
      }
    ]
  },
  {
    name: "Node.js生态",
    description: "Node.js相关的框架和工具",
    icon: "i-ri-nodejs-line",
    websites: [
      {
        name: "Node.js",
        url: "https://nodejs.org/zh-cn",
        avatar: "https://nodejs.org/static/images/favicons/favicon.png",
        description: "Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行环境"
      },
      {
        name: "Express",
        url: "https://expressjs.com",
        avatar: "https://expressjs.com/images/favicon.png",
        description: "基于 Node.js 平台，快速、开放、极简的 Web 开发框架"
      },
      {
        name: "Koa",
        url: "https://koajs.com",
        avatar: "https://koajs.com/favicon.ico",
        description: "基于 Node.js 平台的下一代 web 开发框架"
      },
      {
        name: "Egg",
        url: "https://www.eggjs.org/zh-CN",
        avatar: "https://www.eggjs.org/favicon.png",
        description: "为企业级框架和应用而生"
      },
      {
        name: "Nest.js",
        url: "https://docs.nestjs.cn",
        avatar: "https://d33wubrfki0l68.cloudfront.net/e937e774cbbe23635999615ad5d7732decad182a/26072/logo-small.ede75a6b.svg",
        description: "用于构建高效且可伸缩的服务端应用程序的渐进式 Node.js 框架"
      },
      {
        name: "Fastify",
        url: "https://fastify.com.cn/",
        avatar: "https://fastify.com.cn/img/logos/fastify-black.svg",
        description: "快速且开销低的 Web 框架，适用于 Node.js"
      }
    ]
  }
];
</script>

<style scoped>
/* ========================================= */
/*          亮色模式 (默认主题)              */
/* ========================================= */

.website-nav-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1rem;
  background-color: transparent;
}

/* 分类容器 */
.nav-category {
  margin-bottom: 3rem;
}

.nav-category:last-child {
  margin-bottom: 1rem;
}

/* 分类标题样式 */
.category-header {
  margin-bottom: 1.5rem;
  padding-bottom: 0.8rem;
  border-bottom: 2px solid #e5e7eb;
}

.category-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-icon {
  font-size: 1.3rem;
  color: #6366f1;
}

.category-desc {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.4;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

/* 移除a标签默认样式 */
.nav-card-wrapper {
  text-decoration: none;
  display: block;
}

.nav-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 10px;
  height: 90px;
  background-color: transparent;
  border: 2px solid #e0e0e6;
  transition: all 0.3s ease-in-out;
}

/* tip标签样式 */
.nav-tip {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  z-index: 10;
  white-space: nowrap;
}

/* 不同类型的tip样式 */
.tip-info {
  background-color: #f3f4f6;
  color: #6b7280;
}

.tip-success {
  background-color: #d1fae5;
  color: #059669;
}

.tip-warning {
  background-color: #fef3c7;
  color: #d97706;
}

.tip-error {
  background-color: #fee2e2;
  color: #dc2626;
}

.tip-hot {
  background-color: #fecaca;
  color: #ef4444;
}

.tip-new {
  background-color: #dbeafe;
  color: #2563eb;
}

.nav-content {
  flex-grow: 1;
  overflow: hidden;
  color: #3c3c43;
  transition: color 0.3s ease;
}

.nav-name {
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.nav-desc {
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.nav-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  margin-right: 0.8rem;
  object-fit: cover;
  flex-shrink: 0;
}

/* --- 悬停效果 --- */
.nav-card:hover {
  border-color: var(--theme-color);
  background-color: var(--theme-color);
  transform: translateY(-3px);
}

.nav-card:hover .nav-content {
  color: #ffffff;
}

.nav-card:hover .nav-desc {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* ========================================= */
/*          暗黑模式 (通过 .dark 类激活)      */
/* ========================================= */

.dark .nav-card {
  border: 2px solid #3c3c43;
}

.dark .nav-content {
  color: #c7c7d2;
}

.dark .nav-desc {
  color: #8e8e93;
}

/* 暗色模式下的分类标题样式 */
.dark .category-header {
  border-bottom-color: #3c3c43;
}

.dark .category-title {
  color: #f9fafb;
}

.dark .category-desc {
  color: #8e8e93;
}

.dark .category-icon {
  color: #818cf8;
}

/* 暗黑模式下的tip样式调整 */
.dark .tip-info {
  background-color: #48484a;
  color: #c7c7d2;
}

.dark .tip-success {
  background-color: #30d158;
  color: #ffffff;
}

.dark .tip-warning {
  background-color: #ff9f0a;
  color: #ffffff;
}

.dark .tip-error {
  background-color: #ff453a;
  color: #ffffff;
}

.dark .tip-hot {
  background-color: #ff453a;
  color: #ffffff;
}

.dark .tip-new {
  background-color: #007aff;
  color: #ffffff;
}

/* ========================================= */
/*              响应式布局                    */
/* ========================================= */

@media (max-width: 768px) {
  .nav-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
  }

  .nav-card {
    height: 80px;
    padding: 0.8rem;
  }

  .nav-avatar {
    width: 40px;
    height: 40px;
  }

  .nav-name {
    font-size: 0.9rem;
  }

  .nav-desc {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .website-nav-container {
    margin: 1rem;
    padding: 0.5rem;
  }

  .nav-grid {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .nav-card {
    height: 75px;
    padding: 0.8rem;
  }

  .nav-avatar {
    width: 35px;
    height: 35px;
    margin-right: 0.6rem;
  }
}
</style>
