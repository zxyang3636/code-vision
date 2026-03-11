---
title: 中间件 Interview
date: 2025-03-07
updated: 2025-03-07
categories: 面试指北
tags:
  - Java
  - 后端
  - 面经
---

## RabbitMQ

### 怎么确保消息幂等性？
**方式1：**

我们在生产者发送消息的时候，将生成的唯一token存储到redis中并且设置一个TTL存活时间，通过`MessagePostProcessor`对象将token存储在`MessageId`中

在监听队列的消费者端，我们从message对象中获取存在MessageId中的token，在从redis中获取这个token，判断redis中是否有MessageId中的这个token，如果有这个token并且没有被删除，那么我们就正常执行业务逻辑代码，业务逻辑代码执行后，再删除redis中的这个token，并且channel手动确认消息

需要注意的是：rabbitmq是批量处理消息，有必要加锁。

**方式2**

利用`redis`中的`setnx`指令，java中`setIfAbent()`

让消费者记住消息。结合redis 的setnx指令

消费前把消息中的唯一属性，放入redis，如果重复消费了，发现redis中若有该唯一属性，就不消费

如果消息中没有唯一属性？(联合主键：找几个属性加起来时唯一即可)

### 消息成为死信的三种情况

- ​	消费者拒接消费消息，并且不把消息重新放入原目标队列，`basicNack/basicReject`,并且不把消息重 新放入原目标队列,`requeue=false`;
- ​	队列中的消息超出队列的长度，淘汰最早的消息
- ​	队列中的消息超过设置的过期时间，没有被消费


### 如何实现延迟队列

**方案一：使用死信队列 + TTL（原生支持，无插件）**

需要为发送的消息设置 TTL（存活时间），过期后进入死信交换机（DLX），由死信交换机转发到实际消费队列；队列需要绑定“消息过期后转到的死信交换机”、“死信后用的路由键”

**方案二：使用延迟插件**

在github中找到rabbitmq官方提供的延迟插件，在rabbitmq中进行配置
```shell
rabbitmq-plugins enable rabbitmq_delayed_message_exchange
```
在定义交换机时，需要指定延迟插件类型`x-delayed-message`


### 使用rabbitmq的好处

- 在分布式系统下俱备异步，削峰平谷，解耦等功能、可以使服务之间调用解耦
- ​对于高并发场景下，利用消息队列可以对插入到数据库流量限流
- ​可以利用死信，实现延迟消费的效果

### 如何确保消息可靠投递

异常情况：

- 生产者连接MQ失败
- 生产者发送消息到达MQ后未找到Exchange
- 生产者发送消息到达MQ的Exchange后，未找到合适的Queue，因此无法路由
- 消费者接收到消息后突然宕机
- 消费者接收到消息后，因处理不当导致异常


通过配置我们可以开启连接失败后的重连机制，当网络不稳定的时候，利用重试机制可以有效提高消息发送的成功率。不过SpringAMQP提供的重试机制是阻塞式的重试，也就是说多次重试等待的过程中，当前线程是被阻塞的，会影响业务性能，当然也可以考虑使用异步线程来执行发送消息的代码。

`SpringAMQP`提供了`Publisher Confirm`和`Publisher Return`两种确认机制。开启确机制认后，当发送者发送消息给MQ后，MQ会返回确认结果给发送者。
`Publisher Confirm`：消息到达交换机后触发，不管路由是否成功，只要到达交换机就触发；`Publisher Return`：消息无法路由到队列时触发；开启生产者确认比较消耗MQ性能，一般不建议开启。路由失败：一般是因为RoutingKey错误导致，往往是编程导致；
交换机名称错误：同样是编程错误导致

消费者确认机制(Consumer Acknowledgement)是为了确认消费者是否成功处理消息。当消费者处理消息结束后应该向RabbitMQ发送一个回执，告知RabbitMQ自己消息处理状态；
- ack:成功处理消息，RabbitMQ从队列中删除该消息
- nack:消息处理失败，RabbitMQ需要再次投递消息
- reject:消息处理失败并拒绝该消息，RabbitMQ从队列中删除该消息







