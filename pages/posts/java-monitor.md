---
title: Java 共享模型之管程（Monitor）
categories: Java
tags:
  - 后端
  - Java
  - 并发编程
---


**本章内容**
- 共享资源问题
    - 多线程并发访问共享资源时可能存在的问题
- synchronized
    - 解决多线程并发访问的问题
- 线程安全分析
    - 知道怎么样的代码编写是线程安全的，怎样的代码编写是存在线程安全隐患的
- Monitor
    - 从源码的角度讲解管程的底层实现
- wait/notify
- 线程状态转换
    - 线程六种状态如何转换
- 活跃性
    - 死锁、活锁、饥饿
- ReentrantLock


## 共享资源问题



### Java体现

问：两个线程对初始值为 0 的静态变量一个做自增，一个做自减，各做 5000 次，结果是 0 吗？
```java
@Slf4j(topic = "c.Test17")
public class Test17 {
    static int counter = 0;
    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 5000; i++) {
                counter++;
            }
        }, "t1");

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 5000; i++) {
                counter--;
            }
        }, "t2");

        t1.start();
        t2.start();
        t1.join();
        t2.join();
        log.info("counter = {}", counter);
    }
}
```

```
21:26:18.126 [main] INFO com.thread.concurrent1.Test8 -- counter = -697
```

**结论：**

由于分时系统造成的线程切换而导致的安全问题。


### 问题分析

以上的结果可能是正数、负数、零。为什么呢？因为 Java 中对静态变量的自增，自减并不是原子操作，要彻底理解，必须从字节码来进行分析

例如对于i++ 而言（i 为静态变量），实际会产生如下的四条 JVM 字节码指令：

```java
getstatic i // 获取静态变量i的值
iconst_1 // 准备常量1
iadd // 自增
putstatic i // 将修改后的值存入静态变量i
```

而对应i--也是类似：
```java
getstatic i // 获取静态变量i的值
iconst_1 // 准备常量1
isub // 自减
putstatic i // 将修改后的值存入静态变量i
```


而 Java 的内存模型如下，完成静态变量的自增，自减需要在主存和工作内存中进行数据交换：

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/%E5%B9%B6%E5%8F%91%E7%BC%96%E7%A8%8B_page35_image.png)


如果是单线程以上 8 行代码是顺序执行（不会交错）没有问题：

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-15_21-29-20.png)

但多线程下这 8 行代码可能交错运行。

出现负数的情况：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-15_21-29-58.png)

出现正数的情况：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-15_21-30-28.png)


### 临界区 Critical Section


- 一个程序运行多个线程本身是没有问题的
- 问题出在多个线程访问共享资源
    - 多个线程读共享资源其实也没有问题
    - 在多个线程对共享资源读写操作时发生指令交错，就会出现问题

一段代码块内如果存在对共享资源的多线程读写操作，称这段代码块为**临界区**

那么在这个临界区对共享资源的操作，我们就称发生了竞态条件

例如，下面代码中的临界区
```java
static int counter = 0;

static void increment()
// 临界区
{
    counter++;
}

static void decrement()
// 临界区
{
    counter--;
}
```

### 竞态条件 Race Condition

多个线程在临界区内执行，由于代码的**执行序列不同**而导致结果无法预测，称之为发生了**竞态条件**



## synchronized 解决方案

为了避免临界区的竞态条件发生，有多种手段可以达到目的:
- 阻塞式的解决方案: `synchronized`，`Lock`
- 非阻塞式的解决方案: `原子变量`


`synchronized`，即俗称的*对象锁*。它采用互斥的方式让同一时刻至多只有一个线程能持有【对象锁】，其它线程再想获取这个【对象锁】时就会阻塞住，进入 `BLOCKED` 状态。这样就能保证拥有锁的线程可以安全的执行临界区内的代码，不用担心线程上下文切换

:::warning
虽然 java 中互斥和同步都可以采用 `synchronized` 关键字来完成, 但它们还是有区别的:
- 互斥是保证临界区的竞态条件发生,同一时刻只能有一个线程执行临界区代码
- 同步是由于线程执行的先后、顺序不同、需要一个线程等待其它线程运行到某个点
:::


语法
```java
synchronized(对象) {  // 得保证多个线程是对同一个对象来使用对象锁
 	临界区代码
}
```

1. 同一时刻，只能有一个线程持有这个对象锁，其他线程会进入阻塞状态（Blocked）
2. 括号内的对象不能为空，必须 new 一个

### synchronized解决

```java
@Slf4j
public class Test8 {
    static int counter = 0;
    private static Object object = new Object();

    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 5000; i++) {
                synchronized (object) {
                    counter++;
                }
            }
        }, "t1");

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 5000; i++) {
                synchronized (object) {
                    counter--;
                }
            }
        }, "t2");

        t1.start();
        t2.start();
        t1.join();
        t2.join();
        log.info("counter = {}", counter);
    }
}
```




### synchronized-理解

你可以做这样的类比：
- synchronized(对象)中的对象，可以想象为一个房间（room），有唯一入口（门）房间只能一次进入一人进行计算，线程 t1，t2 想象成两个人
- 当线程 t1 执行到synchronized(room)时就好比 t1 进入了这个房间，并锁住了门拿走了钥匙，在门内执行count++代码
- 这时候如果 t2 也运行到了synchronized(room)时，它发现门被锁住了，只能在门外等待，发生了上下文切换，阻塞住了
- 这中间即使 t1 的 cpu 时间片不幸用完，被踢出了门外（不要错误理解为锁住了对象就能一直执行下去哦），这时门还是锁住的，t1 仍拿着钥匙，t2 线程还在阻塞状态进不来，只有下次轮到 t1 自己再次获得时间片时才能开门进入
- 当 t1 执行完synchronized{}块内的代码，这时候才会从 obj 房间出来并解开门上的锁，唤醒 t2 线程把钥匙给他。t2 线程这时才可以进入 obj 房间，锁住了门拿上钥匙，执行它的count--代码

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/%E5%B9%B6%E5%8F%91%E7%BC%96%E7%A8%8B_page40_image.png)

用图表示：

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-15_22-03-35.png)

**思考**

synchronized 实际是用对象锁保证了临界区内代码的原子性，临界区内的代码对外是不可分割的，不会被线程切换所打断。


为了加深理解，请思考下面的问题：

1. 如果把synchronized(obj)放在 for 循环的外面，如何理解？

答：放在 for 循环外部会把整个 for 循环的代码当成一个原子操作，会执行 5000 次 ++ 或 -- 操作后才会释放锁

2. 如果 t1 线程synchronized(obj1)而 t2 线程synchronized(obj2)会怎样运作？

答：不会保证临界区内代码的原子性。没有锁住同一个对象，无法保护共享资源，相当于是两把不同的锁

3. 如果 t1 线程synchronized(obj)而 t2 线程没有加会怎么样？如何理解？

答：无法保证临界区内代码的原子性。因为 t2 线程没有用 synchronized(obj)加锁会导致它不会被阻塞住。要对临界区钟的代码进行保护就必须多个线程都对同一个对象加锁


#### 锁对象面向对象改进

我们可以把 需要保护的共享变量放入一个类 中统一管理

```java
@Slf4j(topic = "c.Test17")
public class Test17 {
    public static void main(String[] args) throws InterruptedException {
        Lock lock = new Lock();
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 5000; i++) {
                synchronized (lock) {
                    lock.increment();
                }
            }
        }, "t1");

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 5000; i++) {
                synchronized (lock) {
                    lock.decrement();
                }
            }
        }, "t2");

        t1.start();
        t2.start();
        t1.join();
        t2.join();
        log.debug("counter = {}", lock.getCounter());
    }
}



class Lock {
    private int counter = 0;

    /**
     * ++ 操作
     */
    public void increment() {
        synchronized (this) {
            counter++;
        }
    }

    /**
     * -- 操作
     */
    public void decrement() {
        synchronized (this) {
            counter--;
        }
    }

    /**
     * 获取结果
     *
     * @return 结果值
     */
    public int getCounter() {
        // 为了保证获取值时得到一个准确的结果而不是一个中间结果。也需要进行加锁！
        synchronized (this) {
            return counter;
        }
    }
}
```




### 方法上的 synchronized

加在成员方法上，等价于锁住了 this 对象。(synchronized只能锁对象！)

加在静态方法上，等价于锁住了类对象。


synchronized 加在成员方法上
```java
class Test{
    public synchronized void test() {

    }
}

// 等价于
class Test{
    public void test() {
        synchronized(this) {

        }
    }
}
```


synchronized 加在静态方法上
```java
class Test{
    public synchronized static void test() {

    }
}

// 等价于
class Test{
    public static void test() {
        synchronized(Test.class) {

        }
    }
}
```


:::info
synchronized(Test.class)
- 锁住的是 类对象（Class 对象）。
- 这个锁是 全局的（只要是同一个 Test.class，不管哪个线程、哪个实例），都会竞争同一把锁。
```
            ┌───────────────────┐
线程A  ---> │   Test.class锁     │ <--- 线程B
            └───────────────────┘
                  ▲
                  │
    test1.method1()    test2.method1()
   （不同对象实例都会竞争同一把锁）

```

synchronized(this)
- 锁住的是当前实例对象，不同实例之间互不影响。
- 如果有两个 Test 对象，线程 A 锁住 test1，线程 B 还是能同时锁住 test2。
```
线程A ---> [ test1实例锁 ]             [ test2实例锁 ] <--- 线程B
           （互不干扰）                 （互不干扰）

```
**synchronized(this)示例：**

✅ 安全的情况（同一个对象）
```java
class Counter {
    private int count = 0;

    public void increment() {
        synchronized(this) {
            count++;
        }
    }
}

Counter c = new Counter();
new Thread(c::increment).start();
new Thread(c::increment).start();
```
这里两个线程操作的是同一个对象 c，所以 `count++` 会被同步，不会出现线程安全问题。

---

⚠️ 不安全的情况（多个对象）
```java
class Counter {
    private int count = 0;

    public void increment() {
        synchronized(this) {
            count++;
        }
    }
}

Counter c1 = new Counter();
Counter c2 = new Counter();
new Thread(c1::increment).start();
new Thread(c2::increment).start();

```
这里两个线程用的是不同对象（c1 和 c2），锁对象也不一样。
所以它们同时执行 `count++`，不会互相阻塞，可能就有线程安全问题。

**总结**
- `synchronized(this)` 线程安全的前提：所有访问共享资源的线程，必须锁住同一个对象。
- 如果可能有多个对象实例同时访问共享资源，就应该考虑：
  - 用 `synchronized(someClass.class)` (类锁，全局唯一 )，
  - 或者自己定义一个全局锁对象 `private static final object LOCK = new object();`

简单示例：
```java
class Test {
    public void method1() {
        synchronized(Test.class) {
            System.out.println(Thread.currentThread().getName() + " got class lock");
        }
    }

    public void method2() {
        synchronized(this) {
            System.out.println(Thread.currentThread().getName() + " got instance lock");
        }
    }
}

```

- 两个线程用不同对象调用 method1() → 会互相等待（因为是同一个 Test.class 锁）。
- 两个线程用不同对象调用 method2() → 不会互相等待（锁的是不同实例）。
:::


#### 相关面试题💡

**构造方法可以用 synchronized 修饰吗？**

