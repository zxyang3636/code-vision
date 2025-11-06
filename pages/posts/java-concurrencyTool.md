---
title: Java 并发工具
categories: Java
hidden: true
tags:
  - 后端
  - Java
  - 并发编程
---

## 自定义线程池

### 阻塞队列

```java
@Slf4j(topic = "TestPool")
public class TestPool {
}

class BlockingQueue<T> {
    // 1.任务队列
    private Deque<T> queue = new ArrayDeque<>();

    // 2.锁
    private ReentrantLock lock = new ReentrantLock();

    // 3.生产者条件变量
    private Condition fullWaitSet = lock.newCondition();

    // 4.消费者条件变量
    private Condition emptyWaitSet = lock.newCondition();

    // 5.容量
    private int capacty;

    // 阻塞获取
    public T take() {
        lock.lock();
        try {
            while (queue.isEmpty()) {   // 队列空了
                try {
                    emptyWaitSet.await();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            T t = queue.removeFirst();
            fullWaitSet.signal();   // 唤醒等待空位的线程
            return t;
        } finally {
            lock.unlock();
        }
    }

    // 阻塞添加
    public void put(T element) {
        lock.lock();
        try {
            while (queue.size() == capacty) { // 容量满了
                try {
                    fullWaitSet.await();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            queue.addLast(element);
            emptyWaitSet.signal();  // 添加完之后需要唤醒，唤醒之后它就知道队列不空了
        } finally {
            lock.unlock();
        }
    }

    // 获取大小
    public int size() {
        lock.lock();
        try {
            return queue.size();
        } finally {
            lock.unlock();
        }
    }

}
```

这段代码通过使用 `ReentrantLock` 和 `Condition` 实现了一个自定义的阻塞队列

通过 `ReentrantLock` 实现了互斥访问，通过两个独立的 `Condition` 对象实现了生产者和消费者之间的精准等待与通知


**poll增强**

`awaitNanos(nanos)`
- 让当前线程等待一段时间（最多 nanosTimeout 纳秒），直到被唤醒或者超时。

1. 当前线程加入 Condition 的等待队列（比如 emptyWaitSet）。
2. 释放关联的锁（否则别人进不来修改队列）。
3. 等待：
    - 被 signal() / signalAll() 唤醒，或者
    - 超时了，或者
    - 被中断。

**为什么返回的是剩余时间？**

线程可能并没有等满 nanos 时间就被唤醒。JDK 设计成**返回还剩多少时间没等完**。

举个例子：
- 一开始你要等10秒。
- 等了3秒就被signal()唤醒。
- awaitNanos会返回7秒。
- 下次循环还能继续用这7秒去等。

这样做的好处是：
- 如果是假唤醒（队列还是空的），线程还能继续用剩余的时间再等一会儿。
- 不会因为一次假唤醒就白白浪费掉整个超时时间。

```java
@Slf4j(topic = "TestPool")
public class TestPool {
}

class BlockingQueue<T> {
    // 1.任务队列
    private Deque<T> queue = new ArrayDeque<>();

    // 2.锁
    private ReentrantLock lock = new ReentrantLock();

    // 3.生产者条件变量
    private Condition fullWaitSet = lock.newCondition();

    // 4.消费者条件变量
    private Condition emptyWaitSet = lock.newCondition();

    // 5.容量
    private int capacty;

    // 带超时的阻塞获取
    public T poll(long timeout, TimeUnit unit) {
        lock.lock();
        try {
            // 将timeout统一转为纳秒
            long nanos = unit.toNanos(timeout);
            while (queue.isEmpty()) {   // 队列空了
                try {
                    // 返回的是剩余的时间
                    if (nanos <= 0) { // 超时了，无需等待 直接返回
                        return null;
                    }
                    nanos = emptyWaitSet.awaitNanos(nanos);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            T t = queue.removeFirst();  // 走到这里，说明队列里有元素了
            fullWaitSet.signal();   // 唤醒等待空位的线程
            return t;
        } finally {
            lock.unlock();
        }
    }

    // 阻塞获取
    public T take() {
        lock.lock();
        try {
            while (queue.isEmpty()) {   // 队列空了
                try {
                    emptyWaitSet.await();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            T t = queue.removeFirst();
            fullWaitSet.signal();   // 唤醒等待空位的线程
            return t;
        } finally {
            lock.unlock();
        }
    }

    // 阻塞添加
    public void put(T element) {
        lock.lock();
        try {
            while (queue.size() == capacty) { // 容量满了
                try {
                    fullWaitSet.await();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            queue.addLast(element);
            emptyWaitSet.signal();  // 添加完之后需要唤醒，唤醒之后它就知道队列不空了
        } finally {
            lock.unlock();
        }
    }

    // 获取大小
    public int size() {
        lock.lock();
        try {
            return queue.size();
        } finally {
            lock.unlock();
        }
    }

}
```







