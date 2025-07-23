import { defineSiteConfig } from "valaxy";

export default defineSiteConfig({
  url: "https://zzyang.top/",
  lang: "zh-CN",
  title: "Code-Vision",
  subtitle: "",
  author: {
    name: "张小阳",
    avatar: "https://zzyang.top/logo.png",
    intro: "因为技术，我们相聚",
    status: {
      emoji: "⭐", // 头像旁边的emoji
    },
  },
  favicon: "https://zzyang.top/logo.png",
  description: "知识管理与技术分享",
  timezone: "Asia/Shanghai",
  codeHeightLimit: 400,
  mediumZoom: { enable: true },
  vanillaLazyload: {
    // 默认不开启
    enable: true,
  },
  license: {
    enabled: true,
  },
  social: [
    {
      name: "RSS",
      link: "/atom.xml",
      icon: "i-ri-rss-line",
      color: "orange",
    },
    // {
    //   name: "QQ 群 1050458482",
    //   link: "https://qm.qq.com/cgi-bin/qm/qr?k=kZJzggTTCf4SpvEQ8lXWoi5ZjhAx0ILZ&jump_from=webapi",
    //   icon: "i-ri-qq-line",
    //   color: "#12B7F5",
    // },
    {
      name: "GitHub",
      link: "https://github.com/zxyang3636",
      icon: "i-ri-github-line",
      color: "#6e5494",
    },
    // {
    //   name: '微博',
    //   link: 'https://weibo.com/jizhideyunyoujun',
    //   icon: 'i-ri-weibo-line',
    //   color: '#E6162D',
    // },
    // {
    //   name: '豆瓣',
    //   link: 'https://www.douban.com/people/yunyoujun/',
    //   icon: 'i-ri-douban-line',
    //   color: '#007722',
    // },
    // {
    //   name: "网易云音乐",
    //   link: "https://music.163.com/#/user/home?id=247102977",
    //   icon: "i-ri-netease-cloud-music-line",
    //   color: "#C20C0C",
    // },
    // {
    //   name: "Gitee",
    //   link: "https://music.163.com/#/user/home?id=247102977",
    //   icon: "ri-git-merge-line",
    //   color: "#8E71C1",
    // },
    // {
    //   name: '知乎',
    //   link: 'https://www.zhihu.com/people/yunyoujun/',
    //   icon: 'i-ri-zhihu-line',
    //   color: '#0084FF',
    // },
    // {
    //   name: '哔哩哔哩',
    //   link: 'https://space.bilibili.com/1579790',
    //   icon: 'i-ri-bilibili-line',
    //   color: '#FF8EB3',
    // },
    // {
    //   name: '微信公众号',
    //   link: 'https://cdn.yunyoujun.cn/img/about/white-qrcode-and-search.jpg',
    //   icon: 'i-ri-wechat-2-line',
    //   color: '#1AAD19',
    // },
    // {
    //   name: 'Twitter',
    //   link: 'https://twitter.com/YunYouJun',
    //   icon: 'i-ri-twitter-x-fill',
    //   color: 'black',
    // },
    // {
    //   name: 'Telegram Channel',
    //   link: 'https://t.me/elpsycn',
    //   icon: 'i-ri-telegram-line',
    //   color: '#0088CC',
    // },
    {
      name: "E-Mail",
      link: "mailto:zxyang3636@163.com",
      icon: "i-ri-mail-line",
      color: "#8E71C1",
    },
    // {
    //   name: "Travelling",
    //   link: "https://www.travellings.cn/go.html",
    //   icon: "i-ri-train-line",
    //   color: "var(--va-c-text)",
    // },
  ],
  statistics: {
    enable: true,
    readTime: {
      /**
       * 阅读速度
       */
      speed: {
        cn: 300,
        en: 200,
      },
    },
  },

  search: {
    enable: true,
  },

  sponsor: {
    enable: true,
    // title: "我很可爱，请给我钱！",
    description: "感谢您的支持",
    methods: [
      {
        name: "支付宝",
        url: "https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20250721231234_45.jpg",
        color: "#00A3EE",
        icon: "i-ri-alipay-line",
      },
      // {
      //   name: "QQ 支付",
      //   url: "https://cdn.yunyoujun.cn/img/donate/qqpay-qrcode.png",
      //   color: "#12B7F5",
      //   icon: "i-ri-qq-line",
      // },
      {
        name: "微信支付",
        url: "https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20250721231234_46.jpg",
        color: "#2DC100",
        icon: "i-ri-wechat-pay-line",
      },
    ],
  },
});