构造方法不能使用 `synchronized` 关键字修饰。不过，可以在构造方法内部使用 `synchronized` 代码块。

另外，**构造方法本身是线程安全的**，但如果在构造方法中涉及到共享资源的操作，就需要采取适当的同步措施来保证整个构造过程的线程安全

### synchronized加在方法上-线程八锁

其实就是考察 synchronized 锁住的是哪个对象

情况1：
```java
@Slf4j
public class Test9 {
    public static void main(String[] args) {
        Number n1 = new Number();
        new Thread(() -> {
            n1.a();
        }).start();

        new Thread(() -> {
            n1.b();
        }).start();
    }
}

@Slf4j
class Number {
    public synchronized void a() {
        log.info("1");
    }

    public synchronized void b() {
        log.info("2");
    }
}
```
>锁住的是同一个 this 对象，有可能先打印 1 再打印 2；也可能先打印 2 再打印 1。  

情况2：
```java
@Slf4j
public class Test9 {
    public static void main(String[] args) {
        Number n1 = new Number();
        new Thread(() -> {
            log.info("begin");
            try {
                n1.a();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }).start();

        new Thread(() -> {
            log.info("begin");
            n1.b();
        }).start();
    }
}

@Slf4j
class Number {
    public synchronized void a() throws InterruptedException {
        Thread.sleep(1000);     // sleep() 不会让出锁资源，只会让线程进入阻塞状态
        log.info("1");
    }

    public synchronized void b() {
        log.info("2");
    }
}
```
>结果：
>
>第一种情况：线程 1 先获得锁，此时会先睡眠 1s，再打印 1。然后线程 2 再打印 2
>
>第二种情况：线程 2 先获得锁，此时会先打印 2。然后线程 1 获得锁，此时会先睡眠 1s，再打印 1

情况3：
```java
@Slf4j
public class Test9 {
    public static void main(String[] args) {
        Number n1 = new Number();
        new Thread(() -> {
            try {
                n1.a();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }).start();

        new Thread(() -> {
            n1.b();
        }).start();

        new Thread(() -> {
            n1.c();
        }).start();
    }
}

@Slf4j
class Number {
    public synchronized void a() throws InterruptedException {
        Thread.sleep(1000);     // sleep() 不会让出锁资源，只会让线程进入阻塞状态
        log.info("1");
    }

    public synchronized void b() {
        log.info("2");
    }

    public void c() {
        log.info("3");
    }
}
```
>结果：
```
// 3 1s 12
// 23 1s 1
// 32 1s 1
```
>第一种情况：先打印3，一秒后打印 1，最后打印 2
>
>第二种情况：先打印2、3，然后 1s 后打印 1
>
>第三种情况：先打印 3，1s 后打印 1，最后打印 2

情况4：
```java
@Slf4j
public class Test9 {
    public static void main(String[] args) {
        Number n1 = new Number();
        Number n2 = new Number();
        new Thread(() -> {
            try {
                n1.a();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }).start();

        new Thread(() -> {
            n2.b();
        }).start();
    }
}

@Slf4j
class Number {
    public synchronized void a() throws InterruptedException {
        Thread.sleep(1000);     // sleep() 不会让出锁资源，只会让线程进入阻塞状态
        log.info("1");
    }

    public synchronized void b() {
        log.info("2");
    }
}
```
>结果：
>
>锁住的不是同一个对象。所以无论先执行线程 1 还是线程 2。由于线程 1 要 Sleep()，所以时间片会分给线程 2。 会先打印 2，再打印 1

情况5：
```java
@Slf4j
public class Test9 {
    public static void main(String[] args) {
        Number n1 = new Number();
        new Thread(() -> {
            try {
                n1.a();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }).start();

        new Thread(() -> {
            n1.b();
        }).start();
    }
}

@Slf4j
class Number {
    public static synchronized void a() throws InterruptedException {
        Thread.sleep(1000);     // sleep() 不会让出锁资源，只会让线程进入阻塞状态
        log.info("1");
    }

    public synchronized void b() {
        log.info("2");
    }
}
```
>结果
>
>线程 1 调用 a 方法时，锁住的是类对象。线程 2 调用 b 方法时，锁住的是 n1 对象。因为锁住的不是同一个对象，所以它们之间不互斥。先运行 2，过 1s 后再运行 1

情况6：
```java
@Slf4j
public class Test9 {
    public static void main(String[] args) {
        Number n1 = new Number();
        new Thread(() -> {
            try {
                n1.a();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }).start();

        new Thread(() -> {
            n1.b();
        }).start();
    }
}

@Slf4j
class Number {
    public static synchronized void a() throws InterruptedException {
        Thread.sleep(1000);     // sleep() 不会让出锁资源，只会让线程进入阻塞状态
        log.info("1");
    }

    public static synchronized void b() {
        log.info("2");
    }
}
```
>结果
>
>类对象整个内存中只有一份，所以锁定的是同一个对象。
>
>第一种情况：过 1s 后打印 1，再打印 2
>
>第二种情况：先打印 2，过 1s 后再打印 1

情况7：
```java
@Slf4j
public class Test9 {
    public static void main(String[] args) {
        Number n1 = new Number();
        Number n2 = new Number();
        new Thread(() -> {
            try {
                n1.a();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }).start();

        new Thread(() -> {
            n2.b();
        }).start();
    }
}

@Slf4j
class Number {
    public static synchronized void a() throws InterruptedException {
        Thread.sleep(1000);     // sleep() 不会让出锁资源，只会让线程进入阻塞状态
        log.info("1");
    }

    public synchronized void b() {
        log.info("2");
    }
}
```

>结果
>
>线程 1 锁定的是类对象；线程 2 锁定的是 n2 对象。锁住的不是同一个对象
>总是先 2 再过 1s 后打印 1

情况8：
```java
@Slf4j
public class Test9 {
    public static void main(String[] args) {
        Number n1 = new Number();
        Number n2 = new Number();
        new Thread(() -> {
            try {
                n1.a();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }).start();

        new Thread(() -> {
            n2.b();
        }).start();
    }
}

@Slf4j
class Number {
    public static synchronized void a() throws InterruptedException {
        Thread.sleep(1000);
        log.info("1");
    }

    public static synchronized void b() {
        log.info("2");
    }
}
```

>结果
>
>因为是静态方法，锁的是类对象。所以线程 1 和线程 2 锁定的是同一个对象
>
>第一种情况：过 1s 后打印 1，再打印 2
>
>第二种情况：先打印 2，过 1s 后再打印 1

### 变量的线程安全分析

#### 成员变量和静态变量是否线程安全?

- 如果它们**没有共享**，则线程安全
- 如果它们**被共享**了，根据它们的状态是否能够改变，又分两种情况
  - 如果只有读取操作，则线程安全
  - 如果有读写操作，则这段代码是临界区，需要考虑线程安全

#### 局部变量是否线程安全?

- 局部变量是线程安全的
- 但局部变量引用的对象则未必
  - 如果引用的对象没有逃离方法的作用访问，它是线程安全的
  - 如果引用的对象逃离方法的作用范围，需要考虑线程安全


#### 局部变量线程安全分析
**如果局部变量没有引用对象**

```java
public static void test1() {
    int i = 10;
    i++; 
}
```
每个线程调用 test1() 方法时,局部变量 i 都会在每个线程的栈帧内存中被创建多份，因此不存在共享！
```java [字节码内容]
public static void test1();
    descriptor: ()V
    flags: ACC_PUBLIC, ACC_STATIC
    Code:
        stack=1, locals=1, args_size=0
        0: bipush            10
        2: istore_0
        3: iinc               0, 1
        6: return
    LineNumberTable:
        line 10: 0
        line 11: 3
        line 12: 6
    LocalVariableTable:
        Start Length Slot Name Signature
            3      4     0    i   I
```

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/%E5%B9%B6%E5%8F%91%E7%BC%96%E7%A8%8B_page49_image.png)
:::warning
局部变量的 i++操作在底层字节码文件中涉及一步：
```java
iinc  // 通过 iinc 指令自增
```

静态变量的 i++ 操作在底层字节码文件中涉及四步：
```java
getstatic i // 获取静态变量i的值
iconst_1 // 准备常量1
iadd // 自增
putstatic i // 将修改后的值存入静态变量i
```
:::



不同线程的虚拟机栈的栈帧的局部变量不共享

---

**如果局部变量引用了对象**
```java
@Slf4j
public class TestThreadSafe {
    static final int THREAD_NUMBER = 2;
    static final int LOOP_NUMBER = 200;

    public static void main(String[] args) {
        ThreadUnsafe test = new ThreadUnsafe();
        for (int i = 0; i < THREAD_NUMBER; i++) {
            new Thread(() -> test.method1(LOOP_NUMBER), "Thread" + (i + 1)).start();
        }
    }
}

class ThreadUnsafe {
    // 成员变量
    ArrayList<String> list = new ArrayList<>();

    public void method1(int loopNumber) {
        for (int i = 0; i < loopNumber; i++) {
            // 临界区，会产生竞态条件
            method2();
            method3();
        }
    }

    private void method2() {
        list.add("1");
    }

    private void method3() {
        list.remove(0);
    }
}
```
此时，可能存在线程2 还未 add，线程1 就 remove。报错如下：
```
Exception in thread "Thread2" java.lang.IndexOutOfBoundsException: Index 0 out of bounds for length 0
	at java.base/jdk.internal.util.Preconditions.outOfBounds(Preconditions.java:100)
	at java.base/jdk.internal.util.Preconditions.outOfBoundsCheckIndex(Preconditions.java:106)
	at java.base/jdk.internal.util.Preconditions.checkIndex(Preconditions.java:302)
	at java.base/java.util.Objects.checkIndex(Objects.java:385)
	at java.base/java.util.ArrayList.remove(ArrayList.java:551)
	at com.thread.concurrent1.ThreadUnsafe.method3(TestThreadSafe.java:45)
	at com.thread.concurrent1.ThreadUnsafe.method1(TestThreadSafe.java:36)
	at com.thread.concurrent1.TestThreadSafe.lambda$main$0(TestThreadSafe.java:23)
	at java.base/java.lang.Thread.run(Thread.java:1583)

```

原因：
- add 操作不是原子性的，add 方法内部会去更新集合的 size 值。可能 t1 线程将数据加入集合，但是还没更新 size 的时候，时间片就被 t2 线程抢走了。t2 线程执行完 add 后并将 size 值更新成 1。此时时间片又被 t1 线程抢走，size 的值再次被设置为 1。这就导致 remove 的时候会有一个线程报索引越界。


分析:
- 无论哪个线程中的 `method2` 引用的都是同一个对象中的 `list` 成员变量，此时临界区产生了
- `method3` 与 `method2` 分析相同

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/%E5%B9%B6%E5%8F%91%E7%BC%96%E7%A8%8B_page51_image.png)



如果将 list 修改为局部变量，并且此局部变量的引用没有暴露给外部：

```java
/**
 * 局部变量线程安全
 */
class ThreadSafe {
    public final void method1(int loopNumber) {
        ArrayList<String> list = new ArrayList<>();
        for (int i = 0; i < loopNumber; i++) {
            method2(list);
            method3(list);
        }
    }

    private void method2(List<String> list) {
        list.add("1");
    }

    private void method3(List<String> list) {
        list.remove(0);
    }
}
```
那么，无论运行多少遍，都不会出现上面的索引越界异常。

