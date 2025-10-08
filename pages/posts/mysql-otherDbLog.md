---
title: MySQL - 其他数据库日志
# date: 2025-07-10
# updated: 2025-07-10
categories: 数据库
tags:
  - MySQL
  - 后端
  - 数据库
  - 数据库日志
---




我们在讲解数据库事务时，讲过两种日志：重做日志、回滚日志。

对于线上数据库应用系统，突然遭遇`数据库宕机`怎么办？在这种情况下，`定位宕机的原因`就非常关键。我们可以查看数据库的`错误日志`。因为日志中记录了数据库运行中的诊断信息，包括了错误、警告和注释等信息。比如：从日志中发现某个连接中的 SQL 操作发生了死循环，导致内存不足，被系统强行终止了。明确了原因，处理起来也就轻松了，系统很快就恢复了运行。

除了发现错误，日志在数据复制、数据恢复、操作审计，以及确保数据的永久性和一致性等方面，都有着不可替代的作用。

千万不要小看日志。很多看似奇怪的问题，答案往往就藏在日志里。很多情况下，只有通过查看日志才能发现问题的原因，真正解决问题。所以，一定要学会查看日志，养成检查日志的习惯，对提升你的数据库应用开发能力至关重要。

MySQL8.0 官网日志地址：https://dev.mysql.com/doc/refman/8.0/en/server-logs.html

## MySQL支持的日志



### 日志类型
MySQL有不同类型的日志文件，用来存储不同类型的日志，分为 `二进制日志` 、 `错误日志` 、 `通用查询日志` 和 `慢查询日志` ，这也是常用的4种。

`MySQL 8`又新增两种支持的日志： `中继日志` 和 `数据定义语句日志` 。使用这些日志文件，可以查看MySQL内部发生的事情。

这6类日志分别为:
- **慢查询日志**:记录所有执行时间超过`long_query_time`的所有查询,方便我们对查询进行优化。
- **通用查询日志**:记录所有连接的起始时间和终止时间,以及连接发送给数据库服务器的所有指令,对我们复原操作的实际场景、发现问题,甚至是对数据库操作的审计都有很大的帮助。
- **错误日志**:记录MySQL服务的启动、运行或停止MySQL服务时出现的问题,方便我们了解服务器的 状态,从而对服务器进行维护。
- **二进制日志**:记录所有更改数据的语句,可以用于主从服务器之间的数据同步,以及服务器遇到故 障时数据的无损失恢复。
- **中继日志**:用于主从服务器架构中,从服务器用来存放主服务器二进制日志内容的一个中间文件。从服务器通过读取中继日志的内容,来同步主服务器上的操作。
- **数据定义语句日志**:记录数据定义语句执行的元数据操作。
除二进制日志外,其他日志都是 `文本文件` 。默认情况下,所有日志创建于 `MySQL数据目录` 中。



### 日志的弊端

- 日志功能会 `降低MySQL数据库的性能` 。例如，在查询非常频繁的MySQL数据库系统中，如果开启了通用查询日志和慢查询日志，MySQL数据库会花费很多时间记录日志。
- 日志会 `占用大量的磁盘空间` 。对于用户量非常大，操作非常频繁的数据库，日志文件需要的存储空间设置比数据库文件需要的存储空间还要大。

## 慢查询日志(slow query log)

前面《性能分析工具的使用》已经详细讲述。


## 通用查询日志(general query log)


通用查询日志用来 `记录用户的所有操作` ，包括启动和关闭MySQL服务、所有用户的连接开始时间和截止 时间、发给 MySQL 数据库服务器的所有 SQL 指令等。当我们的数据发生异常时，**查看通用查询日志， 还原操作时的具体场景**，可以帮助我们准确定位问题。


### 问题场景

在电商系统中，购买商品并且使用微信支付完成以后，却发现支付中心的记录并没有新增，此时用户再次使用支付宝支付，就会出现`重复支付`的问题。但是当去数据库中查询数据的时候，会发现只有一条记录存在。那么此时给到的现象就是只有一条支付记录，但是用户却支付了两次。

我们对系统进行了仔细检查，没有发现数据问题，因为用户编号和订单编号以及第三方流水号都是对的。可是用户确实支付了两次，这个时候，我们想到了检查通用查询日志，看看当天到底发生了什么。

查看之后，发现：1月1日下午2点，用户使用微信支付完以后，但是由于网络故障，支付中心没有及时收到微信支付的回调通知，导致当时没有写入数据。1月1日下午2点30，用户又使用支付宝支付，此时记录更新到支付中心。1月1日晚上9点，微信的回调通知过来了，但是支付中心已经存在了支付宝的记录，所以只能覆盖记录了。

由于网络的原因导致了重复支付。至于解决问题的方案就很多了，这里省略。

可以看到**通用查询日志**可以帮助我们了解操作发生的具体时间和操作的细节，对找出异常发生的原因极其关键。


### 查看当前状态

```bash
# 通用查询日志处于关闭状态
# 通用查询日志文件的名称是atguigu01.log


mysql> SHOW VARIABLES LIKE '%general%';
+------------------+------------------------------+
| Variable_name    | Value                        |
+------------------+------------------------------+
| general_log      | OFF                          |
| general_log_file | /var/lib/mysql/atguigu01.log |
+------------------+------------------------------+
2 rows in set (0.03 sec)
```

说明1: 系统变量 `general_log` 的值是 `OFF`，即通用查询日志处于关闭状态。在 MySQL 中，**这个参数的默认值是关闭的**。因为一旦开启记录通用查询日志，MySQL 会记录所有的连接起止和相关的 SQL 操作，这样会消耗系统资源并且占用磁盘空间。我们可以通过手动修改变量的值，**在需要的时候开启日志**。

说明2: 通用查询日志文件的名称是 `atguigu01.log`。存储路径是`/var/lib/mysql/`，默认也是数据路径。这样我们就知道在哪里可以查看通用查询日志的内容了。


### 启动日志

**方式1：永久性方式**

修改`my.cnf`或者`my.ini`配置文件来设置。在`[mysqld]`组下加入log选项，并重启MySQL服务。格式如下：

```bash
[mysqld]
general_log=ON
general_log_file=[path[filename]] #日志文件所在目录路径，filename为日志文件
```
如果不指定目录和文件名，通用查询日志将默认存储在MySQL数据目录中的`hostname.log`文件中， `hostname`表示主机名。


**方式2：临时性方式**

```bash
SET GLOBAL general_log=on; # 开启通用查询日志
```

```bash
SET GLOBAL general_log_file='path/filename'; # 设置日志文件保存位置
```
对应的，关闭操作SQL命令如下：

```bash
SET GLOBAL general_log=off; # 关闭通用查询日志
```
查看设置后情况：
```bash
SHOW VARIABLES LIKE 'general_log%';
```

### 查看日志

