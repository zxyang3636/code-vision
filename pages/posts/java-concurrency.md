---
title: Java 并发编程基础
categories: Java
tags:
  - 后端
  - Java
  - 多线程
---


## 进程与线程




### 进程
- 程序由指令和数据组成，但这些指令要运行，数据要读写，就必须将指令加载至 CPU，数据加载至内存。在指令运行过程中还需要用到磁盘 、网络等设备。**进程就是用来加载指令、管理内存、管理 IO 的** 
- 当一个程序被运行，从磁盘加载这个程序的代码至内存，这时就开启了一个进程。 
- 进程就可以视为程序的一个实例。大部分程序可以同时运行多个实例进程（例如记事本、画图、浏览器等），也有的程序只能启动一个实例进程（例如网易云音乐、360 安全卫士等） 
>进程可以理解为程序的执行过程，是动态的！


### 线程

- 一个进程之内可以分为一到多个线程。 
- 一个线程就是一个指令流，将指令流中的一条条指令以一定的顺序交给 CPU 执行 
- Java 中，线程是最小的调度单位，进程作为资源分配的最小单位。 在 Windows 中进程是不活动的，只是作为线程的容器


### 对比
- 进程基本上相互独立，而线程存在于进程内，是进程的一个子集
- 进程拥有共享的资源，如内存空间等，供其内部的线程共享
- 进程间通信较为复杂
  - 同一台计算机的进程通信称为 IPC (Inter-process communication)
  - 不同计算机之间的进程通信，需要通过网络，并遵守共同的协议，例如 HTTP 协议
- 线程通信相对简单，因为它们共享进程内的内存，多个线程可以访问同一个共享变量
- 线程更轻量，线程上下文切换成本一般要比进程上下文切换低

### 💡面试题
什么是进程和线程？

进程是程序的一次执行过程，是系统运行程序的基本单位，因此进程是动态的。系统运行一个程序即是一个进程从创建，运行到消亡的过程。

在 Java 中，当我们启动 main 函数时其实就是启动了一个 JVM 的进程，而 main 函数所在的线程就是这个进程中的一个线程，也称主线程。

如下图所示，在 Windows 中通过查看任务管理器的方式，我们就可以清楚看到 Windows 当前运行的进程（.exe 文件的运行）。
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/xw_20250811211830.png)

*何为线程?*

线程与进程相似，但线程是一个比进程更小的执行单位。一个进程在其执行的过程中可以产生多个线程。与进程不同的是同类的多个线程共享进程的**堆**和**方法区**资源，但每个线程有自己的**程序计数器**、**虚拟机栈**和**本地方法栈**，所以系统在产生一个线程，或是在各个线程之间做切换工作时，负担要比进程小得多，也正因为如此，线程也被称为轻量级进程。

## 并行与并发

并发是在同一时间段，并行是在同一时刻！

:::tip
并发（Concurrent）：一个人同时做很多不同事情 

并行（Parallel）：一群人各自同时做很多事情
:::

### 并发
单核 CPU 下，线程实际还是 `串行执行` 的。操作系统中有一个组件叫做*任务调度器*，将 CPU 的时间片（windows 下时间片最小约为 15 毫秒）分给不同的程序使用，只是由于 CPU 在线程间（时间片很短）的切换非常快，人类感觉是同时运行的 。总结为一句话就是： *微观串行，宏观并行* 。

>一般我们会将这种 *线程轮流使用CPU* 的做法称为:  **并发（ Concurrent）**

| CPU  | 时间片 1 | 时间片 2 | 时间片 3 | 时间片 4 |
|------|----------|----------|----------|----------|
| core | 线程 1   | 线程 2   | 线程 3   | 线程 4   |

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/%E5%B9%B6%E5%8F%91%E7%BC%96%E7%A8%8B_page7_image.png)
### 并行
多核 cpu下，每个 `核（core）` 都可以调度运行线程，这时候线程可以是 **并行** 的
| CPU | 时间片 1 | 时间片 2 | 时间片 3 | 时间片 4 |
| --- | --- | --- | --- | --- |
| core 1 | 线程 1 | 线程 1 | 线程 3 | 线程 3 |
| core 2 | 线程 2 | 线程 4 | 线程 2 | 线程 4 |

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/%E5%B9%B6%E5%8F%91%E7%BC%96%E7%A8%8B_page8_image.png)

