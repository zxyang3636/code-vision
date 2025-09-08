---
title: Java 共享模型之 JMM
categories: Java
tags:
  - 后端
  - Java
  - 并发编程
---


上一章讲解的 Monitor 主要关注的是访问共享变量时，保证临界区代码的【原子性】

这一章我们进一步深入学习共享变量在多线程间的【可见性】问题与多条指令执行时的【有序性】问题 

:::info
volatile可以解决 可见性 和 有序性 问题,但不能处理原子性问题

synchronized 则对于原子性,有序性,可见性, 都可以解决
:::

## Java 内存模型

JMM 即 `Java Memory Model`，它定义了主存、工作内存抽象概念，底层对应着 CPU 寄存器、CPU缓存、硬件内存、CPU 指令优化等。 


JMM 体现在以下几个方面 
- 原子性 - 保证指令不会受到线程上下文切换的影响 
- 可见性 - 保证指令不会受 cpu 缓存的影响 
- 有序性 - 保证指令不会受 cpu 指令并行优化的影响

## 可见性 

**退不出的循环**

```java
static boolean run = true;

public static void main(String[] args) throws InterruptedException {
    
    Thread t = new Thread(()->{
        while(run){
            // ....
        }
    });
    t.start();
    
    sleep(1);
    run = false; // 线程t不会如预想的停下来
}
```
:::info
即便主线程把 run 设为 false，线程 t 一直在循环，程序不会按预期停止。

写入对其他线程不可见
:::

为什么呢？分析一下： 

1. 初始状态， t 线程刚开始从主内存读取了 run 的值到工作内存。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-09-08_23-04-33.png)

2. 因为 t 线程要频繁从主内存中读取 run 的值，JIT 编译器会将 run 的值缓存至自己工作内存中的高速缓存中，减少对主存中 run 的访问，提高效率

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-09-08_23-06-00.png)

3. 1 秒之后，main 线程修改了 run 的值，并同步至主存，而 t 是从自己工作内存中的高速缓存中读取这个变量的值，结果永远是旧值

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-09-08_23-06-56.png)

一个线程对主存的数据进行了修改，对于另外一个线程不可见，这就是可见性问题。

:::tip
JIT（Just-In-Time Compiler，即时编译器）它是 JVM（Java Virtual Machine）的一个重要组件。Java 的特点是 跨平台 —— 写一次，随处运行。这是因为 Java 代码不是直接编译成机器码，而是编译成 字节码（.class 文件），由 JVM 来执行。

**Java 代码执行的流程**

1. 编译阶段（javac）
- Java 源码（.java） → 编译成字节码（.class）。

2. 运行阶段（JVM）
- 解释执行（Interpreter）：一行字节码→翻译成机器码→CPU执行。
（慢，因为要一行一行翻译）
- 即时编译（JIT）：把热点代码（经常执行的代码块，比如循环、方法）一次性翻译成本地机器码，存起来，之后直接执行机器码。
（快，接近C++原生性能）
所以 Java 用 解释器 + JIT 混合模式;

JIT 就是 JVM 的“即时编译器”，它能把热点字节码编译成本地机器码，并进行优化

**热点代码是怎么判定的？**

JVM 里有个“计数器”，比如一个方法调用超过 10000 次，JIT 就会认为它是“热点方法(hotspot code)”，进行优化编译。
这也是为什么 Java 程序刚启动时比较慢，但运行一段时间后性能会提升 —— 因为 JIT 起作用了。

