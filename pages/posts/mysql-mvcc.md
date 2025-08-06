---
title: MySQL - 多版本并发控制
# date: 2025-07-10
# updated: 2025-07-10
categories: 数据库
tags:
  - MySQL
  - 后端
  - 数据库
  - 多版本并发控制
---

## 什么是MVCC
MVCC （`Multiversion Concurrency Control`），多版本并发控制。顾名思义，MVCC 是通过数据行的多个版本管理来实现数据库的 `并发控制` 。这项技术使得在InnoDB的事务隔离级别下执行 `一致性读` 操作有了保证。换言之，就是为了查询一些正在被另一个事务更新的行，并且可以看到它们被更新之前的值，这样 在做查询的时候就不用等待另一个事务释放锁。

MVCC没有正式的标准，在不同的DBMS中MVCC的实现方式可能是不同的，也不是普遍使用的（大家可以参考相关的DBMS文档）。这里讲解InnoDB中MVCC的实现机制（MySQL其他的存储引擎并不支持它）。

## 快照读与当前读

### 快照读

快照读又叫一致性读，读取的是快照数据。**不加锁的简单的 SELECT 都属于快照读**，即不加锁的非阻塞 读；比如这样：
```sql
SELECT * FROM player WHERE ...
```
之所以出现快照读的情况，是基于提高并发性能的考虑，快照读的实现是基于MVCC，它在很多情况下， 避免了加锁操作，降低了开销。

既然是基于多版本，那么快照读可能读到的并不一定是数据的最新版本，而有可能是之前的历史版本。

快照读的前提是隔离级别不是串行级别，串行级别下的快照读会退化成当前读。

### 当前读
当前读读取的是记录的最新版本（最新数据，而不是历史版本的数据），读取时还要保证其他并发事务 不能修改当前记录，会对读取的记录进行加锁。加锁的 SELECT，或者对数据进行增删改都会进行*当前读*。比如：

```sql
SELECT * FROM student LOCK IN SHARE MODE; # 共享锁
SELECT * FROM student FOR UPDATE; # 排他锁
INSERT INTO student values ... # 排他锁
DELETE FROM student WHERE ... # 排他锁
UPDATE student SET ... # 排他锁
```

### 复习

再谈隔离级别

我们知道事务有 4 个隔离级别，可能存在三种并发问题：


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-05_21-45-21.png)
在 MySQL 中，默认的隔离级别是可重复读，可以解决脏读和不可重复读的问题，如果仅从定义的角度来看，它并不能解决幻读问题。如果我们想要解决幻读问题，就需要采用串行化的方式，也就是将隔离级别提升到最高，但这样一来就会大幅降低数据库的事务并发能力。

MVCC 可以不采用锁机制，而是通过乐观锁的方式来解决不可重复读和幻读问题！它可以在大多数情况下替代行级锁，降低系统的开销。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-05_21-44-44.png)


#### 隐藏字段、Undo Log版本链

回顾一下undo日志的版本链，对于使用 InnoDB 存储引擎的表来说，它的聚簇索引记录中都包含两个必要的隐藏列。

- `trx_id` ：每次一个事务对某条聚簇索引记录进行改动时，都会把该事务的 `事务id` 赋值给 `trx_id` 隐藏列。
- `roll_pointer` ：每次对某条聚簇索引记录进行改动时，都会把旧的版本写入到 `undo日志` 中，然 后这个隐藏列就相当于一个指针，可以通过它来找到该记录修改前的信息。


举例：student表数据如下
```sql
mysql> SELECT * FROM student;
+--------+--------+--------+
| id     | name   | class  |
+--------+--------+--------+
| 1      | 张三   | 一班   |
+--------+--------+--------+
1 row in set (0.07 sec)
```

假设插入该记录的`事务id`为`8`，那么此刻该条记录的示意图如下所示：


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-05_21-56-02.png)


>insert undo只在事务回滚时起作用，当事务提交后，该类型的undo日志就没用了，它占用的Undo Log Segment也会被系统回收（也就是该undo日志占用的Undo页面链表要么被重用，要么被释放）。

假设之后两个事务id分别为 10 、 20 的事务对这条记录进行 UPDATE 操作，操作流程如下：

| 发生时间顺序 | 事务10                     | 事务20                     |
|--------------|----------------------------|----------------------------|
| 1            | BEGIN;                     |                            |
| 2            |                            | BEGIN;                     |
| 3            | UPDATE student SET name="李四" WHERE id=1; |                            |
| 4            | UPDATE student SET name="王五" WHERE id=1; |                            |
| 5            | COMMIT;                    |                            |
| 6            |                            | UPDATE student SET name="钱七" WHERE id=1; |
| 7            |                            | UPDATE student SET name="宋八" WHERE id=1; |
| 8            |                            | COMMIT;                    |


