---
title: RabbitMQ
date: 2025-05-21
updated: 2025-05-21
categories: 中间件
tags:
  - MQ
  - 后端
  - 消息中间件
---

# RabbitMQ

## 初识MQ


**同步调用**

>同步调用的优势是什么？
- 时效性强，等待到结果后才返回。

---

>同步调用的问题是什么？
- 拓展性差
- 性能下降
- 级联失败问题


---

**异步调用**

异步调用通常是基于消息通知的方式，包含三个角色：
- 消息发送者：投递消息的人，就是原来的调用者
- 消息接收者：接收和处理消息的人，就是原来的服务提供者
- 消息代理：管理、暂存、转发消息，你可以把它理解成微信服务器



支付服务不再同步调用业务关联度低的服务，而是发送消息通知到Broker。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-22_22-16-43.png)

在异步调用中，发送者不再直接同步调用接收者的业务接口，而是发送一条消息投递给消息Broker。然后接收者根据自己的需求从消息Broker那里订阅消息。每当发送方发送消息后，接受者都能获取消息并处理。

这样，发送消息的人和接收消息的人就完全解耦了。

除了扣减余额、更新支付流水单状态以外，其它调用逻辑全部取消。而是改为发送一条消息到Broker。而相关的微服务都可以订阅消息通知，一旦消息到达Broker，则会分发给每一个订阅了的微服务，处理各自的业务。

不管后期增加了多少消息订阅者，作为支付服务来讲，执行问扣减余额、更新支付流水状态后，发送消息即可。业务耗时仅仅是这三部分业务耗时，仅仅100ms，大大提高了业务性能。

另外，不管是交易服务、通知服务，还是积分服务，他们的业务与支付关联度低。现在采用了异步调用，解除了耦合，他们即便执行过程中出现了故障，也不会影响到支付服务。

异调用的优势是什么？
- 耦合度低，拓展性强
- 异步调用，无需等待，性能好
- 故障隔离，下游服务故障不影响上游业务
- 缓存消息，流量削峰填谷

异步调用的问题是什么？
- 不能立即得到调用结果，时效性差
- 不确定下游业务执行是否成功
- 业务安全依赖于Broker的可靠性


## MQ技术选型

MQ （MessageQueue），中文是消息队列，字面来看就是存放消息的队列。也就是异步调用中的Broker。


目比较常见的MQ实现：
- ActiveMQ
- RabbitMQ
- RocketMQ
- Kafka


几种常见MQ的对比：
|        |	RabbitMQ	|ActiveMQ|	RocketMQ	|Kafka
|-----------|----|-------|-----|-----|
|公司/社区	|Rabbit|	Apache|	阿里|	Apache
|开发语言	|Erlang	|Java	|Java	|Scala&Java
|协议支持	|AMQP，XMPP，SMTP，STOMP|	OpenWire,STOMP，REST,XMPP,AMQP	|自定义协议|	自定义协议
|可用性	|  高	|一般	|高  	|高
|单机吞吐量	|一般	|差	|高	|非常高
|消息延迟	|微秒级|	毫秒级|	毫秒级	|毫秒以内
|消息可靠性|	高	|一般	|高	|一般

- 追求可用性：Kafka、 RocketMQ 、RabbitMQ
- 追求可靠性：RabbitMQ、RocketMQ
- 追求吞吐能力：RocketMQ、Kafka
- 追求消息低延迟：RabbitMQ、Kafka

据统计，目前国内消息队列使用最多的还是RabbitMQ，再加上其各方面都比较均衡，稳定性也好


## 安装部署rabbitmq

**Docker部署**

上传我们的`mq.tar`,rabbitmq的镜像文件
```Bash
docker load -i mq.tar
```

执行docker命令
```Bash
docker run \
 -e RABBITMQ_DEFAULT_USER=itheima \
 -e RABBITMQ_DEFAULT_PASS=123321 \
 -v mq-plugins:/plugins \
 --name mq \
 --hostname mq \
 -p 15672:15672 \
 -p 5672:5672 \
 --network hm-net\
 -d \
 rabbitmq:3.8-management

```

:::info
15672是访问控制rabbitmq的控制台

5672是将来收发消息的端口
:::



我们访问 http://192.168.146.131:15672  即可看到管理控制台。首次访问需要登录，默认的用户名和密码在配置文件中已经指定了。

登录后即可看到管理控制台总览页面;



>CentOS 7 部署

Erlang和RabbitMQ版本对照：https://www.rabbitmq.com/which-erlang.html

1. 首先将下载好的文件上传到服务器，创建一个文件夹用来存放文件
```bash
mkdir -p /usr/rabbitmq
```

2. 然后切换到`/usr/rabbitmq`目录，解压安装erlang
```shell
# 解压
rpm -Uvh erlang-23.2.7-2.el7.x86_64.rpm

# 安装
yum install -y erlang

```
安装完成后输入如下指令查看版本号
```shell
erl -v
```

3. 安装RabbitMQ-在RabiitMQ安装过程中需要依赖socat插件，首先安装该插件
```
yum install -y socat

```

然后解压安装RabbitMQ的安装包

```shell
# 解压
rpm -Uvh rabbitmq-server-3.8.14-1.el7.noarch.rpm

# 安装
yum install -y rabbitmq-server

```

启动RabbitMQ服务
```shell
# 启动rabbitmq
systemctl start rabbitmq-server

# 查看rabbitmq状态
systemctl status rabbitmq-server

```
显示active则表示服务安装并启动成功

其他命令：
```shell
# 设置rabbitmq服务开机自启动
systemctl enable rabbitmq-server

# 关闭rabbitmq服务
systemctl stop rabbitmq-server

# 重启rabbitmq服务
systemctl restart rabbitmq-server

```


安装启动RabbitMQ Web管理界面,默认情况下，rabbitmq没有安装web端的客户端软件，需要安装才可以生效

```shell
# 打开RabbitMQWeb管理界面插件
rabbitmq-plugins enable rabbitmq_management

```

添加远程用户
```shell
# 添加用户
rabbitmqctl add_user 用户名 密码

# 设置用户角色,分配操作权限
rabbitmqctl set_user_tags 用户名 角色

# 为用户添加资源权限(授予访问虚拟机根节点的所有权限)
rabbitmqctl set_permissions -p / 用户名 ".*" ".*" ".*"

```
创建完成后，访问`服务器公网ip:15672`进行登录，然后便可进入到后台

命令示例：
```shell
rabbitmqctl add_user root '1qaz!QAZ'

rabbitmqctl set_user_tags root administrator

rabbitmqctl set_permissions -p / root ".*" ".*" ".*"
```

启用延迟插件
```shell
[root@iZgc7j16wv0j7v97crrcpgZ rabbitmq]# ls
erlang-23.3.4.11-1.el7.x86_64.rpm            rabbitmq-server-3.8.9-1.el7.noarch.rpm
rabbitmq_delayed_message_exchange-3.10.0.ez  socat-1.7.3.2-2.el7.x86_64.rpm
[root@iZgc7j16wv0j7v97crrcpgZ rabbitmq]# find / -name "plugins" -type d 2>/dev/null | grep rabbitmq
/usr/lib/rabbitmq/lib/rabbitmq_server-3.8.9/plugins
[root@iZgc7j16wv0j7v97crrcpgZ rabbitmq]#

# 1. 复制插件到正确目录
cp rabbitmq_delayed_message_exchange-3.10.0.ez /usr/lib/rabbitmq/lib/rabbitmq_server-3.8.9/plugins/

# 2. 验证复制成功
ls -la /usr/lib/rabbitmq/lib/rabbitmq_server-3.8.9/plugins/ | grep delayed

# 3. 启用插件
rabbitmq-plugins enable rabbitmq_delayed_message_exchange

# 4. 重启 RabbitMQ
systemctl restart rabbitmq-server

# 5. 查看插件状态
rabbitmq-plugins list | grep delayed
```




