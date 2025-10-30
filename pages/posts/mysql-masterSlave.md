---
title: MySQL - 主从复制
categories: 数据库
tags:
  - MySQL
  - 后端
  - 数据库
  - 主从复制
---

## 主从复制概述



### 如何提升数据库并发能力
在实际工作中，我们常常将 `Redis` 作为缓存与 `MySQL` 配合来使用，当有请求的时候，首先会从缓存中进行查找，如果存在就直接取出。如果不存在再访问数据库，这样就`提升了读取的效率`，也减少了对后端数据库的`访问压力`。Redis 的缓存架构是`高并发架构`中非常重要的一环。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-27_22-29-43.png)

此外，一般应用对数据库而言都是“`读多写少`”，也就说对数据库读取数据的压力比较大，有一个思路就是采用数据库集群的方案，做`主从架构`、进行`读写分离`，这样同样可以提升数据库的并发处理能力。但并不是所有的应用都需要对数据库进行主从架构的设置，毕竟设置架构本身是有成本的。

如果我们的目的在于提升数据库高并发访问的效率，那么首先考虑的是如何`优化SQL和索引`，这种方式简单有效；其次才是采用`缓存的策略`，比如使用Redis将热点数据保存在内存数据库中，提升读取的效率；最后才是对数据库采用`主从架构`，进行读写分离。

按照上面的方式进行优化，使用和维护的成本是由低到高的。



### 主从复制的作用

主从同步设计不仅可以提高数据库的吞吐量，还有以下3个方面的作用。

**第1个作用：读写分离**。我们可以通过主从复制的方式来`同步数据`，然后通过读写分离提高数据库并发处理能力。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-27_22-40-50.png)

其中一个是Master主库，负责写入数据，我们称之为：写库。

其它都是Slave从库，负责读取数据，我们称之为：读库。

当主库进行更新的时候，会自动将数据复制到从库中，而我们在客户端读取数据的时候，会从从库中进行读取。

面对“`读多写少`”的需求，采用读写分离的方式，可以实现`更高的并发访问`。同时，我们还能对从服务器进行`负载均衡`，让不同的读请求按照策略均匀地分发到不同的从服务器上，让`读取更加顺畅`。读取顺畅的另一个原因，就是`减少了锁表`的影响，比如我们让主库负责写，当主库出现写锁的时候，不会影响到从库进行 SELECT 的读取。

**第2个作用就是数据备份**。我们通过主从复制将主库上的数据复制到了从库上，相当于是一种`热备份机制`，也就是在主库正常运行的情况下进行的备份，不会影响到服务。

**第3个作用是具有高可用性**。数据备份实际上是一种冗余的机制，通过这种冗余的方式可以换取数据库的高可用性，也就是当服务器出现`故障`或`宕机`的情况下，可以`切换`到从服务器上，保证服务的正常运行。

关于高可用性的程度，我们可以用一个指标衡量，即正常可用时间/全年时间。比如要达到全年99.999%的时间都可用，就意味着系统在一年中的不可用时间不得超过`365*24*60*（1-99.999%）=5.256`分钟（含系统崩溃的时间、日常维护操作导致的停机时间等），其他时间都需要保持可用的状态。

实际上，更高的高可用性，意味着需要付出更高的成本代价。在现实中我们需要结合业务需求和成本来进行选择。

## 主从复制的原理

`Slave` 会从 `Master` 读取 `binlog` 来进行数据同步。


### 原理剖析

**三个线程**

实际上主从同步的原理就是基于 `binlog` 进行数据同步的。在主从复制过程中，会基于 `3 个线程`来操作，一个主库线程，两个从库线程。
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-27_23-05-00.png)

`二进制日志转储线程`（Binlog dump thread）是一个主库线程。当从库线程连接的时候，主库可以将二进制日志发送给从库，当主库读取事件（Event）的时候，会在 Binlog 上`加锁`，读取完成之后，再将锁释放掉。

`从库 I/O 线程`会连接到主库，向主库发送请求更新 Binlog。这时从库的 I/O 线程就可以读取到主库的二进制日志转储线程发送的 Binlog 更新部分，并且拷贝到本地的中继日志（Relay log）。

`从库 SQL 线程`会读取从库中的中继日志，并且执行日志中的事件，将从库中的数据与主库保持同步。


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-27_23-05-48.png)

:::warning
注意：
不是所有版本的 MySQL 都默认开启服务器的二进制日志。在进行主从同步的时候，我们需要先检查服务器是否已经开启了二进制日志。

