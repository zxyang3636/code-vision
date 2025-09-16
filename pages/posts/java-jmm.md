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

CPU的层面需要对指令进行并行处理，就会对指令的执行顺序进行调整，这就引起了重排序的问题

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


### 指令重排问题

(指令重排序导致的)诡异的结果
```java
int num = 0;
boolean ready = false;

// 线程1 执行此方法
public void actor1(I_Result r) {
    if(ready) {
        r.r1 = num + num;
    } else {
        r.r1 = 1;
    }
}

// 线程2 执行此方法
public void actor2(I_Result r) {
    //这里可能发生指令重排序
    num = 2;
    ready = true;
}
```
`I_Result` 是一个对象，有一个属性 `r1` 用来保存结果，问，可能的结果有几种？

有同学这么分析
- 情况1：线程1 先执行，这时 ready = false，所以进入 else 分支结果为 1
- 情况2：线程2 先执行 num = 2，但没来得及执行 ready = true，线程1 执行，还是进入 else 分支,结果为1
- 情况3：线程2 执行到 ready = true，线程1 执行，这回进入 if 分支，结果为 4（因为 num 已经执行过了）

但我告诉你，结果还有可能是 0，
这种情况下是：线程2 执行 `ready = true`，切换到线程1，进入 if 分支，相加为 0，再切回线程2 执行 num = 2
:::tip
因为 actor2 的指令可能被重排序：ready=true 提前执行了，但 num=2 还没写入主内存。
:::

这种现象叫做指令重排，是 JIT 编译器在运行时的一些优化，这个现象需要通过大量测试才能复现：






### 指令重排验证

借助 openjdk 并发压测工具 [jcstress](https://wiki.openjdk.java.net/display/CodeTools/jcstress)

在idea 命令行中执行：
```java
mvn archetype:generate -DinteractiveMode=false -DarchetypeGroupId=org.openjdk.jcstress -DarchetypeArtifactId=jcstress-java-test-archetype -DarchetypeVersion=0.5 -DgroupId=cn.itcast -DartifactId=ordering -Dversion=1.0
```

创建 maven 项目，提供如下测试类
```java
@JCStressTest
@Outcome(id = {"1", "4"}, expect = Expect.ACCEPTABLE, desc = "ok")
@Outcome(id = "0", expect = Expect.ACCEPTABLE_INTERESTING, desc = "!!!!")
@State
public class ConcurrencyTest {

    int num = 0;
    boolean ready = false;

    @Actor
    public void actor1(I_Result r) {
        if(ready) {
            r.r1 = num + num;
        } else {
            r.r1 = 1;
        }
    }

    @Actor
    public void actor2(I_Result r) {
        num = 2;
        ready = true;
    }

}
```

打包之后，进入 `target` 目录，找到 `jcstress.jar` 并执行命令：`java -jar target/jcstress.jar`

会看到如下部分的输出：
```java
2 matching test results.
    [OK] cn.itcast.ConcurrencyTest
    (JVM args: [-XX:-TieredCompilation])
Observed state    Occurrences             Expectation       Interpretation
        0            5,404    ACCEPTABLE_INTERESTING      !!!!!
        1        27,874,016          ACCEPTABLE            ok
        4        35,147,721          ACCEPTABLE            ok

    [OK] cn.itcast.ConcurrencyTest
    (JVM args: [])
Observed state    Occurrences             Expectation       Interpretation
        0            1,568    ACCEPTABLE_INTERESTING      !!!!!
        1        17,913,929          ACCEPTABLE            ok
        4        34,664,864          ACCEPTABLE            ok
```

执行了34,664,864 次测试，结果是4，执行了17,913,929 次测试，结果是1，也有1568次出现结果为0，确实发生了指令重排序现象。




### 指令重排-禁用

volatile禁用指令重排

**volatile 修饰的变量，可以禁用指令重排**

```java
@JCStressTest
@Outcome(id = {"1", "4"}, expect = Expect.ACCEPTABLE, desc = "ok")
@Outcome(id = "0", expect = Expect.ACCEPTABLE_INTERESTING, desc = "!!!!")
@State
public class ConcurrencyTest {

    int num = 0;
    volatile boolean ready = false;

    @Actor
    public void actor1(I_Result r) {
        if(ready) {
            r.r1 = num + num;
        } else {
            r.r1 = 1;
        }
    }

    @Actor
    public void actor2(I_Result r) {
        num = 2;
        ready = true;
    }

}
```

执行结果：

```java
RUN RESULTS:
-------------------------------------------------------------------------------
*** INTERESTING tests
Some interesting behaviors observed. This is for the plain curiosity.
0 matching test results.
*** FAILED tests
Strong asserts were violated. Correct implementations should have no assert failures here.
0 matching test results.
*** ERROR tests
Tests break for some reason, other than failing the assert. Correct implementations should have none.
0 matching test results.
```
:::tip

为什么只给 ready 加 volatile 就够了，而不用给 num 加?

只加在volatile变量上，可以防止之前的代码被重排序，实际上是加了一个写屏障，写屏障就能够保证之前的所有代码不会被排到ready的后面去，所以加一个就够了。
:::

## volatile 原理

volatile 的底层实现原理是内存屏障，`Memory Barrier（Memory Fence）`
- 对 volatile 变量的 写指令后会加入写屏障 : 保证在该屏障之前的，对共享变量的改动，都同步到主存当中
- 对 volatile 变量的 读指令前会加入读屏障 : 在该屏障之后，对共享变量的读取，加载的是主存中最新数据


### 保证可见性

**如何保证可见性**

- 写屏障（sfence）保证在该屏障之前的，对共享变量的改动，都同步到主存当中
```java
public void actor2(I_Result r) {
    num = 2;
    ready = true; // ready 是 volatile 赋值带写屏障
    // 写屏障
}
```

- 而读屏障（lfence）保证在该屏障之后，对共享变量的读取，加载的是主存中最新数据
```java
public void actor1(I_Result r) {
    // 读屏障
    // ready 是 volatile 读取值带读屏障
    if(ready) {
        r.r1 = num + num;
    } else {
        r.r1 = 1;
    }
}
```
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-09-10_00-13-10.png)