>能不能在两个事务中交叉更新同一条记录呢？不能！这不就是一个事务修改了另一个未提交事务修改过的数据，脏写。
>
>InnoDB使用锁来保证不会有脏写情况的发生，也就是在第一个事务更新了某条记录后，就会给这条记录加锁，另一个事务再次更新时就需要等待第一个事务提交了，把锁释放之后才可以继续更新。


每次对记录进行改动，都会记录一条undo日志，每条undo日志也都有一个 `roll_pointer` 属性 （ `INSERT` 操作对应的undo日志没有该属性，因为该记录并没有更早的版本），可以将这些 `undo日志` 都连起来，串成一个链表：

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-05_21-57-40.png)


对该记录每次更新后，都会将旧值放到一条 `undo日志` 中，就算是该记录的一个旧版本，随着更新次数 的增多，所有的版本都会被 `roll_pointer` 属性连接成一个链表，我们把这个链表称之为 `版本链` ，版本链的头节点就是当前记录最新的值。

每个版本中还包含生成该版本时对应的`事务id`。



### MVCC实现原理之ReadView

MVCC 的实现依赖于：`隐藏字段`、`Undo Log`、`Read View`。

**什么是ReadView**

在 MVCC 机制中，多个事务对同一个行记录进行更新会产生多个历史快照，这些历史快照保存在 Undo Log 里。如果一个事务想要查询这个行记录，需要读取哪个版本的行记录呢？这时就需要用到 ReadView 了，它帮我们解决了行的可见性问题。

ReadView 就是某个事务在使用 MVCC 机制进行快照读操作时产生的读视图。当事务启动时，会生成数据库系统当前的一个快照，InnoDB 为每个事务构造了一个数组，用来记录并维护系统当前`活跃事务`的 ID（“活跃”指的就是，启动了但还没提交）。


**设计思路**

使用 `READ UNCOMMITTED` 隔离级别的事务，由于可以读到未提交事务修改过的记录，所以直接读取记录的最新版本就好了。

使用 `SERIALIZABLE` 隔离级别的事务，InnoDB规定使用加锁的方式来访问记录。

使用 `READ COMMITTED` 和 `REPEATABLE READ` 隔离级别的事务，都必须保证读到 `已经提交了的` 事务修改过的记录。假如另一个事务已经修改了记录但是尚未提交，是不能直接读取最新版本的记录的，核心问题就是需要判断一下版本链中的哪个版本是当前事务可见的，这是ReadView要解决的主要问题。


这个ReadView中主要包含4个比较重要的内容，分别如下：

1. `creator_trx_id` ，创建这个 Read View 的事务 ID。

>说明：只有在对表中的记录做改动时（执行INSERT、DELETE、UPDATE这些语句时）才会为 事务分配事务id，否则在一个只读事务中的事务id值都默认为0。

2. `trx_ids` ，表示在生成ReadView时当前系统中活跃的读写事务的 `事务id列表` 。

3. `up_limit_id` ，活跃的事务中最小的事务 ID。

4. `low_limit_id` ，表示生成ReadView时系统中应该分配给下一个事务的 id 值。low_limit_id 是系 统最大的事务id值，这里要注意是系统中的事务id，需要区别于正在活跃的事务ID。

>注意：low_limit_id并不是trx_ids中的最大值，事务id是递增分配的。比如，现在有id为1， 2，3这三个事务，之后id为3的事务提交了。那么一个新的读事务在生成ReadView时， trx_ids就包括1和2，up_limit_id的值就是1，low_limit_id的值就是4。


**举例：**

trx_ids 为 trx2、trx3、trx5 和 trx8 的集合，系统的最大事务 ID（low_limit_id）为 trx8+1（如果之前没有其他的新增事务），活跃的最小事务 ID（up_limit_id）为 trx2。


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-05_22-28-51.png)


**ReadView的规则**

有了这个ReadView，这样在访问某条记录时，只需要按照下边的步骤判断记录的某个版本是否可见。