>在多核 CPU 下并发和并行是同时存在的。

:::info
- 并发（concurrent）是同一时间应对（dealing with）多件事情的能力
- 并行（parallel）是同一时间动手做（doing）多件事情的能力
:::


生活例子
- 家庭主妇做饭、打扫卫生、给孩子喂奶，她一个人轮流交替做这多件事，这时就是并发
- 家庭主妇雇了个保姆，她们一起这些事，这时既有并发，也有并行（这时会产生竞争，例如锅只有一口，一个人用锅时，另一个人就得等待）
- 雇了3个保姆，一个专做饭、一个专打扫卫生、一个专喂奶，互不干扰，这时是并行


### 💡面试题

并发和并行的区别
- 并发：两个及两个以上的作业在同一 时间段 内执行
- 并行：两个及两个以上的作业在同一 时刻 执行
最关键的点是：是否是 同时 执行

同步和异步的区别
- 同步：发出一个调用之后，在没有得到结果之前， 该调用就不可以返回，一直等待。
- 异步：调用在发出之后，不用等待返回结果，该调用直接返回。


## 线程基本应用

### 异步调用

从方法调用方的角度来讲，如果：
- 需要等待结果返回，才能继续运行就是 **同步**
- 不需要等待结果返回，就能继续运行就是 **异步**

注：同步在多线程中还有另外一个意思，就是让多个线程步调一致


1）设计
多线程可以让方法执行变成异步的（即不要一直干等着）。比如读取磁盘文件时，假设读取操作需要花费 5s，如果没有线程调度机制，那么这 5s 调用者其他的事都做不了，其余代码都得暂停。

2）结论
- 在项目中，如果需要进行一些费时操作，比如视频文件需要转换格式等操作，这时开一个新线程处理视频转换，避免阻塞住主线程
- Tomcat 的异步 Servlet 也是类似的目的，让用户线程处理耗时较长的操作，避免阻塞 Tomcat 的工作线程 
- UI 程序中，开线程进行其他操作，避免阻塞 UI 线程

同步等待
```java
@Slf4j(topic = "c.Sync")
public class Sync {
    public static void main(String[] args) {
        FileReader.read(Constants.MP4_FULL_PATH);  // 同步调用
        log.debug("do other things ...");
    }
}
```
异步不等待
```java
@Slf4j(topic = "c.Async")
public class Async {
    public static void main(String[] args) {
        // 异步调用
        new Thread(new Runnable() {
            public void run() {
                FileReader.read(Constants.MP4_FULL_PATH);
            }
        }).start();

        log.debug("do other things ...");
    }
}
```

---
**提高运行效率**

充分利用多核 cpu 的优势，提高运行效率。想象下面的场景：执行 3 个计算，最后将计算结果汇总。

>计算 1 花费 10 ms
>
>计算 2 花费 11 ms
>
>计算 3 花费 9 ms
>
>汇总需要 1 ms

- 如果是串行执行，那么总共花费的时间是 10 + 11 + 9 + 1 = 31ms 
- 但如果是四核 cpu，各个核心分别使用线程 1 执行计算 1，线程 2 执行计算 2，线程 3 执行计算 3，那么 3 个 线程是并行的，花费时间只取决于最长的那个线程运行的时间，即 11ms最后加上汇总时间只会花费 12ms 
- 需要在多核 cpu 才能提高效率，单核仍然是轮流执行。


---

## 创建与运行线程

### 使用Thread

>Java 程序在启动时，都会创建一个主方法线程（也称：主线程）。默认就已经有一个主线程在运行。
```java
// 创建线程对象
Thread t = new Thread("t1") {
    @Override
    public void run() {
        // 要执行的任务
    }
};
// 启动线程
t.start();
```

