---
title: MySQL - 锁
# date: 2025-07-10
# updated: 2025-07-10
categories: 数据库
tags:
  - MySQL
  - 后端
  - 数据库
  - Java
  - 锁
---

# MySQL - 锁

## 概述

事务的`隔离性`由这章讲述的`锁`来实现。

`锁`是计算机协调多个进程或线程`并发访问某一共享资源`的机制。在程序开发中会存在多线程同步的问题，当多个线程并发访问某个数据的时候，尤其是针对一些敏感的数据（比如订单、金额等），我们就需要保证这个数据在任何时刻`最多只有一个线程`在访问，保证数据的`完整性`和`一致性`。在开发过程中加锁是为了保证数据的一致性，这个思想在数据库领域中同样很重要。

在数据库中，除传统的计算资源（如CPU、RAM、I/O等）的争用以外，数据也是一种供许多用户共享的 资源。为保证数据的一致性，需要对 `并发操作进行控制` ，因此产生了 `锁` 。同时 `锁机制` 也为实现MySQL 的各个隔离级别提供了保证。 `锁冲突` 也是影响数据库 `并发访问性能` 的一个重要因素。所以锁对数据库而言显得尤其重要，也更加复杂。


## MySQL并发事务访问相同记录

并发事务访问相同记录的情况大致可以划分为3种：

### 读-读情况
`读-读`情况，即并发事务相继读`取相同的记录`。读取操作本身不会对记录有任何影响，并不会引起什么问题，所以允许这种情况的发生。

### 写-写情况
`写-写` 情况，即并发事务相继对相同的记录做出改动。

在这种情况下会发生 `脏写` 的问题，任何一种隔离级别都不允许这种问题的发生。所以在多个未提交事务相继对一条记录做改动时，需要让它们 排队执行 ，这个排队的过程其实是通过 锁 来实现的。这个所谓的锁其实是一个内存中的结构 ，在事务执行前本来是没有锁的，也就是说一开始是没有 锁结构 和记录进 行关联的，如图所示：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-07-23_21-45-41.png)
当一个事务想对这条记录做改动时，首先会看看内存中有没有与这条记录关联的 `锁结构` ，当没有的时候 就会在内存中生成一个 `锁结构` 与之关联。比如，事务 `T1` 要对这条记录做改动，就需要生成一个 `锁结构` 与之关联：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-07-23_21-47-10.png)

在`锁结构`里有很多信息，为了简化理解，只把两个比较重要的属性拿了出来：
- `trx信息`：代表这个锁结构是哪个事务生成的。
- `is_waiting`：代表当前事务是否在等待。

在事务`T1`改动了这条记录后，就生成了一个`锁结构`与该记录关联，因为之前没有别的事务为这条记录加锁，所以`is_waiting`属性就是`false`，我们把这个场景就称值为**获取锁成功**，或者**加锁成功**，然后就可以继续执行操作了。

在事务`T1`提交之前，另一个事务`T2`也想对该记录做改动，那么先看看有没有`锁结构`与这条记录关联，发现有一个`锁结构`与之关联后，然后也生成了一个锁结构与这条记录关联，不过锁结构的`is_waiting`属性值为`true`，表示当前事务需要等待，我们把这个场景就称之为**获取锁失败**，或者加锁失败，图示：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-07-23_21-50-33.png)
在事务`T1`提交之后，就会把该事务生成的`锁结构释放掉`，然后看看还有没有别的事务在等待获取锁，发现了事务T2还在等待获取锁，所以把事务T2对应的锁结构的`is_waiting`属性设置为`false`，然后把该事务对应的线程唤醒，让它继续执行，此时事务T2就算获取到锁了。效果就是这样。
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-07-23_21-51-44.png)



:::info
**脏写**

关于脏写的问题，比如说，这里有一条记录，我们用事务A对它进行写入，同时事务B也对它进行写入。假设这条记录的初始值是1，A和B在读取时看到的都是1。接下来，A把这个值改成了2，而B又把它改成了3。然后，A执行了commit操作，提交了修改，这时A认为2这个值已经被固定下来了。但B随后执行了rollback操作，把3回滚回去，结果这条记录又变成了1。这样一来，A再去查，发现结果又变成了1。这就是我们说的“脏写”问题。你会发现，当一个事务还没完成修改时，另一个事务又参与进来，就会导致数据混乱。那该怎么办呢？要解决这个问题，必须让两个事务排队执行，一个一个来。比如A改完了，提交或回滚后，B再进来操作。通过排队执行，才能解决这个安全性问题。
:::

小结几种说法：

- 不加锁

    意思就是不需要在内存中生成对应的 `锁结构` ，可以直接执行操作。

- 获取锁成功，或者加锁成功

    意思就是在内存中生成了对应的 `锁结构` ，而且锁结构的 `is_waiting` 属性为 `false` ，也就是事务 可以继续执行操作。

- 获取锁失败，或者加锁失败，或者没有获取到锁

    意思就是在内存中生成了对应的 `锁结构` ，不过锁结构的 `is_waiting` 属性为 `true` ，也就是事务 需要等待，不可以继续执行操作。


