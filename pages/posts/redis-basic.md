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

String类型，也就是字符串类型，是Redis中最简单的存储类型

其value是字符串，不过根据字符串的格式不同，又可以分为3类

- string：普通字符串
- int：整数类型，可以做自增、自减操作
- float：浮点类型，可以做自增、自减操作
不管是哪种格式，底层都是字节数组形式存储，只不过是编码方式不同，字符串类型的最大空间不能超过512M

**String类型常见命令：**

- SET：添加或者修改已经存在的一个String类型的键值对
- GET：根据key获取String类型的value
- MSET：批量添加多个String类型的键值对
- MGET：根据多个key获取多个String类型的value
- INCR：让一个整型的key自增1。
- INCRBY:让一个整型的key自增并指定步长，例如：incrby num 2 让num值自增2
- INCRBYFLOAT：让一个浮点类型的数字自增并指定步长

```bash
127.0.0.1:6379> MSET k1 v1 k2 v2
OK
127.0.0.1:6379> MGET k1 k2
1) "v1"
2) "v2"
127.0.0.1:6379> 


127.0.0.1:6379> set age 18
OK
127.0.0.1:6379> INCR age
(integer) 19
127.0.0.1:6379> get age
"19"


127.0.0.1:6379> set num 10.1
OK
127.0.0.1:6379> INCRBYFLOAT num 0.5
"10.6"
127.0.0.1:6379> INCRBYFLOAT num 0.5
"11.1"
127.0.0.1:6379> INCRBYFLOAT num 0.5
"11.6"
127.0.0.1:6379> get num
"11.6"
127.0.0.1:6379> 
```

#### Key的层级格式

Redis没有类似MySQL中Table的概念，那么我们该如何区分不同类型的Key呢？

例如：需要存储用户、商品信息到Redis，有一个用户的id是1，有一个商品的id恰好也是1，如果此时使用id作为key，那么就会发生冲突，该怎么办？


我们可以通过给key添加前缀加以区分，不过这个前缀不是随便加的，有一定的规范

- Redis的key允许有多个单词形成层级结构，多个单词之间用:隔开，格式如下
```bash
项目名:业务名:类型:id
```
这个格式也并非是固定的，可以根据自己的需求来删除/添加词条，这样我们就可以把不同数据类型的数据区分开了，从而避免了key的冲突问题

例如我们的项目名称叫 `codevision`，有 `user` 和 `product` 两种不同类型的数据，我们可以这样定义 key：

-  user 相关的 key：`codevision:user:1`
-  product 相关的 key：`codevision:product:1`

如果 Value 是一个 Java 对象，例如一个 User 对象，则可以将对象序列化为 JSON 字符串后存储：

| KEY               | VALUE                                  |
|-------------------|----------------------------------------|
| `codevision:user:1`    | `{"id":1, "name": "Jack", "age": 21}`   |
| `codevision:product:1` | `{"id":1, "name": "小米11", "price": 4999}` |

一旦我们向redis采用这样的方式存储，那么在可视化界面中，redis会以层级结构来进行存储，形成类似于这样的结构，更加方便Redis获取数据。


**String 类型的三种格式**

- 字符串  
- int  
- float  

 **Redis 的 key 格式规范**

- `[项目名]:[业务名]:[类型]:[id]`






### Hash类型



Hash类型，也叫散列，其value是一个无序字典，类似于Java中的HashMap结构。

 String 类型存储对象的问题:

当使用 String 类型存储对象时，通常会将对象序列化为 JSON 字符串后存储。这种方式在需要修改对象某个字段时非常不便：

| KEY             | VALUE                                  |
|------------------|----------------------------------------|
| `heima:user:1`   | `{"name":"Jack", "age":21}`            |
| `heima:user:2`   | `{"name":"Rose", "age":18}`            |


---

**Hash 类型的优势：支持字段级 CRUD**

Hash 结构可以将对象中的每个字段独立存储，允许对单个字段进行增删改查（CRUD），无需操作整个对象：

| KEY             | FIELD | VALUE |
|------------------|-------|-------|
| `heima:user:1`   | name  | Jack  |
| `heima:user:1`   | age   | 21    |
| `heima:user:2`   | name  | Rose  |
| `heima:user:2`   | age   | 18    |