通用查询日志是以 `文本文件` 的形式存储在文件系统中的，可以使用 `文本编辑器` 直接打开日志文件。每台 MySQL 服务器的通用查询日志内容是不同的。
- 在 Windows 操作系统中，使用`文本文件查看器`；
- 在 Linux 系统中，可以使用 `vi` 工具或者 `gedit` 工具查看；
- 在 Mac OSX 系统中，可以使用`文本文件查看器`或者 `vi` 等工具查看。

从 `SHOW VARIABLES LIKE 'general_log%'` 结果中可以看到通用查询日志的位置。

```bash
# 进入到通用查询日志目录
cd /var/lib/mysql

# 查看通用查询日志，即可看到操作的任务记录
vi xxxx.log
```

在通用查询日志里面，我们可以清楚地看到，什么时候开启了新的客户端登陆数据库，登录之后做了什么 SQL 操作，针对的是哪个数据表等信息。

### 停止日志

**方式1：永久性方式**

修改 `my.cnf` 或者 `my.ini` 文件，把`[mysqld]`组下的 `general_log` 值设置为 `OFF` 或者把 `general_log` 一项注释掉。修改保存后，再重启MySQL服务，即可生效。

举例1：
```bash
[mysqld]
general_log=OFF
```

举例2：
```bash
[mysqld]
#general_log=OFF
```

**方式2：临时性方式**

使用SET语句停止MySQL通用查询日志功能：

```bash
SET GLOBAL general_log=off;
```

查看设置后情况：
```bash
SHOW VARIABLES LIKE 'general_log%';
```


### 删除\刷新日志

如果数据的使用非常频繁，那么通用查询日志会占用服务器非常大的磁盘空间。数据管理员可以删除很长时间之前的查询日志，以保证MySQL服务器上的硬盘空间。


**手动删除文件**


```bash
SHOW VARIABLES LIKE 'general_log%';
```
可以看出，通用查询日志的目录默认为MySQL数据目录。在该目录下手动删除通用查询日志 atguigu01.log

使用如下命令重新生成查询日志文件，具体命令如下。刷新MySQL数据目录，发现创建了新的日志文件。前提一定要开启通用日志。

```bash
# 刷新 MySQL 的日志文件
mysqladmin -uroot -p flush-logs
```

如果希望备份旧的通用查询日志，就必须先将旧的日志文件复制出来或者改名，然后执行上面的mysqladmin命令。正确流程如下：

```bash
cd mysql-data-directory # 输入自己的通用日志文件所在目录
mv mysql.general.log mysql.general.log.old # 指定旧的文件名 以及 新的文件名
mysqladmin -uroot -p flush-logs  # 必须是在日志开启的情况下，才能刷新日志
```

:::info
`flush_logs` 会根据你启用的日志类型，触发不同的“滚动/刷新”动作：
1. 错误日志 (error log)
- 把缓存中的内容立即写到错误日志文件。
2. 二进制日志 (binlog)
- 当前 binlog 文件会被关闭，生成一个新的 binlog 文件 (序号 +1)。
- 常用于主从复制，或手动切分 binlog。
3. 中继日志 (relay log)
- 在从库上，会生成新的 relay log 文件。
4. 通用查询日志 (general log) 和慢查询日志 (slow query log)
- 如果开启了这些日志，也会刷新，并生成新的文件。
:::

:::tip
mv 命令（全称 move）主要用于移动或重命名文件和目录。

**重命名文件/目录**

当源路径和目标路径在同一目录下时，mv 会执行重命名操作：
```bash
mv 旧文件名 新文件名
```
示例：
```bash
mv oldname.txt newname.txt  # 重命名文件
mv dir1 dir2               # 重命名目录
```


**移动文件/目录**

将文件或目录从源路径移动到目标路径（可跨目录）：


```bash
mv [选项] 源文件 目标文件
```
示例：
```bash
mv file.txt /home/user/documents/  # 将 file.txt 移动到 documents 目录
mv dir1 /backup/                  # 将 dir1 目录移动到 /backup/ 下
```

**选项**

- -i：交互模式，如果目标文件存在，会提示是否覆盖。

```bash
# 移动目录并覆盖前确认
mv -i mydir/ /backup/
```
:::

**docker容器中查看通用查询日志**
```bash
# 先进入容器中
docker exec -it mysql-container bash
# 进入mysql中
mysql -uroot -p

# 在mysql中执行
SET GLOBAL general_log = 'ON';

# 查看文件位置
mysql> SHOW VARIABLES LIKE 'general_log%';
+------------------+---------------------------------+
| Variable_name    | Value                           |
+------------------+---------------------------------+
| general_log      | ON                              |
| general_log_file | /var/lib/mysql/ca39d70d7ced.log |
+------------------+---------------------------------+
2 rows in set (0.00 sec)


# 退出mysql客户端
\q

# 然后在容器里看日志文件
tail -n 50 -f /var/lib/mysql/ca39d70d7ced.log


root@ca39d70d7ced:/var/lib/mysql# cat /var/lib/mysql/ca39d70d7ced.log
/usr/sbin/mysqld, Version: 8.0.27 (MySQL Community Server - GPL). started with:
Tcp port: 3306  Unix socket: /var/run/mysqld/mysqld.sock
Time                 Id Command    Argument
2025-10-02T13:35:17.042065Z     41848 Query     SHOW VARIABLES LIKE '%general%'
2025-10-02T13:35:29.205100Z     41848 Query     show databases
2025-10-02T13:35:46.124200Z     41848 Query     SELECT DATABASE()
2025-10-02T13:35:46.124418Z     41848 Init DB   zy_uums
2025-10-02T13:35:46.125422Z     41848 Query     show databases
2025-10-02T13:35:46.126249Z     41848 Query     show tables
2025-10-02T13:35:46.127311Z     41848 Field List        log 

```



## 错误日志(error log)

错误日志记录了 MySQL 服务器启动、停止运行的时间，以及系统启动、运行和停止过程中的诊断信息，包括`错误`、`警告`和`提示`等。

通过错误日志可以查看系统的运行状态，便于即时发现故障、修复故障。如果 MySQL 服务`出现异常`，错误日志是发现问题、解决故障的`首选`。

### 启动日志

在MySQL数据库中，错误日志功能是 **默认开启** 的。而且，错误日志 **无法被禁止** 。

默认情况下，错误日志存储在MySQL数据库的数据文件夹下，名称默认为 `mysqld.log` （Linux系统）或 `hostname.err` （mac系统）。如果需要制定文件名，则需要在`my.cnf`或者`my.ini`中做如下配置：
```bash
[mysqld]
log-error=[path/[filename]] #path为日志文件所在的目录路径，filename为日志文件名
```
修改配置项后，需要重启MySQL服务以生效。

### 查看日志
MySQL错误日志是以文本文件形式存储的，可以使用文本编辑器直接查看。

查询错误日志的存储路径：
```bash
mysql> SHOW VARIABLES LIKE 'log_err%';
+----------------------------+----------------------------------------+
| Variable_name              | Value                                  |
+----------------------------+----------------------------------------+
| log_error                  | stderr                                 |
| log_error_services         | log_filter_internal; log_sink_internal |
| log_error_suppression_list |                                        |
| log_error_verbosity        | 2                                      |
+----------------------------+----------------------------------------+
4 rows in set (0.00 sec)

# MySQL 的错误日志没有写入文件，而是输出到标准错误（stderr）。
# 在 Docker 容器里，标准输出（stdout）和标准错误（stderr）都会被 Docker 捕获并写到容器日志里。
# 直接在宿主机执行：
docker logs -f mysql-container
```