分析:
- `list` 是局部变量,每个线程调用时会创建其不同实例,没有共享
- 而 `method2` 的参数是从 `method1` 中传递过来的,与 `method1` 中引用同一个对象
- `method3` 的参数分析与 `method2` 相同

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/%E5%B9%B6%E5%8F%91%E7%BC%96%E7%A8%8B_page52_image.png)

---

如果把 method2 和 method3 的方法修改为 public 会不会出现线程安全问题？ 
- 情况一：有其它线程调用 method2 和 method3
- 情况二：在 情况1 的基础上，为 ThreadSafe 类添加子类，子类覆盖 method2 或 method3 方法

```java
class ThreadSafe {
    public final void method1(int loopNumber) {
        List<String> list = new ArrayList<>();
        for (int i = 0; i < loopNumber; i++) {
            method2(list);
            method3(list);
        }
    }
    
    private void method2(List<String> list) {
        list.add("1");
    }
    
    private void method3(List<String> list) {
        list.remove(0);
    }
}

class ThreadSafeSubClass extends ThreadSafe{
    @Override
    public void method3(List<String> list) {
        new Thread(() -> {
            list.remove(0);
        }).start();
    }
}
```
>从这个例子可以看出 `private` 或 `final` 提供【安全】的意义所在，请体会开闭原则中的【闭】

- ThreadSafe：线程安全 ✅（因为 list 是局部变量，只有一个线程访问）。
- ThreadSafeSubClass：线程不安全 ❌（因为 list 被多个线程并发访问，而 ArrayList 不是线程安全的）。

可能出现的问题：
- `list.add("1")` 还没执行完，新的线程就来 `remove(0)`，可能抛 `IndexOutOfBoundsException`。
- `ArrayList` 不是线程安全的，如果多个线程同时` add/remove`，可能会导致数据错乱甚至 `ConcurrentModificationException`。

:::warning
如果在子类中定义的方法和基类中的一个 private 方法签名相同**此时子类的方法不是重写基类方法，而是在子类中定义了一个新的方法。**
:::

#### 常见线程安全类

:::info
- String 
- Integer、Boolean、Double 等包装类
- StringBuffer 
- Random 
- Vector 
- Hashtable 
- java.util.concurrent 包下的类
:::

**多个线程调用它们同一个实例的某个方法时，是线程安全的。** 也可以理解为
- 它们的每个方法都用`synchronized`所修饰，都是原子操作，不会被线程的上下文切换所干扰
- 但注意它们**多个方法组合在一起就不是原子操作**

```java
HashTable table = new HashTable();

Thread t1 = new Thread(() -> {
    table.put("key", "value1");  // 每个方法可以保证方法内的临界区代码是原子性的
}, "t1");
t1.start();

Thread t2 = new Thread(() -> {
    table.put("key", "value2");
}, "t2");
t2.start();
```

##### 线程安全类方法组合使用

分析这段代码是否线程安全:
```java
Hashtable table = new Hashtable();
// 线程1，线程2 执行下面方法
if( table.get("key") == null) {
    table.put("key", value);
}
```
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-20_21-10-23.png)
此时会产生数据覆盖问题

结果：

由此可见，哪怕线程安全类中的每个方法都是线程安全的，都能保证原子性。但是它们组合到一起不是线程安全的，不能保证原子性。要想它们的组合也能保证原子性，需要手动在外部加线程安全的保护，加锁。 

##### 不可变类的线程安全性

String、Integer 等都是不可变类，因为其内部的属性都不可以改变，因此它们的方法都是线程安全的。

:::tip
但 String 有 replace，substring 等方法可以改变值啊，那么这些方法又是如何保证线程安全的呢？

答： String 类内部的replace()、substring()都不是在原先的 String 对象上操作，而是每次修改就新建了一个 String 对象。
:::

String 的 substring 源码
```java
public String substring(int beginIndex) {
    if (beginIndex < 0) {
        throw new StringIndexOutOfBoundsException(beginIndex);
    } else {
        int subLen = this.length() - beginIndex;
        if (subLen < 0) {
            throw new StringIndexOutOfBoundsException(subLen);
        } else if (beginIndex == 0) {
            return this;
        } else {
            // 核心代码 内部调用了 System.arrayCopy() 来复制字符数组
            return this.isLatin1() ? StringLatin1.newString(this.value, beginIndex, subLen) : StringUTF16.newString(this.value, beginIndex, subLen);
        }
    }
}

// 由此可见，这些方法底层都是新建了一个 String 对象，并把旧对象上的数据复制到新对象上
public static String newString(byte[] val, int index, int len) {
    return new String(Arrays.copyOfRange(val, index, index + len), (byte)0);
}
```
##### 案例分析

例1：
```java
public class MyServlet extends HttpServlet {
    // 是否安全？  HashMap 是线程不安全的
    Map<String,Object> map = new HashMap<>();
    // 是否安全？  安全
    String S1 = "...";
    // 是否安全？  安全
    final String S2 = "...";
    // 是否安全？  不安全，常见线程安全类中没有
    Date D1 = new Date();
    // 是否安全？  不安全，final 只能保证 D2 这个成员变量的引用值不能变。
    //             但是这个日期里面的属性可以发生变化
    final Date D2 = new Date();

    public void doGet(HttpServletRequest request, HttpServletResponse response) {
        // 使用上述变量
    }
}
```


例2：
```java
public class MyServlet extends HttpServlet {
    // 是否安全？  不安全，UserService 是成员变量，被共享使用
    private UserService userService = new UserServiceImpl();

    public void doGet(HttpServletRequest request, HttpServletResponse response) {
        userService.update(...);
    }
}

public class UserServiceImpl implements UserService {
    // 记录调用次数
    private int count = 0;  // 共享资源

    public void update() {
        // 临界区
        count++;
    }
}
```

例3：
```java
@Aspect
@Component
public class MyAspect {
    // 是否安全？ 不安全 
    // Spring 中的 bean 没有特殊说明的话，默认情况下都是单例的
    // 由于 MyAspect 是单例的，是被共享的；那 start 这个成员变量也是被共享的
    private long start = 0L;

    @Before("execution(* *(..))")
    public void before() {
        start = System.nanoTime();
    }

    @After("execution(* *(..))")
    public void after() {
        long end = System.nanoTime();
        System.out.println("cost time:" + (end - start));
    }
}
```
>可以使用环绕通知来解决这个线程安全问题。把这些属性变成环绕通知中的局部变量

例 4：
```java
public class MyServlet extends HttpServlet {
    // 是否安全  虽然 UserService 中有一个 UserDao 的成员变量，但是没有其他的地方可以修改它。
    //			 所以这个成员变量 UserDao 是不可变的，所以是安全的
    private UserService userService = new UserServiceImpl();

    public void doGet(HttpServletRequest request, HttpServletResponse response) {
        userService.update(...);
    }
}

public class UserServiceImpl implements UserService {
    // 是否安全  虽然 UserDao 是成员变量，也会被共享。但内部没有可以更改的属性。所以是安全的
    private UserDao userDao = new UserDaoImpl();

    public void update() {
        userDao.update();
    }
}

public class UserDaoImpl implements UserDao {
    public void update() {
        String sql = "update user set password = ? where username = ?";
        // 是否安全  因为没有成员变量，Connection 是局部变量。所以是线程安全的
        try (Connection conn = DriverManager.getConnection("","","")){
            // ...
        } catch (Exception e) {
            // ...
        }
    }
}
```

例 5：

```java
public class MyServlet extends HttpServlet {
    // 是否安全  安全。思路同上
    private UserService userService = new UserServiceImpl();

    public void doGet(HttpServletRequest request, HttpServletResponse response) {
        userService.update(...);
    }
}

public class UserServiceImpl implements UserService {
    // 是否安全  安全。思路同上
    private UserDao userDao = new UserDaoImpl();

    public void update() {
        userDao.update();
    }
}

public class UserDaoImpl implements UserDao {
    // 是否安全  由于 UserDaoImpl 是被多个线程所共享的，所以 Connection 是被共享的成员变量
    // 			 所以是线程不安全的
    private Connection conn = null;
    public void update() throws SQLException {
        String sql = "update user set password = ? where username = ?";
        conn = DriverManager.getConnection("","","");
        // ...
        conn.close();
    }
}
```
这里Connection对象被共享，是说线程a执行到close前，cpu时间片完了。切换线程b，b执行完close后，它时间片也完了。这是切换线程a，它去执行close方法时，会报空指针异常。

例 6：
```java
public class MyServlet extends HttpServlet {
    // 是否安全  安全。思路同上
    private UserService userService = new UserServiceImpl();

    public void doGet(HttpServletRequest request, HttpServletResponse response) {
        userService.update(...);
    }
}

public class UserServiceImpl implements UserService {
    public void update() {
        UserDao userDao = new UserDaoImpl();
        userDao.update();
    }
}

public class UserDaoImpl implements UserDao {
    // 是否安全  由于 前面的 service 中每次都创建了一个新的 UserDao 对象，所以多个线程操作的
    //     		 不是同一个对象，是线程安全的	
    private Connection = null;
    public void update() throws SQLException {
        String sql = "update user set password = ? where username = ?";
        conn = DriverManager.getConnection("","","");
        // ...
        conn.close();
    }
}
```

例 7：
```java
public abstract class Test {

    public void bar() {
        // 是否安全  由于是抽象类，局部变量 sdf 可能会传递给抽象方法 foo。
        // 			 可能子类会进行不恰当的实现。所以是线程不安全的
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        foo(sdf);
    }
    
    public abstract foo(SimpleDateFormat sdf);

    public static void main(String[] args) {
        new Test().bar();
    }
    
}
```
其中 foo 的行为是不确定的，可能导致不安全的发生，被称之为**外星方法**
```java
public void foo(SimpleDateFormat sdf) {
    String dateStr = "1999-10-11 00:00:00";
    for (int i = 0; i < 20; i++) {
        new Thread(() -> {
            try {
                sdf.parse(dateStr);
            } catch (ParseException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```
:::tip
实现线程安全有三种方式：
1. 无共享变量
2. 共享变量不可变
3. 同步
:::

##### 卖票练习

测试下面代码是否存在线程安全问题，并尝试改正
```java
@Slf4j(topic = "c.ExerciseSell")
public class ExerciseSell {
    public static void main(String[] args) throws InterruptedException {
        // TODO 模拟多线程场景下买票操作
        TicketWindow ticket = new TicketWindow(1000);  // 创建一个售票窗口，有 1000 张票

        // 所有线程集合
        List<Thread> threadList = new ArrayList<>();
        // 统计卖出的票数
        List<Integer> amountList = new Vector<>();  // Vector 是线程安全的实现
        for (int i = 0; i < 4000; i++) {
            Thread thread = new Thread(() -> {
                // 买票
                int amount = ticket.sell(randomAmount());
                amountList.add(amount);
            });
            
            // threadList只在主线程中被创建和使用,是非共享数据,没有其他线程修改它。
            // 所以是线程安全的。可以使用 ArrayList 来创建
            threadList.add(thread);
            thread.start();
        }

        // 主线程需要等待所有线程运行结束，再往下执行
        for (Thread thread : threadList) {
            thread.join();
        }

        // 统计卖出的票数和剩余的票数
        log.debug("余票数量为：{}", ticket.getCount());
        log.debug("卖出的票数为：{}", amountList.stream().mapToInt(Integer::intValue).sum());
    }

    // Random 为线程安全
    static Random random = new Random();

    /**
     * 随机产生 1~5
     *
     * @return 产生的值
     */
    public static int randomAmount() {
        return random.nextInt(5) + 1;
    }
}

/**
 * 售票窗口
 */
class TicketWindow {
    private int count;

    public TicketWindow(int count) {
        this.count = count;
    }

    // 获取余票数量
    public int getCount() {
        return count;
    }

    // 售票
    public int sell(int amount) {
        if (this.count >= amount) {
            this.count -= amount;
            return amount;
        } else {
            return 0;
        }
    }
}

```

