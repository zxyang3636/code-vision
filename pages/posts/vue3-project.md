---
title: Vue3工程化
date: 2025-07-01
updated: 2025-07-01
categories: Vue
tags:
  - vue3
  - 前端
  - 工程化
---


# Vue3工程化

## 项目初始化

```shell{1,52,23,25}
D:\workspace\vscode\vue_admin_template>pnpm create vite
.../19788950c58-c70                      |   +1 +
.../19788950c58-c70                      | Progress: resolved 1, reused 0, downloaded 1, added 1, done
|
o  Project name:
|  project
|
o  Select a framework:
|  Vue
|
o  Select a variant:
|  TypeScript
|
o  Scaffolding project in D:\workspace\vscode\vue_admin_template\project...
|
—  Done. Now run:

  cd project
  pnpm install
  pnpm run dev


D:\workspace\vscode\vue_admin_template>cd project

D:\workspace\vscode\vue_admin_template\project>pnpm i

   ╭───────────────────────────────────────────────────────────────────╮
   │                                                                   │
   │                Update available! 9.15.4 → 10.12.1.                │
   │   Changelog: https://github.com/pnpm/pnpm/releases/tag/v10.12.1   │
   │                 Run "pnpm add -g pnpm" to update.                 │
   │                                                                   │
   ╰───────────────────────────────────────────────────────────────────╯

Packages: +50
++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 94, reused 11, downloaded 39, added 50, done
node_modules/.pnpm/esbuild@0.25.5/node_modules/esbuild: Running postinstall script, done in 620ms

dependencies:
+ vue 3.5.17

devDependencies:
+ @vitejs/plugin-vue 5.2.4
+ @vue/tsconfig 0.7.0
+ typescript 5.8.3
+ vite 6.3.5
+ vue-tsc 2.2.10

Done in 3.6s

D:\workspace\vscode\vue_admin_template\project>pnpm run dev

> project@0.0.0 dev D:\workspace\vscode\vue_admin_template\project
> vite

Port 5173 is in use, trying another one...

  VITE v6.3.5  ready in 503 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

`main.ts`中无需引入`style.css`，把`style.css`删掉即可

`components`中清空，`assert`清空


在package.json中配置如下，启动项目时，可自动打开浏览器
```json{2}
  "scripts": {
    "dev": "vite --open",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview"
  },
```

## eslint
eslint中文官网:http://eslint.cn/

ESLint最初是由[Nicholas C. Zakas](http://nczonline.net/) 于2013年6月创建的开源项目。它的目标是提供一个插件化的**javascript代码检测工具**

首先安装eslint

```bash
pnpm i eslint -D
```


生成配置文件:`eslint.config.js`
```bash
npx eslint --init
```
**选项：**
```bash
PS D:\workspace\vscode\vue_admin_template> npx eslint --init
You can also run this command directly using 'npm init @eslint/config@latest'.
Need to install the following packages:
@eslint/create-config@1.9.0
Ok to proceed? (y) y


> vue_admin_template@0.0.0 npx
> create-config

@eslint/create-config: v1.9.0

√ What do you want to lint? · javascript
√ How would you like to use ESLint? · problems
√ What type of modules does your project use? · esm
√ Which framework does your project use? · vue
√ Does your project use TypeScript? · no / yes
√ Where does your code run? · browser
The config that you've selected requires the following dependencies:

eslint, @eslint/js, globals, typescript-eslint, eslint-plugin-vue
√ Would you like to install them now? · No / Yes
√ Which package manager do you want to use? · pnpm
☕️Installing...
```

**vue3环境代码校验插件**
安装指令:
```bash
pnpm install -D eslint-plugin-import eslint-plugin-vue eslint-plugin-node eslint-plugin-prettier eslint-config-prettier eslint-plugin-node @babel/eslint-parser
```


**`eslint.config.js`配置文件**
```js
//eslint.config.js

// 导入 ESLint 相关插件和解析器

import pluginJs from '@eslint/js' // ESLint JavaScript 规则插件

import tseslint from '@typescript-eslint/eslint-plugin' // TypeScript ESLint 插件

import tsParser from '@typescript-eslint/parser' // TypeScript 解析器

import pluginVue from 'eslint-plugin-vue' // Vue.js ESLint 插件

import vueEslintParser from 'vue-eslint-parser' // Vue 解析器
import globals from 'globals'

// 导出 ESLint 配置数组