```bash
[root@iZbp143l1lire02d1p2giaZ ~]# docker logs mysql
2024-08-03 08:55:08+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 8.0.27-1debian10 started.
2024-08-03 08:55:08+00:00 [Note] [Entrypoint]: Switching to dedicated user 'mysql'
2024-08-03 08:55:08+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 8.0.27-1debian10 started.
2024-08-03 08:55:08+00:00 [Note] [Entrypoint]: Initializing database files
2024-08-03T08:55:08.717819Z 0 [System] [MY-013169] [Server] /usr/sbin/mysqld (mysqld 8.0.27) initializing of server in progress as process 41
2024-08-03T08:55:08.726202Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
2024-08-03T08:55:09.567909Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
.....
```

在正常情况下，执行结果中可以看到错误日志文件是mysqld.log，位于MySQL默认的数据目录下。
```bash
mysql> SHOW VARIABLES LIKE 'log_err%';
+----------------------------+----------------------------------------+
| Variable_name              | Value                                  |
+----------------------------+----------------------------------------+
| log_error                  | /var/log/mysqld.log                    |
| log_error_services         | log_filter_internal; log_sink_internal |
| log_error_suppression_list |                                        |
| log_error_verbosity        | 2                                      |
+----------------------------+----------------------------------------+
4 rows in set (0.01 sec)
```

错误日志文件中记录了服务器启动的时间，以及存储引擎 InnoDB 启动和停止的时间等。我们在做初始化时候生成的数据库初始密码也是记录在 error.log 中。




### 删除\刷新日志
对于很久以前的错误日志，数据库管理员查看这些错误日志的可能性不大，可以将这些错误日志删除， 以保证MySQL服务器上的 `硬盘空间` 。MySQL的错误日志是以文本文件的形式存储在文件系统中的，可以 `直接删除` 。

- 第一步（方式1）：删除操作
```bash
rm -f /var/lib/mysql/mysqld.log
```

- 第一步（方式2）：重命名文件
```bash
mv /var/log/mysqld.log /var/log/mysqld.log.old
```

- 第二步：重建日志
```bash
mysqladmin -uroot -p flush-logs
```
可能会报错
```bash
[root@atguigu01 log]# mysqladmin -uroot -p flush-logs
Enter password:
mysqladmin: refresh failed; error: 'Could not open file '/var/log/mysqld.log' for
error logging.'
```
官网提示：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-02_22-21-58.png)

我们需要进行 补充操作：
```bash
install -omysql -gmysql -m0644 /dev/null /var/log/mysqld.log
```
`flush-logs` 指令操作:
- `MySQL 5.5.7`以前的版本，flush-logs将错误日志文件重命名为`filename.err_old`，并创建新的日志文件。
- 从`MySQL 5.5.7`开始，flush-logs只是重新打开日志文件，并不做日志备份和创建的操作。
- 如果日志文件不存在，MySQL启动或者执行flush-logs时会自动创建新的日志文件。重新创建错误日志，大小为0字节。

### MySQL8.0新特性

MySQL8.0里对错误日志的改进。MySQL8.0的错误日志可以理解为一个全新的日志，在这个版本里，接受了来自社区的广泛批评意见，在这些意见和建议的基础上生成了新的日志。
下面这些是来自社区的意见：
- 默认情况下内容过于冗长
- 遗漏了有用的信息
- 难以过滤某些信息
- 没有标识错误信息的子系统源
- 没有错误代码，解析消息需要识别错误
- 引导消息可能会丢失
- 固定格式

针对这些意见，MySQL做了如下改变：
- 采用组件架构，通过不同的组件执行日志的写入和过滤功能
- 写入错误日志的全部信息都具有唯一的错误代码从10000开始
- 增加了一个新的消息分类《system》用于在错误日志中始终可见的非错误但服务器状态更改事件的消息
- 增加了额外的附加信息，例如关机时的版本信息，谁发起的关机等等
- 两种过滤方式，Internal和Dragnet
- 三种写入形式，经典、JSON和syseventlog

>小结：
>
>通常情况下，管理员不需要查看错误日志。但是，MySQL服务器发生异常时，管理员可以从错误日志中找到发生异常的时间、原因，然后根据这些信息来解决异常。



## 二进制日志(bin log)

binlog可以说是MySQL中比较 `重要` 的日志了，在日常开发及运维过程中，经常会遇到。

binlog即binary log，二进制日志文件，也叫作变更日志（update log）。它记录了数据库所有执行的 DDL 和 DML 等数据库更新事件的语句，但是不包含没有修改任何数据的语句（如数据查询语句select、 show等）。

它以`事件形式`记录并保存在`二进制文件`中。通过这些信息，我们可以再现数据更新操作的全过程。

>如果想要记录所有语句（例如，为了识别有问题的查询），需要使用通用查询日志。

binlog主要应用场景：

- 一是用于**数据恢复**，如果MySQL数据库意外停止，可以通过二进制日志文件来查看用户执行了哪些操作，对数据库服务器文件做了哪些修改，然后根据二进制日志文件中的记录来恢复数据库服务器。
- 二是用于**数据复制**，由于日志的延续性和时效性，master把它的二进制日志传递给slaves来达到master-slave数据一致的目的。

可以说MySQL数据库的**数据备份**、**主备**、**主主**、**主从**都离不开binlog，需要依靠binlog来同步数据，保证数据一致性。
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-02_22-38-28.png)




### 查看默认情况
查看记录二进制日志是否开启：在MySQL8中默认情况下，二进制文件是开启的。

```bash
docker exec -it mysql bash

mysql -uroot -p
Enter password: 

mysql> show variables like '%log_bin%';
+---------------------------------+-----------------------------+
| Variable_name                   | Value                       |
+---------------------------------+-----------------------------+
| log_bin                         | ON                          |
| log_bin_basename                | /var/lib/mysql/binlog       |
| log_bin_index                   | /var/lib/mysql/binlog.index |
| log_bin_trust_function_creators | OFF                         |
| log_bin_use_v1_row_events       | OFF                         |
| sql_log_bin                     | ON                          |
+---------------------------------+-----------------------------+
6 rows in set (0.02 sec)
```

- `log_bin_basename`：是binlog日志的基本文件名，后面会追加标识来表示每一个文件
- `log_bin_index`：是binlog文件的索引文件，这个文件管理了所有的binlog文件的目录
- `log_bin_trust_function_creators`：限制存储过程，前面我们已经讲过了，这是因为二进制日志的一个重要功能是用于主从复制，而存储函数有可能导致主从的数据不一致。所以当开启二进制日志后，需要限制存储函数的创建、修改、调用
- `log_bin_use_v1_row_events` 此只读系统变量已弃用。ON表示使用版本1二进制日志行，OFF表示使用版本2二进制日志行（MySQL 5.6 的默认值为2）。

