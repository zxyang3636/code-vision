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





