### 读-写或写-读情况
`读-写` 或 `写-读` ，即一个事务进行读取操作，另一个进行改动操作。这种情况下可能发生 `脏读` 、 `不可重复读` 、 `幻读` 的问题。

各个数据库厂商对 `SQL标准` 的支持都可能不一样。比如MySQL在 `REPEATABLE READ` 隔离级别上就已经解决了 `幻读` 问题。

### 并发问题的解决方案

怎么解决 `脏读` 、 `不可重复读` 、 `幻读` 这些问题呢？其实有两种可选的解决方案：

- 方案一：读操作利用多版本并发控制（ `MVCC` ，下章讲解），写操作进行 `加锁` 。

所谓的 `MVCC`，就是生成一个 `ReadView`，通过 ReadView 找到符合条件的记录版本（历史版本由 `undo日志` 构建）。查询语句只能`读`到在生成 `ReadView` 之前`已提交事务所做的更改`，在生成 ReadView 之前未提交的事务或者之后才开启的事务所做的更改是看不到的。而`写操作`肯定针对的是`最新版本的记录`，读记录的历史版本和改动记录的最新版本本身并不冲突，也就是采用 MVCC 时，`读 - 写`操作并不冲突。

>普通的`SELECT`语句在`READ COMMITTED`和`REPEATABLE READ`隔离级别下会使用到`MVCC`读取记录。
>
>- 在 `READ COMMITTED` 隔离级别下，一个事务在执行过程中每次执行`SELECT`操作时都会生成一 个`ReadView`，ReadView的存在本身就保证了`事务不可以读取到未提交的事务所做的更改` ，也就是避免了脏读现象；
>- 在 `REPEATABLE READ` 隔离级别下，一个事务在执行过程中只有 `第一次执行SELECT操作` 才会生成一个ReadView，之后的SELECT操作都 `复用` 这个ReadView，这样也就避免了不可重复读和幻读的问题。


- 方案二：读、写操作都采用 加锁 的方式。

如果我们的一些业务场景不允许读取记录的旧版本，而是每次都必须去`读取记录的最新版本`。比如，在银行存款的事务中，你需要先把账户的余额读出来，然后将其加上本次存款的数额，最后再写到数据库中。在将账户余额读取出来后，就不想让别的事务再访问该余额，直到本次存款事务执行完成，其他事务才可以访问账户的余额。这样在读取记录的时候就需要对其进行`加锁`操作，这样也就意味着`读`操作和`写`操作也像`写 - 写`操作那样`排队`执行。

`脏读`的产生是因为当前事务读取了另一个未提交事务写的一条记录，如果另一个事务在写记录的时候就给这条记录加锁，那么当前事务就无法继续读取该记录了，所以也就不会有脏读问题的产生了。

`不可重复读`的产生是因为当前事务先读取一条记录，另外一个事务对该记录做了改动之后并提交之后，当前事务再次读取时会获得不同的值，如果在当前事务读取记录时就给该记录加锁，那么另一个事务就无法修改该记录，自然也不会发生不可重复读了。

`幻读`问题的产生是因为当前事务读取了一个范围的记录，然后另外的事务向该范围内插入了新记录，当前事务再次读取该范围的记录时发现了新插入的新记录。采用加锁的方式解决幻读问题就有一些麻烦，因为当前事务在第一次读取记录时幻影记录并不存在，所以读取的时候加锁就有点尴尬（因为你并不知道给谁加锁）。


- 小结对比发现：
    - 采用 `MVCC` 方式的话， 读-写 操作彼此并不冲突， 性能更高 。
    - 采用 `加锁` 方式的话， 读-写 操作彼此需要 `排队执行` ，影响性能。

一般情况下我们当然愿意采用 `MVCC` 来解决 `读-写` 操作并发执行的问题，但是业务在某些特殊情况下，要求必须采用 `加锁` 的方式执行。下面就讲解下MySQL中不同类别的锁。


## 锁的不同角度分类

锁的分类图，如下：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-07-23_22-49-12.png)
在表级锁这个层面，比如说我们的 `MyISAM` 引擎，它只支持表级锁，而像 `InnoDB` 引擎，它既可以支持表级锁，也可以支持行级锁。使用行级锁时，锁的粒度更小，并发性也会更好一些。因此，InnoDB 通常我们都会用行级锁。接下来，我们可以根据对锁的态度，将其分为悲观锁和乐观锁。所谓悲观和乐观，就像面对半瓶水一样，悲观的人会说“只剩半瓶水了”，而乐观的人会说“还剩半瓶水”。我们对待锁的态度也是如此：有的人担心数据会被修改，这就是悲观锁；而乐观锁则认为数据不会轻易被修改。后面我们还会具体提到这些情况。此外，还有加锁的方式，可以分为显式加锁和隐式加锁。其他相关内容还包括全局锁和死锁的问题。

### 从数据操作的类型划分：读锁、写锁