```bash
mysql> \q
Bye

root@b5bc2ea3fb2c:/# cd /var/lib/mysql/   
root@b5bc2ea3fb2c:/var/lib/mysql# ls
'#ib_16384_0.dblwr'   binlog.index      hm@002ditem      ib_logfile0   nacos                server-key.pem
'#ib_16384_1.dblwr'   ca-key.pem        hm@002dpay       ib_logfile1   performance_schema   sys
'#innodb_temp'        ca.pem            hm@002dtrade     ibdata1       private_key.pem      undo_001
 auto.cnf             client-cert.pem   hm@002duser      ibtmp1        public_key.pem       undo_002
 binlog.000030        client-key.pem    hmall            mysql         seata
 binlog.000031        hm@002dcart       ib_buffer_pool   mysql.ibd     server-cert.pem
root@b5bc2ea3fb2c:/var/lib/mysql# 
```
我们会发现有很多binlog文件，这是因为，每当mysql服务器重启的时候，都会帮我们创建一个新的binlog文件。

### 日志参数设置

**方式1：永久性方式**

修改MySQL的 `/ect/my.cnf` 或 `my.ini` 文件可以设置二进制日志的相关参数：

```bash
[mysqld]
#启用二进制日志
log-bin=atguigu-bin
binlog_expire_logs_seconds=600
max_binlog_size=100M
```
若是docker环境，进入到我们挂载的目录，进入conf目录，编辑my.cnf文件，添加如上内容。

提示:
1. log-bin=mysql-bin #打开日志(主机需要打开)，这个mysql-bin也可以自定义，这里也可以加上路径，
如:/home/www/mysql_bin_log/mysql-bin
2. binlog_expire_logs_seconds: 此参数控制二进制日志文件保留的时长，单位是**秒**，默认2592000 30天
--14400 4小时;86400 1天;259200 3天;
3. max_binlog_size: 控制单个二进制日志大小，当前日志文件大小超过此变量时，执行切换动作。此参数
的**最大和默认值是1GB**，该设置并**不能严格控制Binlog的大小**，尤其是Binlog比较靠近最大值而又遇到一
个比较大事务时，为了保证事务的完整性，可能不做切换日志的动作(一个事务还没结束，结果这个文件大小满了)，只能将该事务的所有SQL都记录
进当前日志，直到事务结束。一般情况下可采取默认值。

重新启动MySQL服务，查询二进制日志的信息，执行结果：
```bash
systemctl restart mysqld
# 或者
docker restart mysql

[root@192 conf]# docker exec -it mysql bash
root@b5bc2ea3fb2c:/# mysql -uroot -p
Enter password: 

mysql> show variables like '%log_bin%';
+---------------------------------+----------------------------------+
| Variable_name                   | Value                            |
+---------------------------------+----------------------------------+
| log_bin                         | ON                               |
| log_bin_basename                | /var/lib/mysql/atguigu-bin       |
| log_bin_index                   | /var/lib/mysql/atguigu-bin.index |
| log_bin_trust_function_creators | OFF                              |
| log_bin_use_v1_row_events       | OFF                              |
| sql_log_bin                     | ON                               |
+---------------------------------+----------------------------------+
6 rows in set (0.01 sec)

```
进入之后即可看到该目录`atguigu-bin.000001`,`atguigu-bin.index`
```bash
root@b5bc2ea3fb2c:/# cd /var
root@b5bc2ea3fb2c:/var# cd lib/
root@b5bc2ea3fb2c:/var/lib# cd mysql/
root@b5bc2ea3fb2c:/var/lib/mysql# ls
'#ib_16384_0.dblwr'   binlog.000031     client-key.pem   ib_buffer_pool   nacos                sys
'#ib_16384_1.dblwr'   binlog.000032     hm@002dcart      ib_logfile0      performance_schema   undo_001
'#innodb_temp'        binlog.000033     hm@002ditem      ib_logfile1      private_key.pem      undo_002
 atguigu-bin.000001   binlog.index      hm@002dpay       ibdata1          public_key.pem
 atguigu-bin.index    ca-key.pem        hm@002dtrade     ibtmp1           seata
 auto.cnf             ca.pem            hm@002duser      mysql            server-cert.pem
 binlog.000030        client-cert.pem   hmall            mysql.ibd        server-key.pem
root@b5bc2ea3fb2c:/var/lib/mysql# 
```

**设置带文件夹的bin-log日志存放目录**

如果想改变日志文件的目录和名称，可以对my.cnf或my.ini中的log_bin参数修改如下：
```bash
[mysqld]
log-bin="/var/lib/mysql/binlog/atguigu-bin"
```
注意：新建的文件夹需要使用mysql用户，使用下面的命令即可。
```bash
chown -R -v mysql:mysql binlog
```
重启MySQL服务之后，新的二进制日志文件将出现在/var/lib/mysql/binlog/文件夹下面:
```bash
mysql> show variables like '%log_bin%';
+---------------------------------+--------------------------------------------+
| Variable_name                   | Value                                      |
+---------------------------------+--------------------------------------------+
| log_bin                         | ON                                         |
| log_bin_basename                | /var/lib/mysql/binlog/atguigu-bin          |
| log_bin_index                   | /var/lib/mysql/binlog/atguigu-bin.index    |
| log_bin_trust_function_creators | OFF                                        |
| log_bin_use_v1_row_events       | OFF                                        |
| sql_log_bin                     | ON                                         |
+---------------------------------+--------------------------------------------+
6 rows in set (0.00 sec)

[root@node1 binlog]# ls
atguigu-bin.000001  atguigu-bin.index
[root@node1 binlog]# pwd
/var/lib/mysql/binlog
```
:::warning
**数据库文件最好不要与日志文件放在同一个磁盘上**！这样，当数据库文件所在的磁盘发生故障时，可以使用日志文件恢复数据。
:::

**方式2：临时性方式**

如果不希望通过修改配置文件并重启的方式设置二进制日志的话，还可以使用如下指令，需要注意的是 在mysql8中只有 会话级别 的设置，没有了global级别的设置。
```bash
# global 级别
mysql> set global sql_log_bin=0;
ERROR 1228 (HY000): Variable 'sql_log_bin' is a SESSION variable and can`t be used
with SET GLOBAL

