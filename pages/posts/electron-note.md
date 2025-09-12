---
title: Electron 基础
categories: 前端
tags:
  - Electron
  - 桌面应用
---

## 什么是 Electron

Electron 是⼀个 **跨平台** 的 **桌⾯应⽤** 开发框架，开发者可以使⽤：HTML、CSS、JavaScript 等 Web 技术来构建桌⾯应⽤程序，
它的本质是结合了 `Chromium` 和 `Node.js`，现在⼴泛⽤于桌⾯应 ⽤程序开发，例如这写桌⾯应⽤都⽤到了 Electron 技术：

- 一款应用广泛的跨平台的桌面应用开发框架。
- Electron 的本质是结合了 `Chromium` 与 `Node.js`
- 使用 HTML、CSS、JS 等 Web 技术构建桌面应用程序。

Electron = Chromium + Node.js + Native API(Electron 原生的 API)

### 常见的桌面GUI
|名称|语音|优点|缺点|
|----|----|----|----|
|QT|C++|跨平台、性能好、生态好|依赖多，程序包大|
|PyQT|Python|底层集成度高、易上手|授权问题(收费)|
|WPF|C#|类库丰富、扩展灵活|只支持Windows，程序包大|
|WinForm|C#|性能好，组件丰富，易上手|只支持Windows，UI差|
|Swing|Java|基于AWT，组件丰富|性能差，UI一般|
|NW.js|JS|跨平台性好，界面美观|底层交互差、性能差，包大|
|Electron|JS|相比NW拓展更好|底层交互差、性能差，包大|
|CEF|C++|性能好，灵活集成，UI美观|占用资源多，包大|

## Electron 流程模型

主进程就是个`.js`文件，这个 js 文件是个纯粹的 node 环境；主进程主要目的就是管理渲染进程；主进程可以管理多个渲染进程，主进程只有一个，渲染进程可以有n个

主进程是可以调用原生 API 的

一个窗口背后对应一个渲染进程，渲染进程就是浏览器环境，需要用 HTML、CSS、JS 来支撑

进程间的通信简称 IPC

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/%E4%B8%80%E5%B0%8F%E6%97%B6%E5%BF%AB%E9%80%9F%E4%B8%8A%E6%89%8BElectron_page2_image.png)

:::tip
Node 环境（Node.js runtime environment）的内置模块：核心 API，比如：
fs（文件系统）
http / https（网络）
path（路径处理）
os（系统信息）等等，还有 JS 执行环境（V8）；

Node 环境不包含 DOM / BOM，没有 window、document、alert、localStorage。因为 Node 不运行在浏览器里，它不关心页面。
:::

## 搭建工程

```shell
npm init

# 然后一路回车到底
```

修改`package.json`文件

```json{4,8,10}
{
  "name": "electron_test",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "zzy",
  "license": "ISC",
  "description": "this is a electron demo"
}

```

安装 Electron

```shell
npm i electron -D
```

修改这里：

```json
  "scripts": {
    "start": "electron ."
  },
```

**根目录创建 main.js 文件**

```js
const { app, BrowserWindow } = require("electron");

app.on("ready", () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true, // 是否隐藏顶部菜单栏
    alwaysOnTop: false, // 是否一直置顶
  });
  win.loadFile("./pages/index.html");
});
```

关于 BrowserWindow 的更多配置项，请参考：[BrowserWindow 实例属性](https://www.electronjs.org/zh/docs/latest/api/base-window#%E5%AE%9E%E4%BE%8B%E5%B1%9E%E6%80%A7)

根目录创建`pages/index.html`文件以及`pages/index.css`文件

**运行**

```shell
npm start
```

此时开发者⼯具会报出⼀个安全警告，需要修改`index.html`，配置 CSP(Content- Security-Policy)

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"/>
```

上述配置的说明

1. default-src 'self'
   default-src：配置加载策略，适用于所有未在其它指令中明确指定的资源类型。
   self：仅允许从同源的资源加载，禁止从不受信任的外部来源加载，提高安全性。
2. style-src 'self' 'unsafe-inline'
   style-src：指定样式表（CSS）的加载策略。
   self：仅允许从同源的资源加载，禁止从不受信任的外部来源加载，提高安全性。
   unsafe-inline：允许在 HTML 文档内使用内联样式。
3. img-src 'self' data:
   img-src：指定图像资源的加载策略。
   self：表示仅允许从同源加载图像。
   data:：允许使用 data: URI 来嵌入图像。这种 URI 模式允许将图像数据直接嵌入到 HTML 或 CSS 中，而不是通过外部链接引用。
   关于 CSP 的详细说明请参考：[MDN-Content-Security-Policy](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Security-Policy)、[Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)

## 完善窗口行为

1. Windows 和 Linux 平台窗⼝特点是：关闭所有窗⼝时退出应⽤。
2. mac 应⽤即使在没有打开任何窗⼝的情况下也继续运⾏，并且在没有窗⼝可⽤的情况下激活 应⽤时会打开新的窗⼝。

在 main.js 中添加如下代码

```js{13-22}
const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true, // 是否隐藏顶部菜单栏
    alwaysOnTop: false, // 是否一直置顶
  });
  win.loadFile("./pages/index.html");
}

