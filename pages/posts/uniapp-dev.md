---
title: uni-app
categories: 小程序
tags:
  - 小程序
  - 前端
  - uni-app
---


## 页面基本组成部分

pages.json 页面路由 的配置文件

pages中的默认的path就是我们初始化项目的index页面；

里面的内容可通过创建页面时自动生成；


## 常用的内置组件

**解决view冒泡事件**

```vue
<template>
	<view class="wrapper" hover-class="wrapperHover" hover-stay-time=1>
		<view class="innner" hover-class="innnerHover" hover-stop-propagation>

		</view>
	</view>
</template>

<script setup>

</script>

<style>
	.wrapper {
		width: 200rpx;
		height: 200rpx;
		background-color: #ccc;

		.innner {
			width: 100rpx;
			height: 100rpx;
			background-color: burlywood;
		}

		.innnerHover {
			background-color: aquamarine;
		}
	}

	.wrapperHover {
		background-color: aqua;
	}
</style>
```

`hover-stop-propagation` 我们可以添加该属性，阻止冒泡事件;

不加该属性的话，我们点击子元素，父元素的事件也会触发；

::: tip 
布尔属性的话，我们可以直接写属性，不用加值
```vue
		<view class="innner" hover-class="innnerHover" hover-stop-propagation>

		</view>
```

我们同时也需要注意看[文档](https://uniapp.dcloud.net.cn/component/view.html)，该属性对于App、H5、支付宝小程序、百度小程序不支持；
:::