# session级别，只能使用session级别
mysql> SET sql_log_bin=0;
Query OK, 0 rows affected (0.01 秒)
```



### 查看日志

当MySQL创建二进制日志文件时，先创建一个以“filename”为名称、以“.index”为后缀的文件，再创建一 个以“filename”为名称、以“.000001”为后缀的文件。

MySQL服务 `重新启动一次` ，以“.000001”为后缀的文件就会增加一个，并且后缀名按1递增。即日志文件的 个数与MySQL服务启动的次数相同；如果日志长度超过了 `max_binlog_size` 的上限（默认是1GB），就会创建一个新的日志文件。

查看当前的二进制日志文件列表及大小。指令如下：

```bash
mysql> SHOW BINARY LOGS;
+--------------------+-----------+-----------+
| Log_name           | File_size | Encrypted |
+--------------------+-----------+-----------+
| atguigu-bin.000001 | 156       | No        |
+--------------------+-----------+-----------+
1 行于数据集 (0.02 秒)
```
所有对数据库的修改都会记录在binlog中。但binlog是二进制文件，无法直接查看，想要更直观的观测它就要借助`mysqlbinlog`命令工具了。指令如下：在查看执行，先执行一条SQL语句，如下

随便做几个增删改操作，我们再执行`SHOW BINARY LOGS;` , 我们会发现File_size变大了；
```bash
update student set name='张三_back' where id=1;
```
开始查看binlog

```bash
# 注意查看的这个文件一定要看最新的
root@b5bc2ea3fb2c:/var/lib/mysql# mysqlbinlog "/var/lib/mysql/atguigu-bin.000001"
# The proper term is pseudo_replica_mode, but we use this compatibility alias
# to make the statement usable on server versions 8.0.24 and older.
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=1*/;
/*!50003 SET @OLD_COMPLETION_TYPE=@@COMPLETION_TYPE,COMPLETION_TYPE=0*/;
DELIMITER /*!*/;
# at 4
#251008 23:58:55 server id 1  end_log_pos 125 CRC32 0x61e1c329  Start: binlog v 4, server v 8.0.27 created 251008 23:58:55 at startup
# Warning: this binlog is either in use or was not closed properly.
ROLLBACK/*!*/;
BINLOG '
P4rmaA8BAAAAeQAAAH0AAAABAAQAOC4wLjI3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAA/iuZoEwANAAgAAAAABAAEAAAAYQAEGggAAAAICAgCAAAACgoKKioAEjQA
CigBKcPhYQ==
'/*!*/;
# at 125
#251008 23:58:55 server id 1  end_log_pos 156 CRC32 0xaf26c362  Previous-GTIDs
# [empty]
# at 156
#251009  0:28:19 server id 1  end_log_pos 235 CRC32 0x603ebf33  Anonymous_GTID  last_committed=0        sequence_number=1     rbr_only=yes    original_committed_timestamp=1759940899272405   immediate_commit_timestamp=1759940899272405  transaction_length=339
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1759940899272405 (2025-10-09 00:28:19.272405 CST)
# immediate_commit_timestamp=1759940899272405 (2025-10-09 00:28:19.272405 CST)
/*!80001 SET @@session.original_commit_timestamp=1759940899272405*//*!*/;
/*!80014 SET @@session.original_server_version=80027*//*!*/;
/*!80014 SET @@session.immediate_server_version=80027*//*!*/;
SET @@SESSION.GTID_NEXT= 'ANONYMOUS'/*!*/;
# at 235
#251009  0:28:19 server id 1  end_log_pos 322 CRC32 0x2e028b2c  Query   thread_id=12    exec_time=0     error_code=0
SET TIMESTAMP=1759940899/*!*/;
SET @@session.pseudo_thread_id=12/*!*/;
SET @@session.foreign_key_checks=1, @@session.sql_auto_is_null=0, @@session.unique_checks=1, @@session.autocommit=1/*!*/;
SET @@session.sql_mode=1168113696/*!*/;
SET @@session.auto_increment_increment=1, @@session.auto_increment_offset=1/*!*/;
/*!\C utf8mb4 *//*!*/;
SET @@session.character_set_client=255,@@session.collation_connection=255,@@session.collation_server=224/*!*/;
SET @@session.time_zone='SYSTEM'/*!*/;
SET @@session.lc_time_names=0/*!*/;
SET @@session.collation_database=DEFAULT/*!*/;
/*!80011 SET @@session.default_collation_for_utf8mb4=255*//*!*/;
BEGIN
/*!*/;
# at 322
#251009  0:28:19 server id 1  end_log_pos 396 CRC32 0x1a3d78f4  Table_map: `hm-trade`.`order` mapped to number 98
# at 396
#251009  0:28:19 server id 1  end_log_pos 464 CRC32 0x64ee3309  Write_rows: table id 98 flags: STMT_END_F

BINLOG '
I5HmaBMBAAAASgAAAIwBAAAAAGIAAAAAAAEACGhtLXRyYWRlAAVvcmRlcgAMCAMBCAERERERERER
BwAAAAAAAADwDwEBIPR4PRo=
I5HmaB4BAAAARAAAANABAAAAAGIAAAAAAAEAAgAM///ABwEAyE5nbcEb4FoBAAIDAAAAAAAAAAFo
5pEjaOaRIwkz7mQ=
'/*!*/;
# at 464
#251009  0:28:19 server id 1  end_log_pos 495 CRC32 0x67f243ac  Xid = 1357
COMMIT/*!*/;
# at 495
#251009  0:28:42 server id 1  end_log_pos 574 CRC32 0xe1964ead  Anonymous_GTID  last_committed=1        sequence_number=2     rbr_only=yes    original_committed_timestamp=1759940922068152   immediate_commit_timestamp=1759940922068152  transaction_length=386
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1759940922068152 (2025-10-09 00:28:42.068152 CST)
# immediate_commit_timestamp=1759940922068152 (2025-10-09 00:28:42.068152 CST)
/*!80001 SET @@session.original_commit_timestamp=1759940922068152*//*!*/;
/*!80014 SET @@session.original_server_version=80027*//*!*/;
/*!80014 SET @@session.immediate_server_version=80027*//*!*/;
SET @@SESSION.GTID_NEXT= 'ANONYMOUS'/*!*/;
# at 574
#251009  0:28:42 server id 1  end_log_pos 670 CRC32 0xdfe894fe  Query   thread_id=12    exec_time=0     error_code=0
SET TIMESTAMP=1759940922/*!*/;
BEGIN
/*!*/;
# at 670
#251009  0:28:42 server id 1  end_log_pos 744 CRC32 0x0860a7dd  Table_map: `hm-trade`.`order` mapped to number 98
# at 744
#251009  0:28:42 server id 1  end_log_pos 850 CRC32 0x81c6dd08  Update_rows: table id 98 flags: STMT_END_F

BINLOG '
OpHmaBMBAAAASgAAAOgCAAAAAGIAAAAAAAEACGhtLXRyYWRlAAVvcmRlcgAMCAMBCAERERERERER
BwAAAAAAAADwDwEBIN2nYAg=
OpHmaB8BAAAAagAAAFIDAAAAAGIAAAAAAAEAAgAM/////8AHAQDITmdtwRvgWgEAAgMAAAAAAAAA
AWjmkSNo5pEjgAcBAMhOZ23BG+BaAQACAwAAAAAAAAACaOaRI2jmkTpo5pE6CN3GgQ==
'/*!*/;
# at 850
#251009  0:28:42 server id 1  end_log_pos 881 CRC32 0xf11d6f94  Xid = 1381
COMMIT/*!*/;
SET @@SESSION.GTID_NEXT= 'AUTOMATIC' /* added by mysqlbinlog */ /*!*/;
DELIMITER ;
# End of log file
/*!50003 SET COMPLETION_TYPE=@OLD_COMPLETION_TYPE*/;
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=0*/;
root@b5bc2ea3fb2c:/var/lib/mysql# 