app.on("ready", () => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

```

## 配置⾃动重启

1. 安装 Nodemon

```shell
npm i nodemon -D
```

2. 修改 package.json 文件

```json
"scripts": {
  "start": "nodemon --exec electron ."
}
```

3. 配置 nodemon.json 规则
   根目录创建 `nodemon.json` 文件

```json
{
  "ignore": ["node_modules", "dist"],
  "restartable": "r",
  "watch": ["*.*"],
  "ext": "html,js,css"
}
```

## 主进程与渲染进程

**主进程**
每个 Electron 应⽤都有⼀个单⼀的主进程，作为应⽤程序的⼊⼝点。 主进程在 Node.js 环境中运 ⾏，它具有 require 模块和使⽤所有 Node.js API 的能⼒，主进程的核⼼就是：使用BrowserWindow来创建和管理窗口。


**渲染进程**

每个 BrowserWindow 实例都对应一个单独的渲染器进程，运行在渲染器进程中的代码，必须遵守网页标准，这也就意味着：**渲染器进程无权直接访问 require 或使用任何 Node.js 的 API**。



>问题产生：处于渲染器进程的用户界面，该怎样才与 Node.js 和 Electron 的原生桌面功能进行交互呢？


## Preload 脚本

预加载（Preload）脚本是运行在渲染进程中的，但它是在网页内容加载之前执行的，这意味着它具有比普通渲染器代码更高的权限，可以访问 `Node.js` 的 API，同时又可以与网页内容进行安全的交互。

简单说：它是 Node.js 和 Web API 的桥梁，Preload 脚本可以安全地将部分 Node.js 功能暴露给网页，从而减少安全风险。

**预加载脚本应用**

主进程：根目录的main.js
```js
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true, // 是否隐藏顶部菜单栏
    alwaysOnTop: false, // 是否一直置顶
    webPreferences: {   // 可以在安全的情况下，把 Node.js / Electron 的 API 暴露给网页。
      preload: path.resolve(__dirname, "./preload.js"),
    },
  });
  win.loadFile("./pages/index.html");
}