- 如果被访问版本的`trx_id`属性值与ReadView中的 `creator_trx_id` 值相同，意味着当前事务在访问它自己修改过的记录，所以该版本可以被当前事务访问。
- 如果被访问版本的`trx_id`属性值小于ReadView中的 `up_limit_id` 值，表明生成该版本的事务在当前事务生成ReadView前已经提交，所以该版本可以被当前事务访问。
- 如果被访问版本的`trx_id`属性值大于或等于ReadView中的 `low_limit_id` 值，表明生成该版本的事务在当前事务生成ReadView后才开启，所以该版本不可以被当前事务访问。
- 如果被访问版本的`trx_id`属性值在ReadView的 `up_limit_id` 和 `low_limit_id` 之间，那就需要判断一下trx_id属性值是不是在 trx_ids 列表中。
    - 如果在，说明创建ReadView时生成该版本的事务还是活跃的，该版本不可以被访问。
    - 如果不在，说明创建ReadView时生成该版本的事务已经被提交，该版本可以被访问。


**MVCC整体操作流程**

了解了这些概念之后，我们来看下当查询一条记录的时候，系统如何通过MVCC找到它：

1. 首先获取事务自己的版本号，也就是`事务ID`；
2. 获取 ReadView；
3. 查询得到的数据，然后与 `ReadView` 中的事务版本号进行比较；
4. 如果不符合 `ReadView` 规则，就需要从 `Undo Log` 中获取历史快照；
5. 最后返回符合规则的数据。


如果某个版本的数据对当前事务不可见的话，那就顺着版本链找到下一个版本的数据，继续按照上边的步骤判断可见性，依此类推，直到版本链中的最后一个版本。如果最后一个版本也不可见的话，那么就意味着该条记录对该事务完全不可见，查询结果就不包含该记录。

>InnoDB 中，MVCC 是通过 Undo Log + Read View 进行数据读取，Undo Log 保存了历史快照，而 Read View 规则帮我们判断当前版本的数据是否可见。


在隔离级别为读已提交（Read Committed）时，一个事务中的每一次 SELECT 查询都会重新获取一次 Read View。


如表所示：

| 事务 | 说明 |
| --- | --- |
| begin; |  |
| select * from student where id >2; | 获取一次Read View |
| ......... |  |
| select * from student where id >2; | 获取一次Read View |
| commit; |  |


>注意，此时同样的查询语句都会重新获取一次 Read View，这时如果 Read View 不同，就可能产生不可重复读或者幻读的情况。

当隔离级别为可重复读的时候，就避免了不可重复读，这是因为一个事务只在第一次 SELECT 的时候会获取一次 Read View，而后面所有的 SELECT 都会复用这个 Read View，如下表所示：

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-05_22-31-43.png)


### 举例说明

假设现在student表中只有一条由`事务id`为`8`的事务插入的一条记录：
```sql
mysql> SELECT * FROM student;
+--------+--------+---------+
| id     | name   | class   |
+--------+--------+---------+
| 1      | 张三   | 一班    |
+--------+--------+---------+
1 row in set (0.07 sec)
```

MVCC 只能在 `READ COMMITTED` 和 `REPEATABLE READ` 两个隔离级别下工作。接下来看一下 `READ COMMITTED` 和 `REPEATABLE READ` 所谓的生成 `ReadView` 的时机不同到底不同在哪里。


#### READ COMMITTED隔离级别下


READ COMMITTED ：**每次读取数据前都生成一个ReadView**。

现在有两个 `事务id` 分别为 `10` 、 `20` 的事务在执行:


```sql
# Transaction 10
BEGIN;
UPDATE student SET name="李四" WHERE id=1;
UPDATE student SET name="王五" WHERE id=1;
# Transaction 20
BEGIN;
# 更新了一些别的表的记录
...
```
>说明：事务执行过程中，只有在第一次真正修改记录时（比如使用INSERT、DELETE、UPDATE语句），才会被分配一个单独的事务id，这个事务id是递增的。所以我们才在事务2中更新一些别的表的记录，目的是让它分配事务id。

此刻，表student 中 `id` 为 `1` 的记录得到的版本链表如下所示：


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-05_22-50-36.png)


假设现在有一个使用 `READ COMMITTED` 隔离级别的事务开始执行：
```sql
# 使用READ COMMITTED隔离级别的事务
BEGIN;

# SELECT1：Transaction 10、20未提交
SELECT * FROM student WHERE id = 1; # 得到的列name的值为'张三'
```

这个 `SELECT1` 的执行过程如下：

步骤1：在执行 `SELECT` 语句时会先生成一个 `ReadView`，`ReadView` 的 `trx_ids` 列表的内容就是 `[10, 20]`，`up_limit_id` 为 `10`，`low_limit_id` 为 `21`，`creator_trx_id` 为 `0`。