---

RabbitMQ对应的架构如图：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-23_21-09-41.png)

其中包含几个概念：
- publisher：生产者，也就是发送消息的一方
- consumer：消费者，也就是消费消息的一方
- queue：队列，存储消息。生产者投递的消息会暂存在消息队列中，等待消费者处理
- exchange：交换机，负责消息路由。生产者发送的消息由交换机决定投递到哪个队列。
- virtual host：虚拟主机，起到数据隔离的作用。每个虚拟主机相互独立，有各自的exchange、queue



### 快速入门
需求:在RabbitMQ的控制台完成下列操作:
1. 新建队列hello.queue1和hello.queue2
2. 向默认的amp.fanout交换机发送一条消息
3. 查看消息是否到达hello.queue1和hello.queue2

**队列**

我们打开Queues选项卡，新建一个队列：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-23_21-24-03.png)

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-23_21-24-34.png)
再以相同的方式，创建一个队列，命名为hello.queue2

**绑定关系**

点击Exchanges选项卡，点击amq.fanout交换机，进入交换机详情页，然后点击Bindings菜单，在表单中填写要绑定的队列名称：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-23_21-25-56.png)

**发送消息**

再次回到`exchange`页面，找到刚刚绑定的`amq.fanout`，点击进入详情页，再次发送一条消息

回到`Queues`页面，可以发现`hello.queue`中已经有一条消息了

点击队列名称，进入详情页，查看队列详情，这次我们点击`get message`

可以看到消息到达队列了

---

**消息发送的注意事项有哪些?**
- 交换机只能路由消息，无法存储消息
- 交换机只会路由消息给与其绑定的队列，因此队列必须与交
换机绑定



### 数据隔离
**用户管理**

点击Admin选项卡，首先会看到RabbitMQ控制台的用户管理界面：

这里的用户都是RabbitMQ的管理或运维人员。目前只有安装RabbitMQ时添加的`itheima`这个用户。仔细观察用户表格中的字段，如下：
- Name：`itheima`，也就是用户名
- Tags：`administrator`，说明`itheima`用户是超级管理员，拥有所有权限
- Can access virtual host： /，可以访问的`virtual host`，这里的`/`是默认的`virtual host`


对于小型企业而言，出于成本考虑，我们通常只会搭建一套MQ集群，公司内的多个不同项目同时使用。这个时候为了避免互相干扰， 我们会利用`virtual host`的隔离特性，将不同项目隔离。一般会做两件事情：
- 给每个项目创建独立的运维账号，将管理权限分离。
- 给每个项目创建不同的`virtual host`，将每个项目的数据隔离。



## 快速入门案例(Simple模式)
SpringAmqp的官方地址：https://spring.io/projects/spring-amqp


**AMQP**

Advanced Message Queuing Protocol，是用于在应用程序之间传递业务消息的开放标准。该协议与语言和平台无关，更符合微服务中独立性的要求。


**Spring AMQP**

Spring AMQP是基于AMQP协议定义的一套API规范，提供了模板来发送和接收消息。包含两部分，其中spring-amqp是基础抽象，spring-rabbit是底层的默认实现。

---

需求如下：
- 利用控制台创建队列simple.queue
- 在publisher服务中，利用SpringAMQP直接向simple.queue发送消息
- 在consumer服务中，利用SpringAMQP编写消费者，监听simple.queue队列

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-26_21-52-20.png)




新建一个队列
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-26_22-22-48.png)


1. 引入依赖
```xml
<!--AMQP依赖，包含RabbitMQ-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

2. 配置RabbitMQ服务端信息
```yaml [application.yaml]
spring:
  rabbitmq:
    host: 192.168.146.131 # 你的虚拟机IP
    port: 5672 # 端口
    virtual-host: /hmall # 虚拟主机
    username: hmall # 用户名
    password: 123321 # 密码
```


在test包中建一个消息发送者
```java
@SpringBootTest
class SpringAmqpTest {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Test
    public void testSimpleQueue() {
        String queueName = "simple.queue";
        String message = "Hello Spring AMQP!";
        rabbitTemplate.convertAndSend(queueName, message);
    }

}
```


在项目代码中建一个消息消费者，并注册为bean
```java
@Component
@Slf4j
public class SpringRabbitListener {

    @RabbitListener(queues = "simple.queue")
    public void listenSimpleQueue(String msg) {
        log.info("监听到simple.queue的消息:{}", msg);
    }
}
```


## WorkQueue(Work模式)
`Work queues`，任务模型。简单来说就是让多个消费者绑定到一个队列，共同消费队列中的消息。

成员：一个生产者，一个队列，多个消费者

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-26_22-27-11.png)


```java
@Test
public void testWorkQueue() {
    String queueName = "work.queue";
    for (int i = 1; i <= 50; i++) {
        String message = "Hello Spring AMQP!" + "  " + i;
        rabbitTemplate.convertAndSend(queueName, message);
    }
}
```

```java
    @RabbitListener(queues = "work.queue")
    public void listenWorkQueue1(String msg) {
        System.out.println("消费者1接收到消息：" + msg + "  " + LocalDateTime.now());
    }

    @RabbitListener(queues = "work.queue")
    public void listenWorkQueue2(String msg) {
        System.err.println("消费者2接收到消息：" + msg + "  " + LocalDateTime.now());
    }
```


默认情况下，RabbitMQ的会将消息依次轮询投递给绑定在队列上的每一个消费者。但这并没有考虑到消费者是否已经处理完消息，可能出现消息堆积。

因此我们需要修改application.yml，设置preFetch值为1，确保同一时刻最多投递给消费者1条消息：
```yaml{11-13}[application.yml]
logging:
  pattern:
    dateformat: MM-dd HH:mm:ss:SSS
spring:
  rabbitmq:
    host: 192.168.146.131 # 你的虚拟机IP
    port: 5672 # 端口
    virtual-host: /hmall # 虚拟主机
    username: hmall # 用户名
    password: 123321 # 密码
    listener:
      simple:
        prefetch: 1 # 每次只能获取一条消息，处理完成才能获取下一个消息

```

---

Work模型的使用：
- 多个消费者绑定到一个队列，可以加快消息处理速度
- 同一条消息只会被一个消费者处理
- 通过设置prefetch来控制消费者预取的消息数量，处理完一条再处理下一条，实现能者多劳

## Fanout交换机

交换机的作用主要是接收发送者发送的消息，并将消息路由到与其绑定的队列。

常见交换机的类型有以下三种：
- Fanout：广播
- Direct：定向
- Topic：话题

---


Fanout，英文翻译是扇出，我觉得在MQ中叫广播更合适。

在广播模式下，消息发送流程是这样的：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-26_23-04-30.png)

- 1）  可以有多个队列
- 2）  每个队列都要绑定到Exchange（交换机）
- 3）  生产者发送的消息，只能发送到交换机
- 4）  交换机把消息发送给绑定过的所有队列
- 5）  订阅队列的消费者都能拿到消息




实现思路如下：
- 在RabbitMQ控制台中，声明队列fanout.queue1和fanout.queue2
- 在RabbitMQ控制台中，声明交换机hmall.fanout，将两个队列与其绑定
- 在consumer服务中，编写两个消费者方法，分别监听fanout.queue1和fanout.queue2
- 在publisher中编写测试方法，向hmall.fanout发送消息


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-26_23-08-02.png)


```java
    @Test
    public void testFanoutQueue() {
        // 队列名称
        String exchangeName = "hmall.fanout";
        String message = "Hello everyone";
        // 发送消息，参数分别是:交互机名称、RoutingKey(暂时为空)、消息
        rabbitTemplate.convertAndSend(exchangeName, null, message);
    }