对于数据库中并发事务的`读-读`情况并不会引起什么问题。对于`写-写`、`读-写`或`写-读`这些情况可能会引起一些问题，需要使用 `MVCC` 或者`加锁`的方式来解决它们。在使用加锁的方式解决问题时，由于既要允许`读-读`情况不受影响，又要使`写-写`、`读-写`或`写-读`情况中的操作相互阻塞，所以MySQL实现一个由两种类型的锁组成的锁系统来解决。这两种类型的锁通常被称为**共享锁（Shared Lock，S Lock）**和**排他锁（Exclusive Lock，X Lock）**，也叫**读锁（readlock）**和**写锁（write lock）**。

- `读锁` ：也称为 `共享锁` 、英文用 S 表示。针对同一份数据，多个事务的读操作可以同时进行而不会互相影响，相互不阻塞的。
- `写锁` ：也称为 `排他锁` 、英文用 X 表示。当前写操作没有完成前，它会阻断其他写锁和读锁。这样 就能确保在给定的时间里，只有一个事务能执行写入，并防止其他用户读取正在写入的同一资源。


需要注意的是对于 InnoDB 引擎来说，读锁和写锁可以加在表上，也可以加在行上。


**举例 (行级读写锁)**：如果一个事务 T1 已经获得了某个行 r 的读锁，那么此时另外的一个事务 T2 是可以去获得这个行 r 的读锁的，因为读取操作并没有改变行 r 的数据；但是，如果某个事务 T3 想获得行 r 的写锁，则它必须等待事务 T1、T2 释放掉行 r 上的读锁才行。

总结：这里的兼容是指对同一张表或记录的锁的兼容性情况。


|          |     X锁      |      S锁|
|-----------|----------|---------|
|           X锁|  不兼容     |   不兼容    |
|           S锁|    不兼容   |     **兼容**  |


#### **1. 锁定读**

在采用 `加锁` 方式解决 `脏读` 、 `不可重复读` 、 `幻读` 这些问题时，读取一条记录时需要获取该记录的 `S锁` ，其实是不严谨的，有时候需要在读取记录时就获取记录的 `X锁` ，来禁止别的事务读写该记录，为此MySQL提出了两种比较特殊的 `SELECT` 语句格式：
- 对读取的记录加 `S锁`：
```sql
SELECT... LOCK IN SHARE MODE;
#或
SELECT ... FOR SHARE; #(8.0新增语法)
```
在普通的SELECT语句后边加`LOCK IN SHARE MODE`，如果当前事务执行了该语句，那么它会为读取到的记录加`S锁`，这样允许别的事务继续获取这些记录的S锁（比方说别的事务也使用`SELECT...LOCK IN SHARE MODE`语句来读取这些记录），但是不能获取这些记录的`X锁`（比如使用`SELECT...FOR UPDATE`语句来读取这些记录，或者直接修改这些记录）。如果别的事务想要获取这些记录的`X锁`，那么它们会阻塞，直到当前事务提交之后将这些记录上的`S锁`释放掉。

- 对读取的记录加 `X 锁`：
```sql
SELECT... FOR UPDATE;
```
在普通的 `SELECT` 语句后边加 `FOR UPDATE`，如果当前事务执行了该语句，那么它会为读取到的记录加 `X锁`，这样既不允许别的事务获取这些记录的 `S锁`（比方说别的事务使用 `SELECT... LOCK IN SHARE MODE` 语句来读取这些记录），也不允许获取这些记录的 `X锁`（比如使用 `SELECT... FOR UPDATE` 语句来读取这些记录，或者直接修改这些记录）。如果别的事务想要获取这些记录的 `S锁`或者 `X锁`，那么它们会阻塞，直到当前事务提交之后将这些记录上的 `X锁`释放掉。


**MySQL8.0新特性:**

在5.7及之前的版本，SELECT ... FOR UPDATE，如果获取不到锁，会一直等待，直到`innodb_lock_wait_timeout`超时。在8.0版本中，`SELECT ... FOR UPDATE`，`SELECT ... FOR SHARE`添加`NOWAIT`、`SKIP LOCKED`语法，跳过锁等待，或者跳过锁定。

- 通过添加`NOWAIT`、`SKIP LOCKED`语法，能够立即返回。如果查询的行已经加锁：
  - 那么`NOWAIT`会立即报错返回
  - 而`SKIP LOCKED`也会立即返回，只是返回的结果中不包含被锁定的行。

```sql
# session1:
mysql> begin;
mysql> select * from t1 where c1 = 2 for update;
+------+-------+
| c1   | c2    |
+------+-------+
| 2    | 60530 |
| 2    | 24678 |
+------+-------+
2 rows in set (0.00 sec)

# session2:
mysql> select * from t1 where c1 = 2 for update nowait;
ERROR 3572 (HY000): Statement aborted because lock(s) could not be acquired immediately and
NOWAIT is set.
mysql> select * from t1 where c1 = 2 for update skip locked;
Empty set (0.00 sec)
```


#### **2. 写操作**

