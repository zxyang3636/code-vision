---
title: Spring Cloud
date: 2025-05-13
updated: 2025-05-13
categories: Java
tags:
  - Java
  - Spring Cloud
  - 微服务
---


# SpringCloud

### **单体架构**

单体架构:将业务的所有功能集中在一个项目中开发，打成一个包部署

优点:
- 架构简单
- 部署成本低

缺点:

- 团队协作成本高
- 系统发布效率低
- 系统可用性差

**总结:**

单体架构适合开发功能相对简单，规模较小的项目。

---

### 分布式系统 (Distributed System)
分布式系统是一个广泛的概念，包含了许多不同的架构模式，微服务架构只是其中一种。

---

### **微服务 (Microservices)**

可以独立运行和独立部署的服务

微服务是一种软件架构风格，它是以专注于单一职责的很多小型项目为基础，组合出复杂的大型应用。每个服务运行在自己的进程中；

是分布式系统理念在应用设计层面的具体实践。

- 粒度小
- 团队自治
- 服务自治
- 独立部署
- 单一职责

---

### SpringCloud
Spring Cloud是一个特定的技术框架，用于实现微服务架构。


`SpringCloud`是目前国内使用最广泛的微服务框架。

官网地址：https://spring.io/projects/spring-cloud

基于Spring Boot的微服务开发工具集，`SpringCloud`集成了各种微服务功能组件，并基于SpringBoot实现了这些组件的自动装配，从而提供了良好的开箱即用体验：

![image](https://s1.imagehub.cc/images/2025/04/28/1d011c0b8f705d58ed7f03f49b542884.png)
这三者是层层递进的关系：`分布式系统`是基础理论，`微服务`是基于分布式系统的架构风格，`Spring Cloud`是实现微服务的技术框架。

## 服务拆分

**什么时候拆分?**

- 创业型项目:先采用单体架构，快速开发，快速试错。随着规模扩大，逐渐拆分。

- 确定的大型项目:资金充足，目标明确，可以直接选择微服务架构，避免后续拆分的麻烦


**怎么拆分?**

从拆分目标来说，要做到:
- 高内聚:每个微服务的职责要尽量单一，包含的业务相互关联度高、完整度高。
- 低耦合:每个微服务的功能要相对独立，尽量减少对其它微服务的依赖，

从拆分方式来说，一般包含两种方式:

- 纵向拆分:按照业务模块来拆分
- 横向拆分:抽取公共服务，提高复用性

工程结构有两种:

1. 独立Project
2. Maven聚合

## 服务调用

把原本本地方法调用，改造成跨微服务的远程调用（RPC，即Remote Produce Call）。

### RestTemplate
Spring给我们提供了一个RestTemplate的API，可以方便的实现Http请求的发送。

**使用步骤**

```java
@Bean
public RestTemplate restTemplate() {
    return new RestTemplate();
}
```

```java
@RequiredArgsConstructor


private final RestTemplate restTemplate; // final修饰成员变量，意味着必须初始化
```

`@RequiredArgsConstructor`会将类的每一个`final`字段或者`@NonNull`标记字段生成一个构造方法


调用
```java
ResponseEntity<List<ItemDTO>> response = restTemplate.exchange("http://localhost:8081/items?ids={ids}",
        HttpMethod.GET,
        null,
        new ParameterizedTypeReference<List<ItemDTO>>() {},
        Map.of("ids", CollUtil.join(itemIds, ",")));
if (!response.getStatusCode().is2xxSuccessful()) {
    return;
}
List<ItemDTO> items = response.getBody();
if (CollUtils.isEmpty(items)) {
    return;
}
```

参数分别是：
- 请求路径
- 请求方式
- 请求实体
- 返回值类型
- 请求参数

Java发送http请求可以使用Spring提供的RestTemplate，使用的基本步骤如下：
- 注册RestTemplate到Spring容器
- 调用RestTemplate的API发送请求，常见方法有：
  - getForObject：发送Get请求并返回指定类型对象
  - PostForObject：发送Post请求并返回指定类型对象
  - put：发送PUT请求
  - delete：发送Delete请求
  - exchange：发送任意类型请求，返回ResponseEntity



## 服务注册和发现
刚刚手动发送Http请求的方式存在一些问题。

假如商品微服务被调用较多，为了应对更高的并发，我们进行了多实例部署

此时，每个`item-service`的实例其IP或端口不同，问题来了：
- `item-service`这么多实例，`cart-service`如何知道每一个实例的地址？
- http请求要写url地址，`cart-service`服务到底该调用哪个实例呢？
- 如果在运行过程中，某一个`item-service`实例宕机，`cart-service`依然在调用该怎么办？
- 如果并发太高，`item-service`临时多部署了N台实例，`cart-service`如何知道新实例的地址？

#### **注册中心原理**
在微服务远程调用的过程中，包括两个角色：
- 服务提供者：提供接口供其它微服务访问，比如item-service
- 服务消费者：调用其它微服务提供的接口，比如cart-service
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-07_20-04-22.png)


#### **总结**
1. 服务治理中的三个角色分别是什么?

- 服务提供者:暴露服务接口，供其它服务调用
- 服务消费者:调用其它服务提供的接口
- 注册中心:记录并监控微服务各实例状态，推送服务变更信息

2. 消费者如何知道提供者的地址?

- 服务提供者会在启动时注册自己信息到注册中心，消费者可以从注册中心订阅和拉取服务信息

3. 消费者如何得知服务状态变更?
- 服务提供者通过心跳机制向注册中心报告自己的健康状态，当心跳异常时注册中心会将异常服务剔除，并通知订阅了该服务的消费者

4. 当提供者有多个实例时，消费者该选择哪一个?
- 消费者可以通过负载均衡算法，从多个实例中选择一个

### Nacos注册中心

目前开源的注册中心框架有很多，国内比较常见的有：
- `Eureka`：`Netflix`公司出品，目前被集成在`SpringCloud`当中，一般用于Java应用
- `Nacos`：`Alibaba`公司出品，目前被集成在`SpringCloudAlibaba`中，一般用于Java应用
- `Consul`：`HashiCorp`公司出品，目前集成在`SpringCloud`中，不限制微服务语言

以上几种注册中心都遵循SpringCloud中的API规范，因此在业务开发使用上没有太大差异。由于Nacos是国内产品，中文文档比较丰富，而且同时具备配置管理功能

Nacos是目前国内企业中占比最多的注册中心组件。它是阿里巴巴的产品，目前已经加入`SpringCloudAlibaba`中。