```


```java [SpringRabbitListener.java]
    @RabbitListener(queues = "fanout.queue1")
    public void listenFanoutQueue1(String msg) {
        log.info("消费者1监听到fanout.queue1的消息:{}", msg);
    }

    @RabbitListener(queues = "fanout.queue2")
    public void listenFanoutQueue2(String msg) {
        log.info("消费者2监听到fanout.queue2的消息:{}", msg);
    }
```


交换机的作用是什么?
- 接收publisher发送的消息
- 将消息按照规则路由到与之绑定的队列
- FanoutExchange的会将消息路由到每个绑定的队列


## Direct交换机

在Fanout模式中，一条消息，会被所有订阅的队列都消费。但是，在某些场景下，我们希望不同的消息被不同的队列消费。这时就要用到Direct类型的Exchange。

`Direct Exchange` 会将接收到的消息根据规则路由到指定的`Queue`，因此称为定向路由。
- 每一个`Queue`都与`Exchange`设置一个`BindingKey`
- 发布者发送消息时，指定消息的`RoutingKey`
- `Exchange`将消息路由到`BindingKey`与消息`RoutingKey`一致的队列

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-27_21-58-51.png)

---
**案例需求如图：**
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-27_22-09-52.png)

1. 创建两个`queue`

- direct.queue1

- direct.queue2

2. 创建交换机并绑定：
- hmall.direct

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-27_22-09-17.png)

3. 生产者
```java
    @Test
    public void testDirectQueue() {
        String exchangeName = "hmall.direct";
        String message = "Hello red";
        rabbitTemplate.convertAndSend(exchangeName, "red", message);
    }


    @Test
    public void testDirectQueue() {
        String exchangeName = "hmall.direct";
        String message = "Hello blue";
        rabbitTemplate.convertAndSend(exchangeName, "blue", message);
    }
```

4. 消费者
```java
    @RabbitListener(queues = "direct.queue1")
    public void listenDirectQueue1(String msg) {
        log.info("消费者1监听到direct.queue1的消息:{}", msg);
    }

    @RabbitListener(queues = "direct.queue2")
    public void listenDirectQueue2(String msg) {
        log.info("消费者2监听到direct.queue2的消息:{}", msg);
    }
```

---

**总结**

描述下Direct交换机与Fanout交换机的差异？
- Fanout交换机将消息路由给每一个与之绑定的队列
- Direct交换机根据RoutingKey判断路由给哪个队列
- 如果多个队列具有相同的RoutingKey，则与Fanout功能类似


## Topic交换机

`Topic`类型的`Exchange`与`Direct`相比，都是可以根据`RoutingKey`把消息路由到不同的队列。

只不过`Topic`类型`Exchange`可以让队列在绑定`BindingKey` 的时候使用通配符！


`BindingKey` 一般都是有一个或多个单词组成，多个单词之间以`.`分割，例如： `item.insert`

通配符规则：
- `#`：匹配一个或多个词
- `*`：匹配不多不少恰好1个词

举例：
- `item.#`：能够匹配`item.spu.insert` 或者 `item.spu`
- `item.*`：只能匹配`item.spu`

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-27_22-55-44.png)


---

**利用SpringAMQP演示DirectExchange的使用**

需求如下：
- 在RabbitMQ控制台中，声明队列topic.queue1和topic.queue2
- 在RabbitMQ控制台中，声明交换机hmall. topic ，将两个队列与其绑定
- 在consumer服务中，编写两个消费者方法，分别监听topic.queue1和topic.queue2
- 在publisher中编写测试方法，利用不同的RoutingKey向hmall. topic发送消息

1. 创建队列
- `topic.queue1`
- `topic.queue2`

2. 创建交换机类型为`topic`，并绑定队列

- `hmall.topic`
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-27_23-02-31.png)

3. 生产者
```java
    @Test
    public void testTopiceQueue() {
        String exchangeName = "hmall.topic";
        String message = "Hello all";
        // china.news所有消费者都能收到
        rabbitTemplate.convertAndSend(exchangeName, "china.news", message);
    }
```



4. 消费者
```java
    @RabbitListener(queues = "topic.queue1")
    public void listenTopicQueue1(String msg) {
        log.info("消费者1监听到topic.queue1的消息:{}", msg);
    }

    @RabbitListener(queues = "topic.queue2")
    public void listenTopicQueue2(String msg) {
        log.info("消费者2监听到topic.queue2的消息:{}", msg);
    }
```

---

**总结**

描述下`Direct`交换机与`Topic`交换机的差异？
- `Topic`交换机接收的消息`RoutingKey`必须是多个单词，以 `.`分割
- `Topic`交换机与队列绑定时的`bindingKey`可以指定通配符
- `#`：代表0个或多个词
- `*`：代表1个词


## 基于Bean声明队列交换机


在之前我们都是基于RabbitMQ控制台来创建队列、交换机。但是在实际开发时，队列和交换机是程序员定义的，将来项目上线，又要交给运维去创建。那么程序员就需要把程序中运行的所有队列和交换机都写下来，交给运维。在这个过程中是很容易出现错误的。

因此推荐的做法是由程序启动时检查队列和交换机是否存在，如果不存在自动创建。

---

SpringAMQP提供了几个类，用来声明队列、交换机及其绑定关系：

- Queue：用于声明队列，可以用工厂类QueueBuilder构建
- Exchange：用于声明交换机，可以用工厂类ExchangeBuilder构建
- Binding：用于声明队列和交换机的绑定关系，可以用工厂类BindingBuilder构建

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-29_20-08-57.png)


### fanout示例


在consumer中创建一个类，声明队列和交换机：

>一般可以在消费者这边声明队列、交换机和绑定关系，因为作为发送方来讲，发送方不需要关心队列，发送发唯一关心的是交换机，向某个交换机发消息就可以了

```java [FanoutConfig.java]
@Configuration
public class FanoutConfig {

    @Bean
    public FanoutExchange fanoutExchange(){
//        return new FanoutExchange("hmall.fanout");
        return ExchangeBuilder.fanoutExchange("hmall.fanout").build();
    }

    @Bean
    public Queue fanoutQueue1() {
        return QueueBuilder.durable("fanout.queue1").build();
    }

    @Bean
    public Queue fanoutQueue2() {
        return new Queue("fanout.queue2");
    }

    @Bean
    public Binding fanoutQueue1Binding(Queue fanoutQueue1,FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(fanoutQueue1).to(fanoutExchange);
    }

    @Bean
    public Binding fanoutQueue2Binding(Queue fanoutQueue2, FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(fanoutQueue2).to(fanoutExchange);
    }
}
```

**direct示例**