平常所用到的`写操作`无非是 `DELETE`、`UPDATE`、`INSERT` 这三种:
- `DELETE`:
对一条记录做 DELETE 操作的过程其实是先在 `B+树`中定位到这条记录的位置，然后获取这条记录的 `X 锁`，再执行 `delete mark` 操作。我们也可以把这个定位待删除记录在 B+ 树中位置的过程看成是一个获取 `X 锁`的`锁定读`。
- `UPDATE`:在对一条记录做 UPDATE 操作时分为三种情况:
  - 情况1: 未修改该记录的键值，并且被更新的列占用的存储空间在修改前后未发生变化。

    则先在 `B+ 树`中定位到这条记录的位置，然后再获取一下记录的 `X 锁`，最后在原记录的位置进行修改操作。我们也可以把这个定位待修改记录在 `B+ 树`中位置的过程看成是一个获取 `X 锁`的`锁定读`。
  - 情况2: 未修改该记录的键值，并且至少有一个被更新的列占用的存储空间在修改前后发生变化。

    则先在 `B+ 树`中定位到这条记录的位置，然后获取一下记录的 `X 锁`，将该记录彻底删除掉(就是把记录彻底移入垃圾链表)，最后再插入一条新记录。这个定位待修改记录在 `B+ 树`中位置的过程看成是一个获取 `X锁`的`锁定读`，新插入的记录由 `INSERT` 操作提供的`隐式锁`进行保护。
  - 情况3: 修改了该记录的主键值，则相当于在原记录上做 DELETE 操作之后再来一次 INSERT 操作，加锁操作就需要按照 `DELETE` 和 `INSERT` 的规则进行了。
- `INSERT`:
一般情况下，新插入一条记录的操作并不加锁，通过一种称之为`隐式锁`的结构来保护这条新插入的记录在本事务提交前不被别的事务访问。





### 从数据操作的粒度划分：表级锁、页级锁、行锁

为了尽可能提高数据库的并发度，每次锁定的数据范围越小越好，理论上每次只锁定当前操作的数据的方案会得到最大的并发度，但是管理锁是很`耗资源`的事情（涉及获取、检查、释放锁等动作）。因此数据库系统需要在`高并发响应`和`系统性能`两方面进行平衡，这样就产生了“`锁粒度（Lock granularity）`”的概念。

对一条记录加锁影响的也只是这条记录而已，我们就说这个锁的粒度比较细；其实一个事务也可以在表级别进行加锁，自然就被称之为`表级锁`或者`表锁`，对一个表加锁影响整个表中的记录，我们就说这个锁的粒度比较粗。锁的粒度主要分为`表级锁`、`页级锁`和`行锁`。


#### 1. 表锁（Table Lock）
该锁会锁定整张表，它是 MySQL 中最基本的锁策略，并**不依赖于存储引擎**（不管你是 MySQL 的什么存储引擎，对于表锁的策略都是一样的），并且表锁是**开销最小**的策略（因为粒度比较大）。由于表级锁一次会将整个表锁定，所以可以很好的**避免死锁**问题。当然，锁的粒度大所带来最大的负面影响就是出现锁资源争用的概率也会最高，导致**并发率大打折扣**。

读锁两个事务可读，不可写

写锁只有一个事务可读可写，其他不行

##### 2. 表级别的S锁、X锁

在对某个表执行SELECT、INSERT、DELETE、UPDATE语句时，InnoDB存储引擎是不会为这个表添加表级别的 `S锁` 或者 `X锁` 的。在对某个表执行一些诸如 `ALTER TABLE` 、 `DROP TABLE` 这类的 `DDL` 语句时，其他事务对这个表并发执行诸如SELECT、INSERT、DELETE、UPDATE的语句会发生阻塞。同理，某个事务中对某个表执行SELECT、INSERT、DELETE、UPDATE语句时，在其他会话中对这个表执行 `DDL` 语句也会发生阻塞。这个过程其实是通过在 server层使用一种称之为 `元数据锁` （英文名： `Metadata Locks` ， 简称 MDL ）结构来实现的。

一般情况下，不会使用InnoDB存储引擎提供的表级别的 `S锁` 和 `X锁` 。只会在一些特殊情况下，比方说 `崩溃恢复` 过程中用到。比如，在系统变量 `autocommit=0`，`innodb_table_locks = 1` 时， 手动 获取 InnoDB存储引擎提供的表t 的 `S锁` 或者 `X锁` 可以这么写：
- `LOCK TABLES t READ` ：InnoDB存储引擎会对`表 t` 加表级别的 `S锁` 。
- `LOCK TABLES t WRITE` ：InnoDB存储引擎会对`表 t` 加表级别的 `X锁` 。

>`autocommit = 0`(autocommit=1 是默认值)，设置当前会话的自动提交行为为 关闭。
>
>`innodb_table_locks = 1`(默认值是：1)，允许 InnoDB 对表执行 表级锁（table-level locks）。InnoDB 在执行 LOCK TABLES 时会配合加上 InnoDB 的内部表锁（也称意向锁）。






不过尽量避免在使用InnoDB存储引擎的表上使用 `LOCK TABLES` 这样的手动锁表语句，它们并不会提供 什么额外的保护，只是会降低并发能力而已。InnoDB的厉害之处还是实现了更细粒度的 `行锁` ，关于 InnoDB表级别的 `S锁` 和 `X锁` 大家了解一下就可以了。