[可参考该博客](https://www.cnblogs.com/somefuture/p/14272221.html)
:::


**解决**

volatile（易变） 

它可以用来**修饰成员变量和静态成员变量**，他可以避免线程从自己的工作缓存中查找变量的值，必须到主存中获取它的值，**线程操作 volatile 变量都是直接操作主存**

```java
@Slf4j
public class Test17 {
    volatile static boolean run = true;

    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(() -> {
            while (run) {
                // ....
            }
        });
        t.start();

        Thread.sleep(1000);
        log.info("停止t");
        run = false; // 线程t不会如预想的停下来
    }
}
```
```
23:44:09.309 [main] INFO com.thread.concurrent1.Test17 -- 停止t
Process finished with exit code 0
```

使用synchronized
```java
@Slf4j
public class Test17 {
    static boolean run = true;

    static Object lock = new Object();

    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(() -> {
            while (true) {
                // ....
                synchronized (lock) {
                    if (!run) {
                        break;
                    }
                }
            }
        });
        t.start();

        Thread.sleep(1000);
        log.info("停止t");
        synchronized (lock) {
            run = false;
        }
    }
}
```

在Java内存模型中，synchronized规定，线程在加锁时， 先清空工作内存→在主内存中拷贝最新变量的副本到工作内存 →执行完代码→将更改后的共享变量的值刷新到主内存中→释放互斥锁。


### 可见性 vs 原子性


前面例子体现的实际就是可见性，它保证的是在多个线程之间，一个线程对 volatile 变量的修改对另一个线程可见，不能保证原子性，**仅用在一个写线程，多个读线程的情况**：

上例从字节码理解是这样的：
```java
getstatic     run     // 线程 t 获取 run true
getstatic     run     // 线程 t 获取 run true
getstatic     run    // 线程 t 获取 run true
getstatic     run     // 线程 t 获取 run true
putstatic     run     // 线程 main 修改 run 为 false，仅此一次
getstatic     run     // 线程 t 获取 run false
```

比较一下之前我们将线程安全时举的例子：两个线程一个`i++`一个`i--`，只能保证看到最新值，不能解决指令交错

```java
// 假设i的初始值为0
getstatic      i  // 线程2-获取静态变量i的值 线程内i=0

getstatic      i  // 线程1-获取静态变量i的值 线程内i=0
iconst_1       // 线程1-准备常量1
iadd           // 线程1-自增 线程内i=1
putstatic      i  // 线程1-将修改后的值存入静态变量i 静态变量i=1

iconst_1       // 线程2-准备常量1
isub           // 线程2-自减 线程内i=-1
putstatic      i  // 线程2-将修改后的值存入静态变量i 静态变量i=-1
```



:::warning
synchronized 语句块既可以保证代码块的原子性，也同时保证代码块内变量的可见性。但缺点是 
synchronized 是属于重量级操作，性能相对更低 



volatile保证可见性，禁止指令重排，不保证原子性。比如 count++ 不是原子操作，用 volatile 不能保证线程安全。
:::


如果在前面示例的死循环中加入 System.out.println() 会发现即使不加 volatile 修饰符，线程 t 也能正确看到对 run 变量的修改了，想一想为什么？

- 是因为它内部用了 `synchronized`

---

### 设计模式-两阶段终止-volatile
[设计模式](https://www.bilibili.com/video/BV16J411h7Rd?t=2.7&p=138)

---



## 有序性

**指令重排**

JVM 会在不影响正确性的前提下，可以调整语句的执行顺序

思考下面一段代码
```java
static int i;
static int j;

// 在某个线程内执行如下赋值操作
i = ...; 
j = ...;
```
可以看到，至于是先执行 i 还是 先执行 j ，对最终的结果不会产生影响。所以，上面代码真正执行时，既可以是
```java
i = ...; 
j = ...;
```
也可以是
```java
j = ...;
i = ...;
```
这种特性称之为『指令重排』，多线程下『指令重排』会影响正确性。


### 指令重排原理-指令并行优化

加工一条鱼需要 50 分钟，只能一条鱼、一条鱼顺序加工...
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-09-09_00-21-31.png)

可以将每个鱼罐头的加工流程细分为5个步骤：
- 去鳞清洗10分钟
- 蒸煮沥水10分钟
- 加注汤料10分钟
- 杀菌出锅10分钟
- 真空封罐10分钟


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-09-09_00-22-38.png)
即使只有一个工人，最理想的情况是：他能够在10分钟内同时做好这5件事，因为对第一条鱼的真空装罐，不会影响对第二条鱼的杀菌出锅...


这个故事讲的是鱼罐头加工的过程。比如说，现在要加工一条鱼，总共需要50分钟。你可以把加工鱼的工人想象成 CPU，而每一条鱼的加工过程，就像 CPU 要执行的一条指令。你会发现，如果每次只处理一条指令，这样的效率其实是比较低的。

那怎么改进呢？在现实生活中，加工鱼罐头肯定不是靠人工一条条慢慢做的，对吧？通常会把整个流程分成多个工序，每个工序之间采用流水线作业，这样可以大大提高生产效率。

类似地，我们也可以把一条鱼的加工过程细分成五个步骤。这五个步骤，我查过资料，分别是：第一步，去鳞和清洗，把鱼洗干净；第二步，蒸煮和沥水，把鱼煮熟；第三步，加注汤料，也就是加入调料和配料；第四步，杀菌；最后一步是真空罐装，这样鱼就变成了罐头。