```
执行结果可以看到，这是一个简单的日志文件，日志中记录了用户的一些操作，这里并没有出现具体的SQL语句，这是因为binlog关键字后面的内容是经过编码后的二进制日志。
这里一个update语句包含如下事件
- Query事件 负责开始一个事务(BEGIN)
- Table_map事件 负责映射需要的表
- Update_rows事件 负责写入数据
- Xid事件 负责结束事务
下面命令将行事件以**伪SQL的形式**表现出来

使用`mysqlbinlog -v`
```bash
root@b5bc2ea3fb2c:/var/lib/mysql# mysqlbinlog -v "/var/lib/mysql/atguigu-bin.000001"
# The proper term is pseudo_replica_mode, but we use this compatibility alias
# to make the statement usable on server versions 8.0.24 and older.
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=1*/;
/*!50003 SET @OLD_COMPLETION_TYPE=@@COMPLETION_TYPE,COMPLETION_TYPE=0*/;
DELIMITER /*!*/;
# at 4
#251008 23:58:55 server id 1  end_log_pos 125 CRC32 0x61e1c329  Start: binlog v 4, server v 8.0.27 created 251008 23:58:55 at startup
# Warning: this binlog is either in use or was not closed properly.
ROLLBACK/*!*/;
BINLOG '
P4rmaA8BAAAAeQAAAH0AAAABAAQAOC4wLjI3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAA/iuZoEwANAAgAAAAABAAEAAAAYQAEGggAAAAICAgCAAAACgoKKioAEjQA
CigBKcPhYQ==
'/*!*/;
# at 125
#251008 23:58:55 server id 1  end_log_pos 156 CRC32 0xaf26c362  Previous-GTIDs
# [empty]
# at 156
#251009  0:28:19 server id 1  end_log_pos 235 CRC32 0x603ebf33  Anonymous_GTID  last_committed=0        sequence_number=1     rbr_only=yes    original_committed_timestamp=1759940899272405   immediate_commit_timestamp=1759940899272405  transaction_length=339
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1759940899272405 (2025-10-09 00:28:19.272405 CST)
# immediate_commit_timestamp=1759940899272405 (2025-10-09 00:28:19.272405 CST)
/*!80001 SET @@session.original_commit_timestamp=1759940899272405*//*!*/;
/*!80014 SET @@session.original_server_version=80027*//*!*/;
/*!80014 SET @@session.immediate_server_version=80027*//*!*/;
SET @@SESSION.GTID_NEXT= 'ANONYMOUS'/*!*/;
# at 235
#251009  0:28:19 server id 1  end_log_pos 322 CRC32 0x2e028b2c  Query   thread_id=12    exec_time=0     error_code=0
SET TIMESTAMP=1759940899/*!*/;
SET @@session.pseudo_thread_id=12/*!*/;
SET @@session.foreign_key_checks=1, @@session.sql_auto_is_null=0, @@session.unique_checks=1, @@session.autocommit=1/*!*/;
SET @@session.sql_mode=1168113696/*!*/;
SET @@session.auto_increment_increment=1, @@session.auto_increment_offset=1/*!*/;
/*!\C utf8mb4 *//*!*/;
SET @@session.character_set_client=255,@@session.collation_connection=255,@@session.collation_server=224/*!*/;
SET @@session.time_zone='SYSTEM'/*!*/;
SET @@session.lc_time_names=0/*!*/;
SET @@session.collation_database=DEFAULT/*!*/;
/*!80011 SET @@session.default_collation_for_utf8mb4=255*//*!*/;
BEGIN
/*!*/;
# at 322
#251009  0:28:19 server id 1  end_log_pos 396 CRC32 0x1a3d78f4  Table_map: `hm-trade`.`order` mapped to number 98
# at 396
#251009  0:28:19 server id 1  end_log_pos 464 CRC32 0x64ee3309  Write_rows: table id 98 flags: STMT_END_F

BINLOG '
I5HmaBMBAAAASgAAAIwBAAAAAGIAAAAAAAEACGhtLXRyYWRlAAVvcmRlcgAMCAMBCAERERERERER
BwAAAAAAAADwDwEBIPR4PRo=
I5HmaB4BAAAARAAAANABAAAAAGIAAAAAAAEAAgAM///ABwEAyE5nbcEb4FoBAAIDAAAAAAAAAAFo
5pEjaOaRIwkz7mQ=
'/*!*/;
### INSERT INTO `hm-trade`.`order`
### SET
###   @1=2000000000000000001
###   @2=88800
###   @3=2
###   @4=3
###   @5=1
###   @6=1759940899
###   @7=NULL
###   @8=NULL
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=1759940899
# at 464
#251009  0:28:19 server id 1  end_log_pos 495 CRC32 0x67f243ac  Xid = 1357
COMMIT/*!*/;
# at 495
#251009  0:28:42 server id 1  end_log_pos 574 CRC32 0xe1964ead  Anonymous_GTID  last_committed=1        sequence_number=2     rbr_only=yes    original_committed_timestamp=1759940922068152   immediate_commit_timestamp=1759940922068152  transaction_length=386
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1759940922068152 (2025-10-09 00:28:42.068152 CST)
# immediate_commit_timestamp=1759940922068152 (2025-10-09 00:28:42.068152 CST)
/*!80001 SET @@session.original_commit_timestamp=1759940922068152*//*!*/;
/*!80014 SET @@session.original_server_version=80027*//*!*/;
/*!80014 SET @@session.immediate_server_version=80027*//*!*/;
SET @@SESSION.GTID_NEXT= 'ANONYMOUS'/*!*/;
# at 574
#251009  0:28:42 server id 1  end_log_pos 670 CRC32 0xdfe894fe  Query   thread_id=12    exec_time=0     error_code=0
SET TIMESTAMP=1759940922/*!*/;
BEGIN
/*!*/;
# at 670
#251009  0:28:42 server id 1  end_log_pos 744 CRC32 0x0860a7dd  Table_map: `hm-trade`.`order` mapped to number 98
# at 744
#251009  0:28:42 server id 1  end_log_pos 850 CRC32 0x81c6dd08  Update_rows: table id 98 flags: STMT_END_F