```bash
127.0.0.1:6379> HSET codevision:user:3 name zhangSan
(integer) 1

127.0.0.1:6379> HGET codevision:user:3 name
"zhangSan"

127.0.0.1:6379> HMSET codevision:user:4 name Lucy sex man age 40
OK
127.0.0.1:6379> HMGET codevision:user:4 name age
1) "Lucy"
2) "40"
127.0.0.1:6379> 

127.0.0.1:6379> HGETALL codevision:user:3
1) "name"
2) "zhangSan"
3) "age"
4) "17"
127.0.0.1:6379> 

127.0.0.1:6379> HKEYS codevision:user:3
1) "name"
2) "age"
127.0.0.1:6379> 

127.0.0.1:6379> HVALS codevision:user:3
1) "zhangSan"
2) "17"
127.0.0.1:6379> 


127.0.0.1:6379> HINCRBY codevision:user:3 age 2
(integer) 19
127.0.0.1:6379> HINCRBY codevision:user:3 age 2
(integer) 21
127.0.0.1:6379> HINCRBY codevision:user:3 age 2
(integer) 23
127.0.0.1:6379> 


127.0.0.1:6379> HSETNX codevision:user:3 age 45  # 没有成功，已经存在
(integer) 0
127.0.0.1:6379> HSETNX codevision:user:3 sex man
(integer) 1
127.0.0.1:6379> 
```


Hash的常见命令有：
- HSET key field value：添加或者修改hash类型key的field的值
- HGET key field：获取一个hash类型key的field的值
- HMSET：批量添加多个hash类型key的field的值
- HMGET：批量获取多个hash类型key的field的值
- HGETALL：获取一个hash类型的key中的所有的field和value
- HKEYS：获取一个hash类型的key中的所有的field
- HVALS：获取一个hash类型的key中的所有的value
- HINCRBY:让一个hash类型key的字段值自增并指定步长
- HSETNX：添加一个hash类型的key的field值，前提是个这个field不存在，否则不执行




### List类型

Redis中的List类型与Java中的LinkedList类似，可以看做一个双向链表结构。既可以支持正向检索和也可以支持反向检索。

特征也与LinkedList类似：
- 有序
- 元素可以重复
- 插入和删除快
- 查询速度一般

常用来存储一个有序数据，例如：朋友圈点赞列表，评论列表等。

List的常见命令有：
- LPUSH key element ...：向列表左侧插入一个或多个元素
- LPOP key：移除并返回列表左侧的第一个元素，没有则返回nil
- RPUSH key element ...：向列表右侧插入一个或多个元素
- RPOP key：移除并返回列表右侧的第一个元素
- LRANGE key start end：返回一段角标范围内的所有元素
- BLPOP和BRPOP：与LPOP和RPOP类似，只不过在没有元素时等待指定时间，而不是直接返回nil


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251119215647668.png)

```bash
127.0.0.1:6379> LPUSH users 1 2 3 
(integer) 3
127.0.0.1:6379> 
127.0.0.1:6379> RPUSH users 4 5 6
(integer) 6
127.0.0.1:6379> LPOP users 1
1) "3"
127.0.0.1:6379> RPOP users 1
1) "6"
127.0.0.1:6379> LRANGE users 1 4  # 下标从0开始计
1) "1"
2) "4"
3) "5"
127.0.0.1:6379> 


127.0.0.1:6379> BLPOP users2 10 # 如果在10s内没有元素被加入，则返回nil，如果有元素加入就会获取到
(nil)
(10.10s)
127.0.0.1:6379> 
```


**如何利用List结构模拟一个栈？**

- 入口和出口在同一边。使用LPUSH/LPOP 或 RPUSH/RPOP进行元素操作。

**如何利用List结构模拟一个队列？**

- 入口和出口在不同边。使用LPUSH/RPOP 或 RPUSH/LPOP进行元素操作。

**如何利用List结构模拟一个阻塞队列？**

- 入口和出口在不同边，且出队时采用BLPOP或BRPOP



栈：先进后出（像一个人喝酒喝多了吐了）

队列：先进先出（像一个人喝酒没有吐，从下面排放出去😂）






### Set类型

Redis中的Set结构与Java中的HashSet类似，可以看做一个value为null的HashMap。因为也是一个hash表，因此具备与HashSet类似的特征：
- 无序
- 元素不可重复
- 查找快
- 支持交集、并集、差集等功能

Set的常见命令有：
- SADD key member ...：向set中添加一个或多个元素
- SREM key member ...：移除set中的指定元素
- SCARD key：返回set中元素的个数
- SISMEMBER key member：判断一个元素是否存在于set中
- SMEMBERS：获取set中的所有元素
- SINTER key1 key2 ...：求key1与key2的交集
- SDIFF key1 key2 ...：求key1与key2的差集
- SUNION key1 key2 ...：求key1和key2的并集


```bash
127.0.0.1:6379> SADD s1 1 2 3
(integer) 3
127.0.0.1:6379> SMEMBERS s1
1) "1"
2) "2"
3) "3"
127.0.0.1:6379> SREM s1 1
(integer) 1
127.0.0.1:6379> SISMEMBER s1 1
(integer) 0
127.0.0.1:6379> SISMEMBER s1 b
(integer) 0
127.0.0.1:6379> SISMEMBER s1 2
(integer) 1
127.0.0.1:6379> SCARD s1
(integer) 2
127.0.0.1:6379> 


```

**如图：**

`INTER`交集BC

`S1 DIFF S2`差集A

并集ABCD;
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251120001443371.png)



**Set命令的练习**

将下列数据用Redis的Set集合来存储：
- 张三的好友有：李四、王五、赵六
- 李四的好友有：王五、麻子、二狗

```bash
127.0.0.1:6379> SADD zs lisi wangwu zhaoliu
(integer) 3
127.0.0.1:6379> SADD ls wangwu mazi ergou 
(integer) 3
127.0.0.1:6379> 
```

利用Set的命令实现下列功能：
- 计算张三的好友有几人
- 计算张三和李四有哪些共同好友
- 查询哪些人是张三的好友却不是李四的好友
- 查询张三和李四的好友总共有哪些人
- 判断李四是否是张三的好友
- 判断张三是否是李四的好友
- 将李四从张三的好友列表中移除

```bash
127.0.0.1:6379> SCARD zs
(integer) 3
127.0.0.1:6379> 

127.0.0.1:6379> SINTER zs ls
1) "wangwu"
127.0.0.1:6379> 

127.0.0.1:6379> SDIFF zs ls
1) "lisi"
2) "zhaoliu"
127.0.0.1:6379> 

127.0.0.1:6379> SUNION zs ls
1) "zhaoliu"
2) "lisi"
3) "ergou"
4) "wangwu"
5) "mazi"
127.0.0.1:6379> 

127.0.0.1:6379> SISMEMBER zs lisi
(integer) 1

127.0.0.1:6379> SISMEMBER ls zhangsan
(integer) 0

127.0.0.1:6379> SREM zs lisi
(integer) 1
127.0.0.1:6379> 
```






### SortedSet类型

Redis的SortedSet是一个可排序的set集合，与Java中的TreeSet有些类似，但底层数据结构却差别很大。SortedSet中的每一个元素都带有一个score属性，可以基于score属性对元素排序，底层的实现是一个跳表（SkipList）加 hash表。

SortedSet具备下列特性：
- 可排序
- 元素不重复
- 查询速度快

因为SortedSet的可排序特性，经常被用来实现排行榜这样的功能。



SortedSet的常见命令有：
- ZADD key score member：添加一个或多个元素到sorted set，如果已经存在则更新其score值
- ZREM key member：删除sorted set中的一个指定元素
- ZSCORE key member：获取sorted set中的指定元素的score值
- ZRANK key member：获取sorted set中的指定元素的排名
- ZCARD key：获取sorted set中的元素个数
- ZCOUNT key min max：统计score值在给定范围内的所有元素的个数
- ZINCRBY key increment member：让sorted set中的指定元素自增，步长为指定的increment值
- ZRANGE key min max：按照score排序后，获取指定排名范围内的元素
- ZRANGEBYSCORE key min max：按照score排序后，获取指定score范围内的元素
- ZDIFF、ZINTER、ZUNION：求差集、交集、并集
>注意：所有的排名默认都是升序，如果要降序则在命令的Z后面添加REV即可