Nacos博客地址：[博客](https://nacos.io/blog/nacos-gvr7dx_awbbpb_gg16sv97bgirkixe/?spm=5238cd80.2ef5001f.0.0.3f613b7cTCVaJH)

#### 搭建
1. 执行sql文件

文件地址：[地址](https://zzyang.oss-cn-hangzhou.aliyuncs.com/sql/nacos.sql)

表结构如下

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/sql/Snipaste_2025-05-07_20-44-14.png)

2. docker中安装nacos

上传nacos.tar镜像
```Bash
docker load -i nacos.tar
```

3. 编写并上传`custom.env`文件

```
PREFER_HOST_MODE=hostname
MODE=standalone
SPRING_DATASOURCE_PLATFORM=mysql
MYSQL_SERVICE_HOST=192.168.146.131
MYSQL_SERVICE_DB_NAME=nacos
MYSQL_SERVICE_PORT=3306
MYSQL_SERVICE_USER=root
MYSQL_SERVICE_PASSWORD=123
MYSQL_SERVICE_DB_PARAM=characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai
```

4. 执行`nacos`

```Bash
docker run -d \
--name nacos \
--env-file ./nacos/custom.env \
-p 8848:8848 \
-p 9848:9848 \
-p 9849:9849 \
--restart=always \
nacos/nacos-server:v2.1.0-slim
```

5. 访问 http://192.168.146.131:8848/nacos/

首次访问会跳转到登录页，账号密码都是`nacos`

### 服务注册

注册到Nacos，步骤如下：
- 引入依赖
- 配置Nacos地址
- 重启

**步骤**

1. 引入依赖
```xml
<!--nacos 服务注册发现-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

2. 配置Nacos

application.yml中添加nacos地址配置：

```yml
spring:
  application:
    name: item-service # 服务名称
  cloud:
    nacos:
      server-addr: 192.168.146.131:8848 # nacos地址
```

3. 重启项目

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-07_21-24-42.png)

### 服务发现

服务的消费者要去nacos订阅服务，这个过程就是服务发现，步骤如下：
- 引入依赖
- 配置Nacos地址
- 发现并调用服务


消费者需要连接nacos以拉取和订阅服务，因此服务发现的前两步与服务注册是一样，后面再加上服务调用即可：

**步骤：**

1. 还是先添加依赖
```xml
<!--nacos 服务注册发现-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

2. 添加yml文件
```yml
spring:
  cloud:
    nacos:
      server-addr: 192.168.150.101:8848
```

3. 发现并调用服务

接下来，服务调用者cart-service就可以去订阅item-service服务了。不过item-service有多个实例，而真正发起调用时只需要知道一个实例的地址。
因此，服务调用者必须利用负载均衡的算法，从多个实例中挑选一个去访问。常见的负载均衡算法有：
- 随机
- 轮询
- IP的hash
- 最近最少访问
- ...
这里我们可以选择最简单的随机负载均衡。

服务发现需要用到一个工具，DiscoveryClient，SpringCloud已经帮我们自动装配，我们可以直接注入使用：

```java
@RequiredArgsConstructor
public class


private final DiscoveryClient discoveryClient;



// 1.根据服务名称，拉取服务的实例列表
List<ServiceInstance> instances = discoveryClient.getInstances("item-service");
if (CollUtils.isEmpty(instances)) {
    return;
}
// 2.负载均衡，挑选一个实例
ServiceInstance instance = instances.get(RandomUtil.randomInt(instances.size()));
// 3.获取实例的IP和端口
ResponseEntity<List<ItemDTO>> response = restTemplate.exchange(instance.getUri() + "/items?ids={ids}",
        HttpMethod.GET,
        null,
        new ParameterizedTypeReference<List<ItemDTO>>() {
        },
        Map.of("ids", CollUtil.join(itemIds, ",")));
```

## OpenFeign
OpenFeign是一个声明式的http客户端，是SpringCloud在Eureka公司开源的Feign基础上改造而来。官方地址：https://github.com/OpenFeign/feign

其作用就是基于SpringMVC的常见注解，帮我们优雅的实现http请求的发送。



### 快速入门
OpenFeign已经被SpringCloud自动装配，实现起来非常简单：

1. 引入依赖，包括OpenFeign和负载均衡组件SpringCloudLoadBalancer
```xml
  <!--openFeign-->
  <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-openfeign</artifactId>
  </dependency>
  <!--负载均衡器-->
  <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-loadbalancer</artifactId>
  </dependency>
```

2. 通过@EnableFeignClients注解，启用OpenFeign功能
```java
@MapperScan("com.hmall.cart.mapper")
@SpringBootApplication
@EnableFeignClients
public class CartApplication {
    public static void main(String[] args) {
        SpringApplication.run(CartApplication.class, args);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

3. 创建client文件夹ItemClient接口
```java
@FeignClient("item-service")
public interface ItemClient {

    @GetMapping("/items")
    List<ItemDTO> queryItemByIds(@RequestParam("ids") Collection ids);
}
```

4. 注入并调用
```java
@RequiredArgsConstructor

private final ItemClient itemClient;


Set<Long> itemIds = vos.stream().map(CartVO::getItemId).collect(Collectors.toSet());

List<ItemDTO> items = itemClient.queryItemByIds(itemIds);

if (CollUtils.isEmpty(items)) {
    return;
}
```

feign替我们完成了服务拉取、负载均衡、发送http请求的所有工作，是不是看起来优雅多了。

而且，这里我们不再需要RestTemplate了，还省去了RestTemplate的注册。


:::warning
注意：负载均衡早期用的是**springCloud**里的`Ribbon`，现在新版本都是用`loadbalancer`
:::


### 连接池

OpenFeiqn对Http请求做了优雅的伪装，不过其底层发起http请求，依赖于其它的框架。这些框架可以自己选择，包括以下三种:
- HttpURLconnection:默认实现，不支持连接池
- Apache HttpClient:支持连接池
- OKHttp:支持连接池
具体源码可以参考FeignBlockingLoadBalancerClient类中的delegate成员变量

**使用步骤**

1. 引入依赖
```xml
<!--OK http 的依赖 -->
<dependency>
  <groupId>io.github.openfeign</groupId>
  <artifactId>feign-okhttp</artifactId>
</dependency>
```


2. 开启连接池功能
```yml
feign:
  okhttp:
    enabled: true # 开启OKHttp功能
```
重启服务，连接池就生效了。


### 实践

一个服务中的FeignClient需要被其他多个服务调用，我们就需要在每个不同服务中定义多个相同接口，这不是重复编码吗？ 有什么办法能加避免重复编码呢？

避免重复编码的办法就是抽取。不过这里有两种抽取思路：
- 思路1：抽取到微服务之外的公共module
- 思路2：每个微服务自己抽取一个module

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-09_21-34-30.png)

方案1抽取更加简单，工程结构也比较清晰，但缺点是整个项目耦合度偏高。

方案2抽取相对麻烦，工程结构相对更复杂，但服务之间耦合度降低。

**方案2步骤**


抽取Feign客户端，新建一个moudule，`xxxx-api`

该模块依赖如下
```xml
 <!--open feign-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
<!-- load balancer-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
<!-- swagger 注解依赖 -->
<dependency>
    <groupId>io.swagger</groupId>
    <artifactId>swagger-annotations</artifactId>
    <version>1.6.6</version>
    <scope>compile</scope>
</dependency>
```

把公共的客户端拷贝到该`xxxxx-api`模块



现在，任何微服务要调用`公共的FeignClient`中的接口，只需要引入`xxxx-api`模块依赖即可，无需自己编写Feign客户端了。


在其他服务中引入该api模块
```xml
  <!--feign模块-->
  <dependency>
      <groupId>com.heima</groupId>
      <artifactId>hm-api</artifactId>
      <version>1.0.0</version>
  </dependency>
```

重启项目，发现报错了：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-09_21-46-03.png)

这里因为ItemClient现在定义到了com.hmall.api.client包下，而cart-service的启动类定义在com.hmall.cart包下，扫描不到ItemClient，所以报错了。

解决办法很简单，在cart-service的启动类上添加声明即可，两种方式：

- 方式1：声明扫描包：
```java
@EnableFeignClients(basePackages = "com.hmall.api.client")
public class CartApplication {}
```

- 方式2：声明要用的FeignClient

```java
@EnableFeignClients(clients = {ItemClient.class})
public class CartApplication {}
```




### 日志配置
OpenFeign只会在FeignClient所在包的日志级别为DEBUG时，才会输出日志。而且其日志级别有4级:
- NONE:不记录任何日志信息，这是默认值。
- BASIC:仅记录请求的方法，URL以及响应状态码和执行时间
- HEADERS:在BASIC的基础上，额外记录了请求和响应的头信息
- FULL:记录所有请求和响应的明细，包括头信息、请求体、元数据。

由于Feign默认的日志级别就是NONE，所以默认我们看不到请求日志


在hm-api模块下新建一个配置类
```java

import feign.Logger;
import org.springframework.context.annotation.Bean;

public class DefaultFeignConfig {
    @Bean
    public Logger.Level feignLogLevel(){
        return Logger.Level.FULL;
    }
}
```

**配置**

在其他服务Module模块启动类中配置

接下来，要让日志级别生效，还需要配置这个类。有两种方式：
- 局部生效：在某个FeignClient中配置，只对当前FeignClient生效

```java
@FeignClient(value = "item-service", configuration = DefaultFeignConfig.class)
```

- 全局生效：在@EnableFeignClients中配置，针对所有FeignClient生效。
```java
@EnableFeignClients(defaultConfiguration = DefaultFeignConfig.class)
```


日志格式：
```java
22:18:52:730 DEBUG 9844 --- [nio-8082-exec-1] com.hmall.api.client.ItemClient          : [ItemClient#queryItemByIds] <--- HTTP/1.1 200  (1280ms)
22:18:52:730 DEBUG 9844 --- [nio-8082-exec-1] com.hmall.api.client.ItemClient          : [ItemClient#queryItemByIds] connection: keep-alive
22:18:52:730 DEBUG 9844 --- [nio-8082-exec-1] com.hmall.api.client.ItemClient          : [ItemClient#queryItemByIds] content-type: application/json
22:18:52:730 DEBUG 9844 --- [nio-8082-exec-1] com.hmall.api.client.ItemClient          : [ItemClient#queryItemByIds] date: Fri, 09 May 2025 14:18:52 GMT
22:18:52:730 DEBUG 9844 --- [nio-8082-exec-1] com.hmall.api.client.ItemClient          : [ItemClient#queryItemByIds] keep-alive: timeout=60
22:18:52:730 DEBUG 9844 --- [nio-8082-exec-1] com.hmall.api.client.ItemClient          : [ItemClient#queryItemByIds] transfer-encoding: chunked
22:18:52:730 DEBUG 9844 --- [nio-8082-exec-1] com.hmall.api.client.ItemClient          : [ItemClient#queryItemByIds]
22:18:52:732 DEBUG 9844 --- [nio-8082-exec-1] com.hmall.api.client.ItemClient          : [ItemClient#queryItemByIds] [{"id":"100000006163","name":"巴布豆(BOBDOG)柔薄悦动婴儿拉拉裤XXL码80片(15kg以上)","price":67100,"stock":10000,"image":"https://m.360buyimg.com/mobilecms/s720x720_jfs/t23998/350/2363990466/222391/a6e9581d/5b7cba5bN0c18fb4f.jpg!q70.jpg.webp","category":"拉拉裤","brand":"巴布豆","spec":"{}","sold":11,"commentCount":33343434,"isAD":false,"status":2}]
22:18:52:732 DEBUG 9844 --- [nio-8082-exec-1] com.hmall.api.client.ItemClient          : [ItemClient#queryItemByIds] <--- END HTTP (371-byte body)
```

### 总结

- 如何利用OpenFeign实现远程调用?
1. 引入OpeFeign和SpringCloudLoadBalancer依赖
2. 利用@EnableFeignClients注解开启OpenFeiqn功能
3. 编写FeignClient
---
- 如何配置OpenFeign的连接池?
1. 引入http客户端依赖，例如OKHttp、HttpClient
2. 配置yaml文件，打开OpenFeign连接池开关
---
- OpenFeign使用的最佳实践方式是什么?

1. 由服务提供者编写独立module，将FeignClient及DTO抽取
---
- 如何配置OpenFeign输出日志的级别?
1. 声明类型为Logger.Level的Bean
2. 在@FeignClient或@EnableFeignclient注解上使用



## 网关路由

**网关**

就是网络的关口，负责请求的路由、转发、身份校验。

- 网关可以做安全控制，也就是登录身份校验，校验通过才放行
- 通过认证后，网关再根据请求判断应该访问哪个微服务，将请求转发过去

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-12_20-16-42.png)

在SpringCloud当中，提供了两种网关实现方案：
- Netflix Zuul：早期实现，目前已经淘汰
- SpringCloudGateway：基于Spring的WebFlux技术，完全支持响应式编程，吞吐能力更强
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-12_20-18-38.png)


### 使用步骤

1. 首先，我们要在根目录下创建一个新的module，命名为hm-gateway，作为网关微服务：

2. 引入依赖
```xml
 <dependencies>
    <!--common-->
    <dependency>
        <groupId>com.heima</groupId>
        <artifactId>hm-common</artifactId>
        <version>1.0.0</version>
    </dependency>
    <!--网关-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-gateway</artifactId>
    </dependency>
    <!--nacos discovery-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
    <!--负载均衡-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-loadbalancer</artifactId>
    </dependency>
</dependencies>
<build>
    <finalName>${project.artifactId}</finalName>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```



3. 启动类

```java
@SpringBootApplication
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
```

4. 配置路由

接下来，在hm-gateway模块的resources目录新建一个application.yaml文件


```yaml
server:
  port: 8080
spring:
  application:
    name: gateway
  cloud:
    nacos:
      server-addr: 192.168.150.101:8848
    gateway:
      routes:
        - id: item # 路由规则id，自定义，唯一
          uri: lb://item-service # 路由的目标服务，lb代表负载均衡，会从注册中心拉取服务列表
          predicates: # 路由断言，判断当前请求是否符合当前规则，符合则路由到目标服务
            - Path=/items/**,/search/** # 这里是以请求路径作为判断规则
        - id: cart
          uri: lb://cart-service
          predicates:
            - Path=/carts/**
        - id: user
          uri: lb://user-service
          predicates:
            - Path=/users/**,/addresses/**
        - id: trade
          uri: lb://trade-service
          predicates:
            - Path=/orders/**
        - id: pay
          uri: lb://pay-service
          predicates:
            - Path=/pay-orders/**

```


### 路由属性
网关路由对应的Java类型是`RouteDefinition`，其中常见的属性有

四个属性含义如下：
- `id`：路由的唯一标示
- `predicates`：路由断言，其实就是匹配条件
- `filters`：路由过滤条件，后面讲
- `uri`：路由目标地址，`lb://`代表负载均衡，从注册中心获取目标微服务的实例列表，并且负载均衡选择一个访问。

我们重点关注predicates，也就是路由断言。SpringCloudGateway中支持的断言类型有很多：

Spring提供了12种基本的`RoutePredicateFactory`实现:

|  名称  |    说明       |   示例        |
|  ----  |---------------|    ----|
|   After |      是某个时间点后的请求     |    - After=2037-01-20T17:42:47.789-07:00[America/Denver]    |
|  Before  |     是某个时间点之前的请求      |    - Before=2031-04-13T15:14:47.433+08:00[Asia/Shanghai]    |
|  Between  |    是某两个时间点之前的请求       |- Between=2037-01-20T17:42:47.789-07:00[America/Denver], 2037-01-21T17:42:47.789-07:00[America/Denver]|
|  Cookie  |      请求必须包含某些cookie     |     - Cookie=chocolate, ch.p   |
|  Header  |      请求必须包含某些header     |    - Header=X-Request-Id, \d+    |
|   Host |       请求必须是访问某个host（域名）    |    - Host=**.somehost.org,**.anotherhost.org    |
|   Method |     请求方式必须是指定方式      |     - Method=GET,POST   |
|   Path |       请求路径必须符合指定规则     |    - Path=/red/{segment},/blue/**    |
|  Query  |         请求参数必须包含指定参数   |     - Query=name, Jack或者- Query=name   |
|  RemoteAddr  |    请求者的ip必须是指定范围        |    - RemoteAddr=192.168.1.1/24    |
|  weight  |       权重处理     |        |



#### 路由过滤器

网关中提供了33种路由过滤器，每种过滤器都有独特的作用。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-12_21-34-18.png)

**测试1**
在gateway中配置

```yaml{13-14} yaml
spring:
  application:
    name: gateway
  cloud:
    nacos:
      server-addr: 192.168.146.131:8848
    gateway:
      routes:
        - id: item-service
          uri: lb://item-service
          predicates:
            - Path=/items/**,/search/**
          filters:
            - AddRequestHeader=truth, 123456
```

```java
public PageDTO<ItemDTO> queryItemByPage(PageQuery query, @RequestHeader(value = "truth", required = false) String truth) {
        System.out.println("truth" + truth);
```


**测试2**
默认过滤器，对所有路由都生效

```yaml{23-24}  yaml
    gateway:
      routes:
        - id: item-service
          uri: lb://item-service
          predicates:
            - Path=/items/**,/search/**
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/addresses/**,/users/**
        - id: cart-service
          uri: lb://cart-service
          predicates:
            - Path=/carts/**
        - id: pay-service
          uri: lb://pay-service
          predicates:
            - Path=/pay-orders/**
        - id: trade-service
          uri: lb://trade-service
          predicates:
            - Path=/orders/**
      default-filters:
        - AddRequestHeader=truth, 123456
```

### 网关过滤器

登录校验必须在请求转发到微服务之前做，否则就失去了意义。而网关的请求转发是Gateway内部代码实现的，要想在请求转发之前做登录校验，就必须了解Gateway内部工作的基本原理。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-12_21-55-02.png)

如图所示：
1. 客户端请求进入网关后由`HandlerMapping`对请求做判断，找到与当前请求匹配的路由规则（Route），然后将请求交给`WebHandler`去处理。
2. `WebHandler`则会加载当前路由下需要执行的过滤器链（Filter chain），然后按照顺序逐一执行过滤器（后面称为Filter）。
3. 图中`Filter`被虚线分为左右两部分，是因为`Filter`内部的逻辑分为`pre`和`post`两部分，分别会在请求路由到微服务之前和之后被执行。
4. 只有所有`Filter`的`pre`逻辑都依次顺序执行通过后，请求才会被路由到微服务。
5. 微服务返回结果后，再倒序执行`Filter`的`post`逻辑。
6. 最终把响应结果返回。

最终请求转发是有一个名为`NettyRoutingFilter`的过滤器来执行的，而且这个过滤器是整个过滤器链中顺序最靠后的一个。**如果我们能够定义一个过滤器，在其中实现登录校验逻辑，并且将过滤器执行顺序定义到`NettyRoutingFilter`之前**，这就符合我们的需求了！

那么，该如何实现一个网关过滤器呢？

网关过滤器链中的过滤器有两种：
- `GatewayFilter`：路由过滤器，作用范围比较灵活，可以是任意指定的路由`Route`.
- `GlobalFilter`：全局过滤器，作用范围是所有路由，不可配置。


### 自定义过滤器
无论是GatewayFilter还是GlobalFilter都支持自定义，只不过编码方式、使用方式略有差别。

网关过滤器有两种，分别是:
- `GatewayFilter`:路由过滤器，作用于任意指定的路由;默认不生效，要配置到路由后生效。
- `GlobalFilter`:全局过滤器，作用范围是所有路由;声明后自动生效



#### GlobalFilter

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-14_20-22-25.png)

`gateway`包下创建`filters`,再创建`MyGlobalFilter`
```java [MyGlobalFilter.java]
@Component
public class MyGlobalFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // 模拟登录校验
        ServerHttpRequest exchangeRequest = exchange.getRequest();
        HttpHeaders headers = exchangeRequest.getHeaders();
        System.out.println("headers:" + headers);
        // 放行
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
    // 过滤器执行顺序，值越小，优先级越高
        return 0;
    }
}
```


### 实现登录校验
需求:在网关中基于过滤器实现登录校验功能

```java [AuthGlobalFilter.java]
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    private final AuthProperties authProperties;
    private final JwtTool jwtTool;
    private final AntPathMatcher antPathMatcher = new AntPathMatcher();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        if (isExculed(request.getPath().toString())) {
            return chain.filter(exchange);
        }
        String token = null;
        List<String> headers = request.getHeaders().get("authorization");
        if (headers != null && !headers.isEmpty()) {
            token = headers.get(0);
        }
        Long userId = null;
        try {
            userId = jwtTool.parseToken(token);
        } catch (UnauthorizedException e) {
            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return response.setComplete();
        }
        // 传递用户信息
        log.info("userId:{}", userId);

        return chain.filter(exchange);
    }

    private boolean isExculed(String string) {
        for (String excludePath : authProperties.getExcludePaths()) {
            if (antPathMatcher.match(excludePath, string)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
```

```yaml [application.yaml]
hm:
  jwt:
    location: classpath:hmall.jks
    alias: hmall
    password: hmall123
    tokenTTL: 30m
  auth:
    excludePaths:
      - /search/**
      - /users/login
      - /items/**
      - /hi
```

**utils**
```java
@Component
public class JwtTool {
    private final JWTSigner jwtSigner;

    public JwtTool(KeyPair keyPair) {
        this.jwtSigner = JWTSignerUtil.createSigner("rs256", keyPair);
    }

    /**
     * 创建 access-token
     *
     * @param
     * @return access-token
     */
    public String createToken(Long userId, Duration ttl) {
        // 1.生成jws
        return JWT.create()
                .setPayload("user", userId)
                .setExpiresAt(new Date(System.currentTimeMillis() + ttl.toMillis()))
                .setSigner(jwtSigner)
                .sign();
    }

    /**
     * 解析token
     *
     * @param token token
     * @return 解析刷新token得到的用户信息
     */
    public Long parseToken(String token) {
        // 1.校验token是否为空
        if (token == null) {
            throw new UnauthorizedException("未登录");
        }
        // 2.校验并解析jwt
        JWT jwt;
        try {
            jwt = JWT.of(token).setSigner(jwtSigner);
        } catch (Exception e) {
            throw new UnauthorizedException("无效的token", e);
        }
        // 2.校验jwt是否有效
        if (!jwt.verify()) {
            // 验证失败
            throw new UnauthorizedException("无效的token");
        }
        // 3.校验是否过期
        try {
            JWTValidator.of(jwt).validateDate();
        } catch (ValidateException e) {
            throw new UnauthorizedException("token已经过期");
        }
        // 4.数据格式校验
        Object userPayload = jwt.getPayload("user");
        if (userPayload == null) {
            // 数据为空
            throw new UnauthorizedException("无效的token");
        }

        // 5.数据解析
        try {
           return Long.valueOf(userPayload.toString());
        } catch (RuntimeException e) {
            // 数据格式有误
            throw new UnauthorizedException("无效的token");
        }
    }
}
```

```java [AuthProperties.java]
@Data
@Component
@ConfigurationProperties(prefix = "hm.auth")
public class AuthProperties {
    private List<String> includePaths;
    private List<String> excludePaths;
}
```


```java [JwtProperties.java]
@Data
@ConfigurationProperties(prefix = "hm.jwt")
public class JwtProperties {
    private Resource location;
    private String password;
    private String alias;
    private Duration tokenTTL = Duration.ofMinutes(10);
}
```

```java [SecurityConfig.java]
@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public KeyPair keyPair(JwtProperties properties){
        // 获取秘钥工厂
        KeyStoreKeyFactory keyStoreKeyFactory =
                new KeyStoreKeyFactory(
                        properties.getLocation(),
                        properties.getPassword().toCharArray());
        //读取钥匙对
        return keyStoreKeyFactory.getKeyPair(
                properties.getAlias(),
                properties.getPassword().toCharArray());
    }
}
```


具体作用如下：
- `AuthProperties`：配置登录校验需要拦截的路径，因为不是所有的路径都需要登录才能访问
- `JwtProperties`：定义与JWT工具有关的属性，比如秘钥文件位置
- `SecurityConfig`：工具的自动装配
- `JwtTool`：JWT工具，其中包含了校验和解析token的功能
- `hmall.jks`：秘钥文件

:::info
`@ConfigurationProperties(prefix = "hm.auth")` 是 Spring Boot 提供的一个注解，用于将配置文件（如 `application.properties` 或 `application.yml`）中的属性值绑定到 Java 对象中。
<br>
<br>

`AntPathMatcher` 是 Spring 框架提供的一个工具类，用于匹配路径模式（`Path Patterns`）。在权限控制中验证用户是否有权访问某个路径。
:::

```java
antPathMatcher.match("/user/*.json", "/user/profile.json"); // true
antPathMatcher.match("/**/*.html", "/pages/home/index.html"); // true
```


### 网关传递用户

1. 我们修改登录校验拦截器的处理逻辑，保存用户信息到请求头中：
```java
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    private final AuthProperties authProperties;
    private final JwtTool jwtTool;
    private final AntPathMatcher antPathMatcher = new AntPathMatcher();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        if (isExculed(request.getPath().toString())) {
            return chain.filter(exchange);
        }
        String token = null;
        List<String> headers = request.getHeaders().get("authorization");
        if (headers != null && !headers.isEmpty()) {
            token = headers.get(0);
        }
        Long userId = null;
        try {
            userId = jwtTool.parseToken(token);
        } catch (UnauthorizedException e) {
            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return response.setComplete();
        }
        // 传递用户信息
        String userInfo = userId.toString();
        ServerWebExchange serverWebExchange = exchange.mutate()  // mutate就是对下游请求做更改
                .request(builder -> builder.header("user-info", userInfo))
                .build();
        log.info("userId:{}", userId);

        return chain.filter(serverWebExchange);
    }

    private boolean isExculed(String string) {
        for (String excludePath : authProperties.getExcludePaths()) {
            if (antPathMatcher.match(excludePath, string)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
```

2. 在hm-common中编写`SpringMVC`拦截器，获取登录用户

需求:由于每个微服务都可能有获取登录用户的需求，因此我们直接在hm-common模块定义拦截器
这样微服务只需要引入依赖即可生效，无需重复编写。

```java [UserInfoInterceptor.java]
public class UserInfoInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 获取登录用户信息
        String userInfo = request.getHeader("user-info");
        // 是否获取了用户，如果有存入ThreadLocal
        if (StrUtil.isNotBlank(userInfo)) {
            UserContext.setUser(Long.valueOf(userInfo));
        }
        // 放行
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        UserContext.removeUser();
    }
}
```

```java [MvcConfig.java]
@Configuration
@ConditionalOnClass(DispatcherServlet.class)
public class MvcConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new UserInfoInterceptor());
    }
}
```

不过，需要注意的是，这个配置类默认是不会生效的，因为它所在的包是`com.hmall.common.config`，与其它微服务的扫描包不一致，无法被扫描到，因此无法生效。
基于`SpringBoot`的自动装配原理，我们要将其添加到`resources`目录下的`META-INF/spring.factories`文件中：

common的`resources`下的`META-INF`
``` [spring.factories]
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.hmall.common.config.MyBatisConfig,\
  com.hmall.common.config.JsonConfig,\
  com.hmall.common.config.MvcConfig
```

`common`的`utils`包下的`UserContext`
```java [UserContext.java]
public class UserContext {
    private static final ThreadLocal<Long> tl = new ThreadLocal<>();

    /**
     * 保存当前登录用户信息到ThreadLocal
     * @param userId 用户id
     */
    public static void setUser(Long userId) {
        tl.set(userId);
    }

    /**
     * 获取当前登录用户信息
     * @return 用户id
     */
    public static Long getUser() {
        return tl.get();
    }

    /**
     * 移除当前登录用户信息
     */
    public static void removeUser(){
        tl.remove();
    }
}
```

:::tip
`@ConditionalOnClass` 的作用是检查类路径中是否存在指定的类。如果存在，则加载被标注的配置或组件；否则，忽略该配置。

在微服务或多模块项目中，可以根据运行时的类路径动态加载不同的配置。我们希望他在网关中不要加载，因为网关是基于`WebFlux`加载会报错
:::


### OpenFeign传递用户
微服务之间传递用户信息

前端发起的请求都会经过网关再到微服务，由于我们之前编写的过滤器和拦截器功能，微服务可以轻松获取登录用户信息。

但有些业务是比较复杂的，请求到达微服务后还需要调用其它多个微服务。比如下单业务，流程如下：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-14_21-52-23.png)

下单的过程中，需要调用商品服务扣减库存，调用购物车服务清理用户购物车。而清理购物车时必须知道当前登录的用户身份。但是，**订单服务调用购物车时并没有传递用户信息**，购物车服务无法知道当前用户是谁！

由于微服务获取用户信息是通过拦截器在请求头中读取，因此要想实现微服务之间的用户信息传递，就**必须在微服务发起调用时把用户信息存入请求头**。



OpenFeign中提供了一个拦截器接口，所有由OpenFeign发起的请求都会先调用拦截器处理请求：

由于FeignClient全部都是在hm-api模块，因此我们在hm-api模块的com.hmall.api.config.DefaultFeignConfig中编写这个拦截器：


在hm-api中的config的`DefaultFeignConfig`中
```java
public class DefaultFeignConfig {
    @Bean
    public Logger.Level feignLogLevel() {
        return Logger.Level.FULL;
    }

    @Bean
    public RequestInterceptor userInfoRequestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate requestTemplate) {
                Long userId = UserContext.getUser();
                if (userId != null) {
                    requestTemplate.header("user-info", userId.toString());
                }
            }
        };
    }
}
```

启动类上配置
```java
@EnableFeignClients(basePackages = "com.hmall.api.client", defaultConfiguration = DefaultFeignConfig.class)
public class TradeApplication {}
```

好了，现在微服务之间通过OpenFeign调用时也会传递登录用户信息了。









![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-14_22-07-04.png)




## 配置管理

- 微服务重复配置过多，维护成本高
- 业务配置经常变动，每次修改都要重启服务
- 网关路由配置写死，如果变更要重启网关

### 配置共享


1. 添加配置到`Nacos`

添加一些共享配置到`Nacos`中，包括:`Jdbc`、`MybatisPlus`、日志、`Swagger`、`OpenFeign`等配置

```yaml [shared-jdbc.yaml]
spring:
  datasource:
    url: jdbc:mysql://${hm.db.host}:${hm.db.port:3306}/${hm.db.database}?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&serverTimezone=Asia/Shanghai
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: ${hm.db.un:root}
    password: ${hm.db.pw:123}
mybatis-plus:
  configuration:
    default-enum-type-handler: com.baomidou.mybatisplus.core.handlers.MybatisEnumTypeHandler
  global-config:
    db-config:
      update-strategy: not_null
      id-type: auto
```

```yaml [shared-log.yaml]
logging:
  level:
    com.hmall: debug
  pattern:
    dateformat: HH:mm:ss:SSS
  file:
    path: "logs/${spring.application.name}"
```

```yaml [shared-swagger.yaml]
knife4j:
  enable: true
  openapi:
    title: ${hm.swagger.title:黑马商城接口文档}
    description: ${hm.swagger.desc:黑马商城接口文档}
    email: zxyang3636@163.com
    concat: zzyang
    url: https://www.zzyang.top
    version: v1.0.0
    group:
      default:
        group-name: default
        api-rule: package
        api-rule-resources:  # Swagger扫描到Controller，会把Controller接口信息作为接口文档信息
          - ${hm.swagger.package}
```

2. 拉取共享配置

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-15_19-56-07.png)

读取Nacos配置是SpringCloud上下文（ApplicationContext）初始化时处理的，发生在项目的引导阶段。然后才会初始化SpringBoot上下文，去读取application.yaml。
也就是说引导阶段，application.yaml文件尚未读取，根本不知道nacos 地址，该如何去加载nacos中的配置文件呢？

SpringCloud在初始化上下文的时候会先读取一个名为bootstrap.yaml(或者bootstrap.properties)的文件，如果我们将nacos地址配置到bootstrap.yaml中，那么在项目引导阶段就可以读取nacos中的配置了。

**引入依赖**

```xml
  <!--nacos配置管理-->
  <dependency>
      <groupId>com.alibaba.cloud</groupId>
      <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
  </dependency>
  <!--读取bootstrap文件-->
  <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-bootstrap</artifactId>
  </dependency>
```

新建`bootstrap.yaml`

在cart-service中的resources目录新建一个bootstrap.yaml文件：

*内容如下：*
```yaml
spring:
  application:
    name: cart-service # 服务名称
  profiles:
    active: dev
  cloud:
    nacos:
      server-addr: 192.168.146.131:8848 # nacos地址
      config:
        file-extension: yaml # 文件后缀名
        shared-configs: # 共享配置
          - dataId: shared-jdbc.yaml # 共享mybatis配置
          - dataId: shared-log.yaml # 共享日志配置
          - dataId: shared-swagger.yaml # 共享日志配置
```


修改`application.yaml`

```yaml
server:
  port: 8082
feign:
  okhttp:
    enabled: true # 开启OKHttp连接池支持
hm:
  swagger:
    title: 购物车服务接口文档
    package: com.hmall.cart.controller
  db:
    database: hm-cart
```

重启服务，发现所有配置都生效了。

### 配置热更新

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/wechat_2025-05-15_202238_944.png)

1. 新建配置文件
```java [CartProperties.java]
@Data
@Component
@ConfigurationProperties(prefix = "hm.cart")
public class CartProperties {
    private Integer maxItems;
}
```

**注入**
```java
@Service
@RequiredArgsConstructor
public class CartServiceImpl extends ServiceImpl<CartMapper, Cart> implements ICartService {}

private final CartProperties cartProperties;

```

**改造代码**
```java
  private void checkCartsFull(Long userId) {
        int count = lambdaQuery().eq(Cart::getUserId, userId).count().intValue();
        if (count >= cartProperties.getMaxItems()) {
            throw new BizIllegalException(StrUtil.format("用户购物车课程不能超过{}", cartProperties.getMaxItems()));
        }
    }

```

2. nacos中创建

注意文件的dataId格式：
```
[服务名]-[spring.active.profile].[后缀名]
```

文件名称由三部分组成：
- 服务名：我们是购物车服务，所以是cart-service
- spring.active.profile：就是spring boot中的spring.active.profile，可以省略，则所有profile共享该配置
- 后缀名：例如yaml

我们直接使用`cart-service.yaml`这个名称，则不管是dev还是local环境都可以共享该配置。

```yaml [cart-service.yaml]
hm:
  cart:
    maxItems: 1 # 购物车商品数量上限
```

后续修改`maxItems`，无需重启服务，配置热更新就生效了！

### 动态路由

监听Nacos配置变更可以参考官方文档： https://nacos.io/zh-cn/docs/sdk.html


1. 网关中引入依赖
```xml
 <!--nacos配置管理-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<!--读取bootstrap文件-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-bootstrap</artifactId>
</dependency>
```


网关的bootstrap.yaml文件
```yaml [bootstrap.yaml]
spring:
  application:
    name: gateway
  cloud:
    nacos:
      server-addr: 192.168.146.131:8848
      config:
        file-extension: yaml
        shared-configs:
          - data-id: shared-log.yaml
  profiles:
    active: dev
```

```yaml [application.yaml]
server:
  port: 8080

hm:
  jwt:
    location: classpath:hmall.jks
    alias: hmall
    password: hmall123
    tokenTTL: 30m
  auth:
    excludePaths:
      - /search/**
      - /users/login
      - /items/**
      - /hi
```

网关中，新建`routers/DynamicRouteLoader.java`

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class DynamicRouteLoader {

    private final NacosConfigManager nacosConfigManager;
    private final RouteDefinitionWriter writer;

    private final String dataId = "gateway-routes.json";
    private final String group = "DEFAULT_GROUP";

    private final Set<String> routeIds = new HashSet<>();

    @PostConstruct
    public void initRouteConfigListener() throws NacosException {
        // 项目启动时，先拉取一次配置，并添加配置监听器
        String configInfo = nacosConfigManager.getConfigService()
                .getConfigAndSignListener(dataId, group, 5000, new Listener() {
                    @Override
                    public Executor getExecutor() {
                        return null;
                    }

                    @Override
                    public void receiveConfigInfo(String configInfo) {
                        // 2.监听到配置变更，更新路由表
                        updateConfigInfo(configInfo);
                    }
                });
        // 3.第一次读取到配置，也需要更新到路由表
        updateConfigInfo(configInfo);
    }

    public void updateConfigInfo(String configInfo) {
        log.debug("监听到路由配置信息：{}", configInfo);
        // 1.解析配置信息，转为RouteDefinition
        List<RouteDefinition> routeDefinitionList = JSONUtil.toList(configInfo, RouteDefinition.class);
        // 删除旧的路由表
        for (String routeId : routeIds) {
            writer.delete(Mono.just(routeId));
        }
        routeIds.clear();
        // 2.更新路由表
        for (RouteDefinition routeDefinition : routeDefinitionList) {
            // 更新路由表
            writer.save(Mono.just(routeDefinition)).subscribe();
            // 记录路由id，便于下一次更新时删除
            routeIds.add(routeDefinition.getId());
        }
    }
}
```



nacos配置

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-15_22-16-38.png)

`gateway-routes.json`

```json
[
    {
        "id": "item",
        "predicates": [{
            "name": "Path",
            "args": {"_genkey_0":"/items/**", "_genkey_1":"/search/**"}
        }],
        "filters": [],
        "uri": "lb://item-service"
    },
    {
        "id": "cart",
        "predicates": [{
            "name": "Path",
            "args": {"_genkey_0":"/carts/**"}
        }],
        "filters": [],
        "uri": "lb://cart-service"
    },
    {
        "id": "user",
        "predicates": [{
            "name": "Path",
            "args": {"_genkey_0":"/users/**", "_genkey_1":"/addresses/**"}
        }],
        "filters": [],
        "uri": "lb://user-service"
    },
    {
        "id": "trade",
        "predicates": [{
            "name": "Path",
            "args": {"_genkey_0":"/orders/**"}
        }],
        "filters": [],
        "uri": "lb://trade-service"
    },
    {
        "id": "pay",
        "predicates": [{
            "name": "Path",
            "args": {"_genkey_0":"/pay-orders/**"}
        }],
        "filters": [],
        "uri": "lb://pay-service"
    }
]
```


## 微服务保护

### 雪崩问题

微服务调用链路中的某个服务故障，引起整个链路中的所有微服务都不可用，这就是雪崩。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-19_21-23-31.png)
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-19_21-23-44.png)

**总结**

>雪崩问题产生的原因是什么?

- 微服务相互调用，服务提供者出现故障或阻塞。
- 服务调用者没有做好异常处理，导致自身故障。
- 调用链中的所有服务级联失败，导致整个集群故障


>解决问题的思路有哪些?

- 尽量避免服务出现故障或阻塞。

✅保证代码的健壮性;

✅保证网络畅通;

✅能应对较高的并发请求;




### 服务保护方案

*请求限流*

请求限流：限制访问微服务的请求的并发量，避免服务因流量激增出现故障，
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/wechat_2025-05-19_213425_995.png)

---

*线程隔离*


线程隔离:也叫做舱壁模式，模拟船舱隔板的防水原理。通过限定每个业务能使用的线程数量而将故障业务隔离，避免
故障扩散。

线程隔离的思想来自轮船的舱壁模式：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-19_21-51-21.png)

轮船的船舱会被隔板分割为N个相互隔离的密闭舱，假如轮船触礁进水，只有损坏的部分密闭舱会进水，而其他舱由于相互隔离，并不会进水。这样就把进水控制在部分船体，避免了整个船舱进水而沉没。

为了避免某个接口故障或压力过大导致整个服务不可用，我们可以限定每个接口可以使用的资源范围，也就是将其“隔离”起来。

---

*服务熔断*

服务熔断:由断路器统计请求的异常比例或慢调用比例，如果超出阈值则会熔断该业务，则拦截该接口的请求。熔断期间，所有请求快速失败，全都走`fallback`逻辑


---

>解决雪崩问题的常见方案有哪些?

- 请求限流:限制流量在服务可以处理的范围，避免因突发流量而故障
- 线程隔离:控制业务可用的线程数量，将故障隔离在一定范围
- 服务熔断:将异常比例过高的接口断开，拒绝所有请求，直接走fallback
- 失败处理:定义fallback逻辑，让业务失败时不再抛出异常，而是返回默认数据或友好提示


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-19_21-52-02.png)


### Sentinel
Sentinel是阿里巴巴开源的一款微服务流量控制组件。官网地址： https://sentinelguard.io/zh-cn/index.html

---

#### 安装运行Sentinel
将`jar包`放在任意非中文、不包含特殊字符的目录下，重命名为sentinel-dashboard.jar：

然后运行如下命令启动控制台：

```Shell
java -Dserver.port=8090 -Dcsp.sentinel.dashboard.server=localhost:8090 -Dproject.name=sentinel-dashboard -jar sentinel-dashboard.jar
```


访问`http://localhost:8090`页面，就可以看到`sentinel`的控制台了：

需要输入账号和密码，默认都是：`sentinel`

登录后，即可看到控制台，默认会监控sentinel-dashboard服务本身


:::info
sentinel安装地址：https://github.com/alibaba/Sentinel/releases


启动时可配置参数可参考官方文档：https://github.com/alibaba/Sentinel/wiki/%E5%90%AF%E5%8A%A8%E9%85%8D%E7%BD%AE%E9%A1%B9
:::

#### 微服务整合

引入sentinel依赖
```xml
<!--sentinel-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

修改`application.yaml`文件，添加下面内容：
```yaml
spring:
  cloud:
    sentinel:
      transport:
        dashboard: localhost:8090
```

重启`cart-service`，然后访问查询购物车接口，`sentinel`的客户端就会将服务访问的信息提交到sentinel-dashboard控制台。并展示出统计信息


*簇点链路*

所谓簇点链路，就是单机调用链路，是一次请求进入服务后经过的每一个被Sentinel监控的资源。默认情况下，Sentinel会监控SpringMVC的每一个Endpoint（接口）。
因此，我们看到/carts这个接口路径就是其中一个簇点，我们可以对其进行限流、熔断、隔离等保护措施。

不过，需要注意的是，我们的SpringMVC接口是按照Restful风格设计，因此购物车的查询、删除、修改等接口全部都是/carts路径：

默认情况下Sentinel会把路径作为簇点资源的名称，无法区分路径相同但请求方式不同的接口，查询、删除、修改等都被识别为一个簇点资源，这显然是不合适的。

所以我们可以选择打开Sentinel的请求方式前缀，把请求方式 + 请求路径作为簇点资源名：

首先，在cart-service的`application.yml`中添加下面的配置：

```yaml{6}[application.yml]
spring:
  cloud:
    sentinel:
      transport:
        dashboard: localhost:8090
      http-method-specify: true # 开启请求方式前缀
```


### 请求限流
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-19_22-27-38.png)




### 线程隔离
限流可以降低服务器压力，尽量减少因并发流量引起的服务故障的概率，但并不能完全避免服务故障。一旦某个服务出现故障，我们必须隔离对这个服务的调用，避免发生雪崩。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-20_20-51-15.png)




:::warning
需要注意的是，默认情况下SpringBoot项目的tomcat最大线程数是200，允许的最大连接是8492，单机测试很难打满。
:::

如果测试的话可以配置以下内容,我们需要配置一下cart-service模块的application.yml文件，修改tomcat连接：
```yaml
server:
  port: 8082
  tomcat:
    threads:
      max: 50 # 允许的最大线程数
    accept-count: 50 # 最大排队等待数量
    max-connections: 100 # 允许的最大连接
```

#### 配置线程隔离

1. 在簇点链路中点击`流控`按钮

2. 配置线程隔离⬇️
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-20_21-04-53.png)



注意，这里勾选的是并发线程数限制，也就是说这个查询功能最多使用5个线程，而不是5QPS。如果查询商品的接口每秒处理2个请求，则5个线程的实际QPS在10左右，而超出的请求自然会被拒绝。

此时如果我们通过页面访问购物车的其它接口，例如添加购物车、修改购物车商品数量，发现不受影响；

响应时间非常短，这就证明线程隔离起到了作用，尽管查询购物车这个接口并发很高，但是它能使用的线程资源被限制了，因此不会影响到其它接口。


### Fallback

Fallback实现逻辑

1. 将FeiqnClient作为Sentinel的簇点资源


2. FeignClient的Fallback有两种配置方式:
- 方式一:FallbackClass，无法对远程调用的异常做处理
- 方式二:FallbackFactory，可以对远程调用的异常做处理，通常都会选择这种


*步骤*

创建文件夹`com.hmall.api.client.fallback`
```java [ItemClientFallbackFactory.java]
@Slf4j
public class ItemClientFallbackFactory implements FallbackFactory<ItemClient> {


    @Override
    public ItemClient create(Throwable cause) {

        return new ItemClient() {
            @Override
            public List<ItemDTO> queryItemByIds(Collection<Long> ids) {
                log.error("查询商品失败", cause);
                return CollUtils.emptyList();
            }

            @Override
            public void deductStock(List<OrderDetailDTO> items) {
                log.error("扣减商品库存失败", cause);
                throw new RuntimeException(cause);
            }
        };
    }
}
```

**注册为bean**
```java{20-23}[DefaultFeignConfig.java]
public class DefaultFeignConfig {
    @Bean
    public Logger.Level feignLogLevel() {
        return Logger.Level.FULL;
    }

    @Bean
    public RequestInterceptor userInfoRequestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate requestTemplate) {
                Long userId = UserContext.getUser();
                if (userId != null) {
                    requestTemplate.header("user-info", userId.toString());
                }
            }
        };
    }

    @Bean
    public ItemClientFallbackFactory itemClientFallbackFactory() {
        return new ItemClientFallbackFactory();
    }
}
```


在ItemClient注解`FeignClient`上配置

```java{1}
@FeignClient(value = "item-service", fallbackFactory = ItemClientFallbackFactory.class)
public interface ItemClient {

    @GetMapping("/items")
    List<ItemDTO> queryItemByIds(@RequestParam("ids") Collection<Long> ids);

    @PutMapping("/items/stock/deduct")
    void deductStock(@RequestBody List<OrderDetailDTO> items);
}
```


修改调用者的`application.yaml`，也就是cart-service的
```yaml{5}
feign:
  okhttp:
    enabled: true # 开启OKHttp功能
  sentinel:
    enabled: true
```

---

### 服务熔断

熔断是解决雪崩问题的重要手段。思路是由`断路器`统计服务调用的异常比例、慢请求比例，如果超出阈值则会`熔断`该服务。即拦截访问该服务的一切请求;而当服务恢复时，断路器会放行访问该服务的请求


Sentinel中的断路器不仅可以统计某个接口的`慢请求比例`，还可以统计`异常请求比例`。当这些比例超出阈值时，就会`熔断`该接口，即拦截访问该接口的一切请求，降级处理；当该接口恢复正常时，再放行对于该接口的请求。
断路器的工作状态切换有一个状态机来控制：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/wechat_2025-05-20_223221_264.png)

状态机包括三个状态：
- `closed`：关闭状态，断路器放行所有请求，并开始统计异常比例、慢请求比例。超过阈值则切换到`open`状态
- `open`：打开状态，服务调用被熔断，访问被熔断服务的请求会被拒绝，快速失败，直接走降级逻辑。Open状态持续一段时间后会进入`half-open`状态
- `half-open`：半开状态，放行一次请求，根据执行结果来判断接下来的操作。
  - 请求成功：则切换到`closed`状态
  - 请求失败：则切换到`open`状态


  我们可以在控制台通过点击簇点后的`熔断`按钮来配置熔断策略：

  ![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-20_22-34-50.png)


这种是按照慢调用比例来做熔断，上述配置的含义是：
- RT超过200毫秒的请求调用就是慢调用
- 统计最近1000ms内的最少5次请求，如果慢调用比例不低于0.5，则触发熔断
- 熔断持续时长20s



## 分布式事务

在分布式系统中，如果一个业务需要多个服务合作完成，而且每一个服务都有事务，多个事务必须同时成功或失败，这样的事务就是**分布式事务**。其中的每个服务的事务就是一个**分支事务**。整个业务称为**全局事务**。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-21_20-22-10.png)


由于订单、购物车、商品分别在三个不同的微服务，而每个微服务都有自己独立的数据库，因此下单过程中就会跨多个数据库完成业务。而每个微服务都会执行自己的本地事务：
- 交易服务：下单事务
- 购物车服务：清理购物车事务
- 库存服务：扣减库存事务

整个业务中，各个本地事务是有关联的。因此每个微服务的本地事务，也可以称为分支事务。多个有关联的分支事务一起就组成了全局事务。我们必须保证整个全局事务同时成功或失败。

我们知道每一个分支事务就是传统的单体事务，都可以满足ACID特性，但全局事务跨越多个服务、多个数据库，是否还能满足呢？

事务并未遵循ACID的原则，归其原因就是参与事务的多个子业务在不同的微服务，跨越了不同的数据库。虽然每个单独的业务都能在本地遵循ACID，但是它们互相之间没有感知，不知道有人失败了，无法保证最终结果的统一，也就无法遵循ACID的事务特性了。
这就是分布式事务问题，出现以下情况之一就可能产生分布式事务问题：
- 业务跨多个服务实现
- 业务跨多个数据源实现


### 初识Seata

`Seata`是 2019 年 1 月份蚂蚁金服和阿里巴巴共同开源的分布式事务解决方案。致力于提供高性能和简单易用的分布式事务服务，为用户打造一站式的分布式解决方案。

官网地址：http://seata.io/   其中的文档、播客中提供了大量的使用说明、源码分析。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-21_20-36-08.png)


其实分布式事务产生的一个重要原因，就是参与事务的多个分支事务互相无感知，不知道彼此的执行状态。因此解决分布式事务的思想非常简单：

就是找一个统一的事务协调者，与多个分支事务通信，检测每个分支事务的执行状态，保证全局事务下的每一个分支事务同时成功或失败即可。大多数的分布式事务框架都是基于这个理论来实现的。

在Seata的事务管理中有三个重要的角色：
-  **TC (Transaction Coordinator) - 事务协调者**：维护全局和分支事务的状态，协调全局事务提交或回滚。
-  **TM (Transaction Manager) - 事务管理器**：定义全局事务的范围、开始全局事务、提交或回滚全局事务。
-  **RM (Resource Manager) - 资源管理器**：管理分支事务，与TC交谈以注册分支事务和报告分支事务的状态，并驱动分支事务提交或回滚。
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-21_20-38-01.png)

其中，TM和RM可以理解为Seata的客户端部分，引入到参与事务的微服务依赖中即可。将来TM和RM就会协助微服务，实现本地分支事务与TC之间交互，实现事务的提交或回滚。

而TC服务则是事务协调中心，是一个独立的微服务，需要单独部署。


### 部署TC服务


1. 执行sql文件 文件地址：[seata-tc](https://zzyang.oss-cn-hangzhou.aliyuncs.com/sql/seata-tc.sql)

会得到这样一个数据库和表⬇️
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-21_20-49-41.png)

2. 上传我们的`seata服务` 和 `seata镜像`

我们将整个seata文件夹拷贝到虚拟机的`/root`目录：

必须要确保我们的服务都在同一网络下

加载镜像
```Bash
docker load -i seata-1.5.2.tar
```

检查是否在同一网络下
```Bash
docker network ls

docker inspect nacos

docker inspect mysql

```


如果没在同一网络下执行该命令
```Bash
docker network connect hm-net nacos
```


执行docker命令
```Bash
docker run --name seata \
-p 8099:8099 \
-p 7099:7099 \
-e SEATA_IP=192.168.146.131 \
-v ./seata:/seata-server/resources \
--privileged=true \
--network hm-net \
-d \
seataio/seata-server:1.5.2
```

`SEATA_IP`参数的端口号换成自己的

:::tip
`7099`端口是web控制台

`8099`端口是给我们微服务连接使用的
:::

查看nacos的服务列表，即可看到Seata服务

访问该地址 http://192.168.146.131:7099/#/login   进入控制台

seata服务中的application.yaml中配置的账号密码是 `admin`

---

### 微服务集成Seata

为了方便各个微服务集成seata，我们需要把seata配置共享到nacos，因此trade-service模块不仅仅要引入seata依赖，还要引入nacos依赖:

1.引入依赖

只要是服务的参与者，必须都要引入该依赖
```xml
<!--统一配置管理-->
  <dependency>
      <groupId>com.alibaba.cloud</groupId>
      <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
  </dependency>
  <!--读取bootstrap文件-->
  <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-bootstrap</artifactId>
  </dependency>
  <!--seata-->
  <dependency>
      <groupId>com.alibaba.cloud</groupId>
      <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
  </dependency>
```

2.改造配置

首先在nacos上添加一个共享的seata配置，命名为`shared-seata.yaml`：

```yaml
seata:
  registry: # TC服务注册中心的配置，微服务根据这些信息去注册中心获取tc服务地址
    type: nacos # 注册中心类型 nacos
    nacos:
      server-addr: 192.168.150.101:8848 # nacos地址
      namespace: "" # namespace，默认为空
      group: DEFAULT_GROUP # 分组，默认是DEFAULT_GROUP
      application: seata-server # seata服务名称
      username: nacos
      password: nacos
  tx-service-group: hmall # 事务组名称
  service:
    vgroup-mapping: # 事务组与tc集群的映射关系
      hmall: "default"
```

然后，改造trade-service模块，添加`bootstrap.yaml`：

```yaml
spring:
  application:
    name: trade-service # 服务名称
  profiles:
    active: dev
  cloud:
    nacos:
      server-addr: 192.168.146.131 # nacos地址
      config:
        file-extension: yaml # 文件后缀名
        shared-configs: # 共享配置
          - dataId: shared-jdbc.yaml # 共享mybatis配置
          - dataId: shared-log.yaml # 共享日志配置
          - dataId: shared-swagger.yaml # 共享日志配置
          - dataId: shared-seata.yaml # 共享seata配置
```

可以看到这里加载了共享的seata配置。

然后改造application.yaml文件，内容如下：

```yaml
server:
  port: 8085
feign:
  okhttp:
    enabled: true # 开启OKHttp连接池支持
  sentinel:
    enabled: true # 开启Feign对Sentinel的整合
hm:
  swagger:
    title: 交易服务接口文档
    package: com.hmall.trade.controller
  db:
    database: hm-trade
```



查看seata日志，即可看到有哪些服务注册上来了
```log
13:41:25.411  INFO --- [ettyServerNIOWorker_1_1_2] i.s.c.r.processor.server.RegTmProcessor  : TM register success,message:RegisterTMRequest{applicationId='cart-service', transactionServiceGroup='hmall'},channel:[id: 0x5ab2a41f, L:/172.19.0.4:8099 - R:/192.168.146.1:62804],client version:1.5.2
13:41:27.848  INFO --- [rverHandlerThread_1_1_500] i.s.c.r.processor.server.RegRmProcessor  : RM register success,message:RegisterRMRequest{resourceIds='jdbc:mysql://192.168.146.131:3306/hm-cart', applicationId='cart-service', transactionServiceGroup='hmall'},channel:[id: 0xd6dae7c4, L:/172.19.0.4:8099 - R:/192.168.146.1:62830],client version:1.5.2
13:50:49.572  INFO --- [ettyServerNIOWorker_1_1_2] i.s.c.r.processor.server.RegTmProcessor  : TM register success,message:RegisterTMRequest{applicationId='item-service', transactionServiceGroup='hmall'},channel:[id: 0xf8d4148f, L:/172.19.0.4:8099 - R:/192.168.146.1:64349],client version:1.5.2
13:50:50.541  INFO --- [rverHandlerThread_1_2_500] i.s.c.r.processor.server.RegRmProcessor  : RM register success,message:RegisterRMRequest{resourceIds='jdbc:mysql://192.168.146.131:3306/hm-item', applicationId='item-service', transactionServiceGroup='hmall'},channel:[id: 0xa4b01da3, L:/172.19.0.4:8099 - R:/192.168.146.1:64355],client version:1.5.2
13:52:40.084  INFO --- [ettyServerNIOWorker_1_1_2] i.s.c.r.processor.server.RegTmProcessor  : TM register success,message:RegisterTMRequest{applicationId='trade-service', transactionServiceGroup='hmall'},channel:[id: 0xd939830d, L:/172.19.0.4:8099 - R:/192.168.146.1:64878],client version:1.5.2
13:52:42.143  INFO --- [rverHandlerThread_1_3_500] i.s.c.r.processor.server.RegRmProcessor  : RM register success,message:RegisterRMRequest{resourceIds='jdbc:mysql://192.168.146.131:3306/hm-trade', applicationId='trade-service', transactionServiceGroup='hmall'},channel:[id: 0x4d6e0e40, L:/172.19.0.4:8099 - R:/192.168.146.1:64888],client version:1.5.2
[root@localhost ~]#
```


### XA模式

XA 规范 是 X/Open 组织定义的分布式事务处理（DTP，Distributed Transaction Processing）标准，XA 规范 描述了全局的TM与局部的RM之间的接口，几乎所有主流的关系型数据库都对 XA 规范 提供了支持。Seata的XA模式如下：

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-21_22-11-38.png)

>一阶段的工作：
1. RM注册分支事务到TC
2. RM执行分支业务sql但不提交
3. RM报告执行状态到TC

>二阶段的工作：
- TC检测各分支事务执行状态
  - 如果都成功，通知所有RM提交事务
  - 如果有失败，通知所有RM回滚事务
- RM接收TC指令，提交或回滚事务

*总结*

XA模式的优点是什么?
- 事务的强一致性，满足ACID原则。
- 常用数据库都支持，实现简单，并且没有代码侵入

XA模式的缺点是什么?
- 因为一阶段需要锁定数据库资源，等待二阶段结束才释放，性能较差
- 依赖关系型数据库实现事务


#### 实现XA模式

Seata的starter已经完成了XA模式的自动装配，实现非常简单，步骤如下

1.修改application.yml文件(每个参与事务的微服务)，开启XA模式:

我们已经在nacos中配置了，所以直接去nacos中修改


```yaml
seata:
  data-source-proxy-mode: XA
```

完整的：
```yaml
seata:
  registry: # TC服务注册中心的配置，微服务根据这些信息去注册中心获取tc服务地址
    type: nacos # 注册中心类型 nacos
    nacos:
      server-addr: 192.168.146.131:8848 # nacos地址
      namespace: "" # namespace，默认为空
      group: DEFAULT_GROUP # 分组，默认是DEFAULT_GROUP
      application: seata-server # seata服务名称
      username: nacos
      password: nacos
  tx-service-group: hmall # 事务组名称
  service:
    vgroup-mapping: # 事务组与tc集群的映射关系
      hmall: "default"
  data-source-proxy-mode: XA
```

其次，我们要利用@GlobalTransactional标记分布式事务的入口方法：

```java
@Override
@GlobalTransactional
public Long createOrder(OrderFormDTO orderFormDTO) {



@Override
@Transactional
public void deductStock(List<OrderDetailDTO> items) {


@Override
@Transactional
public void removeByItemIds(Collection<Long> itemIds) {
```




### AT模式
Seata主推的是AT模式，AT模式同样是分阶段提交的事务模型，不过缺弥补了XA模型中资源锁定周期过长的缺陷。

流程图：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-05-22_20-06-29.png)



阶段一RM的工作：
- 注册分支事务
- 记录undo-log（数据快照）
- 执行业务sql并提交
- 报告事务状态

阶段二提交时RM的工作：
- 删除undo-log即可

阶段二回滚时RM的工作：
- 根据undo-log恢复数据到更新前

---

>简述AT模式与XA模式最大的区别是什么？

- XA模式一阶段不提交事务，锁定资源；AT模式一阶段直接提交，不锁定资源。
- XA模式依赖数据库机制实现回滚；AT模式利用数据快照实现数据回滚。
- XA模式强一致；AT模式最终一致

---

#### AT模式的使用

1. 在每个服务的数据库中，执行sql生成一张表
sql地址：[seata-at.sql](https://zzyang.oss-cn-hangzhou.aliyuncs.com/sql/seata-at.sql)


2. 在nacos中修改配置文件

```yaml
seata:
  data-source-proxy-mode: AT
```
这里默认不填即是AT模式


---

项目地址：[地址](https://gitee.com/zz_yang/hmall)

reference:[reference](https://gitee.com/huyi612/hmall)