### 保证有序性

**如何保证有序性**

- 写屏障会确保指令重排序时，不会将写屏障之前的代码排在写屏障之后
```java
public void actor2(I_Result r) {
    num = 2;
    ready = true; // ready 是 volatile 赋值带写屏障
    // 写屏障
}
```
- 读屏障会确保指令重排序时，不会将读屏障之后的代码排在读屏障之前
```java
public void actor1(I_Result r) {
    // 读屏障
    // ready 是 volatile 读取值带读屏障
    if(ready) {
        r.r1 = num + num;
    } else {
        r.r1 = 1;
    }
}
```

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-09-10_00-29-12.png)


还是那句话，不能解决指令交错：
- 写屏障仅仅是保证之后的读能够读到最新的结果，但不能保证读跑到它前面去
- 而有序性的保证也只是保证了本线程内相关代码不被重排序
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-09-10_00-30-26.png)

volatile不能解决原子性问题  即指令的交错执行，只能保证本线程内的相关代码不被重排序

volatile只能适用于一个线程写，多个线程读的场景。

### double-checked locking 问题

以著名的 double-checked locking 单例模式为例
```java
public final class Singleton {
    private Singleton() { }
    private static Singleton INSTANCE = null;

    public static Singleton getInstance() {
        if(INSTANCE == null) { // t2
            // 首次访问会同步，而之后的使用没有 synchronized
            synchronized(Singleton.class) {
                if (INSTANCE == null) { // t1
                    INSTANCE = new Singleton();
                }
            }
        }
        return INSTANCE;
    }
}
```
如果只在 synchronized 中创建实例（每次都锁），虽然线程安全，但性能差。双重检查的目的是：只有第一次创建实例时才加锁，之后直接返回实例。

以上的实现特点是：
- 懒惰实例化
- 首次使用 getInstance() 才使用 synchronized 加锁，后续使用时无需加锁
- 有隐含的，但很关键的一点：第一个 if 使用了 INSTANCE 变量，是在同步块之外