输出：
```
23:28:42.967 c.ExerciseSell [main] - 余票数量为：0
23:28:42.973 c.ExerciseSell [main] - 卖出的票数为：1005
```
可以发现，此时的代码存在线程安全问题。多卖出去了 5 张票。

:::info
让我们分析下这段代码中的临界区以及共享变量：
1. ticket 是共享变量，多个线程都会用到。
2. sell() 方法内部有对 amount 共享变量的读写操作，属于临界区。
3. amountList 也存在线程安全问题，内部有对数组的操作。但我们不用考虑，因为 Vector 已经加了锁，会对 add 方法做线程安全的保护。
:::
所以，要想解决这段代码的线程安全。就需要对临界区加锁    `public synchronized int sell`


线程安全的卖票代码:
```java
@Slf4j(topic = "c.ExerciseSell")
public class ExerciseSell {
    public static void main(String[] args) throws InterruptedException {
        // TODO 模拟多线程场景下买票操作
        TicketWindow ticket = new TicketWindow(1000);  // 创建一个售票窗口，有 1000 张票

        // 所有线程集合
        List<Thread> threadList = new ArrayList<>();
        // 统计卖出的票数
        List<Integer> amountList = new Vector<>();  // Vector 是线程安全的集合实现
        for (int i = 0; i < 4000; i++) {
            Thread thread = new Thread(new Runnable() {
                @Override
                public void run() {
                    // 买票
                    // TODO 1. ticket 是共享变量，多个线程都会用到。
                    int amount = ticket.sell(randomAmount());
                    amountList.add(amount);  // TODO 3. amountList 也存在线程安全问题，内部有对数组的操作。但我们不用考虑，因为 Vector 已经加了锁，会对 add 方法做线程安全的保护
                }
            });
            threadList.add(thread);  // threadList只在主线程中被创建和使用,是非共享数据,没有其他线程修改它,所以是线程安全的。可以使用ArrayList来创建
            thread.start();
        }

        // 主线程需要等待所有线程运行结束，再往下执行
        for (Thread thread : threadList) {
            thread.join();
        }

        // 统计卖出的票数和剩余的票数
        log.debug("余票数量为：{}", ticket.getCount());
        log.debug("卖出的票数为：{}", amountList.stream().mapToInt(Integer::intValue).sum());
    }

    // Random 为线程安全
    static Random random = new Random();

    /**
     * 随机产生 1~5
     *
     * @return 产生的值
     */
    public static int randomAmount() {
        return random.nextInt(5) + 1;
    }
}

/**
 * 售票窗口
 */
class TicketWindow {
    private int count;

    public TicketWindow(int count) {
        this.count = count;
    }

    // 获取余票数量
    public int getCount() {
        return count;
    }

    // 售票
    // 2. sell() 方法内部有对 amount 共享变量的读写操作。属于临界区。使用 synchronized 加锁保护
    public synchronized int sell(int amount) {
        if (this.count >= amount) {
            this.count -= amount;
            return amount;
        } else {
            return 0;
        }
    }
}

```


##### 转账练习

线程不安全的转账代码
```java
@Slf4j(topic = "c.ExerciseTransfer")
public class ExerciseTransfer {
    public static void main(String[] args) throws InterruptedException {
        Account a = new Account(1000);
        Account b = new Account(1000);

        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 1000; i++) {
                a.transfer(b, randomAmount());
            }
        }, "t1");

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 1000; i++) {
                b.transfer(a, randomAmount());
            }
        }, "t2");

        t1.start();
        t2.start();
        // 等待 t1、t2 线程执行完毕
        t1.join();
        t2.join();

        // 查看转账 2000 次后的总金额
        log.debug("total:  {}", (a.getMoney() + b.getMoney()));
    }

    // Random 为线程安全
    static Random random = new Random();

    /**
     * 随机产生 1~100
     *
     * @return 产生的值
     */
    public static int randomAmount() {
        return random.nextInt(100) +1;
    }
}

class Account {
    private int money;

    public Account(int money) {
        this.money = money;
    }

    public int getMoney() {
        return money;
    }

    public void setMoney(int money) {
        this.money = money;
    }

    // 转账
    public void transfer(Account target, int amount) {
        if (this.money >= amount) {
            this.setMoney(this.getMoney() - amount);
            target.setMoney(target.getMoney() + amount);
        }
    }
}

```
```
22:11:30.593 c.ExerciseTransfer [main] - total:  4291
```
可以发现，此时的代码存在线程安全问题。总金额变多了。

:::info
让我们分析下这段代码中的临界区以及共享变量：
1. transfer()方法涉及到共享资源的读写，这段方法为临界区。
2. 共享变量为account，并且由于是两个对象操作transfer()方法。所以共享变量有两个。分别是对象 a 的account和对象 b 的account。 
3. 涉及Account类的多个实例对象。所以不能用对象锁（两个线程锁的是不同对象，不起作用），要用类锁。
:::

所以，要想解决这段代码的线程安全。就需要对临界区加锁    `synchronized (Account.class) {}`

线程安全的转账代码:
```java
@Slf4j(topic = "c.ExerciseTransfer")
public class ExerciseTransfer {
    public static void main(String[] args) throws InterruptedException {
        Account a = new Account(1000);
        Account b = new Account(1000);

        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 1000; i++) {
                a.transfer(b, randomAmount());
            }
        }, "t1");

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 1000; i++) {
                b.transfer(a, randomAmount());
            }
        }, "t2");

        t1.start();
        t2.start();
        // 等待 t1、t2 线程执行完毕
        t1.join();
        t2.join();

        // 查看转账 2000 次后的总金额
        log.debug("total:  {}", (a.getMoney() + b.getMoney()));
    }

    // Random 为线程安全
    static Random random = new Random();

    /**
     * 随机产生 1~100
     *
     * @return 产生的值
     */
    public static int randomAmount() {
        return random.nextInt(100) +1;
    }
}

class Account {
    private int money;

    public Account(int money) {
        this.money = money;
    }

    public int getMoney() {
        return money;
    }

    public void setMoney(int money) {
        this.money = money;
    }

    // 转账
    // TODO 涉及到共享资源的读写。a 对象的 money 和 b 对象的 money 是共享变量。此段代码为临界区。
    public void transfer(Account target, int amount) {
        // 需要把锁加在共享类上。不能到 this 对象上
        synchronized (Account.class) {
            if (this.money >= amount) {
                this.setMoney(this.getMoney() - amount);
                target.setMoney(target.getMoney() + amount);
            }
        }
    }
}
```




### Monitor

#### Java对象头

通常， 我们创建的对象都由两部分组成：
1. 对象头
2. 对象中的成员变量

以 32 位虚拟机为例

**普通对象：**
```
|--------------------------------------------------------------|
|                     Object Header (64 bits)                  |
|------------------------------------|-------------------------|
|        Mark Word (32 bits)         |    Klass Word (32 bits) |
|------------------------------------|-------------------------|
```

**数组对象：**
```
|---------------------------------------------------------------------------------|
| 	        Object Header (96 bits) 											  |
|--------------------------------|-----------------------|------------------------|
| 	  	  Mark Word (32bits)     |   Klass Word (32bits) |  array length (32bits) |
|--------------------------------|-----------------------|------------------------|
```

**其中 Mark Word 的结构为：**
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-20_22-34-34.png)

**64 位虚拟机 Mark Word**
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-20_22-35-27.png)

参考资料：https://stackoverflow.com/questions/26357186/what-is-in-java-object-header


#### 原理 - Monitor 锁

Monitor被翻译为**监视器**或**管程**

每个 Java 对象都可以关联一个 Monitor 对象，如果使用 synchronized 给对象上锁（重量级）之后，该对象头的 Mark Word 中就被设置指向 Monitor 重量级锁对象的地址

Monitor 结构如下：

> 1. Owner：所有者，Monitor 中只能有一个所有者
> 2. EntryList：等待队列（阻塞队列），进入此队列的线程会进入 BLOCKED 阻塞状态
> 3. WaitSet：之前获取过锁，但执行条件不满足，进入 WAITING 状态的线程

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-20_22-49-43.png)

---

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-20_22-55-38.png)

- 刚开始 Monitor 中 Owner（所有者）为空
- 当 Thread-2 执行 synchronized(obj) 时，就会把 Java 对象 obj 和操作系统对象 Monitor 相关联。（靠 obj 对象头中的 Mark Word 记录 Monitor 对象的指针地址）  因为目前只有 Thread-2 一个线程，所以 Monitor 的 Owner 属性会关联上 Thread-2
- 如果 Thread-3，Thread-4，Thread-5 也来执行 synchronized(obj)，由于 obj 已经关联了一个 Monitor 锁，这些线程就会检查 Monitor 锁是否有主人。因为此时锁的 Owner 属性已经关联上了 Thread-2，所以这些线程就会进入 EntryList 等待队列。这些线程也会进入 BLOCKED 阻塞状态
- Thread-2 执行完同步代码块的内容，Owner 就会空出来，然后唤醒 EntryList 中等待的线程来竞争锁，竞争时是非公平的（不一定是先进 EntryList 的线程先成为 Owner，JDK 底层实现决定的）
- 图中 WaitSet 中的 Thread-0，Thread-1 是之前获得过锁，但条件不满足进入 WAITING 状态的线程，后面讲 wait-notify 时会分析

:::warning
- synchronized 必须是进入同一个对象的 Monitor 才有上述的效果 
- 不加 synchronized 的对象不会关联 Monitor，不遵从以上规则
:::



#### 原理 - synchronized

```java
static final Object lock = new Object();
static int counter = 0;

public static void main(String[] args) {
    synchronized (lock) {
        counter++;
    }
}
```