除非特殊指定，默认情况下从服务器会执行所有主服务器中保存的事件。也可以通过配置，使从服务器执行特定的事件。
:::

**复制三步骤**

- 步骤1：`Master` 将写操作记录到二进制日志（`binlog`）。这些记录叫做**二进制日志事件**(binary log events)；
- 步骤2：`Slave` 将 `Master` 的 binary log events 拷贝到它的中继日志（`relay log`）；
- 步骤3：`Slave` 重做中继日志中的事件，将改变应用到自己的数据库中。MySQL复制是异步的且串行化的，而且重启后从`接入点`开始复制。

**复制的问题**

复制的最大问题：`延时`。

### 复制的基本原则

- 每个 `Slave` 只有一个 `Master`
- 每个 `Slave` 只能有一个唯一的服务器 ID
- 每个 `Master` 可以有多个 `Slave`


## 一主一从架构搭建

一台主机用于处理所有写请求，一台从机负责所有读请求，架构图如下：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-30_21-02-17.png)




### 准备工作

1. 准备 2 台 CentOS 虚拟机 
2. 每台虚拟机上需要安装好MySQL (可以是MySQL8.0 )

说明: 前面我们讲过如何克隆一台CentOS。大家可以在一台CentOS上安装好MySQL, 进而通过克隆的方式复制出1台包含MySQL的虚拟机。

注意: 克隆的方式需要修改新克隆出来主机的: ① MAC地址 ② hostname ③ IP 地址 ④ UUID 。

此外, 克隆的方式生成的虚拟机 (包含MySQL Server), 则克隆的虚拟机MySQL Server的UUID相同, 必须修改, 否则在有些场景会报错。比如:
`show slave status\G` , 报如下的错误:

```
Last_IO_Error: Fatal error: The slave I/O thread stops because master and slave have equal
MySQL server UUIDs; these UUIDs must be different for replication to work.
```
修改MySQL Server的UUID方式:

```bash
vim /var/lib/mysql/auto.cnf

# 重启mysql服务
systemctl restart mysqld
```

---

*克隆虚拟机*

在如下界面中，先不要启动centos虚拟机，先点击克隆按钮；（前提我们已有的centos虚拟机都已经安装好MySQL）
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-30_21-43-20.png)

**生成新的mac地址**
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-30_21-30-16.png)

**修改主机名**

开机后修改主机名称(这步不用改也可以)

修改主机名可能不同linux版本不同,修改方法也不同。centos就是`vim /etc/hostname` 命令来编辑主机名。

需要重启。(`reboot`)

**修改IP地址**

此处需要注意的是：如果虚拟机使用的是动态ip分配，那么不需要更改ip，如果想改为静态ip，请修改：
`vim /etc/sysconfig/network-scripts/ifcfg-ens33`
在此文件中修改UUID和IP地址即可。(IPADDR和UUID)

**修改UUID**

同样在修改IP地址的路径中修改即可，重启我们的网络

`systemctl restart network`

### 主机配置文件
建议mysql版本一致且后台以服务运行，主从所有配置项都配置在 [mysqld] 节点下，且都是小写字母。
具体参数配置如下：

- 必选
```bash
# 主服务器唯一id
server-id=1

# 启用二进制日志，指明路径。比如：自己的本地路径/log/mysqlbin
log-bin=atguigu-bin # 二进制日志文件名
```

- 可选
```bash
0（默认）表示读写（主机），1表示只读（从机）
read-only=0

# 设置日志文件保留时长，单位是秒
binlog_expire_logs_seconds=6000

# 控制单个二进制日志大小。此参数的最大和默认值值1GB
max_binlog_size=200M

# [可选]设置不要复制的数据库，表示针对某些库的修改操作就不要记录到binlog文件里
binlog-ignore-db=test
# [可选]设置需要复制的数据库,默认全部记录。比如:binlog-do-db=atguigu_master_slave
binlog-do-db=需要复制的主数据库名字
# [可选]设置binlog格式
binlog_format=STATEMENT
```
重启后台mysql服务，是配置生效

配置完成后
```bash
:wq # 保存并退出
systemctl restart mysqld # 重启mysql服务
```


:::warning
注意：

先搭建完主从复制，再创建数据库。

MySQL主从复制起始时，从机不继承主机数据。

```bash
binlog-do-db=需要复制的主数据库名字
注意这里配置的数据库，先不要创建，等从机配置完成后再执行create语句进行创建
```

:::