app.on("ready", () => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
```

根目录下的`perload.js`
```js
const { contextBridge } = require("electron");  // 从 Electron 引入 contextBridge，它是 上下文桥接 API。
console.log("proload...");

// exposeInMainWorld 的意思是：把对象注入到渲染进程的 全局 window 上。
contextBridge.exposeInMainWorld("myAPI", {
  version: process.version, // // Node.js 的版本号
});

```

pages/render.js
```js
const btn1 = document.getElementById("btn1");

btn1.onclick = () => {
  alert(myAPI.version)
  console.log(window);
};

```
点击按钮后即可看到版本号


:::tip
- 脚本的执行顺序：主进程->预加载脚本->渲染进程 （preload.js 是一个 预加载脚本，它会在 渲染进程加载页面之前运行。）
- 预加载脚本可以使用一部分Node的API
:::


## 进程通信（IPC）
上文中的 `preload.js` ，无法使用全部 Node 的 API ，比如：不能使用 Node 中的 `fs 模块`，但主进程（main.js）是可以的，这时就需要**进程通信**了。简单说：要让 `preload.js` 通知 `main.js` 去调用 `fs 模块`去干活。

关于 `Electron` 进程通信，我们要知道：
- IPC 全称为：`InterProcess Communication` ，即：进程通信。
- IPC 是 `Electron` 中最为核心的内容，它是从 UI 调用原生 API 的唯一方法！
- Electron 中，主要使用 `ipcMain` 和 `ipcRenderer` 来定义“通道”，进行进程通信。



### 渲染进程->主进程(单项)

概述: 在渲染器进程中 [ipcRenderer.send](https://www.electronjs.org/zh/docs/latest/api/ipc-renderer) 发送消息,在主进程中使用 [ipcMain.on](https://www.electronjs.org/zh/docs/latest/api/ipc-main) 接收消息。

常用于: **在 Web 中调用主进程的 API**,例如下面的这个需求:

>需求: 点击按钮后,在用户的 D 盘创建一个 `hello.txt` 文件,文件内容来自于用户输入。

思路肯定是：从渲染进程拿到用户输入的信息，想办法通知给主进程，让主进程拿到用户的输入，写入D盘，hello.txt

页面中添加相关元素，`render.js`中添加对应脚本

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Electron demo</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"/>
    <link rel="stylesheet" href="./index.css" />
  </head>
  <body>
    <button id="btn1">按钮</button>
    <hr>
    <br>
    <br>
    <input id="input" />
    <button id="btn2">向D盘写入hello.txt</button>


    <script type="text/javascript" src="./render.js"></script>
  </body>
</html>

```

```js [render.js]
const btn1 = document.getElementById("btn1");
const btn2 = document.getElementById("btn2");
const input = document.getElementById("input");

btn1.onclick = () => {
  alert(myAPI.version);
  console.log(window);
};

btn2.onclick = () => {
  myAPI.saveFile(input.value);
};

```

`preload.js` 中使用 `ipcRenderer.send('信道', 参数)` 发送消息，与主进程通信。
```js [preload.js]
const { contextBridge, ipcRenderer } = require("electron");
console.log("proload...");

contextBridge.exposeInMainWorld("myAPI", {
  version: process.version,
  saveFile: (data) => {
    ipcRenderer.send("file-save", data); // 渲染进程给主进程发送⼀个消息
  },
});

```

主进程中，在加载页面之前，使用 `ipcMain.on('信道', 回调)` 配置对应回调函数，接收消息。
```js [main.js]
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

function writeFile(_, data) {
  fs.writeFileSync("D:/hello.txt", data);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true, // 是否隐藏顶部菜单栏
    alwaysOnTop: false, // 是否一直置顶
    webPreferences: {
      preload: path.resolve(__dirname, "./preload.js"),
    },
  });
  ipcMain.on("file-save", writeFile);
  win.loadFile("./pages/index.html");
}
```


:::tip
主进程你就引入`ipcMain`模块，渲染进程你就引入`ipcRenderer`模块。

`ipcMain.on(channel, listener)` – 监听指定通道的消息，当收到时调用 listener 函数。`"file-save"`：通道名，自定义字符串；
writeFile：监听器函数（listener），这是一个回调函数。当消息到达时，Electron 会自动调用 writeFile

`ipcRenderer.send(channel, ...args)` – 向主进程发送异步消息；`"file-save"`：通道名，必须与主进程监听的相同。data：发送的数据；
:::


### 渲染进程<=>主进程（双向）



概述：渲染进程通过[ipcRenderer.invoke](https://www.electronjs.org/zh/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args)发送消息，主进程使用[ipcMain.handle](https://www.electronjs.org/zh/docs/latest/api/ipc-main#ipcmainhandlechannel-listener)接收并处理消息


备注: `ipcRender.invoke` 的返回值是 `Promise` 实例。

常用于：**从渲染器进程调用主进程方法并等待结果**，例如下面的这个需求：

>需求：点击按钮从 D 盘读取 hello.txt 中的内容，并将结果呈现在页面上。


思路：渲染进程要想办法告诉主进程要读取hello.txt文件，主进程读取文件后，把文件内容返回给渲染进程，渲染进程再把文件内容呈现在页面上。

页面中添加相关元素，render.js中添加对应脚本
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Electron demo</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"/>
    <link rel="stylesheet" href="./index.css" />
  </head>
  <body>
    <button id="btn1">按钮</button>
    <hr>
    <br>
    <br>
    <input id="input" />
    <button id="btn2">向D盘写入hello.txt</button>
    <br>
    <br>
    <br>
    <hr>
    <button id="btn3">读取D盘中的hello.txt</button>

    <script type="text/javascript" src="./render.js"></script>
  </body>
</html>

```

`preload.js` 中使用 `ipcRenderer.invoke('信道', 参数)` 发送消息，与主进程通信。
```js [preload.js]
const { contextBridge, ipcRenderer } = require("electron");
console.log("proload...");

contextBridge.exposeInMainWorld("myAPI", {
  version: process.version,
  saveFile: (data) => {
    ipcRenderer.send("file-save", data);
  },
   readFile: () => {
    return ipcRenderer.invoke("file-read");
  },
});

```

主进程中，在加载页面之前，使用 `ipcMain.handle('信道', 回调)` 接收消息，并配置回调函数。
```js [main.js]
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

function readFile() {
  return fs.readFileSync("D:/hello.txt").toString();
}


function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true, // 是否隐藏顶部菜单栏
    alwaysOnTop: false, // 是否一直置顶
    webPreferences: {
      preload: path.resolve(__dirname, "./preload.js"),
    },
  });
  ipcMain.on("file-save", writeFile);
  ipcMain.handle("file-read", readFile);
  win.loadFile("./pages/index.html");
}
```




:::tip
`const result = await ipcRenderer.invoke(channel, ...args);`用于在预加载脚本中发起一个异步请求到主进程，并等待返回 Promise 结果的通信方法。
>channel (必需): 一个字符串，是消息的通道名称或事件名称。。这个名称必须在主进程中由 `ipcMain.handle()`进行监听。
>
>...args (可选): 一个或多个任意类型的参数，会作为参数传递给主进程中的处理函数。
>
>返回值: 返回一个 Promise。

`ipcMain.handle('channel-name', handler)`
>参数1：channel（通道名），类型：string；标识这个处理器监听哪个“频道”。必须与渲染进程 ipcRenderer.invoke(channel, ...) 中的 channel 完全一致。
>
>参数2：listener（监听器函数），类型：Function；当对应 channel 的请求到达时，执行这个函数。
:::


:::warning
渲染进程与渲染进程之间是不能传东西的，可以用主进程作为中间人
:::



## 打包应用


使用 `electron-builder` 打包应用
1. 安装 electron-builder：
```shell
npm install electron-builder -D
```
2. 在 package.json 中进行相关配置，具体配置如下：

备注: json 文件不支持注释, 使用时请去掉所有注释。

```json
{
  "name": "video-tools",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder"
  },
  "build": {
    "appId": "com.atguigu.video",
    "win": {
      "icon": "./logo.ico",
      "target": [
        {
          "target": "nsis",
          "arch": [
            "x64"
          ]
        }
      ]
    },
    "nsis": {
      "oneClick": false,
      "perMachine": true,
      "allowToChangeInstallationDirectory": true
    }
  },
  "devDependencies": {
    "electron": "^30.0.0",
    "electron-builder": "^24.13.3",
    "author": "tianyu",
    "license": "ISC",
    "description": "A video processing program based on Electron"
  }
}
```

<details>
    <summary>注释版本</summary>
    ```
{
  "name": "video-tools", // 应⽤程序的名称
  "version": "1.0.0", // 应⽤程序的版本
  "main": "main.js", // 应⽤程序的⼊⼝⽂件
  "scripts": {
  "start": "electron .", // 使⽤ `electron .` 命令启动应⽤程序
  "build": "electron-builder" // 使⽤ `electron-builder` 打包应⽤程序，⽣成 安装包
  },
  "build": {
  "appId": "com.atguigu.video", // 应⽤程序的唯⼀标识符
  // 打包windows平台安装包的具体配置
  "win": {
  "icon":"./logo.ico", //应⽤图标
  "target": [
  {
  "target": "nsis", // 指定使⽤ NSIS 作为安装程序格式
  "arch": ["x64"] // ⽣成 64 位安装包
  }
  ]
  },
  "nsis": {
  "oneClick": false, // 设置为 `false` 使安装程序显示安装向导界⾯，⽽不是⼀ 键安装
  "perMachine": true, // 允许每台机器安装⼀次，⽽不是每个⽤户都安装
  "allowToChangeInstallationDirectory": true // 允许⽤户在安装过程中选择 安装⽬录
  }
  },
  "devDependencies": {
  "electron": "^30.0.0", // 开发依赖中的 Electron 版本
  "electron-builder": "^24.13.3" // 开发依赖中的 `electron-builder` 版本 },
  "author": "tianyu", // 作者信息
  "license": "ISC", // 许可证信息
  "description": "A video processing program based on Electron" // 应⽤程 序的描述
  }
```
</details>

拿一个script中的`"build": "electron-builder"`以及`build`中内容
最终`package.json`内容如下
```json
{
  "name": "electron_test",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "nodemon --exec electron .",
    "build": "electron-builder"
  },
  "build": {
    "appId": "com.atguigu.video",
    "win": {
      "icon": "./logo.png",
      "target": [
        {
          "target": "nsis",
          "arch": [
            "x64"
          ]
        }
      ]
    },
    "nsis": {
      "oneClick": false,
      "perMachine": true,
      "allowToChangeInstallationDirectory": true
    }
  },
  "author": "zzy",
  "license": "ISC",
  "description": "this is a electron demo",
  "devDependencies": {
    "electron": "^38.1.0",
    "electron-builder": "^26.0.12",
    "nodemon": "^3.1.10"
  }
}