export default [
  {
    // 适用于的文件类型

    files: ['**/*.{js,mjs,cjs,ts,vue}'],

    // 忽略的文件和文件夹

    ignores: ['node_modules', 'dist', '*.config.js'],

    languageOptions: {
      globals: { ...globals.browser, ...globals.node }, // 使用浏览器全局变量

      ecmaVersion: 'latest', // 使用最新的 ECMAScript 版本

      sourceType: 'module', // 使用模块类型

      parser: tsParser, // 使用 TypeScript 解析器
    },

    // 配置使用的插件

    plugins: {
      vue: pluginVue, // 引入 Vue 插件

      '@typescript-eslint': tseslint, // 引入 TypeScript ESLint 插件
    },

    // 定义 ESLint 规则

    rules: {
      ...pluginJs.configs.recommended.rules, // JavaScript 推荐规则

      ...tseslint.configs.recommended.rules, // TypeScript 推荐规则

      ...pluginVue.configs['flat/essential'].rules, // Vue 推荐规则

      // JavaScript 规则

      'no-var': 'error', // 禁止使用 var

      'no-multiple-empty-lines': ['warn', { max: 1 }], // 允许最多一行空行

      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off', // 在生产环境中禁止使用 console

      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off', // 在生产环境中禁止使用 debugger

      'no-unexpected-multiline': 'error', // 禁止意外的多行

      'no-useless-escape': 'off', // 关闭不必要的转义

      // TypeScript 规则

      '@typescript-eslint/no-unused-vars': 'off', // 允许未使用的变量

      '@typescript-eslint/prefer-ts-expect-error': 'error', // 优先使用 ts-expect-error

      '@typescript-eslint/no-explicit-any': 'off', // 允许使用 any 类型

      '@typescript-eslint/no-non-null-assertion': 'off', // 允许使用非空断言

      '@typescript-eslint/no-namespace': 'off', // 允许使用命名空间

      '@typescript-eslint/semi': 'off', // 关闭分号规则

      // Vue 规则

      'vue/multi-word-component-names': 'off', // 关闭组件名称必须是多词的规则

      // "vue/script-setup-uses-vars": "error", // 检查 script setup 中的变量

      'vue/no-mutating-props': 'off', // 允许在 props 中进行变更

      'vue/attribute-hyphenation': 'off', // 允许不使用连字符的属性命名
    },
  },

  {
    // 适用于 Vue 文件

    files: ['**/*.vue'],

    languageOptions: {
      parser: vueEslintParser, // 使用 Vue 解析器

      parserOptions: {
        parser: tsParser, // 使用 TypeScript 解析器

        ecmaVersion: 'latest', // 使用最新的 ECMAScript 版本

        sourceType: 'module', // 使用模块类型
      },
    },
  },
]

```

package.json新增两个运行脚本
```json
"scripts": {
    "lint": "eslint src",
    "fix": "eslint --config ./eslint.config.js src --fix",
}
```


## 配置**prettier**

有了eslint，为什么还要有prettier？eslint针对的是javascript，他是一个检测工具，包含js语法以及少部分格式问题，在eslint看来，语法对了就能保证代码正常运行，格式问题属于其次；

而prettier属于格式化工具，它看不惯格式不统一，所以它就把eslint没干好的事接着干，另外，prettier支持

包含js在内的多种语言。

总结起来，**eslint和prettier这俩兄弟一个保证js代码质量，一个保证代码美观。**

安装依赖包
```bash
pnpm install prettier --save-dev
# 或者
yarn add prettier --dev
```

`.prettierrc.json`
```json
{
  "singleQuote": true,
  "semi": false,
  "bracketSpacing": true,
  "htmlWhitespaceSensitivity": "ignore",
  "endOfLine": "auto",
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 80,
  "vueIndentScriptAndStyle": true
}
```

`.prettierignore`

```
/dist/*
/html/*
.local
/node_modules/**
**/*.svg
**/*.sh
/public/*
```

`pacakage.json`
```json{7}[package.json]
  "scripts": {
    "dev": "vite --open",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "fix": "eslint --config ./eslint.config.js src --fix",
    "format": "prettier --write ."
  },
```

`setting.json`
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.format.enable": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}

```

## 配置stylelint
[stylelint](https://stylelint.io/)为css的lint工具。可格式化css代码，检查css语法错误与不合理的写法，指定css书写顺序等。

**官网:https://stylelint.bootcss.com/**

我们的项目中使用scss作为预处理器，安装以下依赖：
```bash
pnpm add sass sass-loader stylelint postcss postcss-scss postcss-html stylelint-config-prettier stylelint-config-recess-order stylelint-config-recommended-scss stylelint-config-standard stylelint-config-standard-vue stylelint-scss stylelint-order stylelint-config-standard-scss -D
```

`.stylelintrc.cjs`**配置文件**

```js
// @see https://stylelint.bootcss.com/

module.exports = {
  extends: [
    'stylelint-config-standard', // 配置stylelint拓展插件
    'stylelint-config-html/vue', // 配置 vue 中 template 样式格式化
    'stylelint-config-standard-scss', // 配置stylelint scss插件
    'stylelint-config-recommended-vue/scss', // 配置 vue 中 scss 样式格式化
    'stylelint-config-recess-order', // 配置stylelint css属性书写顺序插件,
    'stylelint-config-prettier', // 配置stylelint和prettier兼容
  ],
  overrides: [
    {
      files: ['**/*.(scss|css|vue|html)'],
      customSyntax: 'postcss-scss',
    },
    {
      files: ['**/*.(html|vue)'],
      customSyntax: 'postcss-html',
    },
  ],
  ignoreFiles: [
    '**/*.js',
    '**/*.jsx',
    '**/*.tsx',
    '**/*.ts',
    '**/*.json',
    '**/*.md',
    '**/*.yaml',
  ],
  /**
   * null  => 关闭该规则
   * always => 必须
   */
  rules: {
    'value-keyword-case': null, // 在 css 中使用 v-bind，不报错
    'no-descending-specificity': null, // 禁止在具有较高优先级的选择器后出现被其覆盖的较低优先级的选择器
    'function-url-quotes': 'always', // 要求或禁止 URL 的引号 "always(必须加上引号)"|"never(没有引号)"
    'no-empty-source': null, // 关闭禁止空源码
    'selector-class-pattern': null, // 关闭强制选择器类名的格式
    'property-no-unknown': null, // 禁止未知的属性(true 为不允许)
    'block-opening-brace-space-before': 'always', //大括号之前必须有一个空格或不能有空白符
    'value-no-vendor-prefix': null, // 关闭 属性值前缀 --webkit-box
    'property-no-vendor-prefix': null, // 关闭 属性前缀 -webkit-mask
    'selector-pseudo-class-no-unknown': [
      // 不允许未知的选择器
      true,
      {
        ignorePseudoClasses: ['global', 'v-deep', 'deep'], // 忽略属性，修改element默认样式的时候能使用到
      },
    ],
  },
}
```


`.stylelintignore`忽略文件
```
/node_modules/*
/dist/*
/html/*
/public/*
```

运行脚本
```json
"scripts": {
	"lint:style": "stylelint src/**/*.{css,scss,vue} --cache --fix"
}
```

最后配置统一的prettier来格式化我们的js和css，html代码
```json
  "scripts": {
    "dev": "vite --open",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "fix": "eslint --config ./eslint.config.js src --fix",
    "format": "prettier --write \"./**/*.{html,vue,ts,js,json,md}\"",
    "lint:eslint": "eslint src/**/*.{ts,vue} --cache --fix",
    "lint:style": "stylelint src/**/*.{css,scss,vue} --cache --fix"
  },