BINLOG '
OpHmaBMBAAAASgAAAOgCAAAAAGIAAAAAAAEACGhtLXRyYWRlAAVvcmRlcgAMCAMBCAERERERERER
BwAAAAAAAADwDwEBIN2nYAg=
OpHmaB8BAAAAagAAAFIDAAAAAGIAAAAAAAEAAgAM/////8AHAQDITmdtwRvgWgEAAgMAAAAAAAAA
AWjmkSNo5pEjgAcBAMhOZ23BG+BaAQACAwAAAAAAAAACaOaRI2jmkTpo5pE6CN3GgQ==
'/*!*/;
### UPDATE `hm-trade`.`order`
### WHERE
###   @1=2000000000000000001
###   @2=88800
###   @3=2
###   @4=3
###   @5=1
###   @6=1759940899
###   @7=NULL
###   @8=NULL
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=1759940899
### SET
###   @1=2000000000000000001
###   @2=88800
###   @3=2
###   @4=3
###   @5=2
###   @6=1759940899
###   @7=1759940922
###   @8=NULL
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=1759940922
# at 850
#251009  0:28:42 server id 1  end_log_pos 881 CRC32 0xf11d6f94  Xid = 1381
COMMIT/*!*/;
SET @@SESSION.GTID_NEXT= 'AUTOMATIC' /* added by mysqlbinlog */ /*!*/;
DELIMITER ;
# End of log file
/*!50003 SET COMPLETION_TYPE=@OLD_COMPLETION_TYPE*/;
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=0*/;
root@b5bc2ea3fb2c:/var/lib/mysql# 
```
可以看到我们刚刚进行了，insert操作和update操作，这些都是伪sql

前面的命令同时显示binlog格式的语句，使用如下命令不显示它
`mysqlbinlog -v --base64-output=DECODE-ROWS`
```bash
root@b5bc2ea3fb2c:/var/lib/mysql# mysqlbinlog -v --base64-output=DECODE-ROWS  "/var/lib/mysql/atguigu-bin.000001"
# The proper term is pseudo_replica_mode, but we use this compatibility alias
# to make the statement usable on server versions 8.0.24 and older.
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=1*/;
/*!50003 SET @OLD_COMPLETION_TYPE=@@COMPLETION_TYPE,COMPLETION_TYPE=0*/;
DELIMITER /*!*/;
# at 4
#251008 23:58:55 server id 1  end_log_pos 125 CRC32 0x61e1c329  Start: binlog v 4, server v 8.0.27 created 251008 23:58:55 at startup
# Warning: this binlog is either in use or was not closed properly.
ROLLBACK/*!*/;
# at 125
#251008 23:58:55 server id 1  end_log_pos 156 CRC32 0xaf26c362  Previous-GTIDs
# [empty]
# at 156
#251009  0:28:19 server id 1  end_log_pos 235 CRC32 0x603ebf33  Anonymous_GTID  last_committed=0        sequence_number=1     rbr_only=yes    original_committed_timestamp=1759940899272405   immediate_commit_timestamp=1759940899272405  transaction_length=339
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1759940899272405 (2025-10-09 00:28:19.272405 CST)
# immediate_commit_timestamp=1759940899272405 (2025-10-09 00:28:19.272405 CST)
/*!80001 SET @@session.original_commit_timestamp=1759940899272405*//*!*/;
/*!80014 SET @@session.original_server_version=80027*//*!*/;
/*!80014 SET @@session.immediate_server_version=80027*//*!*/;
SET @@SESSION.GTID_NEXT= 'ANONYMOUS'/*!*/;
# at 235
#251009  0:28:19 server id 1  end_log_pos 322 CRC32 0x2e028b2c  Query   thread_id=12    exec_time=0     error_code=0
SET TIMESTAMP=1759940899/*!*/;
SET @@session.pseudo_thread_id=12/*!*/;
SET @@session.foreign_key_checks=1, @@session.sql_auto_is_null=0, @@session.unique_checks=1, @@session.autocommit=1/*!*/;
SET @@session.sql_mode=1168113696/*!*/;
SET @@session.auto_increment_increment=1, @@session.auto_increment_offset=1/*!*/;
/*!\C utf8mb4 *//*!*/;
SET @@session.character_set_client=255,@@session.collation_connection=255,@@session.collation_server=224/*!*/;
SET @@session.time_zone='SYSTEM'/*!*/;
SET @@session.lc_time_names=0/*!*/;
SET @@session.collation_database=DEFAULT/*!*/;
/*!80011 SET @@session.default_collation_for_utf8mb4=255*//*!*/;
BEGIN
/*!*/;
# at 322
#251009  0:28:19 server id 1  end_log_pos 396 CRC32 0x1a3d78f4  Table_map: `hm-trade`.`order` mapped to number 98
# at 396
#251009  0:28:19 server id 1  end_log_pos 464 CRC32 0x64ee3309  Write_rows: table id 98 flags: STMT_END_F
### INSERT INTO `hm-trade`.`order`
### SET
###   @1=2000000000000000001
###   @2=88800
###   @3=2
###   @4=3
###   @5=1
###   @6=1759940899
###   @7=NULL
###   @8=NULL
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=1759940899
# at 464
#251009  0:28:19 server id 1  end_log_pos 495 CRC32 0x67f243ac  Xid = 1357
COMMIT/*!*/;
# at 495
#251009  0:28:42 server id 1  end_log_pos 574 CRC32 0xe1964ead  Anonymous_GTID  last_committed=1        sequence_number=2     rbr_only=yes    original_committed_timestamp=1759940922068152   immediate_commit_timestamp=1759940922068152  transaction_length=386
/*!50718 SET TRANSACTION ISOLATION LEVEL READ COMMITTED*//*!*/;
# original_commit_timestamp=1759940922068152 (2025-10-09 00:28:42.068152 CST)
# immediate_commit_timestamp=1759940922068152 (2025-10-09 00:28:42.068152 CST)
/*!80001 SET @@session.original_commit_timestamp=1759940922068152*//*!*/;
/*!80014 SET @@session.original_server_version=80027*//*!*/;
/*!80014 SET @@session.immediate_server_version=80027*//*!*/;
SET @@SESSION.GTID_NEXT= 'ANONYMOUS'/*!*/;
# at 574
#251009  0:28:42 server id 1  end_log_pos 670 CRC32 0xdfe894fe  Query   thread_id=12    exec_time=0     error_code=0
SET TIMESTAMP=1759940922/*!*/;
BEGIN
/*!*/;
# at 670
#251009  0:28:42 server id 1  end_log_pos 744 CRC32 0x0860a7dd  Table_map: `hm-trade`.`order` mapped to number 98
# at 744
#251009  0:28:42 server id 1  end_log_pos 850 CRC32 0x81c6dd08  Update_rows: table id 98 flags: STMT_END_F
### UPDATE `hm-trade`.`order`
### WHERE
###   @1=2000000000000000001
###   @2=88800
###   @3=2
###   @4=3
###   @5=1
###   @6=1759940899
###   @7=NULL
###   @8=NULL
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=1759940899
### SET
###   @1=2000000000000000001
###   @2=88800
###   @3=2
###   @4=3
###   @5=2
###   @6=1759940899
###   @7=1759940922
###   @8=NULL
###   @9=NULL
###   @10=NULL
###   @11=NULL
###   @12=1759940922
# at 850
#251009  0:28:42 server id 1  end_log_pos 881 CRC32 0xf11d6f94  Xid = 1381
COMMIT/*!*/;
SET @@SESSION.GTID_NEXT= 'AUTOMATIC' /* added by mysqlbinlog */ /*!*/;
DELIMITER ;
# End of log file
/*!50003 SET COMPLETION_TYPE=@OLD_COMPLETION_TYPE*/;
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=0*/;
root@b5bc2ea3fb2c:/var/lib/mysql# 
```

关于mysqlbinlog工具的使用技巧还有很多，例如只解析对某个库的操作或者某个时间段内的操作等。简单分享几个常用的语句，更多操作可以参考官方文档。
```bash
# 可查看参数帮助
mysqlbinlog --no-defaults --help
# 查看最后100行
mysqlbinlog --no-defaults --base64-output=decode-rows -vv atguigu-bin.000002 |tail
-100
# 根据position查找
mysqlbinlog --no-defaults --base64-output=decode-rows -vv atguigu-bin.000002 |grep -A
20 '4939002'
```
上面这种办法读取出binlog日志的全文内容比较多，不容易分辨查看到pos点信息，下面介绍一种更为方便的查询命令：
```bash
mysql> show binlog events [IN 'log_name'] [FROM pos] [LIMIT [offset,] row_count];
```
- `IN 'log_name'` ：指定要查询的binlog文件名（不指定就是第一个binlog文件）
- `FROM pos` ：指定从哪个pos起始点开始查起（不指定就是从整个文件首个pos点开始算）
- `LIMIT [offset]` ：偏移量(不指定就是0)
- `row_count` :查询总条数（不指定就是所有行）

:::tip
show binlog events该指令是在mysql下跑的

而mysqlbinlog是在宿主机跑的

:::

```bash
mysql> SHOW BINARY LOGS;
+--------------------+-----------+-----------+
| Log_name           | File_size | Encrypted |
+--------------------+-----------+-----------+
| atguigu-bin.000001 |       881 | No        |
+--------------------+-----------+-----------+
1 row in set (0.00 sec)