**举例：** 下面我们讲解MyISAM引擎下的表锁。

步骤1：创建表并添加数据
```sql
CREATE TABLE mylock(
id INT NOT NULL PRIMARY KEY auto_increment,
NAME VARCHAR(20)
)ENGINE myisam;

# 插入一条数据
INSERT INTO mylock(NAME) VALUES('a');

# 查询表中所有数据
SELECT * FROM mylock;
+----+------+
| id | Name |
+----+------+
| 1  | a    |
+----+------+
```

步骤二：查看表上加过的锁
```sql
SHOW OPEN TABLES; # 主要关注In_use字段的值
或者
SHOW OPEN TABLES where In_use > 0;
```
```sql
mysql> show open tables;
+----------+-----------------------------------+---------+-----------+
| Database | Table                             | In_use  | Name_locked |
+----------+-----------------------------------+---------+-----------+
| atguigudb3 | mylock                            |       0 |         0 |
| sys      | x$waits_by_user_by_latency        |       0 |         0 |
| sys      | x$user_summary_by_stages          |       0 |         0 |
| sys      | x$statements_with_sorting         |       0 |         0 |
| sys      | x$statements_with_runtimes_in_95th_percentile |       0 |         0 |
| sys      | x$statements_with_full_table_scans|       0 |         0 |
| sys      | x$session                         |       0 |         0 |
| sys      | x$schema_table_statistics_with_buffer |       0 |         0 |
| sys      | x$schema_table_lock_waits         |       0 |         0 |
| sys      | x$schema_index_statistics         |       0 |         0 |
| sys      | x$processlist                     |       0 |         0 |
| sys      | x$memory_global_total             |       0 |         0 |
| sys      | x$io_global_by_wait_by_bytes      |       0 |         0 |
| sys      | x$io_by_thread_by_latency         |       0 |         0 |
| sys      | x$statement_analysis              |       0 |         0 |
| sys      | x$host_summary_by_stages          |       0 |         0 |
| sys      | x$host_summary_by_file_io_type    |       0 |         0 |
| sys      | x$host_summary                    |       0 |         0 |
| sys      | waits_by_host_by_latency          |       0 |         0 |
+----------+-----------------------------------+---------+-----------+
```
上面的结果表明，当前数据库中没有被锁定的表

步骤3：手动增加表锁命令
```sql
LOCK TABLES t READ; # 存储引擎会对表t加表级别的共享锁。共享锁也叫读锁或S锁（Share的缩写）
LOCK TABLES t WRITE; # 存储引擎会对表t加表级别的排他锁。排他锁也叫独占锁、写锁或X锁（exclusive的缩写）
```
比如：
```sql
mysql> lock tables mylock read;
Query OK, 0 rows affected (0.00 sec)

mysql> show open tables where in_use > 0;
+----------+--------+--------+-------------+
| Database | Table  | In_use | Name_locked |
+----------+--------+--------+-------------+
| atguigudb3 | mylock |      1 |           0 |
+----------+--------+--------+-------------+
1 row in set (0.00 sec)
```

步骤4：释放表锁
```sql
UNLOCK TABLES; # 使用此命令解锁当前加锁的表
```
比如：
```sql
mysql> unlock tables;
Query OK, 0 rows affected (0.00 sec)

mysql> show open tables where in_use > 0;
Empty set (0.00 sec)
```
步骤5：加读锁

我们为mylock表加read锁（读阻塞写），观察阻塞的情况，流程如下：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-07-24_22-22-39.png)


步骤6：加写锁

为mylock表加write锁，观察阻塞的情况，流程如下：

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-07-24_22-25-02.png)
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-07-24_22-25-28.png)

**总结：**

MyISAM在执行查询语句（SELECT）前，会给涉及的所有表加`读锁`，在执行增删改操作前，会给涉及的表加`写锁`。InnoDB存储引擎是不会为这个表添加表级别的`读锁`和写`锁的`。

MySQL的表级锁有两种模式：（以MyISAM表进行操作的演示）

- 表共享读锁（Table Read Lock）
- 表独占写锁（Table Write Lock）


|锁类型|自己可读|自己可写|自己可操作其他表|他人可读|他人可写|
|----|----|----|----|----|----|
|读锁|是|否|否|是|否，等|
|写锁|是|是|否|否，等|否，等|



##### 3. 意向锁（intention lock）
`InnoDB` 支持 `多粒度锁（multiple granularity locking）` ，它允许 `行级锁` 与 `表级锁` 共存，而`意向锁`就是其中的一种 `表锁` 。

1. `意向锁`的存在是为了协调`行锁`和`表锁`的关系，支持多粒度（表锁和行锁）的锁并存。
2. `意向锁`是一种`不与行级锁冲突的表级锁`，这一点非常重要。
3. 表明“某个事务正在某些行持有了锁或该事务准备去持有锁”