反编译为字节码后，对应的字节码为
```java
public static void main(java.lang.String[]);
	descriptor: ([Ljava/lang/String;)V
	flags: ACC_PUBLIC, ACC_STATIC
	Code:
	 	stack=2, locals=3, args_size=1
	 	0: getstatic     #2            // <- lock引用 （synchronized开始）      
		3: dup
 		4: astore_1                    // lock引用 -> slot 1      
		5: monitorenter                // 将 lock对象 MarkWord 置为 Monitor 指针   
		6: getstatic     #3			   // <- i
		9: iconst_1                    // 准备常数 1    
		10: iadd                       // +1     
		11: putstatic    #3            // -> i  
		14: aload_1                    // <- lock引用     
		15: monitorexit                // 将 lock对象 MarkWord 重置, 唤醒 EntryList       
		16: goto         24
		19: astore_2                   // e -> slot 2       
		20: aload_1                    // <- lock引用       
		21: monitorexit                // 将 lock对象 MarkWord 重置, 唤醒 EntryList       
		22: aload_2                    // <- slot 2 (e)       
		23: athrow                     // throw e       
		24: return
 Exception table:
	 from  	  to  target type
	 	6     16	19    any  
	   19     22	19	  any
 LineNumberTable:
	 line 8: 0
	 line 9: 6
	 line 10: 14
	 line 11: 24
 LocalVariableTable:
 	Start  Length  Slot  Name   Signature
    	0      25      0  args	 [Ljava/lang/String;
 StackMapTable: number_of_entries = 2
 	frame_type = 255 /* full_frame */
 		offset_delta = 19
 		locals = [ class "[Ljava/lang/String;", class java/lang/Object ]
 		stack = [ class java/lang/Throwable ]
	frame_type = 250 /* chop */
 		offset_delta = 4
```

:::warning
 方法级别的 synchronized 不会在字节码指令中有所体现
:::



#### 原理 - synchronized 进阶

##### 轻量级锁

>轻量级锁相比较重量级锁，性能有了一定提升。因为不再需要 Monitor 锁，只是用线程栈中的锁记录对象来充当轻量级锁。但轻量级锁还是有一定缺点，可以使用偏向锁进行进一步优化。

**使用场景：**

如果一个对象有多线程要进行加锁，但加锁的时间是错开的（也就是没有竞争），那么可以使用轻量级锁来优化。 

轻量级锁对使用者是透明的，即语法仍然是synchronized
>JDK6 之后，使用 synchronized进行加锁时，会优先加轻量级锁。如果有竞争，轻量级锁会升级成重量级锁


假设有两个方法同步块，利用同一个对象加锁：
```java
static final Object obj = new Object();

public static void method1() {
    synchronized( obj ) {
        // 同步块 A
        method2();
    }
}

public static void method2() {
    synchronized( obj ) {
        // 同步块 B
    }
}
```

**图示：**

1. 创建锁记录（Lock Record）对象，**每个线程的栈帧都会包含一个锁记录的结构**，内部可以存储锁定对象的Mark Word 

:::info
锁记录对象对我们来说也和 Monitor 一样是不可见的。不是 Java 层面的，是操作系统层面的。

锁记录对象由两部分组成：
1. 对象指针（Object reference）：将来锁住的对象的内存地址
2. 锁记录地址和状态信息：用来记录将来锁住的对象的 Mark Work，方便将来解锁时恢复待解锁对象的对象头数据。会和锁住的对象的 Mark Work 通过 CAS 进行交换
:::

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-21_21-46-45.png)

2. 让锁记录中 `Object reference` 指向锁对象，并尝试用 `CAS` 替换 `Object` 的 `Mark Word`，将 `Mark Word` 的值存入锁记录
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-21_21-51-14.png)

3. 如果 CAS 替换成功，对象头中存储了锁记录地址和状态 00，表示由该线程给对象加锁，这时图示如下
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-21_21-49-32.png)

4. 如果 CAS 失败，有两种情况
    - 如果是其它线程已经持有了该 Object 的轻量级锁，这时表明有竞争，进入锁膨胀过程
    - 如果是自己执行了 `synchronized` 锁重入，那么再添加一条 `Lock Record` 作为重入的计数（图中有两个锁记录对象，计数为 2）

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-21_21-53-03.png)

5. 当退出 `synchronized` 代码块（解锁时）如果有取值为 `null` 的锁记录，表示有重入，这时重置锁记录，表示重入计数减一

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-21_21-54-14.png)

6. 当退出 `synchronized` 代码块（解锁时）锁记录的值不为 `NULL`，这时使用 `CAS` 将 `Mark Word` 的值恢复给对象头
    - 成功，则解锁成功
    - 失败，说明轻量级锁进行了锁膨胀或已经升级为重量级锁，进入重量级锁解锁流程


##### 锁膨胀
如果在尝试加轻量级锁的过程中，CAS 操作无法成功，这时一种情况就是有其它线程为此对象加上了轻量级锁（产生了竞争），这时需要进行锁膨胀，将轻量级锁升级为重量级锁。

```java
static Object obj = new Object();
public static void method1() {
    synchronized( obj ) {
        // 同步块
    }
}
```

**图示：**

1. 当 Thread-1 准备对 obj 对象进行轻量级加锁时，此时 Thread-0 已经对该对象加了轻量级锁
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-21_22-10-16.png)


2. 这时 Thread-1 加轻量级锁会失败，进入锁膨胀流程
    - 即为 `obj` 对象申请 `Monitor` 锁，并让 `obj` 指向重量级锁地址
    - 然后自己进入 `Monitor` 的 `EntryList` 等待队列，进入 `BLOCKED` 阻塞状态

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-21_22-11-08.png)


3. Thread-0 退出同步块解锁时，使用 `CAS` 将 `Mark Word` 的值恢复给对象头，此时由于轻量级锁进行了锁膨胀，会解锁失败。这时会进入重量级解锁流程，即按照 `Monitor` 地址找到 `Monitor 对象`，设置 `Owner` 为 `null`，唤醒 `EntryList` 等待队列中处于 `BLOCKED` 状态的线程

##### 自旋优化


:::info
自旋：在发生重量级锁竞争的过程中，当前线程先不要进入阻塞，而是进行几次循环。可以避免线程的上下文切换

进入阻塞再恢复,会发生上下文切换,比较耗费性能
:::

重量级锁竞争的时候，还可以使用自旋（循环尝试获取重量级锁）来进行优化，如果当前线程自旋成功（即此时持锁线程已经退出了同步块，释放了锁），这时当前线程就可以避免阻塞，直接成为 Monitor 重量级锁中新的 Owner。

**自旋重试成功的情况**

线程 1（core 1 上）| 对象 Mark | 线程 2（core 2 上）
|-|-|-
|-|10（重量锁）|-
|访问同步块，获取 monitor|10（重量锁）重量锁指针|-
|成功（加锁）|10（重量锁）重量锁指针|-
|执行同步块|10（重量锁）重量锁指针|-
|执行同步块|10（重量锁）重量锁指针|访问同步块，获取 monitor
|执行同步块|10（重量锁）重量锁指针|自旋重试
|执行完毕|10（重量锁）重量锁指针|自旋重试
|成功（解锁）|01（无锁）|自旋重试
|-|10（重量锁）重量锁指针|成功（加锁）
|-|10（重量锁）重量锁指针|执行同步块
|-|...|...


**自旋重试失败的情况**

| 线程 1（core 1 上） | 对象 Mark | 线程 2（core 2 上） |
|---------------------|-----------|---------------------|
| -                   | 10（重量锁） | -                   |
| 访问同步块，获取 monitor | 10（重量锁）重量锁指针 | -                   |
| 成功（加锁）        | 10（重量锁）重量锁指针 | -                   |
| 执行同步块          | 10（重量锁）重量锁指针 | -                   |
| 执行同步块          | 10（重量锁）重量锁指针 | 访问同步块，获取 monitor |
| 执行同步块          | 10（重量锁）重量锁指针 | 自旋重试            |
| 执行同步块          | 10（重量锁）重量锁指针 | 自旋重试            |
| 执行同步块          | 10（重量锁）重量锁指针 | 自旋重试            |
| 执行同步块          | 10（重量锁）重量锁指针 | 阻塞                |
| -                   | ...       | ...                 |

:::warning
- 自旋会占用 CPU 时间，单核 CPU 自旋就是浪费，多核 CPU 自旋才能发挥优势。
- 在 Java 6 之后自旋锁是自适应的，比如对象刚刚的一次自旋操作成功过，那么认为这次自旋成功的可能性会高，就多自旋几次；反之，就少自旋甚至不自旋，总之，比较智能。
- Java 7 之后不能手动控制是否开启自旋功能
:::

##### 偏向锁

:::warning
从 JDK18 开始，偏向锁已经被彻底废弃！
:::

轻量级锁在没有竞争时（就自己这个线程），每次重入仍然需要执行 CAS 操作。 会浪费 CPU 的性能。
Java 6 中引入了偏向锁来做进一步优化：只有第一次使用 CAS 将线程 ID 设置到对象的 Mark Word 头，如果后续再发生锁冲入，之后发现这个线程 ID 是自己的就表示没有竞争，不用重新 CAS。以后只要不发生竞争，这个对象就归该线程所有
>这里的线程 ID 是操作系统赋予的 ID

例如：
```java
static final Object obj = new Object();

public static void m1() {
    synchronized( obj ) {
        // 同步块 A
        m2();
    }
}

public static void m2() {
    synchronized( obj ) {
        // 同步块 B
        m3();
    }
}

public static void m3() {
    synchronized( obj ) {
        // 同步块 C
    }
}
```
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-21_22-55-57.png)

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-21_22-58-21.png)



###### 偏向锁-状态

回忆一下对象头格式

| Mark Word (64 bits)                                                                 | State               |
|-------------------------------------------------------------------------------------|---------------------|
| `unused:25` \| `hashcode:31` \| `unused:1` \| `age:4` \| `biased_lock:0` \| `01`   | Normal              |
| `thread:54` \| `epoch:2` \| `unused:1` \| `age:4` \| `biased_lock:1` \| `01`       | Biased              |
| `ptr_to_lock_record:62` \| `00`                                                    | Lightweight Locked  |
| `ptr_to_heavyweight_monitor:62` \| `10`                                            | Heavyweight Locked  |
| `11`                                                                                | Marked for GC       |

一个对象创建时：
- 如果开启了偏向锁（默认开启），那么对象创建后，MarkWord值为0x05，即最后3位为101，这时它的thread、epoch、age都为0
- 偏向锁是默认是延迟的，不会在程序启动时立即生效，如果想避免延迟，可以加VM参数 `-XX:BiasedLockingStartupDelay=0` 来 禁用延迟
- 如果没有开启偏向锁，那么对象创建后，MarkWord 值为0x01即最后3位为001，这时它的hashcode、age都为0，第一次用到hashcode时才会赋值

1. 测试延迟特性
```java
@Sl4j
public class TestBiased {
    public static void main(String[] args) {
        Dog dog = new Dog();
        // toPrintableSimple 扩展了 jol 让它的输出更简洁
        log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true));  

        Thread.sleep(4000);
        log.debug(ClassLayout.parseInstance(new Dog()).toPrintableSimple(true)); 
    }
}

class Dog {}
```
```
c.TestBiased [main] - 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
c.TestBiased [main] - 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000101 
```
>- 此时，第一次打印我们发现 dog 对象的 MarkWord 最后三位是 001 ，不是我们预期的 101 。这是因为：
>**偏向锁默认是有延迟的，不会在程序启动时立即生效**
>
>- 第二次打印因为我们让程序启动后休眠了 4s ，偏向锁在此期间已经生效了，所以会发现此时 dog 对象的 MarkWord 最后三位已经是 101