步骤2：从版本链中挑选可见的记录，从图中看出，最新版本的列 `name` 的内容是 `'王五'`，该版本的 `trx_id` 值为 `10`，在 `trx_ids` 列表内，所以不符合可见性要求，根据 `roll_pointer` 跳到下一个版本。

步骤3：下一个版本的列 `name` 的内容是 `'李四'`，该版本的 `trx_id` 值也为 `10`，也在 `trx_ids` 列表内，所以也不符合要求，继续跳到下一个版本。

步骤4：下一个版本的列 `name` 的内容是 `'张三'`，该版本的 `trx_id` 值为 `8`，小于 `ReadView` 中的 `up_limit_id` 值 `10`，所以这个版本是符合要求的，最后返回给用户的版本就是这条列 `name` 为 `'张三'` 的记录。

之后，我们把 `事务id` 为 `10` 的事务提交一下：
```sql
# Transaction 10
BEGIN;
UPDATE student SET name="李四" WHERE id=1;
UPDATE student SET name="王五" WHERE id=1;
COMMIT;
```

然后再到 `事务id` 为 `20` 的事务中更新一下表 `student` 中 `id` 为 `1` 的记录：
```sql
# Transaction 20
BEGIN;
# 更新了一些别的表的记录
...
UPDATE student SET name="钱七" WHERE id=1;
UPDATE student SET name="宋八" WHERE id=1;
```
此刻，表student中 `id` 为 `1` 的记录的版本链就长这样：

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-05_22-54-24.png)


然后再到刚才使用 `READ COMMITTED` 隔离级别的事务中继续查找这个 `id` 为 `1` 的记录，如下：

```sql
# 使用READ COMMITTED隔离级别的事务
BEGIN;

# SELECT1：Transaction 10、20均未提交
SELECT * FROM student WHERE id = 1; # 得到的列name的值为'张三'

# SELECT2：Transaction 10提交，Transaction 20未提交
SELECT * FROM student WHERE id = 1; # 得到的列name的值为'王五'
```
这个 `SELECT2` 的执行过程如下:

步骤1: 在执行 `SELECT` 语句时会又会单独生成一个 `ReadView`, 该 `ReadView` 的 `trx_ids` 列表的内容就是`[20]`, `up_limit_id` 为 `20`, `low_limit_id` 为 `21`, `creator_trx_id` 为 `0`。

步骤2: 从版本链中挑选可见的记录, 从图中看出, 最新版本的列 `name` 的内容是 `'宋八'`, 该版本的 `trx_id` 值为`20`, 在 `trx_ids` 列表内, 所以不符合可见性要求, 根据 `roll_pointer` 跳到下一个版本。

步骤3: 下一个版本的列 `name` 的内容是 `'钱七'`, 该版本的 `trx_id` 值为 `20`, 也在 `trx_ids` 列表内, 所以也不符合要求, 继续跳到下一个版本。

步骤4: 下一个版本的列 `name` 的内容是 `'王五'`, 该版本的 `trx_id` 值为 `10`, 小于 `ReadView` 中的 `up_limit_id` 值`20`, 所以这个版本是符合要求的, 最后返回给用户的版本就是这条列 `name` 为 `'王五'` 的记录。

以此类推, 如果之后事务 `id` 为 `20` 的记录也提交了, 再次在使用 `READ COMMITTED` 隔离级别的事务中查询表 `student` 中 `id` 值为 `1` 的记录时, 得到的结果就是 `'宋八'` 了, 具体流程我们就不分析了。

>强调：使用READ COMMITTED隔离级别的事务在每次查询开始时都会生成一个独立的ReadView。


#### REPEATABLE READ隔离级别下


使用 `REPEATABLE READ` 隔离级别的事务来说，只会在第一次执行查询语句时生成一个 `ReadView` ，之后的查询就不会重复生成了。

比如，系统里有两个 `事务id` 分别为 `10` 、 `20` 的事务在执行：

```sql
# Transaction 10
BEGIN;
UPDATE student SET name="李四" WHERE id=1;
UPDATE student SET name="王五" WHERE id=1;
# Transaction 20
BEGIN;
# 更新了一些别的表的记录
...
```
此刻，表student 中 id 为 1 的记录得到的版本链表如下所示：

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-05_22-58-14.png)


假设现在有一个使用 REPEATABLE READ 隔离级别的事务开始执行：
```sql
# 使用REPEATABLE READ隔离级别的事务
BEGIN;

# SELECT1：Transaction 10、20未提交
SELECT * FROM student WHERE id = 1; # 得到的列name的值为'张三'
```