```


3. 执行打包命令
```shell
npm run build
```

如果打包报错，我们可以开启windows的**开发人员模式**，系统->开发人员模式；然后再执行打包命令就可以；

打包后的exe文件就在dist包下；




## electron-vite

electron-vite 是⼀个新型构建⼯具，旨在为 Electron 提供更快、更精简的体验

electron-vite 快速、简单且功能强⼤，旨在开箱即⽤。 官⽹地址：https://cn-evite.netlify.app/


## 项目实战

### 初始化项目


```shell
npm init vite
```

安装依赖
```shell
npm i
```

```shell
npm i electron -D
```

删除 package.json 中的 "type": "module"。改用 CommonJS 规范


根目录创建`main.js`文件
```js
const { app, BrowserWindow } = require("electron");
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
  });
};

app.whenReady().then(() => {
  createWindow();
});
```

修改package.json
```json
"main": "main.js",
"scripts": {
  "start": "electron ."
},
```

**安装nodemon**
```shell
npm i nodemon -D
```
修改package.json
```json
"scripts": {
  "start": "nodemon --exec electron . --watch ./ --ext .js,.html,.css,.vue"
},
```

去掉CSP(Content- Security-Policy)警告，在index.html添加：
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"/>
```
[解决警告](https://blog.csdn.net/hwytree/article/details/121287531)


**安装**
```shell
npm i electron-win-state -D
```

根目录创建preload目录，再创建`index.js`

**最终根目录下的main.js**
```js
const { app, BrowserWindow } = require("electron");
const WinState = require("electron-win-state").default;
const path = require("path");

const createWindow = () => {
  const winState = new WinState({
    defaultWidth: 1000,
    defaultHeight: 800,
  });

  const win = new BrowserWindow({
    ...winState.winOptions,
    webPreferences: {
      preload: path.resolve(__dirname, "./preload/index.js"),
    },

  });

  win.loadURL("http://localhost:3000");
  win.webContents.openDevTools(); // 打开控制台
  winState.manage(win);
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

**package.json**
```json
{
  "name": "pin-box",
  "private": true,
  "version": "0.0.0",
  "main": "main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "nodemon --exec electron . --watch ./ --ext .js,.html,.css,.vue"
  },
  "dependencies": {
    "vue": "^3.5.13"
  },
  "devDependencies": {
    "@types/electron": "^1.4.38",
    "@types/nodemon": "^1.19.6",
    "@vitejs/plugin-vue": "^5.2.1",
    "electron": "^38.1.0",
    "electron-win-state": "^1.1.22",
    "nodemon": "^3.1.10",
    "vite": "^6.0.1"
  }
}

```

**启动项目**
启动vite项目
```shell
npm run dev
```

启动electron
```shell
npm start
```

main.js中的load地址为vite项目的启动地址

**优雅打开窗口**
`main.js`中
```js{16,23,24,25}
const { app, BrowserWindow } = require("electron");
const WinState = require("electron-win-state").default;
const path = require("path");

const createWindow = () => {
  const winState = new WinState({
    defaultWidth: 1000,
    defaultHeight: 800,
  });

  const win = new BrowserWindow({
    ...winState.winOptions,
    webPreferences: {
      preload: path.resolve(__dirname, "./preload/index.js"),
    },
    show: false,
  });

  win.loadURL("http://localhost:5173");
  win.webContents.openDevTools(); // 打开控制台
  winState.manage(win);

  win.on("ready-to-show", () => {
    win.show();
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

```



**整理vue项目**

删除components目录下的所有文件

修改App.vue
```vue
<template>
  <div>
    hello
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, toRefs, onMounted} from 'vue'

</script>

<style scoped lang="scss">
</style>
```

src下创建views文件夹，再创建`Home.vue`


**安装stylus或者安装sass**