2. 测试偏向锁
```java
@Sl4j
public class TestBiased {
    public static void main(String[] args) {
        // 通过 VM Options 属性设置禁用延迟
        Dog dog = new Dog();
        log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true));

        synchronized(dog) {
            log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true)); 
        }

        log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true)); 
    }
}

class Dog {}
```
```
c.TestBiased [main] - 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000101 
c.TestBiased [main] - 00000000 00000000 00000000 00000000 00011111 11101011 11010000 00000101 
c.TestBiased [main] - 00000000 00000000 00000000 00000000 00011111 11101011 11010000 00000101
```
>- 第一次打印只是表示该对象启用了偏向锁。（因为前 54 位线程 ID 全是 0）
>- 第二次打印因为使用了 `synchronized` 来加锁，所以当前线程执行到此时，会优先给 dog 对象加偏向锁（不会考虑加轻量级锁或者重量级锁）。加锁后打印出来的 MarkWord 前 54 位是关联的操作系统的线程 ID
>- 第三次打印，在加锁完后，打印出来的 MarkWord 没有变化，这是因为“偏向”。dog 对象一开始被主线程给加了锁，以后这个 dog 对象就从属于这个线程。所以 dog 的 MarkWord 头里始终存储的是主线程 ID。除非有其他线程又用了此 dog 对象才会发生改变（处于偏向锁的对象解锁后，线程 ID 仍存储于对象头也就是偏向此线程）

3. 测试禁用

通过在代码运行时添加 VM 参数：`-XX:-UseBiasedLocking`来禁用偏向锁
```java
c.TestBiased [main] - 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
c.TestBiased [main] - 00000000 00000000 00000000 00000000 00100000 00010100 11110011 10001000 
c.TestBiased [main] - 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001
```

>- 第一次打印表示没有开启偏向锁
>- 第二次打印表示在加锁过程中，加了轻量级锁（00 代表轻量级锁）
>- 第三次打印表示加锁完成后，又变成了初始状态，此时 MarkWord 里面的线程 ID 也会重置

4. 测试 hashcode

```java
@Sl4j
public class TestBiased {
    public static void main(String[] args) {
        // 通过 VM Options 属性设置禁用延迟
        Dog dog = new Dog();
        dog.hashCode();  // TODO 会禁用该对象的偏向锁
        log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true));

        synchronized(dog) {
            log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true)); 
        }

        log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true)); 
    }
}

class Dog {}
```

```
c.TestBiased [main] - 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
c.TestBiased [main] - 00000000 00000000 00000000 00000000 00100000 00010100 11110101 10011000 
c.TestBiased [main] - 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001
```
>- 正常状态对象初始化后是没有 hashcode 的，第一次调用才生成
>- 调用了 hashCode() 后会撤销该对象的偏向锁


**为什么调用 hashCode() 后就会禁用偏向锁？**

因为如果对象是处于偏向锁状态，MarkWord 内部存储完 54 位的操作系统线程 ID，没有足够的位置来存储 hashcode 码（31 位）

当一个可偏向的对象，调用了 hashCode() 方法后，就会撤销当前对象的偏向状态，变成正常状态的对象（MarkWord 后三位变为001）

**为什么使用轻量级锁或重量级锁可以正常使用 hashCode()？**

- 轻量级锁将对象的 `hashcode` 存放在线程栈桢中的锁记录对象中
- 重量级锁将对象的 `hashcode` 存放在 `Monitor` 对象中，解锁的时候会还原回来


###### 偏向锁-撤销

**其它线程使用对象**

两个线程访问同一个对象时是错开的（不能存在线程交错情况），会将偏向锁升级为轻量级锁

```java
@Sl4j
public class TestBiased {
    public static void main(String[] args) {
        Dog dog = new Dog();

        // 必须让两个线程交错开。必须是 t1 线程将锁解开后，t2 线程再去加锁
        // 否则如果有线程交错的情况，就会升级成重量级锁 
        new Thread(() -> {
            log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true));
            synchronized(dog) {  // TODO 此时，加的是偏向锁
                log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true)); 
            }
            log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true));

            synchronized(TestBiased.class) {
                TestBiased.class.notify();
            }
        }, "t1").start();

        new Thread(() -> {

            // 等待 t1 线程中类对象解锁，这样就可以保证 dog 对象的两个锁是交错开的
            synchronized(TestBiased.class) {
                TestBiased.class.wait();
            }
            
            log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true));
            synchronized(dog) {  // TODO 此时，偏向锁升级为轻量级锁
                log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true)); 
            }
            log.debug(ClassLayout.parseInstance(dog).toPrintableSimple(true)); 
        }, "t2").start();
    }
}

class Dog {}
```
```
c.TestBiased [t1] - 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000101 
c.TestBiased [t1] - 00000000 00000000 00000000 00000000 00011111 10110110 11101000 00000101 
c.TestBiased [t1] - 00000000 00000000 00000000 00000000 00011111 10110110 11101000 00000101
c.TestBiased [t2] - 00000000 00000000 00000000 00000000 00011111 10110110 11101000 00000101 
c.TestBiased [t2] - 00000000 00000000 00000000 00000000 00100000 01001011 11110011 00100000 
c.TestBiased [t2] - 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001
```

t1
- 第一次打印，dog 对象的 MarkWord 前几位全是 0，最后三位为 101：偏向锁。表示 t1 线程中的 dog 对象启用了偏向锁，但还没加锁
- 第二次打印，t1 线程给 dog 对象加上了偏向锁。此时 dog 对象的 MarkWord 前 54 位关联的就是 t1 线程的 ID (64 位虚拟机下，前 54 位是线程 ID，32 位虚拟机下，前 23 位是线程 ID)
- 第三次打印，解锁后，由于偏向锁特性，t1 线程 ID 仍然会保留在 dog 对象的 MarkWord 里
- 执行完后，t1 线程唤醒 t2 线程

t2
- 第一次打印，dog 对象没加锁之前，还是上次的状态，MarkWord 头的前 54 位还关联着 t1 的线程 ID
- 第二次打印，本来 dog 对象是偏向于 t1 线程的，但由于 t2 线程此时也需要给 dog 对象加锁，就会导致偏向锁失效，偏向锁会升级为轻量级锁，此时 MarkWord 头最后 2 位变为 000：轻量级锁。前 62 位是锁记录指针
- 第三次打印，解锁后，dog 对象上的偏向状态变成了 0，变成不可偏向状态。且锁记录指针被清空

---

**批量重偏向**


如果对象虽然被多个线程访问，但没有竞争，这时偏向了线程 T1 的对象仍有机会重新偏向 T2，重偏向会重置对象的 Thread ID

当撤销偏向锁阈值超过 20 次后，jvm 会这样觉得，我是不是偏向错了呢，于是会在给这些对象加锁时重新偏向至加锁线程

```java
private static void test3() throws InterruptedException {
    
    List<Dog> list = new Vector<>();
    
    Thread t1 = new Thread(() -> {
        for (int i = 0; i < 30; i++) {
            Dog d = new Dog();
            list.add(d);
            synchronized (d) {
                log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            }
        }
        synchronized (list) {
            list.notify();
        }
    }, "t1");
    t1.start();

    Thread t2 = new Thread(() -> {
        synchronized (list) {
            try {
                list.wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }  
        log.debug("===============> ");
        for (int i = 0; i < 30; i++) {
            Dog d = list.get(i);
            log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            synchronized (d) {
                log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            }
            log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
        }
    }, "t2");
    t2.start();
}
```
注意观察 t2 - 19 处的变化，此时批量重偏向成 t2 线程
```
[t1] - 0 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 1 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 2 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 3 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 4 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 5 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 6 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 7 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 8 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 9 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 10 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 11 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 12 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 13 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 14 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 15 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 16 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 17 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 18 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 19 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 20 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 21 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 22 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 23 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 24 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 25 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 26 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 27 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 28 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 29 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - ===============> 
[t2] - 0 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 0 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 0 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 1 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 1 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 1 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 2 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 2 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 2 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 3 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 3 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 3 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 4 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 4 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 4 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 5 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 5 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 5 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 6 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 6 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 6 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 7 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101
[t2] - 7 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 7 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 8 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 8 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 8 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 9 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 9 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 9 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 10 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 10 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 10 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 11 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 11 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 11 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 12 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 12 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 12 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 13 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 13 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 13 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 14 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 14 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 14 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 15 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 15 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 15 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 16 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 16 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 16 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 17 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 17 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 17 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 18 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 18 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 18 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 19 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 19 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 19 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 20 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 20 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 20 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 21 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 21 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 21 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 22 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 22 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 22 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 23 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 23 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 23 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 24 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 24 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 24 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101
[t2] - 25 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 25 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 25 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 26 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 26 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 26 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 27 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 27 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 27 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 28 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 28 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 28 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 29 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 29 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 29 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101
```

---

**批量撤销**

当撤销偏向锁阈值超过 40 次后，jvm 会这样觉得，自己确实偏向错了，根本就不该偏向。于是整个类的所有对象都会变为不可偏向的，新建的该类型对象也是不可偏向的

```java
static Thread t1,t2,t3;

public static void main(String[] args) {
    test4();
}

/**
*	核心代码
*/
private static void test4() throws InterruptedException {
    List<Dog> list = new Vector<>();
    
    int loopNumber = 39;
    t1 = new Thread(() -> {
        for (int i = 0; i < loopNumber; i++) {
            Dog d = new Dog();
            list.add(d);
            synchronized (d) {  // TODO 偏向锁
                log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            }
        }
        LockSupport.unpark(t2);
    }, "t1");
    t1.start();
    
    t2 = new Thread(() -> {
        LockSupport.park();
        log.debug("===============> ");
        for (int i = 0; i < loopNumber; i++) {
            Dog d = list.get(i);
            log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            synchronized (d) {  // TODO 前 19 次(0~18)撤销偏向锁变为轻量级锁。从第20次开始会重偏向为偏向锁
                log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            }
            log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
        }
        LockSupport.unpark(t3);
    }, "t2");
    t2.start();
    
    t3 = new Thread(() -> {
        LockSupport.park();
        log.debug("===============> ");
        for (int i = 0; i < loopNumber; i++) {
            Dog d = list.get(i);
            log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            synchronized (d) {  // TODO 此时，t2线程已经撤销偏向锁20次(0~18),t3线程从19~38次执行撤销偏向锁。最后第40次Dog类的所有对象都变成不可偏向的
                log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            }
            log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
        }
    }, "t3");
    t3.start();
    
    t3.join();
    // 新建的对象由于批量撤销达到阈值40次变成不可偏向的状态
    log.debug(ClassLayout.parseInstance(new Dog()).toPrintableSimple(true));  
}
```

**参考博客：**