direct模式由于要绑定多个KEY，会非常麻烦，每一个Key都要编写一个binding：
```java
package com.itheima.consumer.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DirectConfig {

    /**
     * 声明交换机
     * @return Direct类型交换机
     */
    @Bean
    public DirectExchange directExchange(){
        return ExchangeBuilder.directExchange("hmall.direct").build();
    }

    /**
     * 第1个队列
     */
    @Bean
    public Queue directQueue1(){
        return new Queue("direct.queue1");
    }

    /**
     * 绑定队列和交换机
     */
    @Bean
    public Binding bindingQueue1WithRed(Queue directQueue1, DirectExchange directExchange){
        return BindingBuilder.bind(directQueue1).to(directExchange).with("red");
    }
    /**
     * 绑定队列和交换机
     */
    @Bean
    public Binding bindingQueue1WithBlue(Queue directQueue1, DirectExchange directExchange){
        return BindingBuilder.bind(directQueue1).to(directExchange).with("blue");
    }

    /**
     * 第2个队列
     */
    @Bean
    public Queue directQueue2(){
        return new Queue("direct.queue2");
    }

    /**
     * 绑定队列和交换机
     */
    @Bean
    public Binding bindingQueue2WithRed(Queue directQueue2, DirectExchange directExchange){
        return BindingBuilder.bind(directQueue2).to(directExchange).with("red");
    }
    /**
     * 绑定队列和交换机
     */
    @Bean
    public Binding bindingQueue2WithYellow(Queue directQueue2, DirectExchange directExchange){
        return BindingBuilder.bind(directQueue2).to(directExchange).with("yellow");
    }
}
```

## 基于注解声明队列交换机
基于`@Bean`的方式声明队列和交换机比较麻烦，Spring还提供了基于注解方式来声明。

例如，我们同样声明Direct模式的交换机和队列：

```java [SpringRabbitListener.java]
@Component
@Slf4j
public class SpringRabbitListener {
    @RabbitListener(bindings = @QueueBinding(
            value = @Queue("direct.queue1"),
            exchange = @Exchange(name = "hmall.exchange",type = ExchangeTypes.DIRECT),
            key = {"blue","red"}
    ))
    public void listenDirectQueue1(String msg) {
        log.info("消费者1监听到direct.queue1的消息:{}", msg);
    }

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue("direct.queue2"),
            exchange = @Exchange(name = "hmall.exchange",type = ExchangeTypes.DIRECT),
            key = {"yellow","red"}
    ))
    public void listenDirectQueue2(String msg) {
        log.info("消费者2监听到direct.queue2的消息:{}", msg);
    }
}
```

再试试Topic模式：
```java
@RabbitListener(bindings = @QueueBinding(
    value = @Queue(name = "topic.queue1"),
    exchange = @Exchange(name = "hmall.topic", type = ExchangeTypes.TOPIC),
    key = "china.#"
))
public void listenTopicQueue1(String msg){
    System.out.println("消费者1接收到topic.queue1的消息：【" + msg + "】");
}

@RabbitListener(bindings = @QueueBinding(
    value = @Queue(name = "topic.queue2"),
    exchange = @Exchange(name = "hmall.topic", type = ExchangeTypes.TOPIC),
    key = "#.news"
))
public void listenTopicQueue2(String msg){
    System.out.println("消费者2接收到topic.queue2的消息：【" + msg + "】");
}
```


## 消息转换器

`Spring`的消息发送代码接收的消息体是一个`Object`：

`Spring`的对消息对象的处理是由`org.springframework.amqp.support.converter.MessageConverter`来处理的。而默认实现是`SimpleMessageConverter`，基于JDK的`ObjectOutputStream`完成序列化。

存在下列问题：
- JDK的序列化有安全风险
- JDK序列化的消息太大
- JDK序列化的消息可读性差

---

建议采用JSON序列化代替默认的JDK序列化，要做两件事情：

1. 在publisher和consumer中都要引入jackson依赖：

```xml
<dependency>
    <groupId>com.fasterxml.jackson.dataformat</groupId>
    <artifactId>jackson-dataformat-xml</artifactId>
    <version>2.9.10</version>
</dependency>
```
注意，如果项目中引入了spring-boot-starter-web依赖，则无需再次引入Jackson依赖。

配置消息转换器，在publisher和consumer两个服务的启动类中添加一个Bean即可：

```java
@Bean
public MessageConverter messageConverter(){
    // 1.定义消息转换器
    Jackson2JsonMessageConverter jackson2JsonMessageConverter = new Jackson2JsonMessageConverter();
    // 2.配置自动创建消息id，用于识别不同消息，也可以在业务中基于ID判断是否是重复消息
    jackson2JsonMessageConverter.setCreateMessageIds(true);
    return jackson2JsonMessageConverter;
}
```
消息转换器中添加的messageId可以便于我们将来做幂等性判断。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-29_21-11-54.png)


*消费者：*
```java
    @RabbitListener(queues = "object.queue")
    public void listenObjectQueue2(Map<String, Object> msg) {
        log.info("消费者监听到object.queue的消息:{}", msg);
    }
```

```log
05-29 21:15:53:382  INFO 8660 --- [ntContainer#7-1] c.i.consumer.mq.SpringRabbitListener     : 消费者监听到object.queue的消息:{age=21, name=jack}
```



## 业务集成及改造

不管是生产者还是消费者，都需要配置MQ的基本信息。分为两步：

```xml
  <!--消息发送-->
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-amqp</artifactId>
  </dependency>
```

```yaml
spring:
  rabbitmq:
    host: 192.168.150.101 # 你的虚拟机IP
    port: 5672 # 端口
    virtual-host: /hmall # 虚拟主机
    username: hmall # 用户名
    password: 123 # 密码
```


在common的配置类中，配置消息转换器：
```java
@Configuration
@ConditionalOnClass(RabbitTemplate.class)
public class MqConfig {

    @Bean
    public MessageConverter messageConverter(){
        Jackson2JsonMessageConverter jackson2JsonMessageConverter = new Jackson2JsonMessageConverter();
        return jackson2JsonMessageConverter;
    }

}


```
在 `hm-common\src\main\resources\META-INF\spring.factories` 下配置扫描包
```
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.hmall.common.config.MyBatisConfig,\
  com.hmall.common.config.JsonConfig,\
  com.hmall.common.config.MqConfig,\
  com.hmall.common.config.MvcConfig
```

**接收消息**(消费者)

建一个`listener`包

在trade-service服务中定义一个消息监听类：

```java [PayStatusListener.java]
@Component
@RequiredArgsConstructor
public class PayStatusListener {

    private final IOrderService orderService;

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(name = "trade.pay.success.queue", durable = "true"),
            exchange = @Exchange(name = "pay.direct"),
            key = "pay.success"
    ))
    public void listenPaySuccess(Long orderId) {
        orderService.markOrderPaySuccess(orderId);
    }
}
```




**发送消息**

修改`pay-service`服务下的`com.hmall.pay.service.impl.PayOrderServiceImpl`类中的`tryPayOrderByBalance`方法：

```java{23-27}
    @Override
    @Transactional
    public void tryPayOrderByBalance(PayOrderFormDTO payOrderFormDTO) {
        // 1.查询支付单
        PayOrder po = getById(payOrderFormDTO.getId());
        // 2.判断状态
        if (!PayStatus.WAIT_BUYER_PAY.equalsValue(po.getStatus())) {
            // 订单不是未支付，状态异常
            throw new BizIllegalException("交易已支付或关闭！");
        }
        // 3.尝试扣减余额
        userClient.deductMoney(payOrderFormDTO.getPw(), po.getAmount());
        // 4.修改支付单状态
        boolean success = markPayOrderSuccess(payOrderFormDTO.getId(), LocalDateTime.now());
        if (!success) {
            throw new BizIllegalException("交易已支付或关闭！");
        }
        // 5.修改订单状态
//        Order order = new Order();
//        order.setId(po.getBizOrderNo());
//        order.setStatus(2);
//        order.setPayTime(LocalDateTime.now());
        try {
            rabbitTemplate.convertAndSend("pay.direct", "pay.success", po.getBizOrderNo());
        } catch (AmqpException e) {
            log.error("发送支付状态失败，订单id:{}", po.getBizOrderNo(), e);
        }
//        tradeClient.markOrderPaySuccess(po.getBizOrderNo());
    }
```


---

<br>

# MQ高级

## 消息的可靠投递


