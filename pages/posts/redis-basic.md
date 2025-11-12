---
title: Redis - 基础
categories: 数据库
tags:
  - Redis
  - 后端
  - 数据库
  - NoSQL
---


##  初识Redis

Redis是一种键值型的NoSQL数据库，这里有两个关键字

- 键值型
- NoSQL

其中键值型是指Redis中存储的数据都是以Key-Value键值对的形式存储，而Value的形式多种多样，可以使字符串、数值甚至Json

而NoSQL则是相对于传统关系型数据库而言，有很大差异的一种数据库



### 认识NoSQL

`NoSql`可以翻译做Not Only Sql（不仅仅是SQL），或者是No Sql（非Sql的）数据库。是相对于传统关系型数据库而言，有很大差异的一种特殊的数据库，因此也称之为`非关系型数据库`。


#### 结构化与非结构化

传统关系型数据库是结构化数据，每张表在创建的时候都有严格的约束信息，如字段名、字段数据类型、字段约束等，插入的数据必须遵循这些约束

而NoSQL则对数据库格式没有约束，可以是键值型，也可以是文档型，甚至是图格式



#### 关联与非关联


传统数据库的表与表之间往往存在关联，例如外键约束

而非关系型数据库不存在关联关系，要维护关系要么靠代码中的业务逻辑，要么靠数据之间的耦合

```json
{
  id: 1,
  name: "张三",
  orders: [
    {
       id: 1,
       item: {
	 id: 10, title: "荣耀6", price: 4999
       }
    },
    {
       id: 2,
       item: {
	 id: 20, title: "小米11", price: 3999
       }
    }
  ]
}
```


例如此处要维护张三与两个手机订单的关系，不得不冗余的将这两个商品保存在张三的订单文档中，不够优雅，所以建议使用业务逻辑来维护关联关系


#### 查询方式


传统关系型数据库会基于Sql语句做查询，语法有统一的标准
```sql
SELECT id, age FROM tb_user WHERE id = 1
```

而不同的非关系型数据库查询语法差异极大
```
Redis:  get user:1
MongoDB: db.user.find({_id: 1})
elasticsearch:  GET http://localhost:9200/users/1
```

#### 事务

传统关系型数据库能满足事务的ACID原则(原子性、一致性、独立性及持久性)

而非关系型数据库汪汪不支持事务，或者不能要个保证ACID的特性，只能实现计本的一致性


**总结**

| 特性         | SQL                                      | NoSQL                                      |
|--------------|------------------------------------------|--------------------------------------------|
| 数据结构     | 结构化 (Structured)                      | 非结构化                                   |
| 数据关联     | 关联的 (Relational)                      | 无关联的                                   |
| 查询方式     | SQL 查询                                 | 非SQL                                      |
| 事务特性     | ACID                                     | BASE                                       |
| 存储方式     | 磁盘                                     | 内存                                       |
| 扩展性       | 垂直                                     | 水平                                       |
| 使用场景     | 1) 数据结构固定<br>2) 对一致性、安全性要求不高 | 1) 数据结构不固定<br>2) 相关业务对数据安全性、一致性要求较高<br>3) 对性能要求高 |



**存储方式**
- 关系型数据库基于磁盘进行存储，会有大量的磁盘IO，对性能有一定影响
- 非关系型数据库，他们的操作更多的是依赖于内存来操作，内存的读写速度会非常快，性能自然会好一些

**扩展性**
- 关系型数据库集群模式一般是主从，主从数据一致，起到数据备份的作用，称为垂直扩展。
- 非关系型数据库可以将数据拆分，存储在不同机器上，可以保存海量数据，解决内存大小有限的问题。称为水平扩展。
- 关系型数据库因为表之间存在关联关系，如果做水平扩展会给数据查询带来很多麻烦



### 认识Redis


Redis诞生于2009年全称是Remote Dictionary Server，远程词典服务器，是一个基于内存的键值型NoSQL数据库(使用C语言编写)。

特征：
- 键值（key-value）型，value支持多种不同数据结构，功能丰富
- 单线程，每个命令具备原子性
- 低延迟，速度快(基于内存、IO多路复用、良好的编码)
- 支持数据持久化
- 支持主从集群、分片集群
- 支持多语言客户端