指定名称
```java
@Slf4j(topic = "c.Test1")
public class DirectUseThreadTest {
    public static void main(String[] args) {
        // 创建线程
        Thread t1 = new Thread("t1") {  // 指定名称（方式一）
            @Override
            public void run() {
                log.debug("running ...");
            }
        };

        t1.setName("t1");  // 指定名称（方式二）

        // 启动线程
        t1.start();

        // 主线程打印
        log.debug("running ...");
    }
}
```

Lambda写法
```java
@Slf4j
public class ThreadDemo {
    public static void main(String[] args) {
        new Thread(() -> {
            log.info("running");
        }, "t1").start();

        log.info("main");
    }
}
```


### 使用Runable配合Thread
把【线程】和【任务】(要执行的代码) 分开
- Thread 代表线程
- Runnable 代表可运行的任务（线程要执行的代码）

语法：
```java
Runnable runnable = new Runnable() {
    @Override
    public void run() {
        // 要执行的任务
    }
};
// 创建线程对象
Thread t = new Thread(runnable);
// 启动线程
t.start();
```

```java
// 创建任务对象
Runnable task2 = new Runnable() {
    @Override
    public void run() {
        log.debug("hello");
    }
};

// 参数1 是任务对象; 参数2 是线程名字
Thread t2 = new Thread(task2, "t2");
t2.start();
```

lambda表达式:
```java
// 创建任务对象
Runnable task2 = () -> log.debug("hello");

// 参数1 是任务对象; 参数2 是线程名字，推荐
Thread t2 = new Thread(task2, "t2");
t2.start();



public static void test2() {
    Runnable runnable = () -> log.info("runnable running");
    new Thread(runnable, "t2").start();
}
```

原理 —— Thread 与 Runnable 的关系

Thread 核心源码
```java
private Runnable target;

@Override
public void run() {
    if (target != null) {
        target.run();
    }
}
```
实际，就是在 Thread 中的 run 方法里面调用了 Runnable 方法的 run 方法来执行任务。

- 第一种创建线程的方法是把线程和任务的创建合并在了一起，第二种创建线程的方法是把线程和任务分开创建了 
- 用 Runnable 更容易与线程池等高级 API 配合 
- 用 Runnable 让任务类脱离了 Thread 继承体系，更灵活

### FutureTask配合Thread

FutureTask能够接收Callable类型的参数，用来**处理有返回结果的情况**。

```java
@Slf4j(topic = "c.Test3")
public class FutureAndCallableTest {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        // 1.创建任务对象
        FutureTask<Integer> task = new FutureTask<>(new Callable<>() {
            @Override
            public Integer call() throws Exception {
                log.debug("running ...");
                Thread.sleep(4000);
                return 100;
            }
        });

        // 2.创建线程对象，并关联任务
        Thread t = new Thread(task, "t3");

        t.start();

        // 主线程运行到此处时，就会一直阻塞。直到 task 执行完毕后返回结果
        log.debug("{}",  task.get());
    }
}
```

```
11:46:34.082 c.Test3 [t3] - running ...
11:50:35.093 c.Test3 [main] - 100
```

lambda:
```java
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        FutureTask<Integer> task = new FutureTask<>(() -> {
            TimeUnit.SECONDS.sleep(1);
            log.info("running...");
            return 100;
        });
        new Thread(task, "t1").start();
        Integer i = task.get();
        log.info("i:{}", i);
    }
```


## 查看进程线程的方法

Windows
- 任务管理器可以查看进程和线程数，也可以用来杀死进程
- `tasklist` 查看进程
- `taskkill` 杀死进程

linux
- `ps -ef` 查看所有进程
- `ps -fT -p <PID>` 查看某个进程（PID）的所有线程
- `kill` 杀死进程
- `top` 按大写 H 切换是否显示线程
- `top -H -p <PID>` 查看某个进程（PID）中的所有线程

Java
- `jps` 命令查看所有 Java 进程
- `jstack <PID>` 查看某个 Java 进程（PID）在运行 jstack 时的所有线程状态
- `jconsole` 来查看某个 Java 进程中线程的运行情况（图形界面）