mysql> SHOW BINLOG EVENTS IN 'atguigu-bin.000001';
+--------------------+-----+----------------+-----------+-------------+--------------------------------------+
| Log_name           | Pos | Event_type     | Server_id | End_log_pos | Info                                 |
+--------------------+-----+----------------+-----------+-------------+--------------------------------------+
| atguigu-bin.000001 |   4 | Format_desc    |         1 |         125 | Server ver: 8.0.27, Binlog ver: 4    |
| atguigu-bin.000001 | 125 | Previous_gtids |         1 |         156 |                                      |
| atguigu-bin.000001 | 156 | Anonymous_Gtid |         1 |         235 | SET @@SESSION.GTID_NEXT= 'ANONYMOUS' |
| atguigu-bin.000001 | 235 | Query          |         1 |         322 | BEGIN                                |
| atguigu-bin.000001 | 322 | Table_map      |         1 |         396 | table_id: 98 (hm-trade.order)        |
| atguigu-bin.000001 | 396 | Write_rows     |         1 |         464 | table_id: 98 flags: STMT_END_F       |
| atguigu-bin.000001 | 464 | Xid            |         1 |         495 | COMMIT /* xid=1357 */                |
| atguigu-bin.000001 | 495 | Anonymous_Gtid |         1 |         574 | SET @@SESSION.GTID_NEXT= 'ANONYMOUS' |
| atguigu-bin.000001 | 574 | Query          |         1 |         670 | BEGIN                                |
| atguigu-bin.000001 | 670 | Table_map      |         1 |         744 | table_id: 98 (hm-trade.order)        |
| atguigu-bin.000001 | 744 | Update_rows    |         1 |         850 | table_id: 98 flags: STMT_END_F       |
| atguigu-bin.000001 | 850 | Xid            |         1 |         881 | COMMIT /* xid=1381 */                |
+--------------------+-----+----------------+-----------+-------------+--------------------------------------+
12 rows in set (0.01 sec)

mysql> SHOW BINLOG EVENTS IN 'atguigu-bin.000001' from 235 limit 0,1;
+--------------------+-----+------------+-----------+-------------+-------+
| Log_name           | Pos | Event_type | Server_id | End_log_pos | Info  |
+--------------------+-----+------------+-----------+-------------+-------+
| atguigu-bin.000001 | 235 | Query      |         1 |         322 | BEGIN |
+--------------------+-----+------------+-----------+-------------+-------+
1 row in set (0.00 sec)

mysql> SHOW BINLOG EVENTS IN 'atguigu-bin.000001' from 235 limit 0,2;
+--------------------+-----+------------+-----------+-------------+-------------------------------+
| Log_name           | Pos | Event_type | Server_id | End_log_pos | Info                          |
+--------------------+-----+------------+-----------+-------------+-------------------------------+
| atguigu-bin.000001 | 235 | Query      |         1 |         322 | BEGIN                         |
| atguigu-bin.000001 | 322 | Table_map  |         1 |         396 | table_id: 98 (hm-trade.order) |
+--------------------+-----+------------+-----------+-------------+-------------------------------+
2 rows in set (0.00 sec)

mysql> 
```
上面这条语句可以将指定的binlog日志文件，分成有效事件行的方式返回，并可使用limit指定pos点的起始偏移，查询条数。其它举例：
```bash
#a、查询第一个最早的binlog日志：
show binlog events\G;
#b、指定查询mysql-bin.000002这个文件
show binlog events in 'atguigu-bin.000002'\G;
#c、指定查询mysql-bin.000002这个文件，从pos点:391开始查起：
show binlog events in 'atguigu-bin.000002' from 391\G;
#d、指定查询mysql-bin.000002这个文件，从pos点:391开始查起，查询5条（即5条语句）
show binlog events in 'atguigu-bin.000002' from 391 limit 5\G;
#e、指定查询 mysql-bin.000002这个文件，从pos点:391开始查起，偏移2行（即中间跳过2个）查询5条（即5条语句）。
show binlog events in 'atguigu-bin.000002' from 391 limit 2,5\G;
```

上面我们讲了这么多都是基于binlog的默认格式，binlog格式查看
```bash
mysql> show variables like 'binlog_format';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| binlog_format | ROW   |
+---------------+-------+
1 行于数据集 (0.02 秒)
```

除此之外，binlog还有2种格式，分别是 Statement 和 Mixed
- Statement
每一条会修改数据的sql都会记录在binlog中。
优点：不需要记录每一行的变化，减少了binlog日志量，节约了IO，提高性能。
- Row
5.1.5版本的MySQL才开始支持row level 的复制，它不记录sql语句上下文相关信息，仅保存哪条记录被修改。
优点：row level 的日志内容会非常清楚的记录下每一行数据修改的细节。而且不会出现某些特定情况下 的存储过程，或function，以及trigger的调用和触发无法被正确复制的问题。
- Mixed
从5.1.8版本开始，MySQL提供了Mixed格式，实际上就是Statement与Row的结合。

:::info
Statement是在binlog中把每一个有变更的sql都记录下来，只记录变更的sql

Row记录的是，比如一个update的sql，Statement记录的是update语句，而Row会记录这个10条语句都改了什么(假如修改了10条记录)；
:::


### 使用日志恢复数据


### 删除二进制日志


### 其他场景