作者：Antirez [博客地址](http://oldblog.antirez.com/)

Redis官网：https://redis.io/

:::info
**Redis6.0已经变多线程了?**

这是因为Redis6.0的多线程仅仅是在对于网络请求处理这块，而核心的命令的执行这一部分依然是单线程，所以说Redis6.0它是单线程也是没有问题的。

:::


### 安装Redis



:::tip
Redis的作者根本就没有编写Windows版本的Redis，网上的win版本redis并不是官方提供的，而是微软自己编译的
:::


先安装[VMware](https://zhuanlan.zhihu.com/p/19963662677)

再安装[镜像](https://www.cnblogs.com/tanghaorong/p/13210794.html)


#### 单机安装Redis


**安装Redis依赖**
```bash
yum install -y gcc tcl
```

如果用不了，参考这个：[新装 CentOS 7 切换 yum 源](https://www.cnblogs.com/slgkaifa/p/19141048)

**上传安装包并解压**

tar.gz包下载地址：https://redis.io/downloads/

将该包上传到`/user/local/src`目录

解压：
```bash
[root@localhost /]# cd /usr/local/src
[root@localhost src]# ll
总用量 2440
-rw-r--r--. 1 root root 2496149 11月 11 22:56 redis-6.2.14.tar.gz
[root@localhost src]# tar -zxvf redis-6.2.14.tar.gz
```


进入redis目录
```bash
cd redis-6.2.14
```


运行编译命令
```bash
make && make install
```

如果没有出错，应该就安装成功了。


默认的安装路径是在/usr/Local/bin目录下：

该目录以及默认配置到环境变量，因此可以在任意目录下运行这些命令。其中：
- redis-cli:是redis提供的命令行客户端
- redis-server：是redis的服务端启动脚本
- redis-sentinel：是redis的哨兵启动脚本


#### 启动方式

redis的启动方式有很多种，例如：
- 默认启动
- 指定配置启动
- 开机自启



##### 默认启动

进入redis安装目录，执行redis-server
```bash
cd redis-6.2.14

redis-server
```
这是前台启动方式，如果退出，redis就停止了。


##### 指定配置启动

如果要让Redis以后台方式启动，则必须修改Redis配置文件，就在我们之前解压的redis安装包下
（`/usr/local/src/redis-6.2.6`），名字叫redis.conf:

```bash
cp redis.conf redis.conf.bck
```

然后修改redis.conf文件中的一些配置：

```bash
#允许访问的地址，默认是127.0.0.1，会导致只能在本地访问。修改为0.0.0.0则可以在任意IP访问，生产环境不要设置为0.0.0.0
bind 0.0.0.0
# 守护进程，修改为yes后即可后台运行
daemonize yes

# 密码，设置后访可Redis必须输入密码
requirepass 123321
```
Redis的其它常见配置：
```bash
#监听的端口
port 6379
#工作目录，默认是当前日录，也就是运行redis-server时的命令，日志、持久化等文件会保存在这个目录
dir .
# 数据库数量，设置为1，代表只使用1个库，默认有16个库，编号0~15
databases 1
#设置redis能够使用的最大内存
maxmemory 512mb
#日志文件，默认为空，不记录日志，可以指定日志文件名(日志的位置就在dir所指定的位置)
logfile "redis.log"
```

启动Redis:
```bash
# 进入redis安装目录
cd /usr/local/src/redis-6.2.14

# 启动redis
redis-server redis.conf

 # 查看redis进程是否启动成功
ps -ef|grep redis

# 杀掉redis进程
kill -9 pid


```

##### 开机自启

我们也可以通过配置来实现开机自启。

首先，新建一个系统服务文件：

```bash
vi /etc/systemd/system/redis.service
```
内容如下

```ini
[Unit]
Description=redis-server
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/bin/redis-server /usr/local/src/redis-6.2.14/redis.conf
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

然后重载系统服务：

```bash
systemctl daemon-reload
```

现在，我们可以用下面这组命令来操作redis了：
```bash
# 启动redis
systemctl start redis

# 查看运行状态
systemctl status redis

# 停止redis
systemctl stop redis

# 重启redis
systemctl restart redis

systemctl enable redis # 设置开机自启

# 关闭开机自启(disable 不会停止当前正在运行的服务，只影响下次开机。如果你想立即停止服务 + 禁用自启，需要两个命令一起用。)
systemctl disable redis

```


---

**说明**

> 这是一个典型的 systemd 服务配置文件，用于在 Linux 系统上开机自启 Redis 服务。
> 其中：
> - `ExecStart` 指定了启动命令和配置文件路径；
> - `After=network.target` 表示在网络启动后运行；
> - `WantedBy=multi-user.target` 表示开机时启用该服务。



#### Redis客户端


安装完成Redis，我们就可以操作Redis，实现数据的CRUD了。这需要用到Redis客户端，包括：
- 命令行客户端
- 图形化桌面客户端
- 编程客户端



##### Redis命令行客户端

Redis安装完成后就自带了命令行客户端：redis-cli，使用方式如下：

```bash
redis-cli [options] [command]
```

常见的options有
- `-h 127.0.0.1`: 指定要连接的redis节点的IP地址，默认是`127.0.0.1`
- `-p 6379`: 指定要连接的redis节点的端口，默认是`6379`
- `-a 123123`: 指定要连接的redis节点的密码

其中的commonds就是Redis的操作命令，例如：
- `ping`：与redis服务端做心跳测试，服务端正常会返回`pong`

不指定commond时，会进入`redis-cLi`的交互控制台：
```bash
redis-cli

redis-cli -a 密码

127.0.0.1:6379> ping
PONG

127.0.0.1:6379> set name jack
OK
127.0.0.1:6379> get name
"jack"

```
或者
```bash
[root@192 redis-6.2.14]# redis-cli
127.0.0.1:6379> get name
(error) NOAUTH Authentication required.
127.0.0.1:6379> Auth 密码
OK
```


##### 图形化桌面客户端


GitHub上的大神编写了Redis的图形化桌面客户端，地址：https://github.com/uglide/RedisDesktopManager

不过该仓库提供的是RedisDesktopManager的源码，并未提供windows安装包。

在下面这个仓库可以找到安装包：https://github.com/lework/RedisDesktopManager-Windows/releases


或者使用这个[现代化Redis桌面客户端](https://redis.tinycraft.cc/zh/)

- 如果连不上，设置防火墙
```bash
# 永久放行 Redis 端口（6379）
firewall-cmd --permanent --add-port=6379/tcp

# 重载防火墙规则
firewall-cmd --reload

# 验证端口是否已开放
firewall-cmd --list-ports | grep 6379
```


## Redis命令


### Redis数据结构介绍

Redis是一个key-value的数据库，key一般是String类型，不过value的类型多种多样：

# Redis 数据类型分类

| 类型       | 示例值                          | 分类     |
|------------|----------------------------------|----------|
| String     | `hello world`                   | 基本类型 |
| Hash       | `{name: "Jack", age: 21}`       | 基本类型 |
| List       | `[A -> B -> C -> C]`            | 基本类型 |
| Set        | `{A, B, C}`                     | 基本类型 |
| SortedSet  | `{A: 1, B: 2, C: 3}`            | 基本类型 |
| GEO        | `{A: (120.3, 30.5)}`            | 特殊类型 |
| BitMap     | `0110110101110101011`           | 特殊类型 |
| HyperLog   | `0110110101110101011`           | 特殊类型 |

> 📌 **说明：**
>
> - **基本类型**：String、Hash、List、Set、SortedSet 是 Redis 最常用的五种数据结构。
> - **特殊类型**：GEO（地理位置）、BitMap（位图）、HyperLog（基数估算）是基于基础结构封装的高级功能，用于特定场景优化。

Redis为了方便我们学习，将操作不同数据类型的命令也做了分组，在官网  https://redis.io/commands  可以查看
到不同的命令

### Redis通用命令

通用指令是部分数据类型的，都可以使用的指令，常见的有：

- **KEYS**：查看符合模板的所有 key，<span style="color: red;">不建议在生产环境设备上使用</span>
- **DEL**：删除一个指定的 key
- **EXISTS**：判断 key 是否存在
- **EXPIRE**：给一个 key 设置有效期，有效期到期时该 key 会被自动删除
- **TTL**：查看一个 KEY 的剩余有效期

通过 `help [command]` 可以查看一个命令的具体用法，例如：


**KEYS命令：**
```bash
127.0.0.1:6379> help KEYS

  KEYS pattern
  summary: Find all keys matching the given pattern
  since: 1.0.0
  group: generic

127.0.0.1:6379> 

# 列出所有key
127.0.0.1:6379> KEYS *
1) "name"

# 模糊查询key 以n开头的key
127.0.0.1:6379> KEYS n*
1) "name"

```

**DEL命令：**
```bash
127.0.0.1:6379> KEYS *
1) "age"
2) "name"
127.0.0.1:6379> DEL age name
(integer) 2
127.0.0.1:6379> KEYS *
(empty array)
127.0.0.1:6379> 
```

**EXISTS命令：**
```bash
127.0.0.1:6379> help EXISTS

  EXISTS key [key ...]
  summary: Determine if a key exists
  since: 1.0.0
  group: generic

127.0.0.1:6379> EXISTS name
(integer) 0
127.0.0.1:6379> set age 18
OK
127.0.0.1:6379> EXISTS age
(integer) 1
127.0.0.1:6379> 
```

**EXPIRE命令 TTL命令：**
```bash
127.0.0.1:6379> help EXPIRE

  EXPIRE key seconds
  summary: Set a key's time to live in seconds
  since: 1.0.0
  group: generic

127.0.0.1:6379> EXPIRE age 20
(integer) 1
127.0.0.1:6379> TTL age
(integer) 16
127.0.0.1:6379> TTL age
(integer) -2
127.0.0.1:6379> 


# -2 表示key者已经过期
# -1 表示永久有效
```






### String类型




### Hash类型




### List类型




### Set类型




### SortedSet类型