这段代码其实是有问题的，完全在synchronized作用域内的 共享变量 才能保证其 原子性,可见性,有序性。这里 `INSTANCE` 并没有完全在 `synchronized` 作用域内,所以对其可能发生重排序;

但在多线程环境下，上面的代码是有问题的，getInstance 方法对应的字节码为:
```java
0: getstatic     #2               // Field INSTANCE:Lcn/itcast/n5/Singleton;
3: ifnonnull     37               // 如果 INSTANCE != null，跳到 37 直接返回
6: ldc           #3               // class cn/itcast/n5/Singleton
8: dup                           // 复制栈顶元素（类对象），保证后面 monitorenter/monitorexit 用
9: astore_0
10: monitorenter
11: getstatic    #2               // Field INSTANCE:Lcn/itcast/n5/Singleton;
14: ifnonnull    27
17: new          #3               // class cn/itcast/n5/Singleton
20: dup
21: invokespecial #4               // Method "<init>":()V
24: putstatic    #2               // Field INSTANCE:Lcn/itcast/n5/Singleton;
27: aload_0
28: monitorexit
29: goto         37
32: astore_1
33: aload_0
34: monitorexit
35: aload_1
36: athrow
37: getstatic    #2               // Field INSTANCE:Lcn/itcast/n5/Singleton;
40: areturn
```
其中
- 17 表示创建对象，将对象引用入栈 // new Singleton
- 20 表示复制一份对象引用 // 引用地址
- 21 表示利用一个对象引用，调用构造方法
- 24 表示利用一个对象引用，赋值给 static INSTANCE



也许 jvm 会优化为：先执行 24，再执行 21。如果两个线程 t1，t2 按如下时间序列执行：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-09-11_00-53-31.png)
这段字节码的隐患在于 `putstatic` 可能在 `<init>` 之前执行，如果没有 `volatile` 修饰 `INSTANCE`，就可能导致另一个线程读到“半初始化”的对象。


关键在于 0: getstatic 这行代码在 `monitor` 控制之外，它就像之前举例中不守规则的人，可以越过 `monitor` 读取`INSTANCE` 变量的值 .

这时 t1 还未完全将构造方法执行完毕，如果在构造方法中要执行很多初始化操作，那么 t2 拿到的是将是一个未初始化完毕的单例 .

对 `INSTANCE` 使用 `volatile` 修饰即可，可以禁用指令重排，但要注意在 `JDK 5` 以上的版本的 `volatile` 才会真正有效 .


一个共享变量完全被synchronized 保护，那么这个变量就不会出现原子、有序、可见性问题。但是在以上代码中有问题，是因为这个共享变量并没有完全的被synchronized 保护
，synchronized 的外面还是有对 INSTANCE 共享变量的使用

:::info
synchronized是可以保证原子性、可见性、有序性的，但是前提是这个共享变量都交给synchronized来管理
:::


#### dcl问题解决

使用 `volatile` 修饰 `INSTANCE` 变量
```java
public final class Singleton {
    private Singleton() { }
    private static volatile Singleton INSTANCE = null;

    public static Singleton getInstance() {
        // 实例没创建，才会进入内部的 synchronized代码块
        if (INSTANCE == null) {
            synchronized (Singleton.class) { // t2
                // 也许有其它线程已经创建实例，所以再判断一次
                if (INSTANCE == null) { // t1
                    INSTANCE = new Singleton();
                }
            }
        }
        return INSTANCE;
    }
}
```

