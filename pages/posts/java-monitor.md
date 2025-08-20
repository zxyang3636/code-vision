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