[Java对象头的组成](https://www.cnblogs.com/LemonFive/p/11246086.html)

[偏向锁批量重偏向与批量撤销](https://www.cnblogs.com/LemonFive/p/11248248.html)

[死磕Synchronized底层实现](https://github.com/farmerjohngit/myblog/issues/12)


---

**锁消除**

锁消除是指虚拟机即时编译器在运行时，对一些代码上要求同步的锁进行消除。锁消除的主要原因是因为Java虚拟机的**即时编译器**在运行时，会根据程序的运行情况，去除一些不必要的锁，以提高程序的运行效率。
```java

@Fork(1)
@BenchmarkMode(Mode.AverageTime)
@Warmup(iterations=3)
@Measurement(iterations=5)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
public class MyBenchmark {
    static int x = 0;
    
    @Benchmark
    public void a() throws Exception {
        x++;
    }
    
    @Benchmark
    public void b() throws Exception {
        // 这里的 obj 是局部变量,不会被共享,JIT 做热点代码优化时会做锁消除
        Object obj = new Object();
        synchronized (obj) {  
            x++;
        }
    }
    
}
```
运行命令：`java -jar benchmarks.jar`
```
Benchmark            Mode  Samples  Score  Score error  Units 
c.i.MyBenchmark.a    avgt        5  1.542        0.056  ns/op 
c.i.MyBenchmark.b    avgt        5  1.518        0.091  ns/op 
```
我们发现 a 方法和 b 方法的执行耗时几乎是一样的，甚至 b 方法加锁后的执行方法比 a 方法没加锁还要快
按理说：加锁是有一定的性能损耗的，就算是做了轻量级锁、偏向锁的优化，也还是会存在性能损耗
这是因为 Java 程序运行时，有一个 `JIT（即时编译器）`，它会对 Java 字节码进行进一步优化。因为局部变量 obj 没有逃离 b 方法的作用范围，所以 JIT 在做热点代码优化时会做锁消除

锁消除优化开关默认打开，通过下方命令运行 jar 包可以关闭锁消除优化
```
java -XX:-EliminateLocks -jar benchmarks.jar
```
再次执行：
```
Benchmark            Mode  Samples   Score  Score error  Units 
c.i.MyBenchmark.a    avgt        5   1.507        0.108  ns/op 
c.i.MyBenchmark.b    avgt        5  16.976        1.572  ns/op 
```
此时我们发现 b 方法比 a 方法性能要差十几倍



### wait notify


#### 原理 —— wait / notify

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-23_00-01-32.png)

- Owner 线程发现条件不满足，会调用 wait 方法，即可进入 WaitSet 变为 WAITING 状态
- BLOCKED 和 WAITING 的线程都处于阻塞状态，不占用 CPU 时间片
- BLOCKED 线程会在 Owner 线程释放锁时唤醒
- WAITING 线程会在 Owner 线程调用 notify 或 notifyAll 时唤醒，但唤醒后并不意味着立刻获得锁，仍需进入 EntryList 重新竞争


#### 相关API

- obj.wait() ：让进入 object 监视器的线程到 waitSet 中等待，此时线程状态变为 WAITING 状态
- obj.wai(long n) ：让进入 object 监视器的线程到 waitSet 中有时限的等待，到 n 毫秒后结束等待，或是被 notify 唤醒
- obj.notify() ：在 object 上正在 waitSet 等待的线程中挑一个唤醒
- obj.notifyAll() ：把 object 上正在 waitSet 等待的线程全部唤醒

它们都是线程之间进行协作的手段，都属于 Object 对象的方法。必须要先获得此对象的锁，才能调用这几个方法


```java
@Slf4j(topic = "c.Test18")
public class Test18 {

    static final Object lock = new Object();

    public static void main(String[] args) {

        // 这段代码会报错，因为都还没有获得 lock 对象的锁
        /*
        try {
            lock.wait();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        */

        synchronized (lock) {  // 先获得对象的锁
            try {
                lock.wait();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }
    }
}
```

```java
@Slf4j(topic = "c.TestWaitNotify")
public class TestWaitNotify {
    final static Object lock = new Object();

    public static void main(String[] args) throws InterruptedException {
        new Thread(() -> {
            synchronized (lock) {
                log.debug("执行...");
                try {
                    lock.wait();  // 让线程在 lock 上一直等待下去
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                log.debug("执行其他代码...");
            }
        }, "t1").start();

        new Thread(() -> {
            synchronized (lock) {
                log.debug("执行...");
                try {
                    lock.wait();  // 让线程在 lock 上一直等待下去
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                log.debug("执行其他代码...");

            }
        }, "t2").start();

        // 主线程 2s 后执行
        TimeUnit.SECONDS.sleep(2);
        log.debug("唤醒 obj 上其他的线程");
        synchronized (lock) {
            lock.notify();  // 随机唤醒 obj 上一个线程
            // lock.notifyAll();  // 唤醒 obj 上所有等待的线程
        }
    }
}

```
主线程执行 notify() 的一种结果情况
```
15:36:01.915 c.TestWaitNotify [t1] - 执行...
15:36:01.923 c.TestWaitNotify [t2] - 执行...
15:36:03.915 c.TestWaitNotify [main] - 唤醒 obj 上其他的线程
15:36:03.915 c.TestWaitNotify [t1] - 执行其他代码...   (随机唤醒了 t1 线程)
```

主线程执行 notifyAll() 的结果
```
19:58:15.457 [Thread-0] c.TestWaitNotify - 执行.... 
19:58:15.460 [Thread-1] c.TestWaitNotify - 执行.... 
19:58:17.456 [main] c.TestWaitNotify - 唤醒 obj 上其它线程
19:58:17.456 [Thread-1] c.TestWaitNotify - 其它代码.... 
19:58:17.456 [Thread-0] c.TestWaitNotify - 其它代码....
```

`wait()`方法会释放对象的锁，进入 WaitSet 等待区，从而让其他线程就机会获取对象的锁。无限制等待，直到`notify()` 为止


`wait(long n) `有时限的等待, 到 n 毫秒后结束等待，或是被 notify

- 调用`wait()`后进入`WAITING`状态
- 调用`wait(timeout)`后，进入`TIMED_WAITING`状态


#### wait/notify 正确使用

##### sleep与wait

sleep(long n) 和 wait(long n) 的区别
1. sleep 是 Thread 方法，而 wait 是 Object 的方法
2. sleep 不需要强制和 synchronized 配合使用，但 wait 需要 和 synchronized 一起用(synchronized之后对象才有monitor)
3. sleep 在睡眠的同时，不会释放对象锁的，但 wait 在等待的时候会释放对象锁


```java
@Slf4j
public class Test10 {
    static final Object lock = new Object();

    public static void main(String[] args) throws InterruptedException {
        new Thread(() -> {
            synchronized (lock) {
                try {
//                    Thread.sleep(20000);      // 不会释放锁
                    lock.wait(20000);   // 会释放锁
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
            }
        }, "t1").start();

        Thread.sleep(1000);
        synchronized (lock) {
            log.info("主线程获得锁了了");
        }
    }
}
```


**Step1**

思考下面的解决方案好不好，为什么？

```
线程：
- 小南：想干活，但需要烟。
- 其它人：不管烟，直接干活。
- 送烟的：3秒后把 hasCigarette 改成 true。
```

```java
static final Object room = new Object();
static boolean hasCigarette = false;
static boolean hasTakeout = false;
```

```java
new Thread(() -> {
    synchronized (room) {
        log.debug("有烟没？[{}]", hasCigarette);
        if (!hasCigarette) {
            log.debug("没烟，先歇会！");
            sleep(2);
        }
        log.debug("有烟没？[{}]", hasCigarette);
        if (hasCigarette) {
            log.debug("可以开始干活了");
        }
    }
}, "小南").start();
for (int i = 0; i < 5; i++) {
    new Thread(() -> {
        synchronized (room) {
            log.debug("可以开始干活了");
        }
    }, "其它人").start();
}
sleep(1);
new Thread(() -> {
    // 这里能不能加 synchronized (room)？
    hasCigarette = true;
    log.debug("烟到了噢！");
}, "送烟的").start();
```

输出

```sh
20:49:49.883 [小南] c.TestCorrectPosture - 有烟没？[false] 
20:49:49.887 [小南] c.TestCorrectPosture - 没烟，先歇会！
20:49:50.882 [送烟的] c.TestCorrectPosture - 烟到了噢！
20:49:51.887 [小南] c.TestCorrectPosture - 有烟没？[true] 
20:49:51.887 [小南] c.TestCorrectPosture - 可以开始干活了
20:49:51.887 [其它人] c.TestCorrectPosture - 可以开始干活了
20:49:51.887 [其它人] c.TestCorrectPosture - 可以开始干活了
20:49:51.888 [其它人] c.TestCorrectPosture - 可以开始干活了
20:49:51.888 [其它人] c.TestCorrectPosture - 可以开始干活了
20:49:51.888 [其它人] c.TestCorrectPosture - 可以开始干活了
```

- 其它干活的线程，都要一直阻塞，效率太低 
- 小南线程必须睡足 2s 后才能醒来，就算烟提前送到，也无法立刻醒来 
- 不能加，因为加了 synchronized (room) 后，就好比小南在里面反锁了门睡觉，烟根本没法送进门，main 没加 synchronized 就好像 main 线程是翻窗户进来的 
- 解决方法，使用 wait - notify 机制



**step2**

思考下面的实现行吗，为什么？

```java
new Thread(() -> {
    synchronized (room) {
        log.info("有烟没？[{}]", hasCigarette);
        if (!hasCigarette) {
            log.info("没烟，先歇会！");
            try {
                room.wait(2000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        log.info("有烟没？[{}]", hasCigarette);
        if (hasCigarette) {
            log.info("可以开始干活了");
        }
    }
}, "小南").start();
for (int i = 0; i < 5; i++) {
    new Thread(() -> {
        synchronized (room) {
            log.info("可以开始干活了");
        }
    }, "其它人").start();
}
sleep(1);
new Thread(() -> {
    synchronized (room) {
        hasCigarette = true;
        log.info("烟到了噢！");
        room.notify();
    }
}, "送烟的").start();
```

改进点：
```
- wait() → 释放锁 + 进入等待队列(waitSet)。
- notify() → 随机唤醒一个等待中的线程，但不会立刻执行，还要竞争锁。
- 小南有两种唤醒方式：超时（2s） 或 送烟的 notify()。
- 其它人不会被小南卡住，因为小南 wait 的时候已经释放锁了。
```

- 解决了其它干活的线程阻塞的问题 
- 但如果有其它线程也在等待条件呢？如果有多个线程，那唤醒的如果不是期望唤醒的线程呢？


**Step3**

错误唤醒也叫虚假唤醒

```
- 小南：等烟
- 小女：等外卖
- 送外卖的：只送外卖，调用一次 notify()
```

共享状态：
```java
static boolean hasCigarette = false;
static boolean hasTakeout = false;
```
```java
new Thread(() -> {
    synchronized (room) {
        log.debug("有烟没？[{}]", hasCigarette);
        if (!hasCigarette) {
            log.debug("没烟，先歇会！");
            try {
                room.wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        log.debug("有烟没？[{}]", hasCigarette);
        if (hasCigarette) {
            log.debug("可以开始干活了");
        } else {
            log.debug("没干成活...");
        }
    }
}, "小南").start();
new Thread(() -> {
    synchronized (room) {
        Thread thread = Thread.currentThread();
        log.debug("外卖送到没？[{}]", hasTakeout);
        if (!hasTakeout) {
            log.debug("没外卖，先歇会！");
            try {
                room.wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        log.debug("外卖送到没？[{}]", hasTakeout);
        if (hasTakeout) {
            log.debug("可以开始干活了");
        } else {
            log.debug("没干成活...");
        }
    }
}, "小女").start();
sleep(1);
new Thread(() -> {
    synchronized (room) {
        hasTakeout = true;
        log.debug("外卖到了噢！");
        room.notify();
    }
}, "送外卖的").start();
```
- `notify() `只能唤醒一个等待线程，而唤醒的是谁不可控。
- notify 不能指定唤醒谁，结果可能「唤错人」，导致逻辑不符合预期。
输出

```sh
20:53:12.173 [小南] c.TestCorrectPosture - 有烟没？[false] 
20:53:12.176 [小南] c.TestCorrectPosture - 没烟，先歇会！
20:53:12.176 [小女] c.TestCorrectPosture - 外卖送到没？[false] 
20:53:12.176 [小女] c.TestCorrectPosture - 没外卖，先歇会！
20:53:13.174 [送外卖的] c.TestCorrectPosture - 外卖到了噢！
20:53:13.174 [小南] c.TestCorrectPosture - 有烟没？[false] 
20:53:13.174 [小南] c.TestCorrectPosture - 没干成活... 
```

- notify 只能随机唤醒一个 WaitSet 中的线程，这时如果有其它线程也在等待，那么就可能唤醒不了正确的线 程，称之为【虚假唤醒】 
- 解决方法，改为 notifyAll


**Step4**

```java
new Thread(() -> {
    synchronized (room) {
        hasTakeout = true;
        log.debug("外卖到了噢！");
        room.notifyAll();
    }
}, "送外卖的").start();
```

输出

```sh
20:55:23.978 [小南] c.TestCorrectPosture - 有烟没？[false] 
20:55:23.982 [小南] c.TestCorrectPosture - 没烟，先歇会！
20:55:23.982 [小女] c.TestCorrectPosture - 外卖送到没？[false] 
20:55:23.982 [小女] c.TestCorrectPosture - 没外卖，先歇会！
20:55:24.979 [送外卖的] c.TestCorrectPosture - 外卖到了噢！
20:55:24.979 [小女] c.TestCorrectPosture - 外卖送到没？[true] 
20:55:24.980 [小女] c.TestCorrectPosture - 可以开始干活了
20:55:24.980 [小南] c.TestCorrectPosture - 有烟没？[false] 
20:55:24.980 [小南] c.TestCorrectPosture - 没干成活... 
```

- 用 `notifyAll()` 仅解决某个线程的唤醒问题，但使用 if + wait 判断仅有一次机会，一旦条件不成立，就没有重新判断的机会了 
- 解决方法，用 while + wait，当条件不成立，再次 wait


**Step5**


将 if 改为 while

```java
if (!hasCigarette) {
    log.debug("没烟，先歇会！");
    try {
        room.wait();
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
}
```

改动后

```java
while (!hasCigarette) {
    log.debug("没烟，先歇会！");
    try {
        room.wait();
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
}

// 其余不变
```

输出

```sh
20:58:34.322 [小南] c.TestCorrectPosture - 有烟没？[false] 
20:58:34.326 [小南] c.TestCorrectPosture - 没烟，先歇会！
20:58:34.326 [小女] c.TestCorrectPosture - 外卖送到没？[false] 
20:58:34.326 [小女] c.TestCorrectPosture - 没外卖，先歇会！
20:58:35.323 [送外卖的] c.TestCorrectPosture - 外卖到了噢！
20:58:35.324 [小女] c.TestCorrectPosture - 外卖送到没？[true] 
20:58:35.324 [小女] c.TestCorrectPosture - 可以开始干活了
20:58:35.324 [小南] c.TestCorrectPosture - 没烟，先歇会！
```

- if + wait 被唤醒后直接往下走， 判断仅有一次机会，一旦条件不成立，就没有重新判断的机会了 
- while + wait 被唤醒后重新判断条件，条件不满足就继续等待，直到满足为止。

wait notify使用公式：
```java
synchronized(lock) {
    while(条件不成立) {
        lock.wait();
    }
    // 干活
}
//另一个线程
synchronized(lock) {
    lock.notifyAll();
}
```

##### 设计模式-保护性暂停

**同步模式之保护性暂停**

即 `Guarded Suspension`，用在一个线程等待另一个线程的执行结果 

- 有一个结果需要从一个线程传递到另一个线程，让他们关联同一个 GuardedObject 
- 如果有结果不断从一个线程到另一个线程那么可以使用消息队列（见生产者/消费者） 
- JDK 中，join 的实现、Future 的实现，采用的就是此模式 
- 因为要等待另一方的结果，因此归类到同步模式


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-25_23-13-16.png)


**保护性暂停实现**

```java
@Slf4j
public class Test11 {
    public static void main(String[] args) {
        // 线程1等待线程2的下载结果
        GuardedObject guardedObject = new GuardedObject();
        new Thread(() -> {
            // 等待结果
            log.info("等待结果");
            Object o = guardedObject.get();
            log.info("结果：{}", JSON.toJSONString(o));
        }, "t1").start();

        new Thread(() -> {
            log.info("执行下载。。");
            try {
                guardedObject.complete(Downloder.download());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }, "t2").start();
    }
}

class GuardedObject {
    /**
     * 结果
     */
    private Object response;

    /**
     * 获取结果
     *
     * @return
     */
    public Object get() {
        synchronized (this) {
            while (response == null) {
                // 没有结果
                try {
                    this.wait();
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
            }
            return response;
        }
    }

    /**
     * 产生结果
     *
     * @param response
     */
    public void complete(Object response) {
        synchronized (this) {
            // 结果给成员变量
            this.response = response;
            this.notifyAll();
        }
    }
}
```

```java
public class Downloder {
    public static List<String> download() throws IOException {
        HttpURLConnection conn = (HttpURLConnection) new URL("https://www.baidu.com/").openConnection();
        List<String> lines = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                lines.add(line);
            }
        }
        return lines;
    }
}
```
```
23:33:57.971 [t1] INFO com.thread.concurrent1.Test11 -- 等待结果
23:33:57.971 [t2] INFO com.thread.concurrent1.Test11 -- 执行下载。。
23:33:59.085 [t1] INFO com.thread.concurrent1.Test11 -- 结果：["<!DOCTYPE html>","<!--STATUS OK--><html> <head><meta http-equiv=content-type content=text/html;charset=utf-8><meta http-equiv=X-UA-Compatible content=IE=Edge><meta content=always name=referrer><link rel=stylesheet
```

**总结**

如果用join的话，他必须等待线程结束，而用保护性暂停模式，线程2，执行完下载后，可以继续干其他事情

join的话，等待结果的变量必须设置为全局的，不能像现在这样都写为局部的，比如：`Object o = guardedObject.get();`


**保护性暂停-扩展-增加超时**

想象一个场景：
- 线程 t1 需要一个计算结果（比如从网上下载的文件内容）。
- 线程 t2 负责去执行这个耗时的计算（下载文件）。

t1 不能一直空转浪费 CPU 等待 t2，它需要一种高效的机制：如果结果没准备好，t1 就应该“休息”（阻塞）；当 t2 准备好结果后，它需要有办法“叫醒”正在休息的 t1。

GuardedObject 就是这个高效的协调机制，它像一个“带锁的信箱”：
- t1 (消费者)：去看信箱 (get)。如果信是空的 (response == null)，它就锁上信箱，坐在旁边睡觉 (wait)。
- t2 (生产者)：拿到信后 (download())，打开信箱 (synchronized)，把信放进去 (complete)，然后大喊一声“信来了！” (notifyAll)，叫醒正在睡觉的 t1。






```java
@Slf4j
public class Test11 {
    public static void main(String[] args) {
        // 线程1等待线程2的下载结果
        GuardedObject guardedObject = new GuardedObject();
        new Thread(() -> {
            // 等待结果
            log.info("等待结果");
            Object o = guardedObject.get(3000);
            log.info("结果：{}", JSON.toJSONString(o));
        }, "t1").start();

        new Thread(() -> {
            log.info("执行下载。。");
            try {
                guardedObject.complete(Downloder.download());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }, "t2").start();
    }
}

class GuardedObject {
    /**
     * 结果
     */
    private Object response;

    /**
     * 获取结果
     *
     * @return
     */
    public Object get(long timeout) {
        synchronized (this) {
            // 开始时间
            long begin = System.currentTimeMillis();
            // 经历时间
            long passedTime = 0;
            while (response == null) {
                // 这一轮循环应该等待时间
                long waitTime = timeout - passedTime;
                // 经历的时间超过了最大等待时间，退出循环
                if (waitTime <= 0) {
                    break;
                }
                try {
                    this.wait(waitTime);
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
                // 求得经历时间
                passedTime = System.currentTimeMillis() - begin;
            }
            return response;
        }
    }

    /**
     * 产生结果
     *
     * @param response
     */
    public void complete(Object response) {
        synchronized (this) {
            // 结果给成员变量
            this.response = response;
            this.notifyAll();
        }
    }
}
```

**while (response == null):**
- 至关重要：为什么用 while 而不是 if？这是为了防止 “虚假唤醒”（Spurious Wakeup）。
- **虚假唤醒**：线程有时可能在没有被 notify() 的情况下从 wait() 状态中醒来。如果用 if，线程醒来后就不会再次检查 response == null 这个条件，可能会直接往下执行，拿到一个 null 的结果，这是错误的。
- while 循环确保了线程每次被唤醒后，都会重新检查条件 (response == null)。只有当条件确实不满足时（即 response 已经有值了），才会跳出循环。


**超时判断 (waitTime <= 0)**:
- passedTime 记录了已经等待了多久。
- waitTime 是本轮循环还需要等待多久。
- 如果 waitTime 小于等于 0，说明总的等待时间已经超过了 timeout，就没必要再等了，直接 break 循环。此时 response 仍然是 null，方法最终会返回 null，表示超时。


**总结：整个程序的执行流程**
- main 线程启动 t1 和 t2。
- t1 先运行，进入 get 方法，获取 guardedObject 的锁。
- t1 发现 response 是 null，进入 while 循环。
- t1 计算出 waitTime (约3000ms)，然后调用 guardedObject.wait(3000)。它释放了锁，并进入休眠状态。
- t2 开始运行，执行 Downloder.download()。
- download() 执行完毕后，t2 进入 complete 方法，它成功获取了 guardedObject 的锁（因为 t1 已经释放了）。
- t2 将下载结果赋给 response，然后调用 guardedObject.notifyAll()。
- notifyAll() 发出信号，唤醒正在 guardedObject 上等待的 t1。
- t2 执行完 synchronized 代码块，释放锁。
- t1 被唤醒后，重新获取 guardedObject 的锁。
- t1 从 wait() 方法返回，继续 while 循环。它再次检查 response == null，发现条件不成立（因为 response 已经有值了），跳出循环。
- t1 执行 return response，释放锁，并打印出最终得到的结果。


:::tip
**虚假唤醒**

虚假唤醒指的是：线程在调用 wait() 后，没有人调用 notify / notifyAll，也没有超时/中断，但是线程却“自己醒了”。

正确做法：必须用 while 检查条件，而不是 if。这样即使虚假唤醒了，线程也会再检查一次条件，发现条件没满足会继续 wait。

---

举个生活例子 🚗

1. 你在车站等公交（wait()）。
2. 司机来喊你上车（notify()）。
3. 突然你自己睡醒了，以为公交到了，结果一看——啥也没有（虚假唤醒）。
4. 所以你不能光凭“醒了”就走，而要 再看一下公交是不是来了（条件检查）。

:::

---
[04.052](https://www.bilibili.com/video/BV16J411h7Rd?t=24.1&p=101)

join()原理 暂时略。。。

---


#### (异步)模式之生产者/消费者


**定义**