这样一来，一条鱼的加工过程就被细分成了五个步骤。有同学可能会说，把一条鱼分成五个步骤，每一步花10分钟，加起来还是50分钟，时间并没有减少，效率也没有提高。别急，我们接着往下看。现在我们来看，有一个工人要按照这五个步骤来加工鱼。其实，真正的鱼罐头加工并不是全靠人工完成的，而是在不同阶段会用到不同的机器，比如去鳞机、蒸煮锅、汤料锅、杀菌锅，还有封罐器。

比如说，当工人在操作封罐机的时候，封罐其实是机器在做的。与此同时，他可以让另一条鱼进入杀菌处理；第三条鱼则可以进行加汤料的步骤，因为前面的步骤已经完成了。第四条鱼可以进行蒸煮处理，第五条鱼则在做清洗。借助这些工具，每个步骤之间互不干扰，就能实现五个步骤同时进行。

当然，这是一种最理想的情况。在这种情况下，虽然处理一条鱼的总时间没有变化，还是50分钟，但你可以在同一时刻，对多条鱼的不同步骤同时进行操作。这样，总的处理时间没有减少，但你提升了并行度，也就是所谓的吞吐量。单位时间内，你可以完成更多的指令。

比如说，真空封罐、杀菌、加汤料、沥水、去鳞清洗，这些步骤虽然分别对应不同的鱼，但合起来就相当于同时处理了多条鱼的不同步骤。通过划分步骤，我们实现了效率的提升。CPU也采用了类似的处理机制，它将指令执行过程分为五个阶段，就像我们处理鱼的步骤一样。具体来说，CPU将每条指令分为取指令、指令译码、执行指令、内存访问和数据写回这五个阶段。每个阶段都有其特定的缩写，这种划分方式使得CPU能够更高效地处理指令。

:::tip
**Clock Cycle Time 时钟周期时间**
主频的概念大家接触的比较多,而 CPU 的 Clock Cycle Time (时钟周期时间),等于主频的倒数,意思是 CPU 能够识别的最小时间单位,比如说
4G 主频的 CPU 的 Clock Cycle Time 就是 0.25 ns,作为对比,我们墙上挂钟的Cycle Time 是 1s

例如,运行一条加法指令一般需要一个时钟周期时间

**CPI 平均时钟周期数**
有的指令需要更多的时钟周期时间,所以引出了 CPI (Cycles Per Instruction) 指令平均时钟周期数

**IPC 即 CPI 的倒数**
IPC (Instruction Per Clock Cycle) 即 CPI 的倒数,表示每个时钟周期能够运行的指令数

**CPU执行时间**
程序的 CPU 执行时间,即我们前面提到的 user + system 时间,可以用下面的公式来表示
程序 CPU 执行时间=指令数*CPI*Clock Cycle Time
:::

事实上，现代处理器会设计为一个时钟周期完成一条执行时间最长的 CPU 指令。为什么这么做呢？可以想到指令还可以再划分成一个个更小的阶段，例如，每条指令都可以分为：`取指令` - `指令译码` - `执行指令` - `内存访问` - `数据写回` 这 5 个阶段
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-09-09_00-32-18.png)


在不改变程序结果的前提下，这些指令的各个阶段可以通过**重排序**和**组合**来实现**指令级并行**，这一技术在 80's 中叶到 90's 中叶占据了计算架构的重要地位。

:::tip
分阶段，分工是提升效率的关键！
:::


指令重排的前提是，重排指令不能影响结果，例如
```java
// 可以重排的例子
int a = 10; // 指令1
int b = 20; // 指令2
System.out.println( a + b );

// 不能重排的例子
int a = 10; // 指令1
int b = a - 5; // 指令2
```

>参考： 
>Scoreboarding and the Tomasulo algorithm (which is similar to scoreboarding but makes use of 
>register renaming) are two of the most common techniques for implementing out-of-order execution 
>and instruction-level parallelism.


**支持流水线的处理器**

现代 CPU 支持多级指令流水线，例如支持同时执行 `取指令` - `指令译码` - `执行指令` - `内存访问` - `数据写回` 的处理器，就可以称之为五级指令流水线。这时 CPU 可以在一个时钟周期内，同时运行五条指令的不同阶段（相当于一条执行时间最长的复杂指令），IPC = 1，本质上，流水线技术并不能缩短单条指令的执行时间，但它变相地提高了指令地吞吐率。

>提示： 
>奔腾四（Pentium 4）支持高达 35 级流水线，但由于功耗太高被废弃


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-09-09_00-35-30.png)


