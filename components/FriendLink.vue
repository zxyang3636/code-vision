<template>
  <!--
    在根元素上动态绑定 'dark' 类，
    当 appStore.isDark 为 true 时，这个 div 会有 'dark' 类，
    从而激活我们下面定义的暗黑模式样式。
  -->
  <div class="friend-links-container" :class="{ dark: appStore.isDark }">
    <div class="links-grid">
      <!--
        BUG修复：移入时的下划线是因为 a 标签的默认行为。
        我们在 CSS 中已通过 text-decoration: none; 解决。
      -->
      <a
        v-for="link in friendLinks"
        :key="link.name"
        :href="link.url"
        target="_blank"
        class="link-card-wrapper"
      >
        <div class="link-card" :style="{ '--theme-color': link.borderColor }">
          <img :src="link.avatar" :alt="link.name" class="avatar" />
          <div class="card-content">
            <div class="card-name">{{ link.name }}</div>
            <div class="card-desc">{{ link.description }}</div>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
// 1. 引入你的 Pinia store
//    请确保路径 '@stores/app' 是正确的，如果不同请修改
import { useAppStore } from "valaxy";

// 2. 实例化 store
const appStore = useAppStore();

// 定义友链的数据结构
interface FriendLink {
  name: string;
  url: string;
  avatar: string;
  description: string;
  borderColor: string;
}

// 示例数据，保持不变
const friendLinks = ref<FriendLink[]>([
  {
    name: "Mete0r's Blog | 壹人小站",
    url: "https://www.xscnet.cn/",
    avatar: "https://www.xscnet.cn/avatar1.jpg",
    description: "Trust the process.",
    borderColor: "#FFC0CB"
  },
  // {
  //   name: "Vite",
  //   url: "https://vitejs.dev/",
  //   avatar: "https://vitejs.dev/logo.svg",
  //   description: "下一代前端开发与构建工具，提供极速的开发体验。",
  //   borderColor: "#646cff",
  // },
  // {
  //   name: "Pinia",
  //   url: "https://pinia.vuejs.org/",
  //   avatar: "https://pinia.vuejs.org/logo.svg",
  //   description: "Vue 官方推荐的状态管理库，轻量、直观、可扩展。",
  //   borderColor: "#ffd859",
  // },
  // {
  //   name: "Nuxt",
  //   url: "https://nuxt.com/",
  //   avatar: "https://nuxt.com/assets/design-kit/icon-green.svg",
  //   description: "基于 Vue.js 的直观 Web 框架，用于构建全栈应用。",
  //   borderColor: "#00dc82",
  // },
]);
</script>

<style scoped>
/* ========================================= */
/*          亮色模式 (默认主题)              */
/* ========================================= */

.friend-links-container {
  max-width: 760px;
  margin-left: -5%; /* 设置一个你想要的左边距，可以是百分比或固定值如 30px */
  margin-right: auto; /* 保留右侧 auto，让它填充剩余空间 */
  margin-top: 2rem;
  margin-bottom: 2rem;

  padding: 1rem;
  background-color: transparent;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

/* BUG 修复：a 标签默认的下划线样式 */
.link-card-wrapper {
  text-decoration: none; /* 关键：移除下划线 */
}

.link-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 10px;
  height: 100px;
  background-color: transparent;
  border: 2px solid #e0e0e6; /* 亮色模式下的边框颜色 */
  transition: all 0.3s ease-in-out;
}

.card-content {
  flex-grow: 1;
  overflow: hidden;
  color: #3c3c43; /* 亮色模式下的文字颜色 */
  transition: color 0.3s ease;
}

.card-name {
  font-size: 1.05rem;
  font-weight: bold;
  white-space: nowrap;
}

.card-desc {
  font-size: 0.8rem;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 1rem;
  object-fit: cover;
  flex-shrink: 0;
}

/* --- 悬停效果 (亮色/暗色通用) --- */
.link-card:hover {
  border-color: var(--theme-color);
  background-color: var(--theme-color);
  transform: translateY(-4px);
}

.link-card:hover .card-content {
  /* 悬停时文字变为白色，以保证在彩色背景上的可读性 */
  /* 对于非常浅的主题色(如黄色)，你可能需要换成黑色，但白色是更通用的选择 */
  color: #fff;
}

/* ========================================= */
/*          暗黑模式 (通过 .dark 类激活)      */
/* ========================================= */

/* 当 .friend-links-container 带有 .dark 类时，以下样式生效 */
.dark .link-card {
  border: 2px solid #3c3c43; /* 暗色模式下的边框颜色 */
}

.dark .card-content {
  color: #c7c7d2; /* 暗色模式下的文字颜色 */
}

/* 响应式布局保持不变 */
@media (max-width: 640px) {
  .links-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