[binlog格式设置](https://www.bilibili.com/video/BV1iq4y1u7vj?spm_id_from=333.788.player.switch&vd_source=da7c7c4a886275716b7ca33f532f1905&p=193)


### 从机配置文件
要求主从所有配置项都配置在 `my.cnf` 的 `[mysqld]` 栏位下，且都是小写字母。

- 必选
```bash
# 从服务器唯一ID
server-id=2
```

- 可选
```bash
# 启用中继日志
relay-log=mysql-relay
```
重启后台mysql服务，使配置生效
:::warning
主从机都关闭防火墙，否则会导致复制失败。

```bash
service iptables stop # centos6

systemctl stop firewalld.service # centos7
```
:::


### 主机：建立账户并授权

如果是mysql5.5或者5.7直接执行一条指令即可
```bash
#在主机MySQL里执行授权主从复制的命令
GRANT REPLICATION SLAVE ON *.* TO 'slave1'@'从机器数据库IP' IDENTIFIED BY 'abc123'; #5.5,5.7
```

注意：如果使用的是MySQL8，需要如下的方式建立账户，并授权slave:
```bash
CREATE USER 'slave1'@'%' IDENTIFIED BY '123456';

GRANT REPLICATION SLAVE ON *.* TO 'slave1'@'%';

#此语句必须执行。否则见下面。(这里的密码别写错了要与上面的一致)
ALTER USER 'slave1'@'%' IDENTIFIED WITH mysql_native_password BY '123456';

# 刷新权限
flush privileges;
```

:::warning
注意：在从机执行show slave status\G时报错：

Last_IO_Error: error connecting to master 'slave1@192.168.1.150:3306' - retry-time: 60 retries: 1 message:

Authentication plugin 'caching_sha2_password' reported error: Authentication requires secure connection.
:::
查询Master的状态，并记录下File和Position的值。
```bash
# 获取主从复制的起点
show master status;
```
- 记录下File和Position的值
>注意：执行完此步骤后不要再操作主服务器MySQL，防止主服务器状态值变化。



### 从机：配置需要复制的主机
**步骤1：** 从机上复制主机的命令
```bash
CHANGE MASTER TO
MASTER_HOST='主机的IP地址',
MASTER_USER='主机用户名',
MASTER_PASSWORD='主机用户名的密码',
MASTER_LOG_FILE='mysql-bin.具体数字',
MASTER_LOG_POS=具体值;
```
命令举例：
```bash
# 在mysql中执行：
CHANGE MASTER TO
MASTER_HOST='192.168.1.150',MASTER_USER='slave1',MASTER_PASSWORD='123456',MASTER_LOG_FILE='atguigu-bin.000007',MASTER_LOG_POS=154;

# MASTER_LOG_FILE和MASTER_LOG_FILE均为上面记录的值
```
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-30_22-24-36.png)

:::tip
如果之前做过主从的配置，而且从机还开着呢，那么执行该命令会报错，如果要重新配置的话一定要先进行stop
:::


**步骤2：**
```bash
#启动slave同步
START SLAVE;
```
如果报错：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-30_22-30-20.png)

可以执行如下操作，删除之前的relay_log信息。然后重新执行 CHANGE MASTER TO... 语句即可。
```bash
reset slave; # 删除SLAVE数据库的relaylog日志文件，并重新启用新的relaylog文件

# 如果没有报错就不用执行这条命令了。
```
接着查看同步状态
```bash
show slave status\G;
```
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-30_22-33-19.png)
>上面两个参数都是Yes，则说明主从配置成功！

此时就搭建完成了，我们可以在主机执行
```bash
create database xxx;

# 这里配置的数据库名：binlog-do-db=需要复制的主数据库名字
```

显式如下的情况，就是不正确的。可能错误的原因有：
1. 网络不通
2. 账户密码错误
3. 防火墙
4. mysql配置文件问题
5. 连接服务器时语法
6. 主服务器mysql权限

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-10-30_22-34-37.png)



### 测试

建完数据库后我们在主服务器上插入数据，然后在从机上查看是否同步。


### 停止主从同步

- 停止主从同步命令
```bash
# 从机上执行
stop slave;
```

- 如何重新配置主从
```bash
start slave;

show slave status\G;
```

如果停止从服务器复制功能，再使用。需要重新配置主从。否则会报错如下:
```
ERROR 3021 (HY000): This operation cannot be performed with a running slave io thread; run STOP SLAVE IO THREAD FOR CHANNEL '' first.
```
重新配置主从，需要在从机上执行：
```bash
stop slave;
reset master; #删除Master中所有的binglog文件，并将日志索引文件清空，重新开始所有新的日志文件(慎用)
```