意向锁分为两种：
- **意向共享锁（intention shared lock, IS）**：事务有意向对表中的某些行加共享锁（S锁）
```sql
  -- 事务要获取某些行的 S 锁，必须先获得表的 IS 锁。
  SELECT column FROM table ... LOCK IN SHARE MODE;
  ```
- **意向排他锁（intention exclusive lock, IX）**：事务有意向对表中的某些行加排他锁（X锁）
```sql
  -- 事务要获取某些行的 X 锁，必须先获得表的 IX 锁。
  SELECT column FROM table ... FOR UPDATE;
  ```

即：意向锁是由存储引擎 `自己维护的` ，用户无法手动操作意向锁，在为数据行加共享 / 排他锁之前， `InooDB` 会先获取该数据行 `所在数据表的对应意向锁` 。

---

**意向锁要解决的问题**

现在有两个事务，分别是T1和T2，其中T2试图在该表级别上应用共享或排它锁，如果没有意向锁存在，那么T2就需要去检查各个页或行是否存在锁；如果存在意向锁，那么此时就会受到由T1控制的`表级别意向锁的阻塞`。T2在锁定该表前不必检查各个页或行锁，而只需检查表上的意向锁。简单来说就是给更大一级别的空间示意里面是否已经上过锁。

在数据表的场景中，**如果我们给某一行数据加上了排它锁，数据库会自动给更大一级的空间，比如数据页或数据表加上意向锁，告诉其他人这个数据页或数据表已经有人上过排它锁了**，这样当其他人想要获取数据表排它锁的时候，只需要了解是否有人已经获取了这个数据表的意向排他锁即可。
- 如果事务想要获得数据表中某些记录的共享锁，就需要在数据表上添加意向共享锁。
- 如果事务想要获得数据表中某些记录的排他锁，就需要在数据表上添加意向排他锁。

**举例：** 创建表teacher,插入6条数据，事务的隔离级别默认为`Repeatable-Read`，如下所示。
```sql
CREATE TABLE `teacher` (
	`id` int NOT NULL,
    `name` varchar(255) NOT NULL,
    PRIMARY KEY (`id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `teacher` VALUES
('1', 'zhangsan'),
('2', 'lisi'),
('3', 'wangwu'),
('4', 'zhaoliu'),
('5', 'songhongkang'),
('6', 'leifengyang');
```
```sql
mysql> SELECT @@transaction_isolation;
+-------------------------+
| @@transaction_isolation |
+-------------------------+
| REPEATABLE-READ         |
+-------------------------+
```
假设事务A获取了某一行的排他锁，并未提交，语句如下所示:
```sql
BEGIN;

SELECT * FROM teacher WHERE id = 6 FOR UPDATE;
```
事务B想要获取teacher表的表读锁，语句如下：
```sql
BEGIN;

LOCK TABLES teacher READ;
```
因为共享锁与排他锁互斥，所以事务 B 在试图对 teacher 表加共享锁的时候，必须保证两个条件。

（1）当前没有其他事务持有 teacher 表的排他锁  
（2）当前没有其他事务持有 teacher 表中任意一行的排他锁。

为了检测是否满足第二个条件，事务 B 必须在确保 teacher 表不存在任何排他锁的前提下，去检测表中的每一行是否存在排他锁。很明显这是一个效率很差的做法，但是有了意向锁之后，情况就不一样了。

意向锁是怎么解决这个问题的呢？首先，我们需要知道意向锁之间的兼容互斥性，如下所示。

|  | 意向共享锁（IS） | 意向排他锁（IX） |
| --- | --- | --- |
| 意向共享锁（IS） | 兼容 | 兼容 |
| 意向排他锁（IX） | 兼容 | 兼容 |

即意向锁之间是互相兼容的，虽然意向锁和自家兄弟互相兼容，但是它会与普通的排他/共享锁互斥。

|  | 意向共享锁（IS） | 意向排他锁（IX） |
| --- | --- | --- |
| 共享锁（S） | **兼容** | 互斥 |
| 排他锁（X） | 互斥 | 互斥 |

注意这里的排他/共享锁指的都是表锁，意向锁不会与行级的共享/排他锁互斥。回到刚才 teacher 表的例子。

事务 A 获取了某一行的排他锁，并未提交：
```sql
BEGIN;

SELECT * FROM teacher WHERE id = 6 FOR UPDATE;
```
此时teacher表存在两把锁：teacher表上的意向排他锁 与 id为6的数据行上的排他锁。事务B想要获取teacher表的共享锁。
```sql
BEGIN;

LOCK TABLES teacher READ;
```
此时事务B检测事务A持有teacher表的意向排他锁，就可以得知事务A必须持有该表中某些数据行的排他锁，那么事务B对teacher表的加锁请求就会被排斥（阻塞），而无需去检测表中的每一行数据是否存在排他锁。

---

**意向锁的并发性**

意向锁不会与行级的共享 / 排他锁互斥！正因为如此，意向锁并不会影响到多个事务对不同数据行加排他锁时的并发性。（不然我们直接用普通的表锁就行了）

我们扩展一下上面 teacher表的例子来概括一下意向锁的作用（一条数据从被锁定到被释放的过程中，可能存在多种不同锁，但是这里我们只着重表现意向锁）。

事务A先获得了某一行的排他锁，并未提交：
```sql
BEGIN;