### 发送者重连

有的时候由于网络波动，可能会出现发送者连接MQ失败的情况。通过配置我们可以开启连接失败后的重连机制:

在消息的发送者配置如下：

```yaml [application.yaml]
spring:
  rabbitmq:
    connection-timeout: 1s # 设置MQ的连接超时时间
    template:
      retry:
        enabled: true # 开启超时重试机制
        initial-interval: 1000ms # 失败后的初始等待时间
        multiplier: 1 # 失败后下次的等待时长倍数，下次等待时长 = initial-interval * multiplier
        max-attempts: 3 # 最大重试次数
```

我们利用命令停掉RabbitMQ服务：
```Bash
docker stop mq
```

然后测试发送一条消息;

:::warning
当网络不稳定的时候，利用重试机制可以有效提高消息发送的成功率。不过SpringAMQP提供的重试机制是**阻塞式**的重试，也就是说多次重试等待的过程中，当前线程是被阻塞的，会影响业务性能。

如果对于业务性能有要求，建议**禁用**重试机制。如果一定要使用，请合理配置等待时长和重试次数，当然也可以考虑使用**异步**线程来执行发送消息的代码。
:::

### 发送者确认

一般情况下，只要生产者与MQ之间的网路连接顺畅，基本不会出现发送消息丢失的情况，因此大多数情况下我们无需考虑这种问题。
不过，在少数情况下，也会出现消息发送到MQ之后丢失的现象，比如：
- MQ内部处理消息的进程发生了异常
- 生产者发送消息到达MQ后未找到Exchange
- 生产者发送消息到达MQ的Exchange后，未找到合适的Queue，因此无法路由

SpringAMQP提供了`Publisher Confirm`和`Publisher Return`两种确认机制。开启确机制认后，当发送者发送消息给MQ后，MQ会返回确认结果给发送者。返回的结果有以下几种情况:
- 消息投递到了MQ，但是路由失败。此时会通过`PublisherReturn`返回路由异常原因，然后返回`ACK`，告知投递成功
- 临时消息投递到了MQ，并且入队成功，返回`ACK`，告知投递成功
- 持久消息投递到了MQ，并且入队完成持久化，返回`ACK`，告知投递成功
- 其它情况都会返回`NACK`，告知投递失败

其中`ack`和`nack`属于`Publisher Confirm`机制，`ack`是投递成功；`nack`是投递失败。而`return`则属于`Publisher Return`机制。

默认两种机制都是关闭状态，需要通过配置文件来开启。

---

**SpringAMQP实现发送者确认🤫**

1. 在publisher模块的application.yaml中添加配置：
```yaml [application.yaml]
spring:
  rabbitmq:
    publisher-confirm-type: correlated # 开启publisher confirm机制，并设置confirm类型
    publisher-returns: true # 开启publisher return机制
```

这里`publisher-confirm-type`有三种模式可选🤠：
- `none`：关闭confirm机制
- `simple`：同步阻塞等待MQ的回执
- `correlated`：MQ异步回调返回回执

一般我们推荐使用`correlated`，回调机制。

2. 定义ReturnCallback

每个RabbitTemplate只能配置一个ReturnCallback，因此我们可以在配置类中统一设置。我们在publisher模块定义一个配置类：

在config包下创建`MqConfig`

内容如下：

```java
@Slf4j
@AllArgsConstructor
@Configuration
public class MqConfig {
    private final RabbitTemplate rabbitTemplate;

    @PostConstruct
    public void init(){
        rabbitTemplate.setReturnsCallback(new RabbitTemplate.ReturnsCallback() {
            @Override
            public void returnedMessage(ReturnedMessage returned) {
                log.error("触发return callback,");
                log.debug("exchange: {}", returned.getExchange());
                log.debug("routingKey: {}", returned.getRoutingKey());
                log.debug("message: {}", returned.getMessage());
                log.debug("replyCode: {}", returned.getReplyCode());
                log.debug("replyText: {}", returned.getReplyText());
            }
        });
    }
}
```

配置类 `MqConfig` 中设置了一个消息返回的回调处理机制。当发送的消息因为某些原因未能成功投递到目标队列时（如交换机、路由键不匹配等），`rabbitTemplate` 会触发 `ReturnedMessage` 回调，可以日志记录详细的错误信息或补偿。

---

3. 定义ConfirmCallback，发送消息，指定消息ID、消息ConfirmCallback

由于每个消息发送时的处理逻辑不一定相同，因此`ConfirmCallback`需要在每次发消息时定义。具体来说，是在调用`RabbitTemplate`中的`convertAndSend`方法时，多传递一个参数：`CorrelationData`

这里的`CorrelationData`中包含两个核心的东西：
- `id`：消息的唯一标示，MQ对不同的消息的回执以此做判断，避免混淆
- `SettableListenableFuture`：回执结果的`Future`对象


将来MQ的回执就会通过这个`Future`来返回，我们可以提前给`CorrelationData`中的`Future`添加回调函数来处理消息回执：

---

>为什么returnCallback只用写一次配置，而ConfirmCallback需要每次都写?

因为消息需要被确认，并且是每条消息都需要被确认; `ConfirmCallback`只要记住 临时消息 到了交换机 就`ack`；持久化消息时进入了队并完成了消息持久化，才`ack`，这就是`ConfirmCallback`的作用；

---

我们新建一个测试，向系统自带的交换机发送消息，并且添加`ConfirmCallback`：

```java
    @Test
    public void testConfirmCallback() {
        CorrelationData cd = new CorrelationData(UUID.randomUUID().toString());
        cd.getFuture().addCallback(new ListenableFutureCallback<CorrelationData.Confirm>() {
            @Override
            public void onFailure(Throwable ex) {
                // Future发生异常时的处理逻辑，基本不会触发
                log.error("send message fail", ex);
            }

            @Override
            public void onSuccess(CorrelationData.Confirm result) {
                // Future接收到回执的处理逻辑，参数中的result就是回执内容
                if (result.isAck()) { // result.isAck()，boolean类型，true代表ack回执，false 代表 nack回执
                    log.debug("发送消息成功，收到 ack!");
                } else { // result.getReason()，String类型，返回nack时的异常描述
                    log.error("发送消息失败，收到 nack, reason : {}", result.getReason());
                    // 消息重发或持久化
                }
            }
        });
        String exchangeName = "hmall.topic";  // 可以把交换机的名字改成不存在，这样就会走到nack
        String message = "Hello all";
        rabbitTemplate.convertAndSend(exchangeName, "blue", message, cd);
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
```

:::info
如果没有看到日志：日志级别不够
```yaml [application.yaml]
logging:
  pattern:
    dateformat: MM-dd HH:mm:ss:SSS
  level:
    com.itheima: debug
```

如果是test中测试，我们是没有看到回执的，因为test不是正在运行的项目，我们可以在代码结尾添加睡眠时间
```java
Thread.sleep(2000);
```
:::



:::warning
❗️注意：

开启生产者确认比较消耗MQ性能，一般不建议开启。而且大家思考一下触发确认的几种情况：
- 路由失败：一般是因为RoutingKey错误导致，往往是编程导致
- 交换机名称错误：同样是编程错误导致
- MQ内部故障：这种需要处理，但概率往往较低。因此只有对消息可靠性要求非常高的业务才需要开启，而且仅仅需要开启`ConfirmCallback`处理`nack`就可以了。
:::


<details>
  <summary>关于Publisher Return</summary>
  Publisher Return机制没必要开，因为路由失败是自己的编程问题导致，而不是mq的内部故障问题
</details>


### MQ可靠性