```

:::tip
如果报了这个错：`“Issues with peer dependencies found ”错误`
执行该命令
```bash
pnpm config set auto-install-peers true
```
auto-install-peers 设置为 true ，在运行pnpm后，缺失的peer dependenices 会自动安装。

当然，也可以删除node_modules，再重新安装

---

如果报错`module' is not defined.eslintno-undef`

**.eslint.config.js**👇
```js
export default [
  {
    // 适用于的文件类型

    files: ['**/*.{js,mjs,cjs,ts,vue}'],

    // 忽略的文件和文件夹

    ignores: ['node_modules', 'dist', '*.config.js'], // ⬅️

    languageOptions: {
      globals: { ...globals.browser, ...globals.node }, // 使用浏览器全局变量

      ecmaVersion: 'latest', // 使用最新的 ECMAScript 版本

      sourceType: 'module', // 使用模块类型

      parser: tsParser, // 使用 TypeScript 解析器
    },
```
:::

## 配置husky

在上面我们已经集成好了我们代码校验工具，但是需要每次手动的去执行命令才会格式化我们的代码。如果有人没有格式化就提交了远程仓库中，那这个规范就没什么用。所以我们需要强制让开发人员按照代码规范来提交。

要做到这件事情，就需要利用husky在代码提交之前触发git hook(git在客户端的钩子)，然后执行`pnpm run format`来自动的格式化我们的代码。

安装`husky`
```bash
pnpm install -D husky
```
执行
```bash
npx husky-init
```

会在根目录下生成个一个.husky目录，在这个目录下面会有一个pre-commit文件，这个文件里面的命令在我们执行commit的时候就会执行

在`.husky/pre-commit`文件添加如下命令：
```
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
pnpm run format
```

当我们对代码进行commit操作的时候，就会执行命令，对代码进行格式化，然后再提交。


## 配置commitlint

对于我们的commit信息，也是有统一规范的，不能随便写,要让每个人都按照统一的标准来执行，我们可以利用**commitlint**来实现。

安装包
```bash
pnpm add @commitlint/config-conventional @commitlint/cli -D
```
添加配置文件，新建`commitlint.config.cjs`(注意是cjs)，然后添加下面的代码：
```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  // 校验规则
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'build',
      ],
    ],
    'type-case': [0],
    'type-empty': [0],
    'scope-empty': [0],
    'scope-case': [0],
    'subject-full-stop': [0, 'never'],
    'subject-case': [0, 'never'],
    'header-max-length': [0, 'always', 72],
  },
}
```
在`package.json`中配置scripts命令
```json
{
"scripts": {
    "commitlint": "commitlint --config commitlint.config.cjs -e -V"
  },
}
```
配置结束，现在当我们填写`commit`信息的时候，前面就需要带着下面的`subject`

```
'feat',//新特性、新功能
'fix',//修改bug
'docs',//文档修改
'style',//代码格式修改, 注意不是 css 修改
'refactor',//代码重构
'perf',//优化相关，比如提升性能、体验
'test',//测试用例修改
'chore',//其他修改, 比如改变构建流程、或者增加依赖库、工具等
'revert',//回滚到上一个版本
'build',//编译相关的修改，例如发布版本、对项目构建或者依赖的改动
```

**配置husky**
```
npx husky add .husky/commit-msg
```
在生成的commit-msg文件中添加下面的命令
```
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
pnpm commitlint
```
当我们 commit 提交信息时，就不能再随意写了，必须是 git commit -m 'fix: xxx' 符合类型的才可以，**需要注意的是类型的后面需要用英文的 :，并且冒号后面是需要空一格的，这个是不能省略的**；


## 强制使用pnpm包管理器工具

团队开发项目的时候，需要统一包管理器工具,因为不同包管理器工具下载同一个依赖,可能版本不一样,

导致项目出现bug问题,因此包管理器工具需要统一管理！！！

在根目录创建`scritps/preinstall.js`文件，添加下面的内容