字节码上看不出来 volatile 指令的效果
```java
// ------------------------------> 加入对 INSTANCE 变量的读屏障
0: getstatic     #2                      // Field INSTANCE:Lcn/itcast/n5/Singleton;
3: ifnonnull     37
6: ldc           #3                      // class cn/itcast/n5/Singleton
8: dup
9: astore_0
10: monitorenter  ------------------> 保证原子性、可见性
11: getstatic     #2                      // Field INSTANCE:Lcn/itcast/n5/Singleton;
14: ifnonnull     27
17: new           #3                      // class cn/itcast/n5/Singleton
20: dup
21: invokespecial #4                      // Method "<init>":()V
24: putstatic     #2                      // Field INSTANCE:Lcn/itcast/n5/Singleton;
// ------------------------------> 加入对 INSTANCE 变量的写屏障
27: aload_0
28: monitorexit  ------------------> 保证原子性、可见性
29: goto          37
32: astore_1
33: aload_0
34: monitorexit
35: aload_1
36: athrow
37: getstatic     #2                      // Field INSTANCE:Lcn/itcast/n5/Singleton;
40: areturn
```
如上面的注释内容所示，读写 `volatile` 变量时会加入内存屏障（Memory Barrier（Memory Fence）），保证下面两点：
- 可见性
  - 写屏障（sfence）保证在该屏障之前的 t1 对共享变量的改动，都同步到主存当中
  - 而读屏障（lfence）保证在该屏障之后 t2 对共享变量的读取，加载的是主存中最新数据
- 有序性
  - 写屏障会确保指令重排序时，不会将写屏障之前的代码排在写屏障之后
  - 读屏障会确保指令重排序时，不会将读屏障之后的代码排在读屏障之前
- 更底层是读写变量时使用 lock 指令来多核 CPU 之间的可见性与有序性


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-09-12_00-25-53.png)


## happens-before

happens-before就是对共享变量可见性的总结（七个规则）

happens-before 规定了对共享变量的写操作对其它线程的读操作可见，它是可见性与有序性的一套规则总结，抛开以下 happens-before 规则，IMM 并不能保证一个线程对共享变量的写，对于其它线程对该共享变量的读可见。

- 线程解锁 m 之前对变量的写，对于接下来对 m 加锁的其它线程对该变量的读可见

```java
    static int x;
    static Object m = new Object();
    new Thread(() -> {
        synchronized(m) {
            x = 10;
        }
    }, "t1").start();
    new Thread(() -> {
        synchronized(m) {
            System.out.println(x);
        }
    }, "t2").start();
```


- 线程对 volatile 变量的写，对接下来其它线程对该变量的读可见
```java
volatile static int x;

new Thread(() -> {
    x = 10;
}, "t1").start();

new Thread(() -> {
    System.out.println(x);
}, "t2").start();
```

- 线程 start 前对变量的写，对该线程开始后对该变量的读可见
```java
static int x;
x = 10;
new Thread(() -> {
    System.out.println(x);
}, "t2").start();
```

- 线程结束前对变量的写，对其它线程得知它结束后的读可见（比如其它线程调用 t1.isAlive() 或 t1.join() 等待它结束）
```java
    static int x;
    Thread t1 = new Thread(() -> {
        x = 10;
    }, "t1");
    t1.start();     // 线程结束之前，就会把共享变量的值同步到主存中
    t1.join();
    System.out.println(x);
```


- 线程 t1 打断 t2（interrupt）前对变量的写，对于其他线程得知 t2 被打断后对变量的读可见（通过 t2.interrupted 或 t2.isInterrupted）

```java
static int x;

public static void main(String[] args) {
    Thread t2 = new Thread(() -> {
        while (true) {
            if (Thread.currentThread().isInterrupted()) {
                System.out.println(x);
                break;
            }
        }
    }, "t2");
    t2.start();

    new Thread(() -> {
        sleep(1);
        x = 10;
        t2.interrupt(); // 打断之前对变量的修改，对其他线程是可见的
    }, "t1").start();

    while (!t2.isInterrupted()) {
        Thread.yield();
    }
    System.out.println(x);
}
```


- 对变量默认值（0，false，null）的写，对其它线程对该变量的读可见
- 具有传递性，如果x hb-> y并且y hb-> z 那么有x hb-> z，配合volatile的防指令重排，有下面的例子
```java
    volatile static int x;
    static int y;
    new Thread(() -> {
        y = 10;
        x = 20;     // 写屏障会把，写屏障之前的所有操作都同步到主存中并且还不会重排序，即使之前操作不是volatile
    }, "t1").start();
    new Thread(() -> {
        // x=20 对 t2 可见，同时 y=10 也对 t2 可见
        System.out.println(x);
    }, "t2").start();
```


**总结**

- 可见性 - 由 JVM 缓存优化引起
- 有序性 - 由 JVM 指令重排序优化引起