在默认情况下，RabbitMQ会将接收到的信息保存在内存中以降低消息收发的延迟。这样会导致两个问题:
- 一旦MQ宕机，内存中的消息会丢失
- 内存空间有限，当消费者故障或处理过慢时，会导致消息积压，引发MQ阻塞

#### 数据持久化

RabbitMQ实现数据持久化包括3个方面:
- 交换机持久化
- 队列持久化
- 消息持久化

在控制台的Exchanges页面，添加交换机时可以配置交换机的Durability参数：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-06-03_20-25-36.png)
设置为Durable就是持久化模式，Transient就是临时模式。

---

在控制台的Queues页面，添加队列时，同样可以配置队列的Durability参数：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_2025-06-03_202659_754.png)


---

在控制台发送消息的时候，可以添加很多参数，而消息的持久化是要配置一个properties：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-06-03_20-27-58.png)



```java
@Test
    void testSendMessage() {
        // 消息自定义为非持久化
        Message message = MessageBuilder.withBody("hello springAMQP".getBytes(StandardCharsets.UTF_8))
                .setDeliveryMode(MessageDeliveryMode.NON_PERSISTENT).build();
        for (int i = 0; i < 1000000; i++) {
            rabbitTemplate.convertAndSend("simple.queue", message);
        }
    }
```
耗时50秒左右⬆️



```java
    @Test
    void testSendMessage() {
        // 消息持久化
        Message message = MessageBuilder.withBody("hello springAMQP".getBytes(StandardCharsets.UTF_8))
                .setDeliveryMode(MessageDeliveryMode.PERSISTENT).build();
        for (int i = 0; i < 1000000; i++) {
            rabbitTemplate.convertAndSend("simple.queue", message);
        }
    }
```
仅耗时20秒⬆️

- `MessageDeliveryMode.PERSISTENT`：消息会被写入磁盘（持久化），即使 RabbitMQ 重启也不会丢失。
- `MessageDeliveryMode.NON_PERSISTENT`：消息仅保存在内存中，RabbitMQ 重启后会丢失。


持久化的方式峰值性能是不会到底最低谷的，因为它是边发送边持久化，性能不会有太大影响，而不持久化的方式，一旦消息量过多，内存不够了，就会抽出时间去往磁盘中写入，所以峰值不稳定，性能一般，持久化时性能会达到最低谷

:::warning
说明：在开启持久化机制以后，如果同时还开启了生产者确认，那么MQ会在消息持久化以后才发送ACK回执，进一步确保消息的可靠性。

不过出于性能考虑，为了减少IO次数，发送到MQ的消息并不是逐条持久化到数据库的，而是每隔一段时间批量持久化。一般间隔在100毫秒左右，这就会导致ACK有一定的延迟，因此建议生产者确认全部采用异步方式。

:::

---


#### LazyQueue


从RabbitMQ的3.6.0版本开始，就增加了LazyQueue的概念，也就是`惰性队列`。

惰性队列的特征如下:
- 接收到消息后直接存入磁盘，不再存储到内存(既可以保证并发能力，也不用去写入内存)
- 消费者要消费消息时才会从磁盘中读取并加载到内存(可以提前缓存部分消息到内存，最多2048条)在`3.12`版本后，所有队列都是`LazyQueue`模式，无法更改。


要设置一个队列为惰性队列，只需要在声明队列时，指定`x-queue-mode`属性为`lazy`即可:

控制台方式：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/wechat_2025-06-03_210021_855.png)

代码方式 & 注解方式
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-06-03_21-01-34.png)



**对比结果：**
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/wechat_2025-06-03_210525_623.png)

**总结🫡**

`RabbitMQ`如何保证消息的可靠性
- 首先通过配置可以让交换机、队列、以及发送的消息都持久化。这样队列中的消息会持久化到磁盘，MQ重启消息依然存在。
- `RabbitMQ`在`3.6`版本引入了`LazyQueue`，并且在`3.12`版本后会称为队列的默认模式。`LazyQueue`会将所有消息都持久化。
- 开启持久化和生产者确认时，`RabbitMQ`只有在消息持久化完成后才会给生产者返回ACK回执


### 消费者的可靠性

当RabbitMQ向消费者投递消息以后，需要知道消费者的处理状态如何。因为消息投递给消费者并不代表就一定被正确消费了，可能出现的故障有很多，比如：
- 消息投递的过程中出现了网络故障
- 消费者接收到消息后突然宕机
- 消费者接收到消息后，因处理不当导致异常
- ...
一旦发生上述情况，消息也会丢失。因此，RabbitMQ必须知道消费者的处理状态，一旦消息处理失败才能重新投递消息。



#### 消费者确认机制

消费者确认机制(Consumer Acknowledgement)是为了确认消费者是否成功处理消息。当消费者处理消息结束后应该向`RabbitMQ`发送一个回执，告知`RabbitMQ`自己消息处理状态:
- `ack`:成功处理消息，`RabbitMQ`从队列中删除该消息
- `nack`:消息处理失败，`RabbitMQ`需要再次投递消息
- `reject`:消息处理失败并拒绝该消息，`RabbitMQ`从队列中删除该消息

---

`SpringAMQP`已经实现了消息确认功能。并允许我们通过配置文件选择`ACK`处理方式，有三种方式:
- `none`:不处理。即消息投递给消费者后立刻ack，消息会立刻从MQ删除。非常不安全，不建议使用
- `manual`:手动模式。需要自己在业务代码中调用api，发送`ack`或`reject`，存在业务入侵，但更灵活
- `auto`:自动模式。`SpringAMQP`利用`AOP`对我们的消息处理逻辑做了环绕增强，当业务正常执行时则自动返回`ack`当业务出现异常时，根据异常判断返回不同结果:
    - 如果是业务异常，会自动返回`nack`
    - 如果是消息处理或校验异常，自动返回`reject`


通过下面的配置可以修改SpringAMQP的ACK处理方式：

是在消费者方配置

```yaml
spring:
  rabbitmq:
    listener:
      simple:
        acknowledge-mode: none # 不做处理  auto # 自动ack   manual 手动ack
```

---

*测试*🧑

在消费者这里故意抛个异常
```java
@Component
@Slf4j
public class SpringRabbitListener {

    @RabbitListener(queues = "simple.queue")
    public void listenSimpleQueue(String msg) {
        log.info("监听到simple.queue的消息:{}", msg);
        throw new RuntimeException("故意的");
    }
}
```
那么就会 回执给rabbitmq **nack**,队列就会进行重新发送，重新发送到消费者再次尝试消费


如果抛的是该异常⬇️，那么回执的是 **reject**，队列就会丢弃消息或发送到死信
```java
throw new MessageConversionException("故意的");
```

日志
```log
06-03 21:44:58:825  WARN 10276 --- [ntContainer#3-1] ingErrorHandler$DefaultExceptionStrategy : Fatal message conversion error; message rejected; it will be dropped or routed to a dead letter exchange, if so configured: (Body:'"Hello Spring AMQP!"' MessageProperties [headers={__TypeId__=java.lang.String}, messageId=eb2e4bd1-6077-4419-be95-90ebfb307fae, contentType=application/json, contentEncoding=UTF-8, contentLength=0, receivedDeliveryMode=PERSISTENT, priority=0, redelivered=true, receivedExchange=, receivedRoutingKey=simple.queue, deliveryTag=1, consumerTag=amq.ctag-tZhHXR8ze87Bjd1Ye_1Tww, consumerQueue=simple.queue])
06-03 21:44:58:825 ERROR 10276 --- [ntContainer#3-1] o.s.a.r.l.SimpleMessageListenerContainer : Execution of Rabbit message listener failed, and the error handler threw an exception

```

---

#### 失败重试机制