```bash
127.0.0.1:6379> help @sorted_set

  BZPOPMAX key [key ...] timeout
  summary: Remove and return the member with the highest score from one or more sorted sets, or block until one is available
  since: 5.0.0

  BZPOPMIN key [key ...] timeout
  summary: Remove and return the member with the lowest score from one or more sorted sets, or block until one is available
  since: 5.0.0

  ZADD key [NX|XX] [GT|LT] [CH] [INCR] score member [score member ...]
  summary: Add one or more members to a sorted set, or update its score if it already exists
  since: 1.2.0

  ZCARD key
  summary: Get the number of members in a sorted set
  since: 1.2.0

  ZCOUNT key min max
  summary: Count the members in a sorted set with scores within the given values
  since: 2.0.0

  ZDIFF numkeys key [key ...] [WITHSCORES]
  summary: Subtract multiple sorted sets
  since: 6.2.0

  ZDIFFSTORE destination numkeys key [key ...]
  summary: Subtract multiple sorted sets and store the resulting sorted set in a new key
  since: 6.2.0

  ZINCRBY key increment member
  summary: Increment the score of a member in a sorted set
  since: 1.2.0

  ZINTER numkeys key [key ...] [WEIGHTS weight] [AGGREGATE SUM|MIN|MAX] [WITHSCORES]
  summary: Intersect multiple sorted sets
  since: 6.2.0

  ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight] [AGGREGATE SUM|MIN|MAX]
  summary: Intersect multiple sorted sets and store the resulting sorted set in a new key
  since: 2.0.0

  ZLEXCOUNT key min max
  summary: Count the number of members in a sorted set between a given lexicographical range
  since: 2.8.9

  ZMSCORE key member [member ...]
  summary: Get the score associated with the given members in a sorted set
  since: 6.2.0

  ZPOPMAX key [count]
  summary: Remove and return members with the highest scores in a sorted set
  since: 5.0.0

  ZPOPMIN key [count]
  summary: Remove and return members with the lowest scores in a sorted set
  since: 5.0.0

  ZRANDMEMBER key [count [WITHSCORES]]
  summary: Get one or multiple random elements from a sorted set
  since: 6.2.0

  ZRANGE key min max [BYSCORE|BYLEX] [REV] [LIMIT offset count] [WITHSCORES]
  summary: Return a range of members in a sorted set
  since: 1.2.0

  ZRANGEBYLEX key min max [LIMIT offset count]
  summary: Return a range of members in a sorted set, by lexicographical range
  since: 2.8.9

  ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]
  summary: Return a range of members in a sorted set, by score
  since: 1.0.5

  ZRANGESTORE dst src min max [BYSCORE|BYLEX] [REV] [LIMIT offset count]
  summary: Store a range of members from sorted set into another key
  since: 6.2.0

  ZRANK key member
  summary: Determine the index of a member in a sorted set
  since: 2.0.0

  ZREM key member [member ...]
  summary: Remove one or more members from a sorted set
  since: 1.2.0

  ZREMRANGEBYLEX key min max
  summary: Remove all members in a sorted set between the given lexicographical range
  since: 2.8.9

  ZREMRANGEBYRANK key start stop
  summary: Remove all members in a sorted set within the given indexes
  since: 2.0.0

  ZREMRANGEBYSCORE key min max
  summary: Remove all members in a sorted set within the given scores
  since: 1.2.0

  ZREVRANGE key start stop [WITHSCORES]
  summary: Return a range of members in a sorted set, by index, with scores ordered from high to low
  since: 1.2.0

  ZREVRANGEBYLEX key max min [LIMIT offset count]
  summary: Return a range of members in a sorted set, by lexicographical range, ordered from higher to lower strings.
  since: 2.8.9

  ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]
  summary: Return a range of members in a sorted set, by score, with scores ordered from high to low
  since: 2.2.0

  ZREVRANK key member
  summary: Determine the index of a member in a sorted set, with scores ordered from high to low
  since: 2.0.0

  ZSCAN key cursor [MATCH pattern] [COUNT count]
  summary: Incrementally iterate sorted sets elements and associated scores
  since: 2.8.0

  ZSCORE key member
  summary: Get the score associated with the given member in a sorted set
  since: 1.2.0

  ZUNION numkeys key [key ...] [WEIGHTS weight] [AGGREGATE SUM|MIN|MAX] [WITHSCORES]
  summary: Add multiple sorted sets
  since: 6.2.0

  ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight] [AGGREGATE SUM|MIN|MAX]
  summary: Add multiple sorted sets and store the resulting sorted set in a new key
  since: 2.0.0

```

**SortedSet命令练习**

将班级的下列学生得分存入Redis的SortedSet中：
Jack 85, Lucy 89, Rose 82, Tom 95, Jerry 78, Amy 92, Miles 76

- 并实现下列功能：
- 删除Tom同学
- 获取Amy同学的分数
- 获取Rose同学的排名
- 查询80分以下有几个学生
- 给Amy同学加2分
- 查出成绩前3名的同学
- 查出成绩80分以下的所有同学

```bash
127.0.0.1:6379> ZADD stus 85 Jack 89 Lucy 82 Rose 95 Tom 78 Jerry 92 Amy 76 Miles
(integer) 7
127.0.0.1:6379> 
127.0.0.1:6379> ZREM stus Tom
(integer) 1

127.0.0.1:6379> ZRANK stus Rose # 注意返回的排名是从0开始的，(ZRANK升序)
(integer) 2
127.0.0.1:6379> ZREVRANK stus Rose
(integer) 3
127.0.0.1:6379> 
127.0.0.1:6379> ZCOUNT stus 0 80
(integer) 2
127.0.0.1:6379> 
127.0.0.1:6379> ZINCRBY stus 2 Amy
"94"
127.0.0.1:6379> 
127.0.0.1:6379> ZREVRANGE stus 0 2 # 注意这个命令是角标
1) "Amy"
2) "Lucy"
3) "Jack"
127.0.0.1:6379> 
127.0.0.1:6379> ZRANGEBYSCORE stus 0 80
1) "Miles"
2) "Jerry"
127.0.0.1:6379> 
```




##  Redis的Java客户端

###  客户端对比

在Redis官网中提供了各种语言的客户端，地址：https://redis.io/clients

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251120010555030.png)



### Jedis







### SpringDataRedis