```
if (!/pnpm/.test(process.env.npm_execpath || '')) {
  console.warn(
    `\u001b[33mThis repository must using pnpm as the package manager ` +
    ` for scripts to work properly.\u001b[39m\n`,
  )
  process.exit(1)
}
```
配置命令
```
"scripts": {
	"preinstall": "node ./scripts/preinstall.js"
}
```
**当我们使用npm或者yarn来安装包的时候，就会报错了。原理就是在install的时候会触发preinstall（npm提供的生命周期钩子）这个文件里面的代码。**


## 集成element-plus

安装以下：
```bash
pnpm i @element-plus/icons-vue
```

```bash
pnpm install element-plus
```

main.ts
```ts{3-6,9-11}[main.ts]
import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
//@ts-expect-error忽略当前文件ts类型的检测否则有红色提示(打包会失败)
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const app = createApp(App)
app.use(ElementPlus, {
  locale: zhCn,
})
app.mount('#app')

```

### element 图标注册为全局组件
`src/components/index.ts`
```ts{4,11-13}[index.ts]
import SvgIcon from './SvgIcon/index.vue'
import type { App, Component } from 'vue'
const components: { [name: string]: Component } = { SvgIcon }
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default {
  install(app: App) {
    Object.keys(components).forEach((key: string) => {
      app.component(key, components[key])
    })
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component)
    }
  },
}

```

## src别名的配置

在开发项目的时候文件与文件关系可能很复杂，因此我们需要给src文件夹配置一个别名

编辑`vite.config.ts`
```ts{3,6-10}[vite.config.ts]
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "@": path.resolve("./src") // 相对路径别名配置，使用 @ 代替 src
        }
    }
})
```

**TypeScript 编译配置**

`tsconfig.json`
```json{3-6}
{
  "compilerOptions": {
    "baseUrl": "./", // 解析非相对模块的基地址，默认是当前目录
    "paths": { //路径映射，相对于baseUrl
      "@/*": ["src/*"]
    }
  }
}
```

`tsconfig.app.json`
```json{5-9}
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "baseUrl": "./", // 解析非相对模块的基地址，默认是当前目录
    "paths": {
      //路径映射，相对于baseUrl
      "@/*": ["src/*"]
    },
    /* Linting */
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}

```

## 环境变量的配置

开发环境（development）
顾名思义，开发使用的环境，每位开发人员在自己的dev分支上干活，开发到一定程度，同事会合并代码，进行联调。

测试环境（testing）
测试同事干活的环境啦，一般会由测试同事自己来部署，然后在此环境进行测试

生产环境（production）
生产环境是指正式提供对外服务的，一般会关掉错误报告，打开错误日志。(正式提供给客户使用的环境。)

注意:一般情况下，一个环境对应一台服务器,也有的公司开发与测试环境是一台服务器

项目根目录分别添加 开发、生产和测试环境的文件
```
.env.development
.env.production
.env.test
```

**文件内容:**
```
# 变量必须以 VITE_ 为前缀才能暴露给外部读取
NODE_ENV = 'development'
VITE_APP_TITLE = '硅谷甄选运营平台'
VITE_APP_BASE_API = '/dev-api'
VITE_SERVE="http://xxxx.com"
```


```
NODE_ENV = 'production'
VITE_APP_TITLE = '硅谷甄选运营平台'
VITE_APP_BASE_API = '/prod-api'
VITE_SERVE="http://xxxx.com"
```



```
# 变量必须以 VITE_ 为前缀才能暴露给外部读取
NODE_ENV = 'test'
VITE_APP_TITLE = '硅谷甄选运营平台'
VITE_APP_BASE_API = '/test-api'
VITE_SERVE="http://xxxx.com"
```


配置运行命令：package.json
```json
 "scripts": {
    "dev": "vite --open",
    "build:test": "vue-tsc && vite build --mode test",
    "build:pro": "vue-tsc && vite build --mode production",
    "preview": "vite preview"
  },
```

通过import.meta.env获取环境变量
```ts
console.log(import.meta.env);
console.log(import.meta.env.BASE_URL);
console.log(import.meta.env.VITE_SERVE);
```

## SVG图标的封装

在开发项目的时候经常会用到svg矢量图,而且我们使用SVG以后，页面上加载的不再是图片资源,

这对页面性能来说是个很大的提升，而且我们SVG文件比img要小的很多，放在项目中几乎不占用资源。

**安装SVG依赖插件**
```bash
pnpm install vite-plugin-svg-icons -D
```

**在`vite.config.ts`中配置插件**

```ts
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'path'
export default () => {
  return {
    plugins: [
      createSvgIconsPlugin({
        // Specify the icon folder to be cached
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        // Specify symbolId format
        symbolId: 'icon-[dir]-[name]',
      }),
    ],
  }
}
```

**入口文件导入**
```ts [main.ts]
import 'virtual:svg-icons-register'
```

`vite-env.d.ts`
```ts [vite-env.d.ts]
/// <reference types="vite-plugin-svg-icons/client" />

declare module 'virtual:svg-icons-register' {
  const component: any;
  export default component;
}

```

在assert目录下创建`icons`文件夹，将svg图标放入icons文件夹中；要与vite.config.ts中配置的路径一致


**使用方式:**
```vue
<template>
  <div>
    <h2>SVG的使用</h2>
    <svg style="width: 100px; height: 100px;">
      <!-- xlink:href 执行用哪一个图标，属性值务必以#icon开头-图标名字 -->
       <!-- fill可以填充图标颜色 -->
      <use xlink:href="#icon-load" fill="red"></use>
    </svg>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped></style>

```



因为项目很多模块需要使用图标,因此把它封装为全局组件

**在src/components目录下创建一个SvgIcon组件:**
```vue
<template>
  <div>
    <svg :style="{ width: width, height: height }">
      <use :xlink:href="prefix + name" :fill="color"></use>
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps({
  //xlink:href属性值的前缀
  prefix: {
    type: String,
    default: '#icon-'
  },
  //svg矢量图的名字
  name: String,
  //svg图标的颜色
  color: {
    type: String,
    default: ""
  },
  //svg宽度
  width: {
    type: String,
    default: '16px'
  },
  //svg高度
  height: {
    type: String,
    default: '16px'
  }

})
</script>
<style scoped></style>
```

使用方式：
```vue
<template>
  <div>
    <h2>SVG的使用</h2>
    <SvgIcon name="home" color="red" width="100px" height="100px"></SvgIcon>
  </div>
</template>

<script setup lang="ts">
import SvgIcon from '@/components/SvgIcon/index.vue'
</script>

<style scoped></style>

```

**封装为全局组件**

因为项目很多模块需要使用图标,因此把它封装为全局组件

在src文件夹`components`目录下创建一个`index.ts`文件，用于注册`components`文件夹内部全部全局组件

```ts [index.ts]
import SvgIcon from './SvgIcon/index.vue';
import type { App, Component } from 'vue';
const components: { [name: string]: Component } = { SvgIcon };
export default {
    install(app: App) {
        Object.keys(components).forEach((key: string) => {
            app.component(key, components[key]);
        })
    }
}
```

在入口文件main.ts引入src/index.ts文件,通过app.use方法安装自定义插件
```ts [main.ts]
import globalComponent from '@/components'
app.use(globalComponent)
```

## 集成sass

我们目前在组件内部已经可以使用scss样式,因为在配置styleLint工具的时候，项目当中已经安装过`sass` `sass-loader`,因此我们再组件内可以使用`scss`语法需要加上`lang="scss"`
```
<style scoped lang="scss"></style>
```

在src下创建styles，并创建index.scss

接下来我们为项目添加一些全局的样式

**引入全局样式**
在main.ts中
```ts [main.ts]
import '@/styles/index.scss'
```

创建`src/styles/reset.scss`
npm地址：[地址](https://www.npmjs.com/package/reset.scss?activeTab=code)
```scss
/**
 * ENGINE
 * v0.2 | 20150615
 * License: none (public domain)
 */

*,
*:after,
*:before {
  box-sizing: border-box;

  outline: none;
}

html,
body,
div,
span,
applet,
object,
iframe,
h1,
h2,
h3,
h4,
h5,
h6,
p,
blockquote,
pre,
a,
abbr,
acronym,
address,
big,
cite,
code,
del,
dfn,
em,
img,
ins,
kbd,
q,
s,
samp,
small,
strike,
strong,
sub,
sup,
tt,
var,
b,
u,
i,
center,
dl,
dt,
dd,
ol,
ul,
li,
fieldset,
form,
label,
legend,
table,
caption,
tbody,
tfoot,
thead,
tr,
th,
td,
article,
aside,
canvas,
details,
embed,
figure,
figcaption,
footer,
header,
hgroup,
menu,
nav,
output,
ruby,
section,
summary,
time,
mark,
audio,
video {
  font: inherit;
  font-size: 100%;

  margin: 0;
  padding: 0;

  vertical-align: baseline;

  border: 0;
}

article,
aside,
details,
figcaption,
figure,
footer,
header,
hgroup,
menu,
nav,
section {
  display: block;
}

body {
  line-height: 1;
}

ol,
ul {
  list-style: none;
}

blockquote,
q {
  quotes: none;
  &:before,
  &:after {
    content: '';
    content: none;
  }
}

sub,
sup {
  font-size: 75%;
  line-height: 0;

  position: relative;

  vertical-align: baseline;
}
sup {
  top: -0.5em;
}
sub {
  bottom: -0.25em;
}

table {
  border-spacing: 0;
  border-collapse: collapse;
}

input,
textarea,
button {
  font-family: inhert;
  font-size: inherit;

  color: inherit;
}

select {
  text-indent: 0.01px;
  text-overflow: '';

  border: 0;
  border-radius: 0;

  -webkit-appearance: none;
  -moz-appearance: none;
}
select::-ms-expand {
  display: none;
}

code,
pre {
  font-family: monospace, monospace;
  font-size: 1em;
}

```

在`index.scss`中引入reset.scss
```ts
@use './reset.scss' as *;
```

但是你会发现在`src/styles/index.scss`全局样式文件中没有办法使用`$`变量;因此需要给项目中引入全局变量`$`

在`style/variable.scss`创建一个`variable.scss`文件


在`vite.config.ts`文件配置如下:
```ts [vite.config.ts]
export default defineConfig((config) => {
  css:{
    preprocessorOptions:{
      scss:{
        additionalData: '@use "@/styles/variable.scss" as *;'
      }
    }
  }
}

```

**使用方式**

```scss [variable.scss]
$bgColor: #f0f2f5;
```

```scss
<style scoped lang="scss">
  .app {
    background-color: $bgColor;
  }
</style>
```


## mock数据

```bash
pnpm install -D vite-plugin-mock mockjs
```

配置`vite.config.ts`
```ts [vite.config.ts]
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { viteMockServe } from 'vite-plugin-mock'

// https://vite.dev/config/
export default defineConfig((command) => {
  return {
    plugins: [
      vue(),
      createSvgIconsPlugin({
        // Specify the icon folder to be cached
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        // Specify symbolId format
        symbolId: 'icon-[dir]-[name]',
      }),
      viteMockServe({
        enable: command.command === 'serve',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('./src'), // 相对路径别名配置，使用 @ 代替 src
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/styles/variable.scss" as *;',
        },
      },
    },
  }
})

```


根目录创建`mock`文件夹

建一个`user.ts`
```ts [user.ts]
//用户信息数据
function createUserList() {
  return [
    {
      userId: 1,
      avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
      username: 'admin',
      password: '111111',
      desc: '平台管理员',
      roles: ['平台管理员'],
      buttons: ['cuser.detail'],
      routes: ['home'],
      token: 'Admin Token',
    },
    {
      userId: 2,
      avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
      username: 'system',
      password: '111111',
      desc: '系统管理员',
      roles: ['系统管理员'],
      buttons: ['cuser.detail', 'cuser.user'],
      routes: ['home'],
      token: 'System Token',
    },
  ]
}

export default [
  // 用户登录接口
  {
    url: '/api/user/login', //请求地址
    method: 'post', //请求方式
    response: ({ body }) => {
      //获取请求体携带过来的用户名与密码
      const { username, password } = body
      //调用获取用户信息函数,用于判断是否有此用户
      const checkUser = createUserList().find((item) => item.username === username && item.password === password)
      //没有用户返回失败信息
      if (!checkUser) {
        return { code: 201, data: { message: '账号或者密码不正确' } }
      }
      //如果有返回成功信息
      const { token } = checkUser
      return { code: 200, data: { token } }
    },
  },
  // 获取用户信息
  {
    url: '/api/user/info',
    method: 'get',
    response: (request) => {
      //获取请求头携带token
      const token = request.headers.token
      //查看用户信息是否包含有次token用户
      const checkUser = createUserList().find((item) => item.token === token)
      //没有返回失败的信息
      if (!checkUser) {
        return { code: 201, data: { message: '获取用户信息失败' } }
      }
      //如果有返回成功信息
      return { code: 200, data: { checkUser } }
    },
  },
]

```

main.ts中测试下
```ts [main.ts]
import axios from 'axios'

axios({
  url: '/api/user/login',
  method: 'post',
  data: {
    username: 'admin',
    password: '111111',
  },
})
```


## axios
```bash
pnpm install axios
```

在开发项目的时候避免不了与后端进行交互,因此我们需要使用axios插件实现发送网络请求。在开发项目的时候

我们经常会把axios进行二次封装。

目的:

1:使用请求拦截器，可以在请求拦截器中处理一些业务(开始进度条、请求头携带公共参数)

2:使用响应拦截器，可以在响应拦截器中处理一些业务(进度条结束、简化服务器返回的数据、处理http网络错误)

在根目录下创建`utils/request.ts`

```ts [request.ts]
// axios二次封装
import axios from 'axios'
import { ElMessage } from 'element-plus'

let request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API, // 基础路径带上/api
  timeout: 5000,
})

//请求拦截器
request.interceptors.request.use((config) => {
  //获取token,在请求头携带
  const token = localStorage.getItem('Authorization')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

//响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    let msg: string = ''
    let status: number = error.response.status
    switch (status) {
      case 401:
        msg = 'token过期'
        break
      case 403:
        msg = '无权访问'
        break
      case 404:
        msg = '请求地址错误'
        break
      case 500:
        msg = '服务器错误'
        break
      default:
        msg = '未知错误'
        break
    }
    ElMessage.error(msg)
    return Promise.reject(error)
  },
)

export default request

```

``` [.env.development]
# 变量必须以 VITE_ 为前缀才能暴露给外部读取
NODE_ENV = 'development'
VITE_APP_TITLE = 'ZZY后台'
VITE_APP_BASE_API = '/api'
VITE_SERVE='http://127.0.0.1:8080'
```

简单测试下
```vue [App.vue]
<script setup lang="ts">
import { onMounted } from 'vue';
import request from './utils/request';

onMounted(() => {
  request({
    url: '/user/login',
    method: 'post',
    data: {
      username: 'admin',
      password: '111111',
    },
  }).then((res) => {
    console.log(res);
  })
})
</script>
```

### API接口统一管理

在开发项目的时候,接口可能很多需要统一管理。

在src目录下去创建api文件夹去统一管理项目的接口；


`api`创建user文件夹放用户相关接口

user下创建`index.ts`及`type.ts`

```ts [index.ts]
// 同意管理用户相关接口

import request from '@/utils/request'
import type { loginForm, loginResponse, userResponseData } from './type'

// 管理接口地址
enum API {
  LOGIN_URL = '/user/login',
  USER_INFO_URL = '/user/info',
}

// 暴露请求函数

export const reqLogin = (data: loginForm) =>
  request.post<any, loginResponse>(API.LOGIN_URL, data)

export const reqUserInfo = () =>
  request.get<any, userResponseData>(API.USER_INFO_URL)

```

```ts [type.ts]
// 登录接口的参数ts类型
export interface loginForm {
  username: string
  password: string
}

export interface loginResponse {
  code: number
  data: dataType
}

interface dataType {
  token: string
}

interface userInfo {
  userId: number
  avatar: string
  username: string
  password: string
  desc: string
  roles: string[]
  buttons: string[]
  routes: string[]
  token: string
}

interface user {
  checkUser: userInfo
}

export interface userResponseData {
  code: number
  data: user
}

```

测试使用
```vue [App.vue]
<template>
  <div></div>
</template>

<script setup lang="ts">
  import { ref, reactive, toRefs, onMounted } from 'vue'
  import { reqLogin } from './api/user'
  onMounted(() => {
    reqLogin({ username: 'admin', password: '111111' }).then((res) => {
      console.log(res)
    })
  })
</script>

<style scoped lang="scss"></style>

```


## router

```bash
pnpm install vue-router
```

创建`router`,`views`文件夹

以及`view/home/index.vue`，`view/login/index.vue`，`view/404/index.vue`，`router/index.ts`，`router/routes.ts`文件


`main.ts`
```ts [main.ts]
import router from '@/router'

app.use(router)
```

```ts [routes.ts]
// 对外暴露配置路由（常量路由）
export const constantRoute = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/index.vue'),
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/404/index.vue'),
  },
  {
    // 任意路由
    path: '/:pathMatch(.*)*',
    name: 'Any',
    redirect: '/404',
  },
]

```

```ts [index.ts]
// 通过vue-router实现模版路由配置
import { createRouter, createWebHistory } from 'vue-router'
import { constantRoute } from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoute,
  // 滚动行为
  scrollBehavior() {
    return {
      left: 0,
      top: 0,
    }
  },
})

export default router


```

`App.vue`
```vue
<template>
  <div>
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss"></style>

```


## pinia

```bash
pnpm i pinia
```

创建`src/store/index.ts`
```ts [index.ts]
import { createPinia } from 'pinia'

let pinia = createPinia()

export default pinia

```

`main.ts`
```ts [main.ts]
import pinia from './store'

app.use(pinia)
```

创建`src/store/modules/user.ts`

```ts [user.ts]
import { defineStore } from 'pinia'
import { reqLogin } from '@/api/user'
import type { loginForm } from '@/api/user/type'

let useUserStore = defineStore('User', {
  state: () => {
    return {
      token: localStorage.getItem('Authorization') || '',
    }
  },
  actions: {
    async userLogin(val: loginForm) {
      let response: any = await reqLogin(val)
      if (response.code === 200) {
        this.token = response.data.token
        localStorage.setItem('Authorization', response.data.token)
        return 'ok'
      } else {
        return Promise.reject(new Error(response.data.message))
      }
    },
  },
  getters: {},
})

export default useUserStore

```

### 持久化
```bash
npm i pinia-plugin-persistedstate

yarn add pinia-plugin-persistedstate

pnpm i pinia-plugin-persistedstate

```

`src/store/index.ts`
```ts [index.ts]
import { createPinia } from "pinia" //引入pinia
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' //引入持久化插件

const pinia = createPinia() //创建pinia实例
pinia.use(piniaPluginPersistedstate) //将插件添加到 pinia 实例上

export default pinia //导出pinia用于main.js注册
```
**基本使用**

将 persist 选项设置为 true，整个 Store 将使用默认持久化配置保存。

```ts{16}[user.ts]
import { defineStore } from "pinia"

const useUserInfoStore = defineStore('userInfo', {
  // defineStore('userInfo',{})  userInfo就是这个仓库的名称name
  state: () => ({
    username:'赫赫',
    age: 23,
    like: 'girl',
  }),
  getters: {
        ...........
  },
  action：{
    .........
  },
  persist: true,
})

export default useUserInfoStore
```


## i18n

```bash
pnpm install vue-i18n
```
建个组件`/src/components/LanguageSwitcher/index.vue`
```vue
<template>
  <!-- 主容器，需要 relative 定位 -->
  <div
    class="custom-hover-language-switcher"
    @mouseenter="openMenu"
    @mouseleave="closeMenuWithDelay"
  >
    <!-- 触发器 -->
    <span class="switcher-trigger">
      <!-- 使用 Element Plus 的图标组件 -->
      <el-icon :size="15">
        <!-- <ChatDotRound />  -->
        <SvgIcon name="internationalization" height="19px" width="20px"></SvgIcon>
      </el-icon>
      <!-- 可选：显示当前语言 -->
      <span class="current-lang-text">{{ currentLanguage.toUpperCase() }}</span>
    </span>

    <!-- 自定义下拉菜单，使用 v-if 控制显示隐藏 -->
    <!-- 注意：菜单本身不需要监听 hover 事件，因为父容器已经处理了 -->
    <transition name="dropdown-fade">
      <!-- 添加一个过渡效果，让显示/隐藏更平滑 -->
      <div v-if="isMenuOpen" class="dropdown-menu">
        <!-- 遍历语言列表生成菜单项 -->
        <div
          v-for="lang in languages"
          :key="lang.code"
          class="menu-item"
          :class="{ 'is-active': lang.code === currentLanguage }"
          @click="handleCommand(lang.code)"
        >
          {{ lang.name }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
  import { ref, defineProps, defineEmits, onUnmounted } from 'vue' // 需要 onUnmounted 来清理定时器
  import { ElIcon } from 'element-plus'
  import { ChatDotRound } from '@element-plus/icons-vue'
  import { useI18n } from 'vue-i18n' // 假设你使用 vue-i18n

  const { locale, t } = useI18n()

  const props = defineProps({
    languages: {
      type: Array,
      default: () => [
        { code: 'zh', name: '中文' },
        { code: 'en', name: 'English' },
      ],
    },
  })

  // 响应式变量，控制下拉菜单的显示/隐藏
  const isMenuOpen = ref(false)

  // 响应式变量，存储当前选中的语言代码，用于高亮显示
  // 从 localStorage 读取或使用默认值 'zh'
  const currentLanguage = ref(localStorage.getItem('language') || 'zh')

  // 用于存储定时器的变量
  let closeTimer = null

  // 打开菜单的方法 (清除任何待定的关闭定时器)
  const openMenu = () => {
    clearTimeout(closeTimer) // 清除定时器
    isMenuOpen.value = true
  }

  // 延迟关闭菜单的方法
  const closeMenuWithDelay = () => {
    // 先清除旧的定时器，避免重复设置
    clearTimeout(closeTimer)
    // 设置一个新的定时器
    closeTimer = setTimeout(() => {
      isMenuOpen.value = false
    }, 150) // 延迟 150 毫秒关闭，这个值可以根据需要调整
  }

  // 立即关闭菜单的方法 (用于点击菜单项后调用)
  const closeMenu = () => {
    clearTimeout(closeTimer) // 立即关闭时也要清除定时器
    isMenuOpen.value = false
  }

  // 处理菜单项点击事件
  const handleCommand = (command) => {
    console.log('切换到语言:', command)

    // 更新当前语言响应式变量，用于高亮显示
    currentLanguage.value = command

    // 执行您的语言切换逻辑
    locale.value = command
    localStorage.setItem('language', command)

    // 触发父组件的事件 (如果需要)
    // emit('changeLanguage', command);

    // 点击菜单项后立即关闭菜单
    closeMenu()
  }

  // 组件卸载时，确保清除定时器，防止内存泄漏
  onUnmounted(() => {
    clearTimeout(closeTimer)
  })
</script>

<style scoped>
  /* 主容器样式 */
  .custom-hover-language-switcher {
    position: relative; /* 相对定位，为下拉菜单提供定位参考 */
    display: inline-block; /* 使容器宽度包裹内容 */
    vertical-align: middle; /* 如果在行内使用，可以帮助对齐 */
    /* 确保有足够宽度包含触发器和菜单 */
    /* background-color: rgba(255,0,0,0.1); /* 临时添加背景色，用于调试 hover 区域 */
  }

  /* 触发器样式 */
  .switcher-trigger {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    padding: 8px 12px;
    /* background-color: rgba(64, 158, 255, 0.1); */
    border-radius: 6px;
    transition: all 0.3s ease;
    gap: 6px;
  }

  .switcher-trigger:hover {
    background-color: rgba(64, 158, 255, 0.2);
    transform: translateY(-1px);
  }

  /* 自定义下拉菜单样式 */
  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 100;
    background-color: #fff;
    border: none;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    padding: 8px;
    margin-top: 8px;
    min-width: 120px;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }

  /* 菜单项样式 */
  .menu-item {
    padding: 10px 16px;
    line-height: 20px;
    cursor: pointer;
    color: #606266;
    font-size: 14px;
    border-radius: 6px;
    margin: 2px 0;
    transition: all 0.3s ease;
  }

  /* 菜单项悬停样式 */
  .menu-item:hover {
    background-color: #f0f9ff;
    color: #409eff;
    transform: translateX(4px);
  }

  /* 当前激活菜单项样式 */
  .menu-item.is-active {
    font-weight: 600;
    color: #409eff;
    background-color: rgba(64, 158, 255, 0.1);
  }

  /* 过渡效果样式 */
  .dropdown-fade-enter-active {
    transition: all 0.3s ease;
  }
  .dropdown-fade-leave-active {
    transition: all 0.2s ease;
  }
  .dropdown-fade-enter-from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  .dropdown-fade-leave-to {
    opacity: 0;
    transform: translateY(-5px) scale(0.98);
  }
  .current-lang-text {
    font-size: 11px;
    font-weight: 500;
    color: var(--el-color-primary);
  }

  @media (max-width: 768px) {
    .dropdown-menu {
      right: -10px;
      min-width: 100px;
    }

    .current-lang-text {
      display: none;
    }
  }
</style>

```

创建`src/i18n/index.ts`
```ts
import { createI18n } from 'vue-i18n'
import en from './lang/en'
import zh from './lang/zh'
let language = localStorage.getItem('language')
const i18n = createI18n({
  locale: language ? language : 'zh', // 默认是中文
  //   fallbackLocale: 'en', // 语言切换的时候是英文
  globalInjection: true, //全局配置$t
  legacy: false, //vue3写法
  messages: { en, zh },
})

export default i18n

```

创建`src/i18n/lang/en.ts`,`src/i18n/lang/zh.ts`

```ts [zh.ts]
// 中文语言包

export default {
  common: {
    login: '登录',
    logout: '退出登录',
    home: '首页',
    admin: '管理员',
  },
  login: {
    username: '用户名',
    password: '密码',
    loginBtn: '立即登录',
  },
  greeting: {
    morning: '早上好！',
    noon: '上午好！',
    afternoon: '下午好！',
    evening: '晚上好！',
  },
  menu: {
    system: '系统',
  },
}

```

```ts [en.ts]
// 英文语言包

export default {
  common: {
    login: 'Login',
    logout: 'Logout',
    home: 'Home',
    admin: 'Administrator',
  },
  login: {
    username: 'Username',
    password: 'Password',
    loginBtn: 'Sign In',
  },
  greeting: {
    morning: 'Good Morning!',
    noon: 'Good Morning!',
    afternoon: 'Good Afternoon!',
    evening: 'Good Evening!',
  },
  menu: {
    system: 'System',
  },
}

```

`App.vue`
```vue
<template>
  <el-config-provider :locale="ellocale">
    <RouterView></RouterView>
  </el-config-provider>
</template>

<script setup lang="ts">
  import zhCn from 'element-plus/es/locale/lang/zh-cn'
  import en from 'element-plus/es/locale/lang/en'

  import { useI18n } from 'vue-i18n'
  import { computed } from 'vue'

  const { locale } = useI18n()
  const ellocale = computed(() => (locale.value == 'zh' ? zhCn : en))
</script>

<style lang="scss" scoped></style>

```

`main.ts`
```ts
import i18n from '@/i18n'

app.use(i18n)
```

vue文件使用
```vue
<span>{{ t('menu.system') }}</span>
```

ts使用
```ts
  import { useI18n } from 'vue-i18n'
  const { locale, t } = useI18n()
  console.log(t('menu.system'))
```

## nprogress

```bash
pnpm i nprogress
```

`vite-env.d.ts`
```ts [vite-env.d.ts]
declare module 'nprogress'
```

`src/permission.ts`
```ts{12,18,3,4}
// 路由鉴权
import router from '@/router'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // to: 即将要进入的目标路由对象
  // from: 当前导航正要离开的路由
  // next: 调用该方法后，才能进入下一个钩子

  nprogress.start()
  next()
})

// 全局后置守卫
router.afterEach((to, from) => {
  nprogress.done()
})

```

`main.ts`
```ts [main.ts]
import './permission'
```


---

项目地址：[地址](https://github.com/zxyang3636/vue3_admin_template)

reference:[reference](https://gitee.com/jch1011/vue3_admin_template-bj1)

笔记参考：[语雀](https://www.yuque.com/aosika-j6ubd/kucrsm/sggz6rsnecr0hhlf?singleDoc#WgHRr)

[语雀](https://www.yuque.com/aosika-j6ubd/kucrsm/gyw43hwgahtz3tzg#faJNh)