`SpringAMQP`提供了消费者失败重试机制，在消费者出现异常时利用本地重试，而不是无限的requeue到mq。我们可以通过在`application.yaml`文件中添加配置来开启重试机制：

在消费者端配置：
```yaml{5-10}[application.yaml]
spring:
  rabbitmq:
    listener:
      simple:
        retry:
          enabled: true # 开启消费者失败重试
          initial-interval: 1000ms # 初识的失败等待时长为1秒
          multiplier: 1 # 失败的等待时长倍数，下次等待时长 = multiplier * last-interval
          max-attempts: 3 # 最大重试次数
          stateless: true # true无状态；false有状态。如果业务中包含事务，这里改为false
```


重启`consumer`服务，重复之前的测试。可以发现：
- 消费者在失败后消息没有重新回到MQ无限重新投递，而是在本地重试了3次
- 本地重试3次以后，抛出了`AmqpRejectAndDontRequeueException`异常。查看`RabbitMQ`控制台，发现消息被删除了，说明最后`SpringAMQP`返回的是`reject`

结论：
- 开启本地重试时，消息处理过程中抛出异常，不会requeue到队列，而是在消费者本地重试
- 重试达到最大次数后，Spring会返回`reject`，消息会被丢弃


---

**失败消息处理策略**

在开启重试模式后，重试次数耗尽，如果消息依然失败，则需要有`MessageRecoverer`接口来处理，它包含三种不同的实现：
- `RejectAndDontRequeueRecoverer`：重试耗尽后，直接`reject`，丢弃消息。默认就是这种方式
- `ImmediateRequeueMessageRecoverer`：重试耗尽后，返回`nack`，消息重新入队
- `RepublishMessageRecoverer`：重试耗尽后，将失败消息投递到指定的交换机

*实现步骤：*

将失败处理策略改为`RepublishMessageRecoverer`：
1. 首先，定义接收失败消息的交换机、队列及其绑定关系;
2. 然后，定义`RepublishMessageRecoverer`；


1. 在消费者端，`config`包下创建`ErrorMessageConfiguration`

```java [ErrorMessageConfiguration.java]
@Configuration
public class ErrorMessageConfiguration {

    @Bean
    public DirectExchange errorExchange() {
        return new DirectExchange("error.direct");
    }

    @Bean
    public Queue errorQueue() {
        return new Queue("error.queue");
    }

    @Bean
    public Binding errorQueueBinding(Queue errorQueue, DirectExchange errorExchange) {
        return BindingBuilder.bind(errorQueue).to(errorExchange).with("error");
    }

    @Bean
    public MessageRecoverer messageRecoverer(RabbitTemplate rabbitTemplate) {
        return new RepublishMessageRecoverer(rabbitTemplate, "error.direct", "error");
    }
}
```

再次发送，我们发现，重试了三次都失败了，就发送到了`error.queue`
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-06-03_22-42-32.png)


---


#### 业务幂等性

产生场景：消费者执行完业务后 ，还没有回执就宕机了，结果判断为消息没有确认，还在队列中，再投递给消费者。因此就出现了重复消费的问题；

**幂等**是一个数学概念，用函数表达式来描述是这样的：`f(x) = f(f(x))` 。在程序开发中，则是指同一个业务，执行一次或多次对业务状态的影响是一致的。


有些业务天生就是幂等的，而有些不是，要根据业务场景区分
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-06-04_20-39-43.png)
>常见的幂等：查询、删除
>
>常见的非幂等：更新操作

---

*唯一消息id*

**方案一**，是给每个消息都设置一个唯一id，利用id区分是否是重复消息：

1️⃣每一条消息都生成一个唯一的id，与消息一起投递给消费者。

2️⃣消费者接收到消息后处理自己的业务，业务处理成功后将消息ID保存到数据库

3️⃣如果下次又收到相同消息，去数据库查询判断是否存在，存在则为重复消息放弃处理。

`SpringAMQP`的`MessageConverter`自带了`MessageID`的功能，我们只要开启这个功能即可。

在消息的发送者，配置如下
```java
@Bean
    public MessageConverter messageConverter(){
        // 1.定义消息转换器
        Jackson2JsonMessageConverter jackson2JsonMessageConverter = new Jackson2JsonMessageConverter();
        // 2.配置自动创建消息id，用于识别不同消息，也可以在业务中基于ID判断是否是重复消息
        jackson2JsonMessageConverter.setCreateMessageIds(true);
        return jackson2JsonMessageConverter;
    }
```

在消费者，接收消息时，应使用`Message`对象接收
```java
    @RabbitListener(queues = "simple.queue")
    public void listenSimpleQueue(Message message) {
        log.info("监听到simple.queue的ID:{}", message.getMessageProperties().getMessageId());
        log.info("监听到simple.queue的消息:{}", new String(message.getBody()));
    }
```

```log
06-04 21:00:06:868  INFO 3344 --- [ntContainer#3-1] c.i.consumer.mq.SpringRabbitListener     : 监听到simple.queue的ID:480f70f0-d658-4447-824b-022c3b8970e3
06-04 21:00:06:869  INFO 3344 --- [ntContainer#3-1] c.i.consumer.mq.SpringRabbitListener     : 监听到simple.queue的消息:"Hello Spring AMQP!"
```

---

*业务判断*

**方案二**，是结合业务逻辑，基于业务本身做判断。以我们的余额支付业务为例：

业务判断就是基于业务本身的逻辑或状态来判断是否是重复的请求或消息，不同的业务场景判断的思路也不一样。

例如我们当前案例中，处理消息的业务逻辑是把订单状态从未支付修改为已支付。因此我们就可以在执行业务时判断订单状态是否是未支付，如果不是则证明订单已经被处理过，无需重复处理。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-06-04_21-05-27.png)

改造代码
```java [PayStatusListener.java]
@Component
@RequiredArgsConstructor
public class PayStatusListener {

    private final IOrderService orderService;

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(name = "trade.pay.success.queue", durable = "true"),
            exchange = @Exchange(name = "pay.direct"),
            key = "pay.success"
    ))
    public void listenPaySuccess(Long orderId) {
        Order order = orderService.getById(orderId);
        // 判断订单状态，是否为未支付
        if (order == null || order.getStatus() != 1) {
            // 不做处理
            return;
        }
        // 标记订单状态为已支付
        orderService.markOrderPaySuccess(orderId);
    }
}
```

---

**总结**

>如何保证支付服务与交易服务之间的订单状态一致性？

首先，支付服务会正在用户支付成功以后利用MQ消息通知交易服务，完成订单状态同步。

其次，为了保证MQ消息的可靠性，我们采用了生产者确认机制、消费者确认、消费者失败重试等策略，确保消息投递和处理的可靠性。同时也开启了MQ的持久化，避免因服务宕机导致消息丢失。

最后，我们还在交易服务更新订单状态时做了业务幂等判断，避免因消息重复消费导致订单状态异常。

---

>如果交易服务消息处理失败，有没有什么兜底方案？

我们可以在交易服务设置定时任务，定期查询订单支付状态。这样即便MQ通知失败，还可以利用定时任务作为兜底方案，确保订单支付状态的最终一致性。



### 延迟消息

延迟消息：发送者发送消息时指定一个时间，消费者不会立刻收到消息，而是在指定时间之后才收到消息。

延迟任务：设置在一定时间之后才执行的任务



在RabbitMQ中实现延迟消息也有两种方案：
- 死信交换机+TTL  (Time To Live，简写TTL)
- 延迟消息插件
---

#### 死信交换机