SELECT * FROM teacher WHERE id = 6 FOR UPDATE;
```
事务A获取了teacher表上的意向排他锁。事务A获取了id为6的数据行上的排他锁。

之后事务B想要获取teacher表上的共享锁。
```sql
BEGIN;

LOCK TABLES teacher READ;
```

事务B检测到事务A持有teacher表的意向排他锁。事务B对teacher表的加锁请求被阻塞（排斥）。

最后事务C也想获取teacher表中某一行的排他锁。
```sql
BEGIN;

SELECT * FROM teacher WHERE id = 5 FOR UPDATE;
```
事务C申请teacher表的意向排他锁。事务C检测到事务A持有teacher表的意向排他锁。因为意向锁之间并不互斥，所以事务C获取到了teacher表的意向排他锁。因为id为5的数据行上不存在任何排他锁，最终事务C成功获取到了该数据行上的排他锁。

**从上面的案例可以得到如下结论：**

1. InnoDB 支持 `多粒度锁` ，特定场景下，行级锁可以与表级锁共存。
2. 意向锁之间互不排斥，但除了 IS 与 S 兼容外， 意向锁会与(表级) 共享锁 / 排他锁 互斥。
3. IX，IS是表级锁，不会和行级的X，S锁发生冲突。只会和表级的X，S发生冲突。
4. 意向锁在保证并发性的前提下，实现了 `行锁和表锁共存` 且 `满足事务隔离性` 的要求。




##### 4. 自增锁（AUTO-INC锁）
在使用MySQL过程中，我们可以为表的某个列添加 `AUTO_INCREMENT` 属性。举例：
```sql
CREATE TABLE `teacher` (
`id` int NOT NULL AUTO_INCREMENT,
`name` varchar(255) NOT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```
由于这个表的id字段声明了AUTO_INCREMENT，意味着在书写插入语句时不需要为其赋值，SQL语句修改 如下所示。
```sql
INSERT INTO `teacher` (name) VALUES ('zhangsan'), ('lisi');
```

上边的插入语句并没有为id列显式赋值，所以系统会自动为它赋上递增的值，结果如下所示。
```sql
mysql> select * from teacher;
+----+----------+
| id | name     |
+----+----------+
| 1  | zhangsan |
| 2  | lisi     |
+----+----------+
2 rows in set (0.00 sec)
```
现在我们看到的上面插入数据只是一种简单的插入模式，所有插入数据的方式总共分为三类，分别是 “ `Simple inserts` ”，“ `Bulk inserts` ”和“ `Mixed-mode inserts` ”。

1. `“Simple inserts”` （简单插入）

可以 `预先确定要插入的行数` （当语句被初始处理时）的语句。包括没有嵌套子查询的单行和多行`INSERT...VALUES()`和 `REPLACE` 语句。比如我们上面举的例子就属于该类插入，已经确定要插入的行数。

2. `“Bulk inserts”` （批量插入）

`事先不知道要插入的行数` （和所需自动递增值的数量）的语句。比如 `INSERT ... SELECT` ， `REPLACE ... SELECT` 和 `LOAD DATA` 语句，但不包括纯INSERT。 InnoDB在每处理一行，为`AUTO_INCREMENT`列

3. `“Mixed-mode inserts”` （混合模式插入）

这些是“Simple inserts”语句但是指定部分新行的自动递增值。例如 `INSERT INTO teacher (id,name) VALUES (1,'a'), (NULL,'b'), (5,'c'), (NULL,'d');` 只是指定了部分`id`的值。另一种类型的“混合模式插入”是` INSERT ... ON DUPLICATE KEY UPDATE` 。


对于上面数据插入的案例，MySQL中采用了`自增锁`的方式来实现，**AUTO-INC锁是 当向使用含有AUTO_INCREMENT列的表中插入数据时需要获取的一种特殊的表级锁**，在执行插入语句时就在表级别加一个AUTO-INC锁，然后为每条待插入记录的AUTO_INCREMENT修饰的列分配递增的值，在该语句执行结束后，再把AUTO-INC锁释放掉。**一个事务在持有AUTO-INC锁的过程中，其他事务的插入语句都要被阻塞**，可以保证一个语句中分配的递增值是连续的。也正因为此，其并发性显然并不高，**当我们向一个有AUTO_INCREMENT关键字的主键插入值的时候，每条语句都要对这个表锁进行竞争**，这样的并发潜力其实是很低下的，所以innodb通过`innodb_autoinc_lock_mode`的不同取值来提供不同的锁定机制，来显著提高SQL语句的可伸缩性和性能。

`innodb_autoinc_lock_mode`有三种取值，分别对应与不同锁定模式：

（1）`innodb_autoinc_lock_mode = 0`(“传统”锁定模式 )

在此锁定模式下，所有类型的insert语句都会获得一个特殊的表级AUTO-INC锁，用于插入具有 AUTO_INCREMENT列的表。这种模式其实就如我们上面的例子，即每当执行insert的时候，都会得到一个 表级锁(AUTO-INC锁)，使得语句中生成的auto_increment为顺序，且在binlog中重放的时候，可以保证 master与slave中数据的auto_increment是相同的。因为是表级锁，当在同一时间多个事务中执行insert的 时候，对于AUTO-INC锁的争夺会 `限制并发` 能力。

（2）`innodb_autoinc_lock_mode = 1`(“连续”锁定模式 )

在 MySQL 8.0 之前，连续锁定模式是 `默认` 的。

在这个模式下，“bulk inserts”仍然使用AUTO-INC表级锁，并保持到语句结束。这适用于所有INSERT ... SELECT，REPLACE ... SELECT和LOAD DATA语句。同一时刻只有一个语句可以持有AUTO-INC锁。

对于“Simple inserts”（要插入的行数事先已知），则通过在 `mutex（轻量锁）` 的控制下获得所需数量的自动递增值来避免表级AUTO-INC锁， 它只在分配过程的持续时间内保持，而不是直到语句完成。不使用表级AUTO-INC锁，除非AUTO-INC锁由另一个事务保持。如果另一个事务保持AUTO-INC锁，则“Simple inserts”等待AUTO-INC锁，如同它是一个“bulk inserts”。

（3）`innodb_autoinc_lock_mode = 2`(“交错”锁定模式 )

从 MySQL 8.0 开始，交错锁模式是 `默认` 设置。

在此锁定模式下，自动递增值 `保证` 在所有并发执行的所有类型的insert语句中是 `唯一` 且 `单调递增` 的。但是，由于多个语句可以同时生成数字（即，跨语句交叉编号），**为任何给定语句插入的行生成的值可能不是连续的**。

如果执行的语句是“simple inserts"，其中要插入的行数已提前知道，除了"Mixed-mode inserts"之外，为单个语句生成的数字不会有间隙。然后，当执行"bulk inserts"时，在由任何给定语句分配的自动递增值中可能存在间隙。




##### 5. 元数据锁（MDL锁）

`MySQL5.5`引入了`meta data lock`，简称MDL锁，属于表锁范畴。MDL 的作用是，保证读写的正确性。比如，如果一个查询正在遍历一个表中的数据，而执行期间另一个线程对这个`表结构做变更` ，增加了一 列，那么查询线程拿到的结果跟表结构对不上，肯定是不行的。

因此，**当对一个表做增删改查操作的时候，加 MDL读锁；当要对表做结构变更操作的时候，加 MDL 写锁**。

读锁之间不互斥，因此你可以有多个线程同时对一张表增删查改。读写锁之间、写锁之间都是互斥的，用来保证变更表结构操作的安全性，解决了DML和DDL操作之间的一致性问题。`不需要显式使用`，在访问一个表的时候会被自动加上。

**举例：元数据锁的使用场景模拟**

**会话A：** 从表中查询数据
```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.00 sec)
mysql> SELECT COUNT(1) FROM teacher;
+----------+
| COUNT(1) |
+----------+
| 2        |
+----------+
1 row int set (7.46 sec)
```

**会话B：** 修改表结构，增加新列
```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.00 sec)
mysql> alter table teacher add age int not null;
```

**会话C：** 查看当前MySQL的进程
```sql
mysql> show processlist;
```
```sql
mysql> show processlist;
+----+------------------+-----------+---------+---------+------+-----------------------------+------------------------------+
| Id | User             | Host      | db      | Command | Time | State                       | Info                         |
+----+------------------+-----------+---------+---------+------+-----------------------------+------------------------------+
| 5  | event_scheduler  | localhost | NULL    | Daemon  | 8205 | Waiting on empty queue      | NULL                         |
| 8  | root             | localhost | atguigudb1 | Sleep   | 46   |                             | NULL                         |
| 9  | root             | localhost | atguigudb1 | Query   | 24   | Waiting for table metadata lock | alter table teacher add age int |
| 13 | root             | localhost | NULL    | Query   | 0    | init                        | show processlist             |
+----+------------------+-----------+---------+---------+------+-----------------------------+------------------------------+
4 rows in set (0.00 sec)
```
通过会话C可以看出会话B被阻塞，这是由于会话A拿到了teacher表的`元数据读锁`，会话B想申请teacher表的`元数据写锁`，由于读写锁互斥，会话B需要等待会话A释放元数据锁才能执行。


**元数据锁可能带来的问题**

| Session A | Session B | Session C |
| --- | --- | --- |
| begin;select * from teacher; |  |  |
|  | alter table teacher add age int; |  |
|  |  | select * from teacher; |

我们可以看到 session A 会对表 teacher 加一个 MDL 读锁，之后 session B 要加 MDL 写锁会被 blocked，因为 session A 的 MDL 读锁还没有释放，而 session C 要在表 teacher 上新申请 MDL 读锁的请求也会被 session B 阻塞。前面我们说了，所有对表的增删改查操作都需要先申请 MDL 读锁，就都被阻塞，等于这个表现在完全不可读写了。