这个 `SELECT1` 的执行过程如下：

步骤1：在执行 `SELECT` 语句时会先生成一个 `ReadView`，`ReadView` 的 `trx_ids` 列表的内容就是 `[10, 20]`，`up_limit_id` 为 `10`，`low_limit_id` 为 `21``，creator_trx_id` 为 `0`。

步骤2：然后从版本链中挑选可见的记录，从图中看出，最新版本的列 `name` 的内容是 `'王五'`，该版本的 `trx_id` 值为 `10`，在 `trx_ids` 列表内，所以不符合可见性要求，根据 `roll_pointer` 跳到下一个版本。

步骤3：下一个版本的列 `name` 的内容是 `'李四'`，该版本的 `trx_id` 值也为 `10`，也在 `trx_ids` 列表内，所以也不符合要求，继续跳到下一个版本。

步骤4：下一个版本的列 `name` 的内容是 `'张三'`，该版本的 `trx_id` 值为 `8`，小于 `ReadView` 中的 `up_limit_id` 值 `10`，所以这个版本是符合要求的，最后返回给用户的版本就是这条列 `name` 为 `'张三'` 的记录。

之后，我们把 `事务id` 为 `10` 的事务提交一下，就像这样：

```sql
# Transaction 10
BEGIN;

UPDATE student SET name="李四" WHERE id=1;
UPDATE student SET name="王五" WHERE id=1;

COMMIT;
```
然后再到 `事务id` 为 `20` 的事务中更新一下表 `student` 中 `id` 为 `1` 的记录：


```sql
# Transaction 20
BEGIN;
# 更新了一些别的表的记录
...
UPDATE student SET name="钱七" WHERE id=1;
UPDATE student SET name="宋八" WHERE id=1;
```


此刻，表student中 `id` 为 `1` 的记录的版本链就长这样：

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-08-05_23-01-09.png)


然后再到刚才使用 `REPEATABLE READ` 隔离级别的事务中继续查找这个 `id` 为 `1` 的记录，如下：

```sql
# 使用REPEATABLE READ隔离级别的事务
BEGIN;
# SELECT1：Transaction 10、20均未提交
SELECT * FROM student WHERE id = 1; # 得到的列name的值为'张三'
# SELECT2：Transaction 10提交，Transaction 20未提交
SELECT * FROM student WHERE id = 1; # 得到的列name的值仍为'张三'
```


`SELECT2` 的执行过程如下:

步骤1: 因为当前事务的隔离级别为 `REPEATABLE READ`, 而之前在执行 `SELECT1` 时已经生成过 `ReadView` 了, 所以此时直接复用之前的 `ReadView`, 之前的 `ReadView` 的 `trx_ids` 列表的内容就是 `[10, 20]`, `up_limit_id` 为 `10`, `low_limit_id` 为 `21`, `creator_trx_id` 为 `0`。

步骤2: 然后从版本链中挑选可见的记录, 从图中可以看出, 最新版本的列 `name` 的内容是 `'宋八'`, 该版本的 `trx_id` 值为 `20`, 在 `trx_ids` 列表内, 所以不符合可见性要求, 根据 `roll_pointer` 跳到下一个版本。

步骤3: 下一个版本的列 `name` 的内容是 `'钱七'`, 该版本的 `trx_id` 值为 `20`, 也在 `trx_ids` 列表内, 所以也不符合要求, 继续跳到下一个版本。

步骤4: 下一个版本的列 `name` 的内容是 `'王五'`, 该版本的 `trx_id` 值为 `10`, 而 `trx_ids` 列表中是包含值为 `10` 的事务 `id` 的, 所以该版本也不符合要求, 同理下一个列 `name` 的内容是 `'李四'` 的版本也不符合要求。继续跳到下一个版本。

步骤5: 下一个版本的列 `name` 的内容是 `'张三'`, 该版本的 `trx_id` 值为 `8`, 小于 `ReadView` 中的 `up_limit_id` 值 `10`, 所以这个版本是符合要求的, 最后返回给用户的版本就是这条列 `c` 为 `'张三'` 的记录。


这次SELECT查询得到的结果是重复的，记录的列c值都是张三，这就是可重复读的含义。如果我们之后再把事务id为20的记录提交了，然后再到刚才使用REPEATABLE READ隔离级别的事务中继续查找这个id为1的记录，得到的结果还是张三，具体执行过程大家可以自己分析一下。