当一个队列中的消息满足下列情况之一时，就会成为`死信（dead letter）`：
- 消费者使用`basic.reject`或 `basic.nack`声明消费失败，并且消息的`requeue`参数设置为`false`
- 消息是一个过期消息（达到了队列或消息本身设置的过期时间），超时无人消费
- 要投递的队列消息堆积满了，最早的消息可能成为死信

如果队列通过`dead-letter-exchange`属性指定了一个交换机，那么该队列中的死信就会投递到这个交换机中。这个交换机称为`死信交换机（Dead Letter Exchange，简称DLX）`。


绑定关系如下
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-06-04_21-36-58.png)


消费者监听：
```java
    @RabbitListener(bindings = @QueueBinding(
            value = @Queue("dlx.queue"),
            exchange = @Exchange(name = "dlx.direct", type = ExchangeTypes.DIRECT),
            key = {"hi"}
    ))
    public void listenDlxQueue(String msg) {
        log.info("消费者2监听到dlx.queue的消息:{}", msg);
    }
```

配置我们的关系绑定，**普通交换机与普通队列是不能有消费者的**

在`config`包下创建`NormalConfig`
```java
@Configuration
public class NormalConfig {

    @Bean
    public DirectExchange normalExchange() {
        return ExchangeBuilder.directExchange("normal.direct").build();
    }

    @Bean
    public Queue normalQueue() {
        return QueueBuilder
                .durable("normal.queue")
                .deadLetterExchange("dlx.direct")  // 指定死信交换机
                .build();
    }

    @Bean
    public Binding normalExchangeBinding(Queue normalQueue, DirectExchange normalExchange) {
        return BindingBuilder.bind(normalQueue).to(normalExchange).with("hi");
    }

}
```

我们只需要向`normal.direct`中发消息，该消息就会到达`normal.queue`，到达后，由于`normal.queue`没有设置消费者，那么这个消息就会成为死信(过期以后)，
成为死信后就会投递到`dlx.direct`，从而到达我们刚刚的消费者(listenDlxQueue)；

发送者：
```java
    @Test
    void testSendDelayMessage() {
        rabbitTemplate.convertAndSend("normal.direct", "hi", "hello lalala", message -> {
            message.getMessageProperties().setExpiration("10000");
            return message;
        });
    }
```

---

死信交换机有什么作用呢？
1. 收集那些因处理失败而被拒绝的消息
2. 收集那些因队列满了而被拒绝的消息
3. 收集因TTL（有效期）到期的消息

---

:::warning
这里的RoutingKey必须一致。死信在转移到死信队列时，他的Routing key也会保存下来。但是如果配置了x-dead-letter-routing-key这个参数的话，routingkey就会被替换为配置的这个值。

另外，死信在转移到死信队列的过程中，是没有经过消息发送者确认的，所以并不能保证消息的安全性。也就是说，publisher发送了一条消息，但最终consumer在10秒后才收到消息。我们成功实现了延迟消息。
:::







#### 延迟消息插件

这个插件可以将普通交换机改造为支持延迟消息功能的交换机，当消息投递到交换机后可以暂存一定时间，到期后再投递到队列

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/wechat_2025-06-09_212414_912.png)

官方文档说明：[文档](https://www.rabbitmq.com/blog/2015/04/16/scheduling-messages-with-rabbitmq)

---

插件下载地址：[下载地址](https://github.com/rabbitmq/rabbitmq-delayed-message-exchange)

由于我们安装的MQ是`3.8`版本，因此这里下载`3.8.17`版本



**docker安装**

因为我们是基于Docker安装，所以需要先查看RabbitMQ的插件目录对应的数据卷。
```bash
docker volume inspect mq-plugins
```
结果如下：
```json
[
    {
        "CreatedAt": "2024-06-19T09:22:59+08:00",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/mq-plugins/_data",
        "Name": "mq-plugins",
        "Options": null,
        "Scope": "local"
    }
]
```

插件目录被挂载到了`/var/lib/docker/volumes/mq-plugins/_data`这个目录，我们上传插件到该目录下。

因为之前部署mq时，已经挂载好了，现在只需上传该插件即可

接下来执行命令，安装插件：
```shell
docker exec -it mq rabbitmq-plugins enable rabbitmq_delayed_message_exchange
```


---

*使用步骤如下*

1. 消费者

两种方式：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-06-09_21-26-46.png)

```java
@RabbitListener(bindings = @QueueBinding(
            value = @Queue("delay.queue"),
            exchange = @Exchange(name = "delay.direct", delayed = "true", type = ExchangeTypes.DIRECT),
            key = {"hi"}
    ))
    public void listenDelayQueue(String msg) {
        log.info("消费者监听到delay.queue的消息:{}", msg);
    }
```
2. 生产者

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-06-09_21-27-20.png)
```java
    @Test
    void testSendDelayMessageByPlugins() {
        rabbitTemplate.convertAndSend("delay.direct", "hi", "hello lalala", message -> {
            message.getMessageProperties().setDelay(10000);
            return message;
        });
    }
```


:::warning
注意：

延迟消息插件内部会维护一个本地数据库表，同时使用`Elang Timers功能实现计时`。如果消息的延迟时间设置较长，可能会导致堆积的延迟消息非常多，会带来较大的CPU开销，同时延迟消息的时间会存在误差。

因此，**不建议设置延迟时间过长的延迟消息**。


延时消息计时是由CPU完成的，依赖cpu去完成，所以耗费cpu资源。如果延迟时间设置过长，如一天，那么业务这一天内会产生大量 的延迟消息，带来很大的开销。
:::




#### 取消超时订单


用户下单完成后，发送15分钟延迟消息，在15分钟后接收消息，检查支付状态：
- 已支付：更新订单状态为已支付
- 未支付：更新订单状态为关闭订单，恢复商品库存

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-06-09_21-45-23.png)

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-06-09_21-45-50.png)




*代码业务改造*

在`trade-service`服务中建`constans`包，建`MQConstans`接口，定义常量

```java
public interface MQConstans {
    String DELAY_EXCHANGE_NAME = "trade.delay.direct";
    String DELAY_ORDER_QUEUE_NAME = "trade.delay.order.queue";
    String DELAY_ORDER_KEY_NAME = "delay.order.query";
}
```

`listener`包下的`OrderDelayMessageListener`
消费者
```java
@Component
@RequiredArgsConstructor
public class OrderDelayMessageListener {

    private final IOrderService orderService;
    private final PayClient payClient;

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(name = MQConstans.DELAY_ORDER_QUEUE_NAME),
            exchange = @Exchange(name = MQConstans.DELAY_EXCHANGE_NAME, delayed = "true"),
            key = MQConstans.DELAY_ORDER_KEY_NAME
    ))
    public void listenOrderDelayMessage(Long orderId) {
        // 1.查询订单
        Order order = orderService.getById(orderId);
        // 2.检测订单状态，判断是否己支付
        if (order == null && order.getStatus() != 1) {
            // 订单不存在 或 已支付
            return;
        }
        // 3. 未支付，需要查询支付流水状态
        PayOrderDTO payOrderDTO = payClient.queryPayOrderByBizOrderNo(orderId);
        // 4.判断是否支付
        if (payOrderDTO != null && payOrderDTO.getStatus() == 3) {
            // 4.1.已支付，标记订单状态为已支付
            orderService.markOrderPaySuccess(orderId);
        } else {
            // 4.2.未支付，取消订单，回复库存
            orderService.cancelOrder(orderId);
        }
    }
}
```


生产者
```java [OrderServiceImpl.java]
rabbitTemplate.convertAndSend(MQConstans.DELAY_EXCHANGE_NAME,
        MQConstans.DELAY_ORDER_KEY_NAME,
        order.getId(),
        message -> {
            message.getMessageProperties().setDelay(10000);
            return message;
        });